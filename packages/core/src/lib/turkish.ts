const collator = new Intl.Collator('tr');

/** Orders strings by the Turkish alphabet (ı before i, ç after c). Use it for every user-facing sort. */
export function compareTr(a: string, b: string): number {
  return collator.compare(a, b);
}
