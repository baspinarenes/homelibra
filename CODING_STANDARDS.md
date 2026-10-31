# Coding standards

Judgement calls for review. Anything a tool can check lives in `eslint.config.mjs` or `.dependency-cruiser.cjs` instead.

## Tests

**A test that shows something is gone first shows it was there.** Before asserting that rows, codes or files are absent, the test creates them (or asserts they exist) so the absence is the code's doing. Otherwise the test passes on an empty setup and guards nothing: the 14th-day test of account deletion checked that no code was left for the deleted address while none had been waiting (#106).
