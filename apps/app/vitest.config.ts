import { defineConfig } from 'vitest/config';

// The app's `@/…` paths (tsconfig.json), so a test and its module import as the app does.
export default defineConfig({
  resolve: { alias: { '@': `${import.meta.dirname}/src` } },
});
