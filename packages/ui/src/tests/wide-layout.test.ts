import { describe, expect, it } from 'vitest';

import { commandFor, shortcutFor, sideColumnBeside, wideLayout } from '../wide-layout';

describe('wideLayout', () => {
  it('picks the tier by window width alone', () => {
    expect([390, 719, 720, 1023, 1024, 1600].map((width) => wideLayout({ width }).tier)).toEqual([
      'phone',
      'phone',
      'rail',
      'rail',
      'wide',
      'wide',
    ]);
  });

  it('narrows the sidebar to the icon rail below 1200 px only while a panel is open', () => {
    const sidebar = (width: number, panelOpen: boolean) => wideLayout({ width, panelOpen }).sidebar;
    expect([1024, 1199, 1200, 1440].map((width) => sidebar(width, true))).toEqual([
      'iconRail',
      'iconRail',
      'full',
      'full',
    ]);
    expect([1024, 1199, 1200].map((width) => sidebar(width, false))).toEqual(['full', 'full', 'full']);
  });

  it('draws no sidebar below the wide tier, panel or not', () => {
    expect([390, 720, 1023].map((width) => wideLayout({ width, panelOpen: true }).sidebar)).toEqual([null, null, null]);
  });

  it('lists notes in compact rows while a panel is open, in full rows otherwise', () => {
    expect(wideLayout({ width: 1280, panelOpen: true }).density).toBe('compact');
    expect(wideLayout({ width: 1100, panelOpen: true }).density).toBe('compact');
    expect(wideLayout({ width: 1280, panelOpen: false }).density).toBe('full');
    expect(wideLayout({ width: 1280 }).density).toBe('full');
  });

  it('keeps full rows below the wide tier, which has no panel', () => {
    expect([390, 900].map((width) => wideLayout({ width, panelOpen: true }).density)).toEqual(['full', 'full']);
  });
});

describe('sideColumnBeside', () => {
  it("keeps a page's side column beside its main column from 1280 px, the width Genel Bakış is drawn at", () => {
    expect([1024, 1100, 1279, 1280, 1440].map((width) => sideColumnBeside({ width }))).toEqual([
      false,
      false,
      false,
      true,
      true,
    ]);
  });

  it('puts it under the main column below the wide tier', () => {
    expect([390, 720, 1023].map((width) => sideColumnBeside({ width }))).toEqual([false, false, false]);
  });

  it("puts it under the main column while a panel stands beside the page, Not al's 520 px taking its room", () => {
    expect([1280, 1440, 1920].map((width) => sideColumnBeside({ width, panelOpen: true }))).toEqual([
      false,
      false,
      false,
    ]);
    expect(sideColumnBeside({ width: 1280, panelOpen: false })).toBe(true);
  });
});

const wide = { width: 1280 };
const press = (
  key: string,
  held: { metaKey?: boolean; ctrlKey?: boolean; shiftKey?: boolean; altKey?: boolean } = {},
) => ({
  key,
  ...held,
});

describe('commandFor', () => {
  it('gives each shortcut its command', () => {
    const shortcuts = [
      press('k', { metaKey: true }),
      press('n'),
      press('/'),
      press('ArrowUp'),
      press('ArrowDown'),
      press('c', { metaKey: true }),
      press('C', { metaKey: true, shiftKey: true }),
      press('e'),
      press('Escape'),
      press('Enter', { metaKey: true }),
    ];
    expect(shortcuts.map((key) => commandFor(key, wide))).toEqual([
      'quickSearch',
      'capture',
      'searchHere',
      'previous',
      'next',
      'copyNote',
      'copyAll',
      'edit',
      'back',
      'submit',
    ]);
  });

  it('leaves N, E and / to a focused text field, but still saves on ⌘↵ and hears Esc and ⌘K', () => {
    const typing = { ...wide, typing: true };
    expect([press('n'), press('e'), press('/')].map((key) => commandFor(key, typing))).toEqual([null, null, null]);
    expect(commandFor(press('Enter', { metaKey: true }), typing)).toBe('submit');
    expect(commandFor(press('Escape'), typing)).toBe('back');
    expect(commandFor(press('k', { metaKey: true }), typing)).toBe('quickSearch');
  });

  it('leaves copying and the caret’s ↑↓ to a focused text field', () => {
    const typing = { ...wide, typing: true };
    const keys = [
      press('c', { metaKey: true }),
      press('C', { metaKey: true, shiftKey: true }),
      press('ArrowUp'),
      press('ArrowDown'),
    ];
    expect(keys.map((key) => commandFor(key, typing))).toEqual([null, null, null, null]);
  });

  it('closes an open panel on Esc rather than leaving the page', () => {
    expect(commandFor(press('Escape'), { ...wide, panelOpen: true })).toBe('closePanel');
    expect(commandFor(press('Escape'), { ...wide, panelOpen: true, typing: true })).toBe('closePanel');
  });

  it('asks before discarding unsaved changes on Esc', () => {
    expect(commandFor(press('Escape'), { ...wide, panelOpen: true, unsavedChanges: true })).toBe('askDiscard');
    expect(commandFor(press('Escape'), { ...wide, panelOpen: true, unsavedChanges: true, typing: true })).toBe(
      'askDiscard',
    );
  });

  it('takes Ctrl for ⌘, as Windows and Linux keyboards have it', () => {
    expect(commandFor(press('k', { ctrlKey: true }), wide)).toBe('quickSearch');
    expect(commandFor(press('Enter', { ctrlKey: true }), wide)).toBe('submit');
    expect(commandFor(press('c', { ctrlKey: true }), wide)).toBe('copyNote');
  });

  it('hears a letter shortcut only on its own, leaving ⌘N, ⌘E and Alt to the browser', () => {
    const held = [
      press('n', { metaKey: true }),
      press('e', { ctrlKey: true }),
      press('n', { altKey: true }),
      press('e', { altKey: true }),
      press('ArrowDown', { metaKey: true }),
    ];
    expect(held.map((key) => commandFor(key, wide))).toEqual([null, null, null, null, null]);
  });

  it('opens the chosen row on ↵ alone, leaving ↵ in a text field and ⇧↵ to the page', () => {
    expect(commandFor(press('Enter'), wide)).toBe('open');
    expect(commandFor(press('Enter'), { ...wide, typing: true })).toBeNull();
    expect(commandFor(press('Enter', { shiftKey: true }), wide)).toBeNull();
    expect(commandFor(press('Enter'), { width: 1023 })).toBeNull();
  });

  it('leaves ⌘ shortcuts with Alt held to the browser and to AltGr, which reports Ctrl+Alt', () => {
    const held = [
      press('c', { metaKey: true, altKey: true }),
      press('k', { ctrlKey: true, altKey: true }),
      press('Enter', { metaKey: true, altKey: true }),
    ];
    expect(held.map((key) => commandFor(key, wide))).toEqual([null, null, null]);
  });

  it('hears / however the keyboard makes it, as Shift+7 on a Turkish Q layout', () => {
    expect(commandFor(press('/', { shiftKey: true }), wide)).toBe('searchHere');
    expect(commandFor(press('N', { shiftKey: true }), wide)).toBe('capture');
  });

  it('gives no command below the wide tier, whose screens keep today’s keys', () => {
    const keys = [press('k', { metaKey: true }), press('n'), press('Escape'), press('Enter', { metaKey: true })];
    for (const width of [390, 720, 1023]) {
      expect(keys.map((key) => commandFor(key, { width, panelOpen: true }))).toEqual([null, null, null, null]);
    }
  });
});

describe('shortcutFor', () => {
  const quiet = { ...wide, typing: false, inDialog: false, textSelected: false };

  it('gives the command of a key pressed on the page', () => {
    expect(shortcutFor(press('k', { metaKey: true }), quiet)).toBe('quickSearch');
    expect(shortcutFor(press('n'), quiet)).toBe('capture');
  });

  it('hears ⌘K, ⌘↵ and Esc from a text field, and nothing else of its typing', () => {
    const typing = { ...quiet, typing: true };
    expect(shortcutFor(press('k', { metaKey: true }), typing)).toBe('quickSearch');
    expect(shortcutFor(press('Enter', { metaKey: true }), typing)).toBe('submit');
    expect(shortcutFor(press('Escape'), typing)).toBe('back');
    expect(shortcutFor(press('n'), typing)).toBeNull();
    expect(shortcutFor(press('c', { metaKey: true }), typing)).toBeNull();
  });

  it('leaves a key pressed in a dialog to the dialog: the quick search window keeps ⌘K and Esc', () => {
    const inDialog = { ...quiet, typing: true, inDialog: true };
    expect(shortcutFor(press('k', { metaKey: true }), inDialog)).toBeNull();
    expect(shortcutFor(press('Escape'), inDialog)).toBeNull();
  });

  it('leaves ⌘C and ⌘⇧C to the browser while text on the page is selected', () => {
    const selected = { ...quiet, textSelected: true };
    expect(shortcutFor(press('c', { metaKey: true }), selected)).toBeNull();
    expect(shortcutFor(press('c', { metaKey: true, shiftKey: true }), selected)).toBeNull();
    expect(shortcutFor(press('k', { metaKey: true }), selected)).toBe('quickSearch');
  });

  it('opens the chosen row on ↵ only while nothing on the page has the focus', () => {
    expect(shortcutFor(press('Enter'), quiet)).toBe('open');
    // A focused button, tab or row presses itself on ↵.
    expect(shortcutFor(press('Enter'), { ...quiet, focused: true })).toBeNull();
    // ↵ in a field (Filtrele's years) or in the quick search window is theirs.
    expect(shortcutFor(press('Enter'), { ...quiet, focused: true, typing: true })).toBeNull();
    expect(shortcutFor(press('Enter'), { ...quiet, inDialog: true })).toBeNull();
    // The other keys do not care where the focus is.
    expect(shortcutFor(press('ArrowDown'), { ...quiet, focused: true })).toBe('next');
  });

  it('skips a key still being composed, or one something before it already took', () => {
    expect(shortcutFor({ ...press('k', { metaKey: true }), isComposing: true }, quiet)).toBeNull();
    expect(shortcutFor({ ...press('n'), defaultPrevented: true }, quiet)).toBeNull();
  });
});
