---
status: accepted
---

# The dev CLI is a Go program in a TypeScript repository

`pnpm dev` asks what to run and on which device, then brings up the local stack: Postgres, migrations, the API, Metro, a booted emulator or simulator, the dev build, and the app opened onto Metro. It started as a bash script that knew only one Android phone on USB. We rewrote it as a small Go program in `tools/dev`, with charmbracelet's huh for the questions, though everything else in the repository is TypeScript. One static binary starts at once and handles processes, signals, process groups and a terminal form cleanly, and Go's standard library already has what a launcher needs. The cost is a second language and toolchain for whoever works on the CLI.

## Considered options

- **Keep bash.** No new toolchain, but questions, device lists, booting and cleanup on Ctrl-C turn into fragile shell that no one tests.
- **Node (TypeScript) with a prompt library.** Same language as the rest, but process groups and signal handling are awkward. A long-lived Node parent also sits between the terminal and Metro.
- **Go (chosen).** Parsers for adb, the emulator and simctl are unit tested. `go.mod`'s toolchain line pins the version, and `go run` fetches it.

## Consequences

- Working on the repo now needs Go (`brew install go`). `scripts/go.sh` finds it, or says how to install it.
- `pnpm check` and CI run `go vet`, `go test` and `go build` on `tools/dev`, so a broken CLI fails the PR like broken TypeScript.
- The CLI only brings the stack up. Every other command (`db:*`, `gen`, `invite`, `e2e`, `check`) stays a root `package.json` script, so the CLI does not grow into a second task runner.
- Revisit if no one who works on the repo wants to touch Go, or if the CLI grows past launching the stack.
