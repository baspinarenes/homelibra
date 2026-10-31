import { scrubBreadcrumb, scrubEvent } from '@homelibra/core/error-report';
import * as Sentry from '@sentry/react-native';
import { isRunningInExpoGo } from 'expo';

// Import before anything else in the root layout so startup errors are caught.
// The DSN is public: it only lets the app send events to this project.
Sentry.init({
  dsn: 'https://f4157df8af4df9d5f32b3c519cb7dab6@o4512344105025536.ingest.de.sentry.io/4512344129863760',
  environment: __DEV__ ? 'development' : 'production',
  tracesSampleRate: __DEV__ ? 1.0 : 0.1,
  // A scholar's Library stays private (#40): replays mask every text, image
  // and vector, stated here rather than trusted to the SDK's defaults.
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: __DEV__ ? 1.0 : 0.05,
  integrations: [Sentry.mobileReplayIntegration({ maskAllText: true, maskAllImages: true, maskAllVectors: true })],
  // tRPC puts a query's input, such as a search, in the URL that fetch
  // breadcrumbs and spans record; this SDK has no dataCollection to stop it.
  beforeSend: (event) => scrubEvent(event),
  beforeSendTransaction: (event) => scrubEvent(event),
  beforeBreadcrumb: (breadcrumb) => scrubBreadcrumb(breadcrumb),
  enableLogs: true,
  // Slow and frozen frames need a native build; Expo Go only runs JS.
  enableNativeFramesTracking: !isRunningInExpoGo(),
});
