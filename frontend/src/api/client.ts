import { routes } from '@campusfind/contracts';
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly requestId?: string,
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
      headers: { 'Content-Type': 'application/json', 'X-CampusFind': 'web' },
      ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
    });
  } catch {
    throw new ApiError(0, 'API сервертэй холбогдож чадсангүй');
  }
  const result = await response.json();
  if (!response.ok)
    throw new ApiError(
      response.status,
      result.error?.message ?? 'Хүсэлт амжилтгүй',
      result.error?.requestId,
    );
  return route.output.parse(result.data) as T;
}
