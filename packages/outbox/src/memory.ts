// An outbox table that lives only as long as the page or the test: for
// tests, here and in the apps, that open an Outbox without a device.
export { memoryStorage } from './lib/memory';
