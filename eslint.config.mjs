import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// Letter case follows Turkish rules everywhere (I↔ı, İ↔i), so the
// locale-blind case functions are banned. See spec #40, "Platform ve yapı".
const turkishCase = [
  {
    selector:
      'CallExpression[callee.property.name=/^to(Upper|Lower)Case$/], CallExpression[callee.property.value=/^to(Upper|Lower)Case$/]',
    message: "Use toLocaleUpperCase('tr') / toLocaleLowerCase('tr'); bare case conversion breaks I/ı and İ/i.",
  },
  {
    selector: "CallExpression[callee.property.name=/^toLocale(Upper|Lower)Case$/]:not([arguments.0.value='tr'])",
    message: "Pass the 'tr' locale: toLocaleUpperCase('tr') / toLocaleLowerCase('tr').",
  },
];

// The app's Hermes lacks Array.prototype.toSorted, though TypeScript's ES2023
// lib and Node (where the tests run) both have it. Calling it is a crash on
// every native platform.
const hermesGaps = [
  {
    selector: "MemberExpression[property.name='toSorted']",
    message: 'Hermes has no toSorted; use [...xs].sort(compare).',
  },
];

// The app's screens take every face, colour and corner from @homelibra/ui (#134),
// so a change to the design system reaches them all. The tokens themselves live
// in packages/ui, which this does not cover.
const ownStyle = [
  {
    selector: "Property[key.name='fontFamily'], JSXAttribute[name.name='fontFamily']",
    message: 'Faces come from @homelibra/ui/theme: spread a `type` entry (type.strong for a heavier word) instead.',
  },
  {
    selector:
      'Literal[value=/^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/], Literal[value=/^(?:rgb|hsl)a?\\(/i], TemplateElement[value.raw=/^(?:rgb|hsl)a?\\(/i]',
    message: 'Colours come from @homelibra/ui/theme (`Colors` from useTheme / useThemedStyles); write none in the app.',
  },
  // A named colour ('red'); the written values above are caught already.
  {
    selector:
      "Property[key.name=/[cC]olor$/] > Literal.value:not([value=/^(?:#|rgb|hsl)/i]):not([value='transparent']), JSXAttribute[name.name=/^(?:[a-zA-Z]*[cC]olor|fill|stroke)$/] > Literal:not([value=/^(?:#|rgb|hsl)/i]):not([value='none']):not([value='transparent'])",
    message: 'Colours come from @homelibra/ui/theme (`Colors` from useTheme / useThemedStyles); write none in the app.',
  },
  {
    selector:
      "Property[key.name=/[rR]adius$/][value.type='Literal'], Property[key.name=/[rR]adius$/] > UnaryExpression > Literal, JSXAttribute[name.name=/^(?:rx|ry)$/] Literal",
    message: 'Corners come from `radius` in @homelibra/ui/theme.',
  },
];

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.expo/**',
      '**/web-build/**',
      'apps/app/android/**',
      'apps/app/ios/**',
      'apps/app/expo-env.d.ts',
      '.claude/**',
      '.agents/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
    },
    rules: {
      'no-restricted-syntax': ['error', ...turkishCase, ...hermesGaps],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  // A Note's Sort value is only ever derived (#125): outside core, nothing
  // reads it from a Locator on its own, so it cannot drift from the rule.
  {
    files: ['apps/**', 'packages/outbox/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@homelibra/core/note',
              importNames: ['locatorSortValue'],
              message: "A Note's stored fields come from capturedNote / editedNote; the Sort value rule lives in core.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ['apps/app/**'],
    rules: { 'no-restricted-syntax': ['error', ...turkishCase, ...hermesGaps, ...ownStyle] },
  },
  {
    files: ['**/*.cjs', '**/metro.config.js', '**/babel.config.js'],
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
);
