import {
  type Operation,
  openOutbox,
  type Outbox,
  type OutboxState,
  type OutboxStorage,
  type Receipt,
  type Reply,
  type StoredOperation,
  type Transport,
} from '@homelibra/outbox';
import { TRPCClientError } from '@trpc/client';
import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react';
import { AppState } from 'react-native';

import { authClient } from './auth-client';
import { useOffline } from './network';
import { sendOperation, undoOperation } from './send-operation';

// The phone's outbox (ADR-0008): operations wait in a small expo-sqlite
// table and are sent in order when the app comes to the foreground or the
// network returns. Only native builds see this file; the web's outbox.tsx
// has none, so SQLite never enters the web bundle.

export type ApplyOperation = (operation: Operation) => Promise<Receipt>;

/** How often waiting operations are tried again while online, after a send failed. */
const retryEvery = 30_000;

const nothingWaiting: OutboxState = { pending: [], status: new Map(), waiting: 0 };
const noSubscription = () => () => {};
const noState = () => nothingWaiting;

let database: SQLiteDatabase | null = null;
function outboxDatabase() {
  if (!database) {
    database = openDatabaseSync('outbox.db');
    database.execSync(
      'create table if not exists outbox (seq integer primary key autoincrement, account_id text not null, operation text not null)',
    );
  }
  return database;
}

/**
 * The outbox table, one Account's rows at a time: what one scholar left
 * waiting is never sent with another's session on the same phone.
 */
function sqliteStorage(accountId: string): OutboxStorage {
  const db = outboxDatabase();
  return {
    async list() {
      const rows = await db.getAllAsync<{ seq: number; operation: string }>(
        'select seq, operation from outbox where account_id = ? order by seq',
        accountId,
      );
      return rows.map((row): StoredOperation => ({ seq: row.seq, operation: JSON.parse(row.operation) }));
    },
    async add(operation) {
      const result = await db.runAsync(
        'insert into outbox (account_id, operation) values (?, ?)',
        accountId,
        JSON.stringify(operation),
      );
      return result.lastInsertRowId;
    },
    async replace(seq, operation) {
      await db.runAsync('update outbox set operation = ? where seq = ?', JSON.stringify(operation), seq);
    },
    async remove(seq) {
      await db.runAsync('delete from outbox where seq = ?', seq);
    },
  };
}

/** The API's "kaynak yok" (apps/api routers/notes.ts). */
const SOURCE_NOT_FOUND = 'SOURCE_NOT_FOUND';
/** Answers the server will give an operation every time it is sent: waiting would not change them. */
const refusals = new Set(['BAD_REQUEST', 'NOT_FOUND', 'CONFLICT']);

/**
 * The outbox's way to the API. A lost connection, a server error or an
 * expired session reject, and the operation waits to be sent again; a
 * refusal the server would repeat is answered, so the queue can go on.
 */
const transport: Transport = {
  async send(operation): Promise<Reply> {
    try {
      const { undoToken } = await sendOperation(operation);
      return { outcome: 'done', undoToken };
    } catch (error) {
      if (!(error instanceof TRPCClientError)) throw error;
      if (error.message === SOURCE_NOT_FOUND) return { outcome: 'sourceGone' };
      if (refusals.has(error.data?.code)) return { outcome: 'refused' };
      throw error;
    }
  },
  undo: undoOperation,
};

type OutboxValue = { apply: ApplyOperation; state: OutboxState; drain: () => Promise<void> };
const OutboxContext = createContext<OutboxValue | null>(null);

export function OutboxProvider({ children }: { children: ReactNode }) {
  const { data: session } = authClient.useSession();
  const accountId = session?.user.id ?? null;
  const opening = useMemo(
    () => (accountId ? openOutbox({ storage: sqliteStorage(accountId), transport }) : null),
    [accountId],
  );
  const [outbox, setOutbox] = useState<Outbox | null>(null);
  useEffect(() => {
    let current = true;
    setOutbox(null);
    opening?.then((opened) => current && setOutbox(opened)).catch(() => {});
    return () => {
      current = false;
    };
  }, [opening]);

  const state = useSyncExternalStore(outbox?.subscribe ?? noSubscription, outbox?.state ?? noState);
  const offline = useOffline();
  const waiting = state.waiting > 0;

  // Opened, or the network is back: send what waits.
  useEffect(() => {
    if (outbox && !offline) void outbox.drain();
  }, [outbox, offline]);
  // The app comes to the foreground.
  useEffect(() => {
    if (!outbox) return;
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active') void outbox.drain();
    });
    return () => subscription.remove();
  }, [outbox]);
  // Online but a send failed (the API was down, say): try again now and then.
  useEffect(() => {
    if (!outbox || offline || !waiting) return;
    const timer = setInterval(() => void outbox.drain(), retryEvery);
    return () => clearInterval(timer);
  }, [outbox, offline, waiting]);

  const apply = useCallback<ApplyOperation>(
    async (operation) => {
      if (!opening) throw new Error('Signed out');
      return (await opening).apply(operation);
    },
    [opening],
  );
  const drain = useCallback(async () => {
    if (opening) await (await opening).drain();
  }, [opening]);
  const value = useMemo(() => ({ apply, state, drain }), [apply, state, drain]);
  return <OutboxContext value={value}>{children}</OutboxContext>;
}

/**
 * "İşlemi uygula", the screens' one way to change Notes, and what is
 * waiting to be sent. A screen does not know whether it is online: `apply`
 * resolves once the operation is safe (sent on the web, queued here) and
 * rejects when it is not. `drain` sends what waits, before an online-only
 * operation such as Düzenle mode.
 */
export function useOutbox(): OutboxValue {
  const value = useContext(OutboxContext);
  if (!value) throw new Error('useOutbox needs an OutboxProvider');
  return value;
}
