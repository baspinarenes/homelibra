// The wide layout model: tier, sidebar, density, a side column's place and the command a key gives (ADR-0012).
export {
  type Command,
  commandFor,
  type Density,
  type HeardKey,
  type HeardState,
  type Layout,
  shortcutFor,
  sideColumnBeside,
  type Sidebar,
  type Tier,
  wideLayout,
} from './lib/wide-layout';
export { type ShortcutState, useShortcuts, useWideLayout } from './lib/use-wide-layout';
