/**
 * Every layout decision a wide screen makes, as plain functions of what the
 * window and the screen are doing (ADR-0012). Width picks the tier, never the
 * platform.
 */

/**
 * `phone`: the bottom tab bar and one column. `rail`: today's left tab rail
 * and one column. `wide`: the sidebar frame, list and panel side by side.
 */
export type Tier = 'phone' | 'rail' | 'wide';

/** The wide tier's sidebar: 248 px in `full`, the same sidebar as a 64 px `iconRail`. */
export type Sidebar = 'full' | 'iconRail';

/** A note list's rows: `full` shows Excerpt and Comment whole, `compact` gives each note one line. */
export type Density = 'full' | 'compact';

const railFrom = 720;
const wideFrom = 1024;
/** Below it, an open panel narrows the sidebar so the list and the panel keep their width. */
const fullSidebarFrom = 1200;

export type LayoutState = {
  /** The window's width in px. */
  width: number;
  /** Whether the screen's panel is open beside its list. A panel is the screen's state, never a setting. */
  panelOpen?: boolean;
};

export type Layout = {
  tier: Tier;
  /** null below the wide tier, which has no sidebar. */
  sidebar: Sidebar | null;
  density: Density;
};

export function wideLayout({ width, panelOpen = false }: LayoutState): Layout {
  const tier = width >= wideFrom ? 'wide' : width >= railFrom ? 'rail' : 'phone';
  // Only the wide tier has a panel to open.
  const panel = tier === 'wide' && panelOpen;
  return {
    tier,
    sidebar: tier !== 'wide' ? null : panel && width < fullSidebarFrom ? 'iconRail' : 'full',
    density: panel ? 'compact' : 'full',
  };
}

/**
 * What a shortcut asks the screen to do; the screen that hears it decides
 * what that means where it is. ⌘K `quickSearch`, N `capture` (Not al),
 * / `searchHere` (search this view), ↑↓ `previous` / `next` row, ⌘C
 * `copyNote`, ⌘⇧C `copyAll` (the open Collection, Tag or Source as
 * Markdown), E `edit`, ⌘↵ `submit` (save what is being written). Esc gives
 * `askDiscard` (Değişiklikler atılsın mı?), `closePanel` or `back`.
 */
export type Command =
  | 'quickSearch'
  | 'capture'
  | 'searchHere'
  | 'previous'
  | 'next'
  | 'copyNote'
  | 'copyAll'
  | 'edit'
  | 'submit'
  | 'askDiscard'
  | 'closePanel'
  | 'back';

/** A key pressed, as the web's KeyboardEvent tells it. Ctrl counts as ⌘. */
export type KeyPress = {
  key: string;
  metaKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
};

export type CommandState = LayoutState & {
  /** Whether a text field has the focus: its letters, copying and caret keys are the field's own. */
  typing?: boolean;
  /** Whether an edit holds changes not yet saved, which Esc must not throw away unasked. */
  unsavedChanges?: boolean;
};

/** A keydown as the page hears it, before any field has acted on it. */
export type HeardKey = KeyPress & {
  /** An input method is still composing the character. */
  isComposing?: boolean;
  /** Something heard the key first and took it. */
  defaultPrevented?: boolean;
};

export type HeardState = CommandState & {
  /** The key was pressed inside a dialog (`aria-modal`): its keys are its own, as the quick search window's box. */
  inDialog: boolean;
  /** Text on the page is selected, which ⌘C copies as the browser copies it. */
  textSelected: boolean;
};

/**
 * Whether a key heard on the page is a shortcut, and which: the command
 * `commandFor` gives, unless the key is still being composed, was already
 * taken, came from a dialog, or is ⌘C / ⌘⇧C over selected text.
 */
export function shortcutFor(key: HeardKey, { inDialog, textSelected, ...state }: HeardState): Command | null {
  if (key.isComposing || key.defaultPrevented || inDialog) return null;
  const command = commandFor(key, state);
  if ((command === 'copyNote' || command === 'copyAll') && textSelected) return null;
  return command;
}

/** The command a key gives; null when it is no shortcut here. Shortcuts belong to the wide tier only. */
export function commandFor(press: KeyPress, state: CommandState): Command | null {
  const { panelOpen = false, typing = false, unsavedChanges = false } = state;
  if (wideLayout(state).tier !== 'wide') return null;
  // ⌘⇧C arrives as `C`, and Caps Lock makes `N`. By Turkish rules `I` lowers to `ı`:
  // a shortcut on I must be matched as `ı`.
  const key = press.key.toLocaleLowerCase('tr');
  const command = press.metaKey || press.ctrlKey;
  // Esc steps back one thing at a time: the edit, then the panel, then the page.
  if (key === 'escape') return unsavedChanges ? 'askDiscard' : panelOpen ? 'closePanel' : 'back';
  // ⌥⌘ is the browser's, and AltGr reports Ctrl+Alt while typing a character.
  if (press.altKey) return null;
  if (command) {
    if (key === 'k') return 'quickSearch';
    if (key === 'enter') return 'submit';
    if (key === 'c' && !typing) return press.shiftKey ? 'copyAll' : 'copyNote';
    return null;
  }
  // Shift is how some layouts make `/`, so it does not spoil a plain key.
  if (typing) return null;
  if (key === 'n') return 'capture';
  if (key === 'e') return 'edit';
  if (key === '/') return 'searchHere';
  if (key === 'arrowup') return 'previous';
  if (key === 'arrowdown') return 'next';
  return null;
}
