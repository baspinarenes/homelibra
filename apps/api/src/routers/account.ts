import { TRPCError } from '@trpc/server';
import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';

import { accountDeletion } from '../account-deletion/account-deletion';
import { account } from '../db/schema';
import { accountProcedure, router } from '../trpc/init';

/** The app's Hesabı sil screen says the code is wrong or has expired. */
const INVALID_CODE = 'INVALID_CODE';

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

  /** Hesabı sil, after the Library export reminder: a code goes to the Account's address. */
  requestDeletion: accountProcedure.mutation(async ({ ctx }) => {
    await accountDeletion(ctx.db).sendCode(ctx.accountId, ctx.mailer);
  }),

  /** The code from that email closes the Account at once and signs it out on every device. */
  confirmDeletion: accountProcedure
    .input(
      z.object({
        code: z
          .string()
          .trim()
          .regex(/^\d{6}$/),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!(await accountDeletion(ctx.db).close(ctx.accountId, input.code))) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: INVALID_CODE });
      }
    }),

  /** "Silmeyi iptal et", for a closed Account that signs in again before it is deleted. */
  cancelDeletion: accountProcedure.mutation(async ({ ctx }) => {
    await accountDeletion(ctx.db).cancel(ctx.accountId);
  }),
});
