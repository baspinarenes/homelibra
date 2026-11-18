import type { Command } from '@homelibra/ui/wide-layout';
import { describe, expect, it } from 'vitest';

import { captureAction, type CaptureKeyState } from './capture-keys';

const closed: CaptureKeyState = { writing: false, pageWrites: false, choosing: false, canSave: false };
const writing: CaptureKeyState = { ...closed, writing: true, canSave: true };

describe('captureAction', () => {
  it('N opens the writing where the page has none of its own', () => {
    expect(captureAction('capture', closed)).toBe('open');
  });

  it('N is left to a page that writes on its own, as a Source page does', () => {
    expect(captureAction('capture', { ...closed, pageWrites: true })).toBeNull();
  });

  it('N with the writing open puts the cursor back in Alıntı', () => {
    expect(captureAction('capture', writing)).toBe('focus');
  });

  it('⌘↵ saves the Note being written, and lets the key go while there is nothing to save', () => {
    expect(captureAction('submit', writing)).toBe('save');
    expect(captureAction('submit', { ...writing, canSave: false })).toBeNull();
  });

  it('Esc closes the writing, the Kaynak or Tag choice first', () => {
    expect(captureAction('closePanel', writing)).toBe('close');
    expect(captureAction('back', writing)).toBe('close');
    expect(captureAction('closePanel', { ...writing, choosing: true })).toBe('closeChoice');
  });

  it('with the writing closed, ⌘↵ and Esc are the page’s', () => {
    expect(captureAction('submit', { ...closed, canSave: true })).toBeNull();
    expect(captureAction('back', closed)).toBeNull();
    expect(captureAction('closePanel', closed)).toBeNull();
  });

  it('takes no other key, open or closed', () => {
    const others: Command[] = ['quickSearch', 'searchHere', 'previous', 'next', 'copyNote', 'copyAll', 'edit', 'open'];
    for (const command of others) {
      expect(captureAction(command, writing)).toBeNull();
      expect(captureAction(command, closed)).toBeNull();
    }
  });
});
