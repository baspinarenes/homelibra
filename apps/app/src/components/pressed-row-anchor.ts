import type { Density } from '@homelibra/ui/wide-layout';
import { useEffect, useRef } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent, PressableInstance, ViewInstance } from 'react-native';

/**
 * A wide list of Notes beside its panel (a Collection's, a Tag's page,
 * Ara's, the lost Notes): opening a Note switches its rows to compact, and
 * the pressed row stays where it stood on the screen; a row the keys moved
 * to (`focusRow`) comes into view and takes the focus, so the framed row
 * and the focused one agree.
 *
 * The list scrolls through `scrollTo` (an offset) and `reveal`, which has
 * the list draw a row far down it that is not drawn yet. `topRoom` is kept
 * above a row brought into view, for a heading that sticks over the list.
 * The list wraps itself in `frame`, hands each row's wrapper to `row` and
 * its press target to `target`, reports its scrolling to `onScroll`, and
 * opens a pressed row through `press`.
 */
export function usePressedRowAnchor({
  density,
  focused,
  focusRow,
  panelOpen,
  scrollTo,
  reveal,
  topRoom = 0,
}: {
  density: Density | undefined;
  /** The row the panel shows. */
  focused: string | null;
  focusRow: boolean;
  /** Open already, the rows keep their density, and nothing moves. */
  panelOpen: boolean;
  scrollTo: (offset: number) => void;
  reveal: (id: string) => void;
  topRoom?: number;
}) {
  const frame = useRef<ViewInstance>(null);
  const rows = useRef(new Map<string, ViewInstance>());
  // Each drawn row's own press target, to put the focus on.
  const targets = useRef(new Map<string, PressableInstance>());
  const scrollY = useRef(0);
  // The pressed row and where it stood on the screen, until the rows have changed under it.
  const pressed = useRef<{ id: string; top: number } | null>(null);

  const scrollBy = (dy: number) => {
    if (Math.abs(dy) >= 1) scrollTo(scrollY.current + dy);
  };

  // The rows have changed density under the pressed row: put it back where it stood.
  useEffect(() => {
    const was = pressed.current;
    if (!was) return;
    const frameId = requestAnimationFrame(() => {
      pressed.current = null;
      rows.current.get(was.id)?.measureInWindow((_x, top) => scrollBy(top - was.top));
    });
    return () => cancelAnimationFrame(frameId);
    // Only a change of density moves the rows; scrollBy reads refs.
  }, [density]);

  // A row the keys moved to comes into view and takes the focus; a pressed one already has both.
  useEffect(() => {
    if (!focused || pressed.current) return;
    const row = rows.current.get(focused);
    if (focusRow) targets.current.get(focused)?.focus();
    if (!row) {
      // Not drawn yet, far down a long list: the list finds it and draws it.
      reveal(focused);
      if (!focusRow) return;
      const frameId = requestAnimationFrame(() => targets.current.get(focused)?.focus());
      return () => cancelAnimationFrame(frameId);
    }
    frame.current?.measureInWindow((_fx, frameTop, _fw, frameHeight) =>
      row.measureInWindow((_x, top, _w, height) => {
        if (top < frameTop + topRoom) scrollBy(top - frameTop - topRoom);
        else if (top + height > frameTop + frameHeight) scrollBy(top + height - frameTop - frameHeight);
      }),
    );
    // Only a change of the focused Note asks for this.
  }, [focused]);

  return {
    frame,
    onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollY.current = event.nativeEvent.contentOffset.y;
    },
    /** The wrapper of the row `id`, measured to keep it in place. */
    row: (id: string) => (row: ViewInstance | null) => {
      if (row) rows.current.set(id, row);
      else rows.current.delete(id);
    },
    /** The press target of the row `id`, which takes the focus. */
    target: (id: string) => (target: PressableInstance | null) => {
      if (target) targets.current.set(id, target);
      else targets.current.delete(id);
    },
    /** The row `id` pressed: `open` opens it, the row kept where it stands. */
    press: (id: string, open: () => void) => {
      const row = rows.current.get(id);
      if (!row || panelOpen) return open();
      row.measureInWindow((_x, top) => {
        pressed.current = { id, top };
        open();
      });
    },
  };
}
