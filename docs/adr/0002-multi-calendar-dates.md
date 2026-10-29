---
status: accepted
---

# Dates are kept in the source's own calendar and ordered by an approximate Gregorian value

Historians cite Ottoman sources in the calendar the source itself uses: most archive documents are dated Hicrî ("29 Z 1310"), late-Ottoman civil records and newspapers Rumî, modern works Milâdî, and often only the year or the month is known. A date in Homelibra is therefore a calendar (Milâdî by default, Hicrî or Rumî) plus a year, an optional month and an optional day, stored and shown exactly as the scholar entered it. For ordering, the app derives an approximate Gregorian value from each date; that value is never displayed as the date and never copied into a citation. The deciding reasons are that a Gregorian-only field would force a conversion at capture time and lose the form the citation needs, while a free-text field would make sources unsortable.

## Considered options

- **Free text.** No modelling cost and any notation accepted, but nothing can be ordered by date. Rejected by the author explicitly.
- **Gregorian only.** Simple to store and sort, but every Hicrî or Rumî date would have to be converted by hand while reading, conversions would drift from the cited form, and partial dates would be forced into false precision.
- **Original calendar with partial precision plus a derived sort value (chosen).** Fidelity to the source, ordering that works to the precision the scholar knows, and conversion kept as an invisible implementation detail.

## Consequences

- The conversion is approximate by design: an arithmetic Hicrî calendar (about a day of drift) and the Rumî rules (Julian offset, 1 March new year, the 1917 reform). It is good enough to order sources, never to state a date. The research ticket on Hicrî and Rumî conversion (baspinarenes/homelibra#17) pins the exact rules and the library.
- Date ranges and the Ottoman decade markers (evâil, evâsıt, evâhir) are not modelled; such a date is entered to month precision and the detail goes into the bibliographic note.
- Only a source carries a date; a note does not. Documents in a fond kept as one source order by document reference, not by date; a scholar who wants chronological order makes each document its own source.
- Every date field in the app, such as a book's first edition date, uses this same type. A new field that needs a date reuses it rather than adding a plain year or a timestamp.
- Metadata auto-fill (DOI, ISBN) writes Milâdî dates; the scholar can change the calendar afterwards.
