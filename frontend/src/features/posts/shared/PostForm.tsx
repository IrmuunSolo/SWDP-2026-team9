import { useState, type FormEvent } from 'react';
import { CATEGORIES, LOCATIONS, CATEGORY_LABELS, LOCATION_LABELS } from '@campusfind/contracts';
import { api } from '../../../api/client';
// Shared form: Irmuun owns this file; coordinate a separate PR for shared changes.
export function PostForm({ type }: { type: 'LOST' | 'FOUND' }) {
  const [method, setMethod] = useState('MEET'),
    [pending, setPending] = useState(false),
    [message, setMessage] = useState('');
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setPending(true);
    setMessage('');
    const body = {
      type,
      title: f.get('title'),
      description: f.get('description'),
      category: f.get('category'),
      location: f.get('location'),
      occurredOn: f.get('occurredOn'),
      ...(type === 'FOUND'
        ? {
            handoverMethod: method,
            ...(method === 'GUARD' ? { guardLocation: f.get('guardLocation') } : {}),
          }
        : {}),
    };
    try {
      await api('createPost', { body });
      window.location.assign('/posts');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Алдаа');
    } finally {
      setPending(false);
    }
  }
  return (
    <section>
      <h1>{type === 'LOST' ? 'Гээгдсэн' : 'Олдсон'} эд зүйл бүртгэх</h1>
      <form onSubmit={submit}>
        <label>
          Нэр
          <input name="title" maxLength={120} required />
        </label>
        <label>
          Тайлбар
          <textarea name="description" maxLength={3000} required />
        </label>
        <label>
          Ангилал
          <select name="category" aria-label="Ангилал">
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Байршил
          <select name="location" aria-label="Байршил">
            {LOCATIONS.map((c) => (
              <option key={c} value={c}>
                {LOCATION_LABELS[c]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Огноо
          <input
            type="date"
            name="occurredOn"
            max={new Date().toISOString().slice(0, 10)}
            required
          />
        </label>
        {type === 'FOUND' && (
          <>
            <label>
              Шилжүүлэх арга
              <select
                aria-label="Шилжүүлэх арга"
                value={method}
                onChange={(e) => setMethod(e.target.value)}
              >
                <option value="MEET">Эзэнтэй уулзах</option>
                <option value="GUARD">Жижүүрт өгсөн</option>
              </select>
            </label>
            {method === 'GUARD' && (
              <label>
                Жижүүрийн байр
                <select name="guardLocation" aria-label="Жижүүрийн байр" required>
                  {LOCATIONS.map((c) => (
                    <option key={c} value={c}>
                      {LOCATION_LABELS[c]}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </>
        )}
        <button disabled={pending}>{pending ? 'Хадгалж байна…' : 'Зар нийтлэх'}</button>
        <p role="status">{message}</p>
      </form>
    </section>
  );
}
