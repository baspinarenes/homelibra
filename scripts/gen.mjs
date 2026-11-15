// `pnpm gen`: new files where they belong, in the house shape.
//
//   pnpm gen component <area> <name>   apps/app/src/features/<area>/<name>.tsx
//   pnpm gen component shared <name>   apps/app/src/components/<name>.tsx
//   pnpm gen ui <name>                 a @homelibra/ui component: lib/<name>.tsx, its
//                                      entry, its export and a test
//
// <area> is one of the features/ folders, named after GLOSSARY.md; a new one needs
// --new-area (and a line in apps/app/README.md). <name> is kebab case. Nothing is
// overwritten.

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));

export const usage = `Usage:
  pnpm gen component <area> <name> [--new-area]
  pnpm gen component shared <name>
  pnpm gen ui <name>`;

const kebabName = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

// source-badge → SourceBadge (an ASCII shift: names are a-z, and Turkish rules would make i İ)
export const pascal = (name) =>
  name
    .split('-')
    .map((w) => String.fromCharCode(w.charCodeAt(0) - 32) + w.slice(1))
    .join('');

export function componentFile(name, textImport) {
  return `import { View } from 'react-native';

import { Text } from '${textImport}';

type Props = {
  title: string;
};

/** What this shows, in GLOSSARY.md's words. */
export function ${pascal(name)}({ title }: Props) {
  return (
    <View className="gap-sm">
      <Text variant="body">{title}</Text>
    </View>
  );
}
`;
}

export function uiTestFile(name) {
  return `import { describe, expect, it } from 'vitest';

import { ${pascal(name)} } from '../${name}';
import { render, text } from './render';

describe('${pascal(name)}', () => {
  it('shows its title', () => {
    expect(text(render(<${pascal(name)} title="Deneme" />))).toBe('Deneme');
  });
});
`;
}

// Every file `args` asks for, as [path relative to the repo, contents], or an error.
export function plan(args, { areas, uiExports }) {
  const [kind, ...rest] = args.filter((a) => !a.startsWith('--'));
  const newArea = args.includes('--new-area');
  if (kind === 'component') {
    const [area, name] = rest;
    if (!area || !name) return { error: usage };
    if (!kebabName.test(name)) return { error: `"${name}" is not kebab case (source-badge).` };
    if (area === 'shared') {
      return { files: [[`apps/app/src/components/${name}.tsx`, componentFile(name, '@homelibra/ui/text')]] };
    }
    if (!kebabName.test(area)) return { error: `"${area}" is not kebab case.` };
    if (!areas.includes(area) && !newArea) {
      return {
        error: `No area "${area}". Areas: ${areas.join(', ')}, or shared. A new area takes --new-area and a line in apps/app/README.md.`,
      };
    }
    return { files: [[`apps/app/src/features/${area}/${name}.tsx`, componentFile(name, '@homelibra/ui/text')]] };
  }
  if (kind === 'ui') {
    const [name] = rest;
    if (!name) return { error: usage };
    if (!kebabName.test(name)) return { error: `"${name}" is not kebab case (source-badge).` };
    if (uiExports[`./${name}`]) return { error: `@homelibra/ui/${name} exists already.` };
    return {
      files: [
        [`packages/ui/src/lib/${name}.tsx`, componentFile(name, './text')],
        [`packages/ui/src/${name}.ts`, `export { ${pascal(name)} } from './lib/${name}';\n`],
        [`packages/ui/src/tests/${name}.test.tsx`, uiTestFile(name)],
      ],
      exportEntry: [`./${name}`, `./src/${name}.ts`],
    };
  }
  return { error: usage };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const uiPackage = join(root, 'packages/ui/package.json');
  const ui = JSON.parse(readFileSync(uiPackage, 'utf8'));
  const areas = readdirSync(join(root, 'apps/app/src/features'), { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
  const result = plan(process.argv.slice(2), { areas, uiExports: ui.exports });
  if (result.error) {
    console.error(result.error);
    process.exit(1);
  }
  const taken = result.files.filter(([path]) => existsSync(join(root, path)));
  if (taken.length) {
    console.error(`Already there, nothing written: ${taken.map(([p]) => p).join(', ')}`);
    process.exit(1);
  }
  for (const [path, contents] of result.files) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), contents);
    console.log(`wrote ${path}`);
  }
  if (result.exportEntry) {
    const [key, value] = result.exportEntry;
    ui.exports[key] = value;
    writeFileSync(uiPackage, `${JSON.stringify(ui, null, 2)}\n`);
    console.log(`added ${key} to packages/ui/package.json exports`);
  }
}
