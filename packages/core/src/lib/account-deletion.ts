const DAY_MS = 24 * 60 * 60 * 1000;

/** How long a closed Account can still be reopened before it is deleted for good (#40, "Hesap silme"). */
export const deletionGraceDays = 14;

/** When an Account closed at `requestedAt` is deleted, unless the scholar cancels before then. */
export function deletionDueAt(requestedAt: Date) {
  return new Date(requestedAt.getTime() + deletionGraceDays * DAY_MS);
}

/** Accounts closed at or before this moment are due for deletion at `now`. */
export function deletionCutoff(now: Date) {
  return new Date(now.getTime() - deletionGraceDays * DAY_MS);
}
