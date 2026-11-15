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
  /**
   * Set by a listener that belongs to a dialog (a Modal: a sheet, a menu,
   * the ⌘K window). Any other hears nothing while the focus is in one: the
   * dialog's Esc and arrows are the dialog's, not the screen's under it.
   */
  inDialog?: boolean;
};

/**
 * Hears the wide tier's shortcuts while `active` and hands each command to
 * `onCommand`, which returns true when it acted on it; only then is the
 * browser's own response to the key held back. Where there is no document
 * (a phone), it hears nothing.
 */
export function useShortcuts(
  { panelOpen = false, unsavedChanges = false, active = true, inDialog = false }: ShortcutState,
  onCommand: (command: Command) => boolean | void,
): void {
  const { width } = useWindowDimensions();
  const latest = useRef({ width, panelOpen, unsavedChanges, onCommand });
  latest.current = { width, panelOpen, unsavedChanges, onCommand };

  useEffect(() => {
    if (!active || typeof document === 'undefined') return;
    const listener = (event: KeyboardEvent) => {
      if (event.isComposing || event.defaultPrevented) return;
      // react-native-web marks a Modal aria-modal and keeps the focus inside it while it is open.
      if (!inDialog && document.activeElement?.closest('[aria-modal="true"]')) return;
      const { onCommand: act, ...state } = latest.current;
      const command = commandFor(event, { ...state, typing: isTextField(document.activeElement) });
      if (!command) return;
      // Text selected on the page is copied as the browser copies it, not as a note.
      const selected = document.getSelection()?.isCollapsed === false;
      if ((command === 'copyNote' || command === 'copyAll') && selected) return;
      if (act(command) === true) event.preventDefault();
    };
    document.addEventListener('keydown', listener);
    return () => document.removeEventListener('keydown', listener);
  }, [active, inDialog]);
}

const notText = new Set(['button', 'checkbox', 'radio', 'range', 'color', 'file', 'image', 'reset', 'submit']);

function isTextField(element: Element | null): boolean {
  if (!element) return false;
  if (element instanceof HTMLTextAreaElement) return true;
  if (element instanceof HTMLInputElement) return !notText.has(element.type);
  return element instanceof HTMLElement && element.isContentEditable;
}
