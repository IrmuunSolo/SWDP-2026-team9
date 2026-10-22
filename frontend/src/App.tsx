import { useEffect, useRef, useState } from 'react';
import type { PublicUser } from '@campusfind/contracts';
import { api, ApiError } from './api/client';
import { AuthPage, VerifyPage } from './features/auth/AuthPage';
import { authError, ErrorNotice } from './features/auth/Feedback';
import { PostsPage } from './features/posts/PostsPage';
import { LostPostPage } from './features/posts/lost/LostPostPage';
import { FoundPostPage } from './features/posts/found/FoundPostPage';

export function App() {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [loggingOut, setLoggingOut] = useState(false);
  const logoutPending = useRef(false);
  const path = window.location.pathname;
  const authPath = path === '/login' || path === '/register';
  const publicPath = authPath || path === '/verify-email';
  const knownPath = [
    '/',
    '/login',
    '/register',
    '/verify-email',
    '/posts/new/lost',
    '/posts/new/found',
  ].includes(path);

  useEffect(() => {
    let live = true;
    setLoading(true);
    setError('');
    void api<PublicUser>('me')
      .then((u) => {
        if (live) setUser(u);
      })
      .catch((e) => {
        if (!live) return;
        setUser(null);
        if (!(e instanceof ApiError && e.status === 401)) setError(authError(e));
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [retry]);

  useEffect(() => {
    if (!loading && user && authPath) window.location.replace('/');
  }, [loading, user, authPath]);

  useEffect(() => {
    function expired() {
      window.location.replace('/login?reason=session-expired');
    }
    window.addEventListener('campusfind:session-expired', expired);
    return () => window.removeEventListener('campusfind:session-expired', expired);
  }, []);

  useEffect(() => {
    const title =
      path === '/register'
        ? 'Бүртгүүлэх'
        : path === '/login'
          ? 'Нэвтрэх'
          : path === '/verify-email'
            ? 'И-мэйл баталгаажуулах'
            : 'Гээгдсэн ба олдсон эд зүйлс';
    document.title = `${title} · CampusFind`;
  }, [path]);

  let page;
  if (!knownPath)
    page = (
      <section className="state-card">
        <h1>Хуудас олдсонгүй</h1>
        <a href="/">Нүүр хуудас руу</a>
      </section>
    );
  else if ((authPath && loading) || (authPath && user))
    page = <p role="status">Бүртгэлийг шалгаж байна…</p>;
  else if (path === '/register') page = <AuthPage register />;
  else if (path === '/login') page = <AuthPage />;
  else if (path === '/verify-email') page = <VerifyPage />;
  else if (loading) page = <p role="status">Бүртгэлийг шалгаж байна…</p>;
  else if (!user && error)
    page = (
      <section className="state-card">
        <h1>Холболтыг шалгана уу</h1>
        <ErrorNotice message={error} />
        <button onClick={() => setRetry((n) => n + 1)}>Дахин оролдох</button>
        <p>
          <a href="/login">Нэвтрэх хуудас руу</a>
        </p>
      </section>
    );
  else if (!user)
    page = (
      <section className="welcome state-card">
        <span className="eyebrow">ГЭЭГДСЭН БОЛОН ОЛДСОН ЭД ЗҮЙЛС</span>
        <h1>
          Сургуулийн хүрээнд.
          <br />
          Хамтдаа олъё.
        </h1>
        <p>Зар харах, нийтлэхийн тулд сургуулийн и-мэйлээр баталгаажсан бүртгэлээр нэвтэрнэ үү.</p>
        <div className="actions">
          <a className="button-link" href="/login">
            Нэвтрэх
          </a>
          <a href="/register">Бүртгэл үүсгэх</a>
        </div>
      </section>
    );
  else if (path === '/posts/new/lost') page = <LostPostPage />;
  else if (path === '/posts/new/found') page = <FoundPostPage />;
  else page = <PostsPage />;

  async function logout() {
    if (logoutPending.current) return;
    logoutPending.current = true;
    setLoggingOut(true);
    setError('');
    try {
      await api('logout');
      window.location.replace('/login');
    } catch (e) {
      setError(authError(e));
      logoutPending.current = false;
      setLoggingOut(false);
    }
  }

  return (
    <>
      <a className="skip-link" href="#main-content">
        Үндсэн агуулга руу
      </a>
      <header className="site-header">
        <a className="brand" href="/" aria-label="CampusFind нүүр хуудас">
          <span className="brand-mark" aria-hidden="true">
            C.
          </span>
          CampusFind
        </a>
        <nav aria-label="Үндсэн цэс">
          {loading ? (
            <span className="muted">Түр хүлээнэ үү…</span>
          ) : user ? (
            <>
              <a href="/" aria-current={path === '/' ? 'page' : undefined}>
                Зарууд
              </a>
              <div className="user-summary">
                <strong>{user.displayName}</strong>
                <small>{user.studentCodeMasked}</small>
              </div>
              <button className="secondary-button" disabled={loggingOut} onClick={logout}>
                {loggingOut ? 'Гарч байна…' : 'Гарах'}
              </button>
            </>
          ) : (
            <>
              <a href="/login" aria-current={path === '/login' ? 'page' : undefined}>
                Нэвтрэх
              </a>
              <a
                className="button-link"
                href="/register"
                aria-current={path === '/register' ? 'page' : undefined}
              >
                Бүртгүүлэх
              </a>
            </>
          )}
        </nav>
      </header>
      <main id="main-content" tabIndex={-1}>
        {user && error && !publicPath && <ErrorNotice message={error} />}
        {page}
      </main>
      <footer className="site-footer">
        <strong>CampusFind</strong>
        <span>Баг 9 · Сургуулийн гээгдсэн, олдсон эд зүйлс</span>
      </footer>
    </>
  );
}
