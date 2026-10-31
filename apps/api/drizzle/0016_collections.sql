CREATE TABLE "collection" (
	"id" uuid PRIMARY KEY NOT NULL,
	"account_id" uuid NOT NULL,
	"name" text NOT NULL,
	"include_source_notes" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "collection_id_account_id_unique" UNIQUE("id","account_id")
);
--> statement-breakpoint
CREATE TABLE "collection_tag" (
	"collection_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "collection_tag_collection_id_tag_id_pk" PRIMARY KEY("collection_id","tag_id")
);
--> statement-breakpoint
ALTER TABLE "collection" ADD CONSTRAINT "collection_account_id_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_tag" ADD CONSTRAINT "collection_tag_account_id_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_tag" ADD CONSTRAINT "collection_tag_collection_fk" FOREIGN KEY ("collection_id","account_id") REFERENCES "public"."collection"("id","account_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_tag" ADD CONSTRAINT "collection_tag_tag_fk" FOREIGN KEY ("tag_id","account_id") REFERENCES "public"."tag"("id","account_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "collection_account_id_idx" ON "collection" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "collection_tag_tag_id_idx" ON "collection_tag" USING btree ("tag_id");--> statement-breakpoint
-- Hand-written: Library isolation (ADR-0006), as in 0002_library_isolation.
ALTER TABLE collection ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY collection_library ON collection
  USING (account_id = library_account_id())
  WITH CHECK (account_id = library_account_id());--> statement-breakpoint
ALTER TABLE collection_tag ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY collection_tag_library ON collection_tag
  USING (account_id = library_account_id())
  WITH CHECK (account_id = library_account_id());--> statement-breakpoint

-- Hand-written: a Collection referring to a Tag keeps it alive as a Note or
-- a Source carrying it does (#3), and letting go of its last reference drops
-- it (0013_tags). A Collection deleted takes its references along by cascade.
CREATE OR REPLACE FUNCTION hl_drop_unused_tags() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM tag t
   WHERE t.id IN (SELECT tag_id FROM unlinked)
     AND NOT EXISTS (SELECT FROM note_tag l WHERE l.tag_id = t.id)
     AND NOT EXISTS (SELECT FROM source_tag l WHERE l.tag_id = t.id)
     AND NOT EXISTS (SELECT FROM collection_tag l WHERE l.tag_id = t.id);
  RETURN NULL;
END
$$;--> statement-breakpoint
CREATE TRIGGER collection_tag_drop_unused_tags AFTER DELETE ON collection_tag
  REFERENCING OLD TABLE AS unlinked
  FOR EACH STATEMENT EXECUTE FUNCTION hl_drop_unused_tags();