# Turkish FTS scenario battery (PostgreSQL 17.11)

- Ticket: baspinarenes/homelibra#16 (Türkçe arama sözleşmesi) · Feeds: baspinarenes/homelibra#28 (prototype: search setup that passes the scenario table)
- Measures the configuration recommended in `turkish-fulltext-search.md` against search scenarios; facts only, no recommendations.

Run 2026-10-29. Throwaway container from the official `postgres:17` image (PostgreSQL 17.11, Debian, aarch64), database `datcollate/datctype = en_US.utf8`, provider `libc`. Container removed afterwards.

Docker note: Docker Desktop's app process was already running but its engine was unresponsive (API 500s; backend log "dial 192.168.65.7:2376: no route to host"). It was restarted with `docker desktop restart`, used, then fully quit (`docker desktop stop` + quit app). The `postgres:17` image was already present and was kept.

## Configurations

| Config | Note vector | Query |
|---|---|---|
| A | `to_tsvector('tr_unaccent', translate(t,'ʿʾ',''))` | `websearch_to_tsquery('tr_unaccent', translate(q,'ʿʾ',''))` |
| B | `to_tsvector('tr_unaccent', translate(t,'ʿʾ''’',''))` (apostrophes deleted) | same translate, `tr_unaccent` |
| C | `to_tsvector('tr_simple_unaccent', translate(t,'ʿʾ''’',''))` (no stemming) | same translate, `tr_simple_unaccent` |
| D | `vB(t) \|\| vB(replace(t,'-',''))` | the B query (query text NOT de-hyphenated) |
| D+q (extra) | D vector | B query with `replace(q,'-','')` too |

Prefix rows (P) use `to_tsquery(config, normalised(word) || ':*')`; D uses the B prefix query. The same normalisation is applied to query and note text.

## Observations (facts from the tables below, no recommendations)

- **kadı / kadın / kadim.** In A/B, unaccent runs first, so the stemmer sees `kadi`, `kadin`, `kadim`. `kadi` stays `kadi`; `kadin` and `kadim` lose their ending and the stemmer then adds `ı` after the final `d`, giving `kadı`. Result: `kadın ≡ kadim ≡ kadîm` (all `kadı`). `kadı ≡ kadılar ≡ kadının` (all `kadi`). The query "kadı" does **not** match "kadın ve aile" or "kadîm gelenek", but the query "kadın" **does** match "kadîm gelenek", and "kadim" matches "kadın ve aile". "kadılık" → `kadilik` matches none of these. The stemmer alone, without unaccent, maps kadı, kadın, kadının, kadılar and kadim all to `kadı`.
- **Prefix.** `kad:*` matches all five kadı-family notes under every config. `kadı:*` (→ `kadi:*`) under A/B matches Kadının, kadılar and kadılık but not kadın or kadîm. Under C it matches all five, because `kadin` and `kadim` start with `kadi`.
- **Over-stemming truncations (A/B):** ulema→`ule` (but ulemanın→`ulema`, so query "ulema" ✗ "ulemanın görüşü"), Mehmed→`mehmedi`, Ahmed→`ahmedi`, Isparta→`ispar`, Süleyman→`suleyma`, ferman→`ferma`, Sultan→`sul`, aile→`ai`, paşa→`pas`, mahkeme→`mahke` (but mahkemesi→`mahkemes`, so they don't meet), Deñiz/deniz→`de`, sancakbeyi→`sancakbe`, İslâm→`isla`, şeyhülislam→`seyhulisla`.
- **Under-stemming (A/B):** vakfı `vakfi` ≠ vakıf `vakif`; sancağı `sancagi` ≠ sancak (raw turkish_stem gives `sancak`, but ğ→g from unaccent stops it); tımarlı `timarli` ≠ tımar; gitti `git` ≠ gitmişti `gitmis`; toplandı/makamı are stemmed only when the raw form is used; Mehmed `mehmedi` ≠ Mehmet `mehmet` in every config.
- **İ/ı:** every İ/ı/I case matches in all configs. As a side effect, kır ≡ kir in all configs.
- **unaccent** folds every listed character (ñ ẓ ż ḏ ḫ ġ ṭ ṣ ḥ ḳ ā ī ū â î û), their uppercase forms, ç ğ ı ö ş ü, İ→I, and NFD combining sequences. It leaves only ʿ (U+02BF) and ʾ (U+02BE) untouched, and maps ’ (U+2019) to ASCII `'`.
- **B (delete apostrophes)** fixes te'lif→telif, şer'iyye→şeriyye, me'mur→memur and the query "Mehmed'in". It removes the junk lexemes A creates (`in`, `dan`, `ye`, `te`/`lif`, `ser`/`iyye`). In this battery B is never worse than A: every row is equal or better. B does not fix Şeyhü'l-İslâm, which becomes `seyhul` / `seyhul-isla` / `isla` and still ≠ `seyhulisla`.
- **D (+ de-hyphenated copy)** makes "şeyhülislam" find "Şeyhü'l-İslâm fetvası" (✓ only in D). The reverse (query "şeyhü'l-islam" → note "şeyhülislâm"), and "Kitab-ı kadim" → "kitabı kadim", match only if the query is de-hyphenated too (D+q). Side effects: (1) a false phrase match across the copy boundary: `"verdi kadı"` matches "kadı hükmü verdi"; (2) every lexeme is stored twice, which raises ts_rank (0.060793 → 0.075991 here); (3) it adds glued forms such as `kitabı`. Otherwise D's columns equal B's.
- **C (unstemmed)** gives only exact folded-word matches: ISTANBUL/ıstanbul, IRAK, ısparta, timar, kir, ʿulemâ/ulema, telif, şerʿiyye. It misses every inflection: Kadının, kadılar, kitapları, Kitâb, vakıflar, gitmişti, and "İstanbul'da", which becomes `istanbulda` after the B join.
- **Phrase** `"kadı hükmü"`: A/B/D match both "Kadının hükmü" and "kadı hükmü verdi". C matches only "kadı hükmü verdi".
- **Numbers:** "1310" matches "29 Z 1310 tarihli" everywhere. `29`, `z` and `1310` are separate lexemes.
- **Ranking:** ts_rank(A) gives an identical 0.060793 to "Kadının hükmü", "kadılar toplandı" and "kadı hükmü verdi", so they tie. None of the five requested notes contains the bare word "kadı", so ranking C matches first changes nothing for those five. With the added note "kadı hükmü verdi", C-first puts it at position 1 above the stem-only matches.

## Part 1 — lexemes (tsvector lexemes, positions dropped)

| # | input | A | B | C |
|---|---|---|---|---|
| 1 | kadı | kadi | kadi | kadi |
| 2 | kadın | kadı | kadı | kadin |
| 3 | kadılar | kadi | kadi | kadilar |
| 4 | kadının | kadi | kadi | kadinin |
| 5 | kadılık | kadilik | kadilik | kadilik |
| 6 | kadim | kadı | kadı | kadim |
| 7 | kadîm | kadı | kadı | kadim |
| 8 | ulema | ule | ule | ulema |
| 9 | ʿulemâ | ule | ule | ulema |
| 10 | ulemanın | ulema | ulema | ulemanin |
| 11 | Mehmed | mehmedi | mehmedi | mehmed |
| 12 | Mehmet | mehmet | mehmet | mehmet |
| 13 | Mehmed'in | in mehmedi | mehmedi | mehmedin |
| 14 | Ahmed | ahmedi | ahmedi | ahmed |
| 15 | kitab | kitap | kitap | kitab |
| 16 | kitap | kitap | kitap | kitap |
| 17 | kitabın | kitap | kitap | kitabin |
| 18 | kitapları | kitap | kitap | kitaplari |
| 19 | İstanbul'da | istanbul | istanbul | istanbulda |
| 20 | İstanbul'dan | dan istanbul | istanbul | istanbuldan |
| 21 | istanbulda | istanbul | istanbul | istanbulda |
| 22 | te'lif | lif te | telif | telif |
| 23 | telif | telif | telif | telif |
| 24 | me'mur | me mur | memur | memur |
| 25 | memur | memur | memur | memur |
| 26 | şer'iyye | iyye ser | seriyye | seriyye |
| 27 | şerʿiyye | seriyye | seriyye | seriyye |
| 28 | şeriyye | seriyye | seriyye | seriyye |
| 29 | Şeyhü'l-İslâm | isla l l-isla seyhu | isla seyhul seyhul-isla | islam seyhul seyhul-islam |
| 30 | şeyhülislam | seyhulisla | seyhulisla | seyhulislam |
| 31 | şeyhülislâm | seyhulisla | seyhulisla | seyhulislam |
| 32 | Kitâb-ı ḳadîm | i kadı kitab-i kitap | i kadı kitab-i kitap | i kadim kitab kitab-i |
| 33 | vakıf | vakif | vakif | vakif |
| 34 | vakfı | vakfi | vakfi | vakfi |
| 35 | vakıflar | vakif | vakif | vakiflar |
| 36 | sancak | sancak | sancak | sancak |
| 37 | sancağı | sancagi | sancagi | sancagi |
| 38 | sancakbeyi | sancakbe | sancakbe | sancakbeyi |
| 39 | defter | defter | defter | defter |
| 40 | defteri | defter | defter | defteri |
| 41 | defterdar | defterdar | defterdar | defterdar |
| 42 | tımar | timar | timar | timar |
| 43 | timar | timar | timar | timar |
| 44 | tımarlı | timarli | timarli | timarli |
| 45 | Irak | irak | irak | irak |
| 46 | ırak | irak | irak | irak |
| 47 | IRAK | irak | irak | irak |
| 48 | Isparta | ispar | ispar | isparta |
| 49 | ısparta | ispar | ispar | isparta |
| 50 | kır | kir | kir | kir |
| 51 | kir | kir | kir | kir |
| 52 | gitmişti | gitmis | gitmis | gitmisti |
| 53 | gitti | git | git | gitti |
| 54 | gidiyor | gidiyor | gidiyor | gidiyor |
| 55 | Osmanlı | osmanli | osmanli | osmanli |
| 56 | Osmanlılar | osmanli | osmanli | osmanlilar |
| 57 | osmanli | osmanli | osmanli | osmanli |
| 58 | OSMANLI | osmanli | osmanli | osmanli |
| 59 | mahkeme | mahke | mahke | mahkeme |
| 60 | mahkemesi | mahkemes | mahkemes | mahkemesi |
| 61 | sicil | sicil | sicil | sicil |
| 62 | sicili | sicil | sicil | sicili |
| 63 | sicillerinde | sicil | sicil | sicillerinde |
| 64 | kanunnâme | kanunname | kanunname | kanunname |
| 65 | kanunname | kanunname | kanunname | kanunname |
| 66 | Kanunî | kanuni | kanuni | kanuni |
| 67 | kanuni | kanuni | kanuni | kanuni |
| 68 | Süleyman | suleyma | suleyma | suleyman |
| 69 | suleyman | suleyma | suleyma | suleyman |
| 70 | millî | milli | milli | milli |
| 71 | milli | milli | milli | milli |
| 72 | millet | millet | millet | millet |
| 73 | ʿAlī | ali | ali | ali |
| 74 | Ali | ali | ali | ali |
| 75 | Ali'ye | ali ye | ali | aliye |
| 76 | Âlî | ali | ali | ali |
| 77 | fermân | ferma | ferma | ferman |
| 78 | fermanı | ferma | ferma | fermani |
| 79 | ḥüccet | huccet | huccet | huccet |
| 80 | hüccet | huccet | huccet | huccet |
| 81 | hücceti | huccet | huccet | hucceti |
| 82 | Deñiz | de | de | deniz |
| 83 | ḥāfıẓ | hafiz | hafiz | hafiz |
| 84 | ḫaṭṭ | hatt | hatt | hatt |
| 85 | ġāzī | gazi | gazi | gazi |
| 86 | 1310 | 1310 | 1310 | 1310 |
| 87 | 29 Z 1310 | 1310 29 z | 1310 29 z | 1310 29 z |
| 88 | Mehmed’in | in mehmedi | mehmedi | mehmedin |
| 89 | İstanbul’da | istanbul | istanbul | istanbulda |

Rows 88–89 are extra: U+2019 apostrophe forms (same result as ASCII `'`, since `unaccent` maps ’ to `'`).

### Stemmer with vs without unaccent first (`ts_lexize('turkish_stem', …)`)

The `tr_unaccent` chain runs unaccent **before** the stemmer, so the stemmer sees ASCII-folded input. Column 2 = stemmer on the lowercased original, column 3 = stemmer on the unaccented form (what A/B actually index).

| word | turkish_stem(original) | turkish_stem(unaccent) |
|---|---|---|
| kadı | kadı | kadi |
| kadın | kadı | kadı |
| kadının | kadı | kadi |
| kadılar | kadı | kadi |
| kadim | kadı | kadı |
| sancak | sancak | sancak |
| sancağı | sancak | sancagi |
| tımar | tımar | timar |
| tımarlı | tımarlı | timarli |
| vakıf | vakıf | vakif |
| vakfı | vakfı | vakfi |
| vakıflar | vakıf | vakif |
| gitmişti | gitmiş | gitmis |
| gitti | git | git |
| ulema | ule | ule |
| ulemanın | ulema | ulema |
| sicillerinde | sicil | sicil |
| kitabın | kitap | kitap |
| kitapları | kitap | kitap |
| yangın | yangı | yangı |
| paşa | paş | pas |
| Süleyman | süleyma | suleyma |
| sistemi | siste | siste |
| fetvası | fetvas | fetvas |
| Osmanlılar | osmanlı | osmanli |
| toplandı | topla | toplandi |
| makamı | maka | makami |
| görüşü | görüş | gorus |
| şeyhülislam | şeyhülisla | seyhulisla |
| mahkemesi | mahkemes | mahkemes |

### unaccent coverage

`unaccent(ch)` and `ts_lexize('unaccent', ch)` (NULL = dictionary leaves it unchanged).

| char | name | code point(s) | unaccent() | covered? | ts_lexize |
|---|---|---|---|---|---|
| ñ | n tilde | U+F1 | n | covered | n |
| ẓ | z dot below | U+1E93 | z | covered | z |
| ż | z dot above | U+17C | z | covered | z |
| ḏ | d line below | U+1E0F | d | covered | d |
| ḫ | h breve below | U+1E2B | h | covered | h |
| ġ | g dot above | U+121 | g | covered | g |
| ṭ | t dot below | U+1E6D | t | covered | t |
| ṣ | s dot below | U+1E63 | s | covered | s |
| ḥ | h dot below | U+1E25 | h | covered | h |
| ḳ | k dot below | U+1E33 | k | covered | k |
| ā | a macron | U+101 | a | covered | a |
| ī | i macron | U+12B | i | covered | i |
| ū | u macron | U+16B | u | covered | u |
| â | a circumflex | U+E2 | a | covered | a |
| î | i circumflex | U+EE | i | covered | i |
| û | u circumflex | U+FB | u | covered | u |
| ç | c cedilla | U+E7 | c | covered | c |
| ğ | g breve | U+11F | g | covered | g |
| ı | dotless i | U+131 | i | covered | i |
| İ | I dot above | U+130 | I | covered | I |
| ö | o diaeresis | U+F6 | o | covered | o |
| ş | s cedilla | U+15F | s | covered | s |
| ü | u diaeresis | U+FC | u | covered | u |
| ʿ | U+02BF ayn | U+2BF | ʿ | NOT covered | (null = unchanged) |
| ʾ | U+02BE hamza | U+2BE | ʾ | NOT covered | (null = unchanged) |
| ’ | U+2019 | U+2019 | ' | covered | ' |
| Ñ | N tilde | U+D1 | N | covered | N |
| Ẓ | Z dot below | U+1E92 | Z | covered | Z |
| Ż | Z dot above | U+17B | Z | covered | Z |
| Ḏ | D line below | U+1E0E | D | covered | D |
| Ḫ | H breve below | U+1E2A | H | covered | H |
| Ġ | G dot above | U+120 | G | covered | G |
| Ṭ | T dot below | U+1E6C | T | covered | T |
| Ṣ | S dot below | U+1E62 | S | covered | S |
| Ḥ | H dot below | U+1E24 | H | covered | H |
| Ḳ | K dot below | U+1E32 | K | covered | K |
| Ā | A macron | U+100 | A | covered | A |
| Ī | I macron | U+12A | I | covered | I |
| Ū | U macron | U+16A | U | covered | U |
| Â | A circumflex | U+C2 | A | covered | A |
| ā | a + combining macron (NFD) | U+61 U+304 | a | covered | a |
| ḥ | h + combining dot below (NFD) | U+68 U+323 | h | covered | h |
| â | a + combining circumflex (NFD) | U+61 U+302 | a | covered | a |

Only ʿ (U+02BF) and ʾ (U+02BE) are left untouched. Note `İ` → `I` (uppercase; the stemmer/simple dictionary lowercases afterwards to `i` under libc en_US). `’` (U+2019) → ASCII `'`. Precomposed and NFD (letter + combining mark) forms both fold.

## Part 2 — query → note match matrix

✓ = `query @@ vector(note)`. Rows 42–48 are extra prefix variants of earlier rows.

| # | query | note | A | B | C | D |
|---|---|---|---|---|---|---|
| 1 | kadı | Kadının hükmü | ✓ | ✓ | ✗ | ✓ |
| 2 | kadı | kadîm gelenek | ✗ | ✗ | ✗ | ✗ |
| 3 | kadı | kadın ve aile | ✗ | ✗ | ✗ | ✗ |
| 4 | kadı | kadılar toplandı | ✓ | ✓ | ✗ | ✓ |
| 5 | kadı | kadılık makamı | ✗ | ✗ | ✗ | ✗ |
| 6 | ulema | ʿulemâ-yı kirâm | ✓ | ✓ | ✓ | ✓ |
| 7 | ulema | ulemanın görüşü | ✗ | ✗ | ✗ | ✗ |
| 8 | Mehmet | Sultan Mehmed'in fermanı | ✗ | ✗ | ✗ | ✗ |
| 9 | Mehmed | Mehmet Paşa | ✗ | ✗ | ✗ | ✗ |
| 10 | kitap | Kitâb-ı ḳadîm | ✓ | ✓ | ✗ | ✓ |
| 11 | kitabın | kitapları okudu | ✓ | ✓ | ✗ | ✓ |
| 12 | istanbul | İstanbul'da yangın | ✓ | ✓ | ✗ | ✓ |
| 13 | istanbul | ISTANBUL | ✓ | ✓ | ✓ | ✓ |
| 14 | istanbul | ıstanbul | ✓ | ✓ | ✓ | ✓ |
| 15 | ırak | IRAK | ✓ | ✓ | ✓ | ✓ |
| 16 | irak | Irak | ✓ | ✓ | ✓ | ✓ |
| 17 | Isparta | ısparta | ✓ | ✓ | ✓ | ✓ |
| 18 | telif | te'lif eserler | ✗ | ✓ | ✓ | ✓ |
| 19 | şeriyye | şerʿiyye sicili | ✓ | ✓ | ✓ | ✓ |
| 20 | şeriyye | şer'iyye sicili | ✗ | ✓ | ✓ | ✓ |
| 21 | şeyhülislam | Şeyhü'l-İslâm fetvası | ✗ | ✗ | ✗ | ✓ |
| 22 | şeyhü'l-islam | şeyhülislâm | ✗ | ✗ | ✗ | ✗ |
| 23 | tımar | timar sistemi | ✓ | ✓ | ✓ | ✓ |
| 24 | tımar | tımarlı sipahi | ✗ | ✗ | ✗ | ✗ |
| 25 | sancak | sancağı | ✗ | ✗ | ✗ | ✗ |
| 26 | sancak | sancakbeyi | ✗ | ✗ | ✗ | ✗ |
| 27 | gitti | gitmişti | ✗ | ✗ | ✗ | ✗ |
| 28 | gitmiş | gitmişti | ✓ | ✓ | ✗ | ✓ |
| 29 | kır | kir | ✓ | ✓ | ✓ | ✓ |
| 30 | vakıf | vakfı | ✗ | ✗ | ✗ | ✗ |
| 31 | vakıf | vakıflar | ✓ | ✓ | ✗ | ✓ |
| 32 | Osm (P) | Osmanlılar | ✓ | ✓ | ✓ | ✓ |
| 33 | sicil (P) | sicillerinde | ✓ | ✓ | ✓ | ✓ |
| 34 | kad (P) | Kadının hükmü | ✓ | ✓ | ✓ | ✓ |
| 35 | kad (P) | kadîm gelenek | ✓ | ✓ | ✓ | ✓ |
| 36 | kad (P) | kadın ve aile | ✓ | ✓ | ✓ | ✓ |
| 37 | kad (P) | kadılar toplandı | ✓ | ✓ | ✓ | ✓ |
| 38 | kad (P) | kadılık makamı | ✓ | ✓ | ✓ | ✓ |
| 39 | "kadı hükmü" | Kadının hükmü | ✓ | ✓ | ✗ | ✓ |
| 40 | "kadı hükmü" | kadı hükmü verdi | ✓ | ✓ | ✓ | ✓ |
| 41 | 1310 | 29 Z 1310 tarihli | ✓ | ✓ | ✓ | ✓ |
| 42 | kadı (P) | kadın ve aile | ✗ | ✗ | ✓ | ✗ |
| 43 | kadı (P) | kadîm gelenek | ✗ | ✗ | ✓ | ✗ |
| 44 | ulema (P) | ulemanın görüşü | ✓ | ✓ | ✓ | ✓ |
| 45 | sancak (P) | sancakbeyi | ✓ | ✓ | ✓ | ✓ |
| 46 | tımar (P) | tımarlı sipahi | ✓ | ✓ | ✓ | ✓ |
| 47 | vakıf (P) | vakfı | ✗ | ✗ | ✗ | ✗ |
| 48 | gitti (P) | gitmişti | ✓ | ✓ | ✗ | ✓ |

### Query and note forms behind the matrix

Columns: query under A / B / C, then vector under A / B / C / D.

| # | qA | qB | qC | vA | vB | vC | vD |
|---|---|---|---|---|---|---|---|
| 1 | 'kadi' | 'kadi' | 'kadi' | 'hukmu':2 'kadi':1 | 'hukmu':2 'kadi':1 | 'hukmu':2 'kadinin':1 | 'hukmu':2,4 'kadi':1,3 |
| 2 | 'kadi' | 'kadi' | 'kadi' | 'gelenek':2 'kadı':1 | 'gelenek':2 'kadı':1 | 'gelenek':2 'kadim':1 | 'gelenek':2,4 'kadı':1,3 |
| 3 | 'kadi' | 'kadi' | 'kadi' | 'ai':3 'kadı':1 | 'ai':3 'kadı':1 | 'aile':3 'kadin':1 've':2 | 'ai':3,6 'kadı':1,4 |
| 4 | 'kadi' | 'kadi' | 'kadi' | 'kadi':1 'toplandi':2 | 'kadi':1 'toplandi':2 | 'kadilar':1 'toplandi':2 | 'kadi':1,3 'toplandi':2,4 |
| 5 | 'kadi' | 'kadi' | 'kadi' | 'kadilik':1 'makami':2 | 'kadilik':1 'makami':2 | 'kadilik':1 'makami':2 | 'kadilik':1,3 'makami':2,4 |
| 6 | 'ule' | 'ule' | 'ulema' | 'kira':4 'ule':2 'ulema-yi':1 'yi':3 | 'kira':4 'ule':2 'ulema-yi':1 'yi':3 | 'kiram':4 'ulema':2 'ulema-yi':1 'yi':3 | 'kira':4,6 'ule':2 'ulema':5 'ulema-yi':1 'yi':3 |
| 7 | 'ule' | 'ule' | 'ulema' | 'gorus':2 'ulema':1 | 'gorus':2 'ulema':1 | 'gorusu':2 'ulemanin':1 | 'gorus':2,4 'ulema':1,3 |
| 8 | 'mehmet' | 'mehmet' | 'mehmet' | 'ferma':4 'in':3 'mehmedi':2 'sul':1 | 'ferma':3 'mehmedi':2 'sul':1 | 'fermani':3 'mehmedin':2 'sultan':1 | 'ferma':3,6 'mehmedi':2,5 'sul':1,4 |
| 9 | 'mehmedi' | 'mehmedi' | 'mehmed' | 'mehmet':1 'pas':2 | 'mehmet':1 'pas':2 | 'mehmet':1 'pasa':2 | 'mehmet':1,3 'pas':2,4 |
| 10 | 'kitap' | 'kitap' | 'kitap' | 'i':3 'kadı':4 'kitab-i':1 'kitap':2 | 'i':3 'kadı':4 'kitab-i':1 'kitap':2 | 'i':3 'kadim':4 'kitab':2 'kitab-i':1 | 'i':3 'kadı':4,6 'kitab-i':1 'kitap':2,5 |
| 11 | 'kitap' | 'kitap' | 'kitabin' | 'kitap':1 'okudu':2 | 'kitap':1 'okudu':2 | 'kitaplari':1 'okudu':2 | 'kitap':1,3 'okudu':2,4 |
| 12 | 'istanbul' | 'istanbul' | 'istanbul' | 'istanbul':1 'yangı':3 | 'istanbul':1 'yangı':2 | 'istanbulda':1 'yangin':2 | 'istanbul':1,3 'yangı':2,4 |
| 13 | 'istanbul' | 'istanbul' | 'istanbul' | 'istanbul':1 | 'istanbul':1 | 'istanbul':1 | 'istanbul':1,2 |
| 14 | 'istanbul' | 'istanbul' | 'istanbul' | 'istanbul':1 | 'istanbul':1 | 'istanbul':1 | 'istanbul':1,2 |
| 15 | 'irak' | 'irak' | 'irak' | 'irak':1 | 'irak':1 | 'irak':1 | 'irak':1,2 |
| 16 | 'irak' | 'irak' | 'irak' | 'irak':1 | 'irak':1 | 'irak':1 | 'irak':1,2 |
| 17 | 'ispar' | 'ispar' | 'isparta' | 'ispar':1 | 'ispar':1 | 'isparta':1 | 'ispar':1,2 |
| 18 | 'telif' | 'telif' | 'telif' | 'eser':3 'lif':2 'te':1 | 'eser':2 'telif':1 | 'eserler':2 'telif':1 | 'eser':2,4 'telif':1,3 |
| 19 | 'seriyye' | 'seriyye' | 'seriyye' | 'seriyye':1 'sicil':2 | 'seriyye':1 'sicil':2 | 'seriyye':1 'sicili':2 | 'seriyye':1,3 'sicil':2,4 |
| 20 | 'seriyye' | 'seriyye' | 'seriyye' | 'iyye':2 'ser':1 'sicil':3 | 'seriyye':1 'sicil':2 | 'seriyye':1 'sicili':2 | 'seriyye':1,3 'sicil':2,4 |
| 21 | 'seyhulisla' | 'seyhulisla' | 'seyhulislam' | 'fetvas':5 'isla':4 'l':3 'l-isla':2 'seyhu':1 | 'fetvas':4 'isla':3 'seyhul':2 'seyhul-isla':1 | 'fetvasi':4 'islam':3 'seyhul':2 'seyhul-islam':1 | 'fetvas':4,6 'isla':3 'seyhul':2 'seyhul-isla':1 'seyhulisla':5 |
| 22 | 'seyhu' <-> 'l-isla' <-> 'l' <-> 'isla' | 'seyhul-isla' <-> 'seyhul' <-> 'isla' | 'seyhul-islam' <-> 'seyhul' <-> 'islam' | 'seyhulisla':1 | 'seyhulisla':1 | 'seyhulislam':1 | 'seyhulisla':1,2 |
| 23 | 'timar' | 'timar' | 'timar' | 'siste':2 'timar':1 | 'siste':2 'timar':1 | 'sistemi':2 'timar':1 | 'siste':2,4 'timar':1,3 |
| 24 | 'timar' | 'timar' | 'timar' | 'sipah':2 'timarli':1 | 'sipah':2 'timarli':1 | 'sipahi':2 'timarli':1 | 'sipah':2,4 'timarli':1,3 |
| 25 | 'sancak' | 'sancak' | 'sancak' | 'sancagi':1 | 'sancagi':1 | 'sancagi':1 | 'sancagi':1,2 |
| 26 | 'sancak' | 'sancak' | 'sancak' | 'sancakbe':1 | 'sancakbe':1 | 'sancakbeyi':1 | 'sancakbe':1,2 |
| 27 | 'git' | 'git' | 'gitti' | 'gitmis':1 | 'gitmis':1 | 'gitmisti':1 | 'gitmis':1,2 |
| 28 | 'gitmis' | 'gitmis' | 'gitmis' | 'gitmis':1 | 'gitmis':1 | 'gitmisti':1 | 'gitmis':1,2 |
| 29 | 'kir' | 'kir' | 'kir' | 'kir':1 | 'kir':1 | 'kir':1 | 'kir':1,2 |
| 30 | 'vakif' | 'vakif' | 'vakif' | 'vakfi':1 | 'vakfi':1 | 'vakfi':1 | 'vakfi':1,2 |
| 31 | 'vakif' | 'vakif' | 'vakif' | 'vakif':1 | 'vakif':1 | 'vakiflar':1 | 'vakif':1,2 |
| 32 | 'osm':* | 'osm':* | 'osm':* | 'osmanli':1 | 'osmanli':1 | 'osmanlilar':1 | 'osmanli':1,2 |
| 33 | 'sicil':* | 'sicil':* | 'sicil':* | 'sicil':1 | 'sicil':1 | 'sicillerinde':1 | 'sicil':1,2 |
| 34 | 'kad':* | 'kad':* | 'kad':* | 'hukmu':2 'kadi':1 | 'hukmu':2 'kadi':1 | 'hukmu':2 'kadinin':1 | 'hukmu':2,4 'kadi':1,3 |
| 35 | 'kad':* | 'kad':* | 'kad':* | 'gelenek':2 'kadı':1 | 'gelenek':2 'kadı':1 | 'gelenek':2 'kadim':1 | 'gelenek':2,4 'kadı':1,3 |
| 36 | 'kad':* | 'kad':* | 'kad':* | 'ai':3 'kadı':1 | 'ai':3 'kadı':1 | 'aile':3 'kadin':1 've':2 | 'ai':3,6 'kadı':1,4 |
| 37 | 'kad':* | 'kad':* | 'kad':* | 'kadi':1 'toplandi':2 | 'kadi':1 'toplandi':2 | 'kadilar':1 'toplandi':2 | 'kadi':1,3 'toplandi':2,4 |
| 38 | 'kad':* | 'kad':* | 'kad':* | 'kadilik':1 'makami':2 | 'kadilik':1 'makami':2 | 'kadilik':1 'makami':2 | 'kadilik':1,3 'makami':2,4 |
| 39 | 'kadi' <-> 'hukmu' | 'kadi' <-> 'hukmu' | 'kadi' <-> 'hukmu' | 'hukmu':2 'kadi':1 | 'hukmu':2 'kadi':1 | 'hukmu':2 'kadinin':1 | 'hukmu':2,4 'kadi':1,3 |
| 40 | 'kadi' <-> 'hukmu' | 'kadi' <-> 'hukmu' | 'kadi' <-> 'hukmu' | 'hukmu':2 'kadi':1 'ver':3 | 'hukmu':2 'kadi':1 'ver':3 | 'hukmu':2 'kadi':1 'verdi':3 | 'hukmu':2,5 'kadi':1,4 'ver':3,6 |
| 41 | '1310' | '1310' | '1310' | '1310':3 '29':1 'tarihli':4 'z':2 | '1310':3 '29':1 'tarihli':4 'z':2 | '1310':3 '29':1 'tarihli':4 'z':2 | '1310':3,7 '29':1,5 'tarihli':4,8 'z':2,6 |
| 42 | 'kadi':* | 'kadi':* | 'kadi':* | 'ai':3 'kadı':1 | 'ai':3 'kadı':1 | 'aile':3 'kadin':1 've':2 | 'ai':3,6 'kadı':1,4 |
| 43 | 'kadi':* | 'kadi':* | 'kadi':* | 'gelenek':2 'kadı':1 | 'gelenek':2 'kadı':1 | 'gelenek':2 'kadim':1 | 'gelenek':2,4 'kadı':1,3 |
| 44 | 'ule':* | 'ule':* | 'ulema':* | 'gorus':2 'ulema':1 | 'gorus':2 'ulema':1 | 'gorusu':2 'ulemanin':1 | 'gorus':2,4 'ulema':1,3 |
| 45 | 'sancak':* | 'sancak':* | 'sancak':* | 'sancakbe':1 | 'sancakbe':1 | 'sancakbeyi':1 | 'sancakbe':1,2 |
| 46 | 'timar':* | 'timar':* | 'timar':* | 'sipah':2 'timarli':1 | 'sipah':2 'timarli':1 | 'sipahi':2 'timarli':1 | 'sipah':2,4 'timarli':1,3 |
| 47 | 'vakif':* | 'vakif':* | 'vakif':* | 'vakfi':1 | 'vakfi':1 | 'vakfi':1 | 'vakfi':1,2 |
| 48 | 'git':* | 'git':* | 'gitti':* | 'gitmis':1 | 'gitmis':1 | 'gitmisti':1 | 'gitmis':1,2 |

### Extra checks (collisions, apostrophe/hyphen in the query, D side effects)

Last column D+q = D vector with the query de-hyphenated too.

| # | query | note | A | B | C | D | D+q |
|---|---|---|---|---|---|---|---|
| 1 | kadın | kadîm gelenek | ✓ | ✓ | ✗ | ✓ | ✓ |
| 3 | kadim | kadın ve aile | ✓ | ✓ | ✗ | ✓ | ✓ |
| 4 | kadın | Kadının hükmü | ✗ | ✗ | ✗ | ✗ | ✗ |
| 5 | kadın | kadılar toplandı | ✗ | ✗ | ✗ | ✗ | ✗ |
| 12 | fermanı | fermân | ✓ | ✓ | ✗ | ✓ | ✓ |
| 13 | ulemanın | ulema | ✗ | ✗ | ✗ | ✗ | ✗ |
| 14 | Mehmed | Mehmedi | ✓ | ✓ | ✗ | ✓ | ✓ |
| 15 | kitab | kitap | ✓ | ✓ | ✗ | ✓ | ✓ |
| 16 | şeyhü'l-islam | şeyhülislâm | ✗ | ✗ | ✗ | ✗ | ✓ |
| 17 | şeyhülislam | Şeyhü'l-İslâm fetvası | ✗ | ✗ | ✗ | ✓ | ✓ |
| 18 | Kitab-ı kadim | kitabı kadim | ✗ | ✗ | ✗ | ✗ | ✓ |
| 19 | "verdi kadı" | kadı hükmü verdi | ✗ | ✗ | ✗ | ✓ | ✓ |
| 20 | "hükmü verdi" | kadı hükmü verdi | ✓ | ✓ | ✓ | ✓ | ✓ |
| 21 | İstanbul | İstanbul'da yangın | ✓ | ✓ | ✗ | ✓ | ✓ |
| 22 | te'lif | telif | ✗ | ✓ | ✓ | ✓ | ✓ |
| 23 | Mehmed'in | Mehmed fermanı | ✗ | ✓ | ✗ | ✓ | ✓ |

(Rows 2, 6–11 of the script were dropped: they matched against stem strings rather than real words. Row 19 shows that D's concatenation makes the last word of copy 1 adjacent to the first word of copy 2, so the phrase `"verdi kadı"` falsely matches "kadı hükmü verdi".)

`ts_debug('tr_unaccent', 'Mehmed''in Şeyhü''l-İslâm Kitâb-ı')` under A:

| token type | token | lexeme |
|---|---|---|
| asciiword | Mehmed | mehmedi |
| asciiword | in | in |
| word | Şeyhü | Seyhu |
| hword | l-İslâm | l-Islam |
| hword_asciipart | l | l |
| hword_part | İslâm | Islam |
| hword | Kitâb-ı | Kitab-i |
| hword_part | Kitâb | Kitab |
| hword_part | ı | i |

This table is for token boundaries only. Where unaccent changed a token, ts_debug's lexeme column shows the unaccent filter's output (still capitalised). The final lexemes from to_tsvector are in Part 1 row 29 (`isla l l-isla seyhu`) and row 13 (`in mehmedi`).

## Part 3 — ranking sanity, query "kadı"

A sixth note "kadı hükmü verdi" was added because none of the five requested notes contains the bare word "kadı", so without it the C-first ordering cannot differ from A.

### A: ordered by (match desc, ts_rank desc, id)

| pos | id | note | A match | ts_rank(A) |
|---|---|---|---|---|
| 1 | 1 | Kadının hükmü | true | 0.060793 |
| 2 | 4 | kadılar toplandı | true | 0.060793 |
| 3 | 6 | kadı hükmü verdi | true | 0.060793 |
| 4 | 2 | kadîm gelenek | false | 0.000000 |
| 5 | 3 | kadın ve aile | false | 0.000000 |
| 6 | 5 | kadılık makamı | false | 0.000000 |

### C match first, then A match, then ts_rank(A)

| pos | id | note | C match | A match | ts_rank(A) |
|---|---|---|---|---|---|
| 1 | 6 | kadı hükmü verdi | true | true | 0.060793 |
| 2 | 1 | Kadının hükmü | false | true | 0.060793 |
| 3 | 4 | kadılar toplandı | false | true | 0.060793 |
| 4 | 2 | kadîm gelenek | false | false | 0.000000 |
| 5 | 3 | kadın ve aile | false | false | 0.000000 |
| 6 | 5 | kadılık makamı | false | false | 0.000000 |

### Extended: C exact, A stem, C prefix `kadi:*`, A prefix `kadi:*`

| pos | id | note | C exact | A stem | C prefix | A prefix |
|---|---|---|---|---|---|---|
| 1 | 6 | kadı hükmü verdi | true | true | true | true |
| 2 | 1 | Kadının hükmü | false | true | true | true |
| 3 | 4 | kadılar toplandı | false | true | true | true |
| 4 | 5 | kadılık makamı | false | false | true | true |
| 5 | 2 | kadîm gelenek | false | false | true | false |
| 6 | 3 | kadın ve aile | false | false | true | false |

### ts_rank under B vs D (D stores every lexeme twice)

| id | note | ts_rank(B) | ts_rank(D) |
|---|---|---|---|
| 1 | Kadının hükmü | 0.060793 | 0.075991 |
| 2 | kadîm gelenek | 0.000000 | 0.000000 |
| 3 | kadın ve aile | 0.000000 | 0.000000 |
| 4 | kadılar toplandı | 0.060793 | 0.075991 |
| 5 | kadılık makamı | 0.000000 | 0.000000 |
| 6 | kadı hükmü verdi | 0.060793 | 0.075991 |

## SQL used

### 00_setup.sql
```sql
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE TEXT SEARCH CONFIGURATION tr_unaccent (COPY = turkish);
ALTER TEXT SEARCH CONFIGURATION tr_unaccent
  ALTER MAPPING FOR hword, hword_part, word, asciiword, asciihword, hword_asciipart
  WITH unaccent, turkish_stem;
CREATE TEXT SEARCH CONFIGURATION tr_simple_unaccent (COPY = simple);
ALTER TEXT SEARCH CONFIGURATION tr_simple_unaccent
  ALTER MAPPING FOR hword, hword_part, word, asciiword, asciihword, hword_asciipart
  WITH unaccent, simple;

-- normalisation per configuration (same function applied to note text and to query text)
CREATE FUNCTION nA(t text) RETURNS text IMMUTABLE LANGUAGE sql AS $$ SELECT translate(t, 'ʿʾ', '') $$;
CREATE FUNCTION nB(t text) RETURNS text IMMUTABLE LANGUAGE sql AS $$ SELECT translate(t, 'ʿʾ''’', '') $$;
-- vectors
CREATE FUNCTION vA(t text) RETURNS tsvector IMMUTABLE LANGUAGE sql AS $$ SELECT to_tsvector('tr_unaccent', nA(t)) $$;
CREATE FUNCTION vB(t text) RETURNS tsvector IMMUTABLE LANGUAGE sql AS $$ SELECT to_tsvector('tr_unaccent', nB(t)) $$;
CREATE FUNCTION vC(t text) RETURNS tsvector IMMUTABLE LANGUAGE sql AS $$ SELECT to_tsvector('tr_simple_unaccent', nB(t)) $$;
CREATE FUNCTION vD(t text) RETURNS tsvector IMMUTABLE LANGUAGE sql AS $$ SELECT vB(t) || vB(replace(t, '-', '')) $$;
-- queries (websearch); D uses the B query
CREATE FUNCTION qA(q text) RETURNS tsquery IMMUTABLE LANGUAGE sql AS $$ SELECT websearch_to_tsquery('tr_unaccent', nA(q)) $$;
CREATE FUNCTION qB(q text) RETURNS tsquery IMMUTABLE LANGUAGE sql AS $$ SELECT websearch_to_tsquery('tr_unaccent', nB(q)) $$;
CREATE FUNCTION qC(q text) RETURNS tsquery IMMUTABLE LANGUAGE sql AS $$ SELECT websearch_to_tsquery('tr_simple_unaccent', nB(q)) $$;
-- prefix queries (to_tsquery 'word:*')
CREATE FUNCTION pA(w text) RETURNS tsquery IMMUTABLE LANGUAGE sql AS $$ SELECT to_tsquery('tr_unaccent', nA(w) || ':*') $$;
CREATE FUNCTION pB(w text) RETURNS tsquery IMMUTABLE LANGUAGE sql AS $$ SELECT to_tsquery('tr_unaccent', nB(w) || ':*') $$;
CREATE FUNCTION pC(w text) RETURNS tsquery IMMUTABLE LANGUAGE sql AS $$ SELECT to_tsquery('tr_simple_unaccent', nB(w) || ':*') $$;
CREATE FUNCTION lx(v tsvector) RETURNS text IMMUTABLE LANGUAGE sql AS $$ SELECT array_to_string(tsvector_to_array(v), ' ') $$;
```

### 01_lexemes.sql
```sql
WITH w(i, t) AS (VALUES
 (1,'kadı'),(2,'kadın'),(3,'kadılar'),(4,'kadının'),(5,'kadılık'),(6,'kadim'),(7,'kadîm'),
 (8,'ulema'),(9,'ʿulemâ'),(10,'ulemanın'),(11,'Mehmed'),(12,'Mehmet'),(13,$$Mehmed'in$$),(14,'Ahmed'),
 (15,'kitab'),(16,'kitap'),(17,'kitabın'),(18,'kitapları'),(19,$$İstanbul'da$$),(20,$$İstanbul'dan$$),(21,'istanbulda'),
 (22,$$te'lif$$),(23,'telif'),(24,$$me'mur$$),(25,'memur'),(26,$$şer'iyye$$),(27,'şerʿiyye'),(28,'şeriyye'),
 (29,$$Şeyhü'l-İslâm$$),(30,'şeyhülislam'),(31,'şeyhülislâm'),(32,'Kitâb-ı ḳadîm'),
 (33,'vakıf'),(34,'vakfı'),(35,'vakıflar'),(36,'sancak'),(37,'sancağı'),(38,'sancakbeyi'),
 (39,'defter'),(40,'defteri'),(41,'defterdar'),(42,'tımar'),(43,'timar'),(44,'tımarlı'),
 (45,'Irak'),(46,'ırak'),(47,'IRAK'),(48,'Isparta'),(49,'ısparta'),(50,'kır'),(51,'kir'),
 (52,'gitmişti'),(53,'gitti'),(54,'gidiyor'),(55,'Osmanlı'),(56,'Osmanlılar'),(57,'osmanli'),(58,'OSMANLI'),
 (59,'mahkeme'),(60,'mahkemesi'),(61,'sicil'),(62,'sicili'),(63,'sicillerinde'),(64,'kanunnâme'),(65,'kanunname'),
 (66,'Kanunî'),(67,'kanuni'),(68,'Süleyman'),(69,'suleyman'),(70,'millî'),(71,'milli'),(72,'millet'),
 (73,'ʿAlī'),(74,'Ali'),(75,$$Ali'ye$$),(76,'Âlî'),(77,'fermân'),(78,'fermanı'),(79,'ḥüccet'),(80,'hüccet'),(81,'hücceti'),
 (82,'Deñiz'),(83,'ḥāfıẓ'),(84,'ḫaṭṭ'),(85,'ġāzī'),(86,'1310'),(87,'29 Z 1310'),
 (88,$$Mehmed’in$$),(89,$$İstanbul’da$$))
SELECT '| ' || i || ' | ' || t || ' | ' || lx(vA(t)) || ' | ' || lx(vB(t)) || ' | ' || lx(vC(t)) || ' |' FROM w ORDER BY i;
```

### 02_unaccent.sql
```sql
WITH c(i, ch, name) AS (VALUES
 (1,'ñ','n tilde'),(2,'ẓ','z dot below'),(3,'ż','z dot above'),(4,'ḏ','d line below'),(5,'ḫ','h breve below'),
 (6,'ġ','g dot above'),(7,'ṭ','t dot below'),(8,'ṣ','s dot below'),(9,'ḥ','h dot below'),(10,'ḳ','k dot below'),
 (11,'ā','a macron'),(12,'ī','i macron'),(13,'ū','u macron'),(14,'â','a circumflex'),(15,'î','i circumflex'),(16,'û','u circumflex'),
 (17,'ç','c cedilla'),(18,'ğ','g breve'),(19,'ı','dotless i'),(20,'İ','I dot above'),(21,'ö','o diaeresis'),(22,'ş','s cedilla'),(23,'ü','u diaeresis'),
 (24,'ʿ','U+02BF ayn'),(25,'ʾ','U+02BE hamza'),(26,'’','U+2019'),
 (27,'Ñ','N tilde'),(28,'Ẓ','Z dot below'),(29,'Ż','Z dot above'),(30,'Ḏ','D line below'),(31,'Ḫ','H breve below'),
 (32,'Ġ','G dot above'),(33,'Ṭ','T dot below'),(34,'Ṣ','S dot below'),(35,'Ḥ','H dot below'),(36,'Ḳ','K dot below'),
 (37,'Ā','A macron'),(38,'Ī','I macron'),(39,'Ū','U macron'),(40,'Â','A circumflex'),
 (41,'a'||U&'\0304','a + combining macron (NFD)'),(42,'h'||U&'\0323','h + combining dot below (NFD)'),(43,'a'||U&'\0302','a + combining circumflex (NFD)'))
SELECT '| ' || ch || ' | ' || name || ' | U+' || upper(to_hex(ascii(ch))) || CASE WHEN length(ch)>1 THEN ' U+'||upper(to_hex(ascii(substr(ch,2)))) ELSE '' END
  || ' | ' || unaccent(ch) || ' | ' || CASE WHEN unaccent(ch) = ch THEN 'NOT covered' ELSE 'covered' END
  || ' | ' || coalesce(array_to_string(ts_lexize('unaccent', ch),','),'(null = unchanged)') || ' |'
FROM c ORDER BY i;
```

### 03_matrix.sql
```sql
CREATE TEMP TABLE pairs(i int, q text, note text, prefix bool DEFAULT false);
INSERT INTO pairs VALUES
 (1,'kadı','Kadının hükmü',false),(2,'kadı','kadîm gelenek',false),(3,'kadı','kadın ve aile',false),
 (4,'kadı','kadılar toplandı',false),(5,'kadı','kadılık makamı',false),
 (6,'ulema','ʿulemâ-yı kirâm',false),(7,'ulema','ulemanın görüşü',false),
 (8,'Mehmet',$$Sultan Mehmed'in fermanı$$,false),(9,'Mehmed','Mehmet Paşa',false),
 (10,'kitap','Kitâb-ı ḳadîm',false),(11,'kitabın','kitapları okudu',false),
 (12,'istanbul',$$İstanbul'da yangın$$,false),(13,'istanbul','ISTANBUL',false),(14,'istanbul','ıstanbul',false),
 (15,'ırak','IRAK',false),(16,'irak','Irak',false),(17,'Isparta','ısparta',false),
 (18,'telif',$$te'lif eserler$$,false),(19,'şeriyye','şerʿiyye sicili',false),(20,'şeriyye',$$şer'iyye sicili$$,false),
 (21,'şeyhülislam',$$Şeyhü'l-İslâm fetvası$$,false),(22,$$şeyhü'l-islam$$,'şeyhülislâm',false),
 (23,'tımar','timar sistemi',false),(24,'tımar','tımarlı sipahi',false),
 (25,'sancak','sancağı',false),(26,'sancak','sancakbeyi',false),
 (27,'gitti','gitmişti',false),(28,'gitmiş','gitmişti',false),
 (29,'kır','kir',false),
 (30,'vakıf','vakfı',false),(31,'vakıf','vakıflar',false),
 (32,'Osm','Osmanlılar',true),(33,'sicil','sicillerinde',true),
 (34,'kad','Kadının hükmü',true),(35,'kad','kadîm gelenek',true),(36,'kad','kadın ve aile',true),
 (37,'kad','kadılar toplandı',true),(38,'kad','kadılık makamı',true),
 (39,'"kadı hükmü"','Kadının hükmü',false),(40,'"kadı hükmü"','kadı hükmü verdi',false),
 (41,'1310','29 Z 1310 tarihli',false),
 -- extra: prefix variants of a few non-prefix rows, for comparison
 (42,'kadı','kadın ve aile',true),(43,'kadı','kadîm gelenek',true),(44,'ulema','ulemanın görüşü',true),
 (45,'sancak','sancakbeyi',true),(46,'tımar','tımarlı sipahi',true),(47,'vakıf','vakfı',true),(48,'gitti','gitmişti',true);
SELECT '| ' || i || ' | ' || q || CASE WHEN prefix THEN ' (P)' ELSE '' END || ' | ' || note || ' | '
 || CASE WHEN vA(note) @@ CASE WHEN prefix THEN pA(q) ELSE qA(q) END THEN '✓' ELSE '✗' END || ' | '
 || CASE WHEN vB(note) @@ CASE WHEN prefix THEN pB(q) ELSE qB(q) END THEN '✓' ELSE '✗' END || ' | '
 || CASE WHEN vC(note) @@ CASE WHEN prefix THEN pC(q) ELSE qC(q) END THEN '✓' ELSE '✗' END || ' | '
 || CASE WHEN vD(note) @@ CASE WHEN prefix THEN pB(q) ELSE qB(q) END THEN '✓' ELSE '✗' END || ' |'
FROM pairs ORDER BY i;
\echo ---- query and note forms
SELECT '| ' || i || ' | ' || CASE WHEN prefix THEN pA(q)::text ELSE qA(q)::text END || ' | ' || CASE WHEN prefix THEN pB(q)::text ELSE qB(q)::text END
 || ' | ' || CASE WHEN prefix THEN pC(q)::text ELSE qC(q)::text END || ' | ' || vA(note)::text || ' | ' || vB(note)::text || ' | ' || vC(note)::text || ' | ' || vD(note)::text || ' |'
FROM pairs ORDER BY i;
```

### 04_extra.sql
```sql
CREATE FUNCTION qDq(q text) RETURNS tsquery IMMUTABLE LANGUAGE sql AS $$ SELECT websearch_to_tsquery('tr_unaccent', replace(nB(q), '-', '')) $$;
\echo ---- collision checks (websearch, no prefix); last col = D vector with query also de-hyphenated
WITH p(i,q,note) AS (VALUES
 (1,'kadın','kadîm gelenek'),(2,'kadım','kadın ve aile'),(3,'kadim','kadın ve aile'),(4,'kadın','Kadının hükmü'),
 (5,'kadın','kadılar toplandı'),(6,'sultan','sul'),(7,'aile','ai'),(8,'paşa','pas'),(9,'Deniz','de'),
 (10,'yangın','yangı'),(11,'Isparta','ispar'),(12,'fermanı','fermân'),(13,'ulemanın','ulema'),
 (14,'Mehmed','Mehmedi'),(15,'kitab','kitap'),
 (16,$$şeyhü'l-islam$$,'şeyhülislâm'),(17,'şeyhülislam',$$Şeyhü'l-İslâm fetvası$$),(18,'Kitab-ı kadim','kitabı kadim'),
 (19,'"verdi kadı"','kadı hükmü verdi'),(20,'"hükmü verdi"','kadı hükmü verdi'),
 (21,'İstanbul','İstanbul''da yangın'),(22,'te''lif','telif'),(23,'Mehmed''in','Mehmed fermanı'))
SELECT '| ' || i || ' | ' || q || ' | ' || note || ' | '
 || CASE WHEN vA(note) @@ qA(q) THEN '✓' ELSE '✗' END || ' | '
 || CASE WHEN vB(note) @@ qB(q) THEN '✓' ELSE '✗' END || ' | '
 || CASE WHEN vC(note) @@ qC(q) THEN '✓' ELSE '✗' END || ' | '
 || CASE WHEN vD(note) @@ qB(q) THEN '✓' ELSE '✗' END || ' | '
 || CASE WHEN vD(note) @@ qDq(q) THEN '✓' ELSE '✗' END || ' |'
FROM p ORDER BY i;
\echo ---- stem dictionary directly
SELECT w || ' -> ' || coalesce(array_to_string(ts_lexize('turkish_stem', w),','),'NULL(stop?)') FROM unnest(ARRAY['kadi','kadin','kadim','kadı','kadın','deniz','de','aile','sultan','pasa','paşa','mehmed','ahmed','ulema','yangin','isparta','ferman']) w;
\echo ---- ts_debug for apostrophe / hyphen tokens
SELECT alias || ' | ' || token || ' | ' || coalesce(array_to_string(lexemes,','),'NULL') FROM ts_debug('tr_unaccent', $$Mehmed'in Şeyhü'l-İslâm Kitâb-ı$$) WHERE alias <> 'blank';
```

### 05_rank.sql
```sql
CREATE TEMP TABLE notes(id int, body text);
INSERT INTO notes VALUES (1,'Kadının hükmü'),(2,'kadîm gelenek'),(3,'kadın ve aile'),(4,'kadılar toplandı'),(5,'kadılık makamı'),(6,'kadı hükmü verdi');
\echo ---- query kadı, A ts_rank order (all 6 rows shown, matched first)
SELECT '| ' || row_number() OVER (ORDER BY (vA(body) @@ qA('kadı')) DESC, ts_rank(vA(body), qA('kadı')) DESC, id) || ' | ' || id || ' | ' || body || ' | ' || (vA(body) @@ qA('kadı')) || ' | ' || round(ts_rank(vA(body), qA('kadı'))::numeric, 6) || ' |'
FROM notes ORDER BY 1;
\echo ---- C-match first, then A-match, then ts_rank(A)
SELECT '| ' || row_number() OVER (ORDER BY (vC(body) @@ qC('kadı')) DESC, (vA(body) @@ qA('kadı')) DESC, ts_rank(vA(body), qA('kadı')) DESC, id) || ' | ' || id || ' | ' || body || ' | ' || (vC(body) @@ qC('kadı')) || ' | ' || (vA(body) @@ qA('kadı')) || ' | ' || round(ts_rank(vA(body), qA('kadı'))::numeric, 6) || ' |'
FROM notes ORDER BY 1;
\echo ---- same with prefix kadı:* (A prefix, C prefix)
SELECT '| ' || row_number() OVER (ORDER BY (vC(body) @@ qC('kadı')) DESC, (vA(body) @@ qA('kadı')) DESC, (vC(body) @@ pC('kadı')) DESC, (vA(body) @@ pA('kadı')) DESC, id) || ' | ' || id || ' | ' || body || ' | ' || (vC(body) @@ qC('kadı')) || ' | ' || (vA(body) @@ qA('kadı')) || ' | ' || (vC(body) @@ pC('kadı')) || ' | ' || (vA(body) @@ pA('kadı')) || ' |'
FROM notes ORDER BY 1;
\echo ---- ts_rank of query kadı under D (dup positions) vs B
SELECT '| ' || id || ' | ' || body || ' | ' || round(ts_rank(vB(body), qB('kadı'))::numeric,6) || ' | ' || round(ts_rank(vD(body), qB('kadı'))::numeric,6) || ' |' FROM notes ORDER BY id;
```

### 06_stemorder.sql
```sql
SELECT '| ' || w || ' | ' || coalesce(array_to_string(ts_lexize('turkish_stem', lower(w)),','),'(stop)') || ' | ' || coalesce(array_to_string(ts_lexize('turkish_stem', unaccent(lower(w))),','),'(stop)') || ' |'
FROM unnest(ARRAY['kadı','kadın','kadının','kadılar','kadim','sancak','sancağı','tımar','tımarlı','vakıf','vakfı','vakıflar','gitmişti','gitti','ulema','ulemanın','sicillerinde','kitabın','kitapları','yangın','paşa','Süleyman','sistemi','fetvası','Osmanlılar','toplandı','makamı','görüşü','şeyhülislam','mahkemesi']) w;
```
