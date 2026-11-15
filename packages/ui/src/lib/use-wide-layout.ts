import { useEffect, useRef } from 'react';
import { useWindowDimensions } from 'react-native';

import { type Command, commandFor, type Layout, wideLayout } from './wide-layout';

/** The layout for the window as it is now; it follows the window as it is resized. */
export function useWideLayout({ panelOpen = false }: { panelOpen?: boolean } = {}): Layout {
  const { width } = useWindowDimensions();
  return wideLayout({ width, panelOpen });
}

export type ShortcutState = {
  panelOpen?: boolean;
  unsavedChanges?: boolean;
  /** Whether this screen hears keys now: false while another screen is in front of it. */
  active?: boolean;
};

/**
 * Hears the wide tier's shortcuts while `active` and hands each command to
 * `onCommand`, which returns true when it acted on it; only then is the
 * browser's own response to the key held back. Where there is no document
 * (a phone), it hears nothing.
 */
export function useShortcuts(
  { panelOpen = false, unsavedChanges = false, active = true }: ShortcutState,
  onCommand: (command: Command) => boolean | void,
): void {
  const { width } = useWindowDimensions();
  const latest = useRef({ width, panelOpen, unsavedChanges, onCommand });
  latest.current = { width, panelOpen, unsavedChanges, onCommand };

  useEffect(() => {
    if (!active || typeof document === 'undefined') return;
    const listener = (event: KeyboardEvent) => {
      if (event.isComposing || event.defaultPrevented) return;
      const { onCommand: act, ...state } = latest.current;
      const command = commandFor(event, { ...state, typing: isTextField(document.activeElement) });
      if (!command) return;
      // Text selected on the page is copied as the browser copies it, not as a note.
      const selected = document.getSelection()?.isCollapsed === false;
      if ((command === 'copyNote' || command === 'copyAll') && selected) return;
      // A focused button, tab or row presses itself on ↵: `open` is for ↵ with nothing focused.
      if (command === 'open' && !nothingFocused(document.activeElement)) return;
      if (act(command) === true) event.preventDefault();
    };
    document.addEventListener('keydown', listener);
    return () => document.removeEventListener('keydown', listener);
  }, [active]);
}

const notText = new Set(['button', 'checkbox', 'radio', 'range', 'color', 'file', 'image', 'reset', 'submit']);

function nothingFocused(element: Element | null): boolean {
  return !element || element === document.body || element === document.documentElement;
}

function isTextField(element: Element | null): boolean {
  if (!element) return false;
  if (element instanceof HTMLTextAreaElement) return true;
  if (element instanceof HTMLInputElement) return !notText.has(element.type);
  return element instanceof HTMLElement && element.isContentEditable;
}
