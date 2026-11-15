import { useEffect, useState } from 'react';
import { idSchema, type PostView } from '@campusfind/contracts';
import { api } from '../../api/client';
import { ErrorNotice } from '../auth/Feedback';
import { PostContent } from './shared/PostContent';
import { postError } from './shared/postUi';

export function PostDetailPage({ postId }: { postId: string }) {
  const [post, setPost] = useState<PostView>();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let live = true;
    const controller = new AbortController();
    setPost(undefined);
    setError('');
    setLoading(true);
    if (!idSchema.safeParse(postId).success) {
      setError('Зарын холбоос буруу байна.');
      setLoading(false);
      return;
    }
    void api<PostView>('getPost', { params: { postId }, signal: controller.signal })
      .then((data) => {
        if (live) setPost(data);
      })
      .catch((e) => {
        if (live) setError(postError(e));
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
      controller.abort();
    };
  }, [postId, retry]);
  return (
    <section>
      <a href="/posts">← Зарын жагсаалт</a>
      {loading && <p role="status">Зарыг ачаалж байна…</p>}
      <ErrorNotice message={error} />
      {error && <button onClick={() => setRetry((n) => n + 1)}>Дахин оролдох</button>}
      {post && (
        <article className="post-detail">
          <PostContent post={post} detail />
        </article>
      )}
    </section>
  );
}
