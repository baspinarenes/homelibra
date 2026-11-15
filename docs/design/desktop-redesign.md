# Masaüstü yeniden tasarımı: kararlar

- Tarih: 2026-11-15 · Tuval: https://claude.ai/artifact/ERzt2dSbn3m4mgxu2mNTBL · ADR: [0012](../adr/0012-wide-screens-get-their-own-layout.md)
- Durum: tasarım turları bitti; spec: baspinarenes/homelibra#167. Q numaraları görüşmedeki sorulardır.

## Kapsam

- Geniş ekranın baştan tasarımı; her ekran, her durum (Q1). Telefon düzeni değişmez; telefonda değişmesi gereken bir şey çıkarsa ayrı ticket (Q5).
- Görsel kimlik aynı: token'lar, yazı tipleri, dik Charis SIL Alıntı, kutusuz bölümler, küçük köşeler. Yeni olan yapı, yoğunluk, hover/odak, klavye (Q6). Değerler `packages/ui/src/lib/tokens.ts`'ten; tasarım sistemi README'si koddan geride (kenarlı kart, 10/12 köşe).
- Geniş düzen pencere genişliğiyle seçilir, platformla değil: ~1024 px ve üstü. Tabletler bedavaya alır, ilk sürümde yalnız web doğrulanır (Q7).
- Tek PR: spec issue'su + engelleme ilişkili ticket'lar, tek entegrasyon dalında birleşir, `main`'e tek PR, `pnpm version:bump minor` (Q9).
- Tasarım Claude Design tuvalinde, "Homelibra Tasarım Sistemi" ile; her turda 3–5 varyant yan yana (Q3, Q4, Q10).

## Çerçeve (Tur 1, seçilen B)

- Solda 248 px kenar çubuğu: logo, en üstte birincil **Not al**, **Ara ⌘K**, Genel Bakış, Kaynaklar, Dizin, altında yalnız **Dosyalar** listesi (Etiketler listelenmez, Dizin'in içinde kalır), en altta Ayarlar (Q11–Q13).
- Ortada liste, sağda ayrıntı paneli. Ayrıntı paneli gerektirmeyen ekranlarda içerik iki sütuna yayılır.
- Genel Bakış'a yalnız geniş ekranda "Son notlar" bölümü eklenir (Q14).

## Collection ve Ara (Tur 2)

- Panel girişte kapalı; liste tam satırlı (Alıntı ve Yorum bütün) ve okunur genişlikte ortalı. Nota tıklayınca panel açılır; ✕ ya da Esc kapatır. Panel için ayar yok (Q15–Q18, Q21, Q25: ayar fikri bırakıldı).
- Panel açıkken liste sıkı satırlara geçer (her not tek satır); tıklanan not ekranda yerinde kalır (Q20, Q26).
- Panel tek notu odakta gösterir: Konum, büyük Alıntı, Yorum, etiketler, Kopyala ⌘C / Düzenle E / Kaynağı aç; üstte Source satırı ve kaynak içinde ‹ önceki · n / m · sonraki ›; altta "Bu kaynaktan diğer notlar", dosyada olmayanlar soluk ve "bu dosyada değil" (Q20).
- ~1200 px altında panel açıkken kenar çubuğu 64 px ikon rayına daralır; drawer/üstüste binen panel yok (Q21, Q27).
- "Markdown olarak kopyala" başlıkta düğme olarak durmaz, ⋯ menüsünde durur (kısayolu ⌘⇧C) (tuval yorumu).
- Dosyada arama: liste başlığı arama alanına döner, eşleşmeler `mark` ile, sayaç "3 / 15 not · 3 kaynak", "Bulunanları kopyala" (Q21).
- Ara: Collection'la aynı düzen (liste + panel); Tümü / Notlar / Kaynaklar segmenti, Tarih düğmesi, ipuçları "?" arkasında. Arama kuralları değişmez (#16, #132) (Q22).
- ⌘K hızlı arama penceresi bu PR'da: her yerden açılır, Etiket / Kaynak / Not sonuçlarından birkaçı ve "Ara'da tüm sonuçlar ⌘↵". Ayrı bir arama değil, aynı aramanın kısayolu (Q23). Açık soru: kelime başıyla eşleşme bugünkü aramada var mı.
- Kısayollar: ⌘K, N (not al), / (bu görünümde ara), ↑↓, ⌘C (notu kopyala), ⌘⇧C (dosyayı kopyala), E (düzenle), Esc. İki tuşlu gezinme yok (Q8, Q24).

## Kaynaklar ve Source sayfası (Tur 3)

- Kaynaklar tablo olur: Tür, Başlık, Yazar, Tarih, Not, Son not. Satıra tıklamak ya da ↵ Source sayfasını açar; ↑↓ satırda gezer; N seçili kaynağın Source sayfasını yazma sütunu odakta açar (Q29).
- Sütun başlığı sıralar, ikinci tıklama yönü çevirir; varsayılan Son not. Düğme geniş ekranda "Filtrele" olur, içinde yalnız Tür ve Tarih; seçili süzgeçler çip (Q30).
- Başlık hücresinin solunda 24×34 px Kapak; Kapağı olmayanda yer boş. Raf görünümü ve görünüm değiştirici yok (Q31).
- Source sayfası: üstte tek satır künye ("Künyenin tamamı ›" yerinde açar), ortada notlar Konum sırasında tam satırlı, sağda hep açık 360 px yazma sütunu (Q32).
- Nota tıklayınca sağ sütun o notu gösterir (Konum, Alıntı, Yorum, Kopyala ⌘C, Düzenle E) ve üstte "+ Yeni not"; Esc ya da N yazma alanına döner, yarım yazı kaybolmaz (Q33).
- ⌘↵ kaydeder; Alıntı ve Yorum boşalır, Konum "… devam" olarak kalır, imleç Alıntı'ya döner; yeni not Konum sırasındaki yerinde bir an vurgulanır (Q34).
- ~1200 px altında kenar çubuğu ikon rayına daralır, yazma sütunu açık kalır (Q35).
- "Markdown olarak kopyala" Source sayfasında da ⋯ menüsünde.

## Dizin ve Etiket sayfası (Tur 4)

- Dizin'de sekme yok: Dosyalar ve Etiketler yan yana iki sütun, her biri kendi sırasıyla (cihazda saklanır, sıralar değişmez: #140). "+ Yeni dosya" Dosyalar sütununun başında. Toplu birleştirme bu PR'da yok (Q36).
- Etiket satırı aynı (ad, "x not · y kaynak"); ⋯ (Yeniden adlandır, Birleştir…, Sil) yalnız hover ya da odakta görünür. Tıklama ya da ↵ Etiket sayfasını açar, ↑↓ gezer (Q37).
- Dosya satırı: ad, "15 not · 8 kaynak", etiket çipleri, son değişme; tıklayınca Collection (Q38).
- Etiket sayfası Collection'ın kesin düzenini aynen alır; başlıkta ETİKET, "Dosya yap" ve ⋯ (Markdown olarak kopyala). Anahtar ve / araması Collection'daki gibi (Q39).
- Etiket sayfasında kenar çubuğunda Dizin seçili, başlık üstünde "‹ Dizin · Etiketler"; Esc önce paneli kapatır, sayfadan çıkarmaz (Q40).

## Genel Bakış (Tur 5)

- Geniş sol sütun (~640): uyarı şeridi, Kaldığın yer, Son notlar; dar sağ sütun (~300): Okunuyor, Son kullanılan etiketler, Kütüphanen. Bölümlerin sırası değişmez (Q41).
- Son notlar: en son 5 not; Konum, kaynağın kısa adı, ne zaman, Alıntı (yoksa Yorum). Tıklayınca Source sayfası açılır, not sağ sütunda seçili. "Tümü" bağlantısı yok (Q42).
- Kaldığın yer: Not önde / Kaynak önde ayarı aynı; Alıntı büyük; tıklayınca Source sayfası yazma sütunu odakta, Konum "… devam" (Q43).
- Kütüphanen bugünküyle aynı, yalnız yeri sağ sütun (Q44).
- Boş durumlar içerik alanında ortalı, sağ sütun yok (Q45).
- ~1300 px altında sağ sütun alta iner, tek sütun; kenar çubuğu daralmaz (panel yok) (Q46).

## Kaynak formu ve not düzenleme (Tur 6)

- Kaynak formu Kaynaklar tablosunun yanında ~520 px panelde açılır (drawer değil, yan yana; Collection paneliyle aynı kural). "+ Kaynak ekle" açar, ✕ ya da Esc kapatır; değişiklik varken Esc satır içinde "Değişiklikler atılsın mı?" sorar. "Kaynağı düzenle" Source sayfasında aynı paneli yazma sütununun yerinde açar (Q47).
- Panelde alan adları alanın üstünde (panel sol sütuna dar); Kapak Başlık'ın yanında küçük sütunda (Q48, panele göre).
- Tür yan yana düğmeler, panelde iki satıra sarar; seçili dolu. Tür değişince form yerinde yeniden dizilir, gizlenen dolu alanlar "Bu türde gizli ama korunuyor" satırıyla (Q49).
- ISBN ile öner: öneri ISBN alanının altında açılır (kapak, başlık, yazar, yayınevi, "Forma aktar"); Kapak kaydedince eklenir (Q50).
- Not ayrı ekranda düzenlenmez: not nerede açıksa orada (Source sağ sütunu; Collection, Ara, Etiket paneli). E açar, ⌘↵ kaydeder, değişiklik varken Esc sorar. Kaynak alanı taşır; Notu sil ve Geri al aynı (#36) (Q51).
- Source sayfası dışında Not al / N: sağ panel yazma alanı olur, en üstte Kaynak (son not alınan seçili), sonra Konum, Alıntı, Yorum, Kaydet ⌘↵; liste sıkı satırlara geçer; kaydedince panel yazma alanı olarak kalır (Q52).

## Ayarlar, Giriş, metinler (Tur 7)

- Giriş: Giriş 4. Solda 64 px uygulama logosu ve "Homelibra", büyük başlık, kısa açıklama, üç adım (kaynağını ekle, notunu al, dosyanda topla) ve her birinin altında küçük gerçek bir örnek; sağda ~440 px beyaz giriş sütunu: bilgi metni, "okudum" kutusu (#116), iki düğme, "davetle açık" ve oturumsuz Gizlilik bağlantısı (#40). Başlık ve adım metinleri yeni yazı; spec'te ayrıca gözden geçirilecek (Q55).
- Ayarlar: Ayarlar 1. Ortada 640 px tek sütun, tek sayfa (#113). E-posta değiştir, Dışa aktar ve Hesabı sil aynı sütunda kendi sayfaları olarak açılır, üstlerinde "‹ Ayarlar" (Q53).
- Görünüm seçimleri satırın içinde yan yana düğmeler, seçim hemen uygulanır; telefonda bugünkü gibi (Q54).
- E-posta ile giriş Giriş 4'ün iki yarısını kullanır (sağ sütunda adres ve kod); Hoş geldin ve Kapalı hesap ortada 440 px tek sütun; hiçbirinde kenar çubuğu yok (Q56).
- Aydınlatma metni ve Kullanım koşulları 680 px okuma sütununda; başlıklardan çıkan içindekiler solda, yalnız üç ya da daha çok başlık varsa. Oturum açıksa kenar çubuğu, değilse sol üstte logo (Q57).
- Yeni dosya, Kaynak formu gibi Dizin'in yanında panelde açılır; Kaynağı silinmiş notlar Collection gibi liste + panel, panelde Kaynak alanından yeni kaynak seçilir ya da not silinir (Q58).
- Tasarım turları bitti. Sırada: ADR-0012'nin güncellenmesi, sonra bu günlükten spec (Q59).
