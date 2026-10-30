ALTER TABLE "account" ADD COLUMN "markdown_copies" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
-- Hand-written: the Operator's usage command (#40, "Operator ve işletim")
-- counts every Library's Notes and Collections, which row-level security
-- hides from homelibra_app outside a Library transaction. This function runs
-- as the tables' owner and returns counts only, never Library content.
CREATE FUNCTION hl_usage_counts()
  RETURNS TABLE (email text, notes integer, collections integer, markdown_copies integer)
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
  AS $$
    SELECT a.email,
           (SELECT count(*) FROM note n WHERE n.account_id = a.id)::int,
           (SELECT count(*) FROM collection c WHERE c.account_id = a.id)::int,
           a.markdown_copies
      FROM account a
     ORDER BY a.email
  $$;--> statement-breakpoint
REVOKE ALL ON FUNCTION hl_usage_counts() FROM PUBLIC;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION hl_usage_counts() TO homelibra_app;
