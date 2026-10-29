-- Hand-written: the second layer of Library isolation (ADR-0006).
--
-- Each API request runs in a transaction that sets app.user_id to the
-- signed-in Account (withLibrary in src/db/client.ts). These policies show
-- homelibra_app only that Account's rows, so a query that forgets its
-- account filter finds nothing from another Library. With app.user_id unset
-- (or reset to '' once a pooled connection's transaction ends) no row matches.
--
-- Every new Library table gets the same two statements.

CREATE FUNCTION library_account_id() RETURNS uuid
  LANGUAGE sql STABLE
  AS $$ SELECT nullif(current_setting('app.user_id', true), '')::uuid $$;--> statement-breakpoint

ALTER TABLE source ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY source_library ON source
  USING (account_id = library_account_id())
  WITH CHECK (account_id = library_account_id());
