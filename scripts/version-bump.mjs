#!/usr/bin/env node
// The app's version is `expo.version` in apps/app/app.json: what Ayarlar →
// Sürüm shows, what EAS builds from (appVersionSource "local", native folders
// generated) and what an EAS Update carries. A PR that changes what ships in
// the app raises it; CI runs `check` on every PR (.github/workflows/ci.yml).
//
//   node scripts/version-bump.mjs check <base-ref>          fail unless raised over <base-ref>
//   node scripts/version-bump.mjs bump <patch|minor|major>  raise it in app.json
//
// `pnpm version:bump patch` runs the second.

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const appJson = 'apps/app/app.json';

/**
 * Whether a changed file ends up in the app or the web build: anything in
 * apps/app and in the packages it bundles, except their tests and docs.
 * packages/example is the template for new packages; nothing imports it.
 */
export function shipsInApp(path) {
  if (path.endsWith('.md')) return false;
  if (path.startsWith('apps/app/')) return true;
  if (!path.startsWith('packages/') || path.startsWith('packages/example/')) return false;
  return !/^packages\/[^/]+\/src\/tests\//.test(path);
}

function parse(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  if (!match) throw new Error(`"${version}" is not a version of the form major.minor.patch (0.1.0).`);
  return match.slice(1).map(Number);
}

function isHigher(head, base) {
  const [a, b] = [parse(head), parse(base)];
  const differs = a.findIndex((part, i) => part !== b[i]);
  return differs !== -1 && a[differs] > b[differs];
}

export function checkVersionBump({ changedFiles, baseVersion, headVersion }) {
  const shipped = changedFiles.filter(shipsInApp);
  if (shipped.length === 0) {
    parse(headVersion);
    return { ok: true, message: `Nothing in this PR ships in the app; ${headVersion} stays.` };
  }
  if (isHigher(headVersion, baseVersion)) {
    return { ok: true, message: `The app's version goes from ${baseVersion} to ${headVersion}.` };
  }
  return {
    ok: false,
    message: [
      `This PR changes what ships in the app, so ${appJson} needs a version above ${baseVersion} (it has ${headVersion}).`,
      'Run `pnpm version:bump patch` (or minor, major) and commit app.json.',
      '',
      'Files that ship:',
      ...shipped.map((path) => `  ${path}`),
    ].join('\n'),
  };
}

const parts = ['major', 'minor', 'patch'];

export function bumpVersion(version, part) {
  const at = parts.indexOf(part);
  if (at === -1) throw new Error(`"${part}" is not one of ${parts.join(', ')}.`);
  return parse(version)
    .map((value, i) => (i < at ? value : i === at ? value + 1 : 0))
    .join('.');
}

function git(...args) {
  return execFileSync('git', args, { encoding: 'utf8' });
}

function versionIn(json) {
  return JSON.parse(json).expo.version;
}

function main([command, argument]) {
  if (command === 'check' && argument) {
    const result = checkVersionBump({
      changedFiles: git('diff', '--name-only', `${argument}...HEAD`).split('\n').filter(Boolean),
      baseVersion: versionIn(git('show', `${argument}:${appJson}`)),
      headVersion: versionIn(readFileSync(appJson, 'utf8')),
    });
    console[result.ok ? 'log' : 'error'](result.message);
    return result.ok ? 0 : 1;
  }
  if (command === 'bump' && argument) {
    const text = readFileSync(appJson, 'utf8');
    const from = versionIn(text);
    const to = bumpVersion(from, argument);
    // Only the version line changes, so app.json keeps its own formatting.
    writeFileSync(appJson, text.replace(`"version": "${from}"`, `"version": "${to}"`));
    console.log(`${appJson}: ${from} → ${to}`);
    return 0;
  }
  console.error('Usage: version-bump.mjs check <base-ref> | bump <patch|minor|major>');
  return 2;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) process.exit(main(process.argv.slice(2)));
