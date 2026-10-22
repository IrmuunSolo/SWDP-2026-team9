import { useEffect, useRef, useState, type FormEvent, type InputHTMLAttributes } from 'react';
import { loginSchema, registerSchema, verifySchema } from '@campusfind/contracts';
import { api, ApiError } from '../../api/client';
import { authError, ErrorNotice } from './Feedback';

type Field = 'displayName' | 'studentCode' | 'email' | 'password' | 'passwordConfirm';
const hints: Record<Field, string> = {
  displayName: 'Нэрээ 2–80 тэмдэгтээр оруулна уу.',
  studentCode: 'Оюутны код нэг том латин үсэг, 9 цифртэй байна. Жишээ: B232270021.',
  email: 'Зөв и-мэйл хаяг оруулна уу.',
  password: 'Нууц үг 12–128 тэмдэгттэй байна.',
  passwordConfirm: 'Давтан оруулсан нууц үг таарахгүй байна.',
};

export function AuthPage({ register = false }: { register?: boolean }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [requestId, setRequestId] = useState<string>();
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [registered, setRegistered] = useState(false);
  const submitting = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const title = register ? 'Бүртгүүлэх' : 'Нэвтрэх';

  useEffect(() => {
    if (pending) return;
    const first = Object.keys(errors)[0];
    if (!first) return;
    const element = formRef.current?.elements.namedItem(first);
    if (element instanceof HTMLElement) element.focus();
  }, [errors, pending]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const element = event.currentTarget;
    const form = new FormData(element);
    const body = register
      ? {
          displayName: form.get('displayName'),
          studentCode: form.get('studentCode'),
          email: form.get('email'),
          password: form.get('password'),
        }
      : { email: form.get('email'), password: form.get('password') };
    const parsed = (register ? registerSchema : loginSchema).safeParse(body);
    const fields: Partial<Record<Field, string>> = {};
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as Field;
        fields[key] =
          key === 'password' && !register
            ? 'Нууц үгээ оруулна уу (128 хүртэл тэмдэгт).'
            : hints[key];
      }
    }
    if (register && form.get('password') !== form.get('passwordConfirm'))
      fields.passwordConfirm = hints.passwordConfirm;
    setError('');
    setRequestId(undefined);
    setErrors(fields);
    if (Object.keys(fields).length) {
      return;
    }
    if (!parsed.success) return;
    submitting.current = true;
    setPending(true);
    try {
      await api(register ? 'register' : 'login', { body: parsed.data });
      if (!register) window.location.assign('/posts');
      else {
        element.reset();
        setRegistered(true);
      }
    } catch (e) {
      setError(authError(e));
      if (e instanceof ApiError) {
        setRequestId(e.requestId);
        if (e.code === 'UNIVERSITY_EMAIL_REQUIRED') {
          const fields = { email: 'Сургуулийн и-мэйл хаягаа ашиглана уу.' };
          setErrors(fields);
        }
      }
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  function field(name: Field, label: string, props: InputHTMLAttributes<HTMLInputElement>) {
    return (
      <div className="form-field">
        <label htmlFor={name}>{label}</label>
        <input
          id={name}
          name={name}
          required
          aria-invalid={!!errors[name]}
          aria-describedby={
            errors[name] ? `${name}-error` : name === 'studentCode' ? 'studentCode-hint' : undefined
          }
          {...props}
        />
        {name === 'studentCode' && (
          <small id="studentCode-hint">Нэг том латин үсэг + 9 цифр. Жишээ: B232270021</small>
        )}
        {errors[name] && (
          <span id={`${name}-error`} className="field-error">
            {errors[name]}
          </span>
        )}
      </div>
    );
  }

  return (
    <section className="auth-layout" aria-labelledby="auth-title">
      <aside className="auth-intro">
        <span className="eyebrow">СУРГУУЛИЙН ХАМТ ОЛОНД</span>
        <h2>
          Гээсэн зүйлээ.
          <br />
          Хамтдаа олъё.
        </h2>
        <p>
          Гээгдсэн, олдсон эд зүйлсийг нэг дор. Баталгаажсан сургуулийн бүртгэлээр мэдээллээ
          хуваалцаарай.
        </p>
        <ol className="auth-steps">
          <li>
            <span>01</span> Сургуулийн и-мэйлээр бүртгүүлэх
          </li>
          <li>
            <span>02</span> И-мэйлээ баталгаажуулах
          </li>
          <li>
            <span>03</span> Нэвтэрч зар харах, нийтлэх
          </li>
        </ol>
      </aside>
      <div className="auth-card">
        <span className="eyebrow">CAMPUSFIND · БАГ 9</span>
        <h1 id="auth-title">{registered ? 'И-мэйлээ шалгаарай' : title}</h1>
        {registered ? (
          <div className="auth-success">
            <div className="notice notice-success" role="status">
              Баталгаажуулах холбоос авах хүсэлтийг хүлээн авлаа.
            </div>
            <p>
              Шаардлага хангасан бүртгэлд и-мэйл илгээнэ. Ирсэн захиа болон spam хавтсаа шалгаад
              холбоосоор бүртгэлээ баталгаажуулна уу.
            </p>
            <p>
              Холбоос 24 цаг хүчинтэй, нэг удаа ашиглагдана. Захиа ирээгүй бол хаягаа шалгаж, ижил
              и-мэйл болон нууц үгээр дахин хүсэлт илгээнэ үү.
            </p>
            <a className="button-link" href="/login">
              Нэвтрэх хуудас руу
            </a>
            <button type="button" className="text-button" onClick={() => setRegistered(false)}>
              Бүртгэлийн форм руу буцах
            </button>
          </div>
        ) : (
          <>
            <p className="muted">
              {register
                ? 'Сургуулийн и-мэйл болон оюутны кодоор бүртгэлээ үүсгэнэ үү.'
                : 'Баталгаажсан бүртгэлээрээ үргэлжлүүлнэ үү.'}
            </p>
            {!register &&
              new URLSearchParams(window.location.search).get('reason') === 'session-expired' && (
                <p className="notice" role="status">
                  Нэвтрэх хугацаа дууссан байна. Дахин нэвтэрнэ үү.
                </p>
              )}
            <ErrorNotice message={error} requestId={requestId} />
            <form ref={formRef} onSubmit={submit} noValidate aria-busy={pending}>
              <fieldset disabled={pending}>
                {register && (
                  <>
                    {field('displayName', 'Нэр', { autoComplete: 'name', maxLength: 80 })}
                    {field('studentCode', 'Оюутны код', {
                      autoComplete: 'off',
                      maxLength: 10,
                      placeholder: 'B232270021',
                      spellCheck: false,
                    })}
                  </>
                )}
                {field('email', 'Сургуулийн и-мэйл', {
                  type: 'email',
                  autoComplete: 'email',
                  maxLength: 254,
                  spellCheck: false,
                  autoCapitalize: 'none',
                })}
                <div className="form-field">
                  <label htmlFor="password">Нууц үг</label>
                  <div className="password-input">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete={register ? 'new-password' : 'current-password'}
                      maxLength={128}
                      required
                      aria-invalid={!!errors.password}
                      aria-describedby="password-hint password-error"
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      aria-label={showPassword ? 'Нууц үг нуух' : 'Нууц үг харуулах'}
                      aria-pressed={showPassword}
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? 'Нуух' : 'Харах'}
                    </button>
                  </div>
                  <small id="password-hint">
                    {register
                      ? '12–128 тэмдэгт. Бусад бүртгэлд ашиглаагүй нууц үг сонгоорой.'
                      : 'Бүртгүүлэхдээ ашигласан нууц үгээ оруулна уу.'}
                  </small>
                  <span id="password-error" className="field-error">
                    {errors.password}
                  </span>
                </div>
                {register &&
                  field('passwordConfirm', 'Нууц үг давтах', {
                    type: showPassword ? 'text' : 'password',
                    autoComplete: 'new-password',
                    maxLength: 128,
                  })}
                <button className="primary-button" type="submit">
                  {pending ? 'Түр хүлээнэ үү…' : title}
                </button>
              </fieldset>
              <span className="sr-only" role="status">
                {pending ? 'Хүсэлт илгээж байна.' : ''}
              </span>
            </form>
            <p className="auth-switch">
              {register ? 'Бүртгэлтэй юу? ' : 'Шинэ хэрэглэгч үү? '}
              <a href={register ? '/login' : '/register'}>
                {register ? 'Нэвтрэх' : 'Бүртгэл үүсгэх'}
              </a>
            </p>
          </>
        )}
      </div>
    </section>
  );
}

export function VerifyPage() {
  const [token, setToken] = useState(() => window.location.hash.slice(1));
  const valid = verifySchema.safeParse({ token }).success;
  const [error, setError] = useState('');
  const [requestId, setRequestId] = useState<string>();
  const [pending, setPending] = useState(false);
  const [verified, setVerified] = useState(false);
  const submitting = useRef(false);
  const requestVersion = useRef(0);
  useEffect(() => {
    function updateToken() {
      requestVersion.current += 1;
      submitting.current = false;
      setToken(window.location.hash.slice(1));
      setPending(false);
      setVerified(false);
      setError('');
      setRequestId(undefined);
    }
    window.addEventListener('hashchange', updateToken);
    return () => window.removeEventListener('hashchange', updateToken);
  }, []);
  async function verify() {
    if (!valid || submitting.current || verified) return;
    submitting.current = true;
    const version = ++requestVersion.current;
    setPending(true);
    setError('');
    setRequestId(undefined);
    try {
      await api('verifyEmail', { body: { token } });
      if (version !== requestVersion.current) return;
      window.history.replaceState(null, '', '/verify-email');
      setVerified(true);
    } catch (e) {
      if (version !== requestVersion.current) return;
      setError(authError(e));
      if (e instanceof ApiError) setRequestId(e.requestId);
    } finally {
      if (version === requestVersion.current) {
        submitting.current = false;
        setPending(false);
      }
    }
  }
  return (
    <section className="auth-card verify-card" aria-labelledby="verify-title">
      <span className="eyebrow">БҮРТГЭЛИЙН БАТАЛГААЖУУЛАЛТ</span>
      <h1 id="verify-title">{verified ? 'И-мэйл баталгаажлаа' : 'И-мэйл баталгаажуулах'}</h1>
      {verified ? (
        <p className="notice notice-success" role="status">
          Бүртгэлээ баталгаажууллаа. Одоо нэвтэрч болно.
        </p>
      ) : (
        <>
          <p>
            {valid
              ? 'Бүртгэлээ баталгаажуулахын тулд доорх товчийг дарна уу.'
              : 'Баталгаажуулах холбоос дутуу эсвэл буруу байна. И-мэйлд ирсэн холбоосыг бүтнээр нь нээнэ үү.'}
          </p>
          <ErrorNotice message={error} requestId={requestId} />
          <button className="primary-button" disabled={pending || !valid} onClick={verify}>
            {pending ? 'Баталгаажуулж байна…' : 'Баталгаажуулах'}
          </button>
          <p className="muted">
            Холбоос 24 цаг хүчинтэй. Хугацаа дууссан эсвэл захиа ирээгүй бол ижил бүртгэлийн
            мэдээллээр дахин хүсэлт илгээнэ үү.
          </p>
        </>
      )}
      <div className="actions">
        <a href="/login">Нэвтрэх</a>
        {!verified && <a href="/register">Бүртгэлийн хүсэлт</a>}
      </div>
    </section>
  );
}
