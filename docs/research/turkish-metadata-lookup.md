# Türkçe yayınlar için ISBN/DOI metadata kapsaması

Araştırma notu · GitHub issue #6 · Sorgular 2026-10-29 tarihinde çalıştırıldı. Besler: #2 (Source alanları: ISBN/DOI ve otomatik doldurma kararı).

## Soru

Google Books API, Open Library (arama ve ISBN API'leri), Crossref REST API, WorldCat ve Türkiye ISBN Ajansı (Kültür ve Turizm Bakanlığı) kaynakları Türkçe tarih kitaplarını ve Türkçe dergi makalelerini (DergiPark DOI'leri) ne oranda buluyor; dönen metadata (yazar, yıl, yayınevi, kapak) ne kadar güvenilir? Çıktı: kapsama tablosu ve "MVP'de ISBN/DOI otomatik doldurma (Source için) var mı" önerisi.

## Yöntem

- Gerçek sorgular, `curl` ve Python `urllib` ile, anahtarsız: Google Books (`googleapis.com/books/v1` ve anahtarsız "Dynamic Links" uç noktası), Open Library (`api/books`, `search.json`, `covers.openlibrary.org`), Crossref (`api.crossref.org`, `mailto` parametresiyle "polite" havuz), doi.org handle API. WorldCat ve ISBN Ajansı için erişim koşulları test edildi (aşağıda).
- Hiçbir URL'ye kişisel veri konmadı. Crossref `mailto` için proje adresi henüz olmadığından yer tutucu `homelibra-research@example.org` kullanıldı (varsayım: üretimde gerçek bir proje posta kutusu gerekir). Open Library'ye kimliksiz katmanda (≤1 istek/sn, aralara 1,1 sn bekleme) gidildi; kapak API'sine 26 istek (sınır 100/5 dk).
- Örneklem: 26 kitap (ISBN'ler önce Kitapyurdu ürün sayfasından alındı, D&R ile çapraz kontrol edildi; B05 Kronik'in kendi sayfasından) ve DergiPark'ta bulunan 14 makale (13 gerçek DOI + DOI'siz 1 makale). Yayınevi dağılımı: İletişim 7, İş Bankası Kültür 3, Kronik 3, Timaş 2, Tarih Vakfı Yurt 2, Dergâh 1, YKY 2, İmge 3, Kaynak 2, Doğan 1. Dergâh ve Tarih Vakfı siteleri curl'e kapalıydı (sırasıyla bağlantı yok ve Cloudflare 403), bu yüzden ISBN'ler kitapçı kataloğundan alındı.
- "Katalog yılı" Kitapyurdu'nun verdiği baskı tarihidir (ilk baskı yılı değil); D&R aynı ISBN için çoğu zaman farklı (daha eski) bir yıl veriyor. Yıl karşılaştırması bu yüzden sadece "makul mu" düzeyinde yapıldı.
- Kitap sorguları (ISBN başına): Google Dynamic Links `books.google.com/books?bibkeys=ISBN:<isbn>&jscmd=viewapi`; Open Library `openlibrary.org/api/books?bibkeys=ISBN:<isbn>&jscmd=data&format=json`; Open Library başlık araması `openlibrary.org/search.json?title=<başlık>&author=<soyad>`; kapak `covers.openlibrary.org/b/isbn/<isbn>-M.jpg?default=false`; Crossref `api.crossref.org/works?filter=isbn:<isbn>`. Makale sorguları: `api.crossref.org/works/<doi>`, `api.crossref.org/works?query.bibliographic=<başlık>`, `doi.org/api/handles/<doi>`, DergiPark OAI-PMH `GetRecord`.

### Örneklem: kitaplar

| ID | ISBN-13 | Yazar, *Başlık* (Yayınevi, katalog yılı) |
|---|---|---|
| B01 | 9789754700114 | Hanioğlu, *Osmanlı İttihad ve Terakki Cemiyeti ve Jön Türklük* (İletişim, 1989) — **Kitapyurdu'nun ISBN'i hatalı**, bkz. Bulgular |
| B02 | 9786256774254 | Tunaya, *Türkiye'de Siyasal Partiler C.1* (Kronik, 2024) |
| B03 | 9786057707345 | Ahmad, *İttihat ve Terakki 1908-1914* (Kaynak, 2016) |
| B04 | 9789750525360 | Zürcher, *Modernleşen Türkiye'nin Tarihi* (İletişim, 2025) |
| B05 | 9789752430365 | Ortaylı, *İmparatorluğun En Uzun Yüzyılı* (Kronik, 2018) |
| B06 | 9789752637061 | Ortaylı, *İmparatorluğun En Uzun Yüzyılı* (Timaş, 2017) |
| B07 | 9789750521188 | Bora, *Cereyanlar* (İletişim, 2017) |
| B08 | 9789750805882 | İnalcık, *Osmanlı İmparatorluğu Klasik Çağ* (YKY, 2018) |
| B09 | 9786254053696 | İnalcık, *Devlet-i 'Aliyye V* (İş Bankası Kültür, 2021) |
| B10 | 9786051141756 | Karpat, *Türk Demokrasi Tarihi* (Timaş, 2021) |
| B11 | 9789755334257 | Karpat, *Osmanlı'da Değişim, Modernleşme ve Uluslaşma* (İmge, 2006) |
| B12 | 9789754705317 | Koçak, *Türkiye'de Millî Şef Dönemi C.1* (İletişim, 2025) |
| B13 | 9789750508394 | Koçak, *Tek-Parti Döneminde Muhalif Sesler* (İletişim, 2015) |
| B14 | 9789754700237 | Mardin, *Jön Türklerin Siyasî Fikirleri* (İletişim, 2015) |
| B15 | 9786050911886 | Toprak, *Türkiye'de Millî İktisat 1908-1918* (Doğan Kitap, 2017) |
| B16 | 9789753332453 | Tunçay, *T.C.'nde Tek-Parti Yönetiminin Kurulması* (Tarih Vakfı Yurt, 2010) |
| B17 | 9789750500930 | Quataert, *Osmanlı İmparatorluğu 1700-1922* (İletişim, 2020) |
| B18 | 9789755332413 | Akşin, *Jön Türkler ve İttihat ve Terakki* (İmge, 2017) |
| B19 | 9789755330471 | Timur, *Türk Devrimi ve Sonrası* (İmge, 2018) |
| B20 | 9786057707352 | Ahmad, *Modern Türkiye'nin Oluşumu* (Kaynak, 2015) |
| B21 | 9786257660211 | Kara, *Türkiye'de İslâmcılık Düşüncesi 2* (Dergâh, 2021) |
| B22 | 9786053326793 | Mantran, *Osmanlı İmparatorluğu Tarihi* (İş Bankası Kültür, 2019) |
| B23 | 9789753330664 | Faroqhi, *Osmanlı Kültürü ve Gündelik Yaşam* (Tarih Vakfı Yurt, 2014) |
| B24 | 9786256989085 | Ortaylı, *Osmanlı'yı Yeniden Keşfetmek* (Kronik, 2025) |
| B25 | 9789750811593 | Tanpınar, *XIX. Asır Türk Edebiyatı Tarihi* (YKY, 2010) |
| B26 | 9786053326205 | Emecen, *Osmanlı İmparatorluğu'nun Kuruluş ve Yükseliş Tarihi* (İş Bankası Kültür, 2019) |

### Örneklem: makaleler (DergiPark)

| ID | DOI | Dergi (DergiPark kısa adı) |
|---|---|---|
| D01 | 10.37879/belleten.2026.345 | Belleten, TTK (`ttkbelleten`) |
| D02 | 10.37879/belleten.2026.363 | Belleten, TTK (`ttkbelleten`) |
| D03 | 10.18589/oa.2035352 | Osmanlı Araştırmaları (`oa`) |
| D04 | 10.18589/oa.2035422 | Osmanlı Araştırmaları (`oa`) |
| D05 | 10.26650/iutd.1791665 | Tarih Dergisi, İÜ (`iutarih`) |
| D06 | 10.26650/iutd.1757153 | Tarih Dergisi, İÜ (`iutarih`) |
| D07 | 10.26650/iuturkiyat.1867489 | Türkiyat Mecmuası (`iuturkiyat`) |
| D08 | 10.26650/iuturkiyat.1867495 | Türkiyat Mecmuası (`iuturkiyat`) |
| D09 | 10.35239/tariharastirmalari.1836499 | Tarih Araştırmaları Dergisi, AÜ DTCF (`tariharastirmalari`) |
| D10 | 10.35239/tariharastirmalari.1900324 | Tarih Araştırmaları Dergisi, AÜ DTCF (`tariharastirmalari`) |
| D11 | 10.18513/egetid.1827360 | Tarih İncelemeleri Dergisi, Ege (`egetid`) |
| D12 | (DOI yok) | OTAM, AÜ (`otam`), makale 1963282, 2026 |
| D13 | 10.32925/tday.2026.142 | Türk Dili Araştırmaları Yıllığı-Belleten, TDK (`belleten`) — tarih dışı kontrol örneği |
| D14 | 10.32925/tday.2026.143 | Türk Dili Araştırmaları Yıllığı-Belleten, TDK (`belleten`) — tarih dışı kontrol örneği |

Not: DergiPark'ta `belleten` kısa adı TDK'nin dil dergisine aittir; TTK Belleten `ttkbelleten` altındadır ve DOI'leri belleten.gov.tr'ye çözümlenir.

## Bulgular

### Kapsama tablosu: kitaplar (yayın × servis)

Sütunlar: Google DL = anahtarsız Dynamic Links ile ISBN'in Google Books'ta kaydı var mı (parantez: kapak küçük resmi döndü mü). OL ISBN = Open Library `api/books` kaydı. OL başlık = başlık+yazar aramasında eşleşen bir kayıt var mı ("ISBN eşleşti": aynı baskı sonuçlar arasında). OL kapak = `covers.openlibrary.org` 200 döndü mü. Crossref = ISBN filtresiyle kayıt sayısı. WorldCat ve ISBN Ajansı sütunu yok: ikisi de anahtarsız/herkese açık sorgu sunmuyor (bkz. API koşulları).

| ID | Google DL (kapak) | OL ISBN | OL başlık | OL kapak | Crossref |
|---|---|---|---|---|---|
| B01 | evet (evet) — ama *Tutunamayanlar* | evet — ama *Tutunamayanlar* | evet (1986 İletişim baskısı, doğru kitap) | evet (yanlış kitap) | 0 |
| B02 | evet (hayır) | hayır | hayır | hayır | 0 |
| B03 | evet (hayır) | hayır | hayır | hayır | 0 |
| B04 | evet (hayır) | evet | evet | evet | 0 |
| B05 | evet (hayır) | evet | evet (ISBN eşleşti) | evet | 0 |
| B06 | evet (evet) | evet | evet (ISBN eşleşti) | evet | 0 |
| B07 | evet (hayır) | evet | evet (ISBN eşleşti) | evet | 0 |
| B08 | evet (evet) | evet | evet (Kronik 2019 baskısı) | evet | 0 |
| B09 | evet (hayır) | evet | hayır | evet | 0 |
| B10 | evet (hayır) | evet | evet (ISBN eşleşti) | evet | 0 |
| B11 | evet (hayır) | evet | evet (ISBN eşleşti) | evet | 0 |
| B12 | evet (evet) | hayır | hayır | hayır | 0 |
| B13 | evet (hayır) | evet | evet (ISBN eşleşti) | hayır | 0 |
| B14 | evet (evet) | evet (başlık = dizi adı) | evet (1964 İş Bankası baskısı) | evet | 0 |
| B15 | evet (hayır) | evet | evet (ISBN eşleşti) | hayır | 0 |
| B16 | **hayır** | evet | evet (ISBN eşleşti) | evet | 0 |
| B17 | evet (hayır) | evet | evet (ISBN eşleşti) | evet | 0 |
| B18 | evet (hayır) | evet | evet (ISBN eşleşti) | hayır | 0 |
| B19 | evet (evet) | evet | evet (ISBN eşleşti) | evet | 0 |
| B20 | evet (hayır) | evet | evet (ISBN eşleşti) | evet | 0 |
| B21 | evet (hayır) | hayır | evet (Dergâh 2016 baskısı) | hayır | 0 |
| B22 | evet (hayır) | evet | evet (ISBN eşleşti) | evet | 0 |
| B23 | evet (evet) | evet (yazar boş) | hayır | hayır | 0 |
| B24 | evet (hayır) | evet | evet (Timaş 2006 baskısı) | hayır | 0 |
| B25 | evet (evet) | evet | evet (ISBN eşleşti) | hayır | 0 |
| B26 | evet (hayır) | evet | hayır | evet | 0 |

Toplamlar (B01'in hatalı ISBN'i düşülerek, N=25):

| Servis | ISBN ile bulma | Kapak | Not |
|---|---|---|---|
| Google Books, Dynamic Links (anahtarsız) | 24/25 kayıt var | 7/25 küçük resim | Yazar/yıl/yayınevi vermez; tamamı `noview` (önizleme yok) |
| Google Books volumes API (anahtarsız) | **test edilemedi** | — | Her istek HTTP 429, `quota_limit_value: "0"` (oturum başında ve 16:28 UTC'de tekrar) |
| Open Library `api/books` (ISBN) | 21/25 | 15/21 kayıtta kapak; `covers` uç noktası 16/26 | Kaçanlar: B02, B03, B12, B21 (hepsi Google'da var) |
| Open Library `search.json` (başlık+yazar) | 19/25 eşleşme; 14'ünde aynı baskı | — | 5 eşleşme başka (çoğu daha eski) baskıya ait; B02, B03, B09, B12, B23, B26 eşleşmedi |
| Crossref (ISBN filtresi) | 0/26 | — | Türkçe ticari kitaplar için DOI kaydı yok |
| WorldCat Search API v2 | test edilemedi | — | Anahtarsız istek: HTTP 401 "API Key or Authorization header is required"; web sitesi curl'e 429 |
| Türkiye ISBN Ajansı | sorgu arayüzü yok | — | ekygm.gov.tr yayıncı portalı; herkese açık ISBN sorgusu/API bulunamadı |

### Kapsama tablosu: makaleler (DergiPark DOI'leri × servis)

| ID | Crossref `works/{doi}` | Yazar / yıl / dergi / yayıncı (Crossref) | Özet | Lisans | `query.bibliographic` sırası | doi.org hedefi |
|---|---|---|---|---|---|---|
| D01 | evet | Erbil, Mouton / 2026 / Belleten / "Turk Tarih Kurumu" | evet | evet | 1 | belleten.gov.tr |
| D02 | evet | Tellioğlu / 2026 / Belleten / "Turk Tarih Kurumu" | evet | evet | 1 | belleten.gov.tr |
| D03 | evet | Kasumovic / 2026 / Osmanlı Araştırmaları / "Osmanli Arastirmalari" | evet | hayır | 1 | dergipark.org.tr |
| D04 | evet | Majewski / 2026 / Osmanlı Araştırmaları / "Osmanli Arastirmalari" | evet | hayır | 1 | dergipark.org.tr |
| D05 | evet | Çelik, Çolak / 2026 / Tarih Dergisi / Istanbul University | evet | hayır | 1 | iupress.istanbul.edu.tr |
| D06 | evet | Genç / 2026 / Tarih Dergisi / Istanbul University | evet | hayır | 1 | iupress.istanbul.edu.tr |
| D07 | evet | Alan / 2026 / Türkiyat Mecmuası / Istanbul University | evet | hayır | 1 | iupress.istanbul.edu.tr |
| D08 | evet | Aydın / 2026 / Türkiyat Mecmuası / Istanbul University | evet | hayır | 1 | iupress.istanbul.edu.tr |
| D09 | evet | Kurt / 2026 / AÜ DTCF Tarih Araştırmaları Dergisi / "Ankara Universitesi..." | evet | hayır | 1 | dergipark.org.tr |
| D10 | evet | Dietrich / 2026 / AÜ DTCF Tarih Araştırmaları Dergisi / "Ankara Universitesi..." | evet | hayır | 1 | dergipark.org.tr |
| D11 | evet | Aldırmaz / 2026 / Tarih İncelemeleri Dergisi / "Tarih Incelemeleri Dergisi" | evet | hayır | 1 | dergipark.org.tr |
| D12 | DOI yok | — | — | — | ilk sonuç ilgisiz (skor 41) | — |
| D13 | evet | "Sümeyra ALAN" / 2026 / TDK Belleten / "Turk Dili Arastırmalari..." | evet | hayır | 1 | dergipark.org.tr |
| D14 | evet | "Harun COŞKUN" / 2026 / TDK Belleten / "Turk Dili Arastırmalari..." | evet | hayır | 1 | dergipark.org.tr |

Toplam: 13/13 DOI Crossref'te bulundu; 13/13 başlık aramasında 1. sırada (skor 44–166). Cilt/sayı/sayfa 8/13'te tam (İÜ dergilerinde cilt "0" yer tutucu, TDK'de hiç yok). Sadece TTK lisans URL'si bildiriyor. DOI'siz D12 için hiçbir servis bir şey bulamaz; DergiPark politikası geriye dönük DOI vermediğinden eski makalelerde bu durum sık olacaktır.

### Metadata kalitesi notları

**Google Books.** Anahtarsız volumes API kapalı olduğundan yazar/yıl/yayınevi kalitesi API üzerinden ölçülemedi. Dynamic Links yalnızca kayıt varlığı, kapak küçük resmi ve önizleme durumu verir; 25 kitabın 24'ü kayıtlı, kapak 7'sinde. Açık ısrarla altı kitabın Google "kitap hakkında" sayfası (HTML, API değil, ISO-8859-9 kodlu) okundu: başlık+yazar var, ancak dördünde Türkçe karakterler bozuk ("Türkiyede Siyasal Partiler: Ikinci Mesrutiyet", "Ittihat ve Terakki", "Turkiye'de milli şef dönemi", "Türkiyede Islamcilik Düsüncesi ... Ismail Kara"). Google, Open Library'nin kaçırdığı dört kitabı (B02, B03, B12, B21) biliyor.

**Open Library (ISBN).** 21 doğru kayıtta: başlık 9'unda ASCII'ye indirgenmiş ("Imparatorlugun En Uzun Yüzyili", "Turk Demokrasi Tarihi", "Osmanli Imparatorlugu 1700-1922"), 1'inde yanlış (B14'te başlık dizi adı "Bütün eserleri diszisi"), B04'te başlığa baskı notu karışmış. Yazar 20/21'de var (B23 boş), üçünde aksansız ("Ilber Ortayli", "Tanil Bora", "Mete Tuncay"), birinde BÜYÜK HARF ("FERIDUN M. EMECEN."). Yayınevi 21/21'de var ama aynı yayınevi için tutarsız biçimler: "Iletisim Yayinevi" / "İletişim" / "Iletisim Yayincilik" / "İletişim Yayınları"; B06'da bozuk ikinci değer "Tima Yaynlar"; B23'te vakfın eski adı. Tarih biçimi karışık: 13 kayıtta Amazon tarzı "Nov 01, 2018", 7'sinde yalnız yıl; yıllar çoğunlukla katalogdaki baskıdan farklı (örn. B10 OL 2010, katalog 2021). Kapak 15/21.

**Open Library (başlık araması).** Eser (work) düzeyinde döner: `first_publish_year` ilk baskı yılıdır (B05/B06 → 1983 Hil Yayın, B14 → 1964, B25 → 1967), `publisher` listesi tüm baskıları karıştırır. Eser tespiti için iyi, baskı/yayınevi doldurmak için yanıltıcı. Aksanlı/aksansız varyantlar ayrı kayıtlar olarak duruyor ("Modernlesen Turkiye'nin Tarihi" vs "Modernleşen Türkiye'nin Tarihi").

**Crossref.** Yazar adları ayrı `given`/`family` alanlarıyla ve aksanlarıyla doğru (TDK dergisinde soyadı BÜYÜK HARF). Yıl (`issued`), dergi adı (`container-title`), ISSN, tür hep var. Yayıncı adı üye adıdır ve çoğunlukla aksansız ("Turk Tarih Kurumu", "Osmanli Arastirmalari"); DergiPark OAI kaydı aynı makale için yayıncıyı "Türkiye Diyanet Vakfı İslam Araştırmaları Merkezi" olarak veriyor, yani "yayıncı" alanı kaynağa göre değişiyor. `language` alanı güvenilmez: TTK'nin İngilizce makalesi "tr", İÜ'nün Türkçe makaleleri "en". Özet 13/13'te var. DOI hedef sayfası her zaman DergiPark değil (TTK → belleten.gov.tr, İÜ → iupress.istanbul.edu.tr).

**DergiPark'ın kendi arayüzleri (ek bulgu).** Makale sayfaları `citation_doi`, `citation_title`, `citation_author`, `citation_publication_date`, `citation_issn` meta etiketleri taşıyor. Ayrıca `https://dergipark.org.tr/api/public/oai/` adresinde OAI-PMH 2.0 uç noktası çalışıyor (`Identify` OK, yalnız `oai_dc`, dergi başına set, `GetRecord` kimliği `oai:dergipark.org.tr:record/<makaleId>`): iki dilli başlık, "Soyad, Ad" biçiminde yazar, kurum, tarih, DOI, dergi + cilt/sayı ve dil döner. Kullanım koşulları bulunamadı (bkz. Açık sorular).

**Kitapçı katalogları (ISBN'in kaynağı).** B01 örneği: Kitapyurdu, Hanioğlu'nun kitabına 975-470-011-0 diyor; Google, Open Library ve D&R aynı ISBN'i Oğuz Atay'ın *Tutunamayanlar*'ına bağlıyor. Yani ISBN'in kendisi de yanlış girilmiş olabilir; otomatik doldurma dönen başlığı kullanıcıya göstermeden kaydetmemeli. D&R'da "Suraiya Froqhi" (B23), Kitapyurdu'nda "Terrakki" (B18) gibi yazım hataları ve iki kitapçı arasında farklı baskı yılları görüldü.

### API koşulları, kota, lisans

| Servis | Anahtar | Kota / hız | Lisans ve koşullar | Durum (2026-10-29) |
|---|---|---|---|---|
| Google Books API v1 | Gerekli: belgeye göre herkese açık veri istekleri "API key or an access token" ile tanımlanmalı | Günlük proje kotası belgede yazmıyor; forumlarda 1.000/gün anılıyor (doğrulanmadı). Anahtarsız: 429 `RESOURCE_EXHAUSTED`, `quota_limit_value: "0"` | Books ToS: uygulama için kullanıcıdan ücret alınamaz; marka kuralları: "powered by Google" ibaresi ve her sonuçta Google Books'a belirgin bağlantı zorunlu, sonuçlar değiştirilemez | Anahtarsız erişim fiilen yok |
| Google Dynamic Links | Yok ("No API key or other authorization is needed") | Belirtilmemiş; olağan dışı hacimde captcha uyarısı | Aynı marka kuralları; sunucu tarafı/çevrimdışı sorgu için tasarlanmamış (görüntülenebilirlik kullanıcı konumuna bağlı) | Çalışıyor, ama yalnız kapak/önizleme/bağlantı |
| Open Library | Yok; uygulama kaydı formu isteniyor | Kimliksiz 1 istek/sn; `User-Agent` + iletişim ile 3 istek/sn; toplu indirme ve yüksek trafik yasak; kapaklar ISBN ile 100 istek/IP/5 dk, aşımda 403 | "Internet Archive does not assert any new copyright..."; bazı katkılarda hak sorunu olabilir; kapak API'si toplu indirme için değil, geri bağlantı rica ediliyor | Çalışıyor |
| Crossref REST API | Yok ("No sign-up is required") | Başlıklarda ilan edilir: gözlenen `x-rate-limit-limit` public-array 1/sn, polite-array 3/sn, polite-single 10/sn; 429 görülünce geri çekil | "almost none of the metadata is subject to copyright, and you may use it for any purpose"; bazı özetler telifli olabilir | Çalışıyor; `mailto` ile polite havuz |
| WorldCat Search API v2 | WSKey zorunlu | Belirtilmemiş | OCLC Cataloging and Metadata aboneliği **ve** FirstSearch/WorldCat Discovery aboneliği şart; özel şartlar; v1 desteği 31.12.2024'te bitti | Anahtarsız 401; ticari ortaklık gerektirir |
| Türkiye ISBN Ajansı (KYGM) | Portal yayıncılara, girişli | — | ekygm.gov.tr "Sayın Yayıncılarımız" portalı; sayfa sayaçları (örn. "Atanan ISBN Sayısı") var, sorgu yok. Bakanlık "Katalog Tarama" olarak TO-KAT ve KAŞİF'e yönlendiriyor | Herkese açık API yok; TO-KAT sonuçları tarayıcıda JS ile yükleniyor, KAŞİF ASP.NET WebForms (POST/ViewState); ikisinin de belgelenmiş API'si bulunamadı |
| DergiPark (TÜBİTAK ULAKBİM) | Yok | Belirtilmemiş | DOI hizmeti uygun dergilere ücretsiz (Crossref ücretini ULAKBİM öder); "Geriye dönük DOI ataması yapılmaz"; OAI-PMH koşulları bulunamadı | Sayfalar ve OAI-PMH curl'e açık |

## Öneri

1. **DOI ile otomatik doldurma MVP'ye girsin.** Crossref anahtarsız, 13/13 kapsama, yazar/yıl/dergi güvenilir, lisans açık. Uygulama: `works/{doi}` + proje posta kutusuyla `mailto`, 10 istek/sn altında, yanıtı önbelleğe al; `container-title`'ı dergi, `issued`'ı yıl, `publisher`'ı yalnız öneri olarak al; `language`'a güvenme. DergiPark URL'si yapıştırılırsa sayfadaki `citation_doi` meta etiketinden DOI'yi çıkarıp Crossref'e git; DOI'si olmayan eski DergiPark makaleleri (D12 gibi) elle kalır. Başlıktan DOI bulma (`query.bibliographic`) ikinci adım olarak eklenebilir, ama skor eşiği ve kullanıcı onayı şart (D12'de ilgisiz sonuç döndü).
2. **ISBN ile otomatik doldurma MVP'ye "öneri" olarak girsin, "gerçek" olarak değil.** Tek anahtarsız ve kullanılabilir kaynak Open Library: 21/25 bulma, 15/21 kapak, ama başlık/yayınevi/tarih biçimleri dağınık. Bu yüzden: Open Library `api/books` ile alanları ön-doldur, kullanıcı her alanı görüp onaylasın/düzeltsin, dönen başlığı ISBN'in yanında göster (B01 türü yanlış ISBN'leri yakalar), ISBN-13 sağlama hanesini doğrula, boş kalan alanları boş bırak (uydurma). Kapak için Open Library `covers` yeterli; Google Dynamic Links kapağı yalnız marka kurallarına uyulacaksa (logo + bağlantı) eklenmeli.
3. **Google Books volumes API MVP'ye girmesin.** Anahtar, kota yönetimi ve marka yükümlülüğü getiriyor; metadata kalitesi Türkçe kitaplarda ölçülemedi. Anahtar alındıktan sonra aynı örneklemle ölçülüp ikinci kaynak olarak değerlendirilebilir (Açık sorular 1).
4. **WorldCat ve ISBN Ajansı kapsam dışı.** WorldCat abonelik ister; ISBN Ajansı'nın herkese açık sorgusu yok. TO-KAT/KAŞİF ancak Z39.50/SRU gibi bir arayüz doğrulanırsa gündeme gelir.
5. Source modeli için çıkarım (#2'ye girdi): `isbn`/`doi` alanları tanımlayıcı olarak saklanmalı, otomatik doldurma kaynağı ve zamanı (örn. "openlibrary, 2026-10-29") kaydedilmeli ki kullanıcı düzeltmeleri sonraki sorgularda ezilmesin. Yıl alanı için "eldeki baskının yılı" mı "ilk baskı yılı" mı sorusu modelde netleşmeli; servisler ikisini karıştırıyor.

## Açık sorular

1. Google Books API anahtarıyla aynı 26 ISBN için yazar/yıl/yayınevi/kapak kalitesi nedir? (Anahtar oluşturmak insan işi; sorgu URL'leri Yöntem'de.)
2. Crossref `mailto` ve Open Library `User-Agent` için hangi proje posta kutusu kullanılacak? Yer tutucu adres üretimde kullanılmamalı.
3. DergiPark OAI-PMH uç noktasının kullanım koşulları ve hız sınırı var mı? (`Identify` yanıtındaki yönetici adresi: oai@dergipark.org.tr.) Makale sayfalarını ve meta etiketlerini okumak DergiPark kullanım şartlarına uygun mu?
4. TO-KAT (toplukatalog.tr) veya Milli Kütüphane KAŞİF için Z39.50/SRU ya da başka bir makine arayüzü var mı? Aramada belge bulunamadı.
5. e-Devlet üzerinde bir ISBN sorgulama hizmeti var mı? turkiye.gov.tr curl'e 406 döndü, doğrulanamadı.
6. Open Library'nin kaçırdığı yeni baskılar (B02 2024, B12 2025) için kullanıcı katkısı mı (Open Library'ye kayıt ekleme) yoksa Google ikinci kaynağı mı tercih edilecek?
7. Örneklem sadece 2026 tarihli DergiPark makalelerini içeriyor; 2010 öncesi makalelerde DOI'siz oran ne? (Politika gereği yüksek olması bekleniyor, ölçülmedi.)

## Kaynaklar

Resmî belgeler:
- Google Books API, Using the API (anahtar zorunluluğu, `isbn:`/`intitle:`): https://developers.google.com/books/docs/v1/using
- Google Books API Terms of Service: https://developers.google.com/books/terms
- Google Books API Family Branding Guidelines: https://developers.google.com/books/branding
- Google Books Dynamic Links: https://developers.google.com/books/docs/dynamic-links
- Google Books kota forumu (ikincil, doğrulanmamış 1.000/gün): https://discuss.google.dev/t/how-to-apply-for-higher-google-books-api-quota/321977
- Open Library Developers/API (hız sınırları, kayıt formu): https://openlibrary.org/developers/api
- Open Library Books API: https://openlibrary.org/dev/docs/api/books
- Open Library Search API: https://openlibrary.org/dev/docs/api/search
- Open Library Covers API: https://openlibrary.org/dev/docs/api/covers
- Open Library Licensing: https://openlibrary.org/developers/licensing
- Crossref REST API (kayıt gerekmez, lisans): https://www.crossref.org/documentation/retrieve-metadata/rest-api/
- Crossref REST API tips (429'da geri çekilme): https://www.crossref.org/documentation/retrieve-metadata/rest-api/tips-for-using-the-crossref-rest-api/
- Crossref rest-api-doc README (polite havuz, `mailto`, hız başlıkları, `query.bibliographic`; kendisi "deprecated" işaretli): https://github.com/CrossRef/rest-api-doc
- OCLC WorldCat Search API (abonelik şartı, v1 sonu): https://www.oclc.org/developer/api/oclc-apis/worldcat-search-api.en.html
- OCLC WSKey isteme: https://www.oclc.org/developer/api/keys.en.html
- KYGM ISBN-ISSN-ISMN-Derleme sayfası: https://kygm.ktb.gov.tr/TR-291180/isbn-issn-ismn-derleme.html
- KYGM Katalog Tarama (TO-KAT ve KAŞİF bağlantıları): https://kygm.ktb.gov.tr/TR-135/katalog-tarama.html
- KYGM Bilgi Sistemi (ekygm yayıncı portalı): https://ekygm.gov.tr/Home/Index
- Ulusal Toplu Katalog: https://toplukatalog.tr/ · Milli Kütüphane KAŞİF: https://kasif.mkutup.gov.tr/
- DergiPark Hakkında (ULAKBİM, dışa aktarım/harmanlama): https://dergipark.org.tr/tr/pub/page/hakkinda
- DergiPark DOI Hizmeti (geriye dönük DOI yok, ücretsiz): https://dergipark.org.tr/tr/pub/page/doi-hizmeti
- DergiPark OAI-PMH: https://dergipark.org.tr/api/public/oai/?verb=Identify · https://dergipark.org.tr/api/public/oai/?verb=ListSets · https://dergipark.org.tr/api/public/oai/?verb=GetRecord&metadataPrefix=oai_dc&identifier=oai:dergipark.org.tr:record/2035352
- TTK Belleten son sayı (10.37879 DOI'leri): https://belleten.gov.tr/son-sayi

Gerçek sorgular (2026-10-29, bu notun kanıtı):
- Google anahtarsız 429 örneği: https://www.googleapis.com/books/v1/volumes?q=isbn:9789750521188
- Google Dynamic Links örneği: https://books.google.com/books?bibkeys=ISBN:9789752637061&jscmd=viewapi
- Google "kitap hakkında" sayfası, B01 → Tutunamayanlar: https://books.google.com/books?id=fv4HAQAAMAAJ
- Open Library ISBN örneği: https://openlibrary.org/api/books?bibkeys=ISBN:9789750521188&jscmd=data&format=json · B01: https://openlibrary.org/api/books?bibkeys=ISBN:9789754700114&jscmd=data&format=json
- Open Library arama örneği: https://openlibrary.org/search.json?title=Cereyanlar&author=Bora
- Open Library kapak örneği: https://covers.openlibrary.org/b/isbn/9789750521188-M.jpg?default=false
- Crossref DOI örneği: https://api.crossref.org/works/10.18589/oa.2035352 · başlık araması: https://api.crossref.org/works?query.bibliographic=Coping+with+Life%27s+Challenges+in+Ottoman+Sarajevo
- Crossref ISBN filtresi örneği: https://api.crossref.org/works?filter=isbn:9789750521188
- doi.org handle örneği: https://doi.org/api/handles/10.37879/belleten.2026.345
- WorldCat API anahtarsız 401: https://americas.discovery.api.oclc.org/worldcat/search/v2/bibs?q=ti:cereyanlar · site (curl'e 429): https://search.worldcat.org/isbn/9780131103627

ISBN'lerin alındığı katalog sayfaları (Kitapyurdu; B05 Kronik; B07 ayrıca D&R):
- B01 https://www.kitapyurdu.com/kitap/osmanli-ittihad-ve-terakki-cemiyeti-ve-jon-turkluk/125884.html
- B02 https://www.kitapyurdu.com/kitap/turkiyede-siyasal-partiler-cilt-1-ikinci-mesrutiyet-donemi/671609.html
- B03 https://www.kitapyurdu.com/kitap/ittihat-ve-terakki-19081914/24731.html
- B04 https://www.kitapyurdu.com/kitap/modernlesen-turkiyenin-tarihi/2578.html
- B05 https://kronikkitap.com/kitap/imparatorlugun-en-uzun-yuzyili/
- B06 https://www.kitapyurdu.com/kitap/imparatorlugun-en-uzun-yuzyili/105931.html
- B07 https://www.kitapyurdu.com/kitap/cereyanlar-turkiyede-siyasi-ideolojiler/413349.html · https://www.dr.com.tr/kitap/cereyanlar-turkiyede-siyasi-ideolojiler/arastirma-tarih/politikaarastirma/turkiye-politika/urunno=0001683644001
- B08 https://www.kitapyurdu.com/kitap/osmanli-imparatorlugu-klasik-cag-13001600/52679.html
- B09 https://www.kitapyurdu.com/kitap/devleti-aliyye-v-osmanli-imparatorlugu-uzerine-arastirmalar/581630.html
- B10 https://www.kitapyurdu.com/kitap/turk-demokrasi-tarihi-sosyal-kulturel-ekonomik-temeller/148623.html
- B11 https://www.kitapyurdu.com/kitap/osmanlida-degisim-modernlesme-ve-uluslasma/83418.html
- B12 https://www.kitapyurdu.com/kitap/turkiyede-milli-sef-donemi-19381945-cilt-1/2511.html
- B13 https://www.kitapyurdu.com/kitap/muhalif-sesler-tekparti-doneminde/247994.html
- B14 https://www.kitapyurdu.com/kitap/jon-turklerin-siyasi-fikirleri-18951908/18179.html
- B15 https://www.kitapyurdu.com/kitap/turkiyede-milli-iktisat-19081918/286936.html
- B16 https://www.kitapyurdu.com/kitap/turkiye-cumhuriyetinde-tekparti-yonetiminin-kurulmasi-19231931-ciltli/151489.html
- B17 https://www.kitapyurdu.com/kitap/osmanli-imparatorlugu-17001922/50476.html
- B18 https://www.kitapyurdu.com/kitap/jon-turkler-ve-ittihat-ve-terrakki/19051.html
- B19 https://www.kitapyurdu.com/kitap/turk-devrimi-ve-sonrasi/19126.html
- B20 https://www.kitapyurdu.com/kitap/modern-turkiyenin-olusumu/24594.html
- B21 https://www.kitapyurdu.com/kitap/turkiyede-islamcilik-dusuncesi-2/300172.html
- B22 https://www.kitapyurdu.com/kitap/osmanli-imparatorlugu-tarihi/254106.html
- B23 https://www.kitapyurdu.com/kitap/osmanli-kulturu-ve-gundelik-yasam-ortacagdan-yirminci-yuzyila/9470.html
- B24 https://www.kitapyurdu.com/kitap/osmanliyi-yeniden-kesfetmek/636864.html
- B25 https://www.kitapyurdu.com/kitap/xix-asir-turk-edebiyati-tarihi/88495.html
- B26 https://www.kitapyurdu.com/kitap/osmanli-imparatorlugunun-kurulus-ve-yukselis-tarihi-13001600/380476.html

DOI'lerin alındığı DergiPark makale sayfaları:
- D01 https://dergipark.org.tr/tr/pub/ttkbelleten/article/2014224 · D02 https://dergipark.org.tr/tr/pub/ttkbelleten/article/2014231
- D03 https://dergipark.org.tr/tr/pub/oa/article/2035352 · D04 https://dergipark.org.tr/tr/pub/oa/article/2035422
- D05 https://dergipark.org.tr/tr/pub/iutarih/article/1791665 · D06 https://dergipark.org.tr/tr/pub/iutarih/article/1757153
- D07 https://dergipark.org.tr/tr/pub/iuturkiyat/article/1867489 · D08 https://dergipark.org.tr/tr/pub/iuturkiyat/article/1867495
- D09 https://dergipark.org.tr/tr/pub/tariharastirmalari/article/1836499 · D10 https://dergipark.org.tr/tr/pub/tariharastirmalari/article/1900324
- D11 https://dergipark.org.tr/tr/pub/egetid/article/1827360 · D12 (DOI yok) https://dergipark.org.tr/tr/pub/otam/article/1963282
- D13 https://dergipark.org.tr/tr/pub/belleten/article/1978546 · D14 https://dergipark.org.tr/tr/pub/belleten/article/1978553
