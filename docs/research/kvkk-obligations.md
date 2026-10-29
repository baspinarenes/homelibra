# KVKK yükümlülükleri: küçük bir Türk SaaS için (Homelibra)

> **Bu belge hukuki görüş değildir.** Ürün kararı (hesap, hosting bölgesi, rıza akışı) için
> mevzuat ve Kurum kaynaklarından derlenmiş bilgidir. Rakamlar ve eşikler 2026-10-29 itibarıyla
> okunan birincil kaynaklara dayanır; yürürlüğe alınmadan önce bir hukukçuya doğrulatılmalıdır.

- Ticket: baspinarenes/homelibra#9 (besler: #14 Hesap, davet ve veri sahipliği)
- Tarih: 2026-10-29

## Soru

Türkiye'deki akademisyenlerin araştırma notlarını (her kullanıcının **Library**'si) ve hesap
verilerini saklayan, muhtemelen yurt dışında barındırılacak küçük bir SaaS, 6698 sayılı Kişisel
Verilerin Korunması Kanunu (KVKK) ve bağlı mevzuat karşısında neyi borçlu? Özellikle:

1. VERBİS kayıt yükümlülüğü ve güncel istisna eşikleri (son Kurul kararları).
2. Aydınlatma yükümlülüğü ve açık rıza; rızanın **gerekmediği** haller.
3. 7499 sayılı Kanun (2024) sonrası yurt dışına aktarım: yeterlilik kararı, standart sözleşme,
   5 iş günü bildirimi; sunucular AB veya ABD'deyse ne olur.
4. İlgili kişi hakları (erişim, silme, düzeltme); veri taşınabilirliği KVKK'da var mı.
5. ETK/İYS: ticari e-posta kuralları.
6. Kurumun çerez rehberi.

Çıktı: yükümlülük listesi ve bunun hesap, hosting bölgesi ve rıza akışı kararlarına etkisi.

## Yöntem

- Kanun ve yönetmelik metinleri mevzuat.gov.tr'nin resmî PDF'lerinden okundu (HTML sayfaları
  metni sunmuyor); Resmî Gazete sayfaları doğrulama için kullanıldı. Kurum rehberleri, Kurul
  karar özetleri ve kamuoyu duyuruları kvkk.gov.tr'den; ticari ileti kuralları mevzuat.gov.tr,
  ticaret.gov.tr ve iys.org.tr'den alındı. Hukuk bürosu yazıları yalnızca kaynak bulmak için
  kullanıldı; hiçbir iddia onlara dayandırılmadı.
- Her satırda köşeli parantezli numara `## Kaynaklar` bölümündeki URL'ye işaret eder.
- Erişilemeyen/sınırlı kaynaklar: iys.org.tr sayfaları JavaScript ile yüklendiği için metin
  arama motoru özetinden okundu; dayanak olarak Yönetmelik metni [27] kullanıldı.
  kvkk.gov.tr'deki "Sicile Kayıt İstisnaları" tablosu çekilemedi; aynı liste Kurumun
  "Sorularla VERBİS" rehberinden [9] alındı.
- **Varsayımlar** (ticket'ta belirtilmeyen, bu belgede sabitlenen):
  - Homelibra'nın işleticisi Türkiye'de yerleşik bir gerçek kişi veya küçük şirkettir; yıllık
    çalışan sayısı 50'nin, varsa yıllık mali bilanço toplamı 100 milyon TL'nin çok altındadır.
  - Hesap verisi (e-posta, ad, oturum/cihaz kayıtları) ve Library içeriği (Source, Note,
    Excerpt, Comment, Tag) için **veri sorumlusu** Homelibra'dır. Library içinde kullanıcının
    üçüncü kişilere dair yazdığı bilgiler de kişisel veri olabilir (bkz. Açık sorular 6).
  - Ana faaliyet konusu özel nitelikli kişisel veri işleme **değildir** (sağlık, din, etnik
    köken gibi veriler ürün tarafından toplanmaz).
  - Yurt dışındaki hosting/e-posta/kimlik doğrulama sağlayıcıları Homelibra adına işlem yapan
    **veri işleyen**lerdir.
  - Kapalı beta ücretsizdir; ödeme yoktur. Ticari e-posta (duyuru, pazarlama) henüz
    kararlaştırılmamıştır.

## Bulgular

### Yükümlülük tablosu

| # | Yükümlülük | Homelibra'ya uygulanır mı? | Ne gerektirir | Kaynak |
|---|---|---|---|---|
| 1 | Genel ilkeler ve işleme şartı (m.4, m.5) | Evet, her işleme için | Hesap ve Library verisi için şart: "bir sözleşmenin kurulması veya ifasıyla doğrudan doğruya ilgili olması" (m.5/2-c); ücretsiz beta da sözleşmedir. Hukuki yükümlülük (m.5/2-ç) ve meşru menfaat (m.5/2-f, denge testiyle) güvenlik logları gibi yan amaçlar için. Açık rıza yalnızca bu şartlardan hiçbiri yoksa (pazarlama, zorunlu olmayan çerez/analitik). | [1] m.5 |
| 2 | Özel nitelikli veri (m.6, 7499 ile değişik) | Ürün bunları toplamaz; kullanıcı notlarına girebilir | Homelibra kendi adına özel nitelikli veri işlememeli; işlerse m.6/3'teki şartlar ve Kurulca belirlenen ek önlemler gerekir. | [1] m.6 |
| 3 | Aydınlatma yükümlülüğü (m.10 + Tebliğ) | Evet | Veri elde edilirken (kayıt anında) asgari içerik: veri sorumlusunun kimliği, amaç, kime/hangi amaçla aktarım, toplama yöntemi ve hukuki sebebi, m.11 hakları. Tebliğ m.5: rızadan **ayrı** yapılır (f), talebe bağlı değildir (d), ispat yükü veri sorumlusunda (e), hukuki sebep açıkça yazılır (h), alıcı grupları belirtilir (ı), muğlak/genel ifade yok (g). Katmanlı aydınlatma (ön bilgi + tam metne yönlendirme) Kurum rehberinde tanımlı. Sicile kayıtlı ise Sicil bilgileriyle uyumlu olmalı (ç). | [1] m.10; [15] m.4-6; [16] |
| 4 | Açık rıza (m.3/a) | Yalnızca pazarlama e-postası ve zorunlu olmayan çerez/üçüncü taraf analitik için | Belirli konuya ilişkin, bilgilendirmeye dayanan, özgür iradeyle; "battaniye rıza" geçersiz; yazılı şart değil, elektronik ortamda alınabilir; geri alınabilir; ispat veri sorumlusunda. Kurul: aydınlatma onayı ile rıza aynı kutucukta alınamaz (2018/90); rıza **hizmetin ön şartı** yapılamaz, amaçlar tek rızada birleştirilemez, çerezler için opt-in gerekir (2024/1361, toplam 265.000 TL ceza). | [1] m.3, m.5/1; [19]; [20]; [22] |
| 5 | VERBİS'e kayıt (m.16) | **Hayır** (varsayımlarla): istisna kapsamında | İstisna: "Yıllık çalışan sayısı 50'den az ve yıllık mali bilanço toplamı 100 milyon TL'den az olan gerçek veya tüzel kişi veri sorumlularından ana faaliyet konusu özel nitelikli kişisel veri işleme olmayanlar" (2018/87, 2023/1154 ile 25→100 milyon). İki kriter kümülatif; bilanço esasına göre defter tutmayanlar için yalnızca çalışan sayısı (2025/2393). Eşik aşılırsa 30 gün içinde kayıt (Sicil Yön. m.8/2). "Sicile kayıt yükümlülüğünden istisna olma durumu Kanun hükümlerinden de istisna olmak anlamına gelmemektedir." | [1] m.16; [9]; [10]; [11]; [12]; [14] |
| 6 | Yurt dışına aktarım (m.9, 7499 ile değişik; Yönetmelik) | **Evet**, sunucu/veri işleyen yurt dışındaysa | Yurt dışındaki bulutta depolama üç kriter sağlanınca aktarımdır (Rehber). Sıra: (a) yeterlilik kararı — **hiçbir ülke için henüz yok** ("Bu konuda Kurul tarafından henüz bir belirleme yapılmamıştır"); (b) uygun güvence — pratikte Kurulun **standart sözleşmesi** (SS-2: veri sorumlusundan veri işleyene), metin değiştirilmez, iki taraf imzalar, "imzaların tamamlanmasından itibaren beş iş günü içinde" Kuruma bildirilir (fiziki, KEP veya Standart Sözleşme Bildirim Modülü); bildirim tarafı sözleşmede belirlenmemişse veri aktaran (Homelibra) bildirir; (c) istisnai hâller yalnızca **arızi** aktarım için — düzenli hosting için açık rıza yolu **kullanılamaz**. Sonraki aktarımlar (alt veri işleyenler) için de aynı güvenceler (m.9/8). Geçici m.3'teki eski açık rıza rejimi 1/9/2024'te bitti. | [1] m.9, geçici m.3; [2]; [3] m.6, 7, 14, 16; [4]; [5]; [6]; [7]; [8] |
| 7 | Veri güvenliği (m.12/1-3) | Evet | Uygun güvenlik düzeyi için "gerekli her türlü teknik ve idari tedbir"; veri işleyenle **müştereken** sorumluluk (m.12/2); gerekli denetimleri yapma (m.12/3). Yönetmelik m.7/2: veri işleyen yurt dışında olsa da güvencelerden veri sorumlusu sorumlu kalır. | [1] m.12; [3] m.7 |
| 8 | Veri ihlali bildirimi (m.12/5; Kurul 2019/10) | Evet | İhlali öğrenmeden itibaren "gecikmeksizin ve en geç 72 saat içinde" Kurula (ihlalbildirim.kvkk.gov.tr formu); etkilenen kişilere "makul olan en kısa süre içerisinde". Veri işleyen ihlali veri sorumlusuna gecikmeksizin bildirir; ihlal müdahale planı beklenir. | [1] m.12/5; [23] |
| 9 | İlgili kişi hakları ve başvuru (m.11, m.13; Başvuru Tebliği) | Evet | Haklar: işlenip işlenmediğini öğrenme, bilgi talep etme, amaç, aktarılan üçüncü kişileri bilme, düzeltme, silme/yok etme, bunların alıcılara bildirilmesi, otomatik analize itiraz, zarar giderimi. **Veri taşınabilirliği hakkı m.11'de yoktur.** Başvuru: yazılı, KEP, güvenli e-imza, mobil imza veya "daha önce bildirilen ve veri sorumlusunun sisteminde kayıtlı bulunan elektronik posta adresi"; en geç **30 gün** içinde ücretsiz sonuçlandırma; ret gerekçeli olur. | [1] m.11, m.13; [17] m.5-7 |
| 10 | Silme, yok etme, anonim hâle getirme (m.7; İmha Yönetmeliği) | Evet | İşleme şartları ortadan kalkınca re'sen veya talep üzerine; talep hâlinde en geç 30 gün; aktarılmış üçüncü kişilere bildirim. **Saklama ve imha politikası** yalnızca Sicile kayıtlı olanlara zorunlu (m.5); politikası olmayanlar yükümlülük doğduktan sonraki **3 ay** içinde siler (m.11); politika varsa periyodik imha en çok 6 ay. İşlem kayıtları en az 3 yıl saklanır (m.7/3). | [1] m.7; [18] m.5, 7, 11, 12 |
| 11 | Çerezler (Kurum rehberi, Temmuz 2025) | Evet (web); native uygulama için bkz. Açık sorular 5 | Kriter A (iletişimin sağlanması) ve Kriter B ("kullanıcının hizmet almak için açıkça talep ettiği bilgi toplum hizmetleri için kesinlikle gerekli") kapsamındaki çerezler rıza gerektirmez: oturum, kimlik doğrulama, güvenlik, kullanıcı tercihleri, rıza yönetimi, **birinci taraf analitik** (IP maskeleme, çapraz takip yok, üçüncü taraflara iletilmez). Diğerleri (reklam, üçüncü taraf analitik, sosyal eklenti) için opt-in açık rıza: eşit "kabul et / reddet / tercihler" butonlu panel, rıza gereken çerezler başta **pasif**; sözleşme/gizlilik metnine iliştirilmiş rıza geçersiz; **çerez duvarı** özgür iradeyi sakatlar; rıza yorgunluğundan kaçınılır. Rehber "masaüstü ve mobil web siteleri veya web uygulamalar" için geçerli; piksel, local storage, parmak izi kapsam dışı. | [25]; [22] |
| 12 | Ticari elektronik ileti (ETK m.6-8; Yönetmelik; İYS) | **Yalnızca** tanıtım/pazarlama e-postası gönderilirse | Önceden onay (ETK m.6/1); "Ticari elektronik ileti göndermek isteyen gerçek ve tüzel kişiler İYS'ye kaydolur" ve "İYS üzerinde onayı bulunmayan alıcılara ticari elektronik ileti gönderilemez" (Yön. m.5/2-3); İYS dışı alınan onay 3 iş günü içinde İYS'ye kaydedilir, kaydedilmeyen onay geçersiz (m.7/11-12); onay istemek için ileti gönderilemez (m.7/4); her iletide kolay ve ücretsiz ret imkânı, ret 3 iş günü içinde uygulanır ve İYS'ye bildirilir (m.9); kayıtlar 3 yıl (m.13). **Onay gerekmeyen**: "Devam eden abonelik, üyelik veya ortaklık durumu ile … bilgi güncelleme … bildirimleri", mal/hizmetin "değişiklik, kullanım ve bakımına yönelik" iletiler — "Ancak bu tür bildirimlerde herhangi bir mal veya hizmet özendirilemez veya bunların tanıtımı yapılamaz" (m.6/1-2); tacir/esnaf alıcılar (m.6/3, İYS'ye kayıt + ret kontrolü ile). Ayrıca Kurul, rızasız pazarlama e-postasını KVKK ihlali sayar. | [26] m.6-8, 12; [27] m.5-7, 9, 13; [28]; [29] |
| 13 | İdari para cezaları (m.18; 2026 tutarları) | Risk referansı | 2026 (yeniden değerleme %25,49): aydınlatma 85.437–1.709.200 TL; veri güvenliği 256.357–17.092.242 TL; Kurul kararına uymama 427.263–17.092.242 TL; VERBİS 341.809–17.092.242 TL; standart sözleşme bildirimi (m.18/1-d, 7499 ile) 90.308–1.806.177 TL — bu sonuncusu veri işleyene de uygulanır (m.18/2). ETK m.12/1-a (onaysız ileti) 2026: 2.859–14.309 TL; bir defada birden fazla kişiye gönderimde on katına kadar (m.12/2). | [1] m.18; [24]; [26] |
| 14 | Yurt dışında yerleşik veri sorumlusu kuralları (temsilci, VERBİS) | Hayır | Homelibra Türkiye'de yerleşik varsayıldı. İşletici yurt dışına taşınırsa yurt dışında yerleşik tüm veri sorumluları VERBİS'e kayıtlıdır ve temsilci atar. | [9]; [14] m.11 |

### Ayrıntı: VERBİS eşiklerinin tarihçesi

| Karar | Tarih / RG | İçerik |
|---|---|---|
| 2018/87 | 19.07.2018 / RG 18.08.2018 | Çalışan < 50 **ve** bilanço < 25 milyon TL, ana faaliyet özel nitelikli veri değil → istisna |
| 2023/1154 | 06.07.2023 / RG 25.07.2023 | Bilanço eşiği 25 → **100 milyon TL** ("25 milyon TL limitinin mevcut yıllık mali bilanço toplamlarına göre düşük kaldığı") |
| 2025/1572 | 04.09.2025 / RG 01.10.2025 | Ana faaliyeti özel nitelikli veri işleme olup çalışan < 10 **ve** bilanço < 10 milyon TL olanlar da istisna |
| 2025/2393 | 25.12.2025 / duyuru 12.01.2026 | Bilanço esasına göre defter tutanlarda iki kriter kümülatif; tutmayanlarda yalnızca çalışan sayısı |
| 2026/1026 | 13.05.2026 / duyuru 14.05.2026 | 2025 bilançosuyla eşiği aşan kurumlar vergisi mükelleflerine kayıt için 05.06.2026'ya kadar süre |

Kaynak: [9], [10], [11], [12], [13]. "Yıllık mali bilanço toplamı" yıllık gelir/kurumlar vergisi
beyannamesi ekindeki bilançonun aktif/pasif toplamıdır [12].

### Ayrıntı: yurt dışına aktarımın yürürlük takvimi

- 7499 sayılı Kanun RG 12.03.2024 (32487); KVKK m.6, 9, 18 ve geçici m.3 değişiklikleri
  **1/6/2024**'te yürürlüğe girdi [1] (değişiklik tablosu), [2].
- Yönetmelik RG 10.07.2024 (32598), yayımı tarihinde yürürlükte [3].
- Standart sözleşme metinleri ve bağlayıcı şirket kuralları formları: Kurul 04.06.2024, 2024/959 [5].
- Standart Sözleşme Bildirim Modülü: Kurul 17.10.2024, 2024/1793; duyuru 25.10.2024 [7].
- Eski m.9/1 (açık rızayla aktarım) geçiş hükmüyle 1/9/2024'e kadar uygulandı; sona erdi [1] geçici m.3.
- Yeterlilik kararı: 2026-10-29 itibarıyla hiçbir ülke, sektör veya uluslararası kuruluş için
  verilmemiş [5]. Yeterlilik kararı en geç dört yılda bir değerlendirilir, RG'de yayımlanır [1] m.9/2.

Rehber (Ocak 2025) aktarımın üç kriterini AB Veri Koruma Kurulu rehberinden alır ve açıkça der:
"bir hizmet sağlayıcı tarafından sunulan yurt dışında bulunan bir bulutta depolama da bu üç
kriterin karşılanması koşuluyla bir aktarım olarak kabul edilecektir" [4]. Yönetmelik m.7:
veri işleyenin yurt dışına aktarımı veri sorumlusunun sorumluluğunu kaldırmaz [3].

Standart sözleşmenin uygulanabilirliği (Yönetmelik m.14): metin **değiştirilemez**; yabancı
dilde akdedilirse Türkçe metin esas; bildirime imza yetkisi belgeleri ve yabancı dildeki
belgelerin **noter onaylı çevirisi** eklenir; taraf/içerik değişikliği ve sona erme de bildirilir
[3]. Kurum duyurusu (05.02.2025): iki tarafın imza tarihi sözleşmede yazılı olmalı, geriye dönük
yürürlük ifadesi konulmamalı, yalnızca seçimlik/alternatif maddeler değiştirilebilir [8].

Sağlayıcıların durumu (ürün kararı için önemli, hukuki dayanak değil):
- **Google Cloud**: DPA Ek 3 "Turkey" bölümü — fatura adresi Türkiye'deyse Google "Turkish SCCs"
  sunar; müşteri imzadan itibaren 5 iş günü içinde Kuruma bildirmekle yükümlüdür [30].
- **AWS**: 1.1.2024'ten itibaren Türkiye hesaplarının sözleşme tarafı AWS Turkey; KVKK standart
  sözleşmesi imzaladığına dair resmî bir sayfa **bulunamadı** [31].
- **Microsoft**: yalnızca topluluk yanıtı var (SS-2 kullanılabileceği, imzalayan kuruluşun
  Microsoft'ça teyit edilmesi gerektiği); resmî belge **bulunamadı** [32].
- Hetzner, Supabase, Vercel, Cloudflare için arama sonuç vermedi (bkz. Açık sorular 1).

### Ayrıntı: rıza akışı için Kurul'un çizdiği sınırlar

- Aydınlatma metni "okudum" onayı ile açık rıza aynı kutucukta alınamaz; "Aydınlatma
  yükümlülüğünün yerine getirilmesi herhangi bir onaya bağlı değildir" [20].
- Pazarlama rızası iletişim formuyla birleştirilip hizmete bağlanınca "özgür iradeyle açıklanma"
  unsuru sakatlanır; "hizmetin ön şartı olarak zorunlu tutulmaması" talimatı [22].
- Zorunlu olmayan çerezler için "opt-in mekanizmasına göre açık rıza alınması gerektiği" [22], [25].
- Açık rıza geri alınabilir; "geri alma beyanı veri sorumlusuna ulaştığı andan itibaren hüküm
  doğurur" [19].
- Kişisel veri ilgili kişiden alınmadıysa (ör. davet edilen kişinin e-postası) aydınlatma "ilk
  iletişim kurulması esnasında" yapılır (Tebliğ m.6/b) [15].

## Hesap ve hosting kararına etkisi

### Hesap (#14 için girdi)

1. **Giriş yöntemi.** E-posta magic link, hesap verisi için sözleşme şartına (m.5/2-c) dayanır;
   açık rıza gerekmez. E-posta gönderimi yurt dışı bir sağlayıcıdan yapılıyorsa e-posta adresi o
   sağlayıcıya aktarılır → o sağlayıcıyla da standart sözleşme (satır 6). Google ile giriş,
   kimlik sağlayıcıyı ayrı bir veri alıcısı yapar ve aydınlatma metninde alıcı grubu olarak
   yazılmalıdır; aktarım analizi sağlayıcı bazında yapılmalı. Alt veri işleyen sayısını küçük
   tutmak uyum maliyetini doğrudan düşürür.
2. **Kayıt ekranı.** Katmanlı aydınlatma: kısa ön bilgi + tam metne bağlantı [16]; "okudum"
   kutusu rıza kutusundan ayrı [20]. Rıza kutuları yalnızca gerçekten rızaya dayanan amaçlar için
   (pazarlama e-postası; üçüncü taraf analitik varsa), varsayılan **boş**, hesabı açmanın ön şartı
   **değil** [22], [25]. Hesap verisi için rıza istenmez; istenirse rızanın geri alınması işlemi
   hukuksuz hâle getirir (Tebliğ m.5/f ve Kurum sayfası [19]).
3. **Hesap silme.** Kullanıcı kendi başına silebilmeli; her hâlde talepten itibaren **30 gün**
   içinde sonuçlandırma (m.13/2, İmha Yön. m.12) [1], [18]. Silme, yedekler ve alt veri işleyenler
   dâhil tasarlanmalı; aktarılmış alıcılara bildirim (m.11/f); silme kayıtları 3 yıl [18]. Sicile
   kayıtlı olmadığımız sürece yazılı imha politikası zorunlu değil ama "yükümlülük doğduktan
   sonraki 3 ay" kuralı geçerli [18] m.11.
4. **Library'yi dışa aktarma.** KVKK'da veri taşınabilirliği hakkı **yok** [1] m.11; buna rağmen
   JSON/Markdown dışa aktarma, m.11/b "bilgi talep etme" ve m.11/a-c taleplerini ucuz ve kanıtlanabilir
   biçimde karşılar. Haritadaki "veri sahipliği" kararı için hukuki zorunluluk değil, ürün tercihi.
5. **Başvuru kanalı.** Uygulama içi talep formu veya kayıtlı e-posta adresi geçerli kanaldır
   (Başvuru Tebliği m.5) [17]; aydınlatma metninde bu kanal yazılmalı.
6. **Davet.** Davet edilenin e-postası üçüncü kişiden alınmış kişisel veridir: ilk iletide kısa
   aydınlatma/bağlantı (Tebliğ m.6/b) [15]; davet metni tanıtım içermesin (ETK m.6/2 ayrımı) [27].
7. **Beta ve ücretsizlik**, VERBİS istisnası ve kayıtlı olmama durumu Kanun'un diğer hiçbir
   yükümlülüğünü kaldırmaz [9].

### Hosting bölgesi

| Seçenek | KVKK m.9 sonucu | Not |
|---|---|---|
| **A. Türkiye'de barındırma** (veri tabanı + dosyalar Türkiye'deki veri merkezinde) | Aktarım yok; m.9 devreye girmez | E-posta, hata izleme, analitik gibi yurt dışı SaaS araçları yine aktarımdır; her biri için standart sözleşme veya Türkiye'de barındırılan alternatif gerekir. |
| **B. AB veya ABD'de barındırma** | Aktarım var; yeterlilik kararı yok → **SS-2 standart sözleşme** imzalanır, 5 iş günü içinde bildirilir, her alt veri işleyen için tekrarlanır | Kapı bekçisi sağlayıcının imzaya yanaşmasıdır: Google Cloud evet [30]; AWS/Microsoft belirsiz [31], [32]; küçük sağlayıcılar bilinmiyor. AB ile ABD arasında KVKK bakımından fark yok (ikisine de yeterlilik kararı yok); m.9/4'teki "ilgili kişinin aktarımın yapılacağı ülkede de haklarını kullanma ve etkili kanun yollarına başvurma imkânı" koşulu AB'de daha kolay savunulur. |
| **C. Yurt dışı + kullanıcı rızası** | **Geçersiz** düzenli aktarım için: rıza yalnızca arızi aktarım istisnasıdır (m.9/6, Yön. m.16) | 1/9/2024 öncesi yaygın pratikti; artık dayanak değil. |

**Öneri (bilgi, görüş değil):** Hosting seçimini "standart sözleşmeyi kim imzalar?" sorusuyla
başlatın. Türkiye bölgesi sunan veya KVKK standart sözleşmesini yayınlamış bir sağlayıcı (bugün
belgelenebilen tek örnek Google Cloud) toplam uyum işini bir imza + bir modül bildirimine indirir.
Standart sözleşme veri akışı başlamadan imzalanmalı ve bildirilmeli; geriye dönük yürürlük kabul
edilmiyor [8]. Alt veri işleyen listesi (e-posta, auth, loglama) aydınlatma metnine alıcı grubu
olarak yazılmalı ve her değişiklikte güncellenmeli.

### Rıza akışı (özet)

- Rıza **istenmeyecek**: hesap, Library içeriği, oturum/güvenlik çerezleri, işlem e-postaları
  (magic link, hesap bildirimleri), birinci taraf analitik (IP maskeli, çapraz takip yok).
- Rıza **istenecek** (ayrı, boş kutu, geri alınabilir): pazarlama/duyuru e-postası (KVKK açık
  rıza + ETK onayı; gönderim öncesi İYS kaydı ve onayın İYS'ye işlenmesi), üçüncü taraf
  analitik/reklam çerezleri (varsa).
- Çerez paneli yalnızca rıza gereken çerez varsa gerekir; yoksa aydınlatma metninde çerez
  açıklaması yeter [25].

## Açık sorular

1. Hedef hosting sağlayıcısı (ör. Hetzner, Supabase, Vercel, Cloudflare, AWS) Kurulun SS-2
   metnini değiştirmeden imzalar mı? Resmî belge yalnızca Google Cloud için bulundu [30].
   Sağlayıcı seçiminden önce satış/hukuk ekibinden yazılı teyit alınmalı.
2. Alt veri işleyen zinciri: e-posta gönderimi, kimlik doğrulama, hata izleme için hangi
   araçlar? Her biri ayrı aktarımdır (m.9/8); Türkiye'de barındırılan alternatifler var mı?
3. İşletici gerçek kişi mi, şirket mi; bilanço esasına göre defter tutuyor mu? 2025/2393
   yorumuna göre istisna hesabı buna bağlı [12]. İYS kaydı MERSİS numarası istiyor [29]; şahıs
   işletmesi için süreç doğrulanmalı.
4. Pazarlama/duyuru e-postası planlanıyor mu? Planlanıyorsa İYS kaydı ve onay akışı ilk
   gönderimden önce kurulmalı; planlanmıyorsa tüm e-postalar ETK m.6/2 sınırında (tanıtım yok)
   tutulmalı [27].
5. Expo native uygulama (Android): Kurumun çerez rehberi web uygulamalarını kapsar; native
   SDK'lar (çökme raporu, analitik) için Kuruma ait özel rehber **bulunamadı**; m.5 genel
   kuralları uygulanır. Üçüncü taraf SDK'ların veri akışı aktarım analizine dâhil edilmeli.
6. Library içeriğindeki üçüncü kişi verileri (tarihsel/yaşayan kişiler): kullanıcının kendi
   araştırması için m.28/1-c (bilimsel amaç) istisnası tartışılabilir; Homelibra'nın bu içerik
   bakımından veri sorumlusu mu veri işleyen mi olduğu Kurum kaynaklarında doğrudan ele
   alınmamış. Bu belge Homelibra'yı veri sorumlusu varsaydı.
7. AB için yeterlilik kararı çıkar mı? Çıkarsa SS-2 ihtiyacı AB bölgesi için düşer; izlenmeli [5].
8. Veri taşınabilirliği: kvkk.gov.tr'de bu hakkı ekleyen bir Kanun taslağı bulunamadı; GDPR
   uyumu söylemi sürüyor. Dışa aktarma ürün kararı olarak verilmeli.
9. Standart Sözleşme Bildirim Modülü'ne giriş yöntemi (e-Devlet/KEP) duyuruda belirtilmemiş
   [7]; bildirim öncesi kılavuz okunmalı (standartsozlesme.kvkk.gov.tr).
10. Yaş sınırı: KVKK'da çocuk rızası için özel eşik yok; hedef kitle akademisyen olduğu için bu
    belgede incelenmedi.

## Kaynaklar

Birincil mevzuat:

1. 6698 sayılı Kişisel Verilerin Korunması Kanunu, güncel metin (mevzuat.gov.tr PDF):
   https://www.mevzuat.gov.tr/MevzuatMetin/1.5.6698.pdf — sayfa:
   https://www.mevzuat.gov.tr/mevzuat?MevzuatNo=6698&MevzuatTur=1&MevzuatTertip=5
2. 7499 sayılı Ceza Muhakemesi Kanunu ile Bazı Kanunlarda Değişiklik Yapılmasına Dair Kanun
   (RG 12.03.2024, 32487): https://www.resmigazete.gov.tr/eskiler/2024/03/20240312-1.htm —
   PDF: https://www.mevzuat.gov.tr/MevzuatMetin/1.5.7499.pdf
3. Kişisel Verilerin Yurt Dışına Aktarılmasına İlişkin Usul ve Esaslar Hakkında Yönetmelik
   (RG 10.07.2024, 32598): https://www.mevzuat.gov.tr/MevzuatMetin/yonetmelik/7.5.40863.pdf —
   RG: https://www.resmigazete.gov.tr/eskiler/2024/07/20240710-2.htm
4. KVKK, Kişisel Verilerin Yurt Dışına Aktarılması Rehberi (Yayın No 48, Ocak 2025):
   https://www.kvkk.gov.tr/Icerik/8142/Kisisel-Verilerin-Yurt-Disina-Aktarilmasi-Rehberi —
   PDF: https://www.kvkk.gov.tr/SharedFolderServer/CMSFiles/13711235-abb6-4b17-9a6b-0a68c1ad86c5.pdf
5. KVKK, Yurt Dışına Aktarım (yeterlilik kararı durumu; Kurul 04.06.2024, 2024/959):
   https://www.kvkk.gov.tr/Icerik/2053/Yurtdisina-Aktarim
6. KVKK, Standart Sözleşmeler (4 tip): https://www.kvkk.gov.tr/Icerik/7929/Standart-Sozlesmeler —
   SS-2 (veri sorumlusundan veri işleyene):
   https://www.kvkk.gov.tr/SharedFolderServer/CMSFiles/b531d656-9cea-4cdb-84ce-1ab92198c9b1.pdf
7. KVKK, Standart Sözleşme Bildirim Modülü Hakkında Kamuoyu Duyurusu (25.10.2024; Kurul
   17.10.2024, 2024/1793):
   https://www.kvkk.gov.tr/Icerik/8043/Standart-Sozlesme-Bildirim-Modulu-Hakkinda-Kamuoyu-Duyurusu —
   modül: https://standartsozlesme.kvkk.gov.tr/
8. KVKK, Yurt Dışına Kişisel Veri Aktarımında Kullanılacak Standart Sözleşmelerde Dikkat
   Edilmesi Gereken Hususlara İlişkin Kamuoyu Duyurusu (05.02.2025):
   https://www.kvkk.gov.tr/Icerik/8170/Yurt-Disina-Kisisel-Veri-Aktariminda-Kullanilacak-Standart-Sozlesmelerde-Dikkat-Edilmesi-Gereken-Hususlara-Iliskin-Kamuoyu-Duyurusu
9. KVKK, Sorularla VERBİS (PDF, 06.10.2025 sürümü; istisna listesi ve RG tarihleri):
   https://verbis.kvkk.gov.tr/sharedFolder/sorularla-verbis.pdf
10. KVKK, Kamuoyu Duyurusu — Sicile kayıt istisna kriterinde değişiklik (25.07.2023; Kurul
    06.07.2023, 2023/1154):
    https://www.kvkk.gov.tr/Icerik/7646/Kamuoyu-Duyurusu-Veri-Sorumlulari-Siciline-Kayit-Yukumlulugune-Iliskin-Istisna-Kriterinde-Degisiklik-Yapilmasi-Hakkinda-
11. KVKK, Kamuoyu Duyurusu — ana faaliyeti özel nitelikli veri işleme olanlar için istisna
    (01.10.2025; Kurul 04.09.2025, 2025/1572): https://www.kvkk.gov.tr/Icerik/8388/KAMUOYU-DUYURUSU
12. KVKK, 2025/1572 sayılı Kararın Uygulama Esaslarına İlişkin Kamuoyu Duyurusu (12.01.2026;
    Kurul 25.12.2025, 2025/2393):
    https://www.kvkk.gov.tr/Icerik/8577/kisisel-verileri-koruma-kurulunun-04-09-2025-tarihli-ve-2025-1572-sayili-kararinin-uygulama-esaslarina-iliskin-kamuoyu-duyurusu
13. KVKK, 2025 Yılı Mali Bilanço Toplamı Bakımından … VERBİS Kayıt Süresi Hakkında Kamuoyu
    Duyurusu (14.05.2026; Kurul 13.05.2026, 2026/1026):
    https://www.kvkk.gov.tr/Icerik/8752/2025-yili-mali-bilanco-toplami-bakimindan-sicile-kayit-yukumlulugu-dogan-kurumlar-vergisi-mukellefi-tuzel-kisi-veri-sorumlularinin-verbis-kayit-suresi-hakkinda-kamuoyu-duyurusu
14. Veri Sorumluları Sicili Hakkında Yönetmelik (RG 30.12.2017, 30286; değişik RG 28.04.2019):
    https://www.kvkk.gov.tr/Icerik/5442/VERI-SORUMLULARI-SICILI-HAKKINDA-YONETMELIK
15. Aydınlatma Yükümlülüğünün Yerine Getirilmesinde Uyulacak Usul ve Esaslar Hakkında Tebliğ
    (RG 10.03.2018, 30356): https://www.resmigazete.gov.tr/eskiler/2018/03/20180310-5.htm —
    PDF: https://www.mevzuat.gov.tr/File/GeneratePdf?mevzuatNo=24454&mevzuatTur=Teblig&mevzuatTertip=5
16. KVKK, Aydınlatma Yükümlülüğünün Yerine Getirilmesi Rehberi (katmanlı aydınlatma tanımı ve
    örneği): https://kvkk.gov.tr/SharedFolderServer/CMSFiles/a569a068-c079-4189-b134-f57bc727af7d.pdf
17. Veri Sorumlusuna Başvuru Usul ve Esasları Hakkında Tebliğ (RG 10.03.2018, 30356):
    https://www.resmigazete.gov.tr/eskiler/2018/03/20180310-6.htm
18. Kişisel Verilerin Silinmesi, Yok Edilmesi veya Anonim Hale Getirilmesi Hakkında Yönetmelik
    (RG 28.10.2017, 30224; değişik RG 28.04.2019):
    https://www.kvkk.gov.tr/Icerik/5441/KISISEL-VERILERIN-SILINMESI-YOK-EDILMESI-VEYA-ANONIM-HALE-GETIRILMESI-HAKKINDA-YONETMELIK
19. KVKK, Açık Rıza Alırken Dikkat Edilecek Hususlar:
    https://www.kvkk.gov.tr/Icerik/2037/Acik-Riza-Alirken-Dikkat-Edilecek-Hususlar
20. Kurul Karar Özeti 26.07.2018, 2018/90 (aydınlatma ve açık rıza ayrı ayrı):
    https://www.kvkk.gov.tr/Icerik/5420/2018-90
21. Kurul Karar Özeti 08.07.2019, 2019/206 (hizmet şartı iddiası; aydınlatma metninin
    güncellenmesi talimatı): https://www.kvkk.gov.tr/Icerik/6709/2019-206
22. Kurul Karar Özeti 08.08.2024, 2024/1361 (çerezlerde opt-in; pazarlama rızasının hizmetin ön
    şartı yapılmaması; 265.000 TL): https://www.kvkk.gov.tr/Icerik/8884/2024-1361
23. KVKK, Veri İhlali Bildirimi (Kurul 24.01.2019, 2019/10; 72 saat):
    https://www.kvkk.gov.tr/Icerik/5362/Veri-Ihlali-Bildirimi — form: https://ihlalbildirim.kvkk.gov.tr/
24. KVKK, 6698 Sayılı Kanun Kapsamında İdari Para Cezası Tutarları (31.12.2025; 2026 tablosu):
    https://www.kvkk.gov.tr/Icerik/8145/6698-sayili-kisisel-verilerin-korunmasi-kanunu-kapsaminda-idari-para-cezasi-tutarlari —
    tablo PDF: https://www.kvkk.gov.tr/SharedFolderServer/CMSFiles/MTY5NTUyNTRkNDkxNGY.pdf
25. KVKK, Çerez Uygulamaları Hakkında Rehber (Yayın No 69, Temmuz 2025):
    https://kvkk.gov.tr/Icerik/7353/Cerez-Uygulamalari-Hakkinda-Rehber
26. 6563 sayılı Elektronik Ticaretin Düzenlenmesi Hakkında Kanun, güncel metin (sonunda 2026
    ceza tablosu; Ticaret Bakanlığı Tebliği RG 25.12.2025, 33118):
    https://mevzuat.gov.tr/MevzuatMetin/1.5.6563.pdf
27. Ticari İletişim ve Ticari Elektronik İletiler Hakkında Yönetmelik (RG 15.07.2015, 29417;
    İYS değişikliği RG 04.01.2020, 30998):
    https://www.mevzuat.gov.tr/File/GeneratePdf?mevzuatNo=20914&mevzuatTur=KurumVeKurulusYonetmeligi&mevzuatTertip=5
28. Ticaret Bakanlığı, Ticari Elektronik İletiler — Genel Bilgiler:
    https://ticaret.gov.tr/ic-ticaret/ticari-elektronik-iletiler/genel-bilgiler — İYS:
    https://ticaret.gov.tr/ic-ticaret/ticari-elektronik-iletiler/ileti-yonetim-sistemi-iys
29. İleti Yönetim Sistemi (İYS A.Ş.), SSS ve mevzuat sayfaları (JavaScript ile yüklenir):
    https://iys.org.tr/iys/sss — https://iys.org.tr/iys/yonetmelik

Sağlayıcı belgeleri (hukuki dayanak değil, uygulanabilirlik için):

30. Google Cloud Data Processing Addendum, Appendix 3 "Turkey" (Turkish SCCs; 5 iş günü
    bildirim müşteride): https://cloud.google.com/terms/data-processing-addendum/
31. AWS Turkey SoR FAQ (sözleşme tarafı AWS Turkey; KVKK standart sözleşmesine dair bilgi yok):
    https://aws.amazon.com/legal/awstr/
32. Microsoft Q&A (topluluk yanıtı, resmî değil): KVKK m.9 SS-2 süreci:
    https://learn.microsoft.com/en-us/answers/questions/6003165/execution-process-for-turkish-kvkk-article-9-ss-2
