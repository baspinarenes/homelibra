import { and, eq } from 'drizzle-orm';

import { source } from '../db/schema';

/** The Source with this id, when it is in this Library: the filter every query on one Source uses. */
export const mySource = (accountId: string, id: string) => and(eq(source.id, id), eq(source.accountId, accountId));
