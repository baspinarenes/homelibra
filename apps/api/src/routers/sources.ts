import { count, eq } from 'drizzle-orm';

import { source } from '../db/schema';
import { libraryProcedure, router } from '../trpc/init';

export const sourcesRouter = router({
  /** What Ana sayfa needs; while the Library is empty it shows "İlk kaynağını ekle". */
  home: libraryProcedure.query(async ({ ctx }) => {
    const [row] = await ctx.tx.select({ sourceCount: count() }).from(source).where(eq(source.accountId, ctx.accountId));
    return { sourceCount: row?.sourceCount ?? 0 };
  }),
});
