import type { Prisma } from '@prisma/client';
import type { ListQuery } from '@campusfind/contracts';
import { DataFeaturePendingError } from './errors';
// Amarbold, weeks 10–11: AND-composable, validated category/location/date predicates.
export function filtersWhere(query: ListQuery): Prisma.PostWhereInput {
  if (query.type || query.category || query.location || query.from || query.to)
    throw new DataFeaturePendingError('Шүүлтүүр');
  return {};
}
