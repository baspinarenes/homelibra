import type { Command } from '@homelibra/ui/wide-layout';
import { describe, expect, it } from 'vitest';

import { viewAction, type ViewKeyState } from './view-keys';

const idle: ViewKeyState = { panelOpen: false, renaming: false, searching: false, notes: 12 };
const open: ViewKeyState = { ...idle, panelOpen: true };

// The command a key gives in the wide tier (ui's commandFor, tested there), by the key.
const keys = {
  ArrowDown: 'next',
  ArrowUp: 'previous',
  '⌘C': 'copyNote',
  '⌘⇧C': 'copyAll',
  e: 'edit',
  '/': 'searchHere',
} as const satisfies Record<string, Command>;

// Esc gives closePanel while a panel is open, back otherwise.
const press = (key: keyof typeof keys | 'Escape', state: ViewKeyState) =>
  viewAction(key === 'Escape' ? (state.panelOpen ? 'closePanel' : 'back') : keys[key], state);

describe('viewAction', () => {
  it('↑↓ move through the rows, panel open or not', () => {
    expect(press('ArrowDown', idle)).toBe('next');
    expect(press('ArrowUp', open)).toBe('previous');
  });

  it('⌘C copies the Note the panel shows; with no panel it leaves the key to the browser', () => {
    expect(press('⌘C', open)).toBe('copyNote');
    expect(press('⌘C', idle)).toBeNull();
  });

  it('⌘⇧C copies the whole view, unless it has no Notes', () => {
    expect(press('⌘⇧C', idle)).toBe('copyAll');
    expect(press('⌘⇧C', { ...idle, notes: 0 })).toBeNull();
  });

  it('E edits the Note the panel shows, and only then', () => {
    expect(press('e', open)).toBe('edit');
    expect(press('e', idle)).toBeNull();
  });

  it('/ opens the search of this view, once', () => {
    expect(press('/', idle)).toBe('searchHere');
    expect(press('/', { ...idle, searching: true })).toBeNull();
  });

  it('Esc takes back one thing at a time: the renaming, then the panel, then the search', () => {
    expect(press('Escape', { ...open, renaming: true, searching: true })).toBe('cancelRename');
    expect(press('Escape', { ...open, searching: true })).toBe('closePanel');
    expect(press('Escape', { ...idle, searching: true })).toBe('closeSearch');
  });

  it('Esc with nothing open leaves the page as it is', () => {
    expect(press('Escape', idle)).toBeNull();
  });

  it('leaves what the frame or another screen does to them', () => {
    const others: Command[] = ['quickSearch', 'capture', 'submit', 'askDiscard'];
    expect(others.map((command) => viewAction(command, open))).toEqual([null, null, null, null]);
  });

  it('hears no row or copy keys while the name is being written', () => {
    const renaming = { ...open, renaming: true };
    expect(
      (['next', 'previous', 'copyNote', 'copyAll', 'edit', 'searchHere'] as const).map((c) => viewAction(c, renaming)),
    ).toEqual([null, null, null, null, null, null]);
  });
});
