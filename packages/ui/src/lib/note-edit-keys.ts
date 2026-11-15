import type { Command } from './wide-layout';

/** What a Note's edit in place is doing when a key comes. */
export type NoteEditKeyState = {
  /** A choice is open inside it: the Kaynak list or the Tag search. */
  choosing: boolean;
  /** "Değişiklikler atılsın mı?" stands in place of its buttons. */
  asking: boolean;
  /** Kaydet would save now: some text, nothing already saving. */
  canSave: boolean;
};

/** What the edit does with a shortcut; null leaves the key as it was. */
export type NoteEditAction = 'save' | 'ask' | 'keepEditing' | 'closeChoice' | 'close';

/**
 * A Note edited in place (ADR-0012): ⌘↵ saves it. Esc takes back one thing
 * at a time: an open choice, then the edit itself, asking first when it
 * holds changes; Esc while asking goes back to the edit. Every other key is
 * the list's around it, which waits while the Note is being edited.
 */
export function noteEditAction(command: Command, state: NoteEditKeyState): NoteEditAction | null {
  const { choosing, asking, canSave } = state;
  switch (command) {
    case 'submit':
      return canSave ? 'save' : null;
    case 'askDiscard':
      return choosing ? 'closeChoice' : asking ? 'keepEditing' : 'ask';
    case 'closePanel':
    case 'back':
      return choosing ? 'closeChoice' : 'close';
    default:
      return null;
  }
}
