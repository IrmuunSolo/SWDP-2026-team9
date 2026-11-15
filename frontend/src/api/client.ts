import { routes } from '@campusfind/contracts';
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly requestId?: string,
    public readonly code?: string,
    public readonly details?: { path: (string | number)[]; message: string }[],
  ) {
    super(message);
  }
}
// All feature modules call this adapter; cookie is HttpOnly, never in localStorage.
export async function api<T>(
  id: string,
  options: {
    body?: unknown;
    params?: Record<string, string>;
    query?: Record<string, string | number>;
    signal?: AbortSignal;
  } = {},
): Promise<T> {
  const route = routes.find((r) => r.id === id);
  if (!route) throw new Error('API гэрээ олдсонгүй: ' + id);
  let path = route.path;
  for (const [key, value] of Object.entries(options.params ?? {}))
    path = path.replace('{' + key + '}', encodeURIComponent(value));
  if (path.includes('{')) throw new Error('API path parameter дутуу');
  const query = new URLSearchParams(
    Object.entries(options.query ?? {}).map(([k, v]) => [k, String(v)]),
  );
  let response: Response;
  try {
    response = await fetch('/api/v1' + path + (query.size ? '?' + query : ''), {
      method: route.method.toUpperCase(),
      credentials: 'include',
      signal: options.signal,
      headers: {
        ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        'X-CampusFind': 'web',
      },
      ...(options.body === undefined
        ? {}
        : { body: options.body instanceof FormData ? options.body : JSON.stringify(options.body) }),
    });
  } catch (error) {
    if (options.signal?.aborted) throw error;
    throw new ApiError(0, 'API сервертэй холбогдож чадсангүй');
  }
  if (response.status === 401 && id !== 'login' && id !== 'me')
    window.dispatchEvent(new Event('campusfind:session-expired'));
  // OpenAPI defines getPhoto as binary, unlike the reserved route.output metadata.
  if (response.ok && id === 'getPhoto') {
    const blob = await response.blob();
    if (!['image/jpeg', 'image/png'].includes(blob.type))
      throw new ApiError(response.status, 'Зургийн хариу тохирохгүй байна.');
    return blob as T;
  }
  let result;
  try {
    result = await response.json();
  } catch {
    throw new ApiError(response.status, 'Серверийн хариуг уншиж чадсангүй. Дахин оролдоно уу.');
  }
  if (!response.ok) {
    throw new ApiError(
      response.status,
      typeof result?.error?.message === 'string' ? result.error.message : 'Хүсэлт амжилтгүй',
      typeof result?.error?.requestId === 'string' ? result.error.requestId : undefined,
      typeof result?.error?.code === 'string' ? result.error.code : undefined,
      Array.isArray(result?.error?.details)
        ? result.error.details.filter(
            (d: { path?: unknown; message?: unknown }) =>
              Array.isArray(d?.path) && typeof d?.message === 'string',
          )
        : undefined,
    );
  }
  const parsed = route.output.safeParse(result?.data);
  if (!parsed.success)
    throw new ApiError(response.status, 'Серверийн хариу тохирохгүй байна. Дахин оролдоно уу.');
  return parsed.data as T;
}
