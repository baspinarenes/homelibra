---
status: accepted
---

# Search favours recall: folded, stemmed and prefix matches, ranked by exactness

Scholars write notes in Turkish mixed with Ottoman transcription, so the same word reaches the library as ʿulemâ and ulema, Mehmed and Mehmet, IRAK and ırak, kitâb and kitap. A search in Homelibra therefore folds both the text and the query to one form: case, İ/I/ı/i to i, ş ğ ç ö ü and circumflexes to plain letters, transcription letters (ḳ ḥ ṣ ṭ ā ī ū …) to their base letters, a word-final b or d to p or t, and ayn, hemze and apostrophes are deleted without splitting the word. Each query word then matches a word of a note if it is the same folded word, has the same stem, or (at three letters or more) is the start of it, and results are ranked in that order. The deciding reason is that a note the scholar cannot find is a note they will never know they missed, while a false hit costs a glance.

## Considered options

- **Precise matching.** Only the typed form and its inflections. No noise, but a note captured as "ʿulemâ" or "Mehmed" is invisible to a search for "ulema" or "Mehmet".
- **Precise by default, tolerant behind a switch.** Leaves the scholar to guess when to flip it, and the default still loses notes silently.
- **Recall first, exactness in the ranking (chosen).** Every plausible match is returned; an exact folded word ranks above a stem match, which ranks above a prefix match. Quoted words are the escape hatch for exact search: adjacent, unstemmed, no prefix, still folded.

## Consequences

- Known noise is accepted, not patched: kır finds kir, kadı finds kadın and kadîm, ad finds at. There is no stemming exception list and no synonym or variant dictionary; ranking and quotes are the only defence.
- A tag's identity deliberately does not follow this: tag names stay distinct on ı/i and circumflex (ADR-0003's ticket, Tag ve Collection semantiği), because a tag is a name the scholar chose, whereas search is about not losing anything. Only the tag picker's suggestions fold.
- Stemming has to run on Turkish-lowercased text before folding. The obvious PostgreSQL chain (`unaccent` then `turkish_stem`) stems the folded text and breaks Turkish inflection (sancağı, vakfı, kadın) — measured in `docs/research/turkish-search-scenario-battery.md`. Finding an engine setup that passes the contract's scenario table is baspinarenes/homelibra#28.
- Verb inflections are not unified (gitti does not find gitmişti); scholars search mostly by nouns.
- Search runs on the server only; there is no offline search.
