import { useState, type FormEvent } from 'react';
import { api } from '../../api/client';
export function AuthPage({ register = false }: { register?: boolean }) {
  const [pending, setPending] = useState(false),
    [message, setMessage] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setMessage('');
    const body = register
      ? {
          displayName: form.get('displayName'),
          studentCode: form.get('studentCode'),
          email: form.get('email'),
          password: form.get('password'),
        }
      : { email: form.get('email'), password: form.get('password') };
    try {
      await api(register ? 'register' : 'login', { body });
      if (!register) window.location.assign('/');
      else
        setMessage('Баталгаажуулах холбоосоо и-мэйлээс шалгана уу. Локал орчинд Mailpit ашиглана.');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Алдаа');
    } finally {
      setPending(false);
    }
  }
  return (
    <section>
      <h1>{register ? 'Бүртгүүлэх' : 'Нэвтрэх'}</h1>
      <form onSubmit={submit}>
        {register && (
          <>
            <label>
              Нэр
              <input name="displayName" autoComplete="name" minLength={2} maxLength={80} required />
            </label>
            <label>
              Оюутны код
              <input name="studentCode" placeholder="B232270021" pattern="[A-Z][0-9]{9}" required />
            </label>
          </>
        )}
        <label>
          Сургуулийн и-мэйл
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <label>
          Нууц үг
          <input
            name="password"
            type="password"
            autoComplete={register ? 'new-password' : 'current-password'}
            minLength={register ? 12 : 1}
            maxLength={128}
            required
          />
        </label>
        <button disabled={pending}>
          {pending ? 'Түр хүлээнэ үү…' : register ? 'Бүртгүүлэх' : 'Нэвтрэх'}
        </button>
        <p role="status">{message}</p>
      </form>
    </section>
  );
}
export function VerifyPage() {
  const [token] = useState(() => window.location.hash.slice(1)),
    [message, setMessage] = useState(''),
    [pending, setPending] = useState(false);
  async function verify() {
    setPending(true);
    try {
      await api('verifyEmail', { body: { token } });
      window.history.replaceState(null, '', '/verify-email');
      setMessage('Баталгаажлаа. Одоо нэвтэрч болно.');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Алдаа');
    } finally {
      setPending(false);
    }
  }
  return (
    <section>
      <h1>И-мэйл баталгаажуулах</h1>
      <p>Бүртгэлийг баталгаажуулахын тулд товчийг дарна уу.</p>
      <button disabled={pending || !token || message.startsWith('Баталгаажлаа')} onClick={verify}>
        Баталгаажуулах
      </button>
      <p role="status">{message}</p>
      <a href="/login">Нэвтрэх</a>
    </section>
  );
}
