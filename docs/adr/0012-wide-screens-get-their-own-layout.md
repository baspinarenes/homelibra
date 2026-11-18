---
status: accepted
---

# Wide screens get their own layout, drawn from the same screens

Until now a screen looked the same on desktop web as on the phone, centred in one narrow column (the Collection decision in baspinarenes/homelibra#12, "masaüstü web ve telefonda aynı düzen"). On a desktop that wastes the width and turns every step of retrieval into a page change, so it never felt like a desktop tool. We now give wide screens a layout of their own: a desktop frame with its own navigation, more than one column, hover and focus states and a small set of keyboard shortcuts. The visual identity (tokens, typefaces, unboxed sections, tight corners) stays the same on every width. The wide layout is chosen by window width, not by platform, so a tablet gets it as well as the web. The phone layout does not change.

This keeps ADR-0001: there is still one Expo codebase, and each screen is written once and draws itself differently when it is wide. It is not a second, desktop-only client.

## Considered options

- **One layout on every width (the #12 decision).** Least to build and test, but on a desktop it reads as a stretched phone app.
- **A separate web client for the desktop (e.g. Next.js).** The densest desktop UI, but a second UI codebase, which ADR-0001 rules out for a solo developer.
- **A wide layout per platform (`Platform.OS === 'web'`).** Simple, but leaves tablets with a stretched phone layout and ties the layout to the platform rather than to the space it has.
- **A wide layout by window width, same screens (chosen).**

## Consequences

- Each screen has two layouts to design and test: the phone layout and the wide one. The threshold is about 1024 px; between the phone width and it, screens keep today's rail and single column.
- The wide frame is a 248 px sidebar beside the screen. A detail opens in a panel that sits beside the list, never over it: no drawers, sheets or modals on wide screens. Below about 1200 px, while a panel is open, the sidebar narrows to a 64 px icon rail so the list and the panel keep their width.
- The wide layouts are designed on a Claude Design canvas with variants side by side before any code, and ship together in one pull request.
- Tablets get the wide layout for free but are verified separately; the first release is verified on desktop web only.
