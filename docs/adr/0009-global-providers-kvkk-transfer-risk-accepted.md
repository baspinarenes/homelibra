---
status: accepted
---

# The beta uses global providers; KVKK cross-border transfer compliance is a known, deferred risk

Under KVKK article 9 (as amended in 2024), keeping Turkish users' personal data with a provider abroad is a cross-border transfer. With no adequacy decision for any country, the lawful route is the Board's standard contract (SS-2) signed unchanged by the provider and notified within five business days; consent is not a basis for routine hosting. None of the providers we use (Hetzner, Resend, Sentry, Expo) has published a commitment to sign it, and the Turkish hosts that would avoid the transfer offer no managed services. The operator chose to build the beta on the best global providers anyway and to treat transfer compliance as an accepted risk, checked before the public release, rather than let it shape the stack. A reader who finds personal data in Germany and the United States with no standard contract on file should know this was deliberate, not an oversight.

## Considered options

- **Host everything in Turkey** (a Turkish VPS, a Turkish email provider, no third-party error tracking or over-the-air updates). No transfer at all, but costs a weaker email option, no crash reporting and no OTA updates during the beta.
- **Global providers, each with a signed SS-2 before any data flows.** Compliant, but depends on providers who have shown no willingness to sign.
- **Global providers now, compliance before release (chosen).**

## Consequences

- The providers that receive personal data are: Hetzner (server and backups, Germany), Resend (sign-in and account emails), Sentry (error reports), Expo (EAS Update requests). Google sign-in is the scholar's own relationship with Google; we only verify the token it returns. GitHub and GHCR receive code, not personal data.
- Everything else from the KVKK research still applies and is not deferred: the privacy notice at sign-up names every recipient above and says the data is kept abroad, deletion completes within 30 days including backups, and breaches are reported within 72 hours.
- Before the public release the risk is reviewed against the checklist in baspinarenes/homelibra#31: for each provider, either a signed and notified SS-2, or a move to a Turkish alternative.
- Adding any new provider that receives personal data adds a line to that checklist and to the privacy notice.
