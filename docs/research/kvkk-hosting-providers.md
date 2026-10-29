# KVKK m.9 kapısından geçen hosting, e-posta ve EAS seçenekleri

> **Bu belge hukuki görüş değildir.** Sağlayıcıların 2026-10-29'da yayımlı sözleşme, bölge ve
> fiyat sayfalarından derlenmiştir. "Belgede yok" ifadesi "sağlayıcı imzalamaz" anlamına gelmez;
> yalnızca yayımlanmış bir taahhüt bulunamadığını söyler.

Tarih: 2026-10-29 · Besler: `kvkk-obligations.md` "Açık sorular" 1–2 ve #15 (teknoloji stack'i) ·
Önceki çalışmalar: `docs/research/kvkk-obligations.md`, `docs/research/backend-auth-options.md`

## Soru

`kvkk-obligations.md` şunu tespit etti: kişisel veriyi Türkiye dışında barındırmak KVKK m.9
anlamında yurt dışına aktarımdır; hiçbir ülke için yeterlilik kararı yok; düzenli barındırma için
açık rıza geçerli dayanak değil; gerçekçi yol Kurul'un **SS-2 (veri sorumlusundan veri işleyene)**
standart sözleşmesinin **değiştirilmeden** iki tarafça imzalanması ve 5 iş günü içinde
bildirilmesi [KV1][KV2][KV3]. Bu yüzden her sağlayıcı için kapı sorusu:

> "SS-2'yi değiştirmeden imzalıyor mu (ya da KVKK standart sözleşme eki yayımlamış mı), yoksa
> veriyi Türkiye'de mi tutuyor?"

Bu belge şu altı alt soruyu yanıtlar:

1. **Supabase:** KVKK/SS-2 beyanı var mı, Türkiye bölgesi var mı; yalnızca Postgres + Auth
   (GoTrue) + PostgREST ile self-host edilebilir mi, resmî belge üretim, güncelleme ve yedek için
   ne diyor?
2. **Google Cloud:** KVKK eki nerede, hangi sürüm, Cloud SQL / Cloud Run'ı kapsıyor mu; Turkcell
   ortaklığıyla duyurulan Türkiye bölgesi bugün açık mı?
3. **AWS, Azure, Cloudflare, Hetzner, DigitalOcean, Vercel, Netlify:** yayımlanmış SS-2 taahhüdü
   ya da Türkiye'de veri saklayan bölge/PoP var mı?
4. **Türkiye'de barındırma:** tek geliştiricinin kullanabileceği VPS veya yönetilen PostgreSQL;
   en güvenilir 2–3 seçenek için yönetilen Postgres, en küçük plan fiyatı, yedek, Postgres sürümü.
5. **İşlem e-postası (magic link):** SES, Postmark, Resend, Brevo, Mailgun, Mailjet'ten biri SS-2
   taahhüdü yayımlıyor mu; Türkiye'de barındırılan, API'li bir sağlayıcı var mı, giriş fiyatı ne?
6. **EAS:** bugünkü Free/Starter/Production fiyatları, EAS Update MAU limitleri, EAS Hosting
   fiyatı ve EAS'ın belgelenmiş veri işleme yeri.

## Yöntem

- Yalnızca birincil kaynaklar okundu: sağlayıcıların DPA/sözleşme metinleri, resmî bölge
  listeleri, fiyat sayfaları ve resmî dokümantasyon; KVKK dayanakları `kvkk-obligations.md`'den
  devralındı ve kvkk.gov.tr URL'leriyle anıldı. Okuma tarihi 2026-10-29.
- DPA'lar tam metin olarak indirildi (HTML, PDF veya DOCX) ve "Turk", "Türkiye", "KVKK", "6698"
  geçen yerler arandı. "Belgede yok" yazan her hücre bu taramanın sonucudur.
- JavaScript ile yüklenen Türk hosting fiyat sayfaları (Radore, Natro, Turhost, Euromsg Express,
  expo.dev/pricing) Claude'un tarayıcı panelinde açılıp metinleri okundu. Fiyatlar o günkü
  kampanya fiyatlarıdır.
- Arama motoru sonuçları yalnızca kaynağa ulaşmak için kullanıldı. Birincil sayfası açılamayan
  iddialar tabloda "belirsiz" diye işaretlendi; bir yerde arama özetine dayanıldıysa bu açıkça
  yazıldı.
- Kur, KDV ve kampanya süreleri sağlayıcının kendi ifadesiyle aktarıldı; TL'ye çevrilmedi.

## Bulgular

### Karşılaştırma tablosu: SS-2 / Türkiye bölgesi

| Sağlayıcı | Yayımlanmış KVKK standart sözleşme taahhüdü | Türkiye'de veri saklayan bölge | Hüküm |
|---|---|---|---|
| **Google Cloud** | **Var, koşullu.** DPA Ek 3 "Turkey": faturalama adresi Türkiye'deyse ve Google "Turkish SCCs" dahil ek koşulları kabule sunarsa bunlar DPA'yı tamamlar; 5 iş günü bildirimi müşteride; DPA Turkish SCC'yi değiştiremez ve SCC'ler önceliklidir [GC1] | **Yok.** Compute ve Cloud SQL bölge listelerinde Türkiye yok [GC4][GC5]; Türkiye bölgesi Kasım 2025'te duyuruldu, açılış tarihi verilmedi [GC6] | Belgelenmiş tek SS-2 yolu; kabul akışı ve SS-2 sürümü belirsiz |
| **Supabase** | **Belgede yok.** DPA v1 (1 Ağu 2026) yalnızca AB SCC (Modül 2/3), UK ve İsviçre eki; diğer ülkeler için AB SCC'leri uyarlanarak uygulanıyor [SB1] | **Yok.** 17 AWS bölgesi; Türkiye ve Orta Doğu yok [SB2] | Barındırılan Supabase SS-2 kapısından geçemiyor (yazılı teyit yoksa) |
| **AWS** | **Belgede yok.** DPA'daki SCC'ler "yalnızca GDPR'a tabi" veriye uygulanıyor [AWS1]; AWS Turkey yalnızca faturalama/sözleşme tarafı [AWS2] | **Kısmen.** İstanbul Local Zone `eu-central-1-ist-1a` (Frankfurt'a bağlı) açık: EC2 C7i/M7i/R7i, EBS, ECS, EKS; **RDS işaretli değil** [AWS3][AWS4] | SS-2 belirsiz; İstanbul LZ'de kendi yönettiğin Postgres mümkün |
| **Microsoft Azure** | **Belgede yok.** Ürün ve Hizmetler DPA'sı (Mayıs 2026): AB/AEA/UK/İsviçre'den çıkışlar için 2021 SCC + UK IDTA; Türkiye/KVKK geçmiyor [MS1]. Türkçe çevirisi var [MS2]. Q&A'daki tek yanıt topluluk üyesinden [MS4] | **Yok.** Resmî bölge listesinde Türkiye yok [MS3] | SS-2 belirsiz; satış kanalından yazılı teyit gerekir |
| **Cloudflare** | **Belgede yok.** DPA v6.4 (3 Nis 2026): AEA/İsviçre/UK aktarımları ve Global CBPR [CF1] | **Depolama yok.** R2 konum ipuçları wnam/enam/weur/eeur/apac/oc [CF2]; İstanbul ve İzmir PoP'u var [CF3]; "Turkey" Regional Services yalnızca TLS çözme/inceleme konumunu kısıtlıyor, Customer Metadata Boundary yok, DLS yalnızca Enterprise [CF4][CF5] | Barındırma için uygun değil |
| **Hetzner** | **Belgede yok.** DPA 1.1 (10 Şub 2025): işleme yalnızca AB/AEA'da; üçüncü ülke aktarımı GDPR m.44 vd. [HZ1] | **Yok.** Falkenstein, Nürnberg, Helsinki, Ashburn, Hillsboro, Singapur [HZ2] | SS-2 belirsiz |
| **DigitalOcean** | **Belgede yok.** DPA (14 Eki 2026) AB SCC tanımı [DO1] | **Yok.** NYC, AMS, SFO, SGP, LON, FRA, TOR, BLR, SYD, ATL, RIC, MKC, MEM [DO2] | SS-2 belirsiz |
| **Vercel** | **Belgede yok.** DPA (yürürlük 31 Mar 2026; Pro ve Enterprise) [VC1] | **Yok.** 19 compute bölgesi; Türkiye yok; 126 PoP listelenmemiş [VC2] | SS-2 belirsiz |
| **Netlify** | **Belgede yok.** DPA (9 Haz 2026) AB SCC + UK eki [NF1] | **Belirsiz / görünmüyor.** Fonksiyon bölgesi seçilebiliyor; Türkiye bölgesine rastlanmadı [NF2] | SS-2 belirsiz |
| **Huawei Cloud** (ek bulgu) | İncelenmedi | **Var:** "TR-Istanbul" bölgesi resmî bölge tablosunda [HW1]; orada RDS for PostgreSQL olup olmadığı **belirsiz** | Türkiye'de yönetilen Postgres için tek hiper ölçekli aday; doğrulanmalı |

### Supabase

- **KVKK beyanı.** DPA, Şartlar, Gizlilik, Alt işleyen listesi ve Güvenlik sayfalarında "Turk",
  "KVKK", "6698" geçmiyor [SB1][SB3]. DPA'nın "Other Jurisdictions" maddesi başka bir ülkenin
  hukuku aktarım mekanizması isterse **AB SCC'lerinin** (atıflar değiştirilerek) uygulanacağını
  söylüyor, ayrıca "acceptance of the Agreement shall have the same effect as signing the SCCs"
  [SB1]. KVKK ise Kurul metninin değiştirilmeden kullanılmasını istiyor [KV2][KV3], yani uyarlanmış
  AB SCC'si SS-2 yerine geçmez. İmza talebine Supabase'in ne cevap vereceği **belirsiz**.
- **Bölge.** 17 bölge (ABD 4, Kanada, AB/UK 6, Asya-Pasifik 5, São Paulo); Türkiye ve Orta Doğu
  yok [SB2].
- **Self-host.** Resmî yol Docker Compose: "The fastest and recommended way to self-host Supabase
  is to use Docker." [SB4]. Belgede kullanıcının sorumluluğu şöyle sayılıyor: sunucu bakımı,
  güvenlik sertleştirmesi, "Backups and disaster recovery", Postgres bakımı, yüksek
  erişilebilirlik ve izleme. Destek: "Self-hosted Supabase is community-supported." Yönetilen yedek
  ve PITR, branching ve Management API self-host'ta yok [SB4].
  - **Üretim.** Sistem gereksinimleri bölümü stack'i "suitable for development and small to medium
    production workloads" diye tanımlıyor; asgari 4 GB RAM, 2 çekirdek, 40 GB SSD (önerilen 8 GB /
    4 çekirdek / 80 GB). Üretimde HTTPS gerekiyor; varsayılan anahtarlar ve parolalar mutlaka
    değiştirilmeli ("never start ... using these defaults") [SB5].
  - **Alt küme.** Realtime, Storage, imgproxy ve Edge Runtime'ın `docker-compose.yml`'dan
    çıkarılabileceği yazıyor; Logs/Analytics varsayılan olarak kapalı [SB5]. "Yalnızca db + auth +
    rest" diye bir tarif yok, ama bu üçü dışındakilerin çıkarılabildiği belgelenmiş. Kong/Envoy
    API geçidi ve Studio dosyada kalıyor; kalmaları gerekip gerekmediği belgede net değil.
  - **Auth (GoTrue) tek başına.** Depo README'si sunucuyu yerel bir Postgres konteyneriyle
    çalıştırıyor ve üretim için şunu söylüyor: "Running an authentication server in production is
    not an easy feat. We recommend using Supabase Auth ... Otherwise ... set up a process to
    promptly update to the latest version" (Releases ve Security Advisories takip edilmeli) [SB6].
  - **Güncelleme.** `sh update.sh --dry-run` ile önizleme, sonra `sh update.sh`, ardından
    `run.sh pull` ve `run.sh recreate`. Kırıcı değişiklik isteyen sürümlerde betik dosyalara
    dokunmadan önce adımları gösterip onay istiyor. Sürüm sabitlemek için `--to <tag>` var [SB7].
    Paketlenmiş sürümler "approximately once a month" yayımlanıyor; tek servis imajı
    değiştirildiğinde uyumluluk "not guaranteed" [SB5].
  - **Yedek.** `update.sh` "backs up your configuration files to `backups/`, but it does not back
    up Postgres or Storage data" [SB7]. Docker sayfası yedekten hiç söz etmiyor [SB5]. Yani
    veritabanı yedeği tamamen sana kalıyor (`pg_dump`/`pg_dumpall`, disk görüntüsü vb.).
  - **Postgres sürümü.** Self-host "ships with Postgres 17 by default" (v0.6.0'dan beri); 15→17
    geçişi betikle `pg_upgrade` ile yapılıyor; tüm konteynerler durduruluyor; veritabanı boyutunun
    2 katı + 5 GB boş disk gerekiyor; önceden elle yedek almak öneriliyor [SB8][SB7].

### Google Cloud

- **KVKK eki.** Cloud Data Processing Addendum, **Appendix 3 (Specific Privacy Laws) → "Turkey"**
  bölümü; sayfa "Last modified June 8, 2026" [GC1]. Tanımlar: "Turkish SCCs" = "standard contract
  clauses under Turkish Data Protection Law". Önemli ifadeler [GC1]:
  - 2.1: "If Customer's billing address is in Turkey and Google makes any optional additional
    terms (including Turkish SCCs) available for acceptance by Customer ... those terms will
    supplement this Addendum as from the date they are notified to the Turkish Personal Data
    Protection Authority".
  - 2.2: Bildirim müşteride: "within five (5) business days of signature".
  - 2.5: "Nothing in the Agreement ... is intended to modify or contradict the Turkish SCCs."
  - 2.6: Çelişki halinde Turkish SCC'ler geçerli.
  - **Belirsiz:** metin SS-2 mi SS-3 mü olduğunu ve kabulün nasıl yapıldığını (konsol, PDF,
    satış ekibi) söylemiyor. "Google makes ... available" ifadesi sunumun Google'ın elinde
    olduğunu gösteriyor. Ek, faturalama adresi Türkiye'de olan hesaba bağlı.
- **Kapsam.** DPA'da "Google Cloud Platform" cloud.google.com/terms/services'teki hizmetler
  olarak tanımlanıyor [GC1]. O listede (Last modified October 21, 2026) "Cloud SQL" ve "Cloud Run
  Services / Cloud Run Jobs" var [GC2]. Dolayısıyla Cloud SQL Postgres ve Cloud Run DPA
  kapsamında.
- **Google'ın kendi (Service Data) işlemesi.** Cloud Privacy Notice'e (15 Eki 2026) KVKK bölümü
  eklenmiş: Google Cloud EMEA Ltd, Service Data için **veri sorumlusu**; aktarımlarda Kurul'un
  standart sözleşmeleri ve m.9 istisnaları anılıyor [GC3]. Bu bölüm Homelibra'nın verisini
  (Customer Data) değil, Google'ın hesap/faturalama verisini kapsıyor.
- **Türkiye bölgesi.** Google Cloud blogu (20 Kas 2025): "New Google Cloud region coming to
  Türkiye", Turkcell ortaklığı, 10 yılda 2 milyar $; "When it is open, the Türkiye region will
  help ..."; açılış tarihi ve şehir yok [GC6]. Bugünkü Compute bölge listesinde ve Cloud SQL
  konum listesinde (güncelleme 2026-10-26) Türkiye bölgesi **yok**; Orta Doğu'da Doha, Dammam ve
  Tel Aviv var [GC4][GC5]. Turkcell'in SEC dosyalarındaki "2028–2029" açılış takvimi yalnızca
  arama özetinden görüldü, dosya açılmadı → **belirsiz** [GC7]. Sonuç: **bölge bugün açık değil.**
  Cloud SQL ve Cloud Run hizmetlerinin bu bölgede sunulup sunulmayacağı belli değil.

### AWS

- AWS DPA (aws-dpa.pdf, 10 sayfa): §12.2 "the Standard Contractual Clauses will only apply to
  Customer Data subject to the GDPR"; §12.3 BCR veya başka "alternative recognized compliance
  standard"; Türkiye/KVKK geçmiyor [AWS1].
- 1 Ocak 2024'ten beri Türkiye'deki hesapların sözleşme tarafı **AWS Turkey Pazarlama Teknoloji ve
  Danışmanlık Hizmetleri Ltd. Şti.**; TL fatura. SSS'de veri koruma ve KVKK sözleşmesi anılmıyor
  [AWS2].
- **İstanbul Local Zone** ("now available"): `eu-central-1-ist-1a`, ebeveyn bölge Frankfurt
  [AWS3]. Özellik tablosunda İstanbul satırı: EC2 C7i/M7i/R7i, EBS gp2/gp3/io1 + snapshot, ALB,
  ECS, EKS, VPC, Direct Connect, EMR işaretli; **RDS ve ElastiCache işaretli değil** [AWS4].
  Yönetilen Postgres bu yüzden yok; EC2 üzerinde kendin kurman gerekir. Kontrol düzlemi Frankfurt'ta
  olduğundan bunun KVKK açısından "aktarım" sayılıp sayılmadığı **belirsiz**. İstanbul LZ EC2
  fiyatı okunmadı.

### Microsoft Azure

- Ürün ve Hizmetler DPA'sının (WW, İngilizce, Mayıs 2026) DOCX tam metninde Türkiye/KVKK/6698 yok.
  "Data Transfers and Location" bölümüne göre AB/AEA/UK/İsviçre dışına çıkışlar 2021 SCC'lere,
  UK çıkışları ayrıca IDTA'ya tabi [MS1]. DPA sayfası Türkçe bir sürüm listeliyor [MS2]. Türkçe
  sürümün içeriği okunmadı; çeviri olması bekleniyor ama **belirsiz**.
- Azure bölge listesinde Türkiye yok (Polonya, İsrail, Katar, İtalya vb. var) [MS3].
- Microsoft Q&A'da (14 Eyl 2026) SS-2 imza süreci sorulmuş; tek yanıt topluluk üyesinden,
  Microsoft çalışanı değil. Yanıt, yayımlanmış bir Microsoft prosedürü göremediğini ve talebin
  hesap ekibi veya CSP/bayi üzerinden iletilmesi gerektiğini söylüyor [MS4]. Resmî kaynak değil.

### Cloudflare, Hetzner, DigitalOcean, Vercel, Netlify

- **Cloudflare:** DPA v6.4'te KVKK yok [CF1]. R2'de Türkiye konumu yok; konum ipuçları bölgesel
  [CF2]. Ağ sayfasında İstanbul ve İzmir PoP'u var [CF3]. Bunlar önbellek/edge noktası, kalıcı
  depolama değil. Data Localization Suite'teki "Turkey" Regional Services yalnızca "Cloudflare will
  only use data centers that are physically located within Turkey to decrypt and service HTTPS
  traffic" anlamına geliyor. Türkiye için Customer Metadata Boundary yok; DLS
  "Enterprise-only paid add-on" [CF4][CF5].
- **Hetzner:** DPA 1.1 §3: işleme "exclusively in a member state of the European Union or ... EEA";
  KVKK yok [HZ1]. Konumlar DE/FI/US/SG [HZ2].
- **DigitalOcean:** DPA (14 Eki 2026) yalnızca AB SCC [DO1]; Türkiye veri merkezi yok [DO2].
- **Vercel:** DPA Pro ve Enterprise için geçerli; KVKK yok [VC1]. 19 compute bölgesinde Türkiye
  yok [VC2].
- **Netlify:** DPA (9 Haz 2026) AB SCC + UK eki; KVKK yok [NF1]. Fonksiyon bölgesi ayarı var
  [NF2]; Türkiye seçeneğine rastlanmadı.

### Türkiye'de barındırma (tek geliştirici için)

| Sağlayıcı / ürün | Veri merkezi | Yönetilen Postgres | En küçük plan (sayfadaki gibi) | Yedek | Kaynak |
|---|---|---|---|---|---|
| **Turhost VPS TR** | Türk Telekom İstanbul Gayrettepe | Yok (VPS'e kendin kurarsın) | VPS TR 1: 1 vCPU / 1 GB / 20 GB SSD, **$16,68/ay** (ilk 3 ay $4,99); VPS TR 2: 2 vCPU / 4 GB / 40 GB, $40,21/ay (ilk 3 ay $9,99); **KDV hariç** | "günlük yedekleri alınır ve 30 gün boyunca ... saklanır"; ek yedek ücretli | [TR1] |
| **Natro XCloud TR** | "Türkiye lokasyonlu"; veri merkezi adı yok | Yok. "PostgreSQL Server" ürünü PostgreSQL için hazırlanmış bir **sanal sunucu**; fiyat, sürüm ve DC sayfada yok [TR3] | XCloud 1: 1 vCPU / 1 GB / 20 GB SSD, **4,99/ay** (liste 7,19, %31 indirim; indirim süresi ve KDV yazmıyor; sayfa varsayılanı USD); XCloud 2: 2 vCPU / 4 GB / 40 GB, 9,99/ay (liste 16,99) | "Ücretsiz Yedekleme Yuvası" (kapsamı belirsiz); PostgreSQL Server sayfası "ücretsiz yedekleyebilirsiniz" diyor | [TR2][TR3] |
| **Radore Cloud Server** | Radore'nin kendi veri merkezi; "%100 Türkiye içinde barındırma", "Veriler yurt dışına çıkmaz" | Yok (sayfada DB ürünü yok) | Disk-Core: 1 çekirdek 2,70 GHz / 2 GB / 100 GB NVMe, **$8,5/ay, KDV hariç** | "otomatik yedekleme çözümleri" (sıklık ve fiyat belirsiz) | [TR4][TR5] |
| Turkcell Veri Tabanı Yönetimi | Turkcell veri merkezleri ("3 farklı veri merkezi") | **Var**, ama motor (PostgreSQL?) ve sürüm belirtilmiyor | Fiyat yok: "Teklifler için Kurumsal Müşteri Temsilciniz ile iletişime geçebilirsiniz"; kurumsal | Belirsiz | [TR6][TR7] |
| Türk Telekom bulut sunucu | Esenyurt, Gayrettepe, Ümitköy | Bulunamadı | Kurumsal; Başlangıç/Eko/Profesyonel paketler; fiyat görülmedi (resmî sayfa yalnızca arama özetinden) | Ayrı bulut yedekleme ürünü var | [TR8] |
| Huawei Cloud TR-Istanbul | İstanbul (bölge) | RDS for PostgreSQL ürünü var (PG 14–18 çekirdekleri) [HW2]; **İstanbul'da sunulup sunulmadığı belirsiz** | Okunmadı | Okunmadı | [HW1][HW2] |

- **Sonuç.** Türkiye veri merkezinde, herkese açık fiyatlı **yönetilen PostgreSQL bulunamadı.**
  Turkcell'in ürünü motor adı vermiyor ve fiyatı yalnızca kurumsal teklifle; Huawei TR-Istanbul'da
  RDS PG doğrulanamadı.
- **Postgres sürümü.** Üç VPS seçeneğinde Postgres'i sen kurduğun için sürümü sen seçersin.
  Supabase self-host varsayılanı Postgres 17 [SB8].
- **Fiyat notu.** Turhost ve Natro'nun düşük fiyatları kampanya fiyatı; Turhost'unki "İLK 3 AY"
  ile sınırlı. Radore $8,5 KDV hariç liste fiyatı. Turhost ve Natro'nun Türkiye ürünleri aynı
  ürün ailesine benziyor (aynı paket adları ve özellikleri), ama ortak bir altyapı olduğu
  doğrulanmadı.
- **KVKK notu.** Radore, KVKK sayfasında kendini açıkça "veri işleyen" olarak konumluyor ve
  yükümlülüklerini yerine getireceğini söylüyor [TR5]. Turhost ise "yerel regülasyon
  gereksinimlerine uygun" ifadesini kullanıyor [TR1]. Yurt içi veri işleyenle de KVKK m.12 gereği
  bir veri işleme sözleşmesi gerekir (bkz. `kvkk-obligations.md`); bu belgede sağlayıcıların
  sözleşme metinleri okunmadı.

### İşlem e-postası (magic link)

| Sağlayıcı | KVKK / SS-2 | Kaynak |
|---|---|---|
| Amazon SES | AWS DPA kapsamında; SCC yalnızca GDPR verisine, KVKK yok | [AWS1] |
| Postmark | DPA: AB SCC Modül 2 + UK IDTA; KVKK yok | [EM1] |
| Resend | DPA: AB SCC ekli; KVKK yok | [EM2] |
| Brevo | Hizmet Şartları (1 Eki 2025) Ek 3 DPA; KVKK yok | [EM3] |
| Mailjet (Sinch Email) | DPA v8 (29 Eki 2025); KVKK yok | [EM4] |
| Mailgun (Sinch Email) | Mailgun DPA bağlantısı eski sürüme (16/01/2023) yönlendiriyor; Mailgun ve Mailjet aynı "Sinch Email" birimi. Okunan metinde KVKK yok; güncel Mailgun'a özgü metin **belirsiz** | [EM5] |
| **Euromsg Express** (Türk) | Şirket: Hedef Medya Tanıtım İnteraktif Medya Pazarlama A.Ş., İstanbul. Transactional ürünü "Kolay API Entegrasyonu", "KVKK ve GDPR ile uyumlu alt yapı" diyor. **Sunucu/veri merkezi konumu belgelenmemiş → belirsiz** | [EM6][EM7][EM8] |

- **Euromsg Express fiyatı:** Transactional paket **20.000 e-posta/ay ₺520 + KDV** (aylık;
  700.000'e kadar kademeli); yeni hesaba bir ay geçerli 100 ücretsiz gönderim [EM7].
- **Related Digital (euromsg'un ana şirketi)** kendi sitesinde transactional API'yi fiyatsız,
  "demo talep et" ile sunuyor [EM9].
- **Sonuç:** Yabancı sağlayıcıların hiçbiri KVKK taahhüdü yayımlamıyor. Türk şirketi olan
  Euromsg Express'in veriyi Türkiye'de tuttuğu belgelenmemiş; sorulmalı.

### EAS (Expo Application Services)

| | Free | Starter | Production |
|---|---|---|---|
| Aylık ücret | $0 | **$19** + kullanım | **$199** + kullanım |
| Build | "Up to 15 Android and 15 iOS builds", düşük öncelikli kuyruk, 45 dk zaman aşımı | $45 build kredisi, yüksek öncelik | $225 build kredisi, 15 eşzamanlılık |
| Build fiyatı (kredi sonrası) | — | Android orta $1, iOS orta $2 (büyük worker'da $2 / $4) | aynı |
| EAS Update MAU | **1.000** | **3.000**, sonra $0,005/MAU (3.001–200.000) | **50.000**, sonra $0,005/MAU |
| Update bant genişliği / depolama | 100 GiB / 20 GiB | 100 GiB (+$0,10/GiB) / 20 GiB (+$0,05/GiB) | 1 TiB / 1 TiB |
| EAS Hosting | 100k istek, 1M CPU-ms, 1 GB, istek başına 10 CPU-ms, özel alan adı yok | 100k istek dahil, sonra $2/1M istek; $0,04/1M CPU-ms; $0,04/GB; projede 1 özel alan adı | aynı |

Kaynak: [EX1][EX2]. Enterprise özel fiyatlı ($1.000 build kredisiyle başlıyor) [EX1].

- **Veri işleme yeri.** Gizlilik Politikası (21 Eki 2025): ABD dışında yaşayanlar için "you consent
  to the transfer of such data to the United States" [EX3]. Hizmet Şartları §3.2: Expo, kullanıcı
  içeriğindeki kişisel veri için **veri işleyen**; bu işleme için AB SCC Modül 2'ye uyduğunu
  söylüyor [EX4]. KVKK geçmiyor.
- **EAS Update telemetrisi.** Expo'ya göre güncelleme istekleri "do not contain identifying
  information such as unique device identifiers" ve şunları içeriyor: işletim sistemi, proje ID'si,
  rastgele kurulum token'ı [EX5]. **IP adresinin işlenip saklanması belgede ele alınmamış →
  belirsiz.**
- **EAS Hosting** Cloudflare Workers üzerinde çalışıyor [EX6]. Yani web sunucu kodu ve log'lar
  Cloudflare'in küresel ağında işleniyor; konum seçimi belgelenmemiş.

## Öneri

Bu bir bilgi derlemesi, hukuki görüş değil. Hosting kararı için iki yol öne çıkıyor:

1. **Türkiye'de VPS + self-host Supabase alt kümesi (Postgres + GoTrue + PostgREST).**
   Library ve hesap verisi için m.9 aktarımı doğar mı sorusunu ortadan kaldıran tek yol bu.
   En güvenilir adaylar:
   - **Radore:** kendi veri merkezi, ISO 27001, kendini KVKK'da açıkça "veri işleyen" olarak
     konumluyor; $8,5/ay KDV hariç, 2 GB RAM.
   - **Turhost VPS TR:** Türk Telekom Gayrettepe, 30 günlük günlük yedek dahil; liste fiyatı
     $16,68/ay, 1 GB RAM.

   Supabase'in kendi belgesi asgari 4 GB RAM istiyor (tam stack için) [SB5]. Alt küme daha az
   ister, ama bu belgelenmedi; büyük ihtimalle 4 GB'lık plan (Turhost VPS TR 2 veya Natro XCloud 2)
   gerekecek. Bedeli şu: yedek, güncelleme ve güvenlik tamamen sende; `update.sh` veritabanını
   yedeklemiyor [SB7]; GoTrue'yu üretimde çalıştırmanın zor olduğunu Supabase kendisi yazıyor [SB6].
   Bu yolda bile e-posta (magic link) ve EAS Update ayrı birer aktarım konusu olarak kalıyor.
2. **Google Cloud (Cloud SQL Postgres + Cloud Run, AB bölgesi) + Turkish SCC eki.** Belgelenmiş tek
   yabancı yol. Yönetilen yedek ve güncellemeler bunun kazancı. Önce Türkiye faturalama adresli
   bir hesapta ekin gerçekten kabule sunulup sunulmadığı ve bunun SS-2 olup olmadığı
   doğrulanmalı [GC1]. Supabase'in barındırılan sürümü, Supabase SS-2 imzalayacağını yazılı
   olarak teyit etmedikçe elenmeli. AWS, Azure, Hetzner, DigitalOcean, Vercel, Netlify ve
   Cloudflare için de durum aynı: yayımlı taahhüt yok.

- **E-posta.** Euromsg Express (₺520 + KDV/ay, 20.000 e-posta) Türkiye kökenli tek API'li aday;
  veri konumu yazılı olarak sorulmadan "aktarım yok" varsayılmamalı. Alternatif, Google yolunu
  seçersen aynı hesap altında bir SMTP kullanmak olurdu; Google'ın işlem e-postası hizmeti bu
  belgede incelenmedi.
- **EAS.** Free plan (15 Android + 15 iOS build; dönem birimi sayfada açıkça yazmıyor, plan
  aylık; 1.000 Update MAU) başlangıç için yeterli; Update MAU'su
  1.000'i geçerse Starter ($19) gerekir. EAS Library verisi işlemiyor, ama Update istekleri IP
  taşıyorsa ABD'ye aktarım sayılabilir. Bu belgede çözülemedi.

## Açık sorular

1. **Google Turkish SCC:** Türkiye faturalama adresli hesapta kabul akışı nerede (konsol, PDF,
   satış)? Metin SS-2 mi, Kurul metniyle birebir mi? Kabulden sonra bildirimi biz yapıyoruz
   (5 iş günü) [GC1]. Hesap açılmadan doğrulanamadı.
2. **Supabase, AWS, Microsoft, Hetzner, Vercel:** SS-2'yi değiştirmeden imzalıyorlar mı? Hiçbirinde
   yayımlı metin yok; yazılı soru gerekir.
3. **AWS İstanbul Local Zone:** Kontrol düzlemi Frankfurt'ta, EBS verisi İstanbul'da olan bir
   kurulum KVKK bakımından aktarım sayılır mı? AWS Turkey bu kurulum için veri işleyen sözleşmesi
   veriyor mu? Fiyat okunmadı.
4. **Huawei Cloud TR-Istanbul:** RDS for PostgreSQL bu bölgede var mı, fiyatı ve sözleşme tarafı
   ne? Bölgenin varlığı doğrulandı [HW1], ürünün varlığı doğrulanamadı.
5. **Turkcell Veri Tabanı Yönetimi:** Hangi motor (PostgreSQL?), hangi sürüm? Şahıs işletmesi
   veya bireysel geliştirici başvurabiliyor mu? Sayfada yazmıyor [TR6].
6. **Euromsg Express:** E-posta verisi (alıcı adresi, içerik, log) hangi ülkede işleniyor? Alt
   işleyenler kim? SPF/DKIM/özel alan adı desteği bu belgede incelenmedi.
7. **EAS Update ve IP adresi:** Expo, IP'yi işliyor veya saklıyor mu? İşliyorsa ABD'ye aktarım
   için SS-2 gerekir; Expo'nun KVKK tutumu belgede yok [EX3][EX4][EX5].
8. **Self-host alt kümesi:** Kong/Envoy geçidi ve Studio'suz bir db + auth + rest kurulumu resmî
   olarak desteklenmiyor; asgari RAM ve kurulum bir prototiple ölçülmeli.
9. **Natro XCloud:** Fiyatın para birimi, KDV durumu ve indirim süresi sayfada açık değil; veri
   merkezi adı verilmemiş [TR2].
10. **Mailgun:** Güncel DPA bağlantısı eski sürüme gidiyor; güncel metin Sinch'ten istenmeli [EM5].

## Kaynaklar

KVKK (`kvkk-obligations.md`'den devralındı)
- [KV1] 6698 sayılı Kanun, güncel metin: https://www.mevzuat.gov.tr/MevzuatMetin/1.5.6698.pdf
- [KV2] KVKK, Standart Sözleşmeler (SS-2 dahil 4 tip): https://www.kvkk.gov.tr/Icerik/7929/Standart-Sozlesmeler
- [KV3] KVKK, Standart Sözleşmelerde Dikkat Edilmesi Gereken Hususlar (05.02.2025): https://www.kvkk.gov.tr/Icerik/8170/Yurt-Disina-Kisisel-Veri-Aktariminda-Kullanilacak-Standart-Sozlesmelerde-Dikkat-Edilmesi-Gereken-Hususlara-Iliskin-Kamuoyu-Duyurusu

Supabase
- [SB1] Data Processing Addendum, Version 1 — August 1, 2026: https://supabase.com/legal/customer-resources/data-processing-addendum (kısa yol https://supabase.com/legal/dpa)
- [SB2] Regions: https://supabase.com/docs/guides/platform/regions
- [SB3] Terms / Privacy / Subprocessors / Security (KVKK taraması): https://supabase.com/terms · https://supabase.com/privacy · https://supabase.com/legal/customer-resources/subprocessor-list · https://supabase.com/security
- [SB4] Self-Hosting: https://supabase.com/docs/guides/self-hosting
- [SB5] Self-Hosting with Docker: https://supabase.com/docs/guides/self-hosting/docker
- [SB6] supabase/auth README ("Running in production"): https://github.com/supabase/auth/blob/master/README.md
- [SB7] Updating self-hosted Supabase: https://supabase.com/docs/guides/self-hosting/updating
- [SB8] Upgrading to Postgres 17: https://supabase.com/docs/guides/self-hosting/postgres-upgrade-17

Google Cloud
- [GC1] Cloud Data Processing Addendum (Appendix 3 "Turkey"; Last modified June 8, 2026): https://cloud.google.com/terms/data-processing-addendum/
- [GC2] Google Cloud Platform Services Summary (Last modified October 21, 2026): https://cloud.google.com/terms/services
- [GC3] Google Cloud Privacy Notice (KVKK bölümü; Effective October 15, 2026): https://cloud.google.com/terms/cloud-privacy-notice
- [GC4] Compute Engine regions and zones: https://docs.cloud.google.com/compute/docs/regions-zones
- [GC5] Cloud SQL for PostgreSQL locations (Last updated 2026-10-26): https://docs.cloud.google.com/sql/docs/postgres/locations
- [GC6] Google Cloud Blog, "New Google Cloud region coming to Türkiye" (20 Kas 2025): https://cloud.google.com/blog/products/infrastructure/new-google-cloud-region-coming-to-turkiye
- [GC7] Turkcell Form 20-F FY2025 (yalnızca arama özetinden; açılmadı): https://www.sec.gov/Archives/edgar/data/1071321/000110465926044740/tkc-20251231x20f.htm

AWS
- [AWS1] AWS Data Processing Addendum (PDF): https://d1.awsstatic.com/legal/aws-dpa/aws-dpa.pdf
- [AWS2] AWS Turkey SoR FAQ: https://aws.amazon.com/legal/awstr/
- [AWS3] AWS Local Zones locations: https://aws.amazon.com/about-aws/global-infrastructure/localzones/locations/
- [AWS4] AWS Local Zones features (hizmet tablosu): https://aws.amazon.com/about-aws/global-infrastructure/localzones/features/

Microsoft
- [MS1] Microsoft Products and Services DPA (WW, English, May 2026, DOCX): https://www.microsoft.com/licensing/docs/documents/download/MicrosoftProductandServicesDPA(WW)(English)(May2026)(CR).docx
- [MS2] DPA sürüm ve dil listesi: https://www.microsoft.com/licensing/docs/view/Microsoft-Products-and-Services-Data-Protection-Addendum-DPA
- [MS3] Azure regions list: https://learn.microsoft.com/en-us/azure/reliability/regions-list
- [MS4] Microsoft Q&A (topluluk yanıtı, resmî değil): https://learn.microsoft.com/en-us/answers/questions/6003165/execution-process-for-turkish-kvkk-article-9-ss-2

Cloudflare
- [CF1] Cloudflare Data Processing Addendum v6.4: https://www.cloudflare.com/cloudflare-customer-dpa/
- [CF2] R2 Data location (Last updated Aug 19, 2026): https://developers.cloudflare.com/r2/reference/data-location/
- [CF3] Cloudflare network (şehir listesi): https://www.cloudflare.com/network/
- [CF4] Data Localization Suite, region support: https://developers.cloudflare.com/data-localization/region-support/
- [CF5] Data Localization Suite (Enterprise-only): https://developers.cloudflare.com/data-localization/

Hetzner, DigitalOcean, Vercel, Netlify
- [HZ1] Hetzner DPA, Version 1.1 (10 Şub 2025): https://www.hetzner.com/AV/DPA_en.pdf
- [HZ2] Hetzner Cloud locations: https://docs.hetzner.com/cloud/general/locations/
- [DO1] DigitalOcean Data Processing Agreement (Last Updated October 14, 2026): https://www.digitalocean.com/legal/data-processing-agreement
- [DO2] DigitalOcean regional availability: https://docs.digitalocean.com/platform/regional-availability/
- [VC1] Vercel Data Processing Addendum (Effective March 31, 2026): https://vercel.com/legal/dpa
- [VC2] Vercel regions: https://vercel.com/docs/regions
- [NF1] Netlify Data Processing Agreement (Last Updated June 9, 2026): https://www.netlify.com/pdf/netlify-dpa.pdf
- [NF2] Netlify Functions configuration (Region): https://docs.netlify.com/build/functions/configuration/

Huawei Cloud
- [HW1] Cloud Connect, Region Availability (TR-Istanbul): https://support.huaweicloud.com/intl/en-us/productdesc-cc/cc_01_0004.html
- [HW2] RDS for PostgreSQL Kernel Version Description: https://support.huaweicloud.com/intl/en-us/kerneldesc-rds-pg/rds_02_0001.html

Türkiye'de barındırma
- [TR1] Turhost VPS TR: https://www.turhost.com/sunucu/vps-tr-sunucu/
- [TR2] Natro XCloud TR: https://www.natro.com/sunucu-kiralama/vps-tr-sunucu
- [TR3] Natro PostgreSQL Server: https://www.natro.com/sunucu-kiralama/bulut-uygulamalar/postgresql-server
- [TR4] Radore Cloud Server: https://radore.com/tr/hizmetler/bulut-sunucu
- [TR5] Radore KVKK Uyumlu Sunucu ve Bulut Çözümleri: https://radore.com/tr/hizmetler/kvkk-uyumlu-sunucu-bulut
- [TR6] Turkcell Veri Tabanı Yönetimi: https://www.turkcell.com.tr/kurumsal/dijital-is-servisleri/bulut-servisleri/turkcell-veri-tabani-yonetimi
- [TR7] Turkcell Bulut Servisleri: https://www.turkcell.com.tr/kurumsal/dijital-is-servisleri/bulut-servisleri
- [TR8] Türk Telekom sanal sunucu (yalnızca arama özeti): https://kurumsal.turktelekom.com.tr/bilisim-teknolojileri/veri-merkezi-ve-bulut/sanallastirma-cozumleri/sanal-sunucu — veri merkezleri: https://kurumsal.turktelekom.com.tr/bilisim-teknolojileri/veri-merkezi-ve-bulut/veri-merkezi-hizmetleri/veri-merkezlerimiz

E-posta
- [EM1] Postmark DPA: https://postmarkapp.com/dpa
- [EM2] Resend DPA: https://resend.com/legal/dpa
- [EM3] Brevo Terms of Service (Version October 1st, 2025; Appendix 3 DPA): https://www.brevo.com/legal/termsofuse/
- [EM4] Mailjet (Sinch) Data Processing Agreement, Version 8: https://www.mailjet.com/legal/dpa/
- [EM5] Mailgun DPA (eski sürüme yönleniyor): https://www.mailgun.com/legal/dpa/
- [EM6] Euromsg Express, Transactional Email Servisi: https://www.euromsgexpress.com/transactional-email-servisi/
- [EM7] Euromsg Express, Fiyatlar: https://www.euromsgexpress.com/fiyatlar/
- [EM8] Euromsg Express, ana sayfa ve şirket bilgisi: https://www.euromsgexpress.com/ — gizlilik: https://www.euromsgexpress.com/gizlilik-politikasi/
- [EM9] Related Digital, Email Marketing: https://www.relateddigital.com/email-marketing/

Expo
- [EX1] EAS pricing: https://expo.dev/pricing
- [EX2] EAS pricing (düz metin, kullanım fiyatları): https://expo.dev/pricing.md
- [EX3] Expo Privacy Policy (Last updated October 21st 2025): https://expo.dev/privacy
- [EX4] Expo Terms of Service §3.2 GDPR (Last updated May 29, 2025): https://expo.dev/terms
- [EX5] Privacy of the Expo Platform and Expo Services Explained: https://expo.dev/privacy-explained
- [EX6] EAS Hosting introduction (Cloudflare Workers): https://docs.expo.dev/eas/hosting/introduction/
