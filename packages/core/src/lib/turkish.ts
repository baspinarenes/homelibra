const collator = new Intl.Collator('tr');

/** Orders strings by the Turkish alphabet (ı before i, ç after c). Use it for every user-facing sort. */
export function compareTr(a: string, b: string): number {
  return collator.compare(a, b);
}

/** Words a Turkish heading leaves lower-case, unless one opens it. */
const minorWords = new Set(['ve', 'veya', 'ile', 'ya', 'da', 'de', 'ki']);

/**
 * A heading in Title Case by Turkish rules: "ilk baskı tarihi" → "İlk Baskı
 * Tarihi", "filtrele ve sırala" → "Filtrele ve Sırala". Only first letters
 * change, so "ISBN" and "Hicrî" stay as written.
 */
export function titleCaseTr(text: string): string {
  let first = true;
  return text.replace(/\S+/g, (word) => {
    const minor = !first && minorWords.has(word);
    first = false;
    return minor ? word : word.charAt(0).toLocaleUpperCase('tr') + word.slice(1);
  });
}
