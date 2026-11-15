import { CATEGORY_LABELS, LOCATION_LABELS, type PostView } from '@campusfind/contracts';

export function PostContent({ post, detail = false }: { post: PostView; detail?: boolean }) {
  return (
    <>
      <span>
        {post.type === 'LOST' ? 'Гээгдсэн' : 'Олдсон'} · {CATEGORY_LABELS[post.category]}
      </span>
      {detail ? (
        <h1>{post.title}</h1>
      ) : (
        <h2>
          <a href={`/posts/${post.id}`}>{post.title}</a>
        </h2>
      )}
      <p className="post-description">{post.description}</p>
      <p>
        {LOCATION_LABELS[post.location]} · <time dateTime={post.occurredOn}>{post.occurredOn}</time>
      </p>
      <small>
        {post.author.displayName} · {post.author.studentCodeMasked}
      </small>
      {post.type === 'FOUND' && (
        <p>
          {post.handoverMethod === 'GUARD'
            ? `Жижүүрт өгсөн: ${post.guardLocation ? LOCATION_LABELS[post.guardLocation] : ''}`
            : 'Эзэнтэй биечлэн уулзана'}
        </p>
      )}
      {detail && <p className="muted">Зураг харах боломж хараахан бэлэн болоогүй байна.</p>}
    </>
  );
}
