-- PROTOTYPE (#28): #16'nın senaryo tablosu, otomatik. search.sql'den sonra koşar.
-- Tablo sözleşmedir; buradan değiştirilmez. "E" satırları sözleşmenin metnindeki
-- kurallar için ek kontrollerdir (tabloda örneği olmayan sıralama ve hariç tutma).

insert into sources (id, title, author, bib_note, type_fields, date_text) values
  (1, 'Genel not defteri', null, null, null, null),
  (2, 'Osmanlı İmparatorluğu Klasik Çağ', 'Halil İnalcık', null, null, '1973'),
  (3, 'Tanzimat Fermanı', 'Mustafa Reşid Paşa', null, null, '1839'),
  (4, 'Defter-i Hâkânî', 'Başbakanlık Osmanlı Arşivi', null, null, '1310'),
  (5, 'Mecelle', null, '1310 tarihli tab''', null, null);

-- Yakalanma sırası id sırası: büyük id yeni.
insert into notes (source_id, locator, excerpt, comment, created_at)
select source_id, locator, excerpt, comment,
       '2026-01-01'::timestamptz + make_interval(mins => (row_number() over ())::int)
from (values
  (1, null, 'IRAK vilayeti', null),
  (1, null, 'İstanbul''da yangın', null),
  (1, null, 'ʿulemâ-yı kirâm', null),
  (1, null, 'ulemanın görüşü', null),
  (1, null, 'kitapları okudu', null),
  (1, null, 'Kitâb-ı ḳadîm', null),
  (1, null, 'Sultan Mehmed''in fermanı', null),
  (1, null, 'Mehmet Paşa', null),
  (1, null, 'te''lif eserler', null),
  (1, null, 'şer''iyye sicili', null),
  (1, null, 'şerʿiyye sicili', null),
  (1, null, 'Şeyhü''l-İslâm fetvası', null),
  (1, null, 'şeyhülislâm', null),
  (1, null, 'sancağı', null),
  (1, null, 'sancakbeyi', null),
  (1, null, 'vakfı', null),
  (1, null, 'vakıflar', null),
  (1, null, 'timar sistemi', null),
  (1, null, 'tımarlı sipahi', null),
  (1, null, 'mahkemesi', null),
  (1, null, 'kadılar toplandı', null),
  (1, null, null, 'Kadının hükmü'),          -- Comment'te: Note iki alanıyla da eşleşir
  (1, null, 'kadın ve aile', null),
  (1, null, 'kadîm gelenek', null),
  (1, null, 'Kadı hükmü verdi', null),
  (1, null, 'kir içinde', null),
  (1, null, 'gitmişti', null),
  (1, null, 'Osmanlılar', null),
  (1, null, 'evkaf', null),
  (1, null, '29 Z 1310 tarihli', null),
  (1, null, 'İnalcık''a göre', null),
  (3, null, 'Gülhane''de okundu', null),
  (1, 'vr. 12b', 'berat sureti', null),
  -- ek kontroller için
  (1, null, 'kır kahvesi', null),
  (1, null, 'kitabı kadîm nüshası', null)
) as v(source_id, locator, excerpt, comment);

create temp table scenario (nr text, q text, kind text, target text, expect bool, tier text);
insert into scenario values
  ('1',   'ırak',             'note',   'IRAK vilayeti',             true,  '1'),
  ('2',   'istanbul',         'note',   'İstanbul''da yangın',       true,  '2'),
  ('3',   'ulema',            'note',   'ʿulemâ-yı kirâm',           true,  '1'),
  -- #16'da 3 (önek); Enes 2026-10-29'da 2'ye (kök) indirdi, #26 ile aynı yapıda (README).
  ('4',   'ulema',            'note',   'ulemanın görüşü',           true,  '2'),
  ('5',   'kitabın',          'note',   'kitapları okudu',           true,  '2'),
  ('6',   'kitap',            'note',   'Kitâb-ı ḳadîm',             true,  '1'),
  ('7',   'Mehmet',           'note',   'Sultan Mehmed''in fermanı', true,  '2'),
  ('8',   'Mehmed',           'note',   'Mehmet Paşa',               true,  '1'),
  ('9',   'telif',            'note',   'te''lif eserler',           true,  '1'),
  ('10a', 'şeriyye',          'note',   'şer''iyye sicili',          true,  '1'),
  ('10b', 'şeriyye',          'note',   'şerʿiyye sicili',           true,  '1'),
  ('11',  'şeyhülislam',      'note',   'Şeyhü''l-İslâm fetvası',    true,  '1'),
  ('12',  '"şeyhü''l-islam"', 'note',   'şeyhülislâm',               true,  '1'),
  ('13',  'sancak',           'note',   'sancağı',                   true,  '2'),
  ('14',  'sancak',           'note',   'sancakbeyi',                true,  '3'),
  ('15a', 'vakıf',            'note',   'vakfı',                     true,  '2'),
  ('15b', 'vakıf',            'note',   'vakıflar',                  true,  '2'),
  ('16',  'tımar',            'note',   'timar sistemi',             true,  '1'),
  ('17',  'tımar',            'note',   'tımarlı sipahi',            true,  '3'),
  ('18',  'mahkeme',          'note',   'mahkemesi',                 true,  '3'),
  ('19a', 'kadı',             'note',   'kadılar toplandı',          true,  '2'),
  ('19b', 'kadı',             'note',   'Kadının hükmü',             true,  '2'),
  ('20a', 'kadı',             'note',   'kadın ve aile',             true,  '3'),
  ('20b', 'kadı',             'note',   'kadîm gelenek',             true,  '3'),
  ('21',  '"kadı"',           'note',   'kadın ve aile',             false, null),
  ('22',  '"kadı"',           'note',   'Kadı hükmü verdi',          true,  '1'),
  ('23',  'kadı -kadın',      'note',   'kadın ve aile',             false, null),
  ('24',  'kır',              'note',   'kir içinde',                true,  '1'),
  ('25',  'gitti',            'note',   'gitmişti',                  false, null),
  ('26',  'gitmiş',           'note',   'gitmişti',                  true,  '2'),
  ('27',  'Osm',              'note',   'Osmanlılar',                true,  '3'),
  ('28',  'ev',               'note',   'evkaf',                     false, null),
  ('29',  '1310',             'note',   '29 Z 1310 tarihli',         true,  '1'),
  ('30',  'nalcık',           'source', 'Osmanlı İmparatorluğu Klasik Çağ', true, 'parça'),
  ('31',  'nalcık',           'note',   'İnalcık''a göre',           false, null),
  ('32a', 'tanzimat',         'source', 'Tanzimat Fermanı',          true,  '1'),
  ('32b', 'tanzimat',         'note',   'Gülhane''de okundu',        false, null),
  ('33',  'vr. 12b',          'note',   'berat sureti',              false, null),
  ('34a', '1310',             'source', 'Defter-i Hâkânî',           false, null),
  ('34b', '1310',             'source', 'Mecelle',                   true,  '1'),
  -- ek kontroller (sözleşmenin metni, tablo satırı değil)
  ('E1',  'kadı -kadın',      'note',   'kadılar toplandı',          true,  '2'),
  ('E2',  '"kitab-ı kadim"',  'note',   'Kitâb-ı ḳadîm',             true,  '1'),
  ('E3',  '"kitab-ı kadim"',  'note',   'kitabı kadîm nüshası',      true,  '1'),
  ('E4',  '"kitabı kadim"',   'note',   'Kitâb-ı ḳadîm',             true,  '1'),
  ('E5',  '"verdi kadı"',     'note',   'Kadı hükmü verdi',          false, null),
  ('E6',  'islam',            'note',   'Şeyhü''l-İslâm fetvası',    true,  '1'),
  ('E7',  'hüküm',            'note',   'Kadının hükmü',             true,  '2'),
  ('E8',  'kadı hükmü',       'note',   'Kadının hükmü',             true,  '2'),
  ('E9',  'şeyhü''l-islam',   'note',   'şeyhülislâm',               true,  '1');

create temp table result as
select s.*,
  case s.kind
    when 'note' then (select h.tier from hl_search_notes(s.q) h join notes n on n.id = h.note_id
                       where coalesce(n.excerpt, n.comment) = s.target)
    else (select h.tier from hl_search_sources(s.q) h join sources x on x.id = h.source_id
           where x.title = s.target)
  end as got
from scenario s;

\pset footer off
\echo
\echo 'Senaryo tablosu (#16). Kademe: 1 birebir (1* = yazımı da birebir), 2 kök, 3 önek, parça = Source içi parça'
select nr as "#", q as "Sorgu", kind || ': ' || target as "Metin",
  case when expect then '✓ ' || tier else '✗' end as "Beklenen",
  case when got is null then '✗' else '✓ ' || case got when 0 then '1*' when 4 then 'parça' else got::text end end as "Bulunan",
  case when (got is not null) = expect
        and (not expect or tier = case got when 0 then '1' when 4 then 'parça' else got::text end)
       then 'GEÇTİ' else 'KALDI' end as "Sonuç"
from result order by row_number() over ();

-- Sıralama kontrolleri: ilk metin ikinciden önce gelmeli.
create temp table ranking (nr text, q text, first text, second text, rule text);
insert into ranking values
  ('S1', 'kır',  'kır kahvesi',   'kir içinde',        'birebir kademede yazımı da birebir tutan üstte'),
  ('S2', 'kadı', 'Kadı hükmü verdi', 'kadılar toplandı', 'birebir > kök'),
  ('S3', 'kadı', 'Kadının hükmü', 'kadılar toplandı',  'kademe içinde yeni yakalanan önce'),
  ('S4', 'kadı', 'kadılar toplandı', 'kadîm gelenek',  'kök > önek'),
  ('S5', 'kitap', 'Kitâb-ı ḳadîm', 'kitapları okudu',  'birebir > kök');

\echo
\echo 'Sıralama'
select r.nr as "#", r.q as "Sorgu", r.first || '  >  ' || r.second as "Beklenen sıra", r.rule as "Kural",
  a.rnk || ' / ' || b.rnk as "Sıra",
  case when a.rnk < b.rnk then 'GEÇTİ' else 'KALDI' end as "Sonuç"
from ranking r
left join lateral (select h.rnk from hl_search_notes(r.q) h join notes n on n.id = h.note_id
                    where coalesce(n.excerpt, n.comment) = r.first) a on true
left join lateral (select h.rnk from hl_search_notes(r.q) h join notes n on n.id = h.note_id
                    where coalesce(n.excerpt, n.comment) = r.second) b on true
order by r.nr;

\echo
select count(*) filter (where (got is not null) = expect
         and (not expect or tier = case got when 0 then '1' when 4 then 'parça' else got::text end))
       || ' / ' || count(*) || ' senaryo geçti' as "Özet"
from result;
