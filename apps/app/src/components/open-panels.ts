/**
 * Whether a screen in front has its panel open beside its list: the frame
 * reads it to narrow the sidebar to the icon rail (ADR-0012). Each screen
 * that opens a panel reports it and lets go when the panel closes or the
 * screen leaves the front; it is open while any report is held.
 */
export type OpenPanels = {
  /** Reports a panel open; the function returned lets go of this report, once. */
  open: () => () => void;
  isOpen: () => boolean;
  /** Hears each change between open and closed; returns the function that stops it. */
  subscribe: (listener: () => void) => () => void;
};

export function openPanels(): OpenPanels {
  let held = 0;
  const listeners = new Set<() => void>();
  const tell = () => {
    for (const listener of listeners) listener();
  };
  return {
    open() {
      held += 1;
      if (held === 1) tell();
      let released = false;
      return () => {
        if (released) return;
        released = true;
        held -= 1;
        if (held === 0) tell();
      };
    },
    isOpen: () => held > 0,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
