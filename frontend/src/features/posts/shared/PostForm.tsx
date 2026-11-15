import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  CATEGORIES,
  LOCATIONS,
  CATEGORY_LABELS,
  LOCATION_LABELS,
  type PostView,
} from '@campusfind/contracts';
import { api, ApiError } from '../../../api/client';
import { ErrorNotice } from '../../auth/Feedback';
import { localToday, photoSelectionError, postError, validatePost } from './postUi';
import { UploadedPhoto } from './UploadedPhoto';

type Selection = { key: string; file: File; preview: string; photoId?: string; error?: string };
export function PostForm({ type }: { type: 'LOST' | 'FOUND' }) {
  const [method, setMethod] = useState('MEET');
  const [pending, setPending] = useState(false);
  const locked = useRef(false);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [created, setCreated] = useState<PostView>();
  const createdRef = useRef<PostView | undefined>(undefined);
  const [photos, setPhotos] = useState<Selection[]>([]);
  const selections = useRef<Selection[]>([]);
  const successNotice = useRef<HTMLDivElement>(null);
  const [fileError, setFileError] = useState('');
  useEffect(
    () => () => {
      selections.current.forEach((p) => URL.revokeObjectURL(p.preview));
    },
    [],
  );
  useEffect(() => {
    if (created && !pending) successNotice.current?.focus();
  }, [created, pending]);
  function updatePhotos(next: Selection[]) {
    selections.current = next;
    setPhotos(next);
  }
  function selectPhotos(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    const error = photoSelectionError(files, selections.current.length);
    setFileError(error);
    if (error) return;
    updatePhotos([
      ...selections.current,
      ...files.map((file) => ({
        key: crypto.randomUUID(),
        file,
        preview: URL.createObjectURL(file),
      })),
    ]);
  }
  function removePhoto(key: string) {
    const photo = selections.current.find((p) => p.key === key);
    if (!photo || photo.photoId || locked.current) return;
    URL.revokeObjectURL(photo.preview);
    updatePhotos(selections.current.filter((p) => p.key !== key));
    setFileError('');
  }
  async function upload(postId: string) {
    for (const selection of selections.current) {
      if (selection.photoId) continue;
      const body = new FormData();
      body.append('file', selection.file);
      try {
        const photo = await api<{ id: string }>('uploadPhoto', { params: { postId }, body });
        updatePhotos(
          selections.current.map((p) =>
            p.key === selection.key ? { ...p, photoId: photo.id, error: undefined } : p,
          ),
        );
      } catch (error) {
        updatePhotos(
          selections.current.map((p) =>
            p.key === selection.key ? { ...p, error: postError(error) } : p,
          ),
        );
        if (error instanceof ApiError && [401, 403, 501].includes(error.status)) break;
      }
    }
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked.current) return;
    const f = new FormData(event.currentTarget);
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
    if (!createdRef.current) {
      const { result, errors: fields } = validatePost(body);
      setErrors(fields);
      if (!result.success || Object.keys(fields).length) {
        requestAnimationFrame(() =>
          document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
        );
        return;
      }
      locked.current = true;
      setPending(true);
      setMessage('');
      try {
        const post = await api<PostView>('createPost', { body: result.data });
        createdRef.current = post;
        setCreated(post);
      } catch (error) {
        setMessage(postError(error));
        if (error instanceof ApiError) {
          const fields: Record<string, string> = {};
          for (const detail of error.details ?? [])
            fields[String(detail.path[0])] = 'Оруулсан утгыг шалгана уу.';
          if (error.code === 'FUTURE_DATE')
            fields.occurredOn = 'Сервер огноог ирээдүй гэж үзлээ. Огноогоо шалгана уу.';
          setErrors(fields);
        }
        locked.current = false;
        setPending(false);
        return;
      }
    } else {
      locked.current = true;
      setPending(true);
      setMessage('');
    }
    try {
      await upload(createdRef.current!.id);
    } finally {
      locked.current = false;
      setPending(false);
    }
  }
  const unfinished = photos.filter((p) => !p.photoId).length;
  function fieldError(name: string) {
    return (
      <span id={`${name}-error`} className="field-error">
        {errors[name]}
      </span>
    );
  }
  function attrs(name: string) {
    return { name, 'aria-invalid': !!errors[name], 'aria-describedby': `${name}-error` };
  }
  return (
    <section>
      <a href="/posts">← Зарын жагсаалт</a>
      <h1>{type === 'LOST' ? 'Гээгдсэн' : 'Олдсон'} эд зүйл бүртгэх</h1>
      <p>Хувийн код, нууц мэдээллийг тайлбар болон зурагт бүү оруулаарай.</p>
      <form className="post-form" noValidate onSubmit={submit} aria-busy={pending}>
        <fieldset disabled={pending || !!created}>
          <legend className="sr-only">Зарын мэдээлэл</legend>
          <label>
            Нэр
            <input {...attrs('title')} maxLength={120} required />
            {fieldError('title')}
          </label>
          <label>
            Тайлбар
            <textarea {...attrs('description')} maxLength={3000} required />
            {fieldError('description')}
          </label>
          <label>
            Ангилал
            <select {...attrs('category')}>
              <option value="">Сонгох</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
            {fieldError('category')}
          </label>
          <label>
            Байршил
            <select {...attrs('location')}>
              <option value="">Сонгох</option>
              {LOCATIONS.map((c) => (
                <option key={c} value={c}>
                  {LOCATION_LABELS[c]}
                </option>
              ))}
            </select>
            {fieldError('location')}
          </label>
          <label>
            Болсон огноо
            <input type="date" {...attrs('occurredOn')} max={localToday()} required />
            {fieldError('occurredOn')}
          </label>
          {type === 'FOUND' && (
            <>
              <label>
                Шилжүүлэх арга
                <select value={method} onChange={(e) => setMethod(e.target.value)}>
                  <option value="MEET">Эзэнтэй уулзах</option>
                  <option value="GUARD">Жижүүрт өгсөн</option>
                </select>
              </label>
              {method === 'GUARD' && (
                <label>
                  Жижүүрийн байр
                  <select {...attrs('guardLocation')} required>
                    <option value="">Сонгох</option>
                    {LOCATIONS.map((c) => (
                      <option key={c} value={c}>
                        {LOCATION_LABELS[c]}
                      </option>
                    ))}
                  </select>
                  {fieldError('guardLocation')}
                </label>
              )}
            </>
          )}
        </fieldset>
        {!created && (
          <label>
            Зураг (заавал биш)
            <input
              type="file"
              accept="image/jpeg,image/png"
              multiple
              disabled={pending}
              onChange={selectPhotos}
              aria-describedby="photo-help photo-error"
            />
          </label>
        )}
        <small id="photo-help">
          JPG/PNG · тус бүр 5 MB-аас бага · нийт 3 хүртэл. Зураг илгээх сервер тал одоогоор
          төлөвлөгдсөн.
        </small>
        {fileError && (
          <p id="photo-error" role="alert" className="field-error">
            {fileError}
          </p>
        )}
        <div className="photo-grid">
          {photos.map((p) => (
            <div className="photo-item" key={p.key}>
              {p.photoId ? (
                <UploadedPhoto photoId={p.photoId} />
              ) : (
                <img
                  src={p.preview}
                  alt={`Сонгосон зураг: ${p.file.name}`}
                  onError={(e) => {
                    e.currentTarget.hidden = true;
                    setFileError(
                      'Зургийн preview-г уншиж чадсангүй. Зургийг хасаад өөр файл сонгоно уу.',
                    );
                  }}
                />
              )}
              <span>{p.file.name}</span>
              {p.photoId ? (
                <small>Илгээгдсэн</small>
              ) : (
                <button
                  type="button"
                  className="secondary-button"
                  disabled={pending}
                  onClick={() => removePhoto(p.key)}
                  aria-label={`${p.file.name} зургийг хасах`}
                >
                  Хасах
                </button>
              )}
              {p.error && (
                <p role="alert" className="field-error">
                  {p.error}
                </p>
              )}
            </div>
          ))}
        </div>
        <ErrorNotice message={message} />
        {created && (
          <div className="notice notice-success" role="status" tabIndex={-1} ref={successNotice}>
            <p>
              {pending
                ? 'Зар нийтлэгдсэн. Зургийг илгээж байна…'
                : unfinished
                  ? 'Зар нийтлэгдсэн, зураг бүрэн илгээгдээгүй. Дахин илгээхэд зар давхар үүсэхгүй.'
                  : 'Зар амжилттай нийтлэгдлээ.'}
            </p>
            <a href={`/posts/${created.id}`}>Нийтэлсэн зарыг харах →</a>
            {unfinished > 0 && (
              <p>Энэ хуудсыг хаавал илгээгээгүй зургийн сонголт хадгалагдахгүй.</p>
            )}
          </div>
        )}
        {(!created || unfinished > 0) && (
          <button disabled={pending}>
            {pending
              ? 'Хадгалж байна…'
              : created
                ? 'Илгээгдээгүй зургийг дахин илгээх'
                : message
                  ? 'Дахин нийтлэх'
                  : 'Зар нийтлэх'}
          </button>
        )}
        {pending && <p role="status">Хүсэлтийг боловсруулж байна…</p>}
      </form>
    </section>
  );
}
