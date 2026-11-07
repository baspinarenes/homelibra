import assert from 'node:assert/strict';
import { test } from 'node:test';

import { bumpVersion, checkVersionBump, shipsInApp } from './version-bump.mjs';

test('the app and the packages it bundles ship; tests, docs, the API and CI do not', () => {
  for (const path of [
    'apps/app/src/app/(tabs)/settings/index.tsx',
    'apps/app/app.json',
    'packages/ui/src/lib/sheet.tsx',
    'packages/core/src/errors.ts',
  ]) {
    assert.equal(shipsInApp(path), true, path);
  }
  for (const path of [
    'apps/api/src/routers/account.ts',
    'packages/ui/src/tests/sheet.test.tsx',
    'packages/README.md',
    'packages/example/src/index.ts',
    'docs/adr/0001-x.md',
    '.github/workflows/ci.yml',
    'scripts/version-bump.mjs',
  ]) {
    assert.equal(shipsInApp(path), false, path);
  }
});

test('a PR that ships in the app needs a higher version than its base', () => {
  const changedFiles = ['apps/app/src/components/legal-document.tsx'];
  assert.equal(checkVersionBump({ changedFiles, baseVersion: '0.1.0', headVersion: '0.1.0' }).ok, false);
  assert.equal(checkVersionBump({ changedFiles, baseVersion: '0.1.1', headVersion: '0.1.0' }).ok, false);
  assert.equal(checkVersionBump({ changedFiles, baseVersion: '0.1.0', headVersion: '0.1.1' }).ok, true);
  assert.equal(checkVersionBump({ changedFiles, baseVersion: '0.1.9', headVersion: '0.2.0' }).ok, true);
  // Compared as numbers, not as text: 0.1.10 comes after 0.1.9.
  assert.equal(checkVersionBump({ changedFiles, baseVersion: '0.1.9', headVersion: '0.1.10' }).ok, true);
});

test('a PR that ships nothing in the app passes with the version it had', () => {
  const changedFiles = ['apps/api/src/routers/account.ts', 'docs/agents/domain.md'];
  assert.equal(checkVersionBump({ changedFiles, baseVersion: '0.1.0', headVersion: '0.1.0' }).ok, true);
});

test('the failure names the files that ship and the version to beat', () => {
  const result = checkVersionBump({
    changedFiles: ['apps/app/app.json', 'apps/app/src/i18n/tr.ts', 'docs/x.md'],
    baseVersion: '0.1.0',
    headVersion: '0.1.0',
  });
  assert.equal(result.ok, false);
  assert.match(result.message, /0\.1\.0/);
  assert.match(result.message, /apps\/app\/src\/i18n\/tr\.ts/);
  assert.doesNotMatch(result.message, /docs\/x\.md/);
});

test('a version that is not major.minor.patch is refused', () => {
  const changedFiles = ['apps/app/app.json'];
  assert.throws(() => checkVersionBump({ changedFiles, baseVersion: '0.1.0', headVersion: '0.2' }), /0\.2/);
  assert.throws(() => checkVersionBump({ changedFiles, baseVersion: '0.1.0', headVersion: '0.2.0-beta' }));
});

test('a bump raises one part and zeroes the parts after it', () => {
  assert.equal(bumpVersion('0.1.9', 'patch'), '0.1.10');
  assert.equal(bumpVersion('0.1.9', 'minor'), '0.2.0');
  assert.equal(bumpVersion('0.1.9', 'major'), '1.0.0');
  assert.throws(() => bumpVersion('0.1.9', 'build'), /build/);
});
