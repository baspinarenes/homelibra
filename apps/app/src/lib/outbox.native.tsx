import {
  type Operation,
  openOutbox,
  type Outbox,
  type OutboxState,
  type OutboxStorage,
  type StoredOperation,
} from '@homelibra/outbox';
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
import { sendOperation } from './send-operation';

// The phone's outbox (ADR-0008): operations wait in a small expo-sqlite
// table and are sent in order when the app comes to the foreground or the
// network returns. Only native builds see this file; the web's outbox.tsx
// has none, so SQLite never enters the web bundle.

export type ApplyOperation = (operation: Operation) => Promise<void>;

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
    async remove(seq) {
      await db.runAsync('delete from outbox where seq = ?', seq);
    },
  };
}

const OutboxContext = createContext<{ apply: ApplyOperation; state: OutboxState } | null>(null);

export function OutboxProvider({ children }: { children: ReactNode }) {
  const { data: session } = authClient.useSession();
  const accountId = session?.user.id ?? null;
  const opening = useMemo(
    () => (accountId ? openOutbox({ storage: sqliteStorage(accountId), transport: { send: sendOperation } }) : null),
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
      await (await opening).apply(operation);
    },
    [opening],
  );
  const value = useMemo(() => ({ apply, state }), [apply, state]);
  return <OutboxContext value={value}>{children}</OutboxContext>;
}

/**
 * "İşlemi uygula", the screens' one way to change Notes, and what is
 * waiting to be sent. A screen does not know whether it is online: `apply`
 * resolves once the operation is safe (sent on the web, queued here) and
 * rejects when it is not.
 */
export function useOutbox(): { apply: ApplyOperation; state: OutboxState } {
  const value = useContext(OutboxContext);
  if (!value) throw new Error('useOutbox needs an OutboxProvider');
  return value;
}
