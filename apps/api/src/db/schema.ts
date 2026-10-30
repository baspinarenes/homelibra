import type { CalendarDate } from '@homelibra/core/date';
import { type SourceFieldValues, sourceTypes } from '@homelibra/core/source';
import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  customType,
  doublePrecision,
  foreignKey,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
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
  /** When the scholar accepted the terms of use on their first sign-in; the Library stays closed until then. */
  termsAcceptedAt: timestamp('terms_accepted_at', { withTimezone: true }),
  /** The version of the privacy notice and terms of use the app showed at that moment. */
  termsVersion: text('terms_version'),
  /** When the scholar confirmed Hesabı sil. The Account is closed from then on and deleted 14 days later, unless cancelled. */
  deletionRequestedAt: timestamp('deletion_requested_at', { withTimezone: true }),
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

/**
 * The shared lookup cache (ADR-0006): what a provider returned for a
 * normalised DOI or ISBN-13, exactly as it came, for every Library. Not
 * Library data, so no account_id and no row-level security; a scholar's
 * corrections stay in their own Source and never come here.
 */
export const lookupKind = pgEnum('lookup_kind', ['doi', 'isbn']);

export const lookupCache = pgTable(
  'lookup_cache',
  {
    kind: lookupKind('kind').notNull(),
    identifier: text('identifier').notNull(),
    provider: text('provider').$type<'crossref'>().notNull(),
    /** The provider's answer as it came; null when it knew nothing ("bulunamadı"). */
    response: jsonb('response'),
    fetchedAt: timestamp('fetched_at', { withTimezone: true }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.kind, t.identifier] })],
);

/** Written only by the database: search columns are generated from the text (ADR-0010). */
const tsvector = customType<{ data: string }>({ dataType: () => 'tsvector' });

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
    /** The Date as entered: calendar, year and, if known, month and day (ADR-0002). */
    date: jsonb('date').$type<CalendarDate>(),
    /** Orders by Date across calendars; derived from `date` by core, never shown. */
    dateSort: integer('date_sort'),
    /** Type-specific fields by key. A type change only hides the ones the new type lacks. */
    fields: jsonb('fields').$type<SourceFieldValues>().notNull().default({}),
    /**
     * What search matches by word: Başlık, Yazar, Künye notu and the
     * type-specific text fields, through the search functions of 0011_search.
     */
    searchVector: tsvector('search_vector')
      .notNull()
      .generatedAlwaysAs(
        sql`hl_tsvector(title) || hl_tsvector(author) || hl_tsvector(bibliographic_note) || hl_tsvector(hl_fields_text(fields))`,
      ),
    /** The same fields folded to one plain text, for matches inside a word (pg_trgm). */
    searchText: text('search_text')
      .notNull()
      .generatedAlwaysAs(
        sql`hl_fold_text(title || ' ' || coalesce(author, '') || ' ' || coalesce(bibliographic_note, '') || ' ' || coalesce(hl_fields_text(fields), ''))`,
      ),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('source_account_id_idx').on(t.accountId),
    // What note_source_fk points at, so a Note's Source is always in its own Library.
    unique('source_id_account_id_unique').on(t.id, t.accountId),
    index('source_search_vector_idx').using('gin', t.searchVector),
    index('source_search_text_idx').using('gin', sql`${t.searchText} gin_trgm_ops`),
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
    /**
     * What the Locator sorts by (core's compareNotes): derived from it, or
     * corrected by hand until the Locator text changes. Null when it holds no number.
     */
    locatorSort: doublePrecision('locator_sort').array(),
    excerpt: text('excerpt'),
    comment: text('comment'),
    /** What search matches: the Excerpt's and the Comment's words (ADR-0010). Locator is not searched. */
    searchVector: tsvector('search_vector')
      .notNull()
      .generatedAlwaysAs(sql`hl_tsvector(excerpt) || hl_tsvector(comment)`),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('note_source_id_idx').on(t.sourceId, t.id),
    index('note_search_vector_idx').using('gin', t.searchVector),
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
