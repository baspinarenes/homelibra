import assert from 'node:assert/strict';
import { test } from 'node:test';

import { pascal, plan } from './gen.mjs';

const context = { areas: ['source', 'note'], uiExports: { './text': './src/text.ts' } };

test('a component lands in its area, named in Pascal case', () => {
  const { files } = plan(['component', 'source', 'source-badge'], context);
  assert.equal(files[0][0], 'apps/app/src/features/source/source-badge.tsx');
  assert.match(files[0][1], /export function SourceBadge\(/);
  assert.match(files[0][1], /from '@homelibra\/ui\/text'/);
});

test('shared goes to components/', () => {
  assert.equal(
    plan(['component', 'shared', 'empty-state'], context).files[0][0],
    'apps/app/src/components/empty-state.tsx',
  );
});

test('an unknown area is refused unless asked for as new', () => {
  assert.match(plan(['component', 'reading', 'x'], context).error, /No area "reading"/);
  assert.equal(
    plan(['component', 'reading', 'x', '--new-area'], context).files[0][0],
    'apps/app/src/features/reading/x.tsx',
  );
});

test('names must be kebab case', () => {
  assert.match(plan(['component', 'source', 'SourceBadge'], context).error, /kebab case/);
  assert.match(plan(['ui', 'my_thing'], context).error, /kebab case/);
});

test('a ui component brings its entry, its export and a test', () => {
  const result = plan(['ui', 'badge'], context);
  assert.deepEqual(
    result.files.map(([path]) => path),
    ['packages/ui/src/lib/badge.tsx', 'packages/ui/src/badge.ts', 'packages/ui/src/tests/badge.test.tsx'],
  );
  assert.match(result.files[0][1], /from '\.\/text'/);
  assert.deepEqual(result.exportEntry, ['./badge', './src/badge.ts']);
});

test('an existing ui export is refused', () => {
  assert.match(plan(['ui', 'text'], context).error, /exists already/);
});

test('no kind, or an unknown one, prints the usage', () => {
  assert.match(plan([], context).error, /Usage/);
  assert.match(plan(['screen', 'x'], context).error, /Usage/);
});

test('pascal', () => {
  assert.equal(pascal('a-b-c'), 'ABC');
  assert.equal(pascal('note'), 'Note');
});
