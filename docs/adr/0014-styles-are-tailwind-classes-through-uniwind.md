---
status: accepted
---

# Styles are Tailwind classes through Uniwind, generated from our tokens

Every screen and `@homelibra/ui` component styles itself with `className`: Tailwind v4 classes that Uniwind turns into React Native styles on Android and iOS, and into CSS on the web. `StyleSheet.create` and `useThemedStyles` are gone. The token file (`packages/ui/src/lib/tokens.ts`) stays the single source. `pnpm gen:theme` writes `theme.css` from it, giving colours as light and dark variables, spacing, corners, faces, `type-*` and `shadow-*` utilities. It also writes `classes.ts`, the whole-class maps for code that picks a class by token name. `pnpm check` fails when either file is stale. The conversion was checked against screenshots: 17 Android routes in light and dark are pixel-identical to before.

## Considered options

- **Keep StyleSheet and `useThemedStyles`.** Works, but every component carries a style object and a theme hook, and the web gets no real CSS.
- **NativeWind v4.** The established choice, but it rides on Tailwind v3 and a Babel transform. We kept it as the fallback if Uniwind failed the spike.
- **Uniwind (chosen).** The free version supports Tailwind v4 with a Metro wrapper and no Babel plugin, and has built-in light/dark through `Uniwind.setTheme`. It passed a spike on web and Android, under Sentry's Metro config and in vitest, before anything was converted.

## Consequences

- Tailwind generates only classes written whole in the source. Code that chooses a look picks one complete string from a map (`looks[tone]`) or from `classes.ts`, and never builds `bg-${name}`.
- On the web, two classes that set the same property are resolved by CSS order, not by the order they were written. So each case gets its own complete string rather than an override.
- ESLint bans `StyleSheet` in the app and in the ui components. It also bans classes that bypass the tokens: written colours, Tailwind's own sizes, lines and faces, and, in the app, corners other than the theme's.
- Values computed at render (safe-area insets, measured heights, data-driven widths and colours, Animated values) stay inline `style`. Colours JavaScript needs (icons, spinners, placeholders, navigation options) still come from `useTheme()`.
- Uniwind wraps React Native's own components. A library component that takes `className` needs `withUniwind` (`components/safe-area-view.tsx`), and `Animated.createAnimatedComponent(View)` replaces `Animated.View`.
- ui tests read the classes a component chose (the test shim renders `className` as `data-class`) instead of computed styles.
- Revisit if Uniwind stops keeping up with Expo or React Native releases. NativeWind is the fallback, and the classes would mostly carry over.
