---
status: accepted
---

# Covers live in object storage and are deliberately not backed up

A source's cover is the first binary data in a library. We keep covers in a private Hetzner Object Storage bucket, reached only through our API, and leave them out of every backup. A cover only helps the scholar recognise a source; losing one costs a re-take, not research. So we would rather keep the database and its daily dump small and text-only than pay for a second copy of pictures. The bucket rides on the Object Storage we already pay for (ADR-0006), and Hetzner is already a listed provider (ADR-0009), so nothing new is added to cost or to the KVKK checklist.

## Considered options

- **PostgreSQL `bytea` in a separate table.** Backups, row-level security, account deletion and export would cover covers for free, but every daily dump would carry every picture for 14 days, and the database would grow with images rather than notes.
- **Object storage with its own backup or replication.** Safer, but a second copy to pay for, prune and keep within the 30-day deletion promise, for data that is replaceable.
- **The VPS disk.** Tied to one server, in neither the database dump nor durable storage.
- **Object storage, no backup (chosen).**

## Consequences

- The app uploads two JPEGs it has already resized (long edge 1000 px and 240 px) to the API, which checks them and writes them under the account's prefix with a fresh key. Covers are served through the API under the same session and library scope as everything else, cached as immutable because a replaced cover gets a new key. No signed URLs, no bucket CORS.
- A cover whose file is missing (a storage fault, a mistaken delete, or a database restored from an older dump) is forgotten and the source falls back to its type's template icon, without a warning. Library export skips it.
- Files leave the bucket only through one daily clean-up job: any cover no live source points at and older than 24 hours is deleted. That keeps undo for source deletion, cover removal and cover replacement working, and lets a deleted account's covers go on the run after its rows do. With no backups, the 30-day deletion promise holds for covers without further work.
- Covers from Open Library are kept, resized, in the same bucket under `isbn/` as part of the shared lookup cache (ADR-0006), keyed by ISBN-13. Accepting one copies it into the library as an ordinary cover. The clean-up job leaves `isbn/` alone.
- Covers are added online only; the offline outbox (ADR-0008) never carries them.
- Revisit if covers become something scholars would mind losing, or if a feature starts storing images that are research (a photo of a page), which would need backing up.
