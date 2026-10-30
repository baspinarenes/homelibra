import { asc, eq } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';

import type { Db } from '../db/client';
import { account, invitation } from '../db/schema';

/**
 * Addresses are compared the way Better Auth stores them: trimmed and
 * lower-cased without a locale. The Turkish rule would store KADI@ as kadı@,
 * which Better Auth's kadi@ never matches.
 */
export function normalizeEmail(email: string) {
  // eslint-disable-next-line no-restricted-syntax -- must match Better Auth's own toLowerCase()
  return email.trim().toLowerCase();
}

/**
 * Invitations for the closed beta. Only the Operator grants or withdraws
 * them (src/invite.ts); sign-in checks one before an address may open an
 * Account. Withdrawing an Invitation does not close the Account it opened;
 * deleting that Account deletes the Invitation too (a later ticket).
 */
export function invitations(db: Db) {
  async function isInvited(email: string) {
    const row = await db.query.invitation.findFirst({ where: eq(invitation.email, normalizeEmail(email)) });
    return row !== undefined;
  }

  async function hasAccount(email: string) {
    const row = await db.query.account.findFirst({ where: eq(account.email, normalizeEmail(email)) });
    return row !== undefined;
  }

  return {
    /** Returns false when the address was already invited. */
    async add(email: string) {
      const rows = await db
        .insert(invitation)
        .values({ id: uuidv7(), email: normalizeEmail(email) })
        .onConflictDoNothing({ target: invitation.email })
        .returning({ id: invitation.id });
      return rows.length > 0;
    },

    /** Takes the address off the list; an Account it already opened stays open. */
    async remove(email: string) {
      const rows = await db
        .delete(invitation)
        .where(eq(invitation.email, normalizeEmail(email)))
        .returning({ id: invitation.id });
      return { wasInvited: rows.length > 0, accountStaysOpen: await hasAccount(email) };
    },

    list() {
      return db
        .select({ email: invitation.email, createdAt: invitation.createdAt })
        .from(invitation)
        .orderBy(asc(invitation.createdAt));
    },

    /** Only an Invitation opens a new Account. */
    isInvited,

    /** A sign-in code goes to an invited address or one that already has an Account. */
    async mayRequestCode(email: string) {
      return (await hasAccount(email)) || (await isInvited(email));
    },
  };
}
