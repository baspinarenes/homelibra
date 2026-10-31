import { defineConfig } from 'vitest/config';

// The components render to HTML through react-native-web, as the app's web
// build draws them, so a test reads what a screen reader would get.
const native = [/react-native-svg/, /lucide-react-native/, /react-native-safe-area-context/];

const resolve = {
  alias: [
    { find: /^react-native$/, replacement: `${import.meta.dirname}/src/tests/react-native.tsx` },
    {
      find: '@react-native/assets-registry/registry',
      replacement: `${import.meta.dirname}/src/tests/assets-registry.ts`,
    },
  ],
  extensions: ['.web.tsx', '.web.ts', '.web.js', '.tsx', '.ts', '.mjs', '.js', '.json'],
  // Their ES module build, which picks the .web files; the CommonJS one would load React Native itself.
  mainFields: ['module', 'main'],
};

export default defineConfig({
  resolve,
  environments: { ssr: { resolve } },
  test: { server: { deps: { inline: native } } },
});
