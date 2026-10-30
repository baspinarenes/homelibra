CREATE TYPE "public"."reading_status" AS ENUM('reading', 'finished');--> statement-breakpoint
ALTER TABLE "source" ADD COLUMN "reading_status" "reading_status" DEFAULT 'reading' NOT NULL;