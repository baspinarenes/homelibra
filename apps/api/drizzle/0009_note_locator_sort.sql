ALTER TABLE "note" ADD COLUMN "locator_sort" double precision[];--> statement-breakpoint
-- Hand-written: Notes captured before this column get the value core's
-- locatorSortValue would give them. A one-off copy of that rule; from here on
-- only the API derives it.
UPDATE note SET locator_sort = (
  SELECT array_agg(
    CASE WHEN m[1] IS NOT NULL
      THEN (SELECT sum(p::float8 * 60 ^ (cardinality(string_to_array(m[1], ':')) - i))
            FROM unnest(string_to_array(m[1], ':')) WITH ORDINALITY AS u(p, i))
      ELSE m[2]::float8 + CASE WHEN m[3] IS NOT NULL THEN 0.5 ELSE 0 END
    END ORDER BY n)
  FROM regexp_matches(locator, '(\d+(?::\d+){1,2})|(\d+)(b(?![[:alpha:]]))?', 'g') WITH ORDINALITY AS r(m, n)
) WHERE locator IS NOT NULL;
