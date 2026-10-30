import { type SourceFieldValues, sourceTypes } from '@homelibra/core/source';
import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  foreignKey,
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

// Better Auth's models, renamed to the glossary: its "user" is our Account,
// and its "account" (one row per sign-in method) is an account_provider.
// name and image exist only because Better Auth requires them; an Account
// is an email address and nothing more (GLOSSARY.md).

export const account = pgTable('account', {
  id: uuid('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const session = pgTable(
  'session',
  {
    id: uuid('id').primaryKey(),
    accountId: uuid('account_id')
      .notNull()
      .references(() => account.id, { onDelete: 'cascade' }),
    token: text('token').notNull().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('session_account_id_idx').on(t.accountId)],
);

export const accountProvider = pgTable(
  'account_provider',
  {
    id: uuid('id').primaryKey(),
    // Not `accountId`: that is Better Auth's own name for the provider's user
    // id, and its join on the next Google sign-in would read that instead.
    homelibraAccountId: uuid('account_id')
      .notNull()
      .references(() => account.id, { onDelete: 'cascade' }),
    providerAccountId: text('provider_account_id').notNull(),
    providerId: text('provider_id').notNull(),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('account_provider_account_id_idx').on(t.homelibraAccountId)],
);

export const verification = pgTable(
  'verification',
  {
    id: uuid('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('verification_identifier_idx').on(t.identifier)],
);

/**
 * An Invitation: an address the Operator lets open an Account during the
 * closed beta (GLOSSARY.md). Operator data, not Library data, so it has
 * no account_id and no row-level security.
 */
export const invitation = pgTable('invitation', {
  id: uuid('id').primaryKey(),
  email: text('email').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Library tables. Every one carries account_id and is guarded by a row-level
// security policy in a hand-written migration (ADR-0006).

export const sourceType = pgEnum('source_type', sourceTypes);

export const source = pgTable(
  'source',
  {
    id: uuid('id').primaryKey(),
    accountId: uuid('account_id')
      .notNull()
      .references(() => account.id, { onDelete: 'cascade' }),
    type: sourceType('type').notNull(),
    title: text('title').notNull(),
    author: text('author'),
    isbn: text('isbn'),
    doi: text('doi'),
    bibliographicNote: text('bibliographic_note'),
    /** Type-specific fields by key. A type change only hides the ones the new type lacks. */
    fields: jsonb('fields').$type<SourceFieldValues>().notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('source_account_id_idx').on(t.accountId),
    // What note_source_fk points at, so a Note's Source is always in its own Library.
    unique('source_id_account_id_unique').on(t.id, t.accountId),
  ],
);

/**
 * A Note: an Excerpt, a Comment or both, at one Locator of one Source
 * (GLOSSARY.md). Its id is a UUIDv7 made on the device that captured it, so
 * sending it twice is harmless and id order is capture order (ADR-0008).
 */
export const note = pgTable(
  'note',
  {
    id: uuid('id').primaryKey(),
    accountId: uuid('account_id')
      .notNull()
      .references(() => account.id, { onDelete: 'cascade' }),
    sourceId: uuid('source_id').notNull(),
    /** Free-form, as the scholar would cite it; null speaks of the Source as a whole. */
    locator: text('locator'),
    excerpt: text('excerpt'),
    comment: text('comment'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('note_source_id_idx').on(t.sourceId, t.id),
    // Through account_id too: a Note can never sit on another Library's Source.
    foreignKey({
      name: 'note_source_fk',
      columns: [t.sourceId, t.accountId],
      foreignColumns: [source.id, source.accountId],
    }).onDelete('cascade'),
    // An Excerpt or a Comment with something other than whitespace in it.
    check(
      'note_has_text',
      sql`coalesce(${t.excerpt} ~ '[^[:space:]]', false) or coalesce(${t.comment} ~ '[^[:space:]]', false)`,
    ),
  ],
);
