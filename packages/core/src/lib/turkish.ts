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

const backVowels = 'aıouâû';
const frontVowels = 'eiöüî';
// Fıstıkçı şahap: after these, "-den" is "-ten".
const voiceless = 'çfhkpsşt';

/** How the number a text ends with is said, as far as its suffix cares: its last word. */
function lastNumberWord(digits: string): string {
  const units = ['', 'bir', 'iki', 'üç', 'dört', 'beş', 'altı', 'yedi', 'sekiz', 'dokuz'];
  const tens = ['', 'on', 'yirmi', 'otuz', 'kırk', 'elli', 'altmış', 'yetmiş', 'seksen', 'doksan'];
  const n = BigInt(digits);
  if (n === 0n) return 'sıfır';
  if (n % 10n !== 0n) return units[Number(n % 10n)]!;
  if (n % 100n !== 0n) return tens[Number((n % 100n) / 10n)]!;
  if (n % 1000n !== 0n) return 'yüz';
  if (n % 1_000_000n !== 0n) return 'bin';
  return n % 1_000_000_000n !== 0n ? 'milyon' : 'milyar';
}

const isVowel = (c: string) => backVowels.includes(c) || frontVowels.includes(c);

/**
 * How the end of a text is said aloud, as far as a suffix cares: a number as
 * its last word, a time by its minutes ("12:00" by its hour), a single letter
 * after a number by its name (a vowel as itself, a consonant with "e": "b" is
 * "be"), a word as written.
 */
function spokenEnd(text: string): string {
  const time = /(\d+):0+$/.exec(text);
  if (time) return lastNumberWord(time[1]!);
  const number = /(\d+)$/.exec(text);
  if (number) return lastNumberWord(number[1]!);
  const lower = text.toLocaleLowerCase('tr');
  const letter = lower.at(-1)!;
  if (/\d\p{L}$/u.test(lower)) return isVowel(letter) ? letter : 'e';
  return lower;
}

/**
 * The text with the ablative after an apostrophe, as said aloud: "s. 52" →
 * "s. 52'den", "s. 60" → "s. 60'tan", "vr. 12a" → "vr. 12a'dan", "Giriş" →
 * "Giriş'ten".
 */
export function ablativeTr(text: string): string {
  const trimmed = text.trim();
  const said = spokenEnd(trimmed);
  const vowel = [...said].reverse().find(isVowel) ?? 'e';
  const d = voiceless.includes(said.at(-1)!) ? 't' : 'd';
  return `${trimmed}'${d}${backVowels.includes(vowel) ? 'a' : 'e'}n`;
}
