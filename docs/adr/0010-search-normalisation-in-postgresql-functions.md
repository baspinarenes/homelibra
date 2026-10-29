---
status: accepted
---

# Search normalisation runs in PostgreSQL functions, with corrected Snowball stems

The search contract (ADR-0005) needs stemming to run on Turkish-lowercased text before folding, but a PostgreSQL text search configuration cannot run a filter after its stemmer. So the whole pipeline lives in SQL functions in our own image (ADR-0006, ADR-0007): Turkish lowercasing (I → ı, İ → i), then the built-in `turkish_stem` on text that has lost its transcription marks but still has ç ğ ı ö ş ü, then the contract's folding. The same functions build each note's `tsvector` (a generated column) and parse each query, so the normalisation exists in one place and the API passes only the raw query text. The setup passes the contract's scenario table on PostgreSQL 17.11 (baspinarenes/homelibra#28, prototype on the `prototype/tr-search` branch).

## Shape

- One `tsvector` holds every word three times at the same position: raw (lowercased, unfolded, so an exact spelling ranks first within the exact tier), folded (exact and 3+ letter prefix matches) and a stem set. A stem match means the stem sets of the query word and the note's word intersect.
- Snowball's Turkish output is corrected by three rules, not by a word list. A single -m/-n after a vowel is not a suffix (kadın is not kadı, nor are ferman and İslam truncated). A stem that is not the start of the word is dropped, apart from final-consonant softening (Snowball adds a vowel after d: kadim → kadı, Mehmed → mehmedi). Vowel drop is undone (vakfı → vakıf, hükmü → hüküm). The part before an apostrophe also counts as a stem, because Turkish spelling uses the apostrophe to separate a proper noun from its suffixes (Mehmed'in → Mehmet).
- A hyphenated compound is indexed by its parts and by its joined form, which is placed at both the first and the last part's position. The compound is then found from either side, and phrase search still works next to it.
- Within-word substring matching on Source fields uses `pg_trgm` on a folded copy of the text.

## Considered options

- **`unaccent` then `turkish_stem` in a text search configuration.** Stock and simple, but the stemmer sees folded text and fails on sancağı, vakfı and kadın (`docs/research/turkish-search-scenario-battery.md`).
- **Normalising in TypeScript in the API.** It would put the folding rules in two places, because the tsvector still has to be built in the database or kept in sync on every write.
- **A custom C dictionary or a Hunspell dictionary.** Possible in our own image, but heavier to build and maintain. PostgreSQL's ispell support also cannot stack suffixes the way Turkish needs.
- **SQL functions over the built-in stemmer (chosen).** No files in `$SHAREDIR` and no extension beyond `unaccent` and `pg_trgm`.

## Consequences

- Row 4 of the contract's scenario table (ulema → "ulemanın görüşü") moved from the prefix tier to the stem tier, by Enes's decision. It has the same shape as row 26 (gitmiş → gitmişti, stem tier): in both, the query word is the stem of the note's word, and Snowball over-trims the query word itself. No setup ranks both rows as the table first said.
- The rules add stem candidates nobody will type (ulema → ulem, Osmanlılar → osmanil) and a few real collisions (aşkı → aşık, doğru → doğur). This is the noise ADR-0005 accepts.
- The folding function wraps `unaccent`, which is STABLE, and is marked IMMUTABLE so that it can feed a generated column. Changing the `unaccent` rules means reindexing.
- The scenario table runs as an automated test against our `postgres:17` image. It runs again on every PostgreSQL upgrade, because both the stemmer and lowercasing can change.
