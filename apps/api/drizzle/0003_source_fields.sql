CREATE TYPE "public"."source_type" AS ENUM('book', 'article', 'thesis', 'archive', 'manuscript', 'periodical', 'recording', 'webPage', 'other');--> statement-breakpoint
-- Sources from before #43 had no type; they become Diğer. New ones must name theirs.
ALTER TABLE "source" ADD COLUMN "type" "source_type" DEFAULT 'other' NOT NULL;--> statement-breakpoint
ALTER TABLE "source" ALTER COLUMN "type" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "source" ADD COLUMN "author" text;--> statement-breakpoint
ALTER TABLE "source" ADD COLUMN "isbn" text;--> statement-breakpoint
ALTER TABLE "source" ADD COLUMN "doi" text;--> statement-breakpoint
ALTER TABLE "source" ADD COLUMN "bibliographic_note" text;--> statement-breakpoint
ALTER TABLE "source" ADD COLUMN "fields" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "source" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;