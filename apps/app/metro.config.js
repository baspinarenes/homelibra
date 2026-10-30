// Sentry's serializer adds debug IDs so uploaded source maps match the bundle.
const { getSentryExpoConfig } = require('@sentry/react-native/metro');

module.exports = getSentryExpoConfig(__dirname, {
  // Report render errors that Expo Router's per-route ErrorBoundary would swallow.
  autoWrapExpoRouterErrorBoundary: true,
});
