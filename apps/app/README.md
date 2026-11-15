# App layout

```
src/
  app/              routes (Expo Router): thin screens that put features together
  features/<area>/  an area's components and hooks; areas are named after GLOSSARY.md
    account/        sign-in, sign-out, closing the account
    collection/     Collections and the Dizin tab's order
    library/        Genel Bakış (overview) and the Library export
    note/           Capture: the composer, Locators, unsent notes
    privacy/        the privacy notice and terms
    search/         Search and its filters
    source/         Sources: the form, covers, reading status
    tag/            Tags: chips, picker, actions
  components/       shared by several areas, with no area of its own (tab stack, undo bar)
  lib/              plumbing with no screen: tRPC, auth, outbox, network, Sentry, theme choice
  i18n/             Turkish strings
  global.css        Tailwind (Uniwind) entry: imports the design system's theme
```

A screen imports from `features/`, `components/` and `lib/`. A feature may import another feature. Anything both the app and the API need goes in a package (`packages/README.md`), and a component every screen could use goes in `@homelibra/ui`.

Styling is Tailwind classes through Uniwind (`className`), with tokens from `@homelibra/ui` (`bg-page`, `text-fg`, `p-md`, `rounded-control`, `type-body`). `pnpm gen:theme` regenerates the classes after a token change.

New files come from `pnpm gen component <area> <name>`.
