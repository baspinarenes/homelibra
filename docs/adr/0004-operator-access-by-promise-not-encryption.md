---
status: accepted
---

# Libraries are readable by the operator and protected by a promise and a free exit, not by end-to-end encryption

A scholar's library holds unpublished research, so the obvious expectation is that nobody but its owner can read it. Homelibra nevertheless stores libraries so that the server, and therefore the operator, can read them, because full-text search over notes runs on the server (Turkish stemming lives in the database, not on the phone or in the browser) and end-to-end encryption would rule that out. Trust is earned instead by two commitments written into the privacy notice and the terms of use: the operator looks inside a library only when its owner asks for support, and only for that request, and library content is never analysed, used as training data or used for marketing; and the owner can take a complete library export at any time, on every plan, at no cost.

## Considered options

- **End-to-end encryption.** The strongest guarantee, but search would have to run on each device over a locally decrypted copy, which the web client cannot hold well and which loses the server-side Turkish search. Account recovery after a lost key would also lose the library.
- **Readable by the operator, with no stated limits.** Cheapest, and the norm for small tools, but scholars have no reason to trust it with unpublished work.
- **Readable by the operator, limited by a written promise and a free exit (chosen).** Keeps server-side search and simple recovery; the promise limits access and the export means a scholar who stops trusting Homelibra can leave with everything.

## Consequences

- Exceptions to the access promise are legal obligation and a security incident; both are named in the privacy notice.
- Library export can never become a paid feature, and a library is never withheld for payment. Ending the beta, moving to paid plans or shutting Homelibra down is announced at least 30 days ahead so owners can export.
- Any future feature that reads library content outside the owner's own use, such as AI features (out of scope for the MVP), needs a new decision and an updated notice, not a quiet change.
