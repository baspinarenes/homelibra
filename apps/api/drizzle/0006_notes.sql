-- Hand-ordered: the unique key on source must exist before note_source_fk points at it.
ALTER TABLE "source" ADD CONSTRAINT "source_id_account_id_unique" UNIQUE("id","account_id");--> statement-breakpoint
CREATE TABLE "note" (
	"id" uuid PRIMARY KEY NOT NULL,
	"account_id" uuid NOT NULL,
	"source_id" uuid NOT NULL,
	"locator" text,
	"excerpt" text,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "note_has_text" CHECK (coalesce("note"."excerpt" ~ '[^[:space:]]', false) or coalesce("note"."comment" ~ '[^[:space:]]', false))
);
--> statement-breakpoint
ALTER TABLE "note" ADD CONSTRAINT "note_account_id_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "note" ADD CONSTRAINT "note_source_fk" FOREIGN KEY ("source_id","account_id") REFERENCES "public"."source"("id","account_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "note_source_id_idx" ON "note" USING btree ("source_id","id");--> statement-breakpoint
-- Hand-written: Library isolation (ADR-0006), as in 0002_library_isolation.
ALTER TABLE note ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY note_library ON note
  USING (account_id = library_account_id())
  WITH CHECK (account_id = library_account_id());
