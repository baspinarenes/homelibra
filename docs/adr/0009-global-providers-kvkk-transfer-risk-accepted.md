---
status: accepted
---

# The beta uses global providers; KVKK cross-border transfer compliance is a known, deferred risk

Under KVKK article 9 (as amended in 2024), keeping Turkish users' personal data with a provider abroad is a cross-border transfer. With no adequacy decision for any country, the lawful route is the Board's standard contract (SS-2) signed unchanged by the provider and notified within five business days; consent is not a basis for routine hosting. None of the providers we use (Hetzner, Resend, Sentry, Expo, Cloudflare) has published a commitment to sign it, and the Turkish hosts that would avoid the transfer offer no managed services. The operator chose to build the beta on the best global providers anyway and to treat transfer compliance as an accepted risk, checked before the app is submitted to a store, rather than let it shape the stack. A reader who finds personal data in Germany and the United States with no standard contract on file should know this was deliberate, not an oversight.

## Considered options

- **Host everything in Turkey** (a Turkish VPS, a Turkish email provider, no third-party error tracking or over-the-air updates). No transfer at all, but costs a weaker email option, no crash reporting and no OTA updates during the beta.
- **Global providers, each with a signed SS-2 before any data flows.** Compliant, but depends on providers who have shown no willingness to sign.
- **Global providers now, compliance checked before the store submission (chosen).**

## Consequences

- The providers that receive personal data are: Hetzner (server and backups, Germany), Resend (sign-in and account emails), Sentry (error and performance records), Expo (EAS Update requests), Cloudflare (Email Routing for mail sent to the contact address). Google sign-in is the scholar's own relationship with Google; we only verify the token it returns. GitHub and GHCR receive code, not personal data.
- Everything else from the KVKK research still applies and is not deferred: the privacy notice at sign-up names every recipient above and says the data is kept abroad, deletion completes within 30 days including backups, and breaches are reported within 72 hours (a draft plan is in `docs/runbooks/veri-ihlali.md`; the Operator has not approved it yet).
- Before the app is submitted to a store the risk is reviewed against the checklist in baspinarenes/homelibra#31: for each provider, either a signed and notified SS-2, or a move to a Turkish alternative.
- Adding any new provider that receives personal data adds a line to that checklist and to the privacy notice.
- The risk was reviewed on 2026-11-15 (`docs/research/kvkk-transfer-enforcement.md`, `docs/research/kvkk-provider-paths.md`), and the Operator chose to stay on Hetzner until the review before the store submission. What that review found:
  - Naming the providers in the privacy notice, or asking for consent at sign-up, does not make the transfer lawful: article 9/6 allows consent only for incidental transfers, and hosting is not one.
  - No provider offers a way to sign SS-2. Resend and Sentry refuse in writing on the plans we use; Hetzner says it signs no individual agreements and has not been asked about SS-2; Expo and Cloudflare publish nothing either way.
  - For the Library and Account data every documented compliant path is a move. The smallest is a restore onto a VPS in Turkey; replacing Sentry, Resend or EAS Update while the server stays in Germany lowers the number of providers, not the transfer.
  - By the Board's practice before the 2024 amendment the exposure is article 18/1-b, 256,357 to 17,092,242 TL in 2026. No published decision applies the amended article 9 yet, so that range is an inference.
