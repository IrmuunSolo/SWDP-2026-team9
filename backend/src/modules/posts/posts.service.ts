import { Inject, Injectable } from '@nestjs/common';
import { DbService } from '../../db/db.module';
import type { CreatePost, ListQuery } from '@campusfind/contracts';
import type { Post, User } from '@campusfind/database';
import { publicUser } from '../auth/auth.service';
import { fail } from '../../common/http';
import { validateLostPost } from './lost/lost.rules';
import { validateFoundPost } from './found/found.rules';
import { searchWhere, filtersWhere, DataFeaturePendingError } from '@campusfind/database';
export const postView = (p: Post & { author: User }) => ({
  id: p.id,
  author: publicUser(p.author),
  type: p.type,
  status: p.status,
  title: p.title,
  description: p.description,
  category: p.category,
  location: p.location,
  occurredOn: p.occurredOn.toISOString().slice(0, 10),
  handoverMethod: p.handoverMethod,
  guardLocation: p.guardLocation,
  createdAt: p.createdAt.toISOString(),
});
@Injectable()
export class PostsService {
  constructor(@Inject(DbService) private readonly db: DbService) {}
  async create(authorId: string, input: CreatePost) {
    const value = input.type === 'LOST' ? validateLostPost(input) : validateFoundPost(input);
    if (value.occurredOn > new Date().toISOString().slice(0, 10))
      fail(400, 'FUTURE_DATE', 'Ирээдүйн огноо оруулахгүй');
    const post = await this.db.post.create({
      data: { authorId, ...value, occurredOn: new Date(`${value.occurredOn}T00:00:00.000Z`) },
      include: { author: true },
    });
    return postView(post);
  }
  async list(query: ListQuery) {
    let predicates;
    try {
      predicates = [searchWhere(query.q), filtersWhere(query)];
    } catch (error) {
      if (error instanceof DataFeaturePendingError) fail(501, 'NOT_IMPLEMENTED', error.message);
      throw error;
    }
    const where = {
      AND: [{ status: 'ACTIVE' as const, author: { blockedAt: null } }, ...predicates],
    };
    const [posts, total] = await this.db.$transaction([
      this.db.post.findMany({
        where,
        include: { author: true },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.db.post.count({ where }),
    ]);
    return {
      items: posts.map(postView),
      meta: { page: query.page, pageSize: query.pageSize, total },
    };
  }
  async get(id: string, actorId: string) {
    const post = await this.db.post.findUnique({ where: { id }, include: { author: true } });
    if (
      !post ||
      post.status === 'HIDDEN' ||
      post.author.blockedAt ||
      (post.status === 'CLOSED' && post.authorId !== actorId)
    )
      fail(404, 'POST_NOT_FOUND', 'Зар олдсонгүй');
    return postView(post);
  }
}
