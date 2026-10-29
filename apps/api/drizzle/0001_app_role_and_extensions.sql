-- Hand-written: what Drizzle cannot express.

-- Search (ADR-0007, ADR-0010) builds on these; both ship in our image's contrib.
CREATE EXTENSION IF NOT EXISTS unaccent;--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint

-- The API connects as homelibra_app (created by infra/postgres), which owns
-- nothing and so is always subject to row-level security. It may read and
-- write rows, never change the schema.
GRANT USAGE ON SCHEMA public TO homelibra_app;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO homelibra_app;--> statement-breakpoint
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO homelibra_app;
