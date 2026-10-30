-- Hand-written, apart from the columns and indexes drizzle-kit generated in the
-- middle: the search contract (ADR-0005) as SQL functions (ADR-0010),
-- carried over from the prototype of baspinarenes/homelibra#28. Normalisation
-- and query parsing live only here: the generated columns below and every
-- query go through the same functions, and the API passes the raw query text.
--
-- A word is indexed three times at the same position:
--   '=kır'  raw: Turkish-lowercased, unfolded (the exact spelling ranks first)
--   'kir'   folded: exact matches, and prefix matches ('kir':*)
--   '~kir'  stem set: the word itself and its corrected stem candidates, folded
-- A stem match is the query word's stem set meeting the note word's.
--
-- The functions behind generated columns set search_path, so that a restore
-- (which empties it) can still compute them. Changing any of them, or the
-- unaccent rules, means recomputing those columns.

-- Turkish lowercasing: I → ı, İ → i, then libc lower. NFC first; combining
-- marks with no precomposed form are dropped.
CREATE FUNCTION hl_lower(t text) RETURNS text
LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE AS $$
  SELECT regexp_replace(
    lower(replace(replace(normalize(t, nfc), 'I', 'ı'), 'İ', 'i')),
    '[̀-ͯ]', '', 'g')
$$;--> statement-breakpoint

-- Ayn, hemze and apostrophes go without splitting the word.
CREATE FUNCTION hl_clean(w text) RETURNS text
LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE AS $$
  SELECT translate(w, 'ʿʾ''’ʼ‘', '')
$$;--> statement-breakpoint

-- Light folding: transcription marks go, Turkish letters stay (the stemmer's input).
CREATE FUNCTION hl_light(w text) RETURNS text
LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE AS $$
  SELECT translate(w, 'âîûāīūēōêôḳḥṣṭẓżḏḫġñ', 'aiuaiueoeokhstzzdhgn')
$$;--> statement-breakpoint

-- Full folding: the contract's table (unaccent flattens the Turkish letters
-- and what marks remain), then a word-final b/d → p/t. A b after a digit
-- (vr. 12b) is left alone. unaccent is STABLE; this is marked IMMUTABLE so
-- that it can feed a generated column.
CREATE FUNCTION hl_fold(w text) RETURNS text
LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE AS $$
  SELECT regexp_replace(regexp_replace(unaccent('unaccent', hl_light(w)),
    '([[:alpha:]])b$', '\1p'), '([[:alpha:]])d$', '\1t')
$$;--> statement-breakpoint

-- The stem set. w: one word through hl_lower, apostrophes removed; pre: the
-- part before an apostrophe (Turkish spelling sets a proper noun apart from
-- its suffixes with one: Mehmed'in → mehmed). turkish_stem's output is
-- corrected by three rules, not by a word list:
--   R1  A single -m/-n after a vowel is not a suffix: kadın ≠ kadı+n, yangın,
--       ferman, İslam. When the stemmer cut an n/m off a longer word, the form
--       with n/m is a candidate too (fermanı → ferman, kadının → kadın).
--   R2  A stem that is not the start of the word is dropped, apart from
--       final-consonant softening (p/b, t/d, k/ğ/g, ç/c): the stemmer adds a
--       vowel after d/g (kadim → kadı, Mehmed → mehmedi).
--   R3  Vowel drop is undone: ...VCC + ı/i/u/ü → ...VCVC (vakfı → vakıf, hükmü → hüküm).
CREATE FUNCTION hl_stems(w text, pre text DEFAULT NULL) RETURNS text[]
LANGUAGE plpgsql IMMUTABLE PARALLEL SAFE AS $$
DECLARE
  l text := hl_light(w);
  s text := (ts_lexize('turkish_stem', l))[1];
  c text[] := ARRAY[l];
  m text[];
BEGIN
  IF s IS NOT NULL AND s <> l THEN
    IF s ~ '[aeıioöuü]$' AND l IN (s || 'm', s || 'n') THEN
      NULL;  -- R1
    ELSIF starts_with(l, s)
       OR (s ~ '[ptçk]$' AND starts_with(l, left(s, -1) || translate(right(s, 1), 'ptçk', 'bdcğ')))
       OR (s ~ 'k$' AND starts_with(l, left(s, -1) || 'g')) THEN  -- R2
      c := c || s;
      IF s ~ '[aeıioöuü]$' THEN  -- R1
        IF starts_with(l, s || 'n') THEN c := c || (s || 'n'); END IF;
        IF starts_with(l, s || 'm') THEN c := c || (s || 'm'); END IF;
      END IF;
    END IF;
  END IF;
  m := regexp_match(l, '^(.*([aeıioöuü]))([bcçdfgğhjklmnprsştvyz])([bcçdfgğhjklmnprsştvyz])[ıiuü]');
  IF m IS NOT NULL THEN  -- R3
    c := c || (m[1] || m[3] || translate(m[2], 'aeıioöuü', 'ıiıiuüuü') || m[4]);
  END IF;
  IF char_length(pre) >= 3 THEN
    c := c || hl_light(pre);
  END IF;
  RETURN ARRAY(SELECT DISTINCT hl_fold(x) FROM unnest(c) x);
END $$;--> statement-breakpoint

CREATE FUNCTION hl_pre(w text) RETURNS text
LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE AS $$
  SELECT hl_clean(substring(w FROM '^([^''’ʼ‘]+)[''’ʼ‘]'))
$$;--> statement-breakpoint

-- Words: runs of letters and digits; apostrophes stay inside a word, and a
-- hyphenated compound comes back whole (hl_tsvector splits it).
CREATE FUNCTION hl_split(t text) RETURNS SETOF text
LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE AS $$
  SELECT (regexp_matches(hl_lower(t), '[[:alnum:]ʿʾ''’ʼ‘]+(?:-[[:alnum:]ʿʾ''’ʼ‘]+)*', 'g'))[1]
$$;--> statement-breakpoint

-- One word's lexemes at one position. A run too long to be a word (a pasted
-- hash, a URL without punctuation) is left out rather than failing the write
-- on tsvector's lexeme limit.
CREATE FUNCTION hl_word_lexemes(w text, pos int) RETURNS text[]
LANGUAGE plpgsql IMMUTABLE STRICT PARALLEL SAFE AS $$
DECLARE
  clean text := hl_clean(w);
BEGIN
  IF clean = '' OR char_length(clean) > 200 THEN
    RETURN '{}';
  END IF;
  RETURN ARRAY[format('''=%s'':%s', clean, pos), format('''%s'':%s', hl_fold(clean), pos)]
      || ARRAY(SELECT format('''~%s'':%s', s, pos) FROM unnest(hl_stems(clean, hl_pre(w))) s);
END $$;--> statement-breakpoint

-- A hyphenated compound: its parts at consecutive positions, the joined form
-- at both the first and the last part's position. The compound is then found
-- from either side, a phrase next to it still matches ("kitabı kadim" ↔
-- "Kitâb-ı ḳadîm"), and the copy makes no false phrase match.
CREATE FUNCTION hl_tsvector(t text) RETURNS tsvector
LANGUAGE plpgsql IMMUTABLE PARALLEL SAFE SET search_path = public AS $$
DECLARE
  tok text;
  parts text[];
  part text;
  pos int := 0;
  first int;
  lex text[] := '{}';
BEGIN
  FOR tok IN SELECT hl_split(t) LOOP
    parts := array_remove(string_to_array(tok, '-'), '');
    first := pos + 1;
    FOREACH part IN ARRAY parts LOOP
      pos := pos + 1;
      lex := lex || hl_word_lexemes(part, pos);
    END LOOP;
    IF array_length(parts, 1) > 1 THEN
      lex := lex || hl_word_lexemes(array_to_string(parts, ''), first)
                 || hl_word_lexemes(array_to_string(parts, ''), pos);
    END IF;
  END LOOP;
  RETURN array_to_string(lex, ' ')::tsvector;
END $$;--> statement-breakpoint

-- Source fields folded to plain text, for a part of a word (3+ letters) with pg_trgm.
CREATE FUNCTION hl_fold_text(t text) RETURNS text
LANGUAGE sql IMMUTABLE PARALLEL SAFE SET search_path = public AS $$
  SELECT coalesce(string_agg(
    (SELECT string_agg(hl_fold(hl_clean(p)), ' ') FROM unnest(string_to_array(tok, '-')) p)
      || CASE WHEN tok ~ '-' THEN ' ' || hl_fold(hl_clean(replace(tok, '-', ''))) ELSE '' END,
    ' '), '')
  FROM hl_split(t) tok
$$;--> statement-breakpoint

-- A Source's type-specific text fields as one text; Date fields are not searched.
CREATE FUNCTION hl_fields_text(fields jsonb) RETURNS text
LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE AS $$
  SELECT string_agg(v #>> '{}', ' ') FROM jsonb_each(fields) AS f(k, v) WHERE jsonb_typeof(v) = 'string'
$$;--> statement-breakpoint

-- One query word (possibly hyphenated) as tsquery text for one tier.
CREATE FUNCTION hl_term(w text, mode text) RETURNS text
LANGUAGE plpgsql IMMUTABLE STRICT PARALLEL SAFE AS $$
DECLARE
  clean text := hl_clean(w);
  f text;
BEGIN
  IF clean = '' OR char_length(clean) > 200 THEN
    RETURN NULL;
  END IF;
  f := hl_fold(clean);
  RETURN CASE mode
    WHEN 'raw' THEN format('''=%s''', clean)
    WHEN 'exact' THEN format('''%s''', f)
    WHEN 'stem' THEN (SELECT '(' || string_agg(format('''~%s''', s), ' | ') || ')'
                      FROM unnest(hl_stems(clean, hl_pre(w))) s)
    WHEN 'prefix' THEN CASE WHEN char_length(f) >= 3 THEN format('''%s'':*', f) END
  END;
END $$;--> statement-breakpoint

-- A hyphenated query word: its joined form, or its parts side by side (found from either side).
CREATE FUNCTION hl_item(tok text, mode text) RETURNS text
LANGUAGE plpgsql IMMUTABLE STRICT PARALLEL SAFE AS $$
DECLARE
  parts text[] := array_remove(string_to_array(tok, '-'), '');
  whole text := hl_term(array_to_string(parts, ''), mode);
  ph text;
BEGIN
  IF whole IS NULL OR array_length(parts, 1) = 1 THEN
    RETURN whole;
  END IF;
  SELECT string_agg('(' || coalesce(hl_term(p, CASE WHEN mode = 'prefix' AND i < n THEN 'exact' ELSE mode END),
                                    hl_term(p, 'exact')) || ')', ' <-> ' ORDER BY i)
    INTO ph
    FROM unnest(parts) WITH ORDINALITY AS x(p, i), (SELECT array_length(parts, 1) n) k;
  RETURN '(' || whole || ') | (' || ph || ')';
END $$;--> statement-breakpoint

-- Query parsing: words separated by spaces (all must match), "quotes" for an
-- exact phrase (adjacent, folded, no stem or prefix), -word to exclude (its
-- folded form). No OR. One row per item, with its tsquery text per tier.
CREATE FUNCTION hl_parse(q text)
RETURNS TABLE(positive bool, raw text, ex text, st text, pf text, sub text)
LANGUAGE plpgsql IMMUTABLE STRICT PARALLEL SAFE AS $$
DECLARE
  m text[];
  t text;
  ph text;
BEGIN
  FOR m IN SELECT regexp_matches(hl_lower(q), '(-?)"([^"]*)"|(-?)([^\s"]+)', 'g') LOOP
    IF m[2] IS NOT NULL THEN
      SELECT string_agg('(' || hl_item(x, 'exact') || ')', ' <-> ') INTO ph FROM hl_split(m[2]) x;
      CONTINUE WHEN ph IS NULL;
      RETURN QUERY SELECT m[1] <> '-', NULL::text, ph, NULL::text, NULL::text, NULL::text;
    ELSE
      FOR t IN SELECT hl_split(m[4]) LOOP
        CONTINUE WHEN hl_item(t, 'exact') IS NULL;
        IF m[3] = '-' THEN
          RETURN QUERY SELECT false, NULL::text, hl_item(t, 'exact'), NULL::text, NULL::text, NULL::text;
        ELSE
          RETURN QUERY SELECT true, hl_item(t, 'raw'), hl_item(t, 'exact'), hl_item(t, 'stem'),
            hl_item(t, 'prefix'),
            CASE WHEN char_length(hl_fold(hl_clean(replace(t, '-', '')))) >= 3
                 THEN hl_fold(hl_clean(replace(t, '-', ''))) END;
        END IF;
      END LOOP;
    END IF;
  END LOOP;
END $$;--> statement-breakpoint

-- A text cut into words and the gaps between them, each word marked when it
-- matches a word of the query at any tier, so the app can highlight it
-- without folding anything itself. Phrases mark each of their words.
CREATE FUNCTION hl_marks(t text, q text) RETURNS jsonb
LANGUAGE plpgsql IMMUTABLE STRICT PARALLEL SAFE AS $$
DECLARE
  hit tsquery;
  m text[];
  parts jsonb[] := '{}';
BEGIN
  SELECT string_agg('(' || replace(concat_ws(' | ', p.raw, p.ex, p.st, p.pf), '<->', '|') || ')', ' | ')::tsquery
    INTO hit FROM hl_parse(q) p WHERE p.positive;
  FOR m IN SELECT regexp_matches(normalize(t, nfc),
      '([[:alnum:]ʿʾ''’ʼ‘̀-ͯ]+(?:-[[:alnum:]ʿʾ''’ʼ‘̀-ͯ]+)*)|([^[:alnum:]ʿʾ''’ʼ‘̀-ͯ]+)', 'g') LOOP
    parts := parts || jsonb_build_object('text', coalesce(m[1], m[2]),
      'hit', m[1] IS NOT NULL AND hit IS NOT NULL AND hl_tsvector(m[1]) @@ hit);
  END LOOP;
  RETURN to_jsonb(parts);
END $$;--> statement-breakpoint

-- Generated by drizzle-kit from src/db/schema.ts.
ALTER TABLE "note" ADD COLUMN "search_vector" "tsvector" GENERATED ALWAYS AS (hl_tsvector(excerpt) || hl_tsvector(comment)) STORED NOT NULL;--> statement-breakpoint
ALTER TABLE "source" ADD COLUMN "search_vector" "tsvector" GENERATED ALWAYS AS (hl_tsvector(title) || hl_tsvector(author) || hl_tsvector(bibliographic_note) || hl_tsvector(hl_fields_text(fields))) STORED NOT NULL;--> statement-breakpoint
ALTER TABLE "source" ADD COLUMN "search_text" text GENERATED ALWAYS AS (hl_fold_text(title || ' ' || coalesce(author, '') || ' ' || coalesce(bibliographic_note, '') || ' ' || coalesce(hl_fields_text(fields), ''))) STORED NOT NULL;--> statement-breakpoint
CREATE INDEX "note_search_vector_idx" ON "note" USING gin ("search_vector");--> statement-breakpoint
CREATE INDEX "source_search_vector_idx" ON "source" USING gin ("search_vector");--> statement-breakpoint
CREATE INDEX "source_search_text_idx" ON "source" USING gin ("search_text" gin_trgm_ops);--> statement-breakpoint

-- Hand-written again: searching reads the columns above, so it comes after them.

-- Tiers: 0 exact in its spelling too, 1 exact, 2 stem, 3 prefix, 4 part of a
-- word (Sources only). A result's tier is its worst word's; then the sum of
-- tiers; then the newest first (ids are UUIDv7, so id order is capture order).
-- The GIN index filters Notes first; tiers are worked out on the matches only.
CREATE FUNCTION hl_search_notes(q text, account uuid) RETURNS TABLE(note_id uuid, tier int, rnk bigint)
LANGUAGE sql STABLE AS $$
  WITH items AS (SELECT * FROM hl_parse(q)),
  scored AS (
    SELECT n.id,
      (SELECT array_agg(CASE WHEN n.search_vector @@ p.raw::tsquery THEN 0
                             WHEN n.search_vector @@ p.ex::tsquery THEN 1
                             WHEN n.search_vector @@ p.st::tsquery THEN 2
                             WHEN n.search_vector @@ p.pf::tsquery THEN 3 END)
         FROM items p WHERE p.positive) ts
    FROM note n
    WHERE n.account_id = account
      AND n.search_vector @@ (SELECT string_agg('(' || concat_ws(' | ', p.raw, p.ex, p.st, p.pf) || ')', ' & ')
                                FROM items p WHERE p.positive)::tsquery
      AND NOT EXISTS (SELECT FROM items x WHERE NOT x.positive AND n.search_vector @@ x.ex::tsquery)
  )
  SELECT id, (SELECT max(t) FROM unnest(ts) t),
         row_number() OVER (ORDER BY (SELECT max(t) FROM unnest(ts) t), (SELECT sum(t) FROM unnest(ts) t), id DESC)
    FROM scored
   WHERE array_position(ts, NULL) IS NULL
$$;--> statement-breakpoint

CREATE FUNCTION hl_search_sources(q text, account uuid) RETURNS TABLE(source_id uuid, tier int, rnk bigint)
LANGUAGE sql STABLE AS $$
  WITH items AS (SELECT * FROM hl_parse(q)),
  scored AS (
    SELECT s.id,
      (SELECT array_agg(CASE WHEN s.search_vector @@ p.raw::tsquery THEN 0
                             WHEN s.search_vector @@ p.ex::tsquery THEN 1
                             WHEN s.search_vector @@ p.st::tsquery THEN 2
                             WHEN s.search_vector @@ p.pf::tsquery THEN 3
                             WHEN s.search_text LIKE '%' || p.sub || '%' THEN 4 END)
         FROM items p WHERE p.positive) ts
    FROM source s
    WHERE s.account_id = account
      -- Through the indexes: any word matching as a word or as a part of one.
      AND (s.search_vector @@ (SELECT string_agg('(' || concat_ws(' | ', p.raw, p.ex, p.st, p.pf) || ')', ' | ')
                                 FROM items p WHERE p.positive)::tsquery
           OR s.search_text LIKE ANY (SELECT '%' || p.sub || '%' FROM items p WHERE p.positive AND p.sub IS NOT NULL))
      AND NOT EXISTS (SELECT FROM items x WHERE NOT x.positive AND s.search_vector @@ x.ex::tsquery)
  )
  SELECT id, (SELECT max(t) FROM unnest(ts) t),
         row_number() OVER (ORDER BY (SELECT max(t) FROM unnest(ts) t), (SELECT sum(t) FROM unnest(ts) t), id DESC)
    FROM scored
   WHERE ts IS NOT NULL AND array_position(ts, NULL) IS NULL
$$;
