import { useEffect, useState } from 'react';
import type { PublicUser } from '@campusfind/contracts';
import { api } from './api/client';
import { AuthPage, VerifyPage } from './features/auth/AuthPage';
import { PostsPage } from './features/posts/PostsPage';
import { LostPostPage } from './features/posts/lost/LostPostPage';
import { FoundPostPage } from './features/posts/found/FoundPostPage';
export function App() {
  const [user, setUser] = useState<PublicUser | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState('');
  useEffect(() => {
    let live = true;
    void api<PublicUser>('me')
      .then((u) => {
        if (live) setUser(u);
      })
      .catch((e) => {
        if (live && e.status !== 401) setError(e.message);
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, []);
  const path = window.location.pathname;
  let page;
  if (path === '/register') page = <AuthPage register />;
  else if (path === '/login') page = <AuthPage />;
  else if (path === '/verify-email') page = <VerifyPage />;
  else if (loading) page = <p>Ачаалж байна…</p>;
  else if (!user)
    page = (
      <section>
        <h1>CampusFind</h1>
        <p>Зар харах, нийтлэхийн тулд баталгаажсан бүртгэлээр нэвтэрнэ үү.</p>
        <a href="/login">Нэвтрэх</a>
        <p role="alert">{error}</p>
      </section>
    );
  else if (path === '/posts/new/lost') page = <LostPostPage />;
  else if (path === '/posts/new/found') page = <FoundPostPage />;
  else if (path === '/') page = <PostsPage />;
  else
    page = (
      <section>
        <h1>Хуудас олдсонгүй</h1>
        <a href="/">Нүүр хуудас</a>
      </section>
    );
  async function logout() {
    try {
      await api('logout');
      window.location.assign('/login');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Алдаа');
    }
  }
  return (
    <>
      <header>
        <a className="brand" href="/">
          CampusFind
        </a>
        <nav aria-label="Үндсэн цэс">
          {user ? (
            <>
              <span>{user.displayName}</span>
              <button onClick={logout}>Гарах</button>
            </>
          ) : (
            <>
              <a href="/login">Нэвтрэх</a>
              <a href="/register">Бүртгүүлэх</a>
            </>
          )}
        </nav>
      </header>
      <main>
        {page}
        {user && error && <p role="alert">{error}</p>}
      </main>
      <footer>Баг 9 · Сургуулийн гээгдсэн эд зүйл олох систем</footer>
    </>
  );
}
