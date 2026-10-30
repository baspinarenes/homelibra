import { deletionCutoff } from '@homelibra/core/account';
import { constantTimeEqual, generateRandomString } from 'better-auth/crypto';
import { and, eq, inArray, isNull, lte, or, sql } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';

import type { Db } from '../db/client';
import { account, invitation, session, verification } from '../db/schema';
import type { Mailer } from '../mail/mailer';

/** As long as a sign-in code lives (src/auth.ts). */
const CODE_LIFETIME_MS = 10 * 60 * 1000;
/** Wrong codes allowed before the code stops working, as for Better Auth's own codes. */
const ALLOWED_ATTEMPTS = 3;

function codeIdentifier(accountId: string) {
  return `account-deletion-${accountId}`;
}

/** Better Auth's email-OTP code types; each keeps its codes under `${type}-otp-${email}`. */
const otpTypes = ['sign-in', 'email-verification', 'forget-password', 'change-email'];

// Web Crypto rather than node:crypto: the app typechecks this file through AppRouter.
async function digest(code: string) {
  const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(code)));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Hesabı sil (#40, "Hesap silme"): a code to the Account's address confirms
 * it, the Account closes at once, and it can be reopened until the
 * scheduled job deletes it for good. The code waits in Better Auth's
 * verification table beside the sign-in codes, as a SHA-256 hash like
 * Better Auth's own `storeOTP: 'hashed'`: that keeps it out of plain sight,
 * not out of reach, since six digits are quickly tried.
 */
export function accountDeletion(db: Db) {
  return {
    /** A fresh code replaces any earlier one. */
    async sendCode(accountId: string, mailer: Mailer) {
      const owner = await db.query.account.findFirst({ where: eq(account.id, accountId) });
      if (!owner) return;
      const code = generateRandomString(6, '0-9');
      const identifier = codeIdentifier(accountId);
      await db.transaction(async (tx) => {
        await tx.delete(verification).where(eq(verification.identifier, identifier));
        await tx.insert(verification).values({
          id: uuidv7(),
          identifier,
          value: `${await digest(code)}:0`,
          expiresAt: new Date(Date.now() + CODE_LIFETIME_MS),
        });
      });
      await mailer.sendAccountDeletionCode(owner.email, code);
    },

    /**
     * Closes the Account and signs it out everywhere when the code is right.
     * Returns false for a wrong, used-up or expired code. Closing an Account
     * that is already closed keeps the first moment.
     */
    async close(accountId: string, code: string) {
      const identifier = codeIdentifier(accountId);
      const given = await digest(code);
      return db.transaction(async (tx) => {
        const [row] = await tx.select().from(verification).where(eq(verification.identifier, identifier)).for('update');
        if (!row) return false;
        const [stored = '', attempts = '0'] = row.value.split(':');
        const matches = constantTimeEqual(stored, given);
        if (row.expiresAt <= new Date() || (!matches && Number(attempts) + 1 >= ALLOWED_ATTEMPTS)) {
          await tx.delete(verification).where(eq(verification.identifier, identifier));
          return false;
        }
        if (!matches) {
          await tx
            .update(verification)
            .set({ value: `${stored}:${Number(attempts) + 1}` })
            .where(eq(verification.identifier, identifier));
          return false;
        }
        await tx.delete(verification).where(eq(verification.identifier, identifier));
        await tx
          .update(account)
          .set({ deletionRequestedAt: new Date() })
          .where(and(eq(account.id, accountId), isNull(account.deletionRequestedAt)));
        await tx.delete(session).where(eq(session.accountId, accountId));
        return true;
      });
    },

    /** "Silmeyi iptal et": the Library opens again exactly as it was. */
    async cancel(accountId: string) {
      await db.update(account).set({ deletionRequestedAt: null }).where(eq(account.id, accountId));
    },
  };
}

/**
 * The scheduled job: every Account closed 14 days ago or more goes for good,
 * and with it its whole Library (every Library row cascades from the
 * Account), its sign-in methods and sessions, its Invitation and any code
 * still waiting for its address. Daily backups keep a copy 14 days longer,
 * so a deletion is complete within KVKK's 30 days (m.13). Covers, once they
 * exist, are left to their own clean-up job (ADR-0011). Each Account goes in its own
 * transaction, so one failure holds up no other. Returns how many went.
 */
export async function deleteClosedAccounts(db: Db, now: Date) {
  const due = lte(account.deletionRequestedAt, deletionCutoff(now));
  const closed = await db.select({ id: account.id, email: account.email }).from(account).where(due);
  let deleted = 0;
  for (const { id, email } of closed) {
    await db.transaction(async (tx) => {
      // Checked again under the lock: the scholar may have cancelled meanwhile.
      const [gone] = await tx
        .delete(account)
        .where(and(eq(account.id, id), due))
        .returning({ id: account.id });
      if (!gone) return;
      await tx.delete(invitation).where(eq(invitation.email, email));
      // Only identifiers that are exactly this Account's, never another
      // address that merely contains this one.
      const identifiers = [codeIdentifier(id), ...otpTypes.map((type) => `${type}-otp-${email}`)];
      const changingFrom = `change-email-otp-${email}-`;
      await tx
        .delete(verification)
        .where(
          or(
            inArray(verification.identifier, identifiers),
            sql`left(${verification.identifier}, ${changingFrom.length}) = ${changingFrom}`,
          ),
        );
      deleted++;
    });
  }
  return deleted;
}
