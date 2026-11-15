import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * app.json is the app as preview and production build it. APP_VARIANT=development
 * (EAS's development profile, and `pnpm dev`) makes the dev build an app of its
 * own: its own package, scheme and name, so it installs beside the beta app and
 * never shares its sign-in or outbox.
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const app = config as ExpoConfig;
  if (process.env.APP_VARIANT !== 'development') return app;
  return {
    ...app,
    name: 'Homelibra Dev',
    scheme: 'homelibra-dev',
    android: { ...app.android, package: 'app.homelibra.dev' },
    ios: { ...app.ios, bundleIdentifier: 'app.homelibra.dev' },
  };
};
