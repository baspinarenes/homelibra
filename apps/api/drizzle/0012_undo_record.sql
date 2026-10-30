CREATE TABLE "undo_record" (
	"id" uuid PRIMARY KEY NOT NULL,
	"account_id" uuid NOT NULL,
	"snapshot" jsonb NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"undone_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "note" ADD COLUMN "entered_source_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "undo_record" ADD CONSTRAINT "undo_record_account_id_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "undo_record_account_id_idx" ON "undo_record" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "undo_record_expires_at_idx" ON "undo_record" USING btree ("expires_at");--> statement-breakpoint
-- Hand-written: Notes captured before this column came into their Source when they reached the server.
UPDATE note SET entered_source_at = created_at;--> statement-breakpoint
-- Hand-written: Library isolation (ADR-0006), as in 0002_library_isolation.
ALTER TABLE undo_record ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY undo_record_library ON undo_record
  USING (account_id = library_account_id())
  WITH CHECK (account_id = library_account_id());--> statement-breakpoint
-- Hand-written: the clean-up job sweeps every Library's expired records, which
-- row-level security hides from homelibra_app outside a Library transaction.
-- This function runs as the table's owner and can do that one thing only.
CREATE FUNCTION hl_delete_expired_undo_records(at timestamptz) RETURNS integer
  LANGUAGE sql SECURITY DEFINER SET search_path = public, pg_temp
  AS $$
    WITH gone AS (DELETE FROM undo_record WHERE expires_at <= at RETURNING 1)
    SELECT count(*)::int FROM gone
  $$;--> statement-breakpoint
REVOKE ALL ON FUNCTION hl_delete_expired_undo_records(timestamptz) FROM PUBLIC;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION hl_delete_expired_undo_records(timestamptz) TO homelibra_app;