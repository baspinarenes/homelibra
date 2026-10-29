---
status: accepted
---

# A source's tags reach its notes only inside a collection, never by copying

A scholar often tags a whole source ("this fond is about the Armenian question") instead of each of its notes, and a collection can include every note of a source that carries one of its tags. We decided that a tag on a source is never written onto the source's notes: a note's own tags are only the ones put on it, and a collection set to include tagged sources works out at view time which sources carry its tags and adds their notes. The deciding reason is that removing a source's tag, or switching the option off in one collection, must take those notes out cleanly; copied tags would be indistinguishable from tags the scholar put on the note, so a mistaken source tag (a general survey tagged with a narrow topic) would leave hundreds of notes permanently mis-tagged.

## Considered options

- **Copy the source's tags onto its notes (rejected).** Collection queries become a plain "note carries tag" lookup, but un-tagging a source cannot tell inherited tags from the scholar's own, and the "include tagged sources" switch becomes meaningless per collection.
- **Copy with a provenance marker (rejected).** Keeps removal clean but duplicates state that has to be kept in step on every tag, untag, merge and new note of the source, for no gain the view-time union does not already give.
- **Union at view time (chosen).** A note is in a collection when it carries one of the collection's tags, or when the collection includes tagged sources and the note's source carries one; a note matching both ways appears once.

## Consequences

- A note's tag list, the "untagged notes" view of the organizing pass, and any export of a note's tags show only the tags put on the note itself. A note of a tagged source still counts as untagged there.
- The include-tagged-sources option belongs to each collection and is on by default, because capture is usually untagged and tagging the source is the fastest way to file a single-topic work.
