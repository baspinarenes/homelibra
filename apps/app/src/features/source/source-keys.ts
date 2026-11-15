import type { Command } from '@homelibra/ui/wide-layout';

/** What a wide Source page is doing when a key comes. */
export type SourceKeyState = {
  /** The column shows a Note (the one pressed in the list) instead of the writing. */
  showing: boolean;
  /** The writing's Tag choice is open in place. */
  choosingTags: boolean;
  /** "Bu kaynakta ara" is open. */
  searching: boolean;
  /** The Note being written has something to save, and no save is on its way. */
  canSave: boolean;
  /** How many Notes the page lists. */
  notes: number;
};

/** What the page does with a shortcut; null leaves the key to the field, the frame or the browser. */
export type SourceAction =
  'save' | 'write' | 'edit' | 'copyNote' | 'copyAll' | 'previous' | 'next' | 'searchHere' | 'closeTags' | 'closeSearch';

/**
 * A wide Source page and its writing column (#177, ADR-0012). ⌘↵ saves the
 * Note being written; N goes back to the writing, the cursor in Alıntı.
 * While the column shows a Note, E edits it, ⌘C copies it and ↑↓ walk
 * through the Notes; ⌘⇧C copies the whole Source, / searches it. Esc takes
 * back one thing at a time: the Tag choice, then the Note shown (to the
 * writing), then the search. It never leaves the page, so a half-written
 * Note is never lost to it.
 */
export function sourceAction(command: Command, state: SourceKeyState): SourceAction | null {
  const { showing, choosingTags, searching, canSave, notes } = state;
  switch (command) {
    case 'askDiscard':
    case 'closePanel':
    case 'back':
      return choosingTags ? 'closeTags' : showing ? 'write' : searching ? 'closeSearch' : null;
    case 'submit':
      return !showing && canSave ? 'save' : null;
    case 'capture':
      return 'write';
    case 'edit':
    case 'copyNote':
      return showing ? command : null;
    case 'previous':
    case 'next':
      return showing && notes > 0 ? command : null;
    case 'copyAll':
      return notes > 0 ? 'copyAll' : null;
    case 'searchHere':
      return 'searchHere';
    default:
      return null;
  }
}
