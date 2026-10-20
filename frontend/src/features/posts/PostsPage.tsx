import { useEffect, useState } from 'react';
import { LOCATION_LABELS, type PostView } from '@campusfind/contracts';
import { api } from '../../api/client';
export function PostsPage() {
  const [posts, setPosts] = useState<PostView[]>([]),
    [message, setMessage] = useState('Ачаалж байна…');
  useEffect(() => {
    let live = true;
    void api<{ items: PostView[] }>('listPosts')
      .then((result) => {
        if (live) {
          setPosts(result.items);
          setMessage(result.items.length ? '' : 'Одоогоор зар алга.');
        }
      })
      .catch((e) => {
        if (live) setMessage(e.message);
      });
    return () => {
      live = false;
    };
  }, []);
  return (
    <section>
      <h1>Гээгдсэн ба олдсон эд зүйлс</h1>
      <p>Зараа нийтэлж, сургуулийн хүрээнд эд зүйлээ олоорой.</p>
      <div className="actions">
        <a href="/posts/new/lost">Гээгдсэн зүйл бүртгэх</a>
        <a href="/posts/new/found">Олдсон зүйл бүртгэх</a>
      </div>
      <p role="status">{message}</p>
      <div className="posts">
        {posts.map((post) => (
          <article key={post.id}>
            <span>{post.type === 'LOST' ? 'Гээгдсэн' : 'Олдсон'}</span>
            <h2>{post.title}</h2>
            <p>{post.description}</p>
            <p>
              {LOCATION_LABELS[post.location]} · {post.occurredOn}
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
          </article>
        ))}
      </div>
    </section>
  );
}
