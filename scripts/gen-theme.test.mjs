import assert from 'node:assert/strict';
import { test } from 'node:test';

import { palette, space, type } from '../packages/ui/src/lib/tokens.ts';
import { classesTs, themeCss } from './gen-theme.mjs';

const css = themeCss();

test('every colour token gets a variable in both the light and the dark theme', () => {
  const [light, dark] = css.split('@variant dark');
  for (const name of Object.keys(palette.light)) {
    const variable = `--color-${name.replace(/[A-Z]/g, (c) => `-${String.fromCharCode(c.charCodeAt(0) + 32)}`)}:`;
    assert.ok(light.includes(variable), `${variable} in light`);
    assert.ok(dark.includes(variable), `${variable} in dark`);
  }
});

test('class names are ASCII kebab case, whatever the machine locale', () => {
  assert.ok(css.includes('--color-chip-ink:'));
  assert.doesNotMatch(css + classesTs(), /ı/);
});

test('a spacing token becomes a Tailwind spacing step in px', () => {
  assert.ok(css.includes(`--spacing-md: ${space.md}px;`));
});

test('a type token is one class carrying its face, size and line', () => {
  const body = css.slice(css.indexOf('@utility type-body {'));
  const block = body.slice(0, body.indexOf('}'));
  assert.ok(block.includes(`font-size: ${type.body.fontSize}px;`));
  assert.ok(block.includes(`line-height: ${type.body.lineHeight}px;`));
});

test('the class maps spell each class whole, so Tailwind finds it in the source', () => {
  const ts = classesTs();
  assert.ok(ts.includes("chipInk: 'text-chip-ink',"));
  assert.ok(ts.includes("page: 'bg-page',"));
  assert.ok(ts.includes("screenTitle: 'type-screen-title',"));
});
