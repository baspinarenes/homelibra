/** Puts "Değişiklikler atılsın mı?" in the work; `then` runs once its changes are thrown away (At). */
export type AskDiscard = (then: () => void) => void;

/**
 * The work not yet saved on the screen in front (a Note edited in place
 * with changes, a form being filled) and every way out of it: the panel's
 * ✕, another row, + Yeni not, the sidebar, Not al (Q51, #178). None of
 * them puts the work away unasked: the work asks "Değişiklikler atılsın
 * mı?" in its own place, and the way out is taken once its changes are
 * thrown away; Düzenlemeye dön stays.
 */
export type UnsavedWork = {
  /** Holds while the work is unsaved; the function returned lets go of the hold, once. */
  hold: (ask: AskDiscard) => () => void;
  held: () => boolean;
  /** Takes the way out `leave`: at once with nothing held, otherwise once the work held last has asked and its changes are thrown away. */
  leave: (leave: () => void) => void;
};

export function unsavedWork(): UnsavedWork {
  const holds: { ask: AskDiscard }[] = [];
  return {
    hold(ask) {
      const hold = { ask };
      holds.push(hold);
      return () => {
        const at = holds.indexOf(hold);
        if (at >= 0) holds.splice(at, 1);
      };
    },
    held: () => holds.length > 0,
    leave(leave) {
      const front = holds[holds.length - 1];
      if (front) front.ask(leave);
      else leave();
    },
  };
}
