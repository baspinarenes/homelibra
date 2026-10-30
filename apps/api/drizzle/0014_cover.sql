ALTER TABLE "source" ADD COLUMN "cover_key_large" text;--> statement-breakpoint
ALTER TABLE "source" ADD COLUMN "cover_key_small" text;--> statement-breakpoint
ALTER TABLE "source" ADD CONSTRAINT "source_cover_keys_together" CHECK (("source"."cover_key_large" is null) = ("source"."cover_key_small" is null));--> statement-breakpoint
-- Hand-written: the Cover clean-up job (ADR-0011) asks which of the bucket's
-- files are still in use, in every Library, which row-level security hides
-- from homelibra_app outside a Library transaction. This function runs as the
-- tables' owner and answers that one question: of `keys`, the ones a Source
-- points at, or that a Geri al still in its time would bring back.
CREATE FUNCTION hl_cover_keys_in_use(keys text[], at timestamptz) RETURNS SETOF text
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
  AS $$
    SELECT k FROM unnest(keys) k
     WHERE EXISTS (SELECT FROM source s WHERE s.cover_key_large = k OR s.cover_key_small = k)
        OR EXISTS (SELECT FROM undo_record u
                    WHERE u.expires_at > at AND u.undone_at IS NULL
                      AND jsonb_path_exists(u.snapshot, '$.** ? (@ == $k)', jsonb_build_object('k', k)))
  $$;--> statement-breakpoint
REVOKE ALL ON FUNCTION hl_cover_keys_in_use(text[], timestamptz) FROM PUBLIC;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION hl_cover_keys_in_use(text[], timestamptz) TO homelibra_app;
