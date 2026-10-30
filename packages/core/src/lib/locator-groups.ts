export type LocatorGroup<N> = { locator: string | null; notes: N[] };

/**
 * Capture's flow under Locator headings: each run of consecutive Notes at
 * the same Locator gets one heading. Going back to an earlier Locator starts
 * a new run, so the flow keeps the order the Notes were taken in.
 */
export function locatorGroups<N extends { locator: string | null }>(notes: readonly N[]): LocatorGroup<N>[] {
  const groups: LocatorGroup<N>[] = [];
  for (const note of notes) {
    const last = groups.at(-1);
    if (last && last.locator === note.locator) last.notes.push(note);
    else groups.push({ locator: note.locator, notes: [note] });
  }
  return groups;
}
