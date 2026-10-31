// The outbox's way to the API over tRPC (ADR-0008): each operation goes to
// the procedure of its name, and the server's answer becomes the outbox's
// Reply. The client is read by its shape, so this package needs no tRPC.
export { OperationRefused, trpcTransport } from './lib/trpc';
