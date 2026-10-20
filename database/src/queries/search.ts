import type { Prisma } from '@prisma/client';
import { DataFeaturePendingError } from './errors';
// Amarbold, weeks 10–11: implement indexed full-text query/ranking here.
// If full-text needs $queryRaw, add a parameterized repository method in this package;
// agree its return type/pagination with backend before replacing this predicate seam.
export function searchWhere(q: string | undefined): Prisma.PostWhereInput {
  if (q) throw new DataFeaturePendingError('Түлхүүр үгийн хайлт');
  return {};
}
