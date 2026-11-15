import { scrubBreadcrumb, scrubEvent } from '@homelibra/core/error-report';
import * as Sentry from '@sentry/react-native';
import { isRunningInExpoGo } from 'expo';

// Import before anything else in the root layout so startup errors are caught.
// The DSN is public: it only lets the app send events to this project.
Sentry.init({
  dsn: 'https://f4157df8af4df9d5f32b3c519cb7dab6@o4512344105025536.ingest.de.sentry.io/4512344129863760',
  environment: __DEV__ ? 'development' : 'production',
  tracesSampleRate: __DEV__ ? 1.0 : 0.1,
  // No session replay (#31): the privacy notice promises error and
  // performance records only. Leave both replay sample rates out; the SDK
  // adds the replay integration as soon as either is a number, even 0.
  // tRPC puts a query's input, such as a search, in the URL that fetch
  // breadcrumbs and spans record; this SDK has no dataCollection to stop it.
  beforeSend: (event) => scrubEvent(event),
  beforeSendTransaction: (event) => scrubEvent(event),
  beforeBreadcrumb: (breadcrumb) => scrubBreadcrumb(breadcrumb),
  enableLogs: true,
  // Slow and frozen frames need a native build; Expo Go only runs JS.
  enableNativeFramesTracking: !isRunningInExpoGo(),
});
