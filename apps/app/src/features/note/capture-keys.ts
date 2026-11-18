import type { Command } from '@homelibra/ui/wide-layout';

/** Where the wide frame's Not al stands when a key comes. */
export type CaptureKeyState = {
  /** The writing is open in the frame's panel. */
  writing: boolean;
  /** The page in front writes on its own (a Source page's column): N is its. */
  pageWrites: boolean;
  /** The Kaynak or Tag choice is open in the writing. */
  choosing: boolean;
  /** The Note being written has a Source and something to save, and no save is on its way. */
  canSave: boolean;
};

/** What the frame does with a shortcut; null leaves the key to the page, the field or the browser. */
export type CaptureAction = 'open' | 'focus' | 'save' | 'closeChoice' | 'close';

/**
 * Not al off a Source page (#178, Q52). N opens the writing in the panel
 * beside the page, unless the page writes on its own; with the writing
 * open N puts the cursor back in Alıntı, ⌘↵ saves and Esc closes the
 * choice, then the writing. Closed, it takes no key but N.
 */
export function captureAction(command: Command, state: CaptureKeyState): CaptureAction | null {
  const { writing, pageWrites, choosing, canSave } = state;
  switch (command) {
    case 'capture':
      return writing ? 'focus' : pageWrites ? null : 'open';
    case 'submit':
      return writing && canSave ? 'save' : null;
    case 'askDiscard':
    case 'closePanel':
    case 'back':
      return !writing ? null : choosing ? 'closeChoice' : 'close';
    default:
      return null;
  }
}
