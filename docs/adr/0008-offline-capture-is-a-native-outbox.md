---
status: accepted
---

# Offline capture is a small outbox on the phone, not a sync engine

The MVP promises only that a note captured without a connection is sent later; it does not promise a full offline copy of the library. So the Android and iOS apps keep a small outbox table in `expo-sqlite`: a captured note gets its id on the device (UUIDv7), waits in the outbox, and is sent when the app comes to the foreground or the network returns. The server inserts it with `on conflict (id) do nothing`, so sending the same note twice is harmless. We chose this over PowerSync or WatermelonDB because a sync engine solves a problem we have ruled out of scope, and brings a second service, a source-available licence and a beta web adapter with it.

## Consequences

- The web app has no outbox and works online only. That also keeps SQLite (and the cross-origin isolation headers its web build needs) off the web entirely.
- Every table a captured note touches must accept client-generated ids.
- The outbox carries a note's edits, moves to another source and deletion as well as its creation, sent in the order they were made (Note ve Source silme, geri alma). Deleting a note that was never sent just drops it from the outbox. Deletion on the server is idempotent, and an edit that arrives for a deleted note is ignored. A note whose source was deleted elsewhere while it waited is not dropped: it stays on the phone, marked as having lost its source, until it is moved to another source or deleted. Nor is a note whose creation or edit the server refuses for good: it stays on the phone with its text, marked "gönderilemedi", holding back only its own operations, until it is edited (and sent again) or deleted. A refused move or deletion leaves the queue, since no text is lost.
- Signing out with notes still in the outbox warns first (the account ticket, Hesap, davet ve veri sahipliği).
- Full local-first sync stays in the map's fog. If it comes, it replaces this outbox rather than growing out of it.
