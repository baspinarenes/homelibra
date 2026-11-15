# Expo başlangıç şablonları: Ignite ve Obytes, Homelibra'ya uyum

Araştırma tarihi: 2026-11-15. İlgili kararlar: ADR-0001 (tek Expo universal kod tabanı, her kütüphane web'de çalışmalı), ADR-0006 (kendi TypeScript API'miz), ADR-0008 (çevrimdışı Capture yalnızca telefondaki outbox).

## Soru

Homelibra kendi kurduğu bir Expo düzeniyle başladı. İki hazır başlangıç şablonundan birine geçmek (ya da parçalarını almak) mantıklı mı?

- **Ignite** (Infinite Red, `infinitered/ignite`)
- **Obytes React Native Template** (`obytes/react-native-template-obytes`)

Belirleyicilik sırasına göre alt sorular:

1. Bugün hangi Expo SDK ve React Native sürümünü hedefliyorlar? Geçmişte yeni bir SDK'yı ne kadar sürede aldılar? SDK 58'in gerisindeler mi?
2. Web destekli bir hedef mi? Varsayılan navigasyon, stil, depolama ve diğer kütüphaneler react-native-web altında çalışıyor mu?
3. Monorepo/workspace desteği var mı? Mevcut paketlerin, hoisted `node_modules`'un ve sınır kurallarının yanında `apps/app` olarak oturur mu?
4. Her konuda (yönlendirme, stil/UI kiti, durum, veri çekme, formlar/doğrulama, auth, i18n, depolama, ortam yapılandırması, testler, lint/format, CI, EAS, üreteçler/CLI, tema/karanlık mod) şablonun getirdiği ile Homelibra'da olan karşılaştırılınca sonuç çakışma mı, tekrar mı, gerçek kazanç mı?
5. Var olan bir uygulama için "şablona geçmek" mekanik olarak ne demek? Baştan oluşturup taşımak mı, parça almak mı? Ignite üreteçleri gibi araçlar şablonu benimsemeden kullanılabilir mi? Kaba maliyet ne?
6. Bakım sinyalleri neler: son sürüm, sürüm sıklığı, lisans, bakımcılar, issue/PR hareketi?

## Yöntem

- Yalnızca birincil kaynaklar okundu: iki upstream depo (`gh api` ve `raw.githubusercontent.com`) ve depolardaki resmi doküman kaynakları. Ignite dokümanı `infinitered/ignite` deposunun `docs/` klasöründen alındı (docs.infinite.red buradan üretilir). Infinite Red'in ayrı `infinitered/ignite-cookbook` deposu yalnızca monorepo ve Expo Router tarifleri için kullanıldı. Obytes dokümanı `docs/src/content/docs/` klasöründen alındı (starter.obytes.com buradan üretilir).
- Sürüm iddiaları dosyalardan alındı:
  - Ignite: son sürüm etiketi `v11.5.0` (`a0464bf`). `boilerplate/package.json` bu etikette ve `master`'da (`9433d3e`) birebir aynı. Geçmiş tablodaki her etiketin `expo` sürümü o etiketteki `boilerplate/package.json`'dan okundu. Örneğin v9.4.6'da `^49.0.21`, v9.5.0'da `^50.0.0`, v10.5.3'te `^52.0.44`, v11.0.0'da `^53.0.15` [1][5].
  - Obytes: son sürüm etiketi `v9.0.0` (`a8ded50`). CLI bu etiketi klonlar [38]. Yapılandırma dosyaları `master` (`fd9b358`) üzerinden okundu. `package.json` `master` ile `v9.0.0`'da birebir aynı.
- Expo SDK çıkış tarihleri expo.dev/changelog duyurularındaki `datePublished` alanından alındı [48–56]. npm kayıt defterinde `expo@58.0.0` duyurudan önce, 29 Eylül 2026'da yayımlanmış görünüyor [66]. Tutarlılık için her SDK'da duyuru tarihi kullanıldı.
- Benimseme gecikmesi şöyle ölçüldü: SDK duyurusundan, o SDK'yı içeren ilk **sürüm etiketine** kadar geçen gün sayısı. CLI'lar kullanıcıya bu etiketi verir. Commit tarihi farklıysa ayrıca yazıldı.
- Kütüphanelerin web desteği şablon depolarında yazmıyorsa, o kütüphanenin kendi deposundaki README'den, şablonun sabitlediği sürümde okundu [57–62].
- Homelibra tarafı yerel dosyalardan okundu [67–80]. Bunlar Kaynaklar'da depo köküne göre yol olarak listelendi.
- Her iddianın yanında `[n]` kaynak numarası var.
- **Varsayımlar:**
  1. Hiçbir şablon çalıştırılmadı ya da oluşturulmadı. Web davranışı ve üreteç uyumu kaynak koddan çıkarıldı. "doğrulanmalı" notlu satırlar deneme ister.
  2. Açık PR açıklamaları (Ignite #3038, #3046; Obytes #543) birer öneridir, yayımlanmış durum değildir. Bunlardan gelen bilgi "açık PR'a göre" diye işaretlendi.
  3. Göç maliyeti ölçüm değil tahmindir. Dayanağı şu ölçümdür: `apps/app/src` altında 106 `.ts/.tsx` dosyası, yaklaşık 10,7 bin satır, ayrıca `packages/` altında 126 dosya.

## Bulgular

### 1. Hedeflenen Expo SDK ve React Native: iki şablon da SDK 58'in gerisinde

| | Expo SDK | React Native | React | Yönlendirme | TypeScript | Kaynak dosya |
|---|---|---|---|---|---|---|
| **Homelibra** | `~58.0.21` | `0.88.1` | `19.3.0` | `expo-router ~58.0.28` | `~6.0.3` | `apps/app/package.json` [67] |
| **Ignite v11.5.0** | `55.0.5` (tam sabit) | `0.83.2` | `19.2.0` | React Navigation 7 (deneysel seçenek: `expo-router ~55.0.4`) | `~5.9.2` | `boilerplate/package.json` [1], `src/commands/new.ts` [4] |
| **Obytes v9.0.0** | `~54.0.32` | `0.81.5` | `19.1.0` | `expo-router ~6.0.22` | `^5.9.3` | `package.json` [28] |

- **Ignite üç SDK geride (56, 57, 58).** SDK 55'e geçiş 10 Mart 2026'da birleşti [6] ve v11.5.0 olarak 18 Mart 2026'da yayımlandı [5]. O tarihten beri `master`'a giren iki commit (30 Nisan, 11 Kasım) yalnızca doküman [6].
  - SDK 56 PR'ı (#3038) bir bakımcı tarafından 6 Haziran 2026'da açıldı. 8 Haziran'da üç onay aldı ama hâlâ birleşmedi [7].
  - Bir dış katkıcının SDK 57 PR'ı (#3046, açık PR'a göre RN 0.86.3) 10 Ekim'den beri incelemesiz duruyor [8].
  - Xcode 27'de demo uygulamanın açılmadığını bildiren issue (#3045) açık [9].
- **Obytes dört SDK geride (55, 56, 57, 58).** v9.0.0 SDK 54'tür [28]. SDK 55 ve 56 hiç alınmadı [35][36].
  - SDK 57'ye geçen v10 PR'ı (#543) 8 Ekim 2026'da açıldı ve 14 Ekim'de bir onay aldı, ama birleşmedi [37].
  - Açık PR'a göre v10 ayrıca pnpm yerine Bun'u zorunlu kılıyor ("The install guard rejects pnpm") ve TypeScript 6'ya geçiyor [37].
- SDK 58'in gerisinde olmak tek başına zayıf bir sinyal, çünkü SDK 58 bir aylık. Güçlü sinyal şu: iki şablon da yaz aylarında çıkan SDK 56 ve 57'yi yayımlamadı.

**Geçmiş benimseme gecikmesi (SDK duyurusu → o SDK'yı içeren ilk sürüm etiketi):**

| Expo SDK (duyuru) | Ignite | Gecikme | Obytes | Gecikme |
|---|---|---|---|---|
| 50 (2024-01-18) [48] | v9.5.0, 2024-02-09 [5][6] | 22 gün | v5.0.0, 2024-03-04 (önceki v4.3.0 SDK 49) [35][63] | 46 gün |
| 51 (2024-05-07) [49] | v9.7.0, 2024-05-29 [5][6] | 22 gün | v6.0.0, 2024-06-10 (commit 2024-05-20) [35][36] | 34 gün |
| 52 (2024-11-12) [50] | v10.1.0, 2024-12-10 [5][6] | 28 gün | v7.0.0, 2024-11-14 [35][36] | 2 gün |
| 53 (2025-04-30) [51] | v11.0.0, 2025-07-02 [5][6] | 63 gün | v8.0.0, 2025-06-27 (commit 2025-06-16) [35][36] | 58 gün |
| 54 (2025-09-10) [52] | v11.2.0, 2025-10-04 [5][6] | 24 gün | v9.0.0, 2026-01-27 [35] | 139 gün |
| 55 (2026-02-25) [53] | v11.5.0, 2026-03-18 (commit 2026-03-10) [5][6] | 21 gün | alınmadı | — |
| 56 (2026-05-21) [54] | yok; PR #3038 onaylı, birleşmedi [7] | 178+ gün | alınmadı | — |
| 57 (2026-06-30) [55] | yok; PR #3046 açık [8] | 138+ gün | yok; PR #543 açık [37] | 138+ gün |
| 58 (2026-10-15) [56] | yok | 31+ gün | yok | 31+ gün |

- Ignite 2024–2026 arasında SDK'ları genelde 3–4 hafta içinde aldı. Tek istisna 63 günle SDK 53. Bu ritim SDK 56'da durdu [5][7].
- Obytes'ın gecikmesi düzensiz (2 ile 139 gün arası) ve SDK atlıyor [35].
- 2026'da Expo dört SDK çıkardı (55, 56, 57, 58) [53–56]. İki şablon da bu hıza yetişmedi.
- **Sonuç:** İkisinden birini bugün benimsemek Homelibra için **sürüm düşürmek** demek. Düşüşler şöyle:
  - SDK 58 → 55/54
  - RN 0.88 → 0.83/0.81
  - React 19.3 → 19.2/19.1
  - TypeScript 6 → 5.9
  - i18next 26 → 23 (Ignite) / 25 (Obytes)

  Alternatifi şablonu üç-dört SDK kendimiz yükseltmek [1][28].

### 2. Web desteği: beyan var, CI'da test yok, çalışma zamanı doğrulanmalı

| | Ignite v11.5.0 | Obytes v9.0.0 |
|---|---|---|
| Beyan | Guide: "Supports Expo (and Expo web) out of the box" [10]. Expo Go desteği v10'da bırakıldı, dev client gerekir [20]. QuickStart `pnpm run web` gösterir [11]. | Doküman web'i hedef platform olarak hiç anmıyor. Overview özellik listesinde web yok [39]. Doküman sayfalarında "web" yalnızca Tailwind'in web kökeni ve React Query geliştirici aracının web arayüzü bağlamında geçiyor [42][81]. |
| Yapı | `web`, `bundle:web` (`expo export --platform web`), `serve:web` betikleri. `react-native-web ~0.21.0`, `react-dom 19.2.0`. `app.json` → `web.bundler: "metro"` [1][2]. | `web` betiği. `react-native-web ~0.21.2`, `react-dom 19.1.0`. `web.bundler: "metro"`, `web.output` ayarlanmamış [29]. Web'e özel `src/app/+html.tsx` kök HTML dosyası var [28][44]. |
| Platforma özel kod | `devtools/ReactotronClient.web.ts`, `utils/gestureHandler.native.ts` dosyaları var [1] (dosya ağacı). | `i18n/utils.tsx` dil değişince web'de `window.location.reload()`, native'de `RNRestart.restart()` çağırır [45]. |
| CI'da web | Şablon üretilen uygulamaya CI vermez. Ignite'ın kendi CircleCI'ı format, lint, typecheck, depcruise ve Jest çalıştırır. Web derleme adımı yok [24]. | Workflow'lar: jest, eslint, tsc, expo-doctor, EAS build, Android E2E (Maestro). Web derleyen bir workflow yok [34]. |

Varsayılan kütüphanelerin web durumu:

| Kütüphane | Şablon | Web durumu |
|---|---|---|
| `react-native-mmkv` 3.3.3 / 4.1.1 | Ignite / Obytes (depolama) [21][46] | README: "iOS, Android and Web support". Web'de LocalStorage ya da bellek içi depolama [57][58]. |
| `@gorhom/bottom-sheet` 5 | Obytes | README: "Support React Native Web" [59]. |
| `react-native-restart` | Obytes | README platform tablosu yalnızca iOS, Android, Windows [60]. Modül en üstte import ediliyor, çağrı `Platform.OS` ile korunuyor [45]. Web paketlemesinde sorun çıkarıp çıkarmadığı doğrulanmalı. |
| Uniwind 1.x | Obytes (stil) | Kaynak ağacında `packages/uniwind/src/components/web/*` var [61]. Web desteği resmi dokümandan okunmadı, doğrulanmalı. |
| `react-native-keyboard-controller` | ikisi de | README yalnızca iOS ve Android'den söz ediyor [62]. Web'de no-op olup olmadığı doğrulanmalı. |
| React Navigation 7, `react-native-drawer-layout` | Ignite (yönlendirme) | Bu araştırmada okunmadı, doğrulanmalı. |
| `moti`, `react-native-flash-message`, FlashList 2.0.2 | Obytes | Bu araştırmada doğrulanmadı. |

- **Değerlendirme:** İki şablon da web'i paketleyecek kadar kurulu. Ancak web, ikisi için de CI'da sınanan birinci sınıf bir hedef değil.
- Bu durum ADR-0001'in "her kütüphane web'de çalışmalı" kuralı için yeni bir güvence getirmiyor. Homelibra zaten web'i `homelibra-web` Docker imajı olarak CI'da derleyip yayımlıyor [71], yani bu açıdan şablonlardan ileride.

### 3. Monorepo uyumu: ikisi de tek uygulamalı ve depo kökünü varsayıyor

- **Ignite:**
  - CLI tek proje oluşturur. pnpm seçilirse `.npmrc`'ye `node-linker=hoisted` ekler [4]. Bu, Homelibra'nın `nodeLinker: hoisted` ayarıyla uyumlu [69].
  - Şablon kökte kendi `.eslintrc.js` (ESLint 8, eski biçim), `.prettierrc` ve `.dependency-cruiser.js` dosyalarını getirir [1]. Dependency-cruiser yalnızca `app` klasörünü tarar (`depcruise app`).
  - Şablonun dependency-cruiser kuralları genel hijyen kuralları: `no-circular` (uyarı), `no-orphans`, `not-to-dev-dep`, `not-to-unresolvable`. Paket giriş noktası sınırı yok [22]. Homelibra'nın giriş noktası kurallarını karşılamaz [76].
  - Monorepo için Infinite Red'in ayrı cookbook deposunda bir tarif var: "Setting up a Yarn monorepo with Ignite", 2024-08-22 tarihli, Yarn 3.8 için. Yarn'ı önerir, pnpm'i değil [26].
- **Obytes:**
  - CLI son sürüm etiketini `git clone` eder. Ardından `.git`, `README.md`, `ios`, `android`, `docs`, `cli` ve `LICENSE`'ı siler [38].
  - Kalanlar kökte olduğunu varsayan dosyalar: `.github/workflows` (13 workflow), `.husky`, `commitlint.config.js`, `pnpm-lock.yaml`, `.npmrc` (`node-linker=hoisted`, `auto-install-peers=true`), `packageManager: pnpm@10.12.3` ve `preinstall: npx only-allow pnpm` [28][32][34].
  - Homelibra pnpm 11.8.0 kullanıyor [70].
  - Açık PR'a göre v10 Bun'a geçip pnpm'i reddedecek. Bu, Homelibra'nın pnpm workspace'iyle doğrudan çakışır [37].
- **Ortak:** İki şablonun dokümanında da workspace, monorepo ya da var olan pakete bağlanma bölümü yok [10][39].
- **Uyum maliyeti:** `apps/app` olarak oturtmak için şunlar gerekir:
  - kök dosyaları (ESLint, Prettier, husky, lockfile, CI) Homelibra'nınkilerle birleştirmek ya da silmek;
  - `@/` takma adlarını Homelibra'nın `tsconfig`'iyle uzlaştırmak;
  - şablonun kendi bileşen ve tema klasörlerini `@homelibra/ui` ile değiştirmek.

  Bunlar şablonun kendi verdiklerinin büyük kısmını geri almak demek (türetilmiş çıkarım).

### 4. Konu bazında uyum tablosu

Sonuç sütunundaki kısaltmalar: **Ç** çakışma, **T** tekrar (Homelibra'da zaten var), **K** gerçek kazanç, **—** yok veya önemsiz.

| Konu | Homelibra bugün | Ignite v11.5.0 | Obytes v9.0.0 | Sonuç |
|---|---|---|---|---|
| **Yönlendirme** | `expo-router ~58`, `typedRoutes`, web'de `asyncRoutes` [67][68] | React Navigation 7 (bottom-tabs, native-stack, drawer) [1]. Expo Router "[Experimental]" seçenek. Seçilince demo uygulama silinir ve kod `src/app` altına yazılır [4][23]. Demo uygulamayı Expo Router'a çeviren ayrı bir cookbook tarifi var [27]. Generator'lar `app/navigators`'a React Navigation navigator yazar [12]. | `expo-router ~6` (SDK 54), `typedRoutes` [28][29] | Ignite: **Ç** (farklı router). Obytes: **T** (aynı router, eski sürüm). |
| **Stil / UI kiti** | Kendi kiti `@homelibra/ui` (theme, text, button, sheet, dialog, toast, switch… 21 giriş noktası). Tailwind yok. [67][77] | `StyleSheet.create` yerine `$` önekli düz nesneler ve `themed()`, `preset` destekli yaklaşık bir düzine bileşen [16][10] | Uniwind (Tailwind 4) + `tailwind-variants` + `tailwind-merge`. `components/ui` altında button, input, select, modal… [28][33][42] | İkisi de **Ç**: ikinci bir tasarım sistemi. Obytes ayrıca stil dilini className'e çevirir. |
| **Durum** | TanStack Query + yerel React durumu. Global store kütüphanesi bağımlılıklarda yok. [67] | React context (`AuthContext`, `EpisodeContext`). MST artık varsayılan değil [17]. | Zustand 5 (auth store) [28][40] | **T** / **—**: gereksinim yok. |
| **Veri çekme** | tRPC 11 + TanStack Query 5. Native'de `expo-sqlite/kv-store` üstünde persister. [67][78] | `apisauce` 3.1.1 (REST) [1] | axios + TanStack Query 5.90 + `react-query-kit` [28] | **Ç**: REST istemcileri tRPC'nin uçtan uca tiplerinin yerini tutmaz. |
| **Formlar / doğrulama** | Form kütüphanesi yok [67]. Zod 4 API tarafında [79]. | Yok [1] | TanStack Form + `@tanstack/zod-form-adapter` + zod 4 [28][39] | Obytes: koşullu **K**, ancak form yükü büyürse (Source formu vb.). |
| **Auth** | better-auth + `@better-auth/expo`. İstemci depolaması native'de `expo-secure-store`, web'de tarayıcının httpOnly çerezi. [67][80] | Demo `AuthContext`, MMKV'de saklar [17] | Zustand store + MMKV'de token. "secure data storage" diyor [39][40]. `createMMKV()` argümansız, yani şifreleme anahtarı verilmiyor [46]. | **Ç**. Homelibra'nın SecureStore seçimi daha sıkı [80]. |
| **i18n** | i18next 26 + react-i18next 17, yalnız `tr` çevirisi [67] | i18next 23 + react-i18next 15, 7 dil dosyası, `ar` çevirisi var [1] (dosya ağacı) | i18next 25 + react-i18next 16, `ar` RTL, `eslint-plugin-i18n-json` [28][45] | **T** (eski sürüm). Obytes'ın çeviri JSON lint'i küçük bir **K** olabilir. |
| **Depolama** | `expo-sqlite` (outbox, kv-store), `expo-secure-store`. Web'de cihaz tercihleri `localStorage`'da. [72][73][78] | MMKV 3.3.3 [21] | MMKV 4.1.1 + `react-native-nitro-modules` [28][46] | **Ç** / **T**: üçüncü bir anahtar-değer deposu. ADR-0008'in SQLite outbox'ının yerini tutmaz. |
| **Ortam yapılandırması** | `EXPO_PUBLIC_API_URL` ile geçersiz kılma, yoksa geliştirme/web/üretim yedeği [74]. Tek bundle ID `app.homelibra` [68]. | `app/config/config.{base,dev,prod}.ts` [1] (dosya ağacı) | `env.ts`: zod şeması, `EXPO_PUBLIC_APP_ENV` (development/preview/production) başına ayrı bundle ID, paket adı ve şema. `STRICT_ENV_VALIDATION`. `app-icon-badge` ile üretim dışı simgeye ortam rozeti [29][30]. | Obytes: **K** adayı, ancak dev/preview/prod yan yana kurulum isteniyorsa. |
| **Birim testi** | Vitest 5 (app, core, outbox, ui) [67][71][75] | Jest 29 + jest-expo + RNTL [1][18] | Jest 29 + jest-expo + RNTL, CI'da kapsam yorumu [28][34] | **Ç** (Jest ↔ Vitest). |
| **E2E** | Yok (depoda `.maestro` ya da e2e klasörü yok) | Maestro örnek akışları (`.maestro/flows`) [1][18] | Maestro akışları + Maestro Cloud workflow'u (PR etiketiyle tetiklenir) [34] | **K**: Homelibra'da hiç yok. Ancak şablon olmadan da eklenebilir. |
| **Lint / format** | ESLint 10 flat + typescript-eslint. Özel kurallar: Türkçe büyük/küçük harf, Hermes boşlukları. Prettier 3 (lint-staged). Husky pre-commit/pre-push. [70][75] | ESLint 8 (`.eslintrc.js`), Prettier, `eslint-config-expo` [1] | ESLint 9 + `@antfu/eslint-config`. Prettier kaldırıldı. commitlint, husky, lint-staged [28][36] | **Ç**: iki şablon da Homelibra'nın kurallarını kaybettirir ya da geriletir. |
| **CI** | GitHub Actions: typecheck, depcruise, lint, testler, `version` kontrolü, Postgres ile API entegrasyonu, GHCR imajları, Coolify dağıtımı [71] | Üretilen uygulamaya CI yok | 13 workflow: lint, tsc, jest, expo-doctor, EAS preview/prod build, Android E2E, sürüm/tag, GitHub release, görsel sıkıştırma, stale [34] | Obytes: **K** adayı (EAS build ve expo-doctor workflow'ları). Geri kalanı **T**. |
| **EAS build/submit** | `development`/`preview`/`production`, `appVersionSource: local`, node 24, pnpm 11.8. `expo-updates` + `fingerprint` runtime. [68][72] | `development`, `development:device`, `preview`, `preview:device`, `production`, boş `submit.production`. Betikler `--local` derler [1][3]. | `appVersionSource: remote` + `autoIncrement`, EAS `environment` alanları, `submit` profilleri [31]. Sürüm `np` ile [28]. | **Ç**: Obytes'ın uzak sürümleme modeli Homelibra'nın `version:bump` + CI `version` kontrolüyle çatışır. Ignite: **T**. `submit` profili iOS zamanı gelince küçük bir **K**. |
| **Üreteçler / CLI** | Yok | `npx ignite-cli generate component/screen/navigator/app-icon/splash-screen`. EJS şablonları `./ignite/templates` altında, özelleştirilebilir [12][13]. | Yalnız oluşturma CLI'ı (`create-obytes-app`), üreteç yok [38][43] | Ignite: koşullu **K** (bkz. bölüm 5). |
| **Tema / karanlık mod** | `@homelibra/ui/theme` açık/koyu token seti. Ayarlar'da Sistem/Açık/Koyu. [73][77] | `colors.ts` + `colorsDark.ts`, sistem temasını izler, `setThemeContextOverride` [16] | Tailwind karanlık modu, `use-selected-theme` [42] | **T**. |
| **Bağımlılık sınırları** | dependency-cruiser ile paket giriş noktası kuralları [76] | Genel hijyen kuralları, platform uzantılarını Metro yapılandırmasından çözer [22] | Yok | Ignite'ınki **T** ve daha zayıf. |
| **Geliştirici araçları** | Sentry (`@sentry/react-native`) [67] | Reactotron (MMKV eklentisiyle) [1] | `@dev-plugins/react-query` [28]. Sentry bir tarif olarak anlatılıyor [82]. | **—** |

### 5. "Şablona geçmek" mekanik olarak ne demek?

- **İki şablon da yalnızca oluşturma anında kopyalanır, sonra bağımlılık olarak kalmaz:**
  - Ignite `new`, `boilerplate/` klasörünü kopyalar [4].
  - Obytes CLI etiketi klonlar ve `.git`'i siler [38].
- **Sonradan güncelleme yolu yok:**
  - Ignite'ın yükseltme dokümanı yalnızca `expo install expo@latest` adımlarını verir. Ignite uygulamasını güncel tutmanın "daha az önemli" olduğunu söyler. Farkları görmek için topluluk aracı ignite-diff-purge'ü önerir [19].
  - Obytes, `package.json`'daki `osMetadata.initVersion` değerini son sürümle elle karşılaştırıp değişiklikleri elle uygulamayı söyler [41].
- **Sonuç:** Bir şablonun asıl değeri ilk kurulumdur ve Homelibra bu aşamayı geçti. Benimsemek sürekli bir bakım kazancı getirmez (türetilmiş çıkarım).

Üç yol var:

| Yol | Mekanik | Kaba maliyet (tahmin) |
|---|---|---|
| **A. Baştan oluşturup taşımak** | Şablon `apps/app`'e üretilir. 106 dosya / yaklaşık 10,7 bin satır taşınır. Ardından şunlar yapılır: router değiştirilir (Ignite), ya da Expo Router 6'dan 58'e geri yükseltilir (Obytes); şablonun UI kiti, REST istemcisi, MMKV, Jest ve ESLint yapılandırması sökülür ya da `@homelibra/*` ile yan yana yaşatılır; SDK 54/55'ten 58'e yükseltilir; kök araçlar birleştirilir. | Tek geliştirici için kabaca 2–4 hafta. Sonuçta büyük ölçüde bugünkü yığına geri dönülür. Net kazanç E2E iskeleti ve birkaç CI dosyası. |
| **B. Şablonu referans alıp parça almak** | Yalnızca istenen dosyalar elle uyarlanır: Maestro akışları, Obytes'ın `env.ts` deseni ve `app-icon-badge`, EAS build workflow'u, `submit` profili. | Parça başına birkaç saat ile 1–2 gün. |
| **C. Ignite üreteçlerini şablonsuz kullanmak** | Kaynağa göre CLI'ın tek şartı çalışma dizininde `./ignite/` klasörünün olması [14]. `generate` şablonu `./ignite/templates/<ad>/` altından okur [14]. Hedef klasör, `src/app` varsa `src/`'dir, yoksa `app/` [14]. `apps/app`'te `src/app` var, yani bileşenler `src/components`'e düşer. Hazır şablonlar `@/theme/context` ve `@/components/Text` import eder [15], bu yüzden `@homelibra/ui`'a göre yeniden yazılmaları gerekir. `ignite-cli update` şablonları Ignite'ınkilerle ezer [12]. | Yarım gün. Çalıştırılmadı, doğrulanmalı. |

### 6. Bakım sinyalleri (2026-11-15)

| | Ignite | Obytes |
|---|---|---|
| Lisans | MIT, `LICENSE` dosyası (GitHub API "NOASSERTION" gösteriyor) [25] | MIT [47] |
| Yaş, ilgi | 2016'dan beri, yaklaşık 19,9 bin yıldız [64] | 2020'den beri, yaklaşık 4,4 bin yıldız [64] |
| Son sürüm | v11.5.0, 2026-03-18 [5] | v9.0.0, 2026-01-27 [35] |
| Sürüm sıklığı | 2024'te 32, 2025'te 27 sürüm (v10.1.2 → v11.3.2), 2026'da 2 sürüm. semantic-release ile [5][6]. | Major sürümler: v7 2024-11, v8 2025-06, v9 2026-01. Yaklaşık 6–7 ayda bir major, arada nadiren yama [35]. |
| `master`'daki son kod değişikliği | 2026-03-18 (sürüm). Sonrası yalnızca doküman [6]. | 2026-06-02 (splash ekranı düzeltmesi) [36] |
| Açık issue / PR | 30 issue / 10 PR [65] | 7 issue / 1 PR [65] |
| Son 6 ay (2026-05-15'ten beri) | 3 issue açıldı, 1 kapandı. 8 PR açıldı, 1 birleşti [65]. | 1 issue açıldı, 1 kapandı. 11 PR açıldı, 1 birleşti [65]. |
| Bakımcılar | Infinite Red. Son SDK işleri coolsoftwaretyler ve frankcalise'dan, SDK 56 PR'ını flexbox, markrickert ve coolsoftwaretyler onayladı [6][7]. | Obytes. Ağırlık tek kişide (yjose: 496 katkı, sonraki 88). v10 PR'ı hamzamekk'ten [37][64]. |

- İki projede de 2026 ortasından beri birleştirme neredeyse durmuş görünüyor (son altı ayda birer birleşme). Onaylı SDK PR'ları aylarca bekliyor [7][37].
- Obytes'ta bakım tek kişiye bağlı [64].

## Öneri

*Bu bölüm bulgulardan çıkan yorumdur. Karar geliştiricinin.*

1. **İki şablona da geçilmemeli.** Gerekçeler:
   - İkisi de Homelibra'dan üç-dört SDK geride [1][28].
   - 2026 ortasından beri SDK güncellemeleri birleşmiyor [7][37].
   - Yığınlarının çoğu Homelibra'nın verdiği kararlarla çakışıyor: tRPC, `@homelibra/ui`, better-auth + SecureStore, SQLite outbox, Vitest, ESLint 10 kuralları, yerel sürümleme (bölüm 4).
   - Şablonlar oluşturma anında kopyalandığı için benimsemek sürekli bir kazanç da getirmiyor [19][41].
2. **Gerçek boşluklar için parça alınabilir (yol B):**
   - **E2E:** Homelibra'da hiç yok. İki şablonun Maestro akışları ve Obytes'ın Maestro Cloud workflow'u başlangıç referansı olur [18][34]. Akışlar Android Capture yolu için yazılır.
   - **Çok ortamlı derleme:** dev/preview/prod yan yana kurulum ve simge rozeti isteniyorsa Obytes'ın `env.ts` + `app-icon-badge` deseni [29][30]. Sürümleme Homelibra'nın yerel modelinde kalır, `autoIncrement`/`remote` alınmaz [31].
   - **iOS dağıtımı:** zamanı gelince `eas.json`'a bir `submit` profili [3][31].
   - **expo-doctor:** Obytes'ın CI adımı gibi PR'da `expo-doctor` çalıştırmak [34].
3. **Ignite üreteçleri** ancak ekran/bileşen iskeleti yazmak tekrar eden bir yük olursa denenmeli (yol C). Şablonlar `@homelibra/ui`'a göre yeniden yazılır. Önce küçük bir denemeyle çalıştığı doğrulanır [14][15].

## Açık sorular

- Bir şablondan asıl ne bekleniyor? Hazır E2E mi, çok ortamlı derleme mi, CI'da EAS build mi, iskelet üreteci mi, yoksa "topluluğun bakımını yaptığı bir yığın" güvencesi mi? Son beklenti bu iki şablonun bugünkü durumunda karşılanmıyor (bölüm 1, 6).
- E2E test istenecek mi? İstenirse Maestro mu (iki şablon da onu kullanıyor), yoksa web için ayrı bir araç mı? Maestro yalnız native akışları sınar. Web E2E bu araştırmanın dışında.
- Telefonda dev/preview/prod uygulamaları yan yana kurulmalı mı (ayrı bundle ID)? Bu, Obytes'ın `env.ts` desenini almanın tek gerekçesi.
- Formlar (Source formu, Locator) büyüdükçe bir form kütüphanesi gerekecek mi? Gerekirse Obytes'ın TanStack Form + zod tercihi Homelibra'nın zod'u ile uyumlu bir aday.
- Ignite #3038 / #3046 ve Obytes #543 birleşirse yeniden bakmaya değer mi? Obytes v10'un Bun zorunluluğu (açık PR'a göre) pnpm workspace ile çakıştığı için Obytes yine elenir [37].
- Doğrulanmamış web noktaları (`react-native-restart` import'u, Uniwind, keyboard-controller, React Navigation): yalnızca bir parça alınacaksa ve o parça bunlara dokunuyorsa denenir.

## Kaynaklar

1. https://github.com/infinitered/ignite/blob/v11.5.0/boilerplate/package.json (dosya ağacı: https://github.com/infinitered/ignite/tree/v11.5.0/boilerplate)
2. https://github.com/infinitered/ignite/blob/v11.5.0/boilerplate/app.json
3. https://github.com/infinitered/ignite/blob/v11.5.0/boilerplate/eas.json
4. https://github.com/infinitered/ignite/blob/v11.5.0/src/commands/new.ts
5. https://github.com/infinitered/ignite/releases
6. https://github.com/infinitered/ignite/commits/master/boilerplate/package.json (ve https://github.com/infinitered/ignite/commits/master)
7. https://github.com/infinitered/ignite/pull/3038
8. https://github.com/infinitered/ignite/pull/3046
9. https://github.com/infinitered/ignite/issues/3045
10. https://github.com/infinitered/ignite/blob/master/docs/Guide.md
11. https://github.com/infinitered/ignite/blob/master/docs/QuickStart.md
12. https://github.com/infinitered/ignite/blob/master/docs/concept/Generators.md
13. https://github.com/infinitered/ignite/blob/master/docs/concept/Generator-Templates.md
14. https://github.com/infinitered/ignite/blob/v11.5.0/src/tools/generators.ts
15. https://github.com/infinitered/ignite/blob/v11.5.0/boilerplate/ignite/templates/component/NAME.tsx.ejs
16. https://github.com/infinitered/ignite/blob/master/docs/concept/Styling.md ve https://github.com/infinitered/ignite/blob/master/docs/boilerplate/app/theme/Theming.md
17. https://github.com/infinitered/ignite/blob/master/docs/boilerplate/app/context/Context.md
18. https://github.com/infinitered/ignite/blob/master/docs/concept/Testing.md
19. https://github.com/infinitered/ignite/blob/master/docs/concept/Upgrades.md
20. https://github.com/infinitered/ignite/blob/master/docs/expo/Expo-and-Ignite.md
21. https://github.com/infinitered/ignite/blob/v11.5.0/boilerplate/app/utils/storage/index.ts
22. https://github.com/infinitered/ignite/blob/v11.5.0/boilerplate/.dependency-cruiser.js
23. https://github.com/infinitered/ignite/blob/v11.5.0/boilerplate/src/app/_layout.tsx
24. https://github.com/infinitered/ignite/blob/master/.circleci/config.yml
25. https://github.com/infinitered/ignite/blob/master/LICENSE
26. https://github.com/infinitered/ignite-cookbook/blob/main/docs/recipes/SettingUpYarnMonorepo.md ve https://github.com/infinitered/ignite-cookbook/blob/main/docs/recipes/MonoreposOverview.md
27. https://github.com/infinitered/ignite-cookbook/blob/main/docs/recipes/ExpoRouter.md
28. https://github.com/obytes/react-native-template-obytes/blob/v9.0.0/package.json
29. https://github.com/obytes/react-native-template-obytes/blob/master/app.config.ts
30. https://github.com/obytes/react-native-template-obytes/blob/master/env.ts
31. https://github.com/obytes/react-native-template-obytes/blob/master/eas.json
32. https://github.com/obytes/react-native-template-obytes/blob/master/.npmrc
33. https://github.com/obytes/react-native-template-obytes/blob/master/metro.config.js
34. https://github.com/obytes/react-native-template-obytes/tree/master/.github/workflows
35. https://github.com/obytes/react-native-template-obytes/releases
36. https://github.com/obytes/react-native-template-obytes/commits/master/package.json (ve https://github.com/obytes/react-native-template-obytes/commits/master)
37. https://github.com/obytes/react-native-template-obytes/pull/543
38. https://github.com/obytes/react-native-template-obytes/blob/v9.0.0/cli/clone-repo.js ve https://github.com/obytes/react-native-template-obytes/blob/v9.0.0/cli/setup-project.js
39. https://github.com/obytes/react-native-template-obytes/blob/master/docs/src/content/docs/overview.md
40. https://github.com/obytes/react-native-template-obytes/blob/master/docs/src/content/docs/guides/authentication.mdx
41. https://github.com/obytes/react-native-template-obytes/blob/master/docs/src/content/docs/guides/upgrading-deps.mdx
42. https://github.com/obytes/react-native-template-obytes/blob/master/docs/src/content/docs/ui-and-theme/ui-theming.mdx
43. https://github.com/obytes/react-native-template-obytes/blob/master/docs/src/content/docs/getting-started/create-new-app.md
44. https://github.com/obytes/react-native-template-obytes/blob/master/src/app/+html.tsx
45. https://github.com/obytes/react-native-template-obytes/blob/master/src/lib/i18n/utils.tsx
46. https://github.com/obytes/react-native-template-obytes/blob/master/src/lib/storage.tsx
47. https://github.com/obytes/react-native-template-obytes/blob/master/LICENSE
48. https://expo.dev/changelog/2024-01-18-sdk-50
49. https://expo.dev/changelog/2024-05-07-sdk-51
50. https://expo.dev/changelog/2024-11-12-sdk-52
51. https://expo.dev/changelog/sdk-53
52. https://expo.dev/changelog/sdk-54
53. https://expo.dev/changelog/sdk-55
54. https://expo.dev/changelog/sdk-56
55. https://expo.dev/changelog/sdk-57
56. https://expo.dev/changelog/sdk-58
57. https://github.com/mrousavy/react-native-mmkv/blob/v3.3.3/README.md
58. https://github.com/mrousavy/react-native-mmkv/blob/v4.1.1/README.md
59. https://github.com/gorhom/react-native-bottom-sheet/blob/master/README.md
60. https://github.com/avishayil/react-native-restart/blob/master/README.md
61. https://github.com/uni-stack/uniwind/tree/main/packages/uniwind/src/components/web
62. https://github.com/kirillzyusko/react-native-keyboard-controller/blob/main/README.md
63. https://github.com/obytes/react-native-template-obytes/blob/v4.3.0/package.json
64. GitHub REST API, depo ve katkıcı verisi: https://api.github.com/repos/infinitered/ignite, https://api.github.com/repos/obytes/react-native-template-obytes ve bunların `/contributors` uçları
65. GitHub arama API'si, `repo:<depo> is:issue|is:pr` sorguları (`is:open`, `created:>=2026-05-15`, `closed:>=2026-05-15`, `merged:>=2026-05-15`): https://api.github.com/search/issues
66. https://registry.npmjs.org/expo (`time` alanı)
67. `apps/app/package.json` (Homelibra)
68. `apps/app/app.json`
69. `pnpm-workspace.yaml`
70. kök `package.json`, `.lintstagedrc`, `.husky/pre-commit`, `.husky/pre-push`
71. `.github/workflows/ci.yml`
72. `apps/app/eas.json`
73. `apps/app/src/lib/device-choice.ts`, `apps/app/src/lib/theme-preference.ts`
74. `apps/app/src/lib/api-url.ts`
75. `eslint.config.mjs`
76. `packages/README.md`, `.dependency-cruiser.cjs`
77. `packages/ui/package.json`, `packages/ui/src/theme.ts`
78. `apps/app/src/lib/query-provider.native.tsx`, `docs/adr/0008-offline-capture-is-a-native-outbox.md`
79. `apps/api/package.json`
80. `apps/app/src/lib/auth-client.ts`
81. https://github.com/obytes/react-native-template-obytes/blob/master/docs/src/content/docs/guides/data-fetching.mdx
82. https://github.com/obytes/react-native-template-obytes/blob/master/docs/src/content/docs/recipes/sentry-setup.mdx
