// The wide layout model: tier, sidebar, density and the command a key gives (ADR-0012).
export {
  type Command,
  commandFor,
  type Density,
  type Layout,
  type Sidebar,
  type Tier,
  wideLayout,
} from './lib/wide-layout';
export { type ShortcutState, useShortcuts, useWideLayout } from './lib/use-wide-layout';
