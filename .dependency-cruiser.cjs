// @ts-check
// Deep-module enforcement for dependency-cruiser.
//
// Each workspace package under the packages root is a DEEP MODULE: a lot of
// behaviour behind a small interface. A package's PUBLIC SURFACE is its ENTRY
// POINTS: the files directly in its source dir (packages/<name>/src/*.ts).
// Implementation lives in SUBFOLDERS of the source dir and is private (by
// convention `lib/` for implementation and `tests/` for tests, though any
// subfolder is private). A package may expose several small entry points
// (index.ts, client.ts, server.ts, …); prefer that over one giant barrel index.
//
// Everything outside the packages root (apps/*) is app code: it may use a
// package's entry points and nothing else.
//
// See packages/README.md for the convention.

/** Where packages live. One immediate child dir per package (flat, no nesting). */
const PACKAGES_ROOT = 'packages';
/** Each workspace package keeps its code in this dir; its root files are the entry points. */
const SOURCE_DIR = 'src';

// --- derived patterns (no need to edit) -------------------------------------
const R = PACKAGES_ROOT;
const S = SOURCE_DIR;
/**
 * A package's private internals: anything nested inside a subfolder of the
 * package's source dir. The source dir's own files are its entry points and are
 * NOT matched here: they stay importable from outside.
 */
const PACKAGE_INTERNALS = `^${R}/[^/]+/${S}/[^/]+/`;

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'entrypoint-boundary-from-app',
      comment:
        "App code may import a package's entry points (the files in its src/), but nothing inside src/'s subfolders.",
      severity: 'error',
      from: { pathNot: `^${R}/` }, // importer is NOT inside any package
      to: { path: PACKAGE_INTERNALS },
    },
    {
      name: 'entrypoint-boundary-across-packages',
      comment:
        "A package's own files import each other freely, but may reach OTHER packages only through their entry points, never their internals.",
      severity: 'error',
      // importer is inside a package ($1), but is not a test file
      from: { path: `^${R}/([^/]+)/`, pathNot: `^${R}/[^/]+/${S}/tests/` },
      to: {
        path: PACKAGE_INTERNALS,
        pathNot: `^${R}/$1/`, // same package → intra-package freedom
      },
    },
    {
      name: 'tests-through-entrypoints',
      comment:
        "A package's tests exercise it through its entry points like everyone else: they may import any package's entry points and their own tests/ fixtures, but never any package's internals, not even their own.",
      severity: 'error',
      from: { path: `^${R}/([^/]+)/${S}/tests/` }, // a test file, in package $1
      to: {
        path: PACKAGE_INTERNALS,
        pathNot: `^${R}/$1/${S}/tests/`, // own tests/ fixtures → allowed
      },
    },
    {
      name: 'tests-folder-is-private',
      comment: "A package's tests/ folder is reachable only from tests: nothing else may import fixtures.",
      severity: 'error',
      from: { pathNot: `^${R}/[^/]+/${S}/tests/` }, // importer is not itself a test
      to: { path: `^${R}/[^/]+/${S}/tests/` },
    },
    {
      name: 'no-circular',
      comment: 'No dependency cycles. Scope to `^${R}/` if you want to allow cycles outside packages.',
      severity: 'error',
      from: {},
      to: { circular: true },
    },

    // --- Layering (optional, off by default) ----------------------------------
    // Interface-hiding controls HOW you import (through the entry points).
    // Layering controls WHICH packages may depend on which. Add your own rules
    // here, e.g.:
    //
    // {
    //   name: "core-may-not-depend-on-apps",
    //   severity: "error",
    //   from: { path: `^${R}/core/` },
    //   to:   { path: `^apps/` },
    // },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: { path: '(^|/)(node_modules|dist|\\.expo|web-build|android|ios)/' },
    // Type-only imports count: `import type` across a boundary is still a dependency.
    tsPreCompilationDeps: true,
    // Lets the cruiser follow apps/app's `@/` alias. Not used by tsc.
    tsConfig: { fileName: 'tsconfig.depcruise.json' },
    enhancedResolveOptions: {
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
      // Workspace packages are reached through their package.json "exports".
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default', 'types'],
    },
  },
};
