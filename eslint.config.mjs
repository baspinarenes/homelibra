import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// Letter case follows Turkish rules everywhere (I↔ı, İ↔i), so the
// locale-blind case functions are banned. See spec #40, "Platform ve yapı".
const turkishCase = [
  {
    selector: "CallExpression[callee.property.name=/^to(Upper|Lower)Case$/], CallExpression[callee.property.value=/^to(Upper|Lower)Case$/]",
    message: "Use toLocaleUpperCase('tr') / toLocaleLowerCase('tr'); bare case conversion breaks I/ı and İ/i.",
  },
  {
    selector: "CallExpression[callee.property.name=/^toLocale(Upper|Lower)Case$/]:not([arguments.0.value='tr'])",
    message: "Pass the 'tr' locale: toLocaleUpperCase('tr') / toLocaleLowerCase('tr').",
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
      'no-restricted-syntax': ['error', ...turkishCase],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['**/*.cjs', '**/metro.config.js', '**/babel.config.js'],
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
);
