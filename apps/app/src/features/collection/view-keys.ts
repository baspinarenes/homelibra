import type { Command } from '@homelibra/ui/wide-layout';

/** What a Collection's view (or a Tag's page) is doing when a key comes. */
export type ViewKeyState = {
  panelOpen: boolean;
  /** Its name being written in place. */
  renaming: boolean;
  /** Its search (/) open. */
  searching: boolean;
  /** How many Notes it shows. */
  notes: number;
};

/** What the view does with a shortcut; null leaves the key to the frame or the browser. */
export type ViewAction =
  'previous' | 'next' | 'copyNote' | 'copyAll' | 'edit' | 'searchHere' | 'cancelRename' | 'closePanel' | 'closeSearch';

/**
 * A wide view of Notes and its panel (ADR-0012): ↑↓ move the panel through
 * the rows, ⌘C copies the Note it shows and ⌘⇧C the whole view, E edits
 * that Note, / opens the view's search. Esc takes back one thing at a time:
 * the renaming, then the panel, then the search; it never leaves the page.
 */
export function viewAction(command: Command, state: ViewKeyState): ViewAction | null {
  const { panelOpen, renaming, searching, notes } = state;
  if (command === 'closePanel' || command === 'back') {
    return renaming ? 'cancelRename' : panelOpen ? 'closePanel' : searching ? 'closeSearch' : null;
  }
  if (renaming) return null;
  switch (command) {
    case 'previous':
    case 'next':
      return notes > 0 ? command : null;
    case 'copyNote':
    case 'edit':
      return panelOpen ? command : null;
    case 'copyAll':
      return notes > 0 ? 'copyAll' : null;
    case 'searchHere':
      return searching ? null : 'searchHere';
    default:
      return null;
  }
}
