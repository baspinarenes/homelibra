-- Hand-ordered: the unique key on note must exist before note_tag_note_fk points at it.
ALTER TABLE "note" ADD CONSTRAINT "note_id_account_id_unique" UNIQUE("id","account_id");--> statement-breakpoint
CREATE TABLE "note_tag" (
	"note_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "note_tag_note_id_tag_id_pk" PRIMARY KEY("note_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "source_tag" (
	"source_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "source_tag_source_id_tag_id_pk" PRIMARY KEY("source_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "tag" (
	"id" uuid PRIMARY KEY NOT NULL,
	"account_id" uuid NOT NULL,
	"name" text NOT NULL,
	"identity" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tag_account_id_identity_unique" UNIQUE("account_id","identity"),
	CONSTRAINT "tag_id_account_id_unique" UNIQUE("id","account_id")
);
--> statement-breakpoint
ALTER TABLE "note_tag" ADD CONSTRAINT "note_tag_account_id_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "note_tag" ADD CONSTRAINT "note_tag_note_fk" FOREIGN KEY ("note_id","account_id") REFERENCES "public"."note"("id","account_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "note_tag" ADD CONSTRAINT "note_tag_tag_fk" FOREIGN KEY ("tag_id","account_id") REFERENCES "public"."tag"("id","account_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_tag" ADD CONSTRAINT "source_tag_account_id_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_tag" ADD CONSTRAINT "source_tag_source_fk" FOREIGN KEY ("source_id","account_id") REFERENCES "public"."source"("id","account_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_tag" ADD CONSTRAINT "source_tag_tag_fk" FOREIGN KEY ("tag_id","account_id") REFERENCES "public"."tag"("id","account_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tag" ADD CONSTRAINT "tag_account_id_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "note_tag_tag_id_idx" ON "note_tag" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "source_tag_tag_id_idx" ON "source_tag" USING btree ("tag_id");--> statement-breakpoint
-- Hand-written: Library isolation (ADR-0006), as in 0002_library_isolation.
ALTER TABLE tag ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY tag_library ON tag
  USING (account_id = library_account_id())
  WITH CHECK (account_id = library_account_id());--> statement-breakpoint
ALTER TABLE note_tag ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY note_tag_library ON note_tag
  USING (account_id = library_account_id())
  WITH CHECK (account_id = library_account_id());--> statement-breakpoint
ALTER TABLE source_tag ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY source_tag_library ON source_tag
  USING (account_id = library_account_id())
  WITH CHECK (account_id = library_account_id());--> statement-breakpoint

-- Hand-written: a Tag nothing uses goes by itself (#3), in the transaction
-- that took its last link away, whatever took it: untagging, a Note or a
-- Source deleted (their links cascade), later a Collection letting go of it.
-- An undo that brings the links back brings the Tag back with them (the
-- snapshot holds it; src/tags/snapshot.ts). A table that starts linking Tags
-- (collection_tag, #51) adds its own trigger and a NOT EXISTS here.
CREATE FUNCTION hl_drop_unused_tags() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM tag t
   WHERE t.id IN (SELECT tag_id FROM unlinked)
     AND NOT EXISTS (SELECT FROM note_tag l WHERE l.tag_id = t.id)
     AND NOT EXISTS (SELECT FROM source_tag l WHERE l.tag_id = t.id);
  RETURN NULL;
END
$$;--> statement-breakpoint
CREATE TRIGGER note_tag_drop_unused_tags AFTER DELETE ON note_tag
  REFERENCING OLD TABLE AS unlinked
  FOR EACH STATEMENT EXECUTE FUNCTION hl_drop_unused_tags();--> statement-breakpoint
CREATE TRIGGER source_tag_drop_unused_tags AFTER DELETE ON source_tag
  REFERENCING OLD TABLE AS unlinked
  FOR EACH STATEMENT EXECUTE FUNCTION hl_drop_unused_tags();
