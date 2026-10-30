CREATE TYPE "public"."lookup_kind" AS ENUM('doi', 'isbn');--> statement-breakpoint
CREATE TABLE "lookup_cache" (
	"kind" "lookup_kind" NOT NULL,
	"identifier" text NOT NULL,
	"provider" text NOT NULL,
	"response" jsonb,
	"fetched_at" timestamp with time zone NOT NULL,
	CONSTRAINT "lookup_cache_kind_identifier_pk" PRIMARY KEY("kind","identifier")
);
