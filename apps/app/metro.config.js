// Sentry's serializer adds debug IDs so uploaded source maps match the bundle.
const { getSentryExpoConfig } = require('@sentry/react-native/metro');
const { withUniwindConfig } = require('uniwind/metro');

const config = getSentryExpoConfig(__dirname, {
  // Report render errors that Expo Router's per-route ErrorBoundary would swallow.
  autoWrapExpoRouterErrorBoundary: true,
});

// Uniwind must be the outermost wrapper. It writes the class types to `dtsFile`.
module.exports = withUniwindConfig(config, {
  cssEntryFile: './src/global.css',
  dtsFile: './src/uniwind-types.d.ts',
});
