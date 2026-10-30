import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';

import { account } from '../db/schema';
import { accountProcedure, router } from '../trpc/init';

export const accountRouter = router({
  /**
   * The first-sign-in screen's "Kullanım koşullarını kabul ediyorum". Asked
   * once per Account: a later call keeps the first moment and version.
   * Not a consent (rıza): the privacy notice itself needs no approval
   * (docs/research/kvkk-obligations.md).
   */
  acceptTerms: accountProcedure
    .input(z.object({ version: z.string().trim().min(1).max(64) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(account)
        .set({ termsAcceptedAt: new Date(), termsVersion: input.version })
        .where(and(eq(account.id, ctx.accountId), isNull(account.termsAcceptedAt)));
    }),
});
