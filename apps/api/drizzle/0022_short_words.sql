-- Hand-written: the words of a query too short for a prefix match (#144), so
-- the app can say they are searched only as whole words and by their stems
-- (ADR-0005). A word is short by hl_term's rule: under three letters once
-- folded, a hyphenated word joined. Quoted phrases and -words are left out,
-- since they match no prefix anyway. Each word comes back as first typed
-- (case and marks kept), once however it is spelt again, in the order typed;
-- the app counts and folds nothing (ADR-0010). The query is cut as hl_parse
-- cuts it, apart from lowercasing, so combining marks stay inside a word, as
-- in hl_marks.
CREATE FUNCTION hl_short_words(q text) RETURNS text[]
LANGUAGE plpgsql IMMUTABLE STRICT PARALLEL SAFE AS $$
DECLARE
  m text[];
  w text;
  f text;
  folded text[] := '{}';
  short text[] := '{}';
BEGIN
  FOR m IN SELECT regexp_matches(normalize(q, nfc), '(-?)"([^"]*)"|(-?)([^\s"]+)', 'g') LOOP
    CONTINUE WHEN m[4] IS NULL OR m[3] = '-';
    FOR w IN SELECT (regexp_matches(m[4],
        '[[:alnum:]ʿʾ''’ʼ‘̀-ͯ]+(?:-[[:alnum:]ʿʾ''’ʼ‘̀-ͯ]+)*', 'g'))[1] LOOP
      f := hl_fold(hl_clean(replace(hl_lower(w), '-', '')));
      IF char_length(f) BETWEEN 1 AND 2 AND NOT f = ANY(folded) THEN
        folded := folded || f;
        short := short || w;
      END IF;
    END LOOP;
  END LOOP;
  RETURN short;
END $$;
