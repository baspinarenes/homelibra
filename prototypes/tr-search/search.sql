-- PROTOTYPE, atılacak kod (baspinarenes/homelibra#28). Karar ve sonuç ticket'ta.
--
-- Türkçe arama sözleşmesini (#16, ADR-0005) PostgreSQL 17 FTS ile karşılayan kurulum.
-- Postgres'in sözlük zinciri kök bulucudan sonra filtre çalıştıramıyor; bu yüzden
-- küçültme → kök bulma → katlama sırası SQL fonksiyonlarında. tsvector de sorgu da aynı
-- fonksiyonlardan geçer, normalizasyonun tek kaynağı burası (istemcide kopya yok).
--
-- Bir kelime aynı konumda üç ad alanında indekslenir:
--   '=kır'  ham: Türkçe küçültülmüş, katlanmamış (birebir kademe içinde üst sıra)
--   'kir'   birebir: katlanmış; önek eşleşmesi de burada ('kir':*)
--   '~kir'  kök kümesi: kelimenin kendisi + düzeltilmiş kök adayları, katlanmış
-- Kök eşleşmesi = sorgu kelimesinin kök kümesiyle notun kelimesinin kök kümesi kesişir.
--
-- Gereken eklentiler postgres:17 imajında var; $SHAREDIR'e dosya eklemek gerekmiyor.

create extension if not exists unaccent;
create extension if not exists pg_trgm;

-- Türkçe duyarlı küçültme: I → ı, İ → i, sonra libc lower. NFC'ye çevirip
-- hazır biçimi olmayan birleşik işaretleri siler.
create or replace function hl_lower(t text) returns text
language sql immutable strict parallel safe as $$
  select regexp_replace(
    lower(replace(replace(normalize(t, nfc), 'I', 'ı'), 'İ', 'i')),
    '[̀-ͯ]', '', 'g')
$$;

-- ʿ ʾ ve kesme işaretleri kelimeyi bölmeden silinir.
create or replace function hl_clean(w text) returns text
language sql immutable strict parallel safe as $$
  select translate(w, 'ʿʾ''’ʼ‘', '')
$$;

-- Hafif katlama: transkripsiyon işaretleri gider, Türkçe harfler kalır (kök bulucunun girdisi).
create or replace function hl_light(w text) returns text
language sql immutable strict parallel safe as $$
  select translate(w, 'âîûāīūēōêôḳḥṣṭẓżḏḫġñ', 'aiuaiueoeokhstzzdhgn')
$$;

-- Tam katlama: sözleşmenin katlama tablosu (unaccent Türkçe harfleri ve kalan işaretleri
-- düzleştirir), sonra kelime sonu b/d → p/t. Rakamdan sonra gelen b (vr. 12b) dokunulmaz.
-- unaccent STABLE; generated column için IMMUTABLE işaretli (sözlük dosyası değişirse reindex).
create or replace function hl_fold(w text) returns text
language sql immutable strict parallel safe as $$
  select regexp_replace(regexp_replace(unaccent('unaccent', hl_light(w)),
    '([[:alpha:]])b$', '\1p'), '([[:alpha:]])d$', '\1t')
$$;

-- Kök kümesi. w: hl_lower'dan geçmiş, kesmesi silinmiş tek kelime; pre: kesmeden önceki
-- kısım (Türkçe yazımda özel adı ekinden ayırır: Mehmed'in → mehmed).
-- turkish_stem'in çıktısı üç kuralla düzeltilir:
--   R1  Tek ünsüzlük iyelik eki (-m, -n) ünlüyle biten köke eklenmiş sayılmaz:
--       kadın ≠ kadı+n, yangın, ferman, İslam. Kök bulucu n/m'yi kesip daha uzun bir
--       kelimeden kök çıkarmışsa n/m'li hâl de aday olur (fermanı → ferman, kadının → kadın).
--   R2  Kelimenin başı olmayan kök atılır (son ünsüz yumuşaması p/b, t/d, k/ğ/g, ç/c hariç):
--       kök bulucu d/g'den sonra ünlü ekliyor (kadim → kadı, Mehmed → mehmedi).
--   R3  Ünlü düşmesi geri alınır: ...VCC + ı/i/u/ü → ...VCVC (vakfı → vakıf, hükmü → hüküm).
create or replace function hl_stems(w text, pre text default null) returns text[]
language plpgsql immutable parallel safe as $$
declare
  l text := hl_light(w);
  s text := (ts_lexize('turkish_stem', l))[1];
  c text[] := array[l];
  m text[];
begin
  if s is not null and s <> l then
    if s ~ '[aeıioöuü]$' and l in (s || 'm', s || 'n') then
      null;  -- R1
    elsif starts_with(l, s)
       or (s ~ '[ptçk]$' and starts_with(l, left(s, -1) || translate(right(s, 1), 'ptçk', 'bdcğ')))
       or (s ~ 'k$' and starts_with(l, left(s, -1) || 'g')) then  -- R2
      c := c || s;
      if s ~ '[aeıioöuü]$' then  -- R1
        if starts_with(l, s || 'n') then c := c || (s || 'n'); end if;
        if starts_with(l, s || 'm') then c := c || (s || 'm'); end if;
      end if;
    end if;
  end if;
  m := regexp_match(l, '^(.*([aeıioöuü]))([bcçdfgğhjklmnprsştvyz])([bcçdfgğhjklmnprsştvyz])[ıiuü]');
  if m is not null then  -- R3
    c := c || (m[1] || m[3] || translate(m[2], 'aeıioöuü', 'ıiıiuüuü') || m[4]);
  end if;
  if char_length(pre) >= 3 then
    c := c || hl_light(pre);
  end if;
  return array(select distinct hl_fold(x) from unnest(c) x);
end $$;

create or replace function hl_pre(w text) returns text
language sql immutable strict parallel safe as $$
  select hl_clean(substring(w from '^([^''’ʼ‘]+)[''’ʼ‘]'))
$$;

-- Kelimelere bölme: harf/rakam dizisi; kesme işaretleri kelimenin içinde kalır,
-- tireli bileşik tek parça döner (parçalara hl_tsvector ayırır).
create or replace function hl_split(t text) returns setof text
language sql immutable strict parallel safe as $$
  select (regexp_matches(hl_lower(t), '[[:alnum:]ʿʾ''’ʼ‘]+(?:-[[:alnum:]ʿʾ''’ʼ‘]+)*', 'g'))[1]
$$;

create or replace function hl_word_lexemes(w text, pos int) returns text[]
language plpgsql immutable strict parallel safe as $$
declare
  clean text := hl_clean(w);
begin
  if clean = '' then
    return '{}';
  end if;
  return array[format('''=%s'':%s', clean, pos), format('''%s'':%s', hl_fold(clean), pos)]
      || array(select format('''~%s'':%s', s, pos) from unnest(hl_stems(clean, hl_pre(w))) s);
end $$;

-- Tireli bileşik: parçalar ardışık konumlarda; bitişik hâli hem ilk hem son parçanın
-- konumunda. Böylece ifade araması bileşiğin iki yanındaki kelimeyle de bozulmaz
-- ("kitabı kadim" ↔ "Kitâb-ı ḳadîm") ve kopya eklemenin sahte ifade eşleşmesi olmaz.
create or replace function hl_tsvector(t text) returns tsvector
language plpgsql immutable parallel safe as $$
declare
  tok text;
  parts text[];
  part text;
  pos int := 0;
  first int;
  lex text[] := '{}';
begin
  for tok in select hl_split(t) loop
    parts := array_remove(string_to_array(tok, '-'), '');
    first := pos + 1;
    foreach part in array parts loop
      pos := pos + 1;
      lex := lex || hl_word_lexemes(part, pos);
    end loop;
    if array_length(parts, 1) > 1 then
      lex := lex || hl_word_lexemes(array_to_string(parts, ''), first)
                 || hl_word_lexemes(array_to_string(parts, ''), pos);
    end if;
  end loop;
  return array_to_string(lex, ' ')::tsvector;
end $$;

-- Source alanlarında kelime içi parça (3+ harf) için katlanmış düz metin, pg_trgm ile.
create or replace function hl_fold_text(t text) returns text
language sql immutable parallel safe as $$
  select coalesce(string_agg(
    (select string_agg(hl_fold(hl_clean(p)), ' ') from unnest(string_to_array(tok, '-')) p)
      || case when tok ~ '-' then ' ' || hl_fold(hl_clean(replace(tok, '-', ''))) else '' end,
    ' '), '')
  from hl_split(t) tok
$$;

-- Bir sorgu kelimesinin (tireli olabilir) tek kademedeki tsquery metni.
create or replace function hl_term(w text, mode text) returns text
language plpgsql immutable strict parallel safe as $$
declare
  clean text := hl_clean(w);
  f text;
begin
  if clean = '' then
    return null;
  end if;
  f := hl_fold(clean);
  return case mode
    when 'raw' then format('''=%s''', clean)
    when 'exact' then format('''%s''', f)
    when 'stem' then (select '(' || string_agg(format('''~%s''', s), ' | ') || ')'
                      from unnest(hl_stems(clean, hl_pre(w))) s)
    when 'prefix' then case when char_length(f) >= 3 then format('''%s'':*', f) end
  end;
end $$;

-- Tireli sorgu kelimesi: bitişik hâli ya da parçaları yan yana (iki yönde de bulunur).
create or replace function hl_item(tok text, mode text) returns text
language plpgsql immutable strict parallel safe as $$
declare
  parts text[] := array_remove(string_to_array(tok, '-'), '');
  whole text := hl_term(array_to_string(parts, ''), mode);
  ph text;
begin
  if whole is null or array_length(parts, 1) = 1 then
    return whole;
  end if;
  select string_agg('(' || coalesce(hl_term(p, case when mode = 'prefix' and i < n then 'exact' else mode end),
                                    hl_term(p, 'exact')) || ')', ' <-> ' order by i)
    into ph
    from unnest(parts) with ordinality as x(p, i), (select array_length(parts, 1) n) k;
  return '(' || whole || ') | (' || ph || ')';
end $$;

-- Sorgu ayrıştırma: boşlukla ayrılan kelimeler (hepsi geçmeli), "tırnak" kesin ifade
-- (yan yana, katlanmış, kök/önek yok), -kelime hariç tutar (birebir, katlanmış). OR yok.
-- Her olumlu öğe için kademe kademe tsquery metinleri döner.
create or replace function hl_parse(q text)
returns table(positive bool, raw text, ex text, st text, pf text, sub text)
language plpgsql immutable strict parallel safe as $$
declare
  m text[];
  t text;
  ph text;
begin
  for m in select regexp_matches(hl_lower(q), '(-?)"([^"]*)"|(-?)([^\s"]+)', 'g') loop
    if m[2] is not null then
      select string_agg('(' || hl_item(x, 'exact') || ')', ' <-> ') into ph from hl_split(m[2]) x;
      continue when ph is null;
      return query select m[1] <> '-', null::text, ph, null::text, null::text, null::text;
    else
      for t in select hl_split(m[4]) loop
        continue when hl_item(t, 'exact') is null;
        if m[3] = '-' then
          return query select false, null::text, hl_item(t, 'exact'), null::text, null::text, null::text;
        else
          return query select true, hl_item(t, 'raw'), hl_item(t, 'exact'), hl_item(t, 'stem'),
            hl_item(t, 'prefix'),
            case when char_length(hl_fold(hl_clean(replace(t, '-', '')))) >= 3
                 then hl_fold(hl_clean(replace(t, '-', ''))) end;
        end if;
      end loop;
    end if;
  end loop;
end $$;

-- Şema: aramaya giren alanlar yalnızca bunlar (Locator, Tag adı ve Tarih aranmaz).
create table sources (
  id int primary key,
  title text,
  author text,
  bib_note text,
  type_fields text,  -- türe özgü isteğe bağlı alanların birleşimi
  date_text text,
  sv tsvector generated always as (
    hl_tsvector(title) || hl_tsvector(author) || hl_tsvector(bib_note) || hl_tsvector(type_fields)) stored,
  ft text generated always as (
    hl_fold_text(coalesce(title, '') || ' ' || coalesce(author, '') || ' ' || coalesce(bib_note, '') || ' ' || coalesce(type_fields, ''))) stored
);

create table notes (
  id serial primary key,
  source_id int references sources,
  locator text,
  excerpt text,
  comment text,
  created_at timestamptz not null default now(),
  sv tsvector generated always as (hl_tsvector(excerpt) || hl_tsvector(comment)) stored
);

create index on notes using gin (sv);
create index on sources using gin (sv);
create index on sources using gin (ft gin_trgm_ops);

-- Kademe: 0 birebir + yazım da birebir, 1 birebir, 2 kök, 3 önek, 4 parça (yalnızca Source).
-- Not kademesi en kötü kelimenin kademesi; sonra kademeler toplamı; sonra yeni yakalanan önce.
-- Sorgu ön filtresi GIN indeksini kullanır; kademeler yalnızca eşleşen notlarda hesaplanır.
create or replace function hl_search_notes(q text) returns table(note_id int, tier int, rnk bigint)
language sql stable as $$
  with items as (select * from hl_parse(q)),
  scored as (
    select n.id, n.created_at,
      (select array_agg(case when n.sv @@ p.raw::tsquery then 0
                             when n.sv @@ p.ex::tsquery then 1
                             when n.sv @@ p.st::tsquery then 2
                             when n.sv @@ p.pf::tsquery then 3 end)
         from items p where p.positive) ts
    from notes n
    where n.sv @@ (select string_agg('(' || concat_ws(' | ', p.raw, p.ex, p.st, p.pf) || ')', ' & ')
                     from items p where p.positive)::tsquery  -- GIN ön filtresi
      and not exists (select from items x where not x.positive and n.sv @@ x.ex::tsquery)
  )
  select id, (select max(t) from unnest(ts) t),
         row_number() over (order by (select max(t) from unnest(ts) t), (select sum(t) from unnest(ts) t), created_at desc)
    from scored
   where ts is not null and array_position(ts, null) is null
$$;

create or replace function hl_search_sources(q text) returns table(source_id int, tier int, rnk bigint)
language sql stable as $$
  with items as (select * from hl_parse(q)),
  scored as (
    select s.id,
      (select array_agg(case when s.sv @@ p.raw::tsquery then 0
                             when s.sv @@ p.ex::tsquery then 1
                             when s.sv @@ p.st::tsquery then 2
                             when s.sv @@ p.pf::tsquery then 3
                             when s.ft like '%' || p.sub || '%' then 4 end)
         from items p where p.positive) ts
    from sources s
    where not exists (select from items x where not x.positive and s.sv @@ x.ex::tsquery)
  )
  select id, (select max(t) from unnest(ts) t),
         row_number() over (order by (select max(t) from unnest(ts) t), (select sum(t) from unnest(ts) t), id)
    from scored
   where ts is not null and array_position(ts, null) is null
$$;
