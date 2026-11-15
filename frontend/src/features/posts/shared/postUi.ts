import { createPostSchema, listQuerySchema, type ListQuery } from '@campusfind/contracts';
import { ApiError } from '../../../api/client';

export function localToday(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function validatePost(body: unknown) {
  const result = createPostSchema.safeParse(body);
  const errors: Record<string, string> = {};
  if (!result.success) {
    // Select the matching union branch so errors point to individual fields.
    const issues = result.error.issues.flatMap((issue) =>
      issue.code === 'invalid_union'
        ? (issue.unionErrors.find((error) => !error.issues.some((i) => i.path[0] === 'type'))
            ?.issues ?? [issue])
        : [issue],
    );
    for (const issue of issues)
      errors[String(issue.path[0] ?? 'form')] =
        issue.path[0] === 'guardLocation'
          ? 'Жижүүрийн байрыг сонгоно уу.'
          : 'Энэ талбарыг зөв бөглөнө үү.';
  } else if (result.data.occurredOn > localToday())
    errors.occurredOn = 'Ирээдүйн огноо оруулахгүй.';
  return { result, errors };
}

export const filterKeys = [
  'q',
  'type',
  'category',
  'location',
  'from',
  'to',
  'page',
  'pageSize',
] as const;
export function readQuery(search: string) {
  const params = new URLSearchParams(search);
  return Object.fromEntries(
    filterKeys.flatMap((key) => {
      const value = params.get(key)?.trim();
      return value ? [[key, value]] : [];
    }),
  );
}
export function parseQuery(search: string) {
  return listQuerySchema.safeParse(readQuery(search));
}
export function queryParams(query: ListQuery) {
  return Object.fromEntries(
    Object.entries(query).filter(
      ([key, value]) =>
        value !== '' &&
        value !== undefined &&
        !(key === 'page' && value === 1) &&
        !(key === 'pageSize' && value === 20),
    ),
  ) as Record<string, string | number>;
}
export function postError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 501)
      return 'Энэ боломжийн сервер тал хараахан хэрэгжээгүй (501). Дараа дахин оролдоно уу.';
    if (error.status === 401) return 'Нэвтрэлтийн хугацаа дууссан. Дахин нэвтэрнэ үү.';
    if (error.status === 403)
      return 'Энэ үйлдлийг хийх эрхгүй эсвэл хүсэлтийн хамгаалалт татгалзлаа. Бүртгэл болон холболтоо шалгана уу.';
    if (error.status === 404)
      return 'Зар эсвэл зураг олдсонгүй, эсвэл танд харагдах боломжгүй байна.';
    if (error.status === 0)
      return 'Сүлжээний холболт амжилтгүй. Холболтоо шалгаад дахин оролдоно уу.';
    if (error.status >= 500) return 'Сервер түр ажиллахгүй байна. Дахин оролдоно уу.';
  }
  return error instanceof Error ? error.message : 'Алдаа гарлаа. Дахин оролдоно уу.';
}

export function photoSelectionError(
  files: readonly Pick<File, 'type' | 'size'>[],
  existing: number,
) {
  if (files.length + existing > 3) return 'Нийт 3 хүртэл зураг сонгоно уу.';
  if (files.some((file) => !['image/jpeg', 'image/png'].includes(file.type)))
    return 'Зөвхөн JPG/PNG зураг сонгоно уу.';
  if (files.some((file) => file.size >= 5 * 1024 * 1024))
    return 'Зураг тус бүр 5 MB-аас бага байна.';
  return '';
}
