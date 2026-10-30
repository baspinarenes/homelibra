export function joinWords(words: string[]): string {
  return words
    .map((word) => word.trim())
    .filter((word) => word.length > 0)
    .join(', ');
}
