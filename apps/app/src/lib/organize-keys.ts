import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

/** What Düzenle mode does for a key on the web (#13, #36). */
export type OrganizeKeys = {
  /** j (+1) and k (-1): the next or previous Note. */
  step: (by: 1 | -1) => void;
  /** x: select the Note under the cursor, or with Shift every Note from the last one picked. */
  select: (range: boolean) => void;
  /** t: Tags for the selected Notes. */
  tag: () => void;
  /** Delete (Mac's delete key sends Backspace): delete the selected Notes. */
  remove: () => void;
};

/** Typing in a field, the picker's filter say, is not a command. */
function typing(target: EventTarget | null) {
  const element = target as HTMLElement | null;
  return !!element && (['INPUT', 'TEXTAREA', 'SELECT'].includes(element.tagName) || element.isContentEditable);
}

/**
 * Düzenle mode's keys at the desk, on the web only: j/k move, x selects,
 * t tags, Delete deletes. Off while `enabled` is false (a sheet is open),
 * in a text field, and with Ctrl, Cmd or Alt held, so the browser's own
 * shortcuts stay.
 */
export function useOrganizeKeys(keys: OrganizeKeys, enabled: boolean) {
  const latest = useRef(keys);
  useEffect(() => {
    latest.current = keys;
  });

  useEffect(() => {
    if (Platform.OS !== 'web' || !enabled) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey || typing(event.target)) return;
      const handlers = latest.current;
      switch (event.key) {
        case 'j':
          handlers.step(1);
          break;
        case 'k':
          handlers.step(-1);
          break;
        case 'x':
        case 'X':
          handlers.select(event.shiftKey);
          break;
        case 't':
          handlers.tag();
          break;
        case 'Delete':
        case 'Backspace':
          handlers.remove();
          break;
        default:
          return;
      }
      event.preventDefault();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [enabled]);
}
