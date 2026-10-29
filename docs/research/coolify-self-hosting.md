# Coolify ile Türkiye'de self-host: sürüm, Postgres yedeği, güvenlik, dağıtım ve Türk sağlayıcılar

> Bu belge birincil kaynaklardan (Coolify belgeleri ve GitHub deposu, sağlayıcıların ürün ve
> fiyat sayfaları, Expo belgeleri) 2026-10-29'da derlendi. "Belirsiz" yazan her şey kaynağında
> doğrulanamadı; tahmin yapılmadı.

Tarih: 2026-10-29 · Genişlettiği belge: `docs/research/kvkk-hosting-providers.md` (Türk VPS
adayları orada; burada tekrar edilmedi, yalnızca Coolify açısından eksik bilgiler eklendi) ·
İlgili: `docs/research/turkish-fulltext-search.md` (`unaccent`, `pg_trgm` ihtiyacı),
`docs/research/expo-universal-maturity.md` (web çıktısı)

## Soru

KVKK m.9 nedeniyle her şeyi Türkiye'deki bir VPS'te Coolify ile self-host etme planı için
(Expo istemci + Node/TypeScript API + PostgreSQL):

1. Coolify'ın güncel kararlı sürümü, v4'ün beta'dan çıkıp çıkmadığı, resmî asgari/önerilen
   sunucu gereksinimleri, desteklenen işletim sistemleri, Coolify'ın kendi bellek yükü.
2. Coolify'ın PostgreSQL kurulumu (imaj, sürüm, özel imaj ve `unaccent`/`pg_trgm`) ve zamanlanmış
   yedek (yöntem, hedefler, saklama, geri yükleme).
3. Son 18 ayın güvenlik danışmanlıkları (CVE), önem dereceleri, düzeltilme durumu; güncellemenin
   nasıl uygulandığı.
4. GitHub'dan Dockerfile/Nixpacks ile push'ta otomatik dağıtılan Node API + aynı alan adında
   yol tabanlı (`/api`) yönlendirmeyle statik SPA; Let's Encrypt.
5. Radore, Turhost, Natro, Turkcell, Türk Telekom'da Türkiye'de S3 uyumlu nesne depolama var mı?
6. Radore ve Turhost'ta 2 vCPU / 4 GB planı, fiyat, snapshot/yedek, root, Ubuntu 24.04.
7. Expo için resmî "custom expo-updates server" örneği ve protokolün SDK 58 dönemindeki durumu.

## Yöntem

- Coolify belgeleri, `coollabsio/coolify-docs` deposu (son commit 2026-10-29) yerelde klonlanıp
  kaynak `.mdx` dosyalarından okundu; her sayfanın coolify.io/docs adresi HTTP 200 ile doğrulandı.
- Sürümler, sürüm notları ve güvenlik danışmanlıkları `gh api` ile `coollabsio/coolify`
  deposundan çekildi (`/releases`, `/security-advisories`). Bazı davranışlar (otomatik güncelleme
  varsayılanı, Traefik etiketleri, yedek işinin şifreleme yapıp yapmadığı) kaynak koddan okundu.
- "Son 18 ay" = 2025-04-29 ile 2026-10-29 arasında **yayımlanan** danışmanlıklar.
- JavaScript ile yüklenen Türk sağlayıcı sayfaları (Turhost, Radore yapılandırıcısı, Turkcell,
  Türk Telekom Bulut) Claude'un tarayıcı panelinde açıldı. Sepete ürün eklenmedi, sipariş
  verilmedi; yalnızca yapılandırıcıdaki seçenekler okundu. Çerez bandında zorunlu olmayanlar
  reddedildi.
- Sağlayıcıların ürün yelpazesi site haritalarından (`sitemap.xml`) tarandı.
- Arama motoru yalnızca kaynağa ulaşmak için kullanıldı.

## Bulgular

### Özet tablo

| # | Konu | Bulgu | Kaynak |
|---|---|---|---|
| 1 | Sürüm | **v4.5.3** (28 Eki 2026) en son kararlı. **v4.0.0 27 Nis 2026'da çıktı**; son beta `v4.0.0-beta.474` (21 Nis 2026). v4 artık beta değil. | [GH1][GH2] |
| 1 | Gereksinim | Asgari **2 çekirdek, 2 GB RAM, 10 GB boş disk**, amd64/arm64. Kurulum betiği toplam diski 30 GB'tan, boş diski 20 GB'tan azsa uyarıyor. Önerilen değer yok. | [CO1][GH6] |
| 1 | İşletim sistemi | Debian/Ubuntu, RHEL türevleri, SUSE, Arch, Alpine, Raspberry Pi OS 64-bit; LTS olmayan Ubuntu için manuel kurulum | [CO1] |
| 1 | Coolify'ın bellek yükü | **Resmî bir rakam yok → belirsiz.** Traefik ölçümü: boşta 19,4 MB, yük altında en çok 126 MB | [CO2][CO3] |
| 2 | Postgres | Varsayılan `postgres:18-alpine`; seçicide 18/17/16, Supabase PG, PostGIS, PGVector. **Image** alanı serbest Docker imajı ve etiketi alıyor | [CO4][CO5] |
| 2 | `unaccent`, `pg_trgm` | Resmî postgres imajı contrib modüllerini kuruyor (`make -C contrib install`), yani `CREATE EXTENSION` çalışmalı. Coolify belgesi bu iki uzantıyı ayrıca anmıyor | [PG1] |
| 2 | Yedek | Seçili veritabanları için `pg_dump --format=custom`, "All databases" seçilirse `pg_dumpall` + gzip; cron ile zamanlama; yerel `/data/coolify/backups` + isteğe bağlı S3 uyumlu hedef; yerel ve S3 için ayrı saklama kuralları (adet / gün / GB). **Dosyalar şifrelenmiyor** (belgede yok, kaynakta görülmedi) | [CO4][CO6][GH7] |
| 2 | Geri yükleme | Belgelenmiş: **Import Backup** ekranı (yükleme, sunucudaki yol veya S3) + API; `pg_restore`/`psql` komutu otomatik seçiliyor; tek transaction | [CO7] |
| 3 | Güvenlik | Son 18 ayda **61 GitHub danışmanlığı** yayımlandı: 16 kritik, 25 yüksek, 12 orta, 8 düşük. 57'sinde düzeltilmiş sürüm `4.0.0-beta.474` veya daha eski; 4'ünde düzeltilmiş sürüm alanı boş. Ekim 2026'da bağımlılık CVE'leri (PHP, Sentinel) v4.4.7 ile kapatıldı ve eski hatlara backport edildi | [GH3][GH4] |
| 3 | Güncelleme | Otomatik güncelleme **varsayılan olarak açık** (`is_auto_update_enabled` varsayılanı `true`); varsayılan zamanlama günlük 00:00; ayar panelden ya da `.env` içindeki `AUTOUPDATE` ile değiştirilebiliyor | [CO8][GH5] |
| 4 | Yol tabanlı yönlendirme | **Destekleniyor.** Alan adına yol ekleniyor (`https://alan/api`). Coolify Traefik'e `Host() && PathPrefix()` kuralı ve `stripprefix` ara katmanı yazıyor; önek varsayılan olarak siliniyor, "Keep paths as-is" ile korunabiliyor | [CO9][GH8] |
| 4 | Let's Encrypt | `https://` ile girilen alan adında otomatik: Traefik varsayılan `certresolver=letsencrypt`; 80/443 portları açık olmalı | [CO9][GH8] |
| 5 | TR nesne depolama | Beş sağlayıcının hiçbirinde herkese açık, fiyatlı, **S3 uyumlu** bir ürün bulunamadı. Turkcell nDepo "nesne tabanlı" ama S3 API'si belirtilmiyor ve fiyatı kurumsal teklifle veriliyor | [RD3][TC1][TT1][TT2][NT1][TH3] |
| 6 | Radore 2c/4 GB | Disk-Advance: 2 çekirdek / 4 GB / 200 GB NVMe, **$17/ay, KDV hariç**; Ubuntu 24.04.3 LTS ücretsiz seçilebiliyor; yedek ücretli; root ve snapshot belirsiz | [RD1][RD2] |
| 6 | Turhost 2c/4 GB | VPS TR 2: 2 vCPU / 4 GB / 40 GB SSD, **$40,21/ay liste, KDV hariç** (kampanya fiyatı aşağıda); Ubuntu 24.04 ücretsiz; 30 gün saklanan günlük yedek dahil; snapshot belirsiz | [TH1][TH2] |
| 7 | Expo OTA self-host | `expo/custom-expo-updates-server` resmî, ama kendi README'si "basit bir gösterim" olduğunu ve kararlılığın garanti edilmediğini söylüyor; son güncellemesi SDK 54. Protokol "Expo Updates v1"; SDK 58'deki `expo-updates` 58.0.19 `Expo-Protocol-Version: 1` gönderiyor | [EX1][EX2][EX3][EX4] |

### 1. Coolify sürümü, gereksinimler, bellek yükü

- **Sürüm durumu.** Son sürüm **v4.5.3**: 2026-10-28, `prerelease: false` [GH1]. v4.0.0
  sürüm notu: "Finally releasing v4.0. It was long overdue because we have been in beta for a
  long time" [GH2]. Ardından v4.1.0 (18 May), v4.2.0 (21 Tem; GitHub'da `prerelease: true`
  işaretli, bir kırıcı rol değişikliği içeriyor), v4.3.0 (12 Ağu), v4.4.0 (6 Eki) ve v4.5.0
  (23 Eki) geldi [GH1]. Aynı notta v5'in geliştirildiği, v4'ün desteğinin sürdüğü yazıyor [GH2].
- **Asgari donanım** (resmî "Start with Self-hosted" sayfası) [CO1]:
  - "Coolify needs 2 CPU cores, 2 GB RAM, and 10 GB disk space to run."
  - Daha küçük sunucuda (1 çekirdek, 512 MB, 4 GB) çalışabildiğini, "but this is not
    recommended" diyor.
  - Derlemeler ve Coolify aynı sunucudaysa kaynak kullanımının izlenmesini istiyor: "High
    resource usage could make your server unresponsive."
  - Ayrı bir "önerilen" değer yok. Sayfadaki örnek üretim kurulumu: Hetzner CAX11, 2 vCPU /
    4 GB, ortalama 2,6 GB bellek kullanımı. Uygulamalar dışarıda derlenmiş ve çok sayıda servis
    çalışıyor [CO1].
  - **Disk tutarsızlığı.** Belge 10 GB diyor, ama `install.sh` toplam disk 30 GB'tan, boş disk
    20 GB'tan azsa uyarı veriyor (kurulumu durdurmuyor) [GH6].
- **İşletim sistemi** [CO1]: Debian ve Ubuntu (LTS olmayan Ubuntu için "Manual install");
  CentOS, Fedora, RHEL, AlmaLinux, Rocky, TencentOS, Asahi; SLES/openSUSE; Arch; Alpine;
  Raspberry Pi OS 64-bit. "Coolify only runs on Linux-based operating systems." Temiz sunucu ve
  root (ya da sudo yetkili) SSH erişimi öneriliyor. **Ubuntu 24.04 LTS uyumlu.**
- **Çalışırken ne çalışıyor.** Kontrol düzleminde üç konteyner var: `coolify` (panel, API,
  Horizon kuyruğu, zamanlayıcı, Reverb, terminal), `coolify-db` (PostgreSQL) ve `coolify-redis`
  [CO2]. Bunlara her sunucuda `coolify-proxy` (Traefik ya da Caddy) ve isteğe bağlı
  `coolify-sentinel` ekleniyor [CO2]. Kaynak koddaki `docker-compose.yml`'da `coolify-db` için
  `postgres:15-alpine`, `coolify-redis` için `redis:7-alpine` kullanılıyor [GH9].
- **Bellek yükü → belirsiz.** Coolify'ın kendisi için resmî bir MB rakamı yok. Belgedeki tek
  ölçüm proxy için [CO3]:
  - Coolify ekibinden bir üyenin 2 vCPU'lu test sunucusunda yaptığı ölçüm: Traefik 3.7 (yeni
    sunuculara kurulan sürüm) boşta 19,4 MB, yük altında en çok 126 MB; Caddy 15,2 / 54 MB.
  - Aynı sayfa, düşük trafikli bir üretim sunucusunda Traefik'in 6 saatten sonra 70–80 MB'a
    çıktığını ve bir gece 512 MB sınırını aşıp OOM ile yeniden başladığını anlatıyor. Bu tek bir
    vaka; genellenemez.
  - Üçüncü taraf ölçümleri birincil kaynak olmadığı için kullanılmadı.

### 2. Coolify'da PostgreSQL ve yedek

**Kurulum** [CO4][CO5]:

- Veritabanı tek başına bir konteyner olarak kuruluyor; parola üretiliyor, kalıcı volume ve
  dahili bağlantı URL'si oluşturuluyor.
- Varsayılan imaj **PostgreSQL 18 (`postgres:18-alpine`)**. Veri dizini PG ≤17'de
  `/var/lib/postgresql/data`, PG ≥18'de `/var/lib/postgresql`. Seçicide PG 18, 17, 16 ile
  Supabase PostgreSQL, PostGIS ve PGVector imajları var.
- **Özel imaj.** General sayfasındaki **Image** alanı "The Docker image and tag used to run the
  database" diye tanımlanıyor [CO5]. İmaj değiştirilirken ana sürümün de değişebileceği
  konusunda uyarıyor: önce doğrulanmış yedek alınmalı. Yani kendi derlediğin bir imaj
  (ör. ek uzantılı) girilebilir.
- **`unaccent` / `pg_trgm`.** İkisi de PostgreSQL contrib modülü. Resmî `postgres` imajının
  `18/alpine3.24` Dockerfile'ı `make -C contrib install` çalıştırıyor [PG1], yani varsayılan
  imajda `CREATE EXTENSION unaccent; CREATE EXTENSION pg_trgm;` için özel imaj gerekmez. Bu,
  imajdan çıkarılan bir sonuçtur; Coolify belgesi bu uzantıları anmıyor.
- **Başlangıç betikleri.** Betikler `/docker-entrypoint-initdb.d/` altına bağlanıyor ve yalnızca
  boş veri dizini ilk kez başlatılırken çalışıyor. Ayrıca özel `postgresql.conf` verilebiliyor
  [CO4]. `turkish-fulltext-search.md`'deki `tr_unaccent` metin arama konfigürasyonu bu betiklerle
  ya da uygulama migration'ıyla kurulabilir.
- **Ağ.** Varsayılan olarak dışarı açık değil; dahili URL kullanılıyor. Dışarıya açmak için ayrı
  bir TCP proxy ve "Public port" gerekiyor [CO4].

**Zamanlanmış yedek** [CO6]:

| Özellik | Coolify'ın davranışı |
|---|---|
| Yöntem | Seçili veritabanları için `pg_dump --format=custom`. "All databases" seçilirse `pg_dumpall` ve gzip çıktısı. Mantıksal dump; WAL/PITR yok |
| Zamanlama | 5 alanlı cron ya da `hourly`, `daily`, `weekly` vb.; zaman aşımı varsayılanı 3600 sn; veritabanı durmuşsa o çalışma atlanıyor |
| Yerel hedef | Veritabanının bulunduğu sunucuda `/data/coolify/backups/...` |
| Uzak hedef | S3 uyumlu depolama; aktarım MinIO'nun `mc` istemcisiyle. Doğrulamada `ListObjectsV2` çağrılıyor, kova önceden oluşturulmuş olmalı [CO10]. Listede AWS S3, R2, Neon, Supabase, DigitalOcean Spaces, **MinIO**, B2, Scaleway, Hetzner, Wasabi, Vultr, CloudPe, IDrive e2 var. Garage listede yok → uyumluluğu **belirsiz** |
| Saklama | Yerel ve S3 için **ayrı** kurallar: "Backups to keep", "Days to keep", "Maximum storage (GB)"; `0` sınırsız demek; hangi sınıra önce ulaşılırsa o uygulanıyor. "Delete after S3 upload" seçeneği yerel kopyayı siliyor |
| Doğrulama | Her çalışmanın durumu, boyutu ve S3 yükleme sonucu görünüyor. Belge "A backup is not a restore test" diyerek geri yüklemenin ayrıca denenmesini istiyor |
| Şifreleme | **Yok.** Yedek ve S3 sayfalarında dump şifrelemesinden söz edilmiyor. `DatabaseBackupJob.php` dump'ı doğrudan `mc cp` ile yüklüyor; sınıftaki `ShouldBeEncrypted` yalnızca kuyruk yükünü şifreleyen Laravel arayüzü [GH7]. Off-site kopya şifreli olacaksa şifrelemeyi ayrıca kurmak gerekir |

**Geri yükleme** [CO7][CO4]:

- Çalışan veritabanının **Import Backup** sayfasında üç kaynak var: bilgisayardan yükleme,
  sunucudaki mutlak yol ya da S3'teki dosya.
- Biçim otomatik algılanıyor (SQL, custom, tar, all-database; gzip/bz2/xz/zip). Coolify
  `pg_restore` ya da `psql` komutunu üretip salt okunur olarak gösteriyor.
- PostgreSQL geri yüklemesi tek transaction'da çalışıyor. "Replace objects that already exist" ve
  "Keep owners and privileges" varsayılan olarak kapalı.
- Aynı işlem API üzerinden de yapılabiliyor (`POST /databases/{uuid}/imports` vb.).
- Belgelenmiş akış şu sırayı istiyor: yazmaları durdur, hedefin ayrıca yedeğini al, geri yükle,
  doğrula, yeni yedek al.

### 3. Güvenlik geçmişi ve güncelleme

**GitHub Security Advisories** (`coollabsio/coolify`, 2025-04-29 → 2026-10-29) [GH3]:

| Yayım ayı | Adet | Öne çıkanlar | Düzeltildiği sürüm |
|---|---|---|---|
| Ocak 2026 | 16 | 9,9–9,4 puanlı kritikler: Git deposu, Docker Compose ve veritabanı içe/dışa aktarımında komut enjeksiyonu (ör. CVE-2025-59157, CVE-2025-66209/66210/66211/66212/66213); üyelerin root kullanıcısının özel anahtarını görmesi (CVE-2025-64420); kendini admin davet etme (CVE-2025-64421) | `beta.420.7` – `beta.451`. Dördünde (CVE-2025-64420/64421/64423/64424; etkilenen ≤ `beta.434`) düzeltilmiş sürüm alanı **boş → belirsiz** |
| Haziran 2026 | 11 | Diğer takımların sunucularına dağıtım yapılabilen IDOR (CVE-2026-57498, 9,6); **kimlik doğrulamasız**, boş secret ile webhook HMAC atlatma (CVE-2026-41896, 7,5); kimliği doğrulanmış RCE'ler | `beta.461` – `beta.474` |
| Temmuz 2026 | 34 | Takım sınırını aşan klonlama (CVE-2026-34037, 9,9); terminal WebSocket yetki açığı (CVE-2026-34047/34048, 9,9); çok sayıda kimliği doğrulanmış host/root RCE (log drain, Sentinel token, volume adı, healthcheck, **PostgreSQL init betiği yol geçişi** CVE-2026-42200); CSRF ile parola sıfırlayıp hesap ele geçirme (CVE-2026-34171, 8,0) | `beta.464` – `beta.474` |

- **Toplam:** 61 danışmanlık; 16 kritik, 25 yüksek, 12 orta, 8 düşük [GH3].
- **Düzeltme durumu:** 57 danışmanlıkta düzeltilmiş sürüm `4.0.0-beta.474` ya da daha eski, yani
  v4.0.0 kararlı sürümünde (27 Nis 2026) kapalı. Kalan 4'ünde alan boş. Danışmanlıklar
  düzeltmeden aylar sonra toplu olarak yayımlanmış (ör. Temmuz partisindeki düzeltmeler Mart–Nisan
  betalarında). Bazı kayıtların sürüm alanları da tutarsız; örneğin "vulnerable: v4.0.0, patched:
  ≥ beta.469" yazan kayıt var.
- **Saldırı yüzeyi:** Açıkların çoğu oturum açmış (çoğu zaman düşük yetkili) bir takım üyesi
  gerektiriyor. Tek kullanıcılı bir kurulumda risk daha düşük, ama kimlik doğrulamasız ve CSRF ile
  istismar edilebilen kayıtlar da var (CVE-2026-41896, CVE-2026-41899, CVE-2026-34171).
- **Kararlı sürüm sonrası (Ekim 2026), bağımlılık kaynaklı:** v4.4.7 sürüm notu "fixes multiple
  critical CVEs in dependencies" diyor ve şunları sayıyor [GH4]:
  - PHP 8.4.27: "PHP2Shell", CVE-2026-109618 ve CVE-2026-109619.
  - Sentinel 1.1.2: CVE-2026-111943.
  - cloudflared: eMudhra sertifika ihlali.

  Bu düzeltmeler v4.0.1, v4.1.3, v4.2.1 ve v4.3.24 olarak eski hatlara da backport edildi; eski
  hatlar için `patch.sh` betiği verildi [GH4].
- **v4.5.0'daki ek sertleştirme** [GH10]: açık metin secret'lar artık diskte şifreli; dağıtım
  sorguları takımla sınırlandı; MCP uç noktası izinli IP'leri uyguluyor; güncellemeden önce
  Coolify veritabanı otomatik yedekleniyor; sunucular için otomatik güvenlik yaması (beta)
  eklendi.

**Güncelleme mekanizması** [CO8][GH5]:

- **Otomatik:** Settings → Updates → "Automatic updates". Migration'da `is_auto_update_enabled`
  varsayılanı `true`, yani yeni kurulumda açık [GH5]. "Update frequency" varsayılanı `0 0 * * *`
  (günlük); "Check frequency" saatlik olarak `cdn.coollabs.io/coolify/versions.json` dosyasını
  okuyor. `/data/coolify/source/.env` içinde `AUTOUPDATE` tanımlıysa panel ayarı kilitleniyor.
- **Panelden:** "Upgrade Now"; panel genellikle bir dakikadan kısa süre kapalı kalıyor; o sırada
  süren dağıtımlar başarısız olabiliyor.
- **Terminalden:** `curl -fsSL https://cdn.coollabs.io/coolify/upgrade.sh | bash -s <sürüm>`.
  Belge, mevcut kurulumda `install.sh` kullanılmamasını (izinleri sıfırlıyor) ve sürümün
  boş bırakılmamasını istiyor.
- **Sürüm düşürme:** Yalnızca terminalden; önce otomatik güncellemeyi kapatmak gerekiyor.
- Güncelleme yalnızca Coolify'ı yeniliyor; uygulama, veritabanı ve sunucu paketleri ayrı [CO8].
- Gerileme örneği: v4.5.1, mevcut uygulamaların Dockerfile `HEALTHCHECK`'ini Coolify'ın kendi
  healthcheck'iyle değiştirdi; v4.5.3 bunu geri aldı [GH1].

### 4. Node API + statik SPA, tek alan adı

**(a) Node TypeScript API (GitHub, push'ta otomatik dağıtım)**

- **Derleme yöntemleri** [CO11]: Nixpacks, Railpack (Beta), Static, Dockerfile, Docker Compose.
  Repo'da tek bir `Dockerfile` varsa en öngörülebilir yol Dockerfile.
- **Nixpacks:** "maintenance mode"da. Railway geliştirmeyi bıraktı ve Railpack'i öneriyor;
  Coolify Nixpacks'i hâlâ destekliyor, ama Railpack'i "Beta" olarak etiketliyor [CO12].
- **Push'ta dağıtım** [CO13]:
  - GitHub App ile bağlanan repoda **Advanced → Deployment → "Deploy on push (webhooks)"**;
    webhook'u entegrasyon kendisi kuruyor.
  - Herkese açık repo ya da deploy key kullanılıyorsa manuel webhook ve secret gerekiyor. Bkz.
    CVE-2026-41896: secret boşken HMAC atlatılabiliyordu.
  - Alternatif: CI'da test edip Coolify'ın kimlik doğrulamalı deploy webhook'unu çağırmak.
- **Derlemenin yeri:** Varsayılan olarak dağıtım sunucusunda [CO11]. 4 GB'lık sunucuda derleme
  RAM'i yükseltebilir [CO1]. Ayrı bir build sunucusu ya da önceden derlenmiş imaj (Docker Image
  dağıtımı) seçenekleri var [CO11].

**(b) Önceden derlenmiş SPA (`dist/`)** [CO14]:

- **Static** derleme yöntemi, **repoda hazır duran** dosyaları Nginx imajına paketliyor; derleme
  komutu çalıştırmıyor. Base Directory `/dist` gibi bir yola ayarlanıyor.
- `dist/` repoya commit edilmeyecekse iki seçenek var: Nixpacks/Railpack'te "Site type: Static" +
  "Publish Directory", ya da Dockerfile ile çok aşamalı derleme (`npx expo export -p web` → Nginx).
- **SPA fallback** (bilinmeyen yolun `index.html`'e düşmesi) için Nginx yapılandırmasının
  General'da üretilip düzenlenmesi gerekiyor. Değişiklik imaj derlenirken kopyalandığından
  yeniden dağıtım şart [CO14].

**Yol tabanlı yönlendirme** [CO9][GH8]:

- **Destekleniyor.** Belge: "add a path to share one hostname between resources"; örnek olarak
  bir uygulama `https://example.com`, diğeri `https://example.com/api`. "More specific paths take
  priority over the root route" [CO9].
- Kurulum: SPA'ya `https://homelibra.<alan>`, API'ye `https://homelibra.<alan>/api` (gerekirse
  `:3000/api` ile konteyner portu) girilir.
- **Önek silme:** Varsayılan olarak `/api/users` isteği API'ye `/users` olarak gidiyor. API
  `/api/...` bekliyorsa **Advanced → Proxy → "Keep paths as-is"** seçilir [CO9].
- **Traefik etiketleri:** Elle yazmak gerekmiyor. Coolify `bootstrap/helpers/docker.php` içinde
  şunları üretiyor [GH8]:
  - `traefik.http.routers.<id>.rule=Host(...) && PathPrefix(`/api`)`
  - önek silme açıksa `traefik.http.middlewares.<id>-stripprefix.stripprefix.prefixes=/api`
  - HTTPS router için `tls.certresolver=letsencrypt` (varsayılan; v4.5.0'dan beri sunucu ve
    kaynak bazında değiştirilebiliyor [GH10]).

  "Container labels → Label management" elle yönetime de alınabiliyor [CO9].
- **Let's Encrypt:** `https://` ile girilen alan adında otomatik; "Traefik or Caddy requests and
  renews the certificate". Alan adının sunucuya çözülmesi ve 80/443'ün açık olması şart [CO9].
  Wildcard sertifika için DNS challenge rehberi var.
- **Uyarı:** Belge, kök route'un yedek (fallback) davranışına güvenilmemesini istiyor: aynı alan
  adını paylaşan her kaynak çalışır ve sağlıklı tutulmalı [CO9].

### 5. Türkiye'de S3 uyumlu nesne depolama

| Sağlayıcı | Bulgu | S3 uyumlu? | Fiyat | Kaynak |
|---|---|---|---|---|
| Radore | Site haritasındaki hizmetler: colocation, dedicated, cloud server, backup, DR, managed vb. **Nesne depolama ürünü yok.** "Yedekleme" hizmeti "BACKUP ve ExaGrid teknolojileriyle"; S3 uç noktası anılmıyor | Hayır (bulunamadı) | Yedek sayfasında fiyat yok | [RD3][RD4] |
| Turhost | Site haritasında ve menüde nesne depolama yok; yedek seçeneği VPS'e eklenen Acronis Backup | Hayır (bulunamadı) | — | [TH1][TH3] |
| Natro | Site haritasında (161 URL) nesne depolama ürünü yok | Hayır (bulunamadı) | — | [NT1] |
| Turkcell | **nDepo:** "Nesne Tabanlı Depolama", "çok kiracılı ve paylaşımlı" altyapı, "Uzun süreli arşivleme hizmeti", "2 farklı veri merkezinde". Sayfada S3/API ifadesi **yok** | **Belirsiz** | "Teklifler için Kurumsal Müşteri Temsilciniz"; yalnızca kurumsal müşteri | [TC1] |
| Türk Telekom | **Depolama:** bulut sunucuya eklenen blok disk; SATA 0,50 TL/GB/ay, SSD 1,60 TL/GB/ay (12 ay taahhüt), İstanbul/Ankara. **Buluta Yedekleme:** VMware/Hyper-V imaj tabanlı yedek, AES-256, aylık 190 TL'den. İkisi de S3 değil | Hayır | yanda | [TT1][TT2] |
| Huawei Cloud (ek) | OBS bir nesne depolama ürünü; TR-Istanbul bölgesi var, ama OBS'nin orada sunulup sunulmadığı ve uç noktası doğrulanamadı | Belirsiz | Okunmadı | [HW1] |

- **Sonuç:** Beş Türk sağlayıcının hiçbirinde self-servis, fiyatı açık, S3 uyumlu nesne depolama
  bulunamadı.
- **Alternatif:** İkinci küçük bir Türk VPS'te S3 uyumlu sunucu çalıştırmak.
  - **MinIO:** `minio/minio` deposu **arşivlendi**; README "THIS REPOSITORY IS NO LONGER
    MAINTAINED" diyor ve ticari AIStor sürümlerine yönlendiriyor [S3-1]. Coolify MinIO'yu
    destekli listede tutuyor [CO10], ama topluluk sürümü artık güncellenmiyor.
  - **Garage:** En son sürüm v2.5.0 (24 Eki 2026), Docker imajı `dxflrs/garage` [S3-2]. Coolify'ın
    `mc` istemcisiyle çalışıp çalışmadığı belgelenmemiş → **belirsiz**; prototiple denenmeli.

### 6. Radore ve Turhost: 2 vCPU / 4 GB

| | Radore Disk-Advance | Radore CPU-Advance | Turhost VPS TR 2 |
|---|---|---|---|
| CPU / RAM / disk | 2 çekirdek 2,70 GHz / 4 GB DDR4 / **200 GB NVMe** | 4 çekirdek / 4 GB / 100 GB NVMe | 2 vCPU / 4 GB / **40 GB SSD**; 100 Mbit, 1000 GB/ay |
| Aylık fiyat | **$17,0, KDV hariç** | $17,0, KDV hariç | Liste **$40,21, KDV hariç**. Ürün sayfası "$9.99 / İLK 3 AY" diyor; yapılandırıcı ise 1 ay $18,99, 3 ay $17,99/ay, 6 ay $15,99/ay, **12 ay peşin $9,99/ay ($119,88)** gösteriyor. Kampanya koşulu sayfalar arasında tutarsız |
| Ubuntu 24.04 | **Var:** yapılandırıcıda "Ubuntu 24.04.3 LTS", $0. Diğerleri: Ubuntu 22.04.3, Alma 9/10, Rocky 8/9 | aynı | **Var:** yapılandırıcıda "Ubuntu 24.04", ücretsiz. Diğerleri: 22.04, Debian 11/12, AlmaLinux 8/9, CloudLinux (ücretli) |
| Root erişimi | **Belirsiz:** ürün sayfasında ve yapılandırıcıda geçmiyor | aynı | **Kısmen:** VPS Plus ve VPS TR sekmelerini birlikte gösteren "Sanal Sunucu" sayfası "Full Root Yetkisi … Tüm paketlerde" diyor; VPS TR sayfası root'u ayrıca anmıyor |
| Yedek | **Ücretli eklenti.** Yapılandırıcıda Haftalık $0,04/GB, Aylık $0,05/GB, Yıllık $0,06/GB seçenekleri var. Haftalık seçilince 200 GB disk için 400 GB yedek alanı = $16 + lisans $10 = **$26/ay**. "Haftalık/Aylık/Yıllık"ın sıklık mı saklama süresi mi olduğu **belirsiz** | aynı mantık | **Dahil:** "günlük yedekleri alınır ve 30 gün boyunca Zaman Makinesi altyapısında saklanır". Ek olarak Acronis Backup: 250 GB/30 gün $25,76/ay, 500 GB $45,08/ay |
| Snapshot | **Belirsiz** (sayfada yok) | aynı | **Muhtemelen yok / belirsiz:** VPS TR SSS'si snapshot'ı VPS Plus'ın (Avrupa lokasyonlu) VPS TR'den farkı olarak sayıyor |
| Veri merkezi | Radore veri merkezi; KVKK sayfası "%100 Türkiye içinde" diyor (bkz. önceki belge) | aynı | Türk Telekom İstanbul Gayrettepe |
| Kaynak | [RD1][RD2] | [RD1] | [TH1][TH2] |

- **Coolify uyumu.** İki sağlayıcı da Ubuntu 24.04 LTS sunuyor; işletim sistemi açısından uyumlu
  [CO1].
- **Turhost'ta disk dar.** 40 GB, `install.sh`'nin 30 GB toplam / 20 GB boş disk eşiğinin
  üstünde [GH6], ama Docker imajları ve yerel yedeklerle sıkışabilir.
- **Radore'da root belirsiz.** Coolify root ya da sudo yetkili SSH istiyor [CO1]; Radore'de bu
  sipariş öncesi yazılı olarak teyit edilmeli.

### 7. Expo OTA güncellemelerini self-host etmek

`expo/custom-expo-updates-server` Expo organizasyonuna ait, MIT lisanslı ve arşivlenmemiş bir
depo. Açıklaması "A simplified demonstration of expo-updates protocol use" [EX1]. README açıkça
şunu söylüyor: "It is not guaranteed to be complete, stable, or performant enough to use as a
full-fledged backend for expo-updates"; Expo özel sunuculara uygulamalı destek vermiyor, yeni
özellik PR'ları kapatılıyor [EX1]. Son commit'ler Eylül 2025'te istemciyi **SDK 54**'e taşıyor;
SDK 58 için güncellenmemiş [EX1]. Protokol "Expo Updates v1" adlı spesifikasyon (sayfanın
`modificationDate` alanı 12 Ağustos 2026). RFC 2119 normatif diliyle yazılmış; hedef kitlesi
EAS ve "organizations that wish to manage their own update server"; `expo-protocol-version`
değeri "MUST be `1`" [EX2]. Sayfada "stable" ya da "draft" etiketi yok, yani **resmî kararlılık
etiketi belirsiz**. Ancak SDK 58 dalındaki `expo-updates` 58.0.19, Android'de istek başlığına
`Expo-Protocol-Version: 1` yazıyor [EX4]. `expo-updates` referansı (v58.0.0) da kütüphanenin
"a custom server" ile kullanılabileceğini ve uzak servisin bu protokolü uygulaması gerektiğini
söylüyor [EX3]. Manifest/directive kod imzalama da protokolde tanımlı [EX2]. Sonuç: protokol
SDK 58'de v1 olarak geçerli ve belgelenmiş, ama referans sunucu üretime hazır bir ürün değil,
yalnızca bir örnek. Bunu Coolify'da çalıştırmak, `kvkk-hosting-providers.md` "Açık sorular" 7'deki
EAS Update → ABD aktarımı sorusunu ortadan kaldırır; karşılığında güncelleme sunucusunu
(runtime version eşleme, asset sunumu, imzalama anahtarı) kendin yazıp işletmen gerekir.

## Öneri

Bu bir bilgi derlemesi; seçim ürün sahibinindir.

1. **Ana sunucu: Radore Disk-Advance** (2 çekirdek / 4 GB / 200 GB NVMe, $17/ay KDV hariç, Ubuntu
   24.04.3 LTS).
   - Gerekçe: Turhost VPS TR 2'nin liste fiyatının yarısından az; disk 5 kat büyük.
   - Sipariş öncesi Radore'den yazılı olarak sorulmalı: root/sudo SSH ve snapshot var mı?
   - Turhost VPS TR 2 daha pahalı ($40,21 liste) ve disk 40 GB, ama 30 günlük günlük yedek dahil.
     Radore'de yedek ayrıca ~$26/ay.
2. **Coolify v4.5.x.** Coolify, Traefik, Postgres, API ve SPA aynı sunucuda. 4 GB'lık kutuda
   derleme belleğini azaltmak için API imajı GitHub Actions'ta derlenip Coolify'a Docker Image ya
   da deploy webhook ile verilebilir [CO11][CO13]. İmajda kişisel veri olmadığı sürece registry'nin
   yurt dışında olması m.9 açısından ayrı bir konu değil; bu belgede hukuken değerlendirilmedi.
3. **Güvenlik.** Danışmanlık sayısı yüksek: son 18 ayda 16 kritik. Bu yüzden:
   - Otomatik güncelleme açık kalmalı (varsayılan zaten açık).
   - Güncellemeden önce instance yedeği alınmalı.
   - `coollabsio/coolify` güvenlik danışmanlıkları izlenmeli.
   - Tek kullanıcılı kurulumda takım üyesi açılmamalı; çoğu açık düşük yetkili üye gerektiriyor.
   - Webhook secret'ı boş bırakılmamalı.
4. **Yönlendirme.**
   - SPA: Static derleme + Nginx SPA fallback.
   - API: `https://<alan>/api` yol route'u; API kodu `/api` önekine göre yazılıyorsa "Keep paths
     as-is".
   - TLS: Let's Encrypt otomatik.
5. **Yedek.**
   - Coolify'ın zamanlanmış `pg_dump` yedeği (günlük, yerel saklama örn. 7 gün) açılmalı.
   - Off-site kopya: Türk sağlayıcılarda S3 olmadığı için **ikinci sağlayıcıda** küçük bir VPS
     (ör. Turhost VPS TR 1 ya da Radore Disk-Core $8,5) + **Garage** (MinIO deposu arşivlendi).
   - Coolify yedeği şifrelemiyor: şifreli off-site için ayrı bir zamanlanmış görev
     (`age`/`gpg` ile şifreleyip gönderme) ya da hedefte disk şifrelemesi gerekir. Geri yükleme
     belge gereği düzenli denenmeli [CO6].
6. **OTA.** MVP'de EAS Update yerine self-host OTA zorunlu değil; ama EAS'ın IP işleme sorusu
   (önceki belge, açık soru 7) olumsuz çıkarsa `custom-expo-updates-server` bir başlangıç
   noktası olabilir. Üretime hazır değil, SDK 58'e güncellenmesi gerekiyor.

## Açık sorular

1. **Radore:** Cloud Server'da root/sudo SSH ve snapshot var mı? Yedek eklentisindeki
   "Haftalık/Aylık/Yıllık" sıklığı mı saklama süresini mi gösteriyor? Yedekler hangi veri
   merkezinde tutuluyor? Sayfada yok [RD1][RD2].
2. **Turhost:** VPS TR'de snapshot var mı? Root açıkça veriliyor mu? Kampanya fiyatı "ilk 3 ay"
   mı, "12 ay peşin" mi? Ürün sayfası ile yapılandırıcı çelişiyor [TH1][TH2].
3. **Coolify'ın bellek yükü:** Resmî rakam yok. Boş bir Ubuntu 24.04 + Coolify + Traefik + Postgres
   kurulumunda `docker stats` ile ölçülmeli.
4. **Garage + Coolify:** Coolify'ın `mc` ile yüklemesi ve "Validate Connection" adımı Garage'la
   çalışıyor mu? Listede yok [CO10].
5. **Turkcell nDepo:** S3 API sunuyor mu, bireysel/şahıs işletmesine satılıyor mu? Sayfada
   yok [TC1]. **Huawei OBS TR-Istanbul:** Var mı, sözleşme tarafı kim [HW1]?
6. **Danışmanlık kayıtları:** CVE-2025-64420/64421/64423/64424'te düzeltilmiş sürüm alanı boş.
   Etkilenen aralık ≤ `beta.434`, yani v4.0.0'da kapalı olmaları beklenir, ama kayıtta
   yazmıyor [GH3].
7. **Coolify'ın dışarıyla konuşması:** Sürüm kontrolü `cdn.coollabs.io`'ya gidiyor [CO8].
   Coolify'ın başka telemetri gönderip göndermediği bu belgede incelenmedi.
8. **Expo protokolü:** "Expo Updates v1" için resmî bir kararlılık ya da sürümleme politikası
   yayımlanmış mı? Spesifikasyon sayfasında yok [EX2].

## Kaynaklar

Coolify belgeleri (coolify.io/docs; kaynak: `coollabsio/coolify-docs`, commit 5d951ba, 2026-10-29)
- [CO1] Start with Self-hosted (gereksinimler, işletim sistemi, örnek üretim kurulumu): https://coolify.io/docs/start-with-self-hosted
- [CO2] How Coolify works (konteynerler): https://coolify.io/docs/core/how-coolify-works
- [CO3] Custom proxy: NGINX (Traefik/Caddy/NGINX bellek ölçümü): https://coolify.io/docs/core/networking/proxy/custom/nginx
- [CO4] PostgreSQL: https://coolify.io/docs/databases/postgresql
- [CO5] Database General settings (Image alanı): https://coolify.io/docs/databases/configuration/general
- [CO6] Database Backups: https://coolify.io/docs/databases/backups
- [CO7] Restore a Database: https://coolify.io/docs/databases/restore
- [CO8] Update Coolify: https://coolify.io/docs/core/instance-management/update
- [CO9] Domains (yol, önek silme, HTTPS): https://coolify.io/docs/core/networking/domains — Proxy overview: https://coolify.io/docs/core/networking/proxy/overview
- [CO10] S3 Storage Overview: https://coolify.io/docs/core/s3-storage/overview
- [CO11] Build applications (overview): https://coolify.io/docs/applications/builds/overview
- [CO12] Nixpacks overview ("maintenance mode"): https://coolify.io/docs/applications/builds/nixpacks/overview
- [CO13] Automatic Deployments: https://coolify.io/docs/applications/deployments/automatic-deployments
- [CO14] Static build pack: https://coolify.io/docs/applications/builds/static

Coolify GitHub (`coollabsio/coolify`)
- [GH1] Releases (v4.5.3, 2026-10-28; v4.5.1 healthcheck gerilemesi): https://github.com/coollabsio/coolify/releases
- [GH2] v4.0.0 sürüm notu (2026-04-27): https://github.com/coollabsio/coolify/releases/tag/v4.0.0
- [GH3] Security advisories: https://github.com/coollabsio/coolify/security/advisories (API: `gh api repos/coollabsio/coolify/security-advisories`)
- [GH4] v4.4.7 ve v4.0.1 sürüm notları (bağımlılık CVE'leri, backport): https://github.com/coollabsio/coolify/releases/tag/v4.4.7 · https://github.com/coollabsio/coolify/releases/tag/v4.0.1
- [GH5] `database/migrations/2023_03_20_112814_create_instance_settings_table.php` (`is_auto_update_enabled` varsayılanı `true`): https://github.com/coollabsio/coolify/blob/main/database/migrations/2023_03_20_112814_create_instance_settings_table.php
- [GH6] `scripts/install.sh` (disk eşikleri 30/20 GB): https://github.com/coollabsio/coolify/blob/main/scripts/install.sh
- [GH7] `app/Jobs/DatabaseBackupJob.php` (`mc cp` ile yükleme; içerik şifrelemesi yok): https://github.com/coollabsio/coolify/blob/main/app/Jobs/DatabaseBackupJob.php
- [GH8] `bootstrap/helpers/docker.php` (`fqdnLabelsForTraefik`: PathPrefix, stripprefix, certresolver): https://github.com/coollabsio/coolify/blob/main/bootstrap/helpers/docker.php
- [GH9] `docker-compose.yml` (coolify-db `postgres:15-alpine`, coolify-redis `redis:7-alpine`): https://github.com/coollabsio/coolify/blob/main/docker-compose.yml
- [GH10] v4.5.0 sürüm notu: https://github.com/coollabsio/coolify/releases/tag/v4.5.0

PostgreSQL imajı
- [PG1] docker-library/postgres, `18/alpine3.24/Dockerfile` (`make -C contrib install`): https://github.com/docker-library/postgres/blob/master/18/alpine3.24/Dockerfile

Türk sağlayıcılar (okuma 2026-10-29; fiyatlar o günkü)
- [RD1] Radore Cloud Server (plan tablosu, SSS): https://radore.com/tr/hizmetler/bulut-sunucu
- [RD2] Radore Cloud Server Configurator, Disk-Advance (işletim sistemi listesi, yedek fiyatı): https://radore.com/tr/cloud/CLOUD-DISK-OPTIMIZED-3097
- [RD3] Radore site haritası (hizmet listesi): https://www.radore.com/sitemap.xml
- [RD4] Radore Yedekleme: https://radore.com/tr/hizmetler/yedekleme
- [TH1] Turhost VPS TR (planlar, yedek, veri merkezi, SSS; yapılandırıcı aynı sayfada): https://www.turhost.com/sunucu/vps-tr-sunucu/
- [TH2] Turhost Sanal Sunucu (VPS Plus + VPS TR; "Full Root Yetkisi"): https://www.turhost.com/sunucu/sanal-sunucu/
- [TH3] Turhost site haritası: https://www.turhost.com/sitemap.xml
- [NT1] Natro site haritası (`category.xml`, `other.xml`): https://www.natro.com/sitemap.xml
- [TC1] Turkcell nDepo: https://www.turkcell.com.tr/kurumsal/dijital-is-servisleri/bulut-servisleri/turkcell-ndepo
- [TT1] Türk Telekom Bulut, Depolama: https://turktelekombulut.com/urunler/depolama
- [TT2] Türk Telekom Bulut, Buluta Yedekleme: https://turktelekombulut.com/urunler/buluta-yedekleme
- [HW1] Huawei Cloud OBS uç noktaları (TR-Istanbul doğrulanamadı): https://support.huaweicloud.com/intl/en-us/productdesc-obs/obs_03_0152.html

Nesne depolama yazılımı
- [S3-1] minio/minio README ("THIS REPOSITORY IS NO LONGER MAINTAINED"; depo arşivlendi): https://github.com/minio/minio
- [S3-2] Garage sürümleri (v2.5.0, 2026-10-24): https://git.deuxfleurs.fr/Deuxfleurs/garage/releases — indirme: https://garagehq.deuxfleurs.fr/download/

Expo
- [EX1] expo/custom-expo-updates-server (README, commit geçmişi, istemci `expo ^54.0.0`): https://github.com/expo/custom-expo-updates-server
- [EX2] Expo Updates v1 spesifikasyonu (modificationDate August 12, 2026): https://docs.expo.dev/technical-specs/expo-updates-1/
- [EX3] expo-updates referansı (v58.0.0; custom server): https://docs.expo.dev/versions/latest/sdk/updates/
- [EX4] expo/expo `sdk-58` dalı, `packages/expo-updates/android/.../loader/FileDownloader.kt` (`Expo-Protocol-Version: 1`) ve `package.json` (58.0.19): https://github.com/expo/expo/blob/sdk-58/packages/expo-updates/android/src/main/java/expo/modules/updates/loader/FileDownloader.kt
