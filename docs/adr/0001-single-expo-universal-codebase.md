---
status: accepted
---

# One Expo universal codebase for Android, iOS and web

Homelibra is built by one developer, must be a native mobile app (capture happens on the phone while reading) and must also run on the web (the organizing pass and topic retrieval happen on a desktop while writing). We build a single Expo codebase (Expo Router, react-native-web) that targets Android, iOS and web, rather than a web app first or an Android-only app first. The deciding reason is that any platform-first order creates a second UI codebase later, which is the most expensive mistake for a solo developer; one codebase lets every screen be written once.

## Considered options

- **Web first (Next.js), mobile later with Expo.** Fastest to ship and strongest for a dense desktop UI, but phone capture through a browser has high friction and a later native app means rewriting every screen.
- **Android only first, web later.** Solves the author's own problem fastest, but a multi-user beta depends on Google Play's closed-testing rule for new developer accounts, retrieval while writing is poor on a phone, and iOS users are excluded.
- **Expo universal (chosen).** Capture is native from day one, the web build comes from the same code, and iOS later costs only distribution work.

## Consequences

- Polish order follows the two halves of the workflow, not the platform: Android capture, then web retrieval, then web capture and Android retrieval, then iOS distribution.
- The web build feels like an app rather than a website. Marketing or landing pages, SEO and server rendering are handled by a separate static page if ever needed, not by the app.
- Library choices are limited to those with working web support; backend and auth providers are judged on the maturity of their Expo and web SDKs.
- If the web build ever needs what react-native-web cannot deliver, the web client can be split into a Next.js app while the backend and domain packages stay shared in the monorepo. This closes no door; it defers one.
