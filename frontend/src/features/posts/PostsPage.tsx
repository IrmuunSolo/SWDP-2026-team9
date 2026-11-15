import { useEffect, useState, useSyncExternalStore, type FormEvent } from 'react';
import {
  CATEGORIES,
  LOCATIONS,
  CATEGORY_LABELS,
  LOCATION_LABELS,
  type PostView,
} from '@campusfind/contracts';
import { api } from '../../api/client';
import { ErrorNotice } from '../auth/Feedback';
import { PostContent } from './shared/PostContent';
import { parseQuery, postError, queryParams, readQuery } from './shared/postUi';

type Page = { items: PostView[]; meta: { page: number; pageSize: number; total: number } };
function subscribeQuery(listener: () => void) {
  window.addEventListener('popstate', listener);
  return () => window.removeEventListener('popstate', listener);
}
const querySnapshot = () => window.location.search;
export function PostsPage() {
  const search = useSyncExternalStore(subscribeQuery, querySnapshot);
  const [data, setData] = useState<Page>();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  const parsed = parseQuery(search);
  const current = readQuery(search);
  const filtered = ['q', 'type', 'category', 'location', 'from', 'to'].some((k) => !!current[k]);
  useEffect(() => {
    let live = true;
    const controller = new AbortController();
    setData(undefined);
    setError('');
    setLoading(true);
    const result = parseQuery(search);
    if (!result.success) {
      setError(
        'Хайлтын холбоос буруу байна. Огнооны хүрээ, хуудас болон шүүлтүүрийг шалгаад дахин хайх эсвэл цэвэрлэнэ үү.',
      );
      setLoading(false);
      return;
    }
    void api<Page>('listPosts', { query: queryParams(result.data), signal: controller.signal })
      .then((page) => {
        if (live) setData(page);
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
  }, [search, retry]);
  function navigate(params: URLSearchParams) {
    const next = params.size ? `?${params}` : '';
    if (next === search) {
      setRetry((n) => n + 1);
      return;
    }
    window.history.pushState(null, '', `/posts${next}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }
  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    for (const [key, value] of new FormData(event.currentTarget)) {
      const text = String(value).trim();
      if (text) params.set(key, text);
    }
    // A submitted filter always starts on page one.
    navigate(params);
  }
  function changePage(page: number) {
    if (!parsed.success) return;
    const params = new URLSearchParams(
      Object.entries(queryParams({ ...parsed.data, page })).map(([k, v]) => [k, String(v)]),
    );
    navigate(params);
  }
  return (
    <section>
      <h1>Гээгдсэн ба олдсон эд зүйлс</h1>
      <p>Зараа нийтэлж, сургуулийн хүрээнд эд зүйлээ олоорой.</p>
      <div className="actions">
        <a href="/posts/new/lost">Гээгдсэн зүйл бүртгэх</a>
        <a href="/posts/new/found">Олдсон зүйл бүртгэх</a>
      </div>
      <form key={search} className="post-filters" onSubmit={apply}>
        <label className="search-keyword">
          Түлхүүр үг
          <input
            name="q"
            type="search"
            maxLength={120}
            defaultValue={current.q ?? ''}
            placeholder="Нэр, тайлбараас хайх"
          />
        </label>
        <label>
          Төрөл
          <select name="type" defaultValue={current.type ?? ''}>
            <option value="">Бүгд</option>
            <option value="LOST">Гээгдсэн</option>
            <option value="FOUND">Олдсон</option>
          </select>
        </label>
        <label>
          Ангилал
          <select name="category" defaultValue={current.category ?? ''}>
            <option value="">Бүгд</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Байршил
          <select name="location" defaultValue={current.location ?? ''}>
            <option value="">Бүгд</option>
            {LOCATIONS.map((c) => (
              <option key={c} value={c}>
                {LOCATION_LABELS[c]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Эхлэх огноо
          <input type="date" name="from" defaultValue={current.from ?? ''} />
        </label>
        <label>
          Дуусах огноо
          <input type="date" name="to" defaultValue={current.to ?? ''} />
        </label>
        <label>
          Хуудсанд
          <select name="pageSize" defaultValue={current.pageSize ?? '20'}>
            {[
              10,
              20,
              50,
              ...(![10, 20, 50].includes(Number(current.pageSize)) && parsed.success
                ? [parsed.data.pageSize]
                : []),
            ]
              .filter((v, i, a) => a.indexOf(v) === i)
              .map((n) => (
                <option key={n} value={n}>
                  {n} зар
                </option>
              ))}
          </select>
        </label>
        <div className="actions">
          <button>Хайх</button>
          <button
            type="button"
            className="secondary-button"
            onClick={() => navigate(new URLSearchParams())}
          >
            Шүүлтүүр цэвэрлэх
          </button>
        </div>
      </form>
      <div aria-live="polite" aria-busy={loading}>
        {loading && <p role="status">Заруудыг ачаалж байна…</p>}
        <ErrorNotice message={error} />
        {error && <button onClick={() => setRetry((n) => n + 1)}>Дахин оролдох</button>}
        {data && (
          <>
            <p role="status">
              Нийт {data.meta.total} зар · {data.meta.page}-р хуудас
            </p>
            {!data.items.length && (
              <p>
                {filtered
                  ? 'Хайлтад тохирох зар олдсонгүй. Шүүлтүүрээ өөрчлөөд үзээрэй.'
                  : data.meta.total
                    ? 'Энэ хуудсанд зар алга. Өмнөх хуудас руу шилжинэ үү.'
                    : 'Одоогоор зар алга. Эхний зарыг нийтлэх боломжтой.'}
              </p>
            )}
            <div className="posts">
              {data.items.map((post) => (
                <article key={post.id}>
                  <PostContent post={post} />
                </article>
              ))}
            </div>
            <nav aria-label="Зарын хуудас сонгох">
              <button
                className="secondary-button"
                disabled={data.meta.page <= 1}
                onClick={() => changePage(data.meta.page - 1)}
              >
                Өмнөх
              </button>
              <span>
                {data.meta.page} / {Math.max(1, Math.ceil(data.meta.total / data.meta.pageSize))}
              </span>
              <button
                className="secondary-button"
                disabled={data.meta.page * data.meta.pageSize >= data.meta.total}
                onClick={() => changePage(data.meta.page + 1)}
              >
                Дараах
              </button>
            </nav>
          </>
        )}
      </div>
    </section>
  );
}
