/**
 * A Tag's name as it is shown: the spelling the scholar entered, without a
 * leading # and with its spaces trimmed and squeezed to one (#3). Empty when
 * nothing else was written.
 */
export function tagName(raw: string): string {
  return raw.normalize('NFC').trim().replace(/^#+/, '').trim().replace(/\s+/g, ' ');
}

/**
 * What makes two names one Tag in a Library (#3): the name lowered by
 * Turkish rules (I → ı, İ → i). Circumflexes, dotted versus dotless i and
 * punctuation still tell Tags apart: "âlem" and "alem" are two.
 */
export function tagIdentity(raw: string): string {
  return tagName(raw).toLocaleLowerCase('tr');
}

/**
 * What the Tag picker matches by (#3): the identity with circumflexes,
 * dotless ı, the other Turkish letters, transcription marks and punctuation
 * folded too, so "hilafet" finds "Hilâfet" and "Istanbul" finds "İstanbul".
 * Only for suggesting; it never decides which Tag a name is, and it is not
 * search's folding, which lives in SQL (ADR-0010).
 */
export function tagSuggestKey(raw: string): string {
  return tagIdentity(raw)
    .replace(/ı/g, 'i')
    .normalize('NFD')
    .replace(/[\p{M}\p{Lm}\p{P}\p{S}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}
