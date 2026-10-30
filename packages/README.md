# Packages

Each workspace package here is a **deep module**: a lot of behaviour behind a small interface. The interface is the package's **entry points**, the files directly in its `src/`. Everything in a subfolder of `src/` is hidden.

```
packages/
  <name>/
    package.json     "exports" points at the entry points
    src/
      index.ts       ← an entry point. Import this from outside.
      client.ts      ← another entry point. A package may expose several.
      lib/           ← implementation: hidden from outside, free to import each other.
      tests/         ← tests and fixtures: they go through the entry points too.
```

To start a package, copy [`example/`](./example/) and rename it, or delete `example/` once you no longer need the template.

**Prefer several small entry points over a barrel.** Don't make one `index.ts` that re-exports a whole subtree. Add a root file for each part of the interface (`index.ts`, `client.ts`, `server.ts`) and list it in `package.json` `"exports"`. Keep the implementation in `lib/`.

## Rules

[dependency-cruiser](../.dependency-cruiser.cjs) enforces these rules. Run `pnpm lint:boundaries`. It also runs in CI and in the pre-commit hook.

**Entry-point boundary.** Code outside a package, whether `apps/*` or another package, may import only that package's entry points (`packages/<name>/src/*.ts`). It may never import anything in a subfolder such as `src/lib/`.

**Intra-package freedom.** A package's own files import each other freely, in any folder.

**Tests through the entry points.** Files in `src/tests/` may import any package's entry points and their own `tests/` fixtures. They may never import any package's internals, not even their own. Nothing outside `tests/` may import from it.

**No cycles.** There are no dependency cycles anywhere in `apps/` or `packages/`.

Packages are flat: one level under `packages/`, and a package never contains another. Any subfolder of `src/` is private, so a new folder never needs a config change. Which packages may depend on which (layering) is a separate concern. The config has a commented stub for it.
