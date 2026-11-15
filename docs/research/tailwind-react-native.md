# React Native için Tailwind kütüphanesi: Homelibra'ya hangisi uyar

Araştırma tarihi: 2026-11-15. İlgili kararlar: ADR-0001 (tek Expo universal kod tabanı, her kütüphane web'de çalışmalı). Önceki araştırma: `docs/research/expo-starter-ignite-obytes.md` (Obytes şablonu Uniwind kullanıyor, Uniwind'in web desteği orada doğrulanmamıştı).

## Soru

Homelibra bugün kendi UI kitini (`packages/ui`) `StyleSheet` ve `useThemedStyles` ile yazıyor. Tailwind tarzı `className` stiline geçilirse hangi kütüphane bugünkü yığına uyar? Adaylar: **NativeWind** (v4 kararlı ve v5 durumu), **Uniwind**, **twrnc**. Karşılaştırma için Tailwind olmayan **react-native-unistyles** de anılıyor. Her aday için:

1. Hangi Tailwind sürümünü kullanıyor? peerDependencies ve dokümana göre Expo SDK 58, React Native 0.88, React 19.3 ve Reanimated 4'ü bugün destekliyor mu?
2. Web (react-native-web, Expo web) nasıl çalışıyor: gerçek CSS mi, çalışma zamanı mı? Bilinen boşluklar neler?
3. Monorepo: `packages/ui`'daki sınıflar uygulamanın yapılandırmasıyla taranıyor mu? Hoisted `node_modules` ve Metro yapılandırması nasıl?
4. Tema: karanlık mod, OS'u geçersiz kılan Sistem/Açık/Koyu tercihi (web dahil), mevcut TS token dosyasından CSS değişkenleri, özel fontlar.
5. Test: bileşen testleri Jest değil vitest'te çalışıyor mu? Testler neye ihtiyaç duyar?
6. Performans modeli (derleme zamanı mı, çalışma zamanı mı), lisans, bakımcı, sürüm sıklığı, son sürüm.
7. Kademeli geçiş: `StyleSheet` ve `className` yan yana yaşayıp dosya dosya geçiş yapılabilir mi?

## Yöntem

- Yalnızca birincil kaynaklar okundu: nativewind.dev (v4 ve v5 dokümanları), docs.uniwind.dev, unistyl.es, docs.expo.dev; adayların GitHub depoları (README, kaynak kodu, release notları, açık ve kapalı issue'lar); npm registry (`peerDependencies`, `dist-tags`, yayın tarihleri, bakımcılar). Depo verisi `gh api` ile, npm verisi `npm view` ile alındı.
- Homelibra gerçekleri depodaki dosyalardan okundu [1]-[7].
- Her iddianın yanında `[n]` kaynak numarası var; URL'ler "Kaynaklar" bölümünde.
- Blog ve üçüncü taraf yazılar kullanılmadı. Issue'larda kullanıcı raporları bakımcı onayı olmadan "kullanıcı raporu" diye işaretlendi.
- **Varsayımlar:** (1) Hiçbir kütüphane kurulmadı ve hiçbir şey çalıştırılmadı. "doğrulanmalı" notu olan satırlar prototip ister. (2) "Destekliyor" ancak doküman, release notu ya da bakımcının kapattığı bir düzeltme o sürümü açıkça anıyorsa yazıldı. `react-native: "*"` gibi açık uçlu peerDependencies destek kanıtı sayılmadı. (3) Homelibra'nın web çıktısı `single` (SPA); SSR'a özgü sorunlar bu yüzden ikincil.

## Bulgular

### Homelibra'nın bugünkü yığını (depodan)

- `expo ~58.0.21`, `react-native 0.88.1`, `react 19.3.0`, `react-native-web ~0.21.4`, `react-native-reanimated 4.7.1`, `react-native-worklets 0.13.0`, `expo-router ~58.0.28`, `expo-font ~58.0.11`, `@expo-google-fonts/*` (Charis SIL, EB Garamond, Reddit Sans, Reddit Mono) [1]. Fontlar `_layout.tsx`'te `useFonts` ile yükleniyor [5].
- pnpm workspace, `nodeLinker: hoisted` [6]. `apps/app/metro.config.js` yalnızca Sentry'nin `getSentryExpoConfig` sarmalayıcısını kullanıyor. `babel.config.js` yok (Expo varsayılanı) [5]. `app.json`: `userInterfaceStyle: "automatic"`, `web.output: "single"` [5].
- `packages/ui`: token'lar `src/lib/tokens.ts`'te TS nesnesi (`palette.light`/`palette.dark`, aynı anahtarlar; tipografi `fontFamily` + `fontSize` nesneleri) [4]. `use-theme.ts` Sistem/Açık/Koyu tercihini kendi store'unda tutar, `system` için React Native `useColorScheme()`'i okur, `useThemedStyles(make)` tema başına stil üretir [4]. `apps/app/src` ve `packages/ui/src` altında 76 dosya `StyleSheet` ya da `useThemedStyles` kullanıyor (74'ü `StyleSheet`, 64'ü `useThemedStyles`; sayıma `use-theme.ts`, `tests/render.tsx` ve bir test dosyası da giriyor) [1][2].
- UI testleri vitest'te. `react-native`, react-native-web'i yeniden export eden yerel bir modüle (`src/tests/react-native.tsx`, Modal'ı yerinde çizer) alias'lanıyor. `render.tsx` `react-dom/server` `renderToStaticMarkup` ile HTML üretiyor. `css()` yardımcısı bir stil değerini RNW'nin atomik `r-<özellik>-…` sınıfından ve `StyleSheet.getSheet()` metninden okuyor [2][3].
- ADR-0001: Android, iOS ve web tek kod tabanından gelir; kütüphane seçimi web desteğiyle sınırlıdır [7].

### Expo'nun konumu

- Expo'nun Tailwind rehberi, düz Tailwind'in yalnızca web'de çalıştığını yazar. Android ve iOS'ta Tailwind için **NativeWind** ve **Uniwind**'i anar, birini önermez [9]. Web'de Metro'nun CSS desteği (`isCSSEnabled`) kullanılır. React Native Web bileşenlerinde sınıf `{ $$css: true, _: '…' }` stil sözdizimiyle verilir [9]. İki kütüphanenin web'de kullandığı mekanizma budur (aşağıda).

### 1. Sürüm ve platform desteği

| Aday | Tailwind | peerDependencies (npm) | Resmi hedef / destek beyanı | SDK 58 / RN 0.88 / React 19.3 / Reanimated 4 bugün |
|---|---|---|---|---|
| **NativeWind 4.2.7** (`latest`) | v3 (`tailwindcss@^3.4.17`, css-interop peer `tailwindcss ~3`) [10][13] | nativewind: `tailwindcss >3.3.0`; react-native-css-interop 0.2.7: `react >=18`, `react-native *`, `react-native-reanimated >=3.6.2` [12][13] | 4.2.7 notu: "Expo SDK 57 araç zincirini destekle"; test ortamı React 19 + RN 0.86; Reanimated 3 ve 4'ü destekleyen plugin girişi seçiliyor [11]. Kurulum sayfası "Expo SDK 57 desteği" der [10]. | **Resmi beyan yok** (hedef SDK 57). SDK 58 + RN 0.88 + Reanimated 4.7.1 + Worklets 0.13 üzerinde iki açık kullanıcı raporu var: başlangıçta `ImageBackground` kullanımdan kalkma uyarısı [21] ve `animate-*` animasyonlarının unmount sonrası UI thread'de sürmesi [22]. Çalışmayı engelleyen rapor bulunmadı. doğrulanmalı. |
| **NativeWind 5.0.0-rc.1** (`rc`/`preview`) | v4 (`tailwindcss >4.1.11`; doküman 4.1.12'ye sabitler) [12][24] | nativewind: `react-native-css 3.1.0-rc.1` (tam sürüm); react-native-css: `react >=19`, `react-native >=0.81`, `@expo/metro-config >=54`, `lightningcss >=1.27.0` [12][27] | Hedef: Expo 57.0.22, RN 0.86.3, React 19.2.3, Reanimated 4.5.1, Worklets 0.10.1. Doküman bannerı: ön sürüm, "üretimde kullanım için değil" [24][25][26]. | **Hayır.** Hedef SDK 57. RN 0.88'de `react-native-css/components` `AssetRegistry`'yi yeniden export etmiyor, bu yüzden `expo-asset` bozuluyor. Bir kullanıcı `expo-font`/`useFonts` ile yüklenen bütün özel fontların sessizce sistem fontuna düştüğünü bildiriyor (SDK 58, rc.1, Android) [28]. Düzeltme PR'ı 2026-11-06'da birleşti [29], ama son rc (rc.1) 2026-11-02'de çıktı [27], yani düzeltme hiçbir rc ya da kararlı sürümde yok; 2026-11-12 tarihli `nightly` etiketinde olup olmadığı doğrulanmalı. Homelibra `useFonts` kullanıyor [5]. |
| **Uniwind 1.13.2** (ücretsiz, MIT) | Yalnızca v4 [34]; bağımlılık `@tailwindcss/node 4.3.3` [35] | `react >=19.0.0`, `react-native >=0.81.0`, `tailwindcss >=4`, `metro *`, `metro-cache *`, `@expo/metro-config *` (opsiyonel) [35] | Ücretsiz sürüm için resmi SDK/RN tablosu **yok**. Tablo yalnızca Pro içindir: Pro 1.9.2 → RN 0.83-0.89, Expo SDK 55-58 [39]. | **Kanıta göre evet, resmi tablo yok.** RN 0.88'de aynı `AssetRegistry` hatası (`useFonts` hiç çözülmüyor, splash'te kalınıyor) bildirildi [37]. Bakımcı bütün RN export'larını ileten PR #740'ı birleştirdi [38], düzeltme 1.13.0'da (2026-10-19) yayımlandı [36][37]. Ücretsiz sürüm Reanimated gerektirmez. className ile animasyon yalnızca Pro'da; ücretsiz sürümde animasyon `style` ile verilir [40]. SDK 58 için doğrulanmalı (resmi tablo yok). |
| **twrnc 4.16.0** | v2/v3 (bağımlılık `tailwindcss >=2.0.0 <4.0.0`) [58][59] | `react-native >=0.62.2` [58] | README sürüm matrisi vermiyor [59]. | Saf JS, native kod yok. Belirli sürüm beyanı yok, doğrulanmalı. Tailwind v4 desteği yok [58]. |
| **react-native-unistyles 3.8.1** (Tailwind değil) | — | `react-native >=0.85.0`, `react-native-nitro-modules *`, Reanimated opsiyonel [63] | RN ≥0.85, React ≥19, New Architecture zorunlu, Expo SDK ≥56, Expo Go yok, Babel plugin ya da deneysel Metro entegrasyonu [62]. | Alt sınırlar karşılanıyor; RN 0.88 için açık beyan okunmadı, doğrulanmalı. |

### 2. Web desteği

- **NativeWind v4:** Doküman şöyle der: "web'de NativeWind, React Native Web'e `className` desteği ekleyen küçük bir polyfill"; Tailwind'in ürettiği gerçek CSS dosyasını yeniden kullanır, çalışma zamanında stylesheet enjekte etmez, bu yüzden SSR ve ilk yükleme iyidir [14]. `app.json`'da `web.bundler: "metro"` istenir [10]. Elle tema seçimi (`setColorScheme`) Tailwind config'te `darkMode: "class"` ister, yoksa hata fırlatır [16]. Bu seçimin web'de `<html>` sınıfına nasıl yansıdığı dokümanda yok, doğrulanmalı.
- **NativeWind v5 RC:** Web mekanizması v4 ile aynı şekilde anlatılıyor [33]. Kurulum sayfası tek `@import "tailwindcss"` kullanılırsa utility'lerin RNW varsayılanlarının altına düşebileceği uyarısını yapar; katmanlı import önerir [24]. **Kritik boşluk:** v5'te elle tema seçimi `Appearance.setColorScheme` ile yapılır. Doküman açıkça şöyle der: "bu elle geçersiz kılma native içindir; React Native Web bunu tarayıcı tema seçicisine çevirmez" [30]. Ayrıca `:root.dark` gibi seçiciler native derleyicide reddedilir [26][30]. Homelibra'nın web'de de çalışan Sistem/Açık/Koyu tercihi [4] v5'te ayrı bir web çözümü ister.
- **Uniwind:** Web bileşenleri (`src/components/web/*`) `className`'i RNW'ye `style={[{ $$css: true, tailwind: className }, props.style]}` olarak verir [41][42]. Bu, Expo'nun belgelediği RNW sınıf mekanizmasıdır [9], yani sınıflar DOM'a gerçek CSS sınıfı olarak gider. Tema değişince web'de geçerli tema adını `document.documentElement` sınıfı yapar [41]; bakımcıya göre `.dark` sınıfını uygulamak tarayıcıdaki CSS'i doğrudan günceller [45]. `package.json` `exports` alanı `browser`/`import` koşulunda web bileşenlerini, `react-native` koşulunda native bileşenleri seçer. CSS girişi `style: ./uniwind.css` [43]. Bilinen ve kapanmış web sorunları: RNW 0.21.3+ ile web derlemesinin kırılması (`InputAccessoryView`), 1.12.1'de düzeldi [44], 1.12.2'de döngüsel import düzeltildi [36]; scoped variable okumalarında aşırı stil yeniden hesaplaması, 1.13.1'de düzeldi [36][46]; SSR/`static` çıktıda ilk yüklemede tema yanıp sönmesi [45]. Bakımcı bunun için `output: "single"` geçişini önerdi, Homelibra zaten `single` [5]. Tailwind CSS'in web'de Metro tarafından gerçek stylesheet olarak üretildiği türetilmiş bir çıkarım: Uniwind'in web CSS üretim kodu okunmadı, doğrulanmalı.
- **twrnc:** ``style={tw`…`}`` ile RN stil nesnesi üretir; className kullanmaz [59]. README web'i belgelenmiş bir hedef olarak anmıyor [59]. Web'de RNW'nin normal stil yolundan geçeceği türetilmiş bir çıkarım, doğrulanmalı.
- **Unistyles 3:** React Native Web "birinci sınıf destekli", Next.js SSR destekli [62]. Web stil üretim mekanizması okunmadı.

### 3. Monorepo, hoisted `node_modules`, Metro

- **NativeWind v4:** Monorepo dokümanı yalnızca Nx için `withNativeWind` zincirini gösteriyor [18]. Sınıflar `tailwind.config.js` `content` dizisinden taranır, dizi "className içeren bütün dosyaları kapsayacak şekilde" güncellenir [10]. `packages/ui/src` için göreli bir glob gerekir, doğrulanmalı. Kurulum `babel.config.js` ister (`jsxImportSource: "nativewind"` + `nativewind/babel`), artı Metro `withNativeWind(config, { input })` [10]. Homelibra'da bugün Babel config yok [5].
- **NativeWind v5:** Babel plugin yok, Metro `withNativewind(getDefaultConfig())`, PostCSS `@tailwindcss/postcss` [24]. Paylaşılan paketler CSS'te `@source "../../packages/ui/src"` ile eklenir [32]. Kurulum `lightningcss`'i `overrides` ile 1.30.1'e sabitlemeyi ister [24].
- **Uniwind:** Babel preset gerekmez [34]. Metro: `withUniwindConfig(config, { cssEntryFile: './src/global.css', dtsFile })`. Bu sarmalayıcı **en dıştaki** Metro sarmalayıcısı olmalı, `cssEntryFile` köke göre göreli string olmalı [34]. Tarama `global.css`'in bulunduğu dizinden başlar. Dışarıdaki paketler (pnpm workspace'leri dahil) `@source '../../packages/ui'` ile eklenir; `.gitignore`'daki dosyalar atlanır [47]. Uniwind Metro'da `react-native` importlarını `uniwind/components`'e yönlendirir [37]. Bilinen monorepo hataları Pro sürümünde ve izole/symlink kurulumlarda çıktı (ör. pnpm monorepo'da Pro + ücretsiz `uniwind` birlikte), hepsi kapandı [47][61]. Ücretsiz sürüm + hoisted kurulum için açık hata bulunmadı. `dtsFile` tipleri Metro çalışınca üretilir [34]. CI'daki `tsc` için bu dosyanın commit'lenmesi ya da `generate-artifacts` komutuyla üretilmesi gerekir [57], doğrulanmalı.
- **twrnc:** Derleme adımı yok (çalışma zamanı), Metro değişikliği gerekmez [59].

### 4. Tema, token'lar, fontlar

- **NativeWind v4:** Varsayılan davranış sistem görünümünü izler. Elle seçim `colorScheme.set()` ya da `useColorScheme().setColorScheme('light'|'dark'|'system')` ile yapılır, `darkMode: "class"` şarttır [15][16]. 4.2.7, `Appearance`'ın `unspecified` değerini içeride ele alır; `setColorScheme("system")` sistem tercihine döner [16]. Dinamik tema CSS değişkenleriyle (`rgb(var(--x) / <alpha-value>)`) ve `vars()` ile kurulur [17]. Fontlar `expo-font` ile yüklenir ve Tailwind `fontFamily` adıyla eşleştirilir [19].
- **NativeWind v5:** `dark:` → `@media (prefers-color-scheme: dark)`. Elle seçim native'de `Appearance.setColorScheme`, `'unspecified'` sistem tercihine döner. Web'de elle seçim yok (bkz. bölüm 2) [30]. Çalışma zamanı token'ları `VariableContextProvider` ile verilir. Geçersiz kılınacak değişkenler Metro'da `inlineVariables.exclude`'a yazılmalıdır, yoksa native derleyici onları satır içine gömer [31].
- **Uniwind:** Hazır temalar `light`, `dark`, `system`. `Uniwind.setTheme('light'|'dark'|'system')` ile değişir. `light`/`dark` seçimi RN `Appearance.setColorScheme`'i de çağırır ve uyarlanabilir temayı kapatır; `system` uyarlanabilir temayı geri açar. `useUniwind()` `theme` ve `hasAdaptiveThemes` döndürür [48]. Bu üç değer Homelibra'nın `ThemePreference` tipiyle (`'system'|'light'|'dark'`) bire bir örtüşüyor [4]. Ama iki store'un (Homelibra `setThemePreference` + `Uniwind.setTheme`) senkron tutulması ve Uniwind'in `Appearance.setColorScheme` çağrısının Homelibra `useTheme()`'in okuduğu `useColorScheme()`'i etkilemesi türetilmiş riskler, doğrulanmalı. İlk tema yarış durumu 1.13.2'de düzeltildi [36]. Token'lar CSS öncelikli: `@theme { --color-… }` ve tema başına `@layer theme { :root { @variant dark {…} @variant light {…} } }` [49]. JS tarafında değer için `useCSSVariable`/`getCSSVariable`, çalışma zamanında değiştirmek için `updateCSSVariables` var [57]. Bir TS token dosyasını doğrudan içe aktarma yolu okunan kaynaklarda yok. `tokens.ts` ya `global.css`'e elle kopyalanır ya da bir betikle üretilir. Fontlar `@theme { --font-sans: 'Ad'; }` ile tanımlanır, ad yüklenen font adıyla birebir eşleşmeli; platforma göre `@variant ios/android/web` desteklenir. Font dosyaları `expo-font` ile ayrıca yüklenir [50].
- **twrnc:** `useDeviceContext(tw, { observeDeviceColorSchemeChanges: false, initialColorScheme: 'light'|'dark'|'device' })` ve `useAppColorScheme(tw)` ile uygulama içi seçim yapılır [59]. Tailwind v3 `tailwind.config.js` okunur [59].

### 5. Test (vitest)

- **Hiçbir aday vitest altında bileşen testini belgelemiyor.** Uniwind dokümanında test sayfası yok [57]. NativeWind v4/v5 dokümanlarında test sayfası yok [10][24]. NativeWind'in kendi testleri Jest'te (`.config/jest.config.cjs`) [23].
- **Uniwind:** Kendi deposundaki web testleri vitest + jsdom'da, `react-native` → `react-native-web` alias'ıyla çalışıyor [53]. Kurulum dosyası "yalnızca className'in iletildiğini test ettiğimiz için tam Uniwind başlatması gerekmiyor" der [54]. Bir `uniwind/vite` eklentisi var; Storybook (Vite) için de öneriliyor [52]. Eklentinin test dosyasına göre eklenti kendi `react-native` alias'ını tanımlıyor [65].
- **Homelibra'ya özgü çakışmalar (türetilmiş, doğrulanmalı):** (a) `vitest.config.ts` `react-native`'i kendi Modal mock'una alias'lıyor [2]. Uniwind ve NativeWind v5 ise `react-native` importunu Metro'da yeniden yazarak çalışıyor [37][33], bu da vitest'te olmuyor. Uniwind Vite eklentisi eklenirse iki alias çakışabilir [65]. (b) `css()` yardımcısı değeri RNW'nin atomik `r-*` sınıflarından okuyor [3]. `className` ile verilen stiller Tailwind CSS'inde yaşar, `renderToStaticMarkup` çıktısında hesaplanmış değer yoktur; bu testler sınıf adına göre doğrulamaya dönmeli ya da `undefined` alır. (c) NativeWind v4 bir Babel JSX dönüşümüne dayanır [10][14]; vitest varsayılan olarak Babel çalıştırmaz.

### 6. Performans, lisans, bakım, sürüm sıklığı

| Aday | Performans modeli | Lisans | Bakımcı (npm) | Sürüm sıklığı / son sürüm |
|---|---|---|---|---|
| NativeWind v4 | Native'de derleme zamanında `StyleSheet.create` nesnelerine derleme + çalışma zamanı uygulayıcı; web'de Tailwind CSS'i [14] | MIT [12][23] | `marklawlor`, `onlydans` [12] | 4.2.5 (2026-06-05), 4.2.6 (06-22), 4.2.7 (09-14) [12]. Depoda açık issue+PR: 73 [23]. |
| NativeWind v5 | Aynı model, yeni motor `react-native-css` [33] | MIT [27] | aynı [12] | rc.0 (2026-09-13), rc.1 (2026-11-02); `latest` hâlâ v4 [12][25] |
| Uniwind | Ücretsiz: "stiller derleme zamanında hesaplanır" [56], JS motoru, tema değişiminde normal yeniden render [40]. Pro: Unistyles C++ motoru, sıfır re-render [40]. "NativeWind'den 2x hızlı" satıcı iddiası, bağımsız ölçüm okunmadı [57]. | Ücretsiz: MIT [35][56] (Pro sayfası ücretsiz sürümü "MIT & Commercial" diye anıyor [40]). Pro: ticari [40]. | `jpudysz` (Unistyles yazarı), `brentlok` [35] | 1.0.0 2025-11-04; 2026-08'den beri ayda 2-3 sürüm: 1.12.0 (09-04) … 1.13.0 (10-19), 1.13.1 (10-28), 1.13.2 (11-05) [35][36]. Açık issue: 2 [56]; ücretsiz sürümü ilgilendiren tek açık issue native'de `data-[…]` varyantlı stillerin önbelleğe alınmaması [55]. |
| twrnc | Çalışma zamanında sınıf dizesi ayrıştırma + memo; "memo busting" gerekebilir [59] | npm'de MIT [58]; depoda LICENSE dosyası yok | `jaredhenderson` [58] | 4.16.0 2025-12-30; o tarihten beri yayın yok [58][60]. |
| Unistyles 3 | C++ çekirdek (Nitro), Babel plugin ile derleme [62] | MIT [63] | `jpudysz` [63] | 3.5.0 (2026-10-05) … 3.8.1 (11-03) [64] |

### 7. Kademeli geçiş

- **Uniwind:** Inline stil her zaman `className`'den önceliklidir. Çakışan sınıflarda CSS kuralları geçerli, native'de cascade sırası 1.13.0 ile geldi [51]. `StyleSheet` nesneleri `style` prop'unda çalışmaya devam eder; bileşen `className` + `style` birlikte alabilir [42][51]. Not: Metro bütün `react-native` importlarını Uniwind sarmalayıcılarına yönlendirdiği için [37] dokunulmayan dosyalar da sarmalayıcıdan geçer. Dosya dosya geçiş mümkün, ama kurulum ilk günden bütün uygulamayı etkiler. Üçüncü taraf bileşenler (`lucide-react-native` ikonları gibi) için `withUniwind` ya da renk değerini JS'e veren `useCSSVariable` kullanılır [57].
- **NativeWind v4:** Inline ve yeniden eşlenmiş stiller `className` stillerinden sonra uygulanır (önceliklidir) [20]. JSX dönüşümü bütün bileşenlere uygulanır [14]. Yan yana kullanım mümkün.
- **twrnc:** ``style={[tw`…`, styles.x]}`` biçiminde mevcut stil nesneleriyle birleşir [59]. Geçiş en hafif olanı, ama className değil.

### Uyum tablosu

| Ölçüt (Homelibra) | NativeWind 4.2.7 | NativeWind 5 rc.1 | Uniwind 1.13.2 (ücretsiz) | twrnc 4.16.0 |
|---|---|---|---|---|
| Tailwind sürümü | v3 [10] | v4 [24] | v4 [34] | v3 [58] |
| SDK 58 / RN 0.88 | Resmi hedef SDK 57 [11]; SDK 58'de uyarı ve animasyon raporları [21][22]. **Kısmi, doğrulanmalı** | Hedef SDK 57; RN 0.88'de font yükleme bozuk, düzeltme hiçbir rc'de yok [28][29]. **Hayır** | RN 0.88 düzeltmesi 1.13.0'da [37][38]; resmi tablo yalnız Pro için [39]. **Evet (kanıt), tablo yok** | Beyan yok [59]. **Bilinmiyor** |
| Üretime hazır | Evet (`latest`) [12] | Hayır ("üretim için değil") [24] | Evet (`latest`, 1.x) [35] | Evet ama durgun [58] |
| Web mekanizması | RNW'ye className polyfill + gerçek Tailwind CSS [14] | Aynı [33] | RNW `$$css` sınıfı [41][42] | RN stil nesnesi (çalışma zamanı) [59] |
| Web'de kullanıcı Açık/Koyu seçimi | `darkMode: "class"` ile `setColorScheme`; web davranışı doğrulanmalı [16] | **Yok** (yalnız native) [30] | `setTheme` web'de kök sınıfı değiştirir [41][48] | `useAppColorScheme` [59] |
| `packages/ui` taraması | `content` glob [10] | `@source` [32] | `@source` [47] | Gerekmez |
| Babel / Metro değişikliği | Babel + Metro [10] | Metro + PostCSS + lightningcss sabitleme [24] | Yalnız Metro, en dışta [34] | Yok |
| Fontlar (`useFonts`) | `fontFamily` eşlemesi [19] | RN 0.88'de bozuk [28] | `--font-*` [50]; RN 0.88 font hatası 1.13.0'da kapandı [37] | Tailwind config [59] |
| `tokens.ts` | Tailwind v3 config + `vars()` [17]; TS içe aktarma doğrulanmalı | CSS öncelikli, `@theme` + `VariableContextProvider` [31] | CSS öncelikli, `@theme` + `@variant` [49]; TS'ten üretim gerekir | Tailwind v3 config [59] |
| vitest | Belgelenmemiş; Babel JSX gerekir [10] | Belgelenmemiş | Belgelenmemiş; kendi deposu vitest+jsdom [53][54], Vite eklentisi var [52] | Saf fonksiyon; muhtemelen sorunsuz, doğrulanmalı |
| Kademeli geçiş | Evet [20] | Muhtemelen; v5 öncelik sayfası okunmadı, doğrulanmalı | Evet [51] | Evet [59] |
| Bakım | Aktif, v4 yamaları seyrek [12] | RC [25] | Çok aktif [36] | 11 aydır yayın yok [58] |

## Öneri

1. **Tailwind'e geçilecekse aday Uniwind (ücretsiz, 1.13.2+).** Bugünkü yığında (SDK 58, RN 0.88, React 19.3, RNW 0.21.4) bilinen RN 0.88 ve RNW 0.21.3+ hataları kapanmış ve yayımlanmış tek Tailwind v4 kütüphanesi bu [36][37][44]. Web'de gerçek CSS sınıfı kullanıyor [41][42]. Kullanıcının Sistem/Açık/Koyu seçimini web dahil karşılıyor [41][48], Babel istemiyor [34], monorepo için `@source` yeterli [47]. Ücretsiz sürüm için SDK tablosu olmadığından [39] destek iddiası kanıta dayanıyor, beyana değil.
2. **NativeWind v5 bugün seçilmez.** RC, SDK 57'yi hedefliyor, "üretim için değil" [24][25]. RN 0.88'de `useFonts` ile yüklenen fontları sessizce bozan hatanın düzeltmesi birleşti ama hiçbir rc ya da kararlı sürüme girmedi [27][28][29]. Web'de elle tema seçimi de desteklenmiyor [30]. v5 kararlı çıkıp SDK 58'i hedeflediğinde yeniden bakılır.
3. **NativeWind v4 ikinci seçenek değil, geri dönüş.** Kararlı ama Tailwind v3'te kalıyor, resmi hedefi SDK 57 [10][11], Babel config ekletiyor [10] ve geleceği v5'e geçişle bağlı (Tailwind v3 → v4 config göçü [26]).
4. **twrnc ve Unistyles önerilmez.** twrnc Tailwind v4'ü desteklemiyor ve 2025-12'den beri yayın yok [58][60]. Unistyles Tailwind değil; Homelibra'nın `useThemedStyles` + token düzeninin yaptığını native bağımlılıkla (Nitro) yeniden yapar [62][63].
5. **Benimsemeden önce tek bileşenlik prototip** (ör. `packages/ui`'dan `chip`): (a) `withUniwindConfig(getSentryExpoConfig(…))` bileşimi ve Sentry source map'leri [5][34]; (b) Android, iOS ve web'de `useFonts` + `--font-*` eşlemesi [50]; (c) Ayarlar'daki Sistem/Açık/Koyu seçiminin `Uniwind.setTheme` ile web ve native'de çalışması, `useColorScheme()` etkileşimi [4][48]; (d) vitest'te `uniwind/vite` eklentisi ile yerel `react-native` alias'ının birlikte çalışması ve `css()` yardımcısının yerini ne alacağı [2][3][52][65]; (e) `tokens.ts` → `global.css` üretim betiği [49].
6. **Geçiş biçimi:** Kurulum bütün uygulamayı etkiler (Metro `react-native` yönlendirmesi [37]), ama stil geçişi dosya dosya yapılır; `StyleSheet`/`useThemedStyles` ile `className` yan yana yaşar [51]. `tokens.ts` geçiş boyunca tek kaynak kalır, CSS ondan üretilir.

## Açık sorular

- **Tailwind'e geçmeli mi?** Önceki araştırma className stilini mevcut kitin yanında "ikinci bir tasarım sistemi" diye işaretledi [8]. 76 dosyalık `StyleSheet`/`useThemedStyles` düzeni çalışıyor [1][2]. Kazanç (yazım hızı, web hover/focus, breakpoint'ler) geçiş ve iki stil dilini bir süre birlikte taşıma maliyetine değer mi?
- **Ücretsiz mi Pro mu Uniwind?** Ücretsiz sürümde className ile Reanimated animasyonu ve group variant yok, tema değişimi re-render ile olur. Pro ticari lisans ister, dev client gerektirir (Homelibra zaten `expo-dev-client` kullanıyor [1]) [39][40].
- **Token'ların tek kaynağı ne olacak?** `tokens.ts` mi kalır (CSS ondan üretilir), yoksa `global.css` mi kaynak olur (TS'te değer gerekenler `useCSSVariable` ile okunur) [49][57]?
- **Tema durumu nerede yaşar?** Homelibra store'u + `Uniwind.setTheme` senkronu mu, yoksa tercih doğrudan Uniwind'e mi devredilir (`useUniwind`)? Kalıcılık (`keepThemePreferenceIn`) nasıl bağlanır [4][48]?
- **UI testleri neyi doğrulayacak?** Hesaplanmış CSS değeri mi (gerçek motor ister), sınıf adı mı? Uniwind Vite eklentisi vitest'e eklenecek mi [3][52][53]?
- **`uniwind-types.d.ts` commit'lenecek mi**, yoksa CI'da `generate-artifacts` ile mi üretilecek [34][57]?
- **NativeWind v5 kararlı çıkınca** yeniden değerlendirme yapılacak mı? Tetikleyici: `latest` v5 olur ve hedef SDK 58+ olur [12][25].
- Uniwind ücretsiz sürümünün SDK 58'i resmi olarak desteklediğini gösteren bir tablo ya da release notu yok [39]; prototipte doğrulanmalı.

## Kaynaklar

1. `apps/app/package.json` (Homelibra); `apps/app/src` dosya taraması (`StyleSheet`, `useThemedStyles`)
2. `packages/ui/package.json`, `packages/ui/vitest.config.ts`; `packages/ui/src` dosya taraması
3. `packages/ui/src/tests/render.tsx`, `packages/ui/src/tests/react-native.tsx`
4. `packages/ui/src/lib/use-theme.ts`, `packages/ui/src/lib/tokens.ts`
5. `apps/app/app.json`, `apps/app/metro.config.js`, `apps/app/src/app/_layout.tsx` (babel.config.js yok)
6. `pnpm-workspace.yaml`
7. `docs/adr/0001-single-expo-universal-codebase.md`
8. `docs/research/expo-starter-ignite-obytes.md`
9. https://docs.expo.dev/guides/tailwind/
10. https://www.nativewind.dev/docs/getting-started/installation
11. https://github.com/nativewind/nativewind/releases/tag/nativewind%404.2.7
12. https://registry.npmjs.org/nativewind (`peerDependencies`, `dist-tags`, `time`, `maintainers`)
13. https://registry.npmjs.org/react-native-css-interop (0.2.7 `peerDependencies`)
14. https://www.nativewind.dev/docs
15. https://www.nativewind.dev/docs/core-concepts/dark-mode
16. https://www.nativewind.dev/docs/api/use-color-scheme
17. https://www.nativewind.dev/docs/guides/themes
18. https://www.nativewind.dev/docs/guides/using-with-monorepos
19. https://www.nativewind.dev/docs/guides/custom-fonts
20. https://www.nativewind.dev/docs/core-concepts/style-specificity
21. https://github.com/nativewind/nativewind/issues/1881
22. https://github.com/nativewind/nativewind/issues/1875
23. https://github.com/nativewind/nativewind (lisans, açık issue/PR sayısı, `.config/jest.config.cjs`)
24. https://www.nativewind.dev/v5/getting-started/installation
25. https://github.com/nativewind/nativewind/releases/tag/5.0.0-rc.1
26. https://github.com/nativewind/nativewind/releases/tag/5.0.0-rc.0
27. https://registry.npmjs.org/react-native-css (`peerDependencies`, `time`)
28. https://github.com/nativewind/react-native-css/issues/570
29. https://github.com/nativewind/react-native-css/pull/504
30. https://www.nativewind.dev/v5/core-concepts/dark-mode
31. https://www.nativewind.dev/v5/guides/themes
32. https://www.nativewind.dev/v5/guides/using-with-monorepos
33. https://www.nativewind.dev/v5
34. https://docs.uniwind.dev/quickstart
35. https://registry.npmjs.org/uniwind (`peerDependencies`, `dependencies`, `time`, `maintainers`)
36. https://github.com/uni-stack/uniwind/releases
37. https://github.com/uni-stack/uniwind/issues/737
38. https://github.com/uni-stack/uniwind/pull/740
39. https://docs.uniwind.dev/pro/compatibility
40. https://docs.uniwind.dev/pro-version
41. https://github.com/uni-stack/uniwind/blob/main/packages/uniwind/src/components/web/rnw.ts
42. https://github.com/uni-stack/uniwind/blob/main/packages/uniwind/src/components/web/View.tsx
43. https://github.com/uni-stack/uniwind/blob/main/packages/uniwind/package.json
44. https://github.com/uni-stack/uniwind/issues/695
45. https://github.com/uni-stack/uniwind/issues/597
46. https://github.com/uni-stack/uniwind/issues/688
47. https://docs.uniwind.dev/monorepos
48. https://docs.uniwind.dev/theming/basics
49. https://docs.uniwind.dev/theming/global-css
50. https://docs.uniwind.dev/faq ("How do I include custom fonts?")
51. https://docs.uniwind.dev/style-specificity
52. https://docs.uniwind.dev/vite
53. https://github.com/uni-stack/uniwind/blob/main/packages/uniwind/vitest.config.ts
54. https://github.com/uni-stack/uniwind/blob/main/packages/uniwind/tests/setup.web.ts
55. https://github.com/uni-stack/uniwind/issues/733
56. https://github.com/uni-stack/uniwind (README, lisans, açık issue'lar)
57. https://docs.uniwind.dev/llms.txt (doküman dizini: `useCSSVariable`, `getCSSVariable`, `updateCSSVariables`, `withUniwind`, `generate-artifacts`, test sayfası yok)
58. https://registry.npmjs.org/twrnc (`peerDependencies`, `dependencies`, `license`, `time`)
59. https://github.com/jaredh159/tailwind-react-native-classnames (README ve açık issue'lar)
60. https://github.com/jaredh159/tailwind-react-native-classnames/blob/master/changelog.md
61. https://github.com/uni-stack/uniwind/issues/682
62. https://www.unistyl.es/v3/start/getting-started
63. https://registry.npmjs.org/react-native-unistyles (`peerDependencies`, `license`, `maintainers`)
64. https://github.com/jpudysz/react-native-unistyles/releases
65. https://github.com/uni-stack/uniwind/blob/main/packages/uniwind/tests/web/vite.test.ts
