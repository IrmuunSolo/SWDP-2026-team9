import { Body, Controller, Get, Inject, Param, Post, Query, Req } from '@nestjs/common';
import { createPostSchema, idSchema, listQuerySchema } from '@campusfind/contracts';
import { parse } from '../../common/http';
import type { AuthRequest } from '../../common/session';
import { PostsService } from './posts.service';
@Controller('posts')
export class PostsController {
  constructor(@Inject(PostsService) private readonly posts: PostsService) {}
  @Post() async create(@Req() req: AuthRequest, @Body() body: unknown) {
    return { data: await this.posts.create(req.user.id, parse(createPostSchema, body)) };
  }
  @Get() async list(@Query() query: unknown) {
    return { data: await this.posts.list(parse(listQuerySchema, query)) };
  }
  @Get(':postId') async get(@Param('postId') id: string, @Req() req: AuthRequest) {
    return { data: await this.posts.get(parse(idSchema, id), req.user.id) };
  }
}
