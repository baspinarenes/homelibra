---
status: accepted
---

# Search runs in PostgreSQL, with no separate search engine

Search (ADR-0005) runs inside the same PostgreSQL that holds the library, using its full-text search with our own Turkish configuration, rather than in Meilisearch, Typesense or OpenSearch. PostgreSQL has a Turkish stemmer, keeps search in the same transaction as the data so a captured note is findable at once, filters by library and tag in the same query, and adds no service to run or keep in sync; because we host the database ourselves (ADR-0006), its image can carry whatever dictionary files and extensions the search contract needs.

## Considered options

- **Typesense or Meilisearch.** Instant search with typo tolerance out of the box, but a second service, an index to keep in sync with every write, and neither handles Turkish stemming and Ottoman transcription the way the contract requires without the same custom work.
- **OpenSearch or Elasticsearch.** The best stock Turkish analyser, but a JVM cluster is out of proportion for a few hundred scholars.
- **On-device SQLite FTS5.** No Turkish stemming, and the web build of SQLite ships without FTS.
- **PostgreSQL full-text search (chosen).**

## Consequences

- There is no offline search; search needs the server on every platform.
- The database runs our own image derived from `postgres:17` with a libc `en_US.UTF-8` locale, `unaccent` and `pg_trgm`, plus the SQL functions that implement the search contract (ADR-0010); no extra dictionary files or extensions. Upgrading PostgreSQL means re-running that contract's scenario table, because lowercasing and locale behaviour change between major versions.
- Typo tolerance is not offered. If scholars ask for search-as-you-type with typo tolerance, Typesense is the first candidate to add beside PostgreSQL, not to replace it.
