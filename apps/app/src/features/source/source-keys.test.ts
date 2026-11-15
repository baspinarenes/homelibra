import { describe, expect, it } from 'vitest';

import { sourceAction, type SourceKeyState } from './source-keys';

const writing: SourceKeyState = { showing: false, choosingTags: false, searching: false, canSave: true, notes: 5 };
const showing: SourceKeyState = { ...writing, showing: true };

describe('sourceAction', () => {
  it('⌘↵ saves the Note being written, and lets the key go while there is nothing to save', () => {
    expect(sourceAction('submit', writing)).toBe('save');
    expect(sourceAction('submit', { ...writing, canSave: false })).toBeNull();
  });

  it('⌘↵ saves nothing while the column shows a Note', () => {
    expect(sourceAction('submit', showing)).toBeNull();
  });

  it('N goes back to writing, from a Note shown or from writing itself (the cursor to Alıntı)', () => {
    expect(sourceAction('capture', showing)).toBe('write');
    expect(sourceAction('capture', writing)).toBe('write');
  });

  it('Esc takes a Note shown back to writing', () => {
    expect(sourceAction('back', showing)).toBe('write');
    expect(sourceAction('closePanel', showing)).toBe('write');
  });

  it('Esc closes the Tag choice first', () => {
    expect(sourceAction('back', { ...writing, choosingTags: true })).toBe('closeTags');
  });

  it('Esc puts the search away while writing, and otherwise never leaves the page with the draft', () => {
    expect(sourceAction('back', { ...writing, searching: true })).toBe('closeSearch');
    expect(sourceAction('back', writing)).toBeNull();
    expect(sourceAction('askDiscard', writing)).toBeNull();
  });

  it('E, ⌘C and ↑↓ act on the Note shown; while writing they do nothing', () => {
    expect(sourceAction('edit', showing)).toBe('edit');
    expect(sourceAction('copyNote', showing)).toBe('copyNote');
    expect(sourceAction('next', showing)).toBe('next');
    expect(sourceAction('previous', showing)).toBe('previous');
    for (const command of ['edit', 'copyNote', 'next', 'previous'] as const) {
      expect(sourceAction(command, writing)).toBeNull();
    }
  });

  it('⌘⇧C copies the whole Source, unless it has no Notes', () => {
    expect(sourceAction('copyAll', writing)).toBe('copyAll');
    expect(sourceAction('copyAll', { ...writing, notes: 0 })).toBeNull();
  });

  it('/ opens the search in the Source', () => {
    expect(sourceAction('searchHere', writing)).toBe('searchHere');
  });

  it('leaves ⌘K and ↵ to the frame and the browser', () => {
    expect(sourceAction('quickSearch', writing)).toBeNull();
    expect(sourceAction('open', showing)).toBeNull();
  });
});
