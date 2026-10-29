# Expo universal web olgunluğu ve mağaza dağıtım kuralları

Araştırma tarihi: 2026-10-29. Ticket: baspinarenes/homelibra#7 (besler: #15). İlgili karar: ADR-0001 (tek Expo universal kod tabanı: Capture telefonda, düzenleme ve geri çağırma masaüstü web'de).

## Soru

**A.** Güncel Expo SDK ile tek kod tabanı kararının web tarafındaki riskleri: Expo Router web ve react-native-web'de metin seçme ve panoya kopyalama, klavye kısayolları, uzun liste performansı, auth yönlendirme akışları, PWA, çevrimdışı gönderim kuyruğu için depolama (expo-sqlite, AsyncStorage, MMKV) ve statik render bugün nasıl davranıyor? Web desteği olmayan yaygın kütüphaneler hangileri?

**B.** Dağıtım kuralları: Google Play'in 13 Kasım 2023 sonrası açılan bireysel hesaplara kapalı test şartı (kaç test kullanıcısı, kaç gün, bugünkü kural ve kaynağı), internal testing ve APK yükleme seçenekleri, Apple Developer Program ücreti ve TestFlight gereksinimleri.

## Yöntem

- Yalnızca birincil kaynaklar okundu: docs.expo.dev ve expo.dev/changelog, react-native-web dokümantasyonu ve GitHub kaynak kodu (`necolas/react-native-web`, `expo/expo` `sdk-58` dalı), reactnative.dev, MDN (web platform standartları için), Google Play Console Yardım, developer.android.com, developer.apple.com. Kütüphane sürümleri `expo/expo` deposundaki `bundledNativeModules.json` (sdk-58) dosyasından alındı.
- Her iddianın yanında `[n]` kaynak numarası var; URL'ler "Kaynaklar" bölümünde.
- Blog ve üçüncü taraf yazılar kullanılmadı. Tek istisna: Google Play topluluk rehberi [55], yalnızca "20'den 12'ye düşürülme tarihi" için ve ikincil kaynak olarak işaretli.
- **Varsayımlar:** (1) Ticket'ta anılan `docs/adr/0001-single-expo-universal-codebase.md` araştırma sırasında `main` dalında yoktu; ADR'nin içeriği harita (#1) özetinden alındı. (2) Homelibra MVP'de web, çevrimiçi geri çağırma yüzeyidir; çevrimdışı gönderim kuyruğu telefondaki Capture için gerekir (#1). (3) Hiçbir davranış çalıştırılarak ölçülmedi; "doğrulanmalı" notu olan satırlar prototip ister.

## Bulgular

### Güncel Expo SDK

- **Expo SDK 58**, 15 Ekim 2026'da yayımlandı; React Native 0.86'dan **0.88**'e geçti [1]. Yeni SDK yılda üç kez çıkar [2].
- SDK 58 ile paketlenen sürümler: `react-native-web ~0.21.4`, `react 19.3.0`, `expo-router ~58.0.28`, `expo-sqlite ~58.0.14`, `@shopify/flash-list 2.3.2`, `react-native-reanimated 4.7.1`, `react-native-gesture-handler ~3.3.0`, `@react-native-async-storage/async-storage 2.2.0`, `react-native-webview 14.0.1` [3]. react-native-web'in son sürümü 0.21.4 (8 Ekim) [4].
- SDK 58 web için önemli değişiklikler: Expo Router'da data loader, sunucu tarafı render ve middleware artık deneysel bayrak istemiyor; `web.output` ayarlanmamışsa Expo Router projeleri `"server"` çıktısı kullanıyor; web'de async routes varsayılan açık; web'de safe-area insets artık `react-native-safe-area-context` ile değil CSS `env(safe-area-inset-*)` ile [1]. Kırılan değişiklikler: `InteractionManager` ve `Touchable` kök export'u kaldırıldı, `ImageBackground` kullanımdan kalktı, React Native Strict TypeScript API varsayılan oldu, Expo Router navigasyon çekirdeği değişti, deneysel web modal uygulaması kaldırıldı [1][43].

### A. Yetenek × web durumu × hafifletme

| Yetenek | Web'de bugünkü durum (SDK 58 / RNW 0.21) | Risk | Hafifletme |
|---|---|---|---|
| **Metin seçme** | RNW `Text` varsayılan stilinde `userSelect` yok; `selectable={true}` → `userSelect: 'text'`, `selectable={false}` → `userSelect: 'none'` [5]. Yani web'de metin tarayıcı varsayılanıyla seçilebilir. RNW 0.19 `userSelect` stilini ekledi ve `selectable` prop'unu kullanımdan kaldırdı [4]. Native RN'de `selectable` varsayılanı `false` [6]. RNW `Pressable` yalnızca `cursor: pointer` ve `touchAction: manipulation` uygular, `userSelect` dokunmaz [7]. | Platform farkı: Note metni web'de seçilir, telefonda seçilmez; web'de tıklanabilir satırlardaki metin sürüklemede istenmeden seçilir. Düşük. | Note/Excerpt içeriğinde `selectable` + `userSelect: 'text'`, liste satırı ve araç çubuğunda `userSelect: 'none'` açıkça verilir; Collection görünümünde "Markdown olarak kopyala" asıl kopyalama yolu olur. |
| **Panoya kopyalama** | `expo-clipboard` Android, iOS, Web'i destekler; web'de `getStringAsync` kullanıcıdan izin ister, `setStringAsync` boolean döner, `addClipboardListener` web'de no-op; WebKit'te API asenkron kodda sorunlu [8]. Clipboard API yalnızca güvenli bağlamda (HTTPS) çalışır; Firefox ve Safari yazma için "transient activation" (yakın kullanıcı etkileşimi) ister, Chromium izin ya da activation kabul eder [9]. | "Markdown olarak kopyala" tıklamadan sonra ağdan veri çekip sonra yazarsa Safari/Firefox'ta `NotAllowedError`. Orta. | Markdown metni tıklamadan önce hazır tutulur, `setStringAsync` tıklama işleyicisinde senkron çağrılır, dönen boolean'a göre "kopyalandı/kopyalanamadı" gösterilir; web her zaman HTTPS'te servis edilir. |
| **Klavye kısayolları** | RNW öğe düzeyinde `onKeyDown`, `onKeyUp` (+Capture), `onFocus`, `onBlur`, `onClick` sağlar; `View` için `tabIndex` [10][11]. `TextInput.onKeyPress` web'de `onKeyDown`a eşdeğer; `blurOnSubmit` tek satırda `true`, çok satırda `false`; `enterKeyHint` desteklenir [12]. Expo'nun klavye rehberi yalnızca yazılım klavyesini kapsar; birinci parti global kısayol API'si yok [13]. | Masaüstü akademisyen akışı (ara, yeni Note, kaydet) için global kısayol altyapısı yok; RN tiplerinde web key event prop'ları olmayabilir (doğrulanmalı). Orta. | `.web.ts` modülünde `window.addEventListener('keydown')` tabanlı `useShortcut` hook'u; native'de no-op sürümü. Expo Router platform dosyaları `app/` içinde yalnızca platformsuz sürüm varsa çalışır, bu yüzden bileşen klasöründe tutulup route'tan re-export edilir [14]. |
| **Uzun liste performansı** | RNW `FlatList`/`VirtualizedList`, RN'in vendor edilmiş JS sanallaştırmasıdır (0.18'de RN ile eşitlendi) [4]; ayar kolları RN'dekiyle aynı (`windowSize` varsayılan 21, `initialNumToRender` 10, `getItemLayout`, memo) [15]. Expo dokümanı FlashList için Web'i destekli listeler [16]; FlashList v2 yalnızca New Architecture'da çalışır [17] ve kendi dokümanı web hakkında bir şey söylemez [18]. Legend List %100 JS, native modül gerektirmez, FlatList/FlashList yerine geçer; roadmap'te "React DOM implementation" işaretsiz [19]. | Collection görünümü binlerce Note gösterebilir; web sanallaştırma performansı ölçülmemiş. Orta. | Sabit yüksek satır + `getItemLayout` + memo edilmiş satır; sayfalama/sunucu tarafı arama; FlashList ve Legend List web'de 5k Note ile prototip edilip ölçülür (doğrulanmalı). |
| **Auth yönlendirme akışları** | Expo Router `Stack.Protected` guard'ı, korumalı route'a derin bağlantı → giriş ekranına yönlendirme; örnek oturumu native'de `expo-secure-store`, web'de `localStorage` ile saklar [20]. Eski redirect rehberi (SDK ≤52) de istemci tarafı `<Redirect>` kullanır [21]. `expo-secure-store` web'i desteklemez (Android, iOS, tvOS) [24]. `expo-auth-session` web'de `makeRedirectUri`yi `window.location`dan üretir ve "production web için URL'yi sabit yazın" der; popup'ı kapatmak için `WebBrowser.maybeCompleteAuthSession()` gerekir; PKCE varsayılan açık; `clientSecret` istemcide güvenli saklanamaz [22]. `openAuthSessionAsync` web'de `window.open` ile masaüstünde popup, mobilde yeni sekme açar; yalnızca HTTPS/localhost; durum `localStorage`da tutulur, farklı host çalışmaz; mobilde kullanıcı etkileşiminden hemen sonra çağrılmalı; pencere ebeveynine referans bulamazsa `ERR_WEB_BROWSER_REDIRECT` [23]. Auth rehberindeki "Expo Router web'de yalnızca derleme zamanı statik üretimi destekler" ifadesi [20], SDK 58'in kararlı sunucu render/middleware'iyle [1][42] çelişiyor; rehber eski. | Web'de token `localStorage`da (XSS'e açık); popup akışı engelleyici ve COOP başlıklarına duyarlı (bkz. depolama satırı); yönlendirme URL'leri ortam başına elle yönetilir. Yüksek. | Web'de popup değil tam sayfa yönlendirme akışı; redirect URI'ler ortam başına sabit; sağlayıcı seçiminde (#15) web SDK'sı olgun ve çerez/`server` middleware ile çalışabilen sağlayıcı tercih edilir; native'de SecureStore. |
| **PWA** | Expo CLI yalnızca `favicon.ico` üretir; `public/manifest.json` ve service worker (Workbox) elle eklenir; manifest bağlantısı `static`/`server`da `+html.tsx`e, `single`da `public/index.html`e yazılır; doküman "service worker'lar web'de beklenmedik davranışlara yol açar" ve "çevrimdışı için native uygulama öneririz" diyor [27]. | Birinci parti çevrimdışı/SW desteği yok. Düşük (web MVP'de çevrimiçi). | MVP'de yalnızca manifest (yüklenebilirlik); SW yok. Çevrimdışı Capture telefonda. |
| **Çevrimdışı kuyruk: expo-sqlite** | Web dahil tüm platformlar; web'de Metro'ya `wasm` eklenir ve `SharedArrayBuffer` için `Cross-Origin-Embedder-Policy: credentialless` + `Cross-Origin-Opener-Policy: same-origin` başlıkları hem geliştirmede hem üretim sunucusunda şart; web wasm derlemesi FTS içermez; `withExclusiveTransactionAsync()` ve `directory` web'de yok [28][31]. Web worker kanalı `SharedArrayBuffer` + `Atomics` kullanır, yedek yol yok [29]. `expo-sqlite/kv-store` da aynı veritabanı açılışından geçer, yani web'de aynı başlıklar gerekir [30]. SDK 58 libSQL desteğini kaldırdı [1]. COOP `same-origin` belgesi, `unsafe-none` bir sayfayı `window.open` ile açarsa yeni browsing context group'a düşer ve referanslar kesilir [25]; COEP `require-corp` CORP başlığı olmayan çapraz kaynak görselleri engeller, `credentialless` çerezsiz yükler [26]. | Web'de SQLite açmak, popup tabanlı auth'u ve CORP başlıksız dış kaynakları bozabilir (türetilmiş risk; prototiple doğrulanmalı). Web'de yerel FTS yok. Yüksek (web'de kullanılırsa). | MVP'de expo-sqlite yalnızca native'de (Capture kuyruğu). Web'de kuyruk yok ya da bellek/AsyncStorage. Web'de SQLite gerekirse: auth redirect akışına geçilir ve tüm dış kaynaklar CORP/CORS ile test edilir [31]. |
| **Çevrimdışı kuyruk: AsyncStorage** | SDK 58 `2.2.0` paketler [3]; Android, iOS, macOS, tvOS, Web [32]. 2.2.0 web uygulaması `window.localStorage` [33]; Android varsayılan 6 MB (`AsyncStorage_db_size_in_MB`) [34]. 3.x (2026) web'de IndexedDB'ye geçti [35], Expo henüz paketlemiyor [3]. | localStorage senkron ve küçük; büyük Excerpt kuyruğu için uygun değil. Düşük. | Küçük meta/ayar için yeter; kuyruk native'de SQLite'ta. |
| **Çevrimdışı kuyruk: MMKV** | v4: iOS, Android, Web; web'de LocalStorage, kapalıysa veri kaybeden bellek içi yedek; Nitro Modules, Expo'da `npx expo prebuild` gerekir (Expo Go'da çalışmaz); RN ≥0.76 [36]. Expo paket listesinde yok [3]. | Web avantajı yok (yine localStorage); native derleme bağımlılığı. Düşük. | Gerekmez; SQLite + kv-store yeter. |
| **Ağ/arka plan** | `expo-network` web'de `type` `UNKNOWN` döner (`navigator.connection.type` yok) [38]; `expo-background-task` web'de `Restricted` [39]; `expo-file-system` web'i listelemez [37]. | Web'de "çevrimdışı" tespiti ve arka plan gönderim yok. Düşük. | Kuyruk boşaltma uygulama öne gelince/`online` olayında, yalnızca native. |
| **Statik render / web çıktısı** | `web.output`: `single` (SPA), `static` (her route için HTML), `server` (istek anında render + API routes) [40][44]. Uygulama config referansı varsayılanı `single` yazar [40]; SDK 58 changelog Expo Router projelerinde ayarsızken `server` kullanıldığını söyler [1]: tutarsız, `npx expo config` ile doğrulanmalı. `static`: route'lar derlemede HTML'e yazılır, dinamik route'lar `generateStaticParams` ister, `+html.tsx` yalnızca Node'da çalışır (`window` yok), SDK 58'de meta için `generateMetadata()`, `<Head>` etiketleri ilk HTML'de değil [41]. `server`: çalışma zamanı sunucusu şart, GitHub Pages gibi statik hostlara konmaz; adaptörler EAS Hosting, Express, Cloudflare Workers, Vercel Edge, Netlify Edge, Bun; static ve server karışmaz [42]. EAS Hosting'de özel alan adı ücretli planlarda [45]. SDK 57→58 geçişi `+html.tsx`te `useServerDocumentContext()` zorunlu kılar [43]. | Varsayılan `server`a kayarsa hosting maliyeti ve karmaşıklığı artar; `window`/`localStorage` erişimi prerender'da patlar; SDK 58 router çekirdeği değişimi churn üretir. Orta. | `web.output` açıkça `single` (giriş gerektiren uygulama, SEO yok); herkese açık tanıtım sayfası için `static`; `window` erişimi `typeof window` korumalı; `expo-router` sürümü sabitlenir. |

### A. Web desteği olmayan ya da kısıtlı yaygın kütüphaneler (Expo doküman platform listeleri)

| Kütüphane | Platformlar | Not |
|---|---|---|
| `expo-secure-store` | Android, iOS, tvOS [24] | Web yok; auth örneği web'de `localStorage` kullanır [20]. |
| `expo-notifications` | Android, iOS [46] | Web yok. |
| `react-native-webview` | Android, iOS [47] | Web yok. |
| `expo-background-task` | Android, iOS, tvOS [39] | Web'de `Restricted`. |
| `expo-file-system` | Android, iOS, tvOS [37] | Web listelenmiyor. |
| `expo-local-authentication` | Android, iOS [48] | Web yok. |
| `expo-sqlite` | Web dahil, başlık şartıyla; web'de FTS yok [28] | Yukarıdaki satır. |
| `expo-sharing` | Web kısıtlı: Web Share API, HTTPS, yerel dosya URI paylaşılamaz [49] | Önce `isAvailableAsync()`. |
| `expo-haptics` | Android, iOS, Web (Vibration API) [50] | Masaüstünde donanım yok. |
| `react-native-mmkv` | iOS, Android, Web (localStorage) [36] | Expo listesinde yok [3]. |
| Web destekli: `react-native-reanimated` 4.7.1 (Android, iOS, tvOS, Web) [51], `expo-clipboard` [8], `expo-network` [38], AsyncStorage [32], FlashList (Expo listesine göre) [16]. | | Expo: "Expo SDK'daki tüm kütüphaneler tarayıcı ve sunucu render ortamlarını (uygulanabilir olduğunda) destekler" [52]. Üçüncü taraf için React Native Directory kontrol edilir [53]. |

### B. Dağıtım gerçekleri

| Konu | Bugünkü kural (2026-10-29) | Kaynak |
|---|---|---|
| Google Play kapalı test şartı | 13 Kasım 2023 sonrası açılan **bireysel** geliştirici hesapları, üretime çıkmadan önce **en az 12 test kullanıcısının en az 14 ardışık gün** boyunca kayıtlı kaldığı bir kapalı test yürütmeli; çıkıp geri giren kullanıcıda sayım sıfırlanır; şart sağlanıncaya kadar Production ve Pre-registration kapalı; sonra Dashboard'dan "Apply for production", üç bölümlü anket, inceleme genelde ≤7 gün. | [54] |
| 20 → 12 değişikliği | Resmi yardım sayfası tarihçe vermez [54]. Google Play topluluk rehberi ilk kuralın 20 kişi olduğunu ve Aralık 2024'te 12'ye indirildiğini yazar; sayfa içeriği otomatik çekilemediği için bu tarih yalnızca arama özetinden alındı, ikincil kaynaktır. | [55] |
| Play hesabı kaydı | Tek seferlik 25 USD; resmi kimlik ve kredi kartı istenebilir; bireysel hesap sahibi yayından önce Play Console mobil uygulamasıyla bir Android cihaza erişimini doğrulamalı. | [56] |
| Internal testing | Uygulama başına en çok **100** test kullanıcısı; yeni AAB dakikalar içinde erişilebilir; standart Play politika/güvenlik incelemesine tabi olmayabilir. Kapalı test: en çok 200 liste × 2.000 kullanıcı (track başına 50 liste), Google Groups ile; açık test alt sınırı 1.000; ilk yayında bağlantı birkaç saat sürebilir. | [57] |
| APK yükleme (sideloading) | Web sitesi/e-posta ile APK dağıtılabilir; kullanıcı Android 8+'da kaynak başına "Bilinmeyen uygulamaları yükle"ye izin vermeli; bazı operatörler engeller. EAS Build `distribution: internal` ile APK üretir, bağlantıdan ya da USB ile kurulur; AAB yalnızca Play'den. | [58][59] |
| Android geliştirici doğrulaması (2026–2027) | 30 Eylül 2026'dan itibaren Brezilya, Endonezya, Singapur, Tayland'da sertifikalı Android 7+ cihazlarda katılımcı mağazalardan kurulumlar için doğrulama; 2027'de küresel; ADB ile kurulum muaf; öğrenci/hobi için 20 cihaza kadar ücretsiz, kimliksiz "limited distribution" hesabı; tam dağıtım hesabı 25 USD; Play Console hesabı doğrulamayı yönetebilir, Play App Signing kullananların uygulamaları otomatik kaydedilir. Türkiye ilk dalgada değil. | [60][61] |
| Apple Developer Program | **99 USD/üyelik yılı**, bölgeye göre yerel para biriminde gösterilir; bireysel kayıt: reşit olmak, iki faktörlü Apple Account, yasal ad, P.O. box olmayan adres; kuruluş: tüzel kişilik, D-U-N-S, kurumsal e-posta ve çalışan web sitesi; ücret muafiyeti yalnızca kâr amacı gütmeyen/eğitim/kamu. Üyelik TestFlight ve App Store Connect erişimi içerir. Ücretsiz hesap: 3 cihaz, 10 App ID, 7 günde süresi dolan profiller. | [62][63][64] |
| TestFlight | Dahili: en çok 100 App Store Connect kullanıcısı; harici: en çok 10.000 kişi, gruba eklenen ilk build App Review'a gider, sonrakiler tam inceleme gerektirmeyebilir; build 90 gün test edilebilir; herkese açık bağlantı; aynı anda 100 build; test kullanıcısı 30 cihaza kadar. | [65][66] |
| Ad hoc (iOS) | Ürün ailesi başına yılda **100 cihaz**; cihazı devre dışı bırakmak kota açmaz; kota yeni üyelik yılında sıfırlanabilir. EAS ad hoc ücretli Apple hesabı ister; Apple yeni cihazı 24–72 saatte işleyebilir. | [67][59] |

## Öneri

ADR-0001 korunabilir; riskler mimariyi değil sınırları belirliyor. Spec'e (#15) girmesi gereken kararlar:

1. **Web çıktısı:** `web.output: "single"` açıkça yazılır (giriş gerektiren Library arayüzü, SEO gereksiz); tanıtım sayfası gerekirse ayrı küçük statik site. `server` çıktısı ve EAS Hosting ancak middleware tabanlı auth istenirse gündeme gelir [1][42].
2. **Depolama sınırı:** `expo-sqlite` yalnızca native'de (Capture gönderim kuyruğu, kv-store). Web'de SQLite açılmaz; böylece COOP/COEP başlıkları, popup auth kırılması ve dış kaynak engelleri gündeme gelmez [28][29][25].
3. **Auth:** Web'de tam sayfa yönlendirme akışı, sabit redirect URI'ler, popup yok [22][23]; native'de SecureStore [24]. Sağlayıcı seçimi (#15) "web SDK'sı olgun ve çerez destekli" ölçütüyle yapılır.
4. **Kopyalama ve seçme:** "Markdown olarak kopyala" metni tıklamadan önce hazır; `setStringAsync` tıklama işleyicisinde; dönüş değeri kullanıcıya gösterilir [8][9]. Note içeriği `userSelect: 'text'`, liste satırları `'none'` [5].
5. **Klavye ve listeler:** Web-only `useShortcut` modülü [14]; Collection listesi sabit yükseklikli satır + sayfalama; FlashList/Legend List web'de ölçülmeden benimsenmez [15][16][19].
6. **Dağıtım planı:** Play'de hesap türüne göre kapalı test 12 kişi × 14 gün hemen başlatılır (davetli beta kitlesinden), hızlı iterasyon internal testing (100 kişi) ile [54][57]; Türkiye'deki test kullanıcılarına APK ile EAS internal distribution 2027 küresel doğrulamaya kadar sorunsuz [58][61]. iOS için 99 USD/yıl bütçelenir, TestFlight harici test ilk build'de App Review bekler [62][65]; harita sırasına göre iOS Android+web'den sonra.
7. **SDK takibi:** SDK 58 yeni (2 hafta); `expo-router` navigasyon çekirdeği ve `+html.tsx` değişiklikleri için 58.0.x yamaları izlenir, upgrade'ler yılda üç kez planlanır [1][2][43].

## Açık sorular

- Play geliştirici hesabı bireysel mi kurumsal mı, ne zaman açıldı? 12×14 kuralı yalnızca 13 Kasım 2023 sonrası bireysel hesaplara uygulanır [54].
- Apple'a birey mi kuruluş (D-U-N-S) olarak mı kayıt olunacak; Türkiye için yerel para birimi fiyatı doğrulanmadı [62].
- 12 kapalı test kullanıcısı kim olacak; hepsi Android'de mi? (Davetli akademisyen kitlesi ile örtüşmesi.)
- SDK 58'de `web.output` varsayılanı: changelog `server` [1], config referansı `single` [40]. `npx expo config --type public` ile doğrulanmalı.
- Tam metin arama motoru (#15): web wasm derlemesi FTS içermediği için [28] arama sunucuda mı?
- Web'de de çevrimdışı Capture istenecek mi? İstenirse COOP/COEP + redirect auth maliyeti ödenmeli.
- FlashList/Legend List web performansı ve RN tiplerinde web key event prop'ları: prototip ticket'ı.
- 20→12 değişikliğinin tarihi için resmi bir Google duyurusu bulunamadı [55].

## Kaynaklar

1. https://expo.dev/changelog/sdk-58
2. https://docs.expo.dev/versions/latest/
3. https://github.com/expo/expo/blob/sdk-58/packages/expo/bundledNativeModules.json
4. https://github.com/necolas/react-native-web/releases
5. https://github.com/necolas/react-native-web/blob/master/packages/react-native-web/src/exports/Text/index.js
6. https://reactnative.dev/docs/text
7. https://github.com/necolas/react-native-web/blob/master/packages/react-native-web/src/exports/Pressable/index.js
8. https://docs.expo.dev/versions/latest/sdk/clipboard/
9. https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API
10. https://necolas.github.io/react-native-web/docs/interactions/
11. https://necolas.github.io/react-native-web/docs/view/
12. https://necolas.github.io/react-native-web/docs/text-input/
13. https://docs.expo.dev/guides/keyboard-handling/
14. https://docs.expo.dev/router/advanced/platform-specific-modules/
15. https://reactnative.dev/docs/optimizing-flatlist-configuration
16. https://docs.expo.dev/versions/latest/sdk/flash-list/
17. https://github.com/Shopify/flash-list
18. https://shopify.github.io/flash-list/docs/
19. https://github.com/LegendApp/legend-list
20. https://docs.expo.dev/router/advanced/authentication/
21. https://docs.expo.dev/router/advanced/authentication-rewrites/
22. https://docs.expo.dev/versions/latest/sdk/auth-session/
23. https://docs.expo.dev/versions/latest/sdk/webbrowser/
24. https://docs.expo.dev/versions/latest/sdk/securestore/
25. https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cross-Origin-Opener-Policy
26. https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cross-Origin-Embedder-Policy
27. https://docs.expo.dev/guides/progressive-web-apps/
28. https://docs.expo.dev/versions/latest/sdk/sqlite/
29. https://github.com/expo/expo/blob/sdk-58/packages/expo-sqlite/web/WorkerChannel.ts
30. https://github.com/expo/expo/blob/sdk-58/packages/expo-sqlite/src/Storage.ts
31. https://github.com/expo/expo/blob/sdk-58/packages/expo-sqlite/skills/expo-sqlite/references/web-and-config.md
32. https://docs.expo.dev/versions/latest/sdk/async-storage/
33. https://github.com/react-native-async-storage/async-storage/blob/%40react-native-async-storage/async-storage%402.2.0/packages/default-storage/src/AsyncStorage.ts
34. https://react-native-async-storage.github.io/2.0/advanced/IncreaseDbSize/
35. https://github.com/react-native-async-storage/async-storage/blob/main/packages/async-storage/src/createAsyncStorage.ts
36. https://github.com/mrousavy/react-native-mmkv
37. https://docs.expo.dev/versions/latest/sdk/filesystem/
38. https://docs.expo.dev/versions/latest/sdk/network/
39. https://docs.expo.dev/versions/latest/sdk/background-task/
40. https://docs.expo.dev/versions/latest/config/app/
41. https://docs.expo.dev/router/reference/static-rendering/
42. https://docs.expo.dev/router/web/server-rendering/
43. https://docs.expo.dev/router/migrate/sdk-57-to-58/
44. https://docs.expo.dev/guides/publishing-websites/
45. https://docs.expo.dev/eas/hosting/introduction/
46. https://docs.expo.dev/versions/latest/sdk/notifications/
47. https://docs.expo.dev/versions/latest/sdk/webview/
48. https://docs.expo.dev/versions/latest/sdk/local-authentication/
49. https://docs.expo.dev/versions/latest/sdk/sharing/
50. https://docs.expo.dev/versions/latest/sdk/haptics/
51. https://docs.expo.dev/versions/latest/sdk/reanimated/
52. https://docs.expo.dev/workflow/web/
53. https://docs.expo.dev/workflow/using-libraries/
54. https://support.google.com/googleplay/android-developer/answer/14151465
55. https://support.google.com/googleplay/android-developer/community-guide/255621488/everything-about-the-12-testers-requirement
56. https://support.google.com/googleplay/android-developer/answer/6112435
57. https://support.google.com/googleplay/android-developer/answer/9845334
58. https://developer.android.com/distribute/marketing-tools/alternative-distribution
59. https://docs.expo.dev/build/internal-distribution/
60. https://developer.android.com/developer-verification
61. https://developer.android.com/developer-verification/guides/faq
62. https://developer.apple.com/programs/enroll/
63. https://developer.apple.com/help/account/membership/programs-overview/
64. https://developer.apple.com/support/compare-memberships/
65. https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview/
66. https://developer.apple.com/testflight/
67. https://developer.apple.com/help/account/devices/devices-overview
