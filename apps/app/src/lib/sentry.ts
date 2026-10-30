import * as Sentry from '@sentry/react-native';
import { isRunningInExpoGo } from 'expo';

// Import before anything else in the root layout so startup errors are caught.
// The DSN is public: it only lets the app send events to this project.
Sentry.init({
  dsn: 'https://f4157df8af4df9d5f32b3c519cb7dab6@o4512344105025536.ingest.de.sentry.io/4512344129863760',
  environment: __DEV__ ? 'development' : 'production',
  tracesSampleRate: __DEV__ ? 1.0 : 0.1,
  // Replays mask all text and images by default; a reader's Library stays private.
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: __DEV__ ? 1.0 : 0.05,
  integrations: [Sentry.mobileReplayIntegration()],
  enableLogs: true,
  // Slow and frozen frames need a native build; Expo Go only runs JS.
  enableNativeFramesTracking: !isRunningInExpoGo(),
});
