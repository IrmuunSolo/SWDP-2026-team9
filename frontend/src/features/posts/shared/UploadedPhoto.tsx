import { useEffect, useState } from 'react';
import { api } from '../../../api/client';
import { postError } from './postUi';

export function UploadedPhoto({ photoId }: { photoId: string }) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let live = true;
    let objectUrl = '';
    const controller = new AbortController();
    setUrl('');
    setError('');
    void api<Blob>('getPhoto', { params: { photoId }, signal: controller.signal })
      .then((blob) => {
        if (live) {
          objectUrl = URL.createObjectURL(blob);
          setUrl(objectUrl);
        }
      })
      .catch((e) => {
        if (live) setError(postError(e));
      });
    return () => {
      live = false;
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [photoId, retry]);
  return (
    <>
      {url && !error && (
        <img
          src={url}
          alt="Нийтэлсэн эд зүйлийн зураг"
          onError={() => setError('Зургийг харуулж чадсангүй.')}
        />
      )}
      {!url && !error && <p role="status">Зураг ачаалж байна…</p>}
      {error && (
        <div>
          <p role="alert">{error}</p>
          <button type="button" onClick={() => setRetry((n) => n + 1)}>
            Зургийг дахин ачаалах
          </button>
        </div>
      )}
    </>
  );
}
