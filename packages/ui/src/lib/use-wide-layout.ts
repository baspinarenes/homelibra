import { useEffect, useRef } from 'react';
import { useWindowDimensions } from 'react-native';

import { type Command, type Layout, shortcutFor, wideLayout } from './wide-layout';

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
 * `onCommand`. It hears a key before the element it was pressed in, so
 * ⌘K, ⌘↵ and Esc reach it from a text field too (react-native-web's
 * TextInput stops every keydown it gets), while the rest of a field's
 * typing stays the field's (`commandFor`). `onCommand` returns true only
 * for a command this screen handles: then the key goes no further, neither
 * to the field nor to the browser. Any other answer leaves the key as it
 * was, so a field that handles ⌘↵ itself (the composer) still gets it. A
 * key pressed in a dialog is the dialog's; ⌘C over selected text is the
 * browser's. Where there is no document (a phone), it hears nothing.
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
      const { onCommand: act, ...state } = latest.current;
      const command = shortcutFor(event, {
        ...state,
        typing: isTextField(document.activeElement),
        focused: !nothingFocused(document.activeElement),
        inDialog: event.target instanceof Element && event.target.closest('[aria-modal="true"]') !== null,
        textSelected: document.getSelection()?.isCollapsed === false,
      });
      if (!command || act(command) !== true) return;
      event.preventDefault();
      event.stopPropagation();
    };
    // In the capture phase: before the field, which would stop the key on its way up.
    document.addEventListener('keydown', listener, true);
    return () => document.removeEventListener('keydown', listener, true);
  }, [active]);
}

const notText = new Set(['button', 'checkbox', 'radio', 'range', 'color', 'file', 'image', 'reset', 'submit']);

/** The page itself has the focus: no button, tab, row or field that would take ↵. */
function nothingFocused(element: Element | null): boolean {
  return !element || element === document.body || element === document.documentElement;
}

function isTextField(element: Element | null): boolean {
  if (!element) return false;
  if (element instanceof HTMLTextAreaElement) return true;
  if (element instanceof HTMLInputElement) return !notText.has(element.type);
  return element instanceof HTMLElement && element.isContentEditable;
}
