import { describe, expect, it } from 'vitest';

import { commandFor, wideLayout } from '../wide-layout';

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
      press('Enter'),
    ];
    expect(held.map((key) => commandFor(key, wide))).toEqual([null, null, null, null, null, null]);
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
