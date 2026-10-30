// The messages of the API errors the app tells apart, beyond tRPC's own
// codes. Here, not in the API, so the app can compare against them without
// importing server code; the API throws with them.

/**
 * "Kaynak yok": the Source a Note is captured for or moved to is not in this
 * Library, deleted meanwhile perhaps. The outbox keeps such a Note waiting
 * as "Kaynağı silinmiş" until another Source is chosen (#36). Code NOT_FOUND.
 */
export const SOURCE_NOT_FOUND = 'SOURCE_NOT_FOUND';

/** Geri al: the token is unknown or outlived the server's few minutes. Code NOT_FOUND. */
export const UNDO_EXPIRED = 'UNDO_EXPIRED';

/**
 * Geri al: what the token's operation took cannot go back as it was, such as
 * a Note whose Source is gone too. Code CONFLICT.
 */
export const UNDO_CONFLICT = 'UNDO_CONFLICT';
