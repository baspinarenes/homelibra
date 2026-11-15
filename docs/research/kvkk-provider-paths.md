# KVKK m.9: mevcut beş sağlayıcı için imzala, taşı ya da kaldır yolları

> **Bu belge hukuki görüş değildir.** Sağlayıcıların 2026-11-15'te yayımlı sözleşme, belge ve
> fiyat sayfalarından derlenmiştir. "Belgede yok" ifadesi "sağlayıcı imzalamaz" anlamına gelmez;
> yalnızca yayımlanmış bir taahhüt bulunamadığını söyler. Hiçbir sağlayıcıyla yazışılmadı, form
> doldurulmadı, hesap açılmadı.

Tarih: 2026-11-15 · Güncellediği ve genişlettiği belge: `docs/research/kvkk-hosting-providers.md`
(2026-10-29; aşağıda "önceki belge") · İlgili: `docs/research/coolify-self-hosting.md`,
`docs/research/kvkk-obligations.md`, ADR-0006, ADR-0009, ADR-0011, baspinarenes/homelibra#31

## Soru

Önceki belge şunu tespit etti: kişisel veriyi Türkiye dışındaki bir veri işleyende tutmak KVKK m.9
anlamında aktarımdır ve gerçekçi yol Kurul'un **SS-2** metninin **değiştirilmeden** iki tarafça
imzalanıp 5 iş günü içinde bildirilmesidir [KV1][KV2][KV3]. Beta bugün beş yabancı sağlayıcıyla
çalışıyor (ADR-0009): Hetzner (sunucu + Object Storage, Almanya), Resend (giriş e-postaları),
Sentry (hata raporları, AB bölgesi), Expo EAS Update (OTA, ABD), Cloudflare Email Routing (iletişim
adresine gelen posta). İşletici Türkiye'de tek bir gerçek kişi; beta ücretsiz ve davetle.

Bu belge her sağlayıcı için üç yolu birincil kaynaklardan maliyetlendirir:

1. **İmzala:** Mevcut beş sağlayıcının herhangi birinde imzalı bir Türk standart sözleşmesine giden
   bir yol var mı (DPA'da Türkiye hükmü, özel sözleşme talebi için resmî kanal, "müşteri metnini
   imzalamayız" beyanı)?
2. **İmzalayana geç:** Türk standart sözleşmesi ekini yayımlayan, müşterinin kabul edip Kurul'a
   bildirebileceği bir sağlayıcı var mı (Google Cloud, Azure, AWS, Oracle, Huawei, Alibaba; e-posta
   sağlayıcıları; hata izleyiciler)?
3. **Türkiye'ye taşı (en az operasyonel değişiklikle):** Türkiye veri merkezinde ≥4 GB RAM'li VPS
   ve, kritik olarak, fiziksel olarak Türkiye'de **S3 uyumlu nesne depolama** (yedek ve kapak
   görselleri için).
4. **Türkiye'den e-posta:** Türkiye'de işleyen, API/SMTP'li, self-servis işlem e-postası sağlayıcısı
   ya da Türk VPS'te kendi SMTP sunucusu.
5. **Kaldır:** Sentry yerine aynı sunucuda GlitchTip ya da Bugsink; EAS Update'i kapatmak ya da
   kendi protokol sunucusu; Cloudflare Email Routing yerine Türkiye'de barındırılan posta kutusu.
6. **Veritabanını taşımanın maliyeti:** Depodaki kuruluma göre Hetzner'den Türk VPS'e geçiş somut
   olarak ne ister?

## Yöntem

- Yalnızca birincil kaynaklar okundu: sağlayıcıların DPA/sözleşme metinleri, hukuk ve yardım
  sayfaları, resmî belgeler, fiyat sayfaları ve fiyat verileri, resmî depolar. Arama motoru yalnızca
  sayfaya ulaşmak için kullanıldı; aramalara proje adı, alan adı ya da kişisel bilgi yazılmadı.
  Okuma tarihi 2026-11-15.
- **Birebir tarama.** Belirleyici sayfalar Claude'un tarayıcı panelinde açıldı ve sayfa metninde
  (`document.body.innerText`) `Turk|Türkiye|KVKK|6698|standard contract` (ve sayfaya özgü ek
  terimler) düzenli ifadesi çalıştırıldı. Bölüm 1 ve 2'de "belgede yok" yazan hücreler bu
  taramanın sonucudur; metin uzunlukları ve eşleşme sayıları "Tarama kaydı"nda. Bu bölümlerde
  tırnak içindeki alıntılar birebir alındı. Bölüm 3 ve 4 karışık: fiyatlar ve karar cümleleri
  tarayıcıdan birebir, bazı ikincil satırlar (port 25, PTR, root, snapshot, alt yüklenici listeleri)
  özet okumadan; oradaki "belgede yok", okunan sayfalarda geçmediği anlamına gelir.
- **"(özet)" işareti.** Bir cümle yalnızca özet aracıyla (WebFetch; sayfayı küçük bir modelle
  özetler) okunduysa satırda "(özet)" yazar; bu alıntılar birebir doğrulanmamıştır.
- PDF ve DOCX belgeler (Hetzner DPA, AWS DPA, Microsoft DPA, Oracle ekleri) metne çevrilip aynı
  düzenli ifadeyle tarandı. Hetzner PDF'inde yalnızca ASCII glifler, Oracle PDF'lerinde bazı Türkçe
  harfler güvenilir çözülmedi; ilgili yerde yazıyor.
- JavaScript ile yüklenen fiyat sayfaları tarayıcıda okundu. Yapılandırıcılarda yalnızca seçenekler
  okundu; sepete ürün eklenmedi, form gönderilmedi. Çerez bantlarında zorunlu olmayanlar reddedildi.
  Okunamayan fiyat "okunamadı" diye yazıldı, tahmin edilmedi.
- Fiyatlar sayfadaki para birimi, KDV notu ve kampanya/liste ayrımıyla aktarıldı; kur çevrilmedi.
  Aylık toplamlar para birimi başına ayrı verildi. Saatlik fiyattan aylık hesap (730 saat)
  **Çıkarım** olarak işaretli.
- **Ondalık ayırıcı.** Bölüm 2'deki dolar rakamları Türkçe yazımla virgüllü (USD 45,67; $0,085),
  diğer bölümlerde sayfadaki yazım korundu ($10.99; Natro'da 9,99); hepsi ondalıktır. TL tutarlarında nokta
  binlik, virgül ondalık ayırıcıdır (1.737,45 TL). "1.000 e-posta" bin e-postadır.
- Depo okuması: `compose.yaml`, `infra/postgres/`, `scripts/setup-beta-infra.sh`,
  `scripts/deploy-beta.sh`, `apps/api/src/env.ts`, `apps/api/src/storage/s3.ts`,
  `apps/api/src/mail/mailer.ts`, `apps/api/src/instrument.ts`, `apps/app/src/lib/sentry.ts`,
  `apps/app/app.json`, `apps/app/eas.json`. Depoya dayanan sonuçlar **Çıkarım** olarak işaretli;
  hiçbiri denenmiş bir prosedür değil.
- Okunmayan / aramada çıkmayan Türk sağlayıcılar: KoçSistem, Markahost, İHS/İsimtescil, Atlantis,
  Sadece Hosting, GarantiServer, Netdirekt, Erzen, Nevacloud, n11. Cloudeos sitesi sertifika hatası
  verdi → **okunamadı**. Turkcell nDepo bugün yeniden okunmadı (2026-10-29 bulgusu geçerli sayıldı).

## Bulgular

### Önceki belgeye (2026-10-29) göre ne değişti

| Konu | Önceki belge | Bugün |
|---|---|---|
| Resend | "DPA'da KVKK yok" | **Yayımlı ret, KVKK adıyla:** ülkeye özgü standart sözleşme imzalamıyor; tüm müşteri verisi ABD'de saklanıyor, AB bölgesi yalnızca gönderim rotası [RS2][RS3] |
| Sentry | İncelenmemişti | **Yayımlı ret** (Developer/Team/Business): DPA'da olmayan standart sözleşmeye girmiyor; yalnızca Enterprise'ta görüşülüyor [SN2] |
| Hetzner | "DPA'da KVKK yok" | DPA aynı; SSS: "We do not create or sign individual Data Processing Agreement (DPA)s." [HZ2] |
| Yayımlı Türk standart sözleşmesi | Yalnızca Google Cloud (koşullu) | **Oracle da:** aktarım eki m.4 + Ek F, SS-2 başlıklı iki dilli metin; kapsamı ve imza akışı belirsiz [OR1][OR2]. Google metni aynı, akış hâlâ yayımlı değil [GC1] |
| Türkiye'de S3 uyumlu depolama | "Bulunamadı" | **Var:** DT Cloud (self-servis, $0.04/GB), Narbulut NOSS (50 GB 315,9 TL/Ay, iş ortağıyla); AWS İstanbul Local Zone'da S3 One Zone-IA; Huawei OBS TR-Istanbul [DT1][NB1][AWS3][HW1] |
| Türkiye'de yönetilen PostgreSQL | "Herkese açık fiyatlı bulunamadı" | **Var:** Huawei Cloud TR-Istanbul RDS for PostgreSQL 14–18, 2 vCPU / 4 GB USD 45.67/ay; sözleşme tarafı yurt dışında [HW2][HW3] |
| Veri işleyen sözleşmesi yayımlayan Türk host | Yok (Radore yalnızca beyan) | Netinternet/ilkbyte (KEP ile imza; KVKK sayfasında doldurulmamış yer tutucular var, sözleşme PDF'i okunmadı) ve Veridyen (kayıtta onay; yalnızca özet okuma) [NI2][NI3][VD2][VD4] |
| Expo hukuki sayfaları | Ekim 2025 / Mayıs 2025 tarihli | Üçü de güncellenmiş (2 ve 10 Kas 2026); KVKK yine yok; IP saklama yine belgede yok [EX1][EX2][EX3] |

### 1. Mevcut beş sağlayıcı: imzalı SS-2'ye giden yol var mı

| Sağlayıcı | Güncel DPA | Türkiye/KVKK geçiyor mu | Müşteri metnini / ülkeye özgü sözleşmeyi imzalama konusunda yayımlı tutum | Resmî iletişim yolu |
|---|---|---|---|---|
| **Hetzner** | DPA 1.1 (10 Şub 2025), değişmemiş [HZ1] | Hayır (DPA ve veri koruma SSS'sinde 0 eşleşme) | **Büyük olasılıkla kapalı (Çıkarım):** "We do not create or sign individual Data Processing Agreement (DPA)s." [HZ2] Cümle SS-2'yi ya da standart sözleşmeleri adıyla anmıyor | `data-protection@hetzner.com` ya da müşteri hesabından talep [HZ2] |
| **Resend** | DPA, "Last update: December 31st, 2025" [RS1] | **Evet, adıyla ve olumsuz** [RS2] | **Kapalı, açıkça KVKK için:** "No. We don't sign third-party or country-specific data processing agreements or standard contracts, including … the Türkiye KVKK Standard Contract" [RS2] | `privacy@resend.com` (DPA Ek) [RS1]; değişiklik talebi yalnızca Enterprise [RS2] |
| **Sentry** | DPA 5.1.0 (29 May 2024) [SN1] | Hayır (0 eşleşme) | **Kapalı (Developer/Team/Business):** "We will also not enter into standard contractual clauses that are not already incorporated into our DPA." [SN2] | `legal@sentry.io` (DPA Ek 1) [SN1]; Enterprise için satış/demo formu [SN2] |
| **Expo** | Ayrı bir self-servis DPA sayfası yok (`expo.dev/dpa` → 404) [EX8]; işleyen hükümleri Şartlar §3.2'de [EX3] | Hayır (0 eşleşme) | **Belgede yok.** Tek ifade: "Enterprise … MSA and DPA terms are available." [EX4] | İletişim formu; gizlilik sayfalarında e-posta adresi yok [EX1][EX2] |
| **Cloudflare** | DPA v6.4 (3 Nis 2026), değişmemiş [CF1] | Hayır (0 eşleşme) | **Belgede açık bir ret yok.** Self-servis için DPA atıfla sözleşmenin parçası; "no action is required" [CF2][CF3] | `legal@cloudflare.com` (DPA Ek 1, DPO) [CF1] |

Beş sağlayıcının hiçbirinde Kurul'un SS-2 metnini imzalamaya dair yayımlı bir yol yok. İkisi
(Resend, Sentry) self-servis planlar için ülkeye özgü standart sözleşmeyi **yazılı olarak
reddediyor**; Resend KVKK'yı adıyla anıyor. Hetzner "bireysel DPA" oluşturmadığını ve
imzalamadığını yazıyor; bunun SS-2'yi de kapsadığı bir **Çıkarım**. Expo ve Cloudflare'de olumlu
ya da olumsuz bir ifade yok.

#### Hetzner

- **DPA sürümü.** `DPA_en.pdf` bugün hâlâ "Date and Version: 1.1, February 10, 2025"; ekli TOM'lar
  1.2 (17 Şub 2026), alt yükleniciler eki 1.0 (8 Ağu 2024) [HZ1]. PDF metninde "Turk", "KVKK"
  ve "Standard Contractual" geçmiyor.
- **Aktarım maddesi (§3).** "The provision of the contractually agreed upon data processing will
  occur exclusively in a member state of the European Union or in another member state party to
  the Agreement on the European Economic Area." Üçüncü ülkeye aktarım yalnızca GDPR m.44 vd.
  koşullarıyla [HZ1]. Madde AB'den çıkışı düzenliyor; Türkiye'den Almanya'ya girişi (KVKK m.9)
  ele almıyor.
- **Bireysel sözleşme.** Hetzner Docs, "Data Protection at Hetzner" (son değişiklik 2026-07-20):
  "We do not create or sign individual Data Processing Agreement (DPA)s." DPA müşteri hesabından
  (`accounts.hetzner.com/account/dpa`) onay kutusuyla kuruluyor: "A handwritten signature is not
  required." [HZ2]
- **Değişiklik şekli (§13.4).** "Any amendments or modifications to this DPA … require a written
  agreement, which may also be made in an electronic form (signed text)." [HZ1] Yani sözleşme
  değişikliği teorik olarak mümkün, ama SSS'deki cümle bunu pratikte kapatıyor.
- **Hukuk ve yetki (§13.1).** Alman hukuku; yetkili mahkeme Gunzenhausen [HZ1]. SS-2'nin uygulanacak
  hukuk ve yetki hükmüyle bağdaşıp bağdaşmadığı bu turda incelenmedi (SS-2 metni okunmadı) →
  **belirsiz**.
- **İletişim.** "Please contact us via a request in your customer account or by email to
  data-protection@hetzner.com." [HZ2] SSS ayrıca bağlayıcı hukuki değerlendirme yapmadıklarını
  söylüyor.
- **Hüküm.** SS-2 imzası için yayımlı yol yok. SSS'deki cümle "bireysel DPA"yı reddediyor, SS-2'yi
  adıyla anmıyor; SS-2 talebinin de aynı cevabı alacağı bir **Çıkarım**. Kesin cevap yalnızca
  yazılı soruyla alınır.

#### Resend

- **KVKK için açık ret.** `resend.com/security/gdpr` SSS'si: "Can Resend sign a country-specific
  DPA, such as for Brazil LGPD / ANPD or Türkiye KVKK? No. We don't sign third-party or
  country-specific data processing agreements or standard contracts, including Brazil LGPD / ANPD
  standard contractual clauses and the Türkiye KVKK Standard Contract, and we can't attach them as
  annexes to our DPA. Our standard DPA applies to every account on any plan." [RS2]
- **Değişiklik.** Aynı sayfa: "requesting changes to our DPA or other legal documents requires an
  Enterprise Plan." [RS2] Enterprise'ta KVKK standart sözleşmesinin imzalanıp imzalanmayacağı
  sayfada yazmıyor → **belirsiz**; yukarıdaki "No" cümlesi plan ayrımı yapmıyor.
- **DPA metni.** "Last update: December 31st, 2025"; karşı taraf Plus Five Five, Inc. (San
  Francisco). "Turk/KVKK/6698" 0 eşleşme. "Standard Contractual Clauses" yalnızca AB ve UK
  SCC'leri olarak tanımlı (§1.14). §6.6.4, ayrı bir sözleşme olarak imzalama taahhüdü veriyor,
  ama yalnızca bu SCC'ler ve ex-EEA/ex-UK aktarımlar için: "the Data Importer shall, on request of
  the Data Exporter, promptly execute such Standard Contractual Clauses" [RS1]. **Çıkarım:** tanım
  gereği bu madde KVKK standart sözleşmesine uzanmıyor; [RS2] zaten açıkça reddediyor.
- **Verinin yeri.** "Resend stores customer data in the United States, including message content,
  delivery logs, webhook payloads, and account records." Gönderim bölgesi (ör. `eu-west-1`)
  yalnızca yönlendirmeyi belirliyor: "It does not control where data is stored, and there is no
  setting today that moves stored data to the EU." [RS2] Bölge belgesi aynı şeyi söylüyor: "All
  account data, including email metadata, logs, and API records, is stored in the United States
  regardless of the sending region you select." [RS3]
- **Saklama.** "email and log data is retained for 30 days on Free, Pro, and Scale plans." [RS2]
- **Alt işleyenler** ("Last update: November 5th, 2026"): 22 şirket, hepsi "(USA)" olarak
  listelenmiş; AWS (barındırma ve gönderim), PlanetScale, Supabase, Vercel, Tinybird, Snowflake,
  Datadog, Anthropic vb. [RS4]
- **Hüküm.** SS-2 yolu **yayımlı olarak kapalı**. Alıcı adresi, ileti içeriği (giriş kodu dahil)
  ve log'lar ABD'de saklanıyor; "AB bölgesi" seçimi bunu değiştirmiyor.

#### Sentry

- **Sözleşme tutumu.** Yardım merkezi, "Can we propose changes to Sentry's DPA or execute standard
  contractual clauses not included in the DPA?" (All SaaS Customers): "Currently, we will only
  negotiate agreements with, or consider additional terms from, customers with an Enterprise
  agreement. This means that, for customers on Developer, Team, and Business plans, we will not
  incorporate changes or additional terms into our DPA. We will also not enter into standard
  contractual clauses that are not already incorporated into our DPA." [SN2] İkinci makale:
  "Changes to the DPA are only available to Enterprise customers." [SN3] Makalelerde tarih yok.
- **DPA 5.1.0 (29 May 2024).** Karşı taraf Functional Software, Inc. d/b/a Sentry. "Turk/KVKK/6698"
  0 eşleşme; Ek 4 (Jurisdiction Specific Terms) içinde yalnızca CCPA görüldü. §6.1: "we may …
  store and process Customer Data in the United States and any other country in which we or our
  Subprocessors maintain data processing operations." Avrupa dışına aktarım Ek 3'e bağlı: önce
  Data Privacy Framework, o geçersizse AB SCC'leri (İrlanda hukuku), UK Addendum, İsviçre
  uyarlaması. Alt işleyen değişikliği için 30 gün önceden bildirim [SN1].
- **Veri saklama bölgeleri.** İki bölge: US (Iowa) ve EU (Frankfurt). "once selected, your data
  storage location can't be changed." Seçilen bölgede saklananlar: hata olayları, transaction,
  span, profil, log, metrik, release health, release/debug dosyaları/source map'ler, session
  replay ve bunların yedekleri. **Bölgeden bağımsız ABD'de saklanabilenler:** kullanıcı hesapları,
  entegrasyon metaverisi, erişim token'ları, organizasyon ayarları, denetim log'ları, cron
  check-in'ler, proje metaverisi, DSN anahtarları, ayrıntılı kullanım verisi, SSO/SAML/SCIM
  metaverisi. Ayrıca: "Your selection determines your data storage location only. Sentry will
  continue to access and process your data in accordance with your agreement" ve destek
  taleplerinde paylaşılan veri ABD'de saklanıyor [SN4]. **Çıkarım:** ABD'de kalan kalemler
  İşleticinin kendi hesap ve yapılandırma verisi; son kullanıcı verisi olay yükünde, yani seçilen
  bölgede. AB bölgesi
  KVKK açısından yine yurt dışı.
- **Alt işleyenler 2.3.0 (1 Haz 2026).** AWS, Cloudflare, Google Cloud (AB + ABD), Sinch/Mailgun
  (AB); yalnızca ABD: Anthropic, OpenAI, Intercom, Twilio SendGrid. Bağlı şirketler Avusturya,
  Kanada, Hollanda. "if you select a data storage location … your service data remains in your
  specified location as described in our documentation." [SN5]
- **Sunucu tarafı denetimler** [SN6][SN9]:
  - Data Scrubber varsayılan olarak açık (Organization/Project Settings → Security & Privacy):
    kredi kartına benzeyen değerler ve `password`, `secret`, `token`, `auth`, `apikey` vb. anahtar
    adları temizleniyor; ek alan ve "Safe Fields" tanımlanabiliyor.
  - IP: "You can choose to expand the keys that are scrubbed by the server, as well as prevent IP
    addresses from being stored." Arayüzdeki ayar adı ("Prevent Storing of IP Addresses") okunan
    belge sayfalarında bu adla geçmiyor.
  - Sınır: "Geographic information is extracted from the user's IP address. This occurs even if
    the setting to stop storing IP addresses is turned on." Coğrafi veriyi silmek için Advanced
    Data Scrubbing kuralı gerekiyor (`[Remove] [Anything] from [$user.geo.**]`).
  - Advanced Data Scrubbing: hassas veriyi "just before it is saved in Sentry" ayıklayan kurallar.
  - **"Saklanmıyor" "alınmıyor" demek değil:** bu ayarların hepsi Sentry sunucusuna ulaştıktan
    sonraki saklamayı düzenliyor; istek yine Sentry'nin ingest uç noktasına (IP ile) gidiyor.
    Bunun KVKK'da kişisel veri aktarımı sayılıp sayılmadığı **belirsiz**.
- **SDK tarafı denetimler.**
  - Node (`@sentry/node`, `dataCollection`): "By default, the SDK collects all `dataCollection`
    categories"; "By default, the SDK sends the user's IP address. To disable it, set
    `dataCollection: { userInfo: false }`." Uyarı: "Even when this is disabled, IP addresses can
    still reach Sentry through collected HTTP headers, cookies, or query parameters (for example,
    the `X-Forwarded-For` header)." SDK `user.id`, `user.email`, `user.username` alanlarını kendisi
    doldurmuyor [SN7]. Depodaki `apps/api/src/instrument.ts` `userInfo`, `cookies`, `httpHeaders`,
    `httpBodies`, `urlQueryParams` kategorilerini zaten kapatıyor.
  - React Native (`@sentry/react-native`, `sendDefaultPii`): oturum açmış kullanıcı bilgisi ve
    cihaz adı varsayılan olarak gönderilmiyor. Ama IP: "By default, the user's IP address is
    inferred by the Sentry backend services based on the incoming request. To disable sending the
    user's IP address, override the default value by a custom String value, for example by calling
    `Sentry.setUser({ip_address: '0.0.0.0'})`." Ayrıca "The full request URL and Referer of
    outgoing HTTP requests is **always sent to Sentry**" [SN8]. Depodaki `apps/app/src/lib/sentry.ts`
    URL sorgularını `beforeSend`/`beforeBreadcrumb` ile kesiyor; `setUser` çağrısı yok.
    **Düzeltme (depodan okundu):** kurulu `@sentry/react-native` 8.28.0, `sendDefaultPii` verilmediğinde
    olaya `infer_ip: 'never'` yazıyor (`dist/js/client.js`), yani belgedeki varsayılan bu sürümde
    geçerli değil ve Sentry IP'yi istekten çıkarmıyor.
- **Çıkarım.** Uygulama tarafında IP'nin olaya yazılmasını kapatmak için belgelenmiş yollar:
  (a) projede "IP adreslerini saklama" ayarı + `$user.geo.**` kuralı, (b) RN'de
  `Sentry.setUser({ ip_address: '0.0.0.0' })`. Bunlarla olay kaydı kimliksizleşir; mobil replay
  (maskeli de olsa), cihaz modeli ve kurulum bağlamı kalır. "Hiç kişisel veri akmıyor"
  sonucuna bu belgeyle varılamaz; hukuki nitelendirme gerekir.
- **Hüküm.** SS-2 yolu Developer/Team/Business için **yayımlı olarak kapalı**; yalnızca Enterprise
  sözleşmesinde ek koşul görüşülüyor (fiyat özel, satışla).

#### Expo / EAS Update

- **Sözleşme.** Self-servis DPA sayfası yok (`expo.dev/dpa` 404) [EX8]. İşleyen hükmü Şartlar
  §3.2 "GDPR"de (madde numarası güncel metinde doğrulandı; son güncelleme 2 Kas 2026): Expo, User Data için "processor … complies with module two
  of the standard contractual clauses … approved by the European Commission (C/2021/3972)" [EX3].
  Trust Center: "Enterprise — … MSA and DPA terms are available." [EX4] Gizlilik Politikası (10
  Kas 2026): "you consent to the transfer of such data to the United States" [EX2]. Dört sayfada
  "Turk/KVKK/6698" 0 eşleşme. Müşteri metnini imzalama konusunda ne olumlu ne olumsuz bir ifade
  var → **belgede yok**. İletişim yalnızca form üzerinden [EX1][EX2]. Not: üç hukuki sayfa da
  2026-10-29'daki okumadan sonra güncellenmiş (Şartlar ve Privacy Explained 2 Kas 2026, Gizlilik
  Politikası 10 Kas 2026); önceki belgedeki tarihler eskidi. Neyin değiştiği karşılaştırılmadı.
- **Güncelleme isteği ne içeriyor.** "Privacy Explained" (2 Kas 2026): "These requests do not
  contain identifying information such as unique device identifiers. The request contains
  non-identifying information needed to correctly process the update request, including the
  end-user's operating system, the developer's project ID, and a random token used to determine if
  an installation of the app has requested an update." [EX1] Trust Center: "Expo is not aware of
  your users' identities and does not store or handle PII related to your users." [EX4]
- **Protokol başlıkları.** "Expo Updates v1" (modificationDate 12 Ağu 2026): istemci
  `expo-protocol-version: 1`, `expo-platform`, `expo-runtime-version`, sunucunun önceden tanımladığı
  başlıklar, `accept` ve kod imzalama açıksa `expo-expect-signature` göndermek zorunda [EX5].
  Spesifikasyonda kurulum kimliği başlığı tanımlı değil.
- **İstemcinin gerçekte gönderdiği başlıklar.** `sdk-58` dalındaki Android `FileDownloader.kt`
  manifest isteğine şunları yazıyor: `Expo-Platform`, `Expo-Protocol-Version: 1`,
  `Expo-API-Version`, `Expo-Updates-Environment`, `Expo-JSON-Error`, **`EAS-Client-ID`**,
  `Expo-Runtime-Version`, varsa `Expo-Current-Update-ID`, `Expo-Embedded-Update-ID`,
  `Expo-Fatal-Error`, `Expo-Recent-Failed-Update-IDs`, `Expo-Extra-Params` ve yapılandırılmış
  `requestHeaders` [EX10]. **Çıkarım:** Privacy Explained'deki "random token" bu `EAS-Client-ID`;
  kuruluma özgü, kalıcı ama kişiyle doğrudan ilişkilendirilmeyen bir takma kimlik. iOS kaynağı
  okunmadı.
- **IP adresi.** Privacy Explained ve Trust Center IP'den söz etmiyor. Gizlilik Politikası genel
  olarak "your IP address, browser type and operating system … " topladığını söylüyor, ama bu cümle
  Expo'nun kendi kullanıcıları (geliştiriciler) için yazılmış; EAS Update isteklerindeki son
  kullanıcı IP'sinin log'lanıp saklanmadığı **belgede yok → belirsiz** (2026-10-29'daki durumla
  aynı) [EX1][EX2]. HTTPS isteği doğası gereği IP ile ulaşır; "saklanmıyor" denmiş değil.
- **OTA'yı kapatma.** `expo-updates` referansı: "There are build-time configuration options that
  control the behavior of the library." Tabloda `updates.enabled` (varsayılan `true`; iOS
  `EXUpdatesEnabled`, Android `expo.modules.updates.ENABLED`), `updates.url`
  (`EXUpdatesURL` / `EXPO_UPDATE_URL`) ve `updates.checkAutomatically` (varsayılan `ON_LOAD`;
  `NEVER`: "Automatic update checks are off, and update checks must be done through the JS API")
  yer alıyor [EX6]. Bunlar native yapıya gömülü değerler.
  - **Çıkarım:** OTA'yı kapatmak ya da adresi değiştirmek **yeni bir native build** ister
    (`updates.enabled: false` ya da `updates.url`'i kendi sunucuna çevirmek). Sahadaki eski
    kurulumlar, kullanıcı yeni APK/AAB'yi kurana kadar `u.expo.dev`'e istek atmaya devam eder.
  - Çalışma zamanında adres değiştirme var ama deneysel: `Updates.setUpdateURLAndRequestHeadersOverride`
    — "Use this method at your own risk … requires `disableAntiBrickingMeasures` to be set to
    true" [EX6].
  - Kapatınca ne bozulur: JS/asset düzeltmeleri mağaza/APK sürümü olmadan dağıtılamaz. Belgede
    başka bir yan etki sayılmıyor; EAS Build ve Submit bundan bağımsız.
- **Self-host.** Referans aynı: "it is also possible to use this library with a custom server"
  [EX6]. `expo/custom-expo-updates-server` arşivlenmemiş; son commit 17 Eyl 2025 ("[client] Update
  to SDK 54"), istemci `expo ^54.0.0` / `expo-updates ~29.0.10`; açıklaması "A simplified
  demonstration of expo-updates protocol use." [EX7] 2026-10-29'dan beri değişiklik yok. Expo
  belgelerinde bağlantısı verilen, bakımı süren başka bir sunucu görülmedi.
- **Hüküm.** SS-2 için yayımlı yol yok; tek resmî kapı Enterprise görüşmesi. Aktarımı ortadan
  kaldıran belgelenmiş iki yol: OTA'yı build'de kapatmak ya da protokol sunucusunu kendin işletmek.

#### Cloudflare Email Routing

- **DPA.** v6.4 (3 Nis 2026) yürürlükte; "Turk/KVKK/6698" 0 eşleşme. Sınır ötesi hükümler AEA/
  İsviçre/UK için SCC + DPF ve "Global PRP System" [CF1]. Self-Serve Subscription Agreement (12 Eyl
  2025): Cloudflare işleyen olduğunda veriyi DPA'ya göre işler, "which is hereby incorporated by
  reference into this Agreement" [CF3]. GDPR SSS'si self-servis müşteriler için: "our standard DPA
  … is incorporated by reference into our Self-Serve Subscription Agreement … Therefore, no action
  is required" [CF2]. **Çıkarım:** Email Routing, DPA'daki "Services" tanımına
  ("all of the cloud-based solutions offered, marketed or sold by Cloudflare") giriyor [CF1]; ürün
  adıyla ayrıca sayılmıyor.
- **Müşteri metni.** Self-servis için "imzalamayız" diyen açık bir cümle bulunamadı; imzalanacağına
  dair bir yol da yok → **belgede yok**. **Çıkarım:** ek koşullar için tek görünen kapı Enterprise
  sözleşmesi.
  İletişim: DPA Ek 1'de DPO, `legal@cloudflare.com` [CF1].
- **Email Routing ne işliyor.** Belgeler artık "Cloudflare Email Service" altında. Activity log
  yönlendirme olaylarını listeliyor (Forwarded / Dropped / Rejected / Delivery failed …), her
  olayda SPF/DKIM/DMARC sonucu ve ileti alanları var; panelde "a time range between 30 minutes and
  30 days" süzülebiliyor; aynı veri GraphQL Analytics API'de (`emailRoutingAdaptive`) [CF4].
  **Çıkarım:** olay kayıtları gönderen ve alıcı adreslerini içeriyor ve panelden 30 güne kadar
  geriye bakılabiliyor; belgede alan listesi adres düzeyinde sayılmıyor ve saklama süresi ayrıca
  yazmıyor (30 gün bir süzgeç üst sınırı, taahhüt edilmiş saklama süresi değil).
  Yönlendirilen iletinin **içeriğinin** saklanıp saklanmadığı ve hangi ülkede işlendiği Email
  Service belgelerinde yazmıyor → **belgede yok**. Tam metinde (468.900 karakter) store/retain/
  keep/persist/discard/delete köklerinin 84 geçişi tarandı; yönlendirmeyle ilgili 27 bağlamın
  hiçbiri yönlendirilen iletinin saklanmasını ya da saklanmamasını ifade etmiyor. İçerik önizlemesi
  ("Email preview", yaklaşık 7 gün) yalnızca gönderim tarafı için belgelenmiş [CF4].
- **Çıkarım.** Buradan geçen kişisel veri, iletişim adresine yazan kişilerin adresi ve ileti
  içeriği; hacmi düşük ama Hetzner/Resend'den farklı olarak içerik serbest metin. Yönlendirme
  hedefi İşleticinin kendi posta kutusu olduğundan, o kutunun sağlayıcısı da ayrı bir alıcı.
- **Hüküm.** SS-2 için yayımlı yol yok. En ucuz çözüm sözleşme değil, MX kaydını Türkiye'de
  barındırılan bir posta kutusuna çevirmek (bkz. bölüm 5).

### 2. Türk standart sözleşmesi yayımlayan sağlayıcılar

| Sağlayıcı | Yayımlanmış Türk standart sözleşme eki | Kabul akışı | Türkiye'de veri | Hüküm |
|---|---|---|---|---|
| **Oracle Cloud (OCI)** | **Var, metniyle birlikte; kapsamı dar yazılmış.** DPA'nın "Data Transfer and Additional Jurisdiction Specific Terms Annex"i (Version 14 August 2025) m.4: DPA m.6'daki **"global access"ten doğan** Türkiye dışı aktarımlar "Turkish Standard Contractual Clauses (Controller to Processor)"a tabi; Ek F, SS-2 başlığını ve madde yapısını taşıyan İngilizce/Türkçe metin (Kurul metniyle birebir karşılaştırılmadı) [OR1][OR2] | **Belirsiz.** Ek F'de taraf ve imza alanları boş ("[Müşteri için Ekle]", "[Oracle ayrıntılarını ...]"); nasıl imzalanacağı yazmıyor. Tanım, sözleşmenin "as will be notified by Oracle" olduğunu söylüyor [OR1][OR2] | Yok. OCI bölge listesinde Türkiye yok [OR4] | SS-2 metni yayımlayan tek sağlayıcı. Yurt dışı bölgede **saklamayı** kapsayıp kapsamadığı, imza ve bildirim pratiği **belirsiz** |
| **Google Cloud / Workspace** | **Var, koşullu (değişmedi).** DPA Ek 3 "Turkey"; sayfa artık "Last modified October 30, 2026" [GC1] | **Belgede yok.** Yardım sayfaları yalnızca CDPA, AB hukuku beyanı ve HIPAA BAA kabulünü anlatıyor; SCC dizininde Türk SCC sayfası yok [GC2][GC3] | Yok (önceki belgeyle aynı) | Hâlâ "Google sunarsa"; akış hesap açmadan doğrulanamıyor |
| **Microsoft Azure / M365** | **Belgede yok.** DPA'nın yeni sürümü (Last updated November 1, 2026) Türkiye/KVKK içermiyor [MS1][MS2] | Yok; Q&A'daki iki soruda yalnızca yapay zekâ/topluluk yanıtı var [MS4][MS5] | Yok [MS3] | SS-2 belirsiz |
| **AWS** | **Belgede yok.** DPA (PDF, 10 sayfa) değişmemiş; SCC "only apply to Customer Data subject to the GDPR" [AWS1]; AWS Turkey SSS'sinde KVKK yok [AWS2] | Yok | **Kısmen.** İstanbul Local Zone: EC2, EBS, **S3 One Zone-IA (directory bucket)**; RDS yok [AWS3][AWS5] | SS-2 belirsiz; İstanbul LZ artık nesne depolama da sunuyor |
| **Huawei Cloud** | **Belgede yok.** Müşteri Sözleşmesi, Gizlilik Bildirimi, DPA'da Türk standart sözleşmesi yok; Türkiye rehberi yalnızca genel olarak anıyor; DPA kendi "Data Transfer Agreement"ini kullanıyor [HW3][HW4][HW5][HW6] | Yok | **Var.** TR-Istanbul (`tr-west-1`): ECS, EVS, OBS, RDS (PostgreSQL 14–18) uç noktaları ve fiyatı var [HW1][HW2] | Veri İstanbul'da tutulabiliyor, ama sözleşme tarafı yurt dışında ve hesap verisi Singapur'da |
| **Alibaba Cloud** | **Belgede yok.** DPA (Updated: April 1, 2026) [AL2] | Yok | Yok; "Turkey" yalnızca CDN düğüm ülkeleri listesinde [AL1] | Aday değil |
| Postmark, Brevo, Twilio/SendGrid, Mailgun, Mailjet (Sinch) | **Belgede yok** (Postmark, Brevo, Twilio tarandı); Mailgun bağlantısı eski DPA'ya gidiyor; Sinch DPA'sı **okunamadı** (403) [EP1]–[EP5] | Yok | Yok | SS-2 belirsiz |
| Datadog, SmartBear (Bugsnag) | **Belgede yok** [ET1][ET2]; Rollbar DPA sayfası **bulunamadı** (404) [ET3] | Yok | Yok | SS-2 belirsiz |
| Atlassian, HubSpot, Stripe | **Belgede yok** [XS1][XS2][XS3] | Yok | — | Yayımlı Türk eki yok |

#### Oracle Cloud: yayımlı SS-2 metni (yeni bulgu)

- **Aktarım eki.** "Data Transfer and Additional Jurisdiction Specific Terms Annex to the Data
  Processing Agreement", "Version 14 August, 2025" [OR1]. Madde 4 "Transfers of Personal
  Information outside of Turkey": DPA m.6'daki küresel erişim Türk hukukuna tabi bir aktarım
  içeriyorsa "such Transfers are subject to the Turkish Standard Contractual Clauses (Controller
  to Processor) attached in Exhibit F hereto" [OR1].
- **Tanım.** "Turkish Standard Contractual Clauses" = "the template Standard Contractual Clauses on
  Transfer from Data Controller to Data Processor (Kişisel Verilerin Yurt Dışına Aktarılmasında
  Kullanılacak Standart Sözleşme – 2, Veri Sorumlusundan Veri İşleyene) as will be notified by
  Oracle to the Turkish Data Protection Authority" [OR1]. Yani atıf yapılan şablon Kurul'un SS-2'si.
- **Ek F'nin içeriği.** Ekler ayrı bir PDF'te (123 sayfa); Ek F "Turkey Commitment Letter
  (Controller to Processor)" başlığıyla, SS-2'nin başlığını ve madde yapısını (m.1–18, Ek I vd.)
  taşıyan iki dilli bir metin [OR2]. **Kurul'un yayımladığı SS-2 ile satır satır karşılaştırılmadı**;
  "değiştirilmeden" ölçütünü karşılayıp karşılamadığı bu belgede doğrulanmadı. Okunanlar:
  - Madde 2: "Herhangi bir ekleme, çıkarma veya değişiklik yapılmaması kaydıyla bu Sözleşme ..."
    (Ek F'deki ifade).
  - Madde 16 seçimlik bırakılmış: "[Veri aktaran/Veri alıcısı] bu Sözleşmeyi, imzaların
    tamamlanmasından itibaren beş iş günü içinde Kurum'a bildirir."
  - Taraf bloğu dört sütun (Data Exporter / Veri Aktaran / Data Importer / Veri Alıcısı). Veri
    aktaran sütunları "[Insert ...]" / "[Müşteri için Ekle]". **Data Importer / Veri Alıcısı**
    sütunlarında basılı bir İstanbul adresi var ("Uniq İstanbul Huzur Mahallesi Maslak-Ayazağa
    Caddesi No:4/B Kat:2 No:302 34485, Sarıyer/İstanbul"); tüzel kişi adı yazmıyor. İmza ve tarih
    alanları boş. (Sütun ataması PDF'teki metin koordinatlarından okundu: adres x=303 ve x=416
    sütunlarında, yani Data Importer başlıklarının altında.)
  - Ek I'de Hizmet Anlaşması numarası ve tarihi için boşluk var ("_________ numaralı ve ________
    tarihli Oracle Anlaşması").
- **Kapsam.** DPA (Version 14 August 2025) m.6.1: bulut hizmetlerinde veri, siparişte seçilen veri
  merkezi bölgesinde saklanır; m.6.2: "Oracle may access Personal Information globally as necessary
  to perform the Services"; m.6.3 bu erişimi aktarım ekine bağlıyor [OR3].
- **Belirsiz olanlar.**
  - **Kapsam.** m.4 yalnızca "global access in accordance with Clause 6" kaynaklı aktarımları
    anıyor. OCI'nin Türkiye bölgesi olmadığı için asıl aktarım verinin yurt dışı bölgede
    *saklanması*; okunan metinlerin hiçbiri Ek F'nin bunu da kapsadığını açıkça söylemiyor.
    Veri alıcısı adresinin İstanbul olması da kurguyu belirsizleştiriyor (yurt dışındaki alıcı kim?).
  - Ek F'nin nasıl imzalandığı (ıslak imza, e-imza, self-servis hesapta kabul) hiçbir belgede yok.
    Kurul geçerli imza arıyor; "DPA'ya atıfla dahil" olması tek başına imza sayılır mı, hukuki soru.
  - Bu sürümlerin hâlâ güncel olduğu doğrulanamadı: sözleşme seçici sayfası JavaScript ile
    çalışıyor, liste okunamadı [OR5]. Dosya adındaki `v060225` ABD biçimiyle 2 Haziran 2025; metindeki sürüm satırı 14 Ağustos 2025.
  - Bireysel (şirket olmayan) müşterinin self-servis OCI hesabında DPA'nın uygulanıp uygulanmadığı
    okunmadı.
- **Türkiye bölgesi yok.** OCI bölge listesinde (Updated 2026-06-22) Türkiye geçmiyor; en yakınlar
  Milano, Torino, Kudüs, Cidde, Riyad, Abu Dabi, Dubai [OR4].
- **Liste fiyatları** (USD, oracle.com/cloud/price-list, vergi belirtilmemiş) [OR6]:
  Compute Standard E4 $0,025/OCPU-saat + bellek $0,0015/GB-saat; E5 $0,03 + $0,002;
  Block Volume ve Object Storage $0,0255/GB-ay; Database with PostgreSQL (x86) $0,098/OCPU-saat
  (depolama ücreti ve asgari şekil okunmadı; aylık rakam çıkarılmadı);
  **Email Delivery**: ilk 3.000 e-posta ücretsiz, sonrası $0,085/1.000 e-posta.
- **Çıkarım:** Oracle tek sözleşme altında hem sunucu/nesne depolama/yönetilen PostgreSQL hem de
  işlem e-postası (Email Delivery) sunuyor. Yukarıdaki kapsam ve imza soruları Oracle'dan yazılı
  olarak olumlu yanıtlanırsa Hetzner ve Resend için bir aday olur; yanıtlanmadan öyle sayılmamalı. 1 OCPU + 4 GB E4 ≈ (0,025 + 4 × 0,0015) × 730 ≈ $22,6/ay (hesap;
  sayfada yazmıyor).

#### Google Cloud ve Workspace

- **Metin aynı, tarih değişti.** Cloud Data Processing Addendum artık "Last modified October 30,
  2026" (önceki sürüm listesinde June 8, 2026 var). Ek 3 "Turkey" 2.1, 2.2, 2.5, 2.6 taban
  belgedeki alıntılarla kelimesi kelimesine aynı [GC1]. Hangi standart sözleşme (SS-2?) ve kabulün
  nerede yapıldığı metinde yine yok: "If Customer's billing address is in Turkey and Google makes
  any optional additional terms (including Turkish SCCs) available for acceptance" [GC1].
- **Kabul akışı belgede yok.** Workspace yönetici yardımı (Last updated August 10, 2026) "Security
  and Privacy Additional Terms" altında yalnızca CDPA'ya katılmayı, AB hukuku beyanını ve HIPAA
  BAA'yı anlatıyor; Türkiye geçmiyor [GC2]. cloud.google.com/terms/sccs dizini ve uyumluluk
  listesi de Türk SCC'si içermiyor [GC3][GC4]. Arama motoru taramasında Google'a ait bir "Turkish
  SCCs" kabul sayfası çıkmadı.
- **Bireysel hesap.** Faturalama belgesi: AB dışı EMEA ülkelerinde "Business" ve "Individual" hesap
  türleri var; "The account type cannot be edited after you create your Cloud Billing account";
  "Google Cloud usage by customers in Turkey is subject to 20% VAT" [GC5]. DPA müşteri türü ayırmıyor.
  Bireysel hesaba Türk SCC'sinin sunulup sunulmadığı **belirsiz**.

#### Microsoft Azure / Microsoft 365

- DPA'nın yeni sürümü yayımlanmış: "Last updated November 1, 2026" (dosya adı November_2026).
  DOCX tam metninde (84 bin karakter) "Turk", "Türkiye", "KVKK", "6698" geçmiyor; aktarım hükmü
  aynı: "All transfers ... out of the European Union, European Economic Area, United Kingdom, and
  Switzerland ... are subject to the terms of the 2021 Standard Contractual Clauses" [MS1]. Türkçe
  sürüm de (November2026) listede [MS2].
- Azure bölge listesinde (Last updated on 10/13/2026) Türkiye/İstanbul yok [MS3].
- Q&A: 2025-11-10 tarihli "Standard Contract with Microsoft Azure Turkey ..." sorusunun tek yanıtı
  "AI answer" etiketli ve genel tavsiye içeriyor [MS5]; 2026-09-14 tarihli SS-2 sorusu taban
  belgedeki gibi topluluk yanıtlı [MS4]. Microsoft'un yayımladığı bir imza prosedürü bulunamadı.

#### AWS (DPA, AWS Türkiye, İstanbul Local Zone)

- **DPA.** aws-dpa.pdf (PDF üst verisi 2023-07-27, 10 sayfa) tam metninde Türkiye/KVKK yok;
  m.12.2–12.3 değişmemiş [AWS1]. Service Terms ("Last Updated: November 5, 2026") içinde "Turkey"
  yalnızca Marketplace sözleşme tarafı tablosunda geçiyor (m.20.1.6). Tarayıcı sayfayı Türkçe
  kabuğa yönlendirdiği için bu tarama dört parçalı WebFetch ile yapıldı (323 bin karakterin tamamı;
  küçük model özeti, birebir regex değil) [AWS6].
- **AWS Turkey SSS** yalnızca fatura/vergi ve gizlilik bildirimi atfı içeriyor; KVKK, standart
  sözleşme, veri işleme sözleşmesi geçmiyor [AWS2]. Tahmin edilen bir Türkiye veri gizliliği
  sayfası 404 döndü.
- **İstanbul Local Zone bugün** (`eu-central-1-ist-1a`, ebeveyn Frankfurt) [AWS3]:
  EC2 C7i/M7i/R7i; EBS gp2, gp3, io1, st1, sc1 ve EBS anlık yedekleri; Shield Standard; ALB; ECS;
  EKS; VPC; Direct Connect; EMR; Application Migration Service; **Amazon S3: "S3 Tek Alan-Seyrek
  Erişim"** (sayfa Türkçe sunuldu; S3 One Zone-IA). FSx, ElastiCache, **RDS**, NAT Gateway, DRS
  işaretli değil. Aynı sayfa: "Veri yerleşimi gereksinimleri için belirli metropollerde Amazon S3
  Tek Alan-Seyrek Erişim ve Amazon EBS Yerel Anlık Yedekleri desteklenmektedir."
- **S3 İstanbul'da nasıl çalışıyor.** Local Zone'larda yalnızca *directory bucket* ve yalnızca
  One Zone-IA sınıfı var: "You can create S3 directory buckets to store data in a specific data
  perimeter, which helps support data residency use cases" [AWS5]. Bu kovalar `s3express` ad
  alanını kullanıyor; kova düzeyi işlemler ebeveyn bölgedeki `s3express-control.<bölge>` uç
  noktasına, nesne işlemleri `s3express-<LocalZoneID>.<bölge>` uç noktasına gidiyor; "The routing is
  handled automatically for you if you use the AWS Management Console, AWS CLI, or AWS SDKs" [AWS5].
  **Çıkarım:** API'nin `@aws-sdk/client-s3` kullanımı bununla çalışabilir; Coolify'ın `mc` istemcisi
  genel S3 uç noktası beklediği için yedek hedefi olarak çalışması **belirsiz**.
- **Fiyatlar** (AWS fiyat verisi, yayım 2026-11-14, USD, vergi hariç, isteğe bağlı liste) [AWS4]:

  | Kalem (Turkey (Istanbul)) | Fiyat | Aylık (**Çıkarım**, 730 saat) |
  |---|---|---|
  | c7i.large (2 vCPU / 4 GiB), Linux | $0,10694/saat | ≈ $78,1 |
  | m7i.large (2 vCPU / 8 GiB), Linux | $0,12679/saat | ≈ $92,6 |
  | EBS gp3 | $0,138/GB-ay | 40 GB ≈ $5,5 |
  | EBS anlık yedek | $0,0783/GB-ay | — |
  | S3 One Zone-IA depolama | $0,01566/GB-ay | — |

  Karşılaştırma: Frankfurt'ta c7i.large $0,10185/saat, t3.medium (4 GiB) $0,048/saat; İstanbul'da
  T serisi yok, en küçük 4 GB'lık örnek c7i.large [AWS4]. Genel IPv4 ve veri çıkış ücreti okunmadı.
- **Hâlâ belirsiz:** kontrol düzlemi (ve directory bucket'ların kova düzeyi işlemleri) Frankfurt'ta;
  bunun m.9 bakımından aktarım sayılıp sayılmadığı ve AWS Turkey'in SS-2 imzalayıp imzalamadığı.

#### Huawei Cloud TR-Istanbul

- **Bölge ve hizmetler.** API Explorer uç nokta listesinde `tr-west-1` için şu uç noktalar var:
  `ecs`, `evs`, `obs`, `rds`, `cbr` (yedek), `swr` (konteyner kayıt defteri), `cce`, `dcs`, `kms`,
  `elb`, `vpc`, `dns`, `smn`, `ces`, `cts`, `lts`, `iam`, GaussDB(for MySQL) [HW1]. Önceki belgedeki
  "RDS PG İstanbul'da var mı" sorusunun yanıtı: **var.** Fiyat hesaplayıcıda TR-Istanbul seçilince
  RDS for PostgreSQL sürümleri 18, 17, 16, 15, 14; örnek türleri Primary/Standby, Single, Read
  replica [HW2].
- **Fiyatlar** (fiyat hesaplayıcı, TR-Istanbul, USD, "Yearly/Monthly, 1 month"; sayfa notu: fiyat
  "does not include VAT") [HW2]:

  | Kalem | Fiyat (sayfadaki gibi) |
  |---|---|
  | RDS for PostgreSQL 18, Single, General-purpose, 2 vCPU / 4 GB | USD 45,67/ay |
  | + Cloud SSD 40 GB | USD 9,24/ay → hesaplayıcı toplamı **USD 54,91/ay** |
  | Aynı sınıf, kullandıkça öde (fiyat verisi) | $0,082/saat |
  | Aynı sınıf Primary/Standby (fiyat verisi, arayüzde doğrulanmadı) | $91,35/ay |
  | ECS t6.large.2 (2 vCPU / 4 GiB, "General computing-basic"; **CPU kredili/burstable sınıf**, taban performansla sınırlı [HW8]) | USD 23,34/ay |
  | ECS c9.large.2 (2 vCPU / 4 GiB, "General computing-plus", varsayılan) | USD 45,41/ay |
  | Sistem diski General Purpose SSD 40 GB | USD 4,16/ay |
  | EIP, Dynamic BGP, 5 Mbit/s, bant genişliğine göre | USD 42,27/ay |
  | t6.large.2 + disk + EIP hesaplayıcı toplamı | **USD 69,77/ay** |
  | OBS "Standard multi-AZ storage" paketi 40 GB | USD 0,16/ay. 1 TB paketi fiyat verisinde $21,43/ay; ikisi orantılı değil (40 GB aynı orandan ≈ $0,84 ederdi), yani 40 GB fiyatı tanıtım fiyatı olabilir → toplam hesabında kullanılmamalı |
  | OBS standart depolama, kullandıkça öde (fiyat verisi) | $0,0000291667/GB-saat (**Çıkarım:** ≈ $0,021/GB-ay) |

  2 vCPU / 4 GB en küçük RDS PG sınıfı; daha küçüğü fiyat verisinde yok. İşletim sistemi
  seçiminde Ubuntu ve Debian var. Para birimi seçicisi var; TL seçeneği okunmadı → **belirsiz**.
  Fiyat verisinde görünen t7 ailesi arayüzde TR-Istanbul için listelenmiyor; kullanılmadı.
- **OBS ve S3 uyumu.** OBS'nin kendi imza şeması var; Huawei SSS'si (Çince sayfa, arama özetinden)
  AWS V4 imzasının kısıtlı kiplerle desteklendiğini söylüyor [HW7]. Coolify `mc` ve `@aws-sdk` ile
  uyum **belirsiz**; prototiple denenmeli.
- **Sözleşme tarafı: iki sözleşme ağacı var, hangisinin Türkiye'ye uygulandığı belirsiz.**
  - `/declaration/` ağacı: Müşteri Sözleşmesi (Last Updated: December 29, 2025) m.15.4: Hindistan,
    Pakistan ve Kuveyt dışındaki ülkeler için "Huawei Services (Hong Kong) Co., Limited";
    uygulanacak hukuk Hong Kong [HW3].
  - `/declaration-sg/` ağacı (DPA'nın bulunduğu ağaç): taraf tablosunda sayılmayan ülkeler için
    "Sparkoo Technologies Singapore Pte. Ltd."; "If there are any conflicts between the table and
    the contracting party displayed in My Account, the information set out in My Account shall
    prevail" [HW9]. Türkçe çeviri (11 Temmuz 2022) ve Türkiye rehberi de Sparkoo Singapur'u anıyor
    [HW3][HW5].
  - İki ağaçta da taraf yurt dışında; Türk bir Huawei şirketi satıcı olarak hiçbir metinde geçmiyor. Bireyler sözleşme yapabiliyor: taraf "the entity you represent or you
  individually if you don't designate an entity" [HW3].
- **Veri nerede.**
  - İçerik: "You may specify the data center region in which Your Content will be stored" ve
    "We may process certain data in the data center region where you use the Services and the
    regions where we maintain our operation, support and investigation systems and personnel" [HW3].
  - Türkiye rehberi (Version 1.0, 2024-12-2): veri seçilen bölgede kalır; Huawei onu yalnızca
    müşteri rızasıyla ya da hukuki zorunlulukla bölge dışına çıkarır [HW5].
  - Hesap verisi: "Your personal data is stored on a server located in Singapore" [HW4]; rehber de
    "By default, the customer's account data is stored on the server in Singapore" diyor [HW5].
- **KVKK.** Gizlilik Bildirimi'nin (Last Updated: January 21, 2025) "Türkiye" bölümü yalnızca ilgili
  kişi haklarını sayıyor [HW4]. Rehber Huawei'yi müşterinin "data processor"ı olarak konumluyor ve
  "HUAWEI CLOUD Singapore Sparkoo has been registered in the Türkiye data controller registry" diyor
  [HW5]. DPA (Singapur sürümü) üçüncü ülke aktarımı için kendi "Data Transfer Agreement"ini (Ek 2)
  öngörüyor; Türkiye/SS-2 geçmiyor [HW6]. uluslararası sitedeki `sa_dpa.html` 404.
- **Çıkarım:** Huawei, veriyi fiziksel olarak İstanbul'da tutan ve fiyatı açık yönetilen PostgreSQL
  + nesne depolama sunan tek hiper ölçekli seçenek. Ancak sözleşme tarafı yurt dışında (Hong Kong
  ya da Singapur), hesap
  verisi Singapur'da ve destek erişimi başka bölgelerden olabiliyor; bunun m.9 aktarımı doğurup
  doğurmadığı hukuki soru ve Huawei SS-2 taahhüdü yayımlamıyor.

#### Alibaba Cloud (kısa)

- Küresel konumlar sayfasında Türkiye bölgesi yok; "Turkey" yalnızca Orta Doğu düğüm ülkeleri
  listesinde (UAE, Kuwait, Qatar, Oman, Turkey, Pakistan) [AL1]. DPA ("Updated: April 1, 2026",
  24 bin karakter) Türkiye/KVKK içermiyor [AL2].

#### E-posta sağlayıcıları ve hata izleyiciler

| Sağlayıcı | Belge ve tarih | Türkiye/KVKK/6698 | Kaynak |
|---|---|---|---|
| Amazon SES | AWS DPA | Yok | [AWS1] |
| Postmark | DPA, "Effective November 17, 2025" (104 bin karakter) | Yok | [EP1] |
| Brevo | Terms of Service, "Version : October 1st, 2025" (153 bin karakter; DPA eki dahil) | Yok | [EP2] |
| Twilio (SendGrid) | Data Protection Addendum, "Last Updated: April 9, 2026"; ülkeye özgü hükümleri var (ör. Brezilya), Türkiye yok | Yok | [EP3] |
| Mailgun | Bağlantı Fransızca eski DPA sayfasına (`/fr/legal/dpa-ancien/`) yönleniyor; okunan metinde yok | Güncel metin **belirsiz** | [EP4] |
| Mailjet / Sinch | mailjet.com/legal/dpa artık sinch.com DPA'sına yönleniyor; sayfa bot korumasıyla 403 | **Okunamadı** | [EP5] |
| Datadog | Data Processing Addendum (29 bin karakter) | Yok | [ET1] |
| SmartBear (Bugsnag) | Data Processing Addendum (38 bin karakter) | Yok | [ET2] |
| Rollbar | Denenen iki DPA adresi 404 | **Okunamadı** | [ET3] |
| Atlassian | DPA, "Effective starting: August 17, 2026" | Yok | [XS1] |
| HubSpot | DPA, "Last Modified: September 16, 2026" | Yok | [XS2] |
| Stripe | DPA, "Last updated: September 28, 2026" | Yok | [XS3] |

- Genel arama ("Turkish SCCs" / "Turkish Standard Contractual Clauses" + "data processing
  addendum"; Türkçe eşdeğerleri) Google ve Oracle dışında yayımlı bir Türk eki olan sağlayıcı
  göstermedi. Salesforce ve Zendesk için yalnızca arama özeti görüldü (AB SCC + UK eki); DPA'ları
  açılmadı → **belirsiz**. Zoom'un DPA'sı da açılmadı → **belirsiz**.
- **Sonuç:** Kabul edilip Kurul'a bildirilebilecek, yayımlanmış bir Türk standart sözleşmesi olan
  e-posta sağlayıcısı ya da hata izleyici **bulunamadı**. E-posta için tek dolaylı yol, Oracle'ın
  aynı DPA kapsamındaki OCI Email Delivery hizmeti (**Çıkarım**; Oracle'ın imza pratiği doğrulanırsa).

### 3. Türkiye'de barındırma: VPS ve S3 uyumlu nesne depolama

Bu bölüm yerli sağlayıcıları kapsar. Türkiye'de bölgesi olan hiper ölçekliler (Huawei Cloud
TR-Istanbul: ECS, OBS, RDS; AWS İstanbul Local Zone: EC2, EBS, S3 One Zone-IA) fiyatlarıyla
birlikte bölüm 2'de.

#### (a) Türkiye'de S3 uyumlu nesne depolama

Önceki belge "bulunamadı" demişti. Ağ genişletilince **yayımlı fiyatı olan iki ürün** bulundu
(DT Cloud, Narbulut); diğerleri teklifle satılıyor.

| Sağlayıcı | Ürün | Veri merkezi (sayfadaki ifade) | S3 API belgeli mi | Fiyat | Self-servis | Kaynak |
|---|---|---|---|---|---|---|
| **DT Cloud** (DT İletişim Hizmetleri A.Ş., Beykoz/İstanbul) | Object Storage (S3) | Fiyat sayfasında bölge seçimi: "Istanbul Europe 1b", "Istanbul Asia 2a", "Ankara Asia 3a". Ürün sayfası yalnızca "All data is stored in DT Cloud's Data Centers" (özet) | **Kısmen.** "access it from anywhere using REST APIs or SDKs". Uç nokta adı herkese açık belgede **yok**, hesap içinde veriliyor: "You can find the endpoint on the product details page, in the API information tab."; anahtar panelden: "click the \"Generate Access Key\" button". Belgede adı geçen istemciler Cyberduck, Mountain Duck, Backup Exec (özet); `aws cli`/`mc`/`rclone` anılmıyor → Coolify uyumu **belirsiz** | **$ 0.04/GB** (dönem sayfada yazmıyor; diğer satırlar aylık olduğundan **Çıkarım:** GB/ay; "Unlimited API Requests", "Free Put & Get"); liste fiyatları vergisiz: "Currently list prices are tax free"; asgari kapasite ve çıkış trafiği ücreti **belgede yok**; ürün "billed as prepaid" (özet) | **Evet:** "Create Account" → console.dt.net.tr [DT7]; şartlar: "All natural and legal persons who accept the terms of the Agreement"; "in TL or USD according to the User's request" | [DT1][DT2][DT3][DT4][DT7] |
| **Narbulut** | NOSS (Narbulut Object Storage Service) | "Verileriniz Türkiye sınırları içerisinde saklanmaktadır. Veri merkezimiz master olarak İstanbul lokasyonundadır." · "Yurt dışına veri çıkışı olmadığı için KVKK ve yerel yasal regülasyonlara tam uyumluluk sağlanır." | **Kısmen.** "S3 protokolüyle tam uyumlu API'ler"; uç nokta adı yayımlı değil (Veeam rehberi: "access information given to you by Narbulut", özet) | Sayfadaki hesaplayıcı (10 Mbps dahil): **50 GB 315,9 TL/Ay** (asgari), 100 GB 631,8 TL/Ay, 500 GB 1.737,45 TL/Ay, 1000 GB 2.448,23 TL/Ay. KDV durumu **belgede yok**. İstek ücreti yok: "(request ücreti vb.) ek bir ücret ödemezsiniz" | **Kısmen.** "30 Gün Boyunca Ücretsiz Kullanın!" var; satın alma: "Narbulut ürünlerini yetkili iş ortaklarımız aracılığıyla satın alabilirsiniz" (özet). Bireysel alım **belirsiz** | [NB1][NB2][NB3] |
| DorukNet / DorukCloud | S3 Depolama | "Verileriniz KVKK ile uyumlu olarak Türkiye'de bulunan veri merkezlerimizde saklanır." (şehir yok; şirketin DC'leri İstanbul, Çorlu, Ankara, Antalya — özet) | "AWS S3 API uyumluluğu sayesinde S3 ile çalışan uygulamalar … ile bütünleşerek"; uç nokta **belgede yok** | **Fiyat yok** | Hayır: "Şimdi bilgilerinizi bırakın ve sizi en kısa sürede arayalım." | [DK1][DK3] |
| Bulutistan | Storage as a Service | "Bulutistan Veri Merkezleri Türkiye'de bulunmaktadır" (özet; şehir yok) | "S3 protokollerinin tamamını destekleyen API erişimi sayesinde nesne tabanlı depolamaya da imkan veren"; uç nokta **belgede yok** | **Fiyat yok**: "yalnızca kullanımda olan veri alanı ve servis bileşeleri için ücretlendirme yapılır" | Hayır: "Sizi Arayalım" | [BI1] |
| Türk Telekom Bulut | Nesne Tabanlı Depolama | "Türk Telekom Veri Merkezlerinde"; "Lokasyon yedekli bir altyapıdadır." | "S3 protokolünü destekleyen Nesne Tabanlı Depolama"; "S3 protokolüne uygun client uygulamaları ile" | "Proje bazlı ücretlendirilir" | Hayır: "Tüm kurumsal müşterilerimiz"; "Türk Telekom Kurumsal Müşteri Yöneticileri üzerinden" | [TT1][TT2] |
| Teletek | Object Based Storage (S3) | **Belgede yok** (yalnızca ofis adresi Ataşehir/İstanbul) (özet) | "access is performed through the S3 API" (özet) | Fiyat yok | Hayır (iletişim formu) | [TK1] |
| Turkcell | nDepo | 2026-10-29 bulgusu: 2 veri merkezi, S3 ifadesi yok, kurumsal teklif | Belirsiz | Teklif | Hayır | [TC1] |
| PlusClouds | CAS / "S3 Object Storage" | **Belgede yok**; alt bilgide "GDPR · EU Data" (özet) → Türkiye'de olduğu doğrulanamadı | "S3-compatible API" (özet) | Okunmadı | Evet (hesap) | [PC1] |
| Radore, Turhost, Natro, Netinternet/ilkbyte, Veridyen, Hosting.com.tr | — | — | Ürün yok. Radore, Turhost, Natro: 2026-10-29 site haritası taraması (bugün yinelenmedi). Netinternet, Veridyen, Hosting.com.tr: bugün ana sayfa / site haritası özeti; ilkbyte "Storage" paketi bir sunucu paketi (özet) | — | — | [NI5][VD1][HC1] |

- **Sonuç.** "Türkiye'de, self-servis, fiyatı yayımlı S3" ölçütüne en yakın ürün **DT Cloud Object
  Storage ($0.04/GB)**; ikinci aday **Narbulut NOSS (50 GB = 315,9 TL/Ay)** ama iş ortağı
  üzerinden satılıyor. İkisinde de S3 uç nokta adı ve desteklenen işlemler yayımlı değil.
- **Çıkarım (repoya göre):** Coolify yedeği `mc` ile yüklüyor ve doğrulamada `ListObjectsV2`
  çağırıyor; API ise `PutObject`, `GetObject`, `ListObjectsV2`, `DeleteObjects` kullanıyor
  (`apps/api/src/storage/s3.ts`). Bu dört işlem S3'ün çekirdeği, ama iki sağlayıcıda da
  **denenmeden uyumlu sayılamaz**. DT Cloud'un belgesindeki "S3 user panel", "iSCSI targets"
  ifadeleri paket bir depolama yazılımını düşündürüyor; yazılımın adı belgede yok.
- **Çıkarım (maliyet):** Bugünkü hacim (günlük dump × 14 gün + kapaklar) birkaç GB ise DT Cloud'da
  aylık 1 $'ın altında kalır; asgari ücret ya da ön ödeme alt sınırı belgede yok. Narbulut'ta
  asgari 50 GB dilimi 315,9 TL/Ay.
- **Yedek plan: ikinci VPS'te kendi S3 sunucun.** Hâlâ geçerli ve en öngörülebilir yol.
  - Garage: Docker Hub'da en son sürüm etiketi `v2.5.0` (2026-10-24) [S3-2]; imaj `dxflrs/garage`
    [S3-3]. Coolify'ın S3 belgesi bugün de Garage, SeaweedFS, Ceph'i **saymıyor**; liste: AWS S3,
    R2, Neon, Supabase, DigitalOcean Spaces, MinIO, B2, Scaleway, Hetzner, Wasabi, Vultr, CloudPe,
    IDrive e2; "Other providers may also work." (özet) [S3-1] → uyum **belirsiz**, prototip gerekir.
  - Fiyat (ana sunucudan **farklı** sağlayıcıda): ilkbyte Cloud I 2 Core / 2 GB / 20 GB **$4.49/ay**
    [NI5]; Radore Disk-Core 1 Core / 2 GB / 100 GB NVMe **$8.5/ay, KDV hariç** [RD1]; Natro
    XCloud 1 1 vCPU / 1 GB / 20 GB **4,99 $/ay** kampanya (liste 7,19) [NT1].

#### (b) Türkiye'de VPS (≥4 GB RAM; referans: 2 vCPU / 4 GB / 40 GB)

| Sağlayıcı / plan | vCPU / RAM / disk | Fiyat (sayfadaki gibi) | Veri merkezi | "Veri Türkiye'de" beyanı | IPv4 | Yedek / snapshot | Faturalama, TL | Sanallaştırma, root, OS | Kaynak |
|---|---|---|---|---|---|---|---|---|---|
| **ilkbyte Cloud II** (Netinternet Bilişim Teknolojileri A.Ş.) | 3 Core / 4 GB / 40 GB SSD; 2000 GB trafik | **$ 10.99 aylık / $ 0.0151 saatlik**; KDV **belgede yok**; kampanya değil | "Pamukkale Üniversitesi, Teknoloji Geliştirme Bölgesi'nde bulunan Netinternet Veri Merkezi" (Denizli; kendi DC'si) | "Netinternet tarafından yurt dışına veri aktarımı, yurt dışı yedekleme, CDN veya proxy kullanımı yapılmaz." | "1 adet IPv4 ve 1 adet IPv6 adresi otomatik olarak tanımlanır" | Snapshot + zamanlama, Acronis yedek, DR imajı var (özet); fiyatları **belgede yok** | **Saatlik ve aylık**; $/₺ seçici var | Hipervizör adı **belgede yok** ("yerli sanallaştırma orkestrasyon sistemi", özet); SSH anahtarı; "Ubuntu", "Debian" sürümsüz (özet); hazır şablon dışında "ISO'dan kurulum" ve konsol var | [NI5][NI6][NI7][NI8][NI2] |
| Netinternet SSD VDS II | 2 Core / 4 GB / 40 GB "Raid50 SSD"; 4 TB trafik | **$ 12.50 /ay** "İlk 3 ay %50 indirimli"; liste **$ 25.00**; KDV belgede yok | Aynı (Denizli) | Aynı | "1 Adet IP Adresi (Maks. 15 Adet)" | Belgede yok | Aylık; $/₺ seçici | "Ubuntu, Debian, AlmaLinux, Rocky Linux vb." | [NI1][NI2] |
| **Radore Disk-Advance** | 2 Core 2.70 GHz / 4 GB DDR4 / 200 GB NVMe | **$ 17.0 /Ay**; "Fiyatlara KDV dahil değildir." (2026-10-29 ile aynı) | "İstanbul Levent'te bulunan MetroCity AVM'nin -4. katında" (özet); kendi DC'si | "Verileriniz yurt dışına çıkmaz." (özet; önceki belgeyle aynı) | Belgede yok | "otomatik yedekleme çözümleri" (ücretli eklenti; bkz. coolify-self-hosting.md); snapshot belirsiz | Aylık; fiyat USD | Hipervizör belgede yok; root ürün sayfasında yok; Ubuntu 24.04.3 LTS (önceki belge) | [RD1][RD2][RD3] |
| Radore CPU-Advance | 4 Core / 4 GB / 100 GB NVMe | $ 17.0 /Ay, KDV hariç | Aynı | Aynı | — | — | — | — | [RD1] |
| **Turhost VPS TR 2** | 2 vCPU / 4 GB / 40 GB SSD; 100 Mbit, 1000 GB/ay | Liste **$40.21 / Ay**; "$9.99/ Ay İLK 3 AY"; "Belirtilen fiyatlar aylık KDV hariç fiyatlardır." (değişmedi) | "Türk Telekom İstanbul Gayrettepe veri merkezinde" | "VPS TR ile bu altyapı Türkiye veri merkezinde barındırılır ve yerel regülasyon gereksinimlerine uygun şekilde çalışır." | Belgede yok | "günlük yedekleri alınır ve 30 gün boyunca Zaman Makinesi altyapısında saklanır"; snapshot yalnız VPS Plus'ta (Avrupa) | Aylık; USD | Root VPS TR sayfasında yok; OS sipariş sırasında | [TH1] |
| Natro XCloud 2 | 2 vCPU / 4 GB / 40 GB SSD; 200 Mbit, 1000 GB/ay | Liste **16,99**, kampanya **9,99/ ay** ("%41 indirim"). Para birimi seçicisi "US $ / TL ₺", varsayılan **USD**; TL karşılığı sayfada 854,31 → 502,33 ("1$ = 50,28 TL"). KDV ve indirim süresi **belgede yok** | "Türkiye lokasyonlu"; veri merkezi adı **belgede yok** | "verilerini Türkiye'de barındırmak isteyen" kullanıcılar için | "1 Adet IP Adresi" | "Ücretsiz Yedekleme Yuvası" (kapsam belirsiz) | Aylık; USD/TL | "tam root erişimi bulunur"; "CentOS/AlmaLinux, Ubuntu, Windows ve CloudLinux" | [NT1] |
| Hosting.com.tr VDS - Ultra 80 | 4 Core / 4 GB / 80 GB; 200 Mbps, limitsiz trafik | "İlk 3 Ay %50": **9,99$ /ay** (499,75₺); yenileme 1 aylık $19.99 / 999,50₺ (özet); KDV belgede yok | "İstanbul / Türkiye (Mars DC)" | Belgede yok | "1x Özel IP Adresi" | Çelişkili: "her gece ücretsiz olarak yedeklenir" / "Yedekler haftalık alınır ve 1 ila 7 gün arasında saklanır" | Aylık; USD ve TL | "Tam ROOT Erişimi"; AlmaLinux, Ubuntu, Debian (özet) | [HC1] |
| **DT Cloud Light Compute c.Medium** | 2 vCPU / 4 GB; disk ayrı: "General SSD / GB 0.058"; 4 TB transfer | **$ 11.18** aylık (Linux) + disk. **Çıkarım:** 40 GB ile ≈ $13.50; vergisiz ("Excluding VAT") | LC için bölge **belgede yok**; VPC ve S3 için "Istanbul Europe 1b / Istanbul Asia 2a" | "high-security data centers located in Türkiye" (özet) [DT7] | Belgede yok (VPC'de "Static BGP (IP) $ 5.25") | "Supports Snapshot and restore"; "You must purchase your LC backup service separately" (özet) | "Billing will be done monthly … in TL or USD according to the User's request." | Sanallaştırma türü belirsiz: şartlar "LC is a virtual private server created virtually on a host server and sharing resources.", fiyat SSS'si "a separate container Virtual Machine" diyor; "With root access" (özet); "Ubuntu, Debian, Fedora and CentoS"; hesaplayıcıda görünen imaj "Ubuntu-18.04-Cloudimage" → güncel sürüm **belirsiz** | [DT1][DT5][DT6][DT3][DT7] |
| Veridyen gnCloud S-5 | 4 Core / 8 GB / 160 GB NVMe (4 GB plan yok; 2 Core / 8 GB "Tükendi") | **1680.95₺ /ay**; KDV belgede yok | "İstanbul'daki Mars Veri Merkezi" | "müşteri verileri yurt içinde barındırılır" | Belgede yok | Yedek ek hizmet; "Dilediğiniz süre için snapshot hizmeti alabilirsiniz" | Aylık; TL | **VMware ESXi**; AlmaLinux, RockyLinux, Ubuntu, Debian | [VD1][VD2] |
| DorukCloud Single Cloud - Linux | Özellik **belgede yok** | "9,43 $" aylık; düğme "Satın Al Uygun Değil" (özet) | İstanbul (Beşiktaş), Çorlu, Ankara, Antalya (özet) | — | — | — | — | Ubuntu 22.04 / 20.04; **24.04 listede yok** (özet) | [DK2] |
| Türk Telekom Bulut Sanal Veri Merkezi | Kaynak havuzu (vCPU/RAM ayrı) | "Aylık 450 TL'den" / paket kartında "400 TL/Ay'dan itibaren 12 Ay Taahhütlü Ücret" (sayfa içi tutarsız); birim fiyat okunamadı | "Esenyurt ve Ümitköy veri merkezlerimiz" | "sertifikalı Türk Telekom Veri Merkezlerimizde" | — | Sanal Sunucu Yedekleme "Aylık 340 TL'den" | CPU/RAM saatlik, disk aylık; TL | "Linux ve Windows" | [TT3][TT1] |
| Bulutistan VPS | Plan / fiyat **yok** | "Sizi Arayalım" (özet) | — | — | — | — | TL (özet) | — | [BI2] |
| Vargonen | vargonen.com → `eclitgo.eclit.com` yönleniyor; VPS Standard 4 GB $5.99/ay ama "Satın Al Unavailable"; sunucular "Türkiye ve Avrupa'da" (özet) → **belirsiz** | | | | | | | | [VG1] |

#### (c) KVKK / veri işleme sözleşmesi, port 25 / PTR, Coolify uyumu

- **Veri işleyen sözleşmesini yayımlayan iki sağlayıcı bulundu** (önceki belgede yoktu):
  - **Netinternet / ilkbyte:** "Hizmet alan müşterilerimizle Tedarikçi Gizlilik ve Kişisel
    Verilerin Korunması Sözleşmesi imzalanır." Sözleşme PDF olarak yayımlı [NI3]; akış: imzalı
    nüsha KEP'e gönderiliyor ("İmzalı nüshayı KEP adresimize … gönderin"). "Sunucunuzdaki veriye
    erişen bir alt işleyen kullanmıyoruz." Taahhüt: "veri işleyen yükümlülüklerini yazılı
    sözleşmeyle üstlenmeyi". **Uyarı:** sayfada doldurulmamış yer tutucular duruyor ("[3] iş
    günü", "[N] gün sonra silinir", "[şifreli olarak]", "[e-posta adresi]") → metin nihai
    olmayabilir; PDF'in içeriği okunmadı [NI2].
  - **Veridyen:** "Hizmetlerimizde barındırdığınız kişisel veriler bakımından KVKK anlamında
    veri sorumlusu sizsiniz; Veridyen ise sizin adınıza ve talimatlarınız doğrultusunda hareket
    eden veri işleyendir." [VD2]. Bağlayıcı belge ayrı bir web sayfası: "Tedarikçi Gizlilik ve
    Kişisel Verilerin Korunması Sözleşmesi" [VD4]. Özet okumaya göre **kayıtta elektronik
    onayla** yürürlüğe giriyor (m.19: "Kullanıcı tarafından kayıt formunun doldurulması ve
    elektronik ortamda onaylanması"), yani imza/KEP gerekmiyor; m.11: "MÜŞTERİ'ye ait veriler
    ile TEDARİKÇİ tarafından alınan yedekler ve snapshot'lar yurt içinde barındırılır."; Ek-1
    alt yüklenicileri: Mars Veri Merkezi (İstanbul), Turknet (Türkiye), MailChannels (Kanada),
    Cloudflare (ABD), Brevo (Fransa) (özet; birebir doğrulanmadı). İstisna: Premium Mail
    Gateway alınırsa giden e-posta "yurt dışındaki bir e-posta iletim servisi üzerinden
    iletilebilir" [VD2]; bunun kendi SMTP'sini kullanan bir sunucuyu etkileyip etkilemediği
    **belirsiz**.
- **Radore:** "veri işleyen sıfatıyla üzerimize düşen yükümlülükler ekibimiz tarafından eksiksiz
  yerine getirilir" (özet) ama sözleşme metni ya da imza akışı **belgede yok** [RD2].
- **DT Cloud:** İngilizce şartlar (tarayıcıda tarandı; Türkçe sürüm okunmadı) 6698 sayılı
  Kanun'a atıf yapıyor ama "processor" / "controller" kelimeleri metinde **geçmiyor**; §4.7:
  "The Service Provider has the right and authority to change data centers, hardware, security,
  hosting, and other infrastructure if deemed necessary." → Türkiye'de kalma sözleşmesel
  taahhüt olarak **belgede yok** [DT3].
- **Turhost, Natro, Hosting.com.tr, Narbulut:** pazarlama düzeyinde "Türkiye'de" / "KVKK uyumlu"
  beyanı var; veri işleyen sözleşmesi **belgede yok**.
- **Port 25 (giden SMTP):** Okunan ürün, SSS ve ağ politikası sayfalarının **hiçbirinde** port 25
  politikası yazmıyor (Netinternet ağ politikası yalnızca "Spam, port scanning, DDoS kaynaklı
  trafik tespit edildiğinde gerekli teknik aksiyonlar" diyor, özet [NI4]; Veridyen genel
  şartları "toplu / spam e-posta gönderimleri için kullanılamaz" diyor, özet [VD3]). Hepsi
  **belgede yok**; sipariş öncesi sorulmalı.
- **Reverse DNS / PTR:** ilkbyte "IP Yönetimi" altında "reverse DNS" yönetimi sunuyor (özet)
  [NI6]. Radore IP kiralamada "route ve reverse DNS kayıtlarınızı yapılandırıyoruz" diyor (özet;
  bulut sunucunun tek IP'si için geçerli mi belirsiz) [RD4]. Diğerleri **belgede yok**.
- **Coolify uyumu (Çıkarım):** Coolify root/sudo SSH + desteklenen Linux ister. Açıkça root
  yazanlar: Natro, Hosting.com.tr, DT Cloud. Ubuntu 24.04'ü adıyla gösteren: Radore, Turhost
  (önceki belge). ilkbyte, Netinternet, Veridyen, Natro "Ubuntu" diyor, sürüm yok. DorukCloud'da
  24.04 yok. KVM'i adıyla yazan sağlayıcı **yok**; Veridyen VMware ESXi (tam sanallaştırma,
  Docker için engel değil). ilkbyte kendi ISO'nu takıp kurmaya izin veriyor [NI8]; bu, tam
  sanallaştırmaya işaret eder ve şablon listesinde olmasa bile Ubuntu 24.04'ün kurulabileceği
  anlamına gelir (**Çıkarım**, denenmedi). Kapsayıcı tabanlı (OpenVZ/LXC) olmadığı Natro,
  Turhost, Hosting.com.tr ve DT Cloud Light Compute için **doğrulanmadı**.
- **CI imajları amd64** (`scripts/setup-beta-infra.sh` 5. adım); listedeki planların hepsi
  Intel Xeon / x86.

#### (d) Kısa liste

1. **ilkbyte Cloud II (Netinternet), $10.99/ay.** Bugünkü Hetzner CX23'e en yakın biçim:
   3 Core / 4 GB / 40 GB, saatlik faturalama, IPv4 + IPv6 dahil, snapshot, güvenlik duvarı, API,
   reverse DNS yönetimi. Kendi veri merkezi (Denizli), "yurt dışına veri aktarımı … yapılmaz"
   beyanı ve **imzalanabilir veri işleyen sözleşmesi**. Eksikler: KDV, hipervizör adı, şablonlardaki
   Ubuntu sürümü, port 25 belgede yok; KVKK sayfasında yer tutucular var; tek lokasyon.
2. **Radore Disk-Advance, $17/ay KDV hariç.** 200 GB NVMe (yerel yedek ve imajlar için bol),
   İstanbul'da kendi veri merkezi, ISO 27001 / PCI-DSS, "veri işleyen" ve "Verileriniz yurt dışına
   çıkmaz" beyanı. Eksikler: sözleşme metni yayımlı değil; root, snapshot, IPv4 ve port 25 ürün
   sayfasında yok; yedek ücretli.
3. **DT Cloud (Light Compute c.Medium ≈ $13.50/ay vergisiz + Object Storage $0.04/GB).**
   VPS ile S3'ü aynı self-servis hesapta veren tek yerli aday; S3 için üç bölge (İstanbul Avrupa,
   İstanbul Asya, Ankara) yedeği sunucudan başka bölgeye koymayı mümkün kılar. Eksikler: veri
   işleyen rolü ve Türkiye'de kalma taahhüdü şartlarda yok; S3 uç noktası ve `mc` uyumu
   belgesiz; LC bölgesi, IPv4 ve güncel Ubuntu imajı belirsiz.

- Yedekte: **Turhost VPS TR 2** (TT Gayrettepe, 30 günlük günlük yedek dahil; liste $40.21,
  ilk 3 ay $9.99, KDV hariç; 40 GB disk dar). **Veridyen** veri işleyen rolünü en açık yazan ve
  sözleşmesi kayıtta onaylanan sağlayıcı, ama en küçük stokta plan 8 GB / 1680.95₺ ve altyapı
  kiralık (Mars DC).
- **Çıkarım (yerleşim):** Yedek hedefi sunucuyla aynı sağlayıcı ve aynı tesiste olmamalı
  (bugünkü kurulum da yedeği başka Hetzner lokasyonuna koyuyor). Örnek eşleşmeler: ilkbyte
  (Denizli) + DT Cloud S3 (İstanbul/Ankara), ya da Radore (İstanbul) + ilkbyte Cloud I'de Garage.

### 4. Türkiye'den e-posta

Bugünkü kullanım (**Çıkarım**, `apps/api/src/mail/mailer.ts`): dört düz metin ileti türü (giriş
kodu, e-posta değiştirme kodu, e-posta değişti bildirimi, hesap silme kodu); pazarlama iletisi yok.
Davetli beta için hacim günde birkaç on iletiyi geçmez; Gmail ve Outlook'un "toplu gönderici" eşiği
olan günde 5.000 iletinin çok altında.

| Seçenek | Veri nerede (sayfadaki ifade) | API / SMTP | Fiyat (sayfadaki gibi) | Self-servis | Kaynak |
|---|---|---|---|---|---|
| **Euromsg Express** (Hedef Medya Tanıtım İnteraktif Medya Pazarlama A.Ş., İstanbul) | **Belgede yok.** Gizlilik politikası, kullanım koşulları, ürün sayfası, "Hakkımızda" ve anti-spam politikası sunucu ya da veri merkezi konumu söylemiyor; alt bilgideki "KVKK" bağlantısı bir aydınlatma metnine değil, Related Digital'in bir e-kitap tanıtım sayfasına gidiyor. Kullanım Koşulları m.11.6 müşteriye, verilerin "yurt içinde ve yurt dışında 3. kişilere aktarılması ve işlenmesi için gerekli izinlerin" alındığını taahhüt ettiriyor; m.11.7 Euromsg'u "Veri İşleyen" olarak tanımlıyor | "Kolay API Entegrasyonu"; SMTP ürün sayfasında geçmiyor | Transactional paket **20.000 e-posta/ay ₺520 + KDV**, aylık (2026-10-29 ile aynı); kademeler 50.000 / 100.000 / 300.000 / 700.000 / 1.000.000 | Evet ("ÜCRETSİZ HESAP OLUŞTUR") | [EM1][EM2][EM3][EM4] |
| **INBOX / INBOXNotify** (useinbox.com) | **Sayfa Kanada diyor.** Güvenlik sayfası: "We use multiple MTAs, placed in different world-class data centers around the Canada." DPA m.13.1: "USEINBOX may transfer and process Customer Data anywhere in the world where USEINBOX, its affiliates or its Sub-Processors maintain data processing operations." DPA KVKK'yı tanımlarda anıyor ("Veri İşleyen") ama Türk standart sözleşmesi içermiyor | "REST API & SMTP" | "5,000 emails/month free"; ücretli "STARTS AT $ 39 /month" | Evet | [IB1][IB2][IB3] |
| **Sendloop** | **Belgede yok**; "A product of 50SAAS LLC" (özet) | "Transactional API and SMTP relay included on every plan" (özet) | Free 100 e-posta; Starter 25.000 e-posta $29 (özet) | Evet | [SL1] |
| **Türk hosting posta kutusu üzerinden SMTP** (Turhost / Natro "XMail Kurumsal") | Turhost: "E-posta verileriniz, Türkiye'de bulunan ve KVKK uyumlu %100 yerli sunucular üzerinde güvenle barındırılır." Natro: "tüm e-posta adresleri ve içerdiği iletiler Türkiye sınırları içerisinde, KVKK uyumlu ve yüksek güvenlikli altyapı üzerinde saklanır." | "SMTP/POP/IMAP"; API yok | Kurumsal 1 (1 hesap, 50 GB): üstü çizili **$2.99 / Ay**, gösterilen **$0.99 / Ay** ("%67"); Kurumsal 5: $13.19 / $4.45. Turhost dipnotu: "Belirtilen fiyatlar en düşük aylık birim fiyatlarıdır ve karşılaştırma amaçlıdır." ve "Belirtilen fiyatlar aylık KDV hariç fiyatlardır." Düşük fiyatın hangi taahhüt süresinde geçerli olduğu okunmadı | Evet | [TH2][NT2] |
| **Türk VPS'te kendi SMTP sunucun** | Sunucunun bulunduğu yerde (Türkiye) | SMTP | Ek ücret yok; sunucu belleği ve bakım | — | aşağıda |
| OCI Email Delivery (Oracle) | Yurt dışı bölge; Oracle'ın Ek F'si imzalanabiliyorsa "imzala" yoluna girer (bkz. bölüm 2) | API / SMTP | İlk 3.000 e-posta ücretsiz, sonrası $0,085/1.000 | Evet | [OR6] |

- **Euromsg Express.** Önceki belgedeki açık soru kapanmadı: verinin Türkiye'de işlendiği hiçbir
  sayfada yazmıyor. m.11.6'daki "yurt dışında 3. kişilere aktarılması" ifadesi tek başına aktarım
  yapıldığını göstermez, ama "aktarım yok" varsayımını da desteklemez → **belirsiz**; yazılı soru
  gerekir [EM3].
- **XMail Kurumsal (Turhost/Natro) ile gönderim.** İki site aynı ürünü aynı fiyatlarla satıyor.
  Turhost SSS'si: "Kurumsal mail hosting ile toplu e-posta ve bülten gönderimi yapılamamaktadır.
  E-posta hizmetiyle saatte 250 e-posta gönderimi yapabilirsiniz." [TH2] **Çıkarım:** giriş kodu
  toplu ileti ya da bülten değil ve saatte 250 sınırı beta hacminin üstünde; ama bir uygulamanın
  SMTP ile otomatik ileti göndermesine izin verildiği sayfada **yazmıyor**. Giden iletinin yurt
  dışındaki bir aktarım servisinden geçip geçmediği de yazmıyor; Veridyen'in alt yüklenici
  listesinde MailChannels (Kanada) bulunması [VD4], Türk host'larda bunun olabildiğini gösteriyor.
  İkisi de sipariş öncesi sorulmalı.
- **Kendi SMTP sunucun: teslim edilebilirlik.**
  - Gmail, tüm göndericiler için (özet) [GM1]: "Set up SPF or DKIM email authentication for your
    sending domains."; "Ensure that sending domains or IPs have valid forward and reverse DNS
    records, also referred to as PTR records."; "Use a TLS connection for transmitting email."
    Günde 5.000+ gönderenler için ek olarak SPF **ve** DKIM, DMARC, tek tıkla abonelikten çıkma.
    İtibar: "Start with a low sending volume to engaged users, and slowly increase the volume over
    time."; paylaşılan IP'de diğer göndericilerin davranışı itibarı etkiler.
  - Outlook.com (özet) [OL1][OL2]: "Email servers must have valid reverse DNS records.";
    "Connections from dynamic IP space may not be accepted."; günde 5.000'den fazla gönderen alan
    adları için SPF, DKIM ve DMARC (en az `p=none`) zorunlu; 5 Mayıs 2025'ten beri uymayan ileti
    Junk klasörüne gidiyor, ret tarihi "to be announced".
  - **Çıkarım:** Hacim eşiklerin altında, yani biçimsel koşullar SPF ya da DKIM + PTR + TLS'ten
    ibaret; alan adında SPF, DKIM ve DMARC kayıtları zaten Resend için kurulmuş
    (`scripts/setup-beta-infra.sh` 13. aşama) ve yeniden yazılmaları gerekir. Asıl risk belgelerde
    sayılmayan şey: yeni ve Türk hosting bloğundaki tek bir IP'nin itibarı. Giriş kodu spam
    klasörüne düşerse kullanıcı giriş yapamaz (Google ile giriş yedek olarak duruyor).
  - **Ön koşullar belgesiz.** Okunan Türk VPS sağlayıcılarının hiçbiri giden port 25 politikasını
    yazmıyor; PTR yönetimini yalnızca ilkbyte (panelde) ve Radore (IP kiralamada) anıyor (bkz.
    bölüm 3). Sipariş öncesi yazılı teyit gerekir.
- **Depoda ne değişir (Çıkarım).** `resendMailer` Resend SDK'sını çağırıyor ve üretimde
  `RESEND_API_KEY` zorunlu (`apps/api/src/env.ts`). SMTP'ye (posta kutusu ya da kendi sunucun)
  geçmek, `Mailer` arayüzünün arkasına bir SMTP gönderici (ör. nodemailer) ve yeni ortam
  değişkenleri eklemek demek; Euromsg Express'e geçmek, onun HTTP API'sine göre yeni bir gönderici
  yazmak demek. Arayüz tek dosyada, testler sahte gönderici kullanıyor; değişiklik küçük.
- **Sonuç.** Verinin Türkiye'de işlendiğini **yazılı olarak beyan eden** tek self-servis gönderim
  yolu, Türk hosting posta kutusunun SMTP'si (Turhost/Natro); işlem e-postası API'si olarak
  tasarlanmamış. Türkiye kökenli API sağlayıcılarından Euromsg Express konum beyan etmiyor, INBOX
  Kanada diyor. Turkcell'de e-posta gönderim API'si bulunamadı (arama; toplu ürünü "Mesaj Üssü"
  SMS odaklı); kurumsal e-posta ürünü Mailim için sayfa "Hizmet 31.10.2026 tarihinde tamamen
  kapanacaktır." diyor [TC2]. Türk Telekom'un e-posta ürünleri bu turda okunmadı.

### 5. Değiştirmek yerine kaldırmak

- **Sentry:** aşağıdaki GlitchTip / Bugsink karşılaştırması; Sentry'de kalıp veriyi azaltma
  denetimleri bölüm 1'de.
- **EAS Update:** kapatma ve self-host bulguları bölüm 1'deki "Expo / EAS Update" başlığında;
  protokol ve örnek sunucunun durumu `coolify-self-hosting.md` bölüm 7'de (değişmedi: örnek sunucu
  hâlâ SDK 54).
- **Cloudflare Email Routing:** aşağıdaki posta kutusu notu.

#### GlitchTip ve Bugsink

| | GlitchTip | Bugsink |
|---|---|---|
| Sürüm | 7.0, 9 Kas 2026 [GT6] | 2.6.3, 6 Kas 2026 [BS4] |
| Lisans | MIT [GT7] | PolyForm Shield 1.0.0 (OSI onaylı açık kaynak lisansı değil; kaynağı açık); `ee/` ayrı lisans [BS4] |
| Kurulum | Docker Compose öneriliyor; tek servis ("all-in-one") ya da ayrı web + worker [GT1] | "A single container is enough"; Docker, Docker Compose, virtualenv [BS2][BS3] |
| Bağımlılık | PostgreSQL 14+ **zorunlu**; Valkey/Redis 7+ isteğe bağlı [GT1] | Varsayılan SQLite; MySQL ya da PostgreSQL seçilebilir; "No message queue, no external services" [BS3] |
| Kaynak | "Recommended … 512 MB RAM"; "Minimum … 256 MB RAM when using all-in-one setup"; ayda 1 milyon olay ≈ 30 GB disk [GT1] | Okunan belge sayfalarında asgari RAM rakamı yok → **belgede yok** |
| Hatalar | Evet (Sentry SDK'larıyla) [GT4][GT5] | Evet: "Bugsink works with the Sentry SDKs" [BS1] |
| Trace / performans | Evet: "GlitchTip receives transactions … and spans" [GT3] | **Hayır:** "Bugsink intentionally focuses only on error events. It does not handle metrics, traces, or other event types." [BS1] |
| Log'lar | Evet (6.1'den beri): "GlitchTip accepts logs through the standard envelope endpoint"; SDK'da `enableLogs: true` yeterli [GT2][GT6] | Hayır [BS1] |
| Session / release health | **Hayır:** "GlitchTip does not support sessions" → `autoSessionTracking: false` [GT4][GT5] | Hayır [BS1] |
| Session replay (mobil dahil) | **Belgede yok** (özellik rehberlerinde replay geçmiyor) | Hayır [BS1] |
| Source map / debug dosyası | Evet, GlitchTip CLI ile (`glitchtip-cli debug-files upload`) [GT4][GT5] | Source map sayfası var [BS2]; native debug dosyaları okunmadı |
| React Native | Kurulum sayfası var: `@sentry/react-native`, "JavaScript errors, native crashes (iOS and Android)" [GT4] | SDK'ya özgü sayfa okunmadı; genel ifade "works with the Sentry SDKs" [BS1] |

- **Bu depodaki kullanım açısından (Çıkarım).** Uygulama hata, trace, log ve mobil replay
  gönderiyor (`apps/app/src/lib/sentry.ts`, `apps/api/src/instrument.ts`). (Bu belge yazıldıktan
  sonra replay ve log gönderimi #31 kapsamında kapatıldı; aşağıdaki replay notları o günkü hâli
  anlatır.)
  - **GlitchTip:** hata + trace + log karşılanıyor; replay ve release health karşılanmıyor.
    `replaysOnErrorSampleRate` / `replaysSessionSampleRate` ve `mobileReplayIntegration` kaldırılmalı,
    `autoSessionTracking: false` eklenmeli. Mevcut Coolify sunucusunda bir konteyner + mevcut
    Postgres'te ayrı bir veritabanı (ya da ikinci bir Postgres) yeterli; belgelenen bellek ihtiyacı
    256–512 MB [GT1]. CI'daki source map yükleme adımı `sentry-cli` yerine GlitchTip CLI'ya
    çevrilmeli.
  - **Bugsink:** yalnızca hata olayları; `tracesSampleRate: 0`, log ve replay kapalı. En az hareketli
    parça (tek konteyner, SQLite).
  - GlitchTip log belgesi "an MIT sentry SDK" diyor. Depoda kurulu `@sentry/node` 11.10.0 ve
    `@sentry/react-native` 8.28.0 paketlerinin `package.json` lisans alanı "MIT" (yerel
    `node_modules`'tan okundu), yani bu koşul bugün karşılanıyor.
  - **Belirsiz:** `@sentry/node` 11'in span'ları tek tek akıtan (span streaming) yükünü GlitchTip
    7.0'ın kabul edip etmediği belgede sürüm bazında yazmıyor. Prototiple denenmeli.
- **KVKK etkisi (Çıkarım).** İkisi de aynı Türk VPS'te çalıştırıldığında hata raporları yurt dışına
  çıkmaz; Sentry checklist satırı "taşı" yoluyla kapanır. Bedel: bir servis daha güncellemek ve
  yedeklemek (ya da hata verisini yedeklememeyi kabul etmek).

#### İletişim adresi için Türkiye'de posta kutusu

- Bugün `iletisim@` adresi Cloudflare Email Routing ile İşleticinin kendi posta kutusuna
  yönlendiriliyor (`scripts/deploy-beta.sh`, "Cloudflare: mail to iletisim@" aşaması). O kutunun
  sağlayıcısı da ayrı bir alıcı; depoda yazmıyor.
- **Turhost / Natro XMail Kurumsal 1:** 1 hesap, 50 GB, IMAP/SMTP; üstü çizili $2.99 / Ay, "en
  düşük aylık birim fiyat" $0.99 / Ay, KDV hariç; verinin Türkiye'de saklandığı sayfada yazılı [TH2][NT2]. Veri işleyen
  sözleşmesi **belgede yok**.
- **OwnHost "Yerli E-posta":** "A secure data infrastructure hosted entirely on servers located
  within Turkey."; en küçük paket 10 posta kutusu / 100 GB, $3.99 (196,85 ₺); veri merkezi adı ve
  KDV **belgede yok** (özet) [OH1].
- **Çıkarım:** Geçiş, alan adının kök MX kayıtlarını Cloudflare'inkilerden yeni sağlayıcınınkilere
  çevirmek ve kutuyu doğrudan orada okumak demek (başka bir kutuya iletmek yeni bir alıcı
  doğurur). Resend'in MX'i `send.` alt alanında, çakışmaz. Aynı kutu ya da ikinci bir hesap giriş
  kodlarının SMTP göndericisi de olabilir (bölüm 4).
- Alan adının DNS'i Cloudflare'de kalıyor (proxy kapalı, "DNS only"; `scripts/setup-beta-infra.sh`
  6. aşama). DNS barındırmanın kişisel veri aktarımı sayılıp sayılmadığı bu belgede incelenmedi →
  **belirsiz**.

### 6. Veritabanını taşımanın maliyeti

**Çıkarım**; depodaki betiklere (`scripts/setup-beta-infra.sh`, `scripts/deploy-beta.sh`) ve
ADR-0006/0011'e dayanır, denenmiş bir prosedür değildir. Bugünkü üretim: tek Hetzner CX23 üzerinde
Coolify; üç GHCR imajı (PostgreSQL 18 + init betiği, API, web); günlük `pg_dump` (14 gün) başka
lokasyondaki Hetzner Object Storage kovasına; kapaklar ikinci bir özel kovada, yedeksiz.

1. **Hazırlık, kesintisiz:** Türk VPS (Ubuntu 24.04, root SSH, amd64; yalnızca 22/80/443 açık), Coolify, GHCR çekme token'ı.
2. **S3 hedefi önce denenir:** Coolify'ın `mc` yüklemesi ve API'nin dört çağrısı (`PutObject`, `GetObject`, `ListObjectsV2`, `DeleteObjects`); adayların hiçbiri Coolify'ın destekli listesinde değil. API üretimde `COVERS_S3_*` olmadan açılmıyor (`env.ts`), yani S3 uyumlu bir hedef bugünkü kod için zorunlu.
3. **Postgres:** aynı imaj, `HOMELIBRA_*` değişkenleri eski değerleriyle; init betiği iki rolü ve boş veritabanını kurar (dump rolleri taşımaz, sahiplik ve RLS politikalarını taşır).
4. **Kesinti başlar:** eski API durdurulur, Coolify'da "Backup Now", dump yeni sunucuya alınır.
5. **Geri yükleme, yeni API ilk kez başlamadan önce** (API açılışta migration çalıştırır): `pg_restore -U postgres --exit-on-error -d homelibra`, tatbikattaki komut.
6. Coolify'ın içe aktarma ekranı kullanılırsa "Keep owners and privileges" açılmalı (varsayılan kapalı); yoksa tabloların sahibi değişir ve RLS'in dayandığı rol ayrımı bozulur.
7. **Doğrulama:** tatbikattaki tablo satır sayısı karşılaştırması.
8. **API ve web:** aynı imajlar; `DATABASE_URL` / `MIGRATION_DATABASE_URL` ve `COVERS_S3_*` değişir; **`BETTER_AUTH_SECRET` aynı kalmalı**, yoksa herkesin oturumu düşer.
9. **Kapaklar:** iki kova arasında anahtarlar korunarak kopya (ör. `rclone`); atlanırsa kapaklar sessizce şablon ikona düşer (ADR-0011).
10. **DNS:** Cloudflare'de kök ve `coolify` A kayıtları yeni IP'ye; Let's Encrypt sertifikası ancak bundan sonra alınır (kısa TLS boşluğu).
11. **CI:** `COOLIFY_URL`, `COOLIFY_API_UUID`, `COOLIFY_WEB_UUID`, `COOLIFY_TOKEN` yenilenir; sihirbaz betikleri ve `env.ts` Hetzner'e özgü değerler içeriyor (`fsn1|nbg1|hel1`, `your-objectstorage.com`).
12. **Yedek:** yeni sunucuda günlük yedek (14 gün) ve bir geri yükleme tatbikatı.
13. **Temizlik:** eski sunucu ve iki Hetzner kovası (içindeki 14 günlük dump'larla) silinene kadar veri Almanya'da durur.
14. **Kesinti tahmini:** küçük veritabanında dump + geri yükleme dakikalar; DNS ve sertifikayla planlı pencere yaklaşık 30–60 dakika; hazırlık ve S3 denemesiyle 1–2 iş günü (ikisi de ölçülmedi).
15. **Kalıcı bedel:** adayların çoğunda snapshot, port 25, IPv4 ve hipervizör belgesiz; S3 uç noktaları belgesiz; saatlik faturalama yalnızca ilkbyte'ta. Sipariş öncesi yazılı teyit gerekir.

### Tarama kaydı

Bölüm 1 ve 5'teki sayfalar: tarayıcıda açılıp `document.body.innerText` üzerinde
`Turk|Türkiye|KVKK|6698|standard contract|customer paper|custom (DPA|agreement)|negotiat` (ve
sayfaya özgü ek terimler) arandı. "Eşleşme"
sütunu yalnızca Turk/Türkiye/KVKK/6698 içindir.

| Sayfa | Metin uzunluğu | Eşleşme |
|---|---|---|
| Hetzner DPA PDF [HZ1] (metin PDF akışlarından çıkarıldı; yalnızca ASCII glifler güvenilir çözüldü, "Turk"/"KVKK" bu kapsamda) | 50.407 | 0 |
| Hetzner Docs, Data Protection at Hetzner [HZ2] | 16.248 | 0 |
| Resend DPA [RS1] | 44.878 | 0 |
| Resend GDPR [RS2] | 9.002 | **2** ("Türkiye KVKK", olumsuz) |
| Resend Regions [RS3] / Subprocessors [RS4] | 3.542 / 1.664 | 0 |
| Sentry DPA 5.1.0 [SN1] | 46.134 | 0 |
| Sentry yardım makaleleri [SN2][SN3] | 2.390 / 1.067 | 0 (ülke adı geçmiyor; "a different jurisdiction") |
| Sentry Subprocessors [SN5] | 2.371 | 0 |
| Expo Privacy [EX2] / Terms [EX3] / Privacy Explained [EX1] | 22.013 / 49.162 / 5.192 | 0 |
| Expo Trust Center [EX4] / Security [EX9] | 4.159 / 6.384 | 0 |
| Cloudflare DPA v6.4 [CF1] | 55.960 | 0 |
| Cloudflare Self-Serve Subscription Agreement [CF3] | 40.708 | 0 |
| Cloudflare GDPR SSS [CF2] (`textContent`, kapalı akordeonlar dahil) | 40.179 | 0 |
| Cloudflare Email Service belgeleri, `llms-full.txt` [CF4] | 468.900 | 0 (ayrıca saklama ifadeleri: 84 geçiş, 27'si yönlendirme bağlamında) |

Okunamayanlar: `sentry.zendesk.com` makalesi oturum istiyor (aynı içerik `sentry.help` üzerinden
okundu). Bölüm 1'de WebFetch özetine dayanılan yer yok; Resend ve Sentry'deki belirleyici cümleler
tarayıcıdan birebir alındı.

Bölüm 2'deki sayfalar (karakter sayısı / `Turk|Türkiye|KVKK|6698` eşleşmesi):

- Google Cloud DPA: 185.314 / 22 (tümü Ek 3 "Turkey") · Google SCC dizini: 54.706 / 0 ·
  Google Cloud Terms: 108.240 / 0 · Uyumluluk listesi: 228.295 / 0 · Workspace gizlilik yardımı:
  4.275 / 0
- Microsoft DPA Kasım 2026 (DOCX'ten çıkarılan metin): 84.203 / 0 · Azure bölge listesi: 5.667 / 0
- AWS DPA (PDF'ten çıkarılan metin): 29.036 / 0 · AWS Turkey SoR FAQ: 31.961 / 0 (KVKK terimleri)
- Oracle aktarım eki: 17.445 / 7 · Oracle ekler PDF'i: 327.330 (Ek F 61.420 karakter) ·
  Oracle DPA: 26.051 / 0 · OCI bölgeleri: 24.289 / 0
- Huawei Müşteri Sözleşmesi (EN): 73.261 / 0 · Huawei Gizlilik Bildirimi: 35.246 / 2 ·
  Huawei DPA (SG): 26.797 / 0 · Türkiye gizlilik rehberi (PDF metni): 84.217
- Alibaba DPA: 23.827 / 0 · Postmark 104.060 / 0 · Brevo 153.335 / 0 · Twilio 63.865 / 0 ·
  Datadog 29.462 / 0 · SmartBear 38.086 / 0 · Atlassian 38.970 / 0 · HubSpot 59.196 / 0 ·
  Stripe 31.894 / 0
- Oracle PDF'leri WebFetch'e 403 döndü; tarayıcıda açılıp metin akışları sayfa içinde çözüldü.
  Türkçe metinde bazı harfler (İ, ğ, Ö) "?" olarak çıktı; alıntılardaki bu harfler okunarak
  tamamlandı (Kurul metniyle karşılaştırma yapılmadı). Ek F taraf bloğunun sütunları metin
  koordinatlarından çıkarıldı; PDF görüntüleyicide sayfa çizilemedi.
- Fiyatlar: AWS için `b0.p.awsstatic.com` fiyat verisi (ec2, ebs, s3; "Turkey (Istanbul)" anahtarı);
  Huawei için fiyat hesaplayıcı arayüzü + `res-static.hc-cdn.cn/pricecalculator` verisi.

## Öneri (bilgi, görüş değil)

Bu bir bilgi derlemesi; hangi yolun hukuken yeterli olduğu bir hukukçunun, hangisinin seçileceği
İşleticinin kararıdır. Her sağlayıcı için üç yol: **(a)** SS-2 imzalat, **(b)** Türkiye'de
barındırılan eşdeğere geç, **(c)** kaldır ya da kişisel veri akmayacak hale getir.

| Sağlayıcı | (a) SS-2 | (b) Türkiye'deki eşdeğer ve aylık maliyet | (c) Kaldır / etkisizleştir | Gerçekçilik sırası |
|---|---|---|---|---|
| **Hetzner** (sunucu, Postgres, yedek, kapaklar) | **Yayımlı yol yok; büyük olasılıkla kapalı (Çıkarım).** SSS bireysel DPA imzalamadığını söylüyor; SS-2'yi adıyla anmıyor [HZ2]. Tek kapı `data-protection@hetzner.com` adresine yazılı soru | VPS: **ilkbyte Cloud II $10.99/ay** (KDV belgede yok) ya da **Radore Disk-Advance $17/ay** (KDV hariç). Depolama: **DT Cloud Object Storage $0.04/GB** ya da ikinci sağlayıcıda Garage'lı küçük VPS **$4.49–$8.5/ay** [NI5][RD1][DT1] | Mümkün değil; sistemin kendisi | **b**, ondan önce bedelsiz olduğu için a'nın yazılı sorusu |
| **Resend** (giriş ve hesap e-postaları) | **Kapalı, yayımlı ve KVKK adıyla** [RS2] | Türk hosting posta kutusu SMTP'si **$2.99/ay** ("en düşük aylık birim fiyat" $0.99; KDV hariç; uygulama gönderimine izin teyit edilmeli) [TH2]; Euromsg Express **₺520 + KDV/ay** (veri konumu belgede yok) [EM1]; kendi SMTP sunucun ek ücretsiz (teslim edilebilirlik ve port 25 riski) | E-posta kodu giriş yöntemi olduğu sürece kaldırılamaz; yalnızca Google ile giriş bir ürün değişikliği | **b** |
| **Sentry** (hata raporları) | **Kapalı** (Enterprise dışı), yayımlı [SN2] | Aynı sunucuda **GlitchTip**, ek ücret yok (256–512 MB RAM); replay ve release health gider. Bugsink yalnızca hata [GT1][BS1] | SDK'yı kaldırmak; ya da kalıp IP saklamayı kapatmak + `$user.geo.**` kuralı + RN'de `setUser({ ip_address: '0.0.0.0' })` + replay'i kapatmak. İkincisi saklananı azaltır, isteğin Sentry'ye ulaşmasını değil; nitelendirme **belirsiz** [SN6][SN8] | **b** (GlitchTip) ≈ **c** (kaldırmak) > c (azaltmak) > a |
| **Expo EAS Update** (OTA) | **Yayımlı yol yok;** DPA yalnızca Enterprise [EX4] | Kendi expo-updates sunucun: resmî örnek "simplified demonstration", SDK 54'te kalmış; yazıp işletmek gerekir [EX7] | **OTA'yı kapat:** `updates.enabled: false` ile yeni native build; ek ücret yok. Bedel: JS düzeltmesi için yeni APK. Eski kurulumlar güncellenene kadar `u.expo.dev`'e istek atar [EX6] | **c** > b > a |
| **Cloudflare Email Routing** (iletişim adresi) | **Yayımlı yol yok** [CF1] | Türkiye'de posta kutusu: **XMail Kurumsal 1 $2.99/ay** ("en düşük aylık birim fiyat" $0.99; KDV hariç) [TH2][NT2] | İletişim adresi başvuru kanalı olduğu için kaldırılamaz | **b** |

**Okuma notları**

- **Çekirdek veri için taşınmadan uyum yolu belgelenmiş değil.** Hetzner yazılı soruya olumlu yanıt
  vermezse, "imzalayan" alternatifler de (Google Cloud Ek 3, Oracle Ek F) başka bir yabancı buluta
  taşınmak demek ve ikisinde de kabul akışı doğrulanmamış. Yani Library ve Account verisi için
  belgelenen her uyumlu yol bir taşıma içeriyor; en az değişiklik isteyeni Türk VPS'e geri yükleme
  (bölüm 6: yaklaşık 30–60 dakikalık pencere, 1–2 iş günü hazırlık, ölçülmedi).
- **Sıra önemli.** GlitchTip, kendi SMTP sunucun ya da kendi OTA sunucun Hetzner'deki makinede
  çalıştığı sürece veri yine Almanya'da; bunlar sağlayıcı sayısını beşten bire indirir, aktarımı
  bitirmez. Aktarım ancak sunucu Türkiye'ye geçince biter.
- **Sunucuya dokunmadan yapılabilenler:** OTA'yı bir sonraki native build'de kapatmak; iletişim
  adresini Türkiye'deki bir posta kutusuna almak; giriş e-postalarını Türkiye'de saklandığı yazılı
  bir SMTP'ye almak; Sentry SDK'sını kaldırmak ya da veriyi azaltmak.
- **Yazılı teyit bekleyenler:** Türk VPS adaylarında port 25, PTR, root, snapshot ve veri işleyen
  sözleşmesi; DT Cloud ve Narbulut'ta S3 uç noktası; XMail'de uygulama gönderimi. Bunlar sipariş
  öncesi sorularıdır; bu belgede hiçbiri sorulmadı.

**Aylık maliyet tahmini** (liste fiyatları; kur çevrilmedi; KDV notları sayfadaki gibi)

| Kurulum | Kalemler | Aylık toplam |
|---|---|---|
| **Bugün** | Hetzner CX23 € 5.99 + Object Storage € 6.49 (ikisi de "excl. VAT") [HZ3][HZ4]. Resend, Sentry, Expo ve Cloudflare Email Routing için plan kademesi depoda yazmıyor; ücretsiz kademeler **varsayıldı** | **≈ € 12.48** + KDV |
| **Her şey Türkiye'de, en ucuz** | ilkbyte Cloud II $10.99 + DT Cloud S3 (birkaç GB, **Çıkarım:** $1'ın altı; asgari ücret belgede yok) + XMail Kurumsal 1 $2.99 (iletişim kutusu ve SMTP göndericisi tek hesapta; ayrı gönderen adresi için takma ad desteği belgede yok) + GlitchTip $0 + OTA kapalı $0 | **≈ $14–15** (KDV durumu kalemden kaleme farklı ya da belgede yok) |
| **Her şey Türkiye'de, temkinli** | Radore Disk-Advance $17 + yedek ve kapaklar için ilkbyte Cloud I'de Garage $4.49 + XMail Kurumsal 5 $13.19 (ayrı gönderim ve iletişim hesapları) + GlitchTip $0 + OTA kapalı $0 | **≈ $34.7**; XMail'in "en düşük aylık birim fiyatı" $4.45 ile ≈ $25.9 |
| Yukarıdakilerde SMTP yerine Euromsg Express | + ₺520 + KDV (veri konumu teyit edilmeden "Türkiye'de" sayılamaz) | + **₺520** + KDV |
| Türkiye'de hiper ölçekli, yönetilen Postgres (Huawei TR-Istanbul) | ECS t6.large.2 + 40 GB disk + EIP USD 69.77 + RDS PG 2 vCPU / 4 GB + 40 GB USD 54.91 [HW2]; OBS ayrı | **≈ USD 124.7**, vergi hariç; sözleşme tarafı yurt dışında, SS-2 sorusu sürüyor |
| AWS İstanbul Local Zone | c7i.large ≈ $78.1 (**Çıkarım**, 730 saat) + gp3 40 GB ≈ $5.5 [AWS4]; S3, IPv4 ve çıkış trafiği ayrı | **≈ $83.6+**, vergi hariç; SS-2 belgede yok, kontrol düzlemi Frankfurt'ta |

- Bugünkü toplam ≈ € 12.48, Türkiye'deki en ucuz kurulum ≈ $14–15; iki para birimi birbirine
  çevrilmedi. **Çıkarım:** fark aylık birkaç birim düzeyinde; asıl bedel para değil, belgesiz
  altyapı ve bir kerelik taşıma işi.
- Toplamlar tahmindir: KDV, asgari ücretler ve kampanya süreleri çoğu sayfada eksik.

## Açık sorular

1. **Hetzner:** DPA §13.4 yazılı değişikliğe izin veriyor, SSS bireysel sözleşmeyi reddediyor; SS-2
   gibi düzenleyicinin zorunlu kıldığı bir metin için istisna yapılıyor mu? Yalnızca yazılı soruyla
   öğrenilir [HZ1][HZ2].
2. **Resend ve Sentry Enterprise:** Ret cümleleri self-servis planlar için; Enterprise'ta SS-2'nin
   **değiştirilmeden** imzalanacağına dair ifade yok, fiyat yayımlı değil [RS2][SN2].
3. **Oracle Ek F:** Fiilen nasıl imzalanıyor, bildirimi kim yapıyor, veri alıcısı sütunundaki
   İstanbul adresi kimin, yurt dışı bölgede **saklamayı** kapsıyor mu, bireysel müşteri kapsamda mı,
   ekin güncel sürümü hangisi? Metin Kurul'un SS-2'siyle satır satır karşılaştırılmadı [OR1][OR2].
4. **Google Cloud:** Türkiye faturalama adresli (özellikle Individual) hesapta "Turkish SCCs"
   gerçekten sunuluyor mu, nerede? Yayımlı akış hâlâ yok [GC1][GC5].
5. **Huawei TR-Istanbul:** Sözleşme tarafının yurt dışında (Hong Kong mu Singapur mu, o da belirsiz)
   ve hesap verisinin Singapur'da olması m.9 bakımından ne anlama geliyor? TL ile ödeme ve OBS'nin
   S3 uyumu doğrulanmadı [HW3][HW4][HW9].
6. **AWS İstanbul Local Zone:** Kontrol düzleminin ve directory bucket kova işlemlerinin
   Frankfurt'ta olması aktarım mı? Directory bucket Coolify'ın `mc` yedeğiyle çalışır mı? Genel
   IPv4 ve çıkış trafiği fiyatı okunmadı [AWS5].
7. **DT Cloud:** S3 uç noktası, imza sürümü, `mc` uyumu, asgari ön ödeme, çıkış ücreti? Veri işleyen
   sözleşmesi veriyorlar mı; şartlardaki "veri merkezini değiştirme hakkı" Türkiye dışını kapsıyor
   mu? Light Compute hangi bölgede, IPv4 dahil mi, Ubuntu 24.04 var mı [DT3][DT4]?
8. **Narbulut NOSS:** Bireysel müşteri iş ortağı olmadan alabiliyor mu, fiyat KDV dahil mi, ikinci
   yedek lokasyonu neresi, uç nokta ne [NB1][NB2]?
9. **Netinternet / ilkbyte:** Sözleşme PDF'inin içeriği ve KVKK sayfasındaki doldurulmamış yer
   tutucuların nihai değerleri; sözleşme ilkbyte.com'dan alınan sunucuyu kapsıyor mu; hipervizör,
   Ubuntu 24.04, snapshot/yedek fiyatı, KDV [NI2][NI3]?
10. **Radore:** Root/sudo SSH, snapshot, IPv4 dahil mi; veri işleyen sözleşmesi imzalıyor mu?
    (2026-10-29'daki sorular açık kaldı.)
11. **Port 25 ve PTR:** Hiçbir Türk VPS sağlayıcısında yazılı değil. Kendi SMTP sunucusu
    düşünülüyorsa her adaydan yazılı yanıt gerekir.
12. **XMail Kurumsal (Turhost/Natro):** Uygulamadan SMTP ile otomatik ileti göndermeye izin var mı;
    giden posta yurt dışındaki bir aktarım servisinden geçiyor mu; veri işleyen sözleşmesi var mı
    [TH2][NT2]?
13. **Euromsg Express:** E-posta verisi hangi ülkede işleniyor, alt işleyenler kim? Önceki belgeden
    beri açık; bugün okunan altı sayfanın hiçbirinde yazmıyor [EM3][EM4].
14. **Coolify + Garage / DT Cloud S3 / NOSS:** Üçü de Coolify'ın destekli listesinde değil;
    "Validate Connection" ve `mc cp` ile prototip şart [S3-1].
15. **Expo:** EAS Update isteklerinde son kullanıcı IP'si log'lanıyor ve saklanıyor mu, ne kadar
    süre? Enterprise dışı müşteriye DPA veriliyor mu [EX1][EX4]?
16. **Sentry:** "Prevent Storing of IP Addresses" ayarının güncel adı ve replay/log verisine
    uygulanıp uygulanmadığı panelden doğrulanmalı [SN6].
17. **GlitchTip 7.0 + `@sentry/node` 11:** Span streaming, `enableLogs` ve güncel
    `@sentry/react-native` yükleri kabul ediliyor mu? Bugsink'in asgari RAM'i ve React Native
    native çökme desteği okunmadı [GT1][GT2][BS1].
18. **Cloudflare:** Email Routing'de yönlendirilen iletinin içeriği saklanıyor mu, hangi ülkede
    işleniyor [CF4]? Alan adının DNS'inin Cloudflare'de kalması ayrı bir alıcı doğurur mu?
19. **Okunamayanlar:** Sinch (Mailgun/Mailjet) ve Rollbar DPA'ları; Salesforce, Zendesk, Zoom
    DPA'ları açılmadı; Türk Telekom birim fiyatları; Turkcell nDepo'nun güncel durumu; Türk Telekom'un
    e-posta ürünleri; KoçSistem ve diğer küçük sağlayıcılar.

## Kaynaklar

Depo (yerel okuma, 2026-11-15)
- `compose.yaml`, `infra/postgres/Dockerfile`, `infra/postgres/initdb/10-homelibra-roles.sh`
- `scripts/setup-beta-infra.sh`, `scripts/deploy-beta.sh` (üretim kurulumu ve geri yükleme tatbikatı)
- `apps/api/src/env.ts`, `apps/api/src/storage/s3.ts`, `apps/api/src/mail/mailer.ts`, `apps/api/src/instrument.ts`
- `apps/app/src/lib/sentry.ts`, `apps/app/app.json`, `apps/app/eas.json`
- `docs/adr/0006-own-typescript-api-on-self-hosted-postgres.md`, `docs/adr/0009-global-providers-kvkk-transfer-risk-accepted.md`, `docs/adr/0011-covers-in-object-storage-without-backup.md`

KVKK (`kvkk-obligations.md`'den devralındı; bu turda yeniden okunmadı)
- [KV1] 6698 sayılı Kanun, güncel metin: https://www.mevzuat.gov.tr/MevzuatMetin/1.5.6698.pdf
- [KV2] KVKK, Standart Sözleşmeler (SS-2 dahil 4 tip): https://www.kvkk.gov.tr/Icerik/7929/Standart-Sozlesmeler
- [KV3] KVKK, Standart Sözleşmelerde Dikkat Edilmesi Gereken Hususlar (05.02.2025): https://www.kvkk.gov.tr/Icerik/8170/Yurt-Disina-Kisisel-Veri-Aktariminda-Kullanilacak-Standart-Sozlesmelerde-Dikkat-Edilmesi-Gereken-Hususlara-Iliskin-Kamuoyu-Duyurusu

Hetzner fiyatları
- [HZ3] Hetzner Cloud, Cost-Optimized (CX23 "€ 5.99 per month, excl. VAT"; "Price incl. IPv4"; sayfa bugün "CX23 not available" gösteriyor): https://www.hetzner.com/cloud/cost-optimized/
- [HZ4] Hetzner Object Storage ("€ 6.49 per month, excl. VAT"; 1 TB depolama + 1 TB çıkış dahil; özet): https://www.hetzner.com/storage/object-storage/

Türkiye'den e-posta ve posta kutusu
- [EM1] Euromsg Express, Fiyatlar: https://www.euromsgexpress.com/fiyatlar/
- [EM2] Euromsg Express, Transactional Email Servisi: https://www.euromsgexpress.com/transactional-email-servisi/
- [EM3] Euromsg Express, Kullanım Koşulları (m.11.6–11.7; tarih yok): https://www.euromsgexpress.com/kullanim-kosullari/
- [EM4] Euromsg Express, Gizlilik politikası: https://www.euromsgexpress.com/gizlilik-politikasi/ — Hakkımızda: https://www.euromsgexpress.com/hakkimizda/ — Anti-Spam Politikası: https://www.euromsgexpress.com/anti-spam-politikasi/ — alt bilgideki "KVKK" bağlantısının hedefi: https://www.relateddigital.com/tr/e-kitap/15-soruda-kvkk-ekitabi/
- [IB1] INBOX, Transactional Email (INBOXNotify): https://useinbox.com/transactional-emails-service
- [IB2] INBOX, Data Processing Addendum: https://useinbox.com/legal/data-processing-agreement
- [IB3] INBOX, Security ("data centers around the Canada"): https://useinbox.com/security
- [SL1] Sendloop (özet): https://sendloop.com/
- [TH2] Turhost, Kurumsal E-Posta (XMail; fiyatlar, Türkiye lokasyon, gönderim sınırı SSS'si): https://www.turhost.com/mail/kurumsal-mail-hosting/
- [NT2] Natro, XMail Kurumsal E-Posta: https://www.natro.com/hosting/mail-hosting/kurumsal-eposta
- [OH1] OwnHost, Local Email (özet): https://www.ownhost.net/en/local-email
- [TC2] Turkcell Kurumsal, Mailim (kapanış duyurusu): https://www.turkcell.com.tr/kurumsal/dijital-is-servisleri/is-uygulamalari/mailim
- [GM1] Google, Email sender guidelines (özet): https://support.google.com/a/answer/81126?hl=en
- [OL1] Microsoft Tech Community, "Strengthening Email Ecosystem: Outlook's New Requirements for High-Volume Senders" (2 Nis 2025, güncelleme 30 Nis 2025; özet): https://techcommunity.microsoft.com/blog/outlook/strengthening-email-security-outlook-new-requirements-for-high-volume-senders/4399730
- [OL2] Outlook.com Postmaster, Policies, Practices, and Guidelines (özet): https://substrate.office.com/ip-domain-management-snds/postmaster/Policies

Hetzner
- [HZ1] Hetzner DPA (English), Version 1.1, February 10, 2025; Appendix 2 TOMs 1.2 (February 17, 2026); Appendix 3 Subcontractors 1.0 (August 08, 2024): https://www.hetzner.com/AV/DPA_en.pdf
- [HZ2] Hetzner Docs, "Data Protection at Hetzner" (Last change on 2026-07-20): https://docs.hetzner.com/general/company-and-policy/data-protection-at-hetzner/

Resend
- [RS1] Data Processing Addendum (Last update: December 31st, 2025): https://resend.com/legal/dpa
- [RS2] GDPR (SSS: ülkeye özgü DPA, veri konumu, saklama, Enterprise): https://resend.com/security/gdpr
- [RS3] Choosing a Region (Data Residency): https://resend.com/docs/dashboard/domains/regions
- [RS4] Subprocessors (Last update: November 5th, 2026): https://resend.com/legal/subprocessors

Sentry
- [SN1] Data Processing Addendum 5.1.0 (May 29, 2024): https://sentry.io/legal/dpa/
- [SN2] Help Center, "Can we propose changes to Sentry's DPA or execute standard contractual clauses not included in the DPA?": https://www.sentry.help/en/articles/17590170-can-we-propose-changes-to-sentry-s-dpa-or-execute-standard-contractual-clauses-not-included-in-the-dpa
- [SN3] Help Center, "How do I sign your Data Processing Addendum?": https://www.sentry.help/en/articles/13965008-how-do-i-sign-your-data-processing-addendum
- [SN4] Data Storage Location (US or EU): https://docs.sentry.io/organization/data-storage-location/
- [SN5] Subprocessors 2.3.0 (June 1, 2026): https://sentry.io/legal/subprocessors/
- [SN6] Server-Side Data Scrubbing: https://docs.sentry.io/security-legal-pii/scrubbing/server-side-scrubbing/
- [SN7] Node.js, Data Collected (`dataCollection`): https://docs.sentry.io/platforms/javascript/guides/node/data-management/data-collected/
- [SN8] React Native, Data Collected (`sendDefaultPii`, IP): https://docs.sentry.io/platforms/react-native/data-management/data-collected/
- [SN9] Data Scrubbing (Advanced Data Scrubbing özeti): https://docs.sentry.io/security-legal-pii/scrubbing/

Expo
- [EX1] Privacy of the Expo Platform and Expo Services Explained (Last updated November 2nd, 2026): https://expo.dev/privacy-explained
- [EX2] Privacy Policy (Last updated November 10th 2026): https://expo.dev/privacy
- [EX3] Terms of Service (Last updated and effective November 2, 2026): https://expo.dev/terms
- [EX4] Trust Center: https://expo.dev/trust
- [EX5] Expo Updates v1 (modificationDate August 12, 2026): https://docs.expo.dev/technical-specs/expo-updates-1/
- [EX6] expo-updates referansı (Configuration tablosu, `checkAutomatically`, URL override): https://docs.expo.dev/versions/latest/sdk/updates/
- [EX7] expo/custom-expo-updates-server (son commit 2025-09-17; GitHub API ile okundu): https://github.com/expo/custom-expo-updates-server
- [EX8] `expo.dev/dpa` (HTTP 404, 2026-11-15): https://expo.dev/dpa
- [EX9] Security & compliance: https://expo.dev/security
- [EX10] expo/expo `sdk-58`, `packages/expo-updates/android/.../loader/FileDownloader.kt` (istek başlıkları; GitHub API ile okundu): https://github.com/expo/expo/blob/sdk-58/packages/expo-updates/android/src/main/java/expo/modules/updates/loader/FileDownloader.kt

Cloudflare
- [CF1] Cloudflare Data Processing Addendum, Version 6.4, effective April 3, 2026: https://www.cloudflare.com/cloudflare-customer-dpa/
- [CF2] GDPR FAQs (Self-Service Agreements sorusu): https://www.cloudflare.com/trust-hub/gdpr/
- [CF3] Self-Serve Subscription Agreement (Last Updated September 12, 2025): https://www.cloudflare.com/terms/
- [CF4] Cloudflare Email Service belgeleri, tam metin (Activity log sayfası "Last updated Oct 15, 2026"): https://developers.cloudflare.com/email-service/llms-full.txt — Activity log: https://developers.cloudflare.com/email-service/observability/logs/

GlitchTip
- [GT1] Installation Guide (System Requirements, Docker Compose): https://glitchtip.com/documentation/install
- [GT2] Logs: https://glitchtip.com/documentation/logs
- [GT3] Performance Monitoring: https://glitchtip.com/documentation/performance
- [GT4] React-Native SDK: https://glitchtip.com/sdkdocs/react-native
- [GT5] General SDK setup: https://glitchtip.com/sdkdocs/all-sdks
- [GT6] Blog (GlitchTip 7.0 released, November 9, 2026; 6.1 Logs, March 23, 2026): https://glitchtip.com/blog
- [GT7] glitchtip-backend LICENSE (MIT License, Copyright (c) 2019 GlitchTip): https://gitlab.com/glitchtip/glitchtip-backend/-/raw/master/LICENSE

Bugsink
- [BS1] SDK Recommendations: https://www.bugsink.com/docs/sdk-recommendations/
- [BS2] Installation overview (belge dizini: Sourcemaps, Docker, PostgreSQL): https://www.bugsink.com/docs/installation/
- [BS3] Self-Hosted Error Tracking: https://www.bugsink.com/self-hosted/
- [BS4] bugsink/bugsink (LICENSE: PolyForm Shield 1.0.0; release 2.6.3, 2026-11-06; GitHub API ile okundu): https://github.com/bugsink/bugsink

Google
- [GC1] Cloud Data Processing Addendum (Customers), Appendix 3 "Turkey" (Last modified October 30, 2026): https://cloud.google.com/terms/data-processing-addendum/
- [GC2] Privacy compliance and records for Google Workspace and Cloud Identity (Last updated August 10, 2026): https://knowledge.workspace.google.com/admin/compliance/privacy-compliance-and-records-for-google-workspace-and-cloud-identity
- [GC3] Google Cloud Standard Contractual Clauses dizini: https://cloud.google.com/terms/sccs
- [GC4] Google Cloud compliance offerings: https://cloud.google.com/security/compliance/offerings
- [GC5] Cloud Billing, Taxes in your country: https://docs.cloud.google.com/billing/docs/resources/vat-overview

Microsoft
- [MS1] Microsoft Products and Services DPA (WW, English, Last updated November 1, 2026, DOCX): https://www.microsoft.com/licensing/docs/documents/download/MicrosoftProductandServicesDPA(WW)(English)(November_2026)(CR).docx
- [MS2] DPA sürüm ve dil listesi: https://www.microsoft.com/licensing/docs/view/Microsoft-Products-and-Services-Data-Protection-Addendum-DPA
- [MS3] List of Azure regions (Last updated on 10/13/2026): https://learn.microsoft.com/en-us/azure/reliability/regions-list
- [MS4] Microsoft Q&A, SS-2 imza süreci (topluluk yanıtı; önceki belgeden): https://learn.microsoft.com/en-us/answers/questions/6003165/execution-process-for-turkish-kvkk-article-9-ss-2
- [MS5] Microsoft Q&A, "Standard Contract with Microsoft Azure Turkey ..." (10 Kas 2025; yalnızca "AI answer"): https://learn.microsoft.com/en-us/answers/questions/5615914/standard-contract-with-microsoft-azure-turkey-with

AWS
- [AWS1] AWS Data Processing Addendum (PDF): https://d1.awsstatic.com/legal/aws-dpa/aws-dpa.pdf
- [AWS2] AWS Turkey SoR FAQ: https://aws.amazon.com/legal/awstr/
- [AWS3] AWS Local Zones features (hizmet tablosu, İstanbul satırı): https://aws.amazon.com/about-aws/global-infrastructure/localzones/features/
- [AWS4] AWS fiyat verisi (yayım 2026-11-14): EC2 https://b0.p.awsstatic.com/pricing/2.0/meteredUnitMaps/ec2/USD/current/ec2-ondemand-without-sec-sel/Turkey%20(Istanbul)/Linux/index.json · EBS https://b0.p.awsstatic.com/pricing/2.0/meteredUnitMaps/ec2/USD/current/ebs.json · S3 https://b0.p.awsstatic.com/pricing/2.0/meteredUnitMaps/s3/USD/current/s3.json
- [AWS5] Amazon S3, Data residency workloads / Concepts for directory buckets in Local Zones: https://docs.aws.amazon.com/AmazonS3/latest/userguide/directory-bucket-data-residency.html · https://docs.aws.amazon.com/AmazonS3/latest/userguide/s3-lzs-for-directory-buckets.html
- [AWS6] AWS Service Terms (Last Updated: November 5, 2026; WebFetch ile, dört parça): https://aws.amazon.com/service-terms/

Oracle
- [OR1] Data Transfer and Additional Jurisdiction Specific Terms Annex to the Data Processing Agreement (Version 14 August 2025): https://www.oracle.com/contracts/docs/data-transfer-annex-v060225.pdf
- [OR2] Exhibits to Data Transfer Annex (Exhibit F: Turkish Standard Contractual Clauses, Controller to Processor): https://www.oracle.com/contracts/docs/exhibits-to-data-transfer-annex-v060225.pdf
- [OR3] Data Processing Agreement for Oracle Services (Version 14 August 2025): https://www.oracle.com/contracts/docs/data-processing-agreement-oracle-services-081425.pdf
- [OR4] OCI Regions and Availability Domains (Updated 2026-06-22): https://docs.oracle.com/en-us/iaas/Content/General/Concepts/regions.htm
- [OR5] Oracle Cloud Services contracts (seçici; liste okunamadı): https://www.oracle.com/contracts/cloud-services/
- [OR6] Oracle Cloud Price List: https://www.oracle.com/cloud/price-list/

Huawei Cloud
- [HW1] API Explorer, Regions and Endpoints (`tr-west-1`): https://console-intl.huaweicloud.com/apiexplorer/#/endpoint/RDS
- [HW2] Price Calculator (RDS, ECS, OBS; bölge TR-Istanbul): https://www.huaweicloud.com/intl/en-us/pricing/calculator.html#/rds
- [HW3] Huawei Cloud Customer Agreement (Last Updated: December 29, 2025): https://www.huaweicloud.com/intl/en-us/declaration/sa_cua.html — Türkçe çeviri (11 Temmuz 2022): https://www.huaweicloud.com/intl/tr-tr/declaration/sa_cua.html
- [HW4] Huawei Cloud Privacy Statement (Last Updated: January 21, 2025): https://www.huaweicloud.com/intl/en-us/declaration/sa_prp.html
- [HW5] Huawei Cloud Türkiye Privacy Compliance Instruction (Version 1.0, 2024-12-2): https://res-static.hc-cdn.cn/cloudbu-site/intl/en-us/TrustCenter/WhitePaper/privacy/T%C3%BCrkiye_Privacy_Instruction_intl_en.pdf — rehber sayfası: https://www.huaweicloud.com/intl/en-us/securecenter/compliance/compliance-center/tr.html
- [HW6] Huawei Cloud Data Processing Addendum (Singapur sürümü): https://www.huaweicloud.com/intl/en-us/declaration-sg/sa_dpa.html
- [HW7] OBS SSS, V4 imzası (Çince; yalnızca arama özeti): https://support.huaweicloud.com/obs_faq/obs_faq_0274.html
- [HW8] ECS General Computing-Basic (T6) ve CPU Credits (yalnızca arama özeti): https://support.huaweicloud.com/intl/en-us/productdesc-ecs/ecs_01_0024.html · https://support.huaweicloud.com/intl/en-us/productdesc-ecs/ecs_01_0061.html
- [HW9] Huawei Cloud Customer Agreement, `declaration-sg` ağacı ve "Contracting Party" tablosu: https://www.huaweicloud.com/intl/en-us/declaration-sg/sa_cua.html · https://www.huaweicloud.com/intl/en-us/declaration-sg/sa-cua-cp.html

Alibaba Cloud
- [AL1] Alibaba Cloud Global Locations: https://www.alibabacloud.com/en/global-locations
- [AL2] Alibaba Cloud Data Processing Addendum (Updated: April 1, 2026): https://terms.alicdn.com/legal-agreement/terms/common_platform_service/20260328095829803/20260328095829803.html

E-posta sağlayıcıları
- [EP1] Postmark DPA (Effective November 17, 2025): https://postmarkapp.com/dpa
- [EP2] Brevo Terms of Service (Version October 1st, 2025): https://www.brevo.com/legal/termsofuse/
- [EP3] Twilio Data Protection Addendum (Last Updated: April 9, 2026): https://www.twilio.com/en-us/legal/data-protection-addendum
- [EP4] Mailgun DPA (eski sürüme yönleniyor): https://www.mailgun.com/legal/dpa/
- [EP5] Sinch Data Processing Agreement (403, okunamadı): https://sinch.com/legal/terms-and-conditions/other-sinch-terms-conditions/data-processing-agreement/

Hata izleyiciler
- [ET1] Datadog Data Processing Addendum: https://www.datadoghq.com/legal/data-processing-addendum/
- [ET2] SmartBear Data Processing Addendum: https://smartbear.com/legal/data-processing-addendum/
- [ET3] Rollbar (404): https://docs.rollbar.com/docs/dpa · https://rollbar.com/dpa/

Diğer SaaS
- [XS1] Atlassian DPA (Effective starting: August 17, 2026): https://www.atlassian.com/legal/data-processing-addendum
- [XS2] HubSpot DPA (Last Modified: September 16, 2026): https://legal.hubspot.com/dpa
- [XS3] Stripe DPA (Last updated: September 28, 2026): https://stripe.com/legal/dpa

DT Cloud
- [DT1] Pricing: https://dtcloudnow.com/en/pricing/
- [DT2] Object Storage ürün sayfası: https://dtcloudnow.com/en/products/object-storage/
- [DT3] Terms and Conditions (DT İletişim Hizmetleri A.Ş.): https://dtcloudnow.com/en/terms-and-conditions/
- [DT4] Docs, Accessing S3 Buckets: https://docs.dtcloudnow.com/en/s3/accessing-s3-buckets/intro/ — kullanıcı paneli (uç nokta "API information" sekmesinde): https://docs.dtcloudnow.com/en/s3/accessing-s3-buckets/managing-buckect-s3user-panel/ — S3 giriş: https://docs.dtcloudnow.com/en/s3/intro/
- [DT5] Light Compute ürün sayfası: https://dtcloudnow.com/en/products/light-compute-vps/ — belge: https://docs.dtcloudnow.com/en/light-compute/how-to-start/
- [DT6] Cloud Pricing Calculator ("Excluding VAT"): https://dtcloudnow.com/en/cloud-pricing-calculator/
- [DT7] Welcome ve About Us (özet; "data centers located in Türkiye", konsol bağlantısı, sertifikalar): http://dtcloudnow.com/en/welcome/ · https://dtcloudnow.com/en/about-us/

Narbulut
- [NB1] NOSS ürün sayfası, hesaplayıcı ve SSS: https://narbulut.com/narbulut-object-storage-service-noss-s3/
- [NB2] Nasıl Satın Alınır: https://narbulut.com/narbulut-nasil-satin-alinir/
- [NB3] Veeam – NOSS S3 rehberi: https://narbulut.com/en/veeam-narbulut-noss-s3-backup-guide/

DorukNet, Bulutistan, Teletek, Türk Telekom, Turkcell, PlusClouds
- [DK1] DorukNet S3 Depolama: https://doruk.net.tr/s3-depolama
- [DK2] DorukCloud Bulut Sunucu: https://www.dorukcloud.com/bulut-sunucu
- [DK3] DorukNet ana sayfa (veri merkezleri): https://www.doruk.net.tr/
- [BI1] Bulutistan Storage as a Service: https://bulutistan.com/storage-as-a-service
- [BI2] Bulutistan VPS: https://bulutistan.com/vps-server
- [TK1] Teletek Object Based Storage (S3): https://www.teletek.net.tr/en/solutions/object-based-storage-s3
- [TT1] Türk Telekom Bulut, Ürünler: https://turktelekombulut.com/urunler
- [TT2] Türk Telekom Bulut, Nesne Tabanlı Depolama: https://turktelekombulut.com/urunler/nesne-tabanli-depolama
- [TT3] Türk Telekom Bulut, Sanal Veri Merkezi: https://turktelekombulut.com/urunler/sanal-veri-merkezi
- [TC1] Turkcell nDepo (2026-10-29 okuması): https://www.turkcell.com.tr/kurumsal/dijital-is-servisleri/bulut-servisleri/turkcell-ndepo
- [PC1] PlusClouds storage: https://plusclouds.com/cloud/storage

Radore, Turhost, Natro
- [RD1] Radore Cloud Server: https://radore.com/tr/hizmetler/bulut-sunucu
- [RD2] Radore KVKK Uyumlu Sunucu ve Bulut: https://radore.com/tr/hizmetler/kvkk-uyumlu-sunucu-bulut
- [RD3] Radore Veri Merkezi: https://radore.com/tr/data-center
- [RD4] Radore IPv4 / IP Adresi Kiralama: https://radore.com/tr/hizmetler/ip-adresi-kiralama
- [TH1] Turhost VPS TR: https://www.turhost.com/sunucu/vps-tr-sunucu/
- [NT1] Natro XCloud TR: https://www.natro.com/sunucu-kiralama/vps-tr-sunucu

Netinternet / ilkbyte
- [NI1] Netinternet SSD VDS: https://www.netinternet.tr/ssd-vds-sanal-sunucu
- [NI2] Netinternet KVKK Veri İşleme ve Gizlilik Şartları: https://www.netinternet.tr/altyapimiz/kvkk-veri-isleme-ve-gizlilik-sartlari
- [NI3] Tedarikçi Gizlilik ve KVK Sözleşmesi (PDF; içeriği okunmadı): https://kova1.ni.net.tr/pdf/Netinternet_Tedarikci_Gizlilik_ve_KVK_Sozlesmesi.pdf
- [NI4] Netinternet Ağ Politikalarımız: https://www.netinternet.tr/altyapimiz/ag-politikalarimiz
- [NI5] ilkbyte Cloud sunucu paketleri: https://www.ilkbyte.com/kiralik-sunucu-paketlerimiz/cloud-sunucu
- [NI6] ilkbyte Özellikler: https://www.ilkbyte.com/ozellikler
- [NI7] ilkbyte İşletim Sistemleri: https://www.ilkbyte.com/isletim-sistemleri
- [NI8] ilkbyte ISO'dan Kurulum: https://www.ilkbyte.com/ozellikler/isodan-kurulum

Veridyen, Hosting.com.tr, Vargonen
- [VD1] Veridyen Gold Bulut Sunucu: https://www.veridyen.com/sunucu/bulut-sunucu
- [VD2] Veridyen KVKK Veri İşleme ve Gizlilik Şartları: https://www.veridyen.com/kurumsal/kvkk-veri-isleme-ve-gizlilik-sartlari
- [VD3] Veridyen Genel Hizmet Şartları: https://www.veridyen.com/kurumsal/genel-hizmet-sartlari
- [VD4] Veridyen Tedarikçi Gizlilik ve KVKK Sözleşmesi: https://www.veridyen.com/kurumsal/tedarikci-gizlilik-ve-kvkk-sozlesmesi
- [HC1] Hosting.com.tr VDS Server: https://www.hosting.com.tr/server/vds-server/
- [VG1] EclitGO (vargonen.com buraya yönleniyor): https://eclitgo.eclit.com/

Nesne depolama yazılımı ve Coolify
- [S3-1] Coolify S3 Storage Overview: https://coolify.io/docs/core/s3-storage/overview
- [S3-2] Docker Hub `dxflrs/garage` etiketleri (v2.5.0, 2026-10-24): https://hub.docker.com/r/dxflrs/garage/tags
- [S3-3] Garage indirme sayfası: https://garagehq.deuxfleurs.fr/download/
