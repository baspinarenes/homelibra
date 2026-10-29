# Expo + web SDK'sı olgun backend ve auth seçenekleri

Tarih: 2026-10-29 · Konu: GitHub issue #8 · Besler: #14 (hesap, davet, veri sahipliği) ve #15 (teknoloji stack'i ve monorepo)

## Soru

Homelibra tek bir Expo universal kod tabanıyla (Android, iOS, web; uçtan uca TypeScript) geliştirilecek, çok kullanıcılı bir araştırma notu uygulaması. Her kullanıcı yalnızca kendi Library'sini (Note, Source ve Capture kayıtlarını) görmeli. Hangi backend ve auth seçeneklerinin hem Expo hem web SDK'ları olgun? Aday kümesi: Supabase, Convex, Firebase, Clerk, Better Auth; çevrimdışı gönderim kuyruğu (Capture'ın bağlantısız kaydedilip sonra gönderilmesi) için PowerSync veya WatermelonDB.

Her aday için bakılan ölçütler:

1. Expo ve web SDK durumu (Expo Go'da çalışır mı, development build gerekir mi)
2. E-posta magic link ve Google ile giriş
3. Çok kullanıcılı veri ayrımı modeli (Library izolasyonu)
4. Ücretsiz katman ve küçük ölçek (100–500 kullanıcı) fiyatı
5. Türkçe tam metin arama (FTS) ile uyum
6. Veri bölgeleri (AB / ABD)
7. Veri dışa aktarma

## Yöntem

- Yalnızca birincil kaynaklar okundu: sağlayıcıların resmî dokümantasyonu, fiyat sayfaları, lisans dosyaları ve PostgreSQL kaynak kodu. Okuma 2026-10-29'da yapıldı; fiyat ve limitler o günkü sayfalara aittir.
- Her iddianın yanında köşeli parantezli kaynak kodu var (örn. [S1]); tam URL listesi "Kaynaklar" bölümünde.
- Okunamayan sayfalar (JavaScript ile yüklenen Google Cloud fiyat tabloları) "belirsiz" diye işaretlendi; tahmin yürütülmedi.
- Varsayımlar: (a) "küçük ölçek" = 100–500 kayıtlı kullanıcı, aylık aktif kullanıcı bunun altında; (b) üretimde magic link e-postaları için ayrı bir e-posta servisi gerekeceği kabul edildi, maliyeti araştırılmadı; (c) Expo SDK sürümü sabitlenmedi.
- Karşılaştırmayı tek kişi yaptı; çapraz doğrulama yalnızca aynı sağlayıcının birden fazla sayfası arasında yapıldı.

## Bulgular

### Karşılaştırma tablosu

| Ölçüt | Supabase | Convex | Firebase | Clerk | Better Auth | PowerSync | WatermelonDB |
|---|---|---|---|---|---|---|---|
| Expo SDK | `supabase-js` + AsyncStorage, saf JS; Expo rehberi var [S5] | `convex` paketi, `create-expo-app` ile resmî quickstart [C1] | JS SDK Expo Go'da ek kurulumsuz; React Native Firebase için dev build [E3] | `@clerk/expo`; hosted ve custom flow Expo Go'da, native bileşenler dev build [K1][K2] | `@better-auth/expo` eklentisi, SecureStore [B2] | `@powersync/react-native` + op-sqlite; Expo Go için ayrı sql.js adaptörü [PS1] | Native kod (JSI/SQLite); resmî Expo rehberi yok, dev build gerekir [W1][E1] |
| Web SDK | Aynı `supabase.auth` istemcisi [S4] | Aynı React istemcisi [C3] | Firebase JS SDK [F1] | `@clerk/expo/web` [K2] | `better-auth/react` istemcisi [B2] | `@powersync/web`; RN Web desteği beta [PS2][PS3] | `LokiJSAdapter` (IndexedDB) [W2] |
| Magic link | `signInWithOtp`, Expo'da deep link [S3][S10]; varsayılan e-posta 2/saat [S9] | Convex Auth (beta); RN'de OTP önerilir [C5][C6] | Var; Spark'ta 5 e-posta/gün; mobilde Dynamic Links kapanışı sonrası yeni SDK şart [F1][F2][F9] | Expo için rehber yok [K5]; Clerk makalesi Expo Go'da çalıştığını söylüyor [K4] | Eklenti var; e-postayı sen gönderirsin [B3] | — (auth sağlamaz) | — |
| Google | RN: ID token + `signInWithIdToken`; web: OAuth / One Tap [S4] | Convex Auth Google (beta) veya Clerk [C4][C8] | Popup/redirect; ID token + `signInWithCredential` [F3] | `useSSO()` tarayıcı; `useSignInWithGoogle()` native, dev build [K2][K3] | `signIn.social`; native için idToken akışı [B4] | — | — |
| Veri ayrımı | Postgres RLS, `auth.uid()` [S7] | Fonksiyon kodunda `ctx.auth`; convex-helpers RLS sarmalayıcı [C10][C11] | Security Rules `request.auth.uid` [F4] | Yalnızca kimlik; Supabase RLS ile `auth.jwt()->>'sub'` [K7] | Kendi API/DB'n; organization eklentisi [B6] | Sync Streams `auth.user_id()` [PS5] | Kendi pull/push backend'in [W5] |
| Ücretsiz / küçük ölçek | Free 50k MAU, 500 MB, 1 hafta pasiflikte durdurma; Pro $25/ay [S1] | Free 1M çağrı, 0,5 GB; Pro $25/geliştirici/ay; ABD dışı 1,3× [C13][C14][C15] | Auth 50k MAU; Firestore 1 GiB, 50k okuma/gün; export ve eklentiler için Blaze [F7][F8][F12] | Free 50k MRU; Pro $25/ay [K6] | MIT, ücretsiz; barındırma senin [B7] | Free 2 GB senkron/ay, 50 eşzamanlı istemci; Pro $49/ay [PS9] | MIT, ücretsiz [W7] |
| Türkçe FTS | Postgres `turkish` yapılandırması [P1][P2][S6] | "English veya Latin alfabeli dillerde en iyi"; gövdeleme belgelenmemiş [C12] | Standard'da yerleşik FTS yok; Enterprise edition veya Algolia [F5][F6] | — | DB'ye bağlı; Postgres ise ✓ [B5] | İstemcide SQLite FTS5 unicode61; Türkçe gövdeleme yok [PS8] | Yalnızca `LIKE`; ASCII dışı harf sorunu [W6] |
| Bölgeler | 6 AB + 4 ABD AWS bölgesi [S2] | us-east-1; eu-west-1 İrlanda (+%30) [C15][C16] | Firestore'da AB bölgeleri; Auth yalnızca ABD [F10][F11] | Yalnızca ABD, bölge seçimi yok [K8] | Nereye kurarsan | US, EU (eu-west-1), JP, AU, BR, IN [PS10] | Kendi backend'in |
| Dışa aktarma | `supabase db dump` (pg_dump) [S11]; Free'de günlük yedek yok [S8] | `npx convex export` → ZIP/JSONL [C17][C18] | Yönetilen export, Blaze gerekir [F12] | CSV (şifre hash'leri dahil) + Backend API [K9] | Kendi DB'n | Veri kaynak Postgres'te kalır [PS7] | Kendi DB'n |

### Supabase

- **SDK.** Expo rehberi `@supabase/supabase-js` ve `@react-native-async-storage/async-storage` kuruyor; oturumu şifrelemek için isteğe bağlı `expo-secure-store` + AES kullanılıyor [S5]. Web örnekleri aynı `supabase.auth` istemcisiyle veriliyor [S4].
- **Magic link.** `signInWithOtp` varsayılan olarak magic link gönderir; kullanıcı 60 saniyede bir isteyebilir, link 1 saat geçerli; Expo örneğinde `emailRedirectTo` için `expo-auth-session`'ın `makeRedirectUri()` fonksiyonu kullanılıyor [S3]. Deep link rehberinde `expo-linking` ile gelen URL yakalanıp `access_token`/`refresh_token` ile `setSession` çağrılıyor; redirect URL allowlist'e `com.supabase://**` gibi eklenmeli [S10].
- **E-posta gönderimi (kritik).** Varsayılan e-posta servisi "2 messages per hour" ile sınırlı, yalnızca projenin ekip üyelerine gönderiyor ve "not meant for production use"; özel SMTP şart, özel SMTP sonrası başlangıç limiti 30/saat [S9].
- **Google.** Expo'da `@react-native-google-signin/google-signin` ile ID token alınıp `signInWithIdToken` çağrılıyor; web'de `signInWithOAuth` veya Google One Tap [S4]. google-signin paketi "cannot be used in Expo Go because it uses native code"; config plugin + `npx expo prebuild --clean` ile development build gerekiyor [E5].
- **Library izolasyonu.** RLS her tabloda açılmalı; politikalar `auth.uid()` ile yazılıyor, önerilen kalıp `to authenticated` + `using ( (select auth.uid()) = user_id )`; politika filtrelediği sütunlara index ve politika testleri öneriliyor [S7].
- **Fiyat.** Free: 50.000 MAU, 500 MB veritabanı, 1 GB dosya, 5 GB egress, 2 aktif proje, "Free projects are paused after 1 week of inactivity". Pro $25/ay: 100.000 MAU (sonra $0,00325/MAU), 8 GB disk (sonra $0,125/GB), 100 GB dosya, $10 compute kredisi; ücretli planlar durdurulmuyor [S1]. Clerk gibi üçüncü taraf auth kullanılırsa plan kotasını aşan her üçüncü taraf MAU $0,00325 [S12].
- **Bölgeler.** AWS: eu-west-1 İrlanda, eu-west-2 Londra, eu-west-3 Paris, eu-central-1 Frankfurt, eu-central-2 Zürih, eu-north-1 Stockholm; ABD'de 4 bölge [S2]. Bölge değişikliği için proje taşıma kullanılıyor ("Project migration is primarily for changing regions") [S13].
- **Dışa aktarma / yedek.** `supabase db dump` kapsayıcıda `pg_dump` çalıştırır; `--data-only`, `--use-copy`, `-f` bayrakları var [S11]. Günlük yedek Pro (7 gün), Team (14 gün), Enterprise (30 gün); Free için düzenli `db dump` öneriliyor [S8].

### Convex

- **SDK.** React Native quickstart `npx create-expo-app` ile başlıyor, tek paket `convex`; `ConvexProvider`/`ConvexReactClient` `convex/react`'ten, URL `EXPO_PUBLIC_CONVEX_URL` [C1]. RN sayfası standart React'ten farklı yapılandırma gerektiğini söylüyor [C2]. Web için aynı React istemcisi [C3].
- **Auth.** Resmî dokümanda "Convex Auth is in beta (it isn't complete and may change in backward-incompatible ways)"; üçüncü taraf için Clerk "great Next.js and React Native support", ayrıca WorkOS, Auth0, özel OIDC [C4]. Convex Auth magic link/OTP, OAuth (GitHub, Google, Apple) ve şifre destekliyor; React SPA, Next.js ve React Native hedefleniyor, UI bileşeni yok [C5]. Magic link sayfası "for React Native or to improve the user experience" OTP kullanılmasını söylüyor; e-posta için Resend örneği [C6]. `ConvexAuthProvider`'da "You must set this for React Native" (storage; `expo-secure-store` öneriliyor); `code` parametresi "used only in RN" [C9]. Google callback'i `*.convex.site` alan adında; özel alan adı Pro'da [C8].
- **Library izolasyonu.** Fonksiyon içinde `ctx.auth.getUserIdentity()` ile kimlik alınıyor, yetkilendirme kodda [C10]. convex-helpers RLS sarmalayıcısı tablo başına read/insert/modify kuralı tanımlıyor; "By default, tables with no rule have `defaultPolicy` set to 'allow'" [C11].
- **FTS.** Tablo başına tek `searchField`; Tantivy `SimpleTokenizer` boşluk/noktalamaya göre böler ve küçük harfe çevirir; "work[s] best with English or other Latin-script languages"; "Search has no typo tolerance"; yalnızca son terimde prefix eşleşmesi; sorgu en fazla 1024 sonuç tarar; gövdeleme (stemming) hiç geçmiyor [C12].
- **Fiyat.** Free/Starter: 1M fonksiyon çağrısı/ay, 0,5 GB veritabanı, 1 GB DB bant genişliği, 1 GB dosya, 6 geliştiriciye kadar; Free'de sert limitler, Starter kullandıkça öde. Professional $25/geliştirici/ay: 25M çağrı, 50 GB DB, 100 GB dosya [C13][C14]. "Usage in regions outside the US is billed at 1.3x the standard rate" [C15].
- **Bölgeler.** aws-us-east-1 (standart), aws-eu-west-1 İrlanda (+%30), aws-ap-southeast-2, aws-ca-central-1; "An existing deployment's region cannot be changed" [C15]. AB bölgesi 6 Şubat 2026'da açıldı, "available on all plans including free" [C16].
- **Dışa aktarma.** `npx convex export` veya dashboard'dan ZIP; her tablo `<table_name>/documents.jsonl`; manuel yedek 7 gün saklanır; "Periodic backups require a Convex Pro plan"; Free'de aynı anda en fazla 2 yedek [C17][C18].
- **Çevrimdışı.** "Convex React automatically retries mutations until they are confirmed to have been written to the database"; bağlantı kopunca oturum otomatik yeniden kuruluyor; sekme kapatılırken bekleyen mutasyon uyarısı var; çevrimdışı-öncelikli destek iddiası yok [C3].

### Firebase

- **SDK.** Expo dokümanı: Firebase JS SDK için "You do not have to install other plugins or configurations"; Authentication, Firestore, Realtime Database ve Storage destekleniyor; React Native Firebase "requires custom native code and cannot be used with Expo Go"; Expo için `firebase@12.0.0` ve üstü gerekiyor [E3].
- **Magic link.** `sendSignInLinkToEmail` / `isSignInWithEmailLink` / `signInWithEmailLink`; `handleCodeInApp: true` zorunlu; mobil email link akışı "shutdown of Firebase Dynamic Links on August 25, 2025" kapsamında, yeni SDK ve ek adımlar gerekiyor [F1]; SSS web akışının etkilenmediğini söylüyor [F2]. Limitler: email link giriş e-postası Spark'ta **5/gün**, Blaze'de 25.000/gün [F9].
- **Google.** Web'de `signInWithPopup`/`signInWithRedirect`; tarayıcı dışı ortamlarda Google ID token + `signInWithCredential` [F3].
- **Library izolasyonu.** Security Rules: `allow read, update, delete: if request.auth != null && request.auth.uid == userId`; "The server client libraries bypass all Cloud Firestore Security Rules"; kurallar filtre değil, sorgu kuralla uyumlu `where` içermeli [F4].
- **FTS.** Firestore metin araması sayfası: "Text search requires a Firestore Enterprise edition database" [F5]. Standard edition için Algolia eklentisi "Enables full text search of your Cloud Firestore data with Algolia", Blaze planı ve Algolia hesabı gerektiriyor [F6]. Enterprise metin aramasının Türkçe analizör desteği: belirsiz.
- **Fiyat.** Auth: Spark ve Blaze'de 50K MAU ücretsiz, sonrası "Google Cloud pricing" (birim fiyat sayfada yok) [F7]; Identity Platform fiyat tablosu okunamadı [F13]. Firestore ücretsiz kota: 1 GiB, 50.000 okuma/gün, 20.000 yazma/gün, 20.000 silme/gün, 10 GiB çıkış/ay, proje başına tek ücretsiz veritabanı [F8]; bölgesel birim fiyatlar okunamadı [F14]. Cloud Functions fiyatı yalnızca Blaze bölümünde [F7].
- **Bölgeler.** Firestore: eur3 (Belçika + Hollanda), europe-west3 Frankfurt, europe-west1 Belçika vb.; "once you provision a database instance, you cannot change its location setting" [F10]. Ancak "The Firebase Authentication service is run only from US data centers" ve veriyi "exclusively in the United States" işliyor [F11].
- **Dışa aktarma.** Yönetilen export Cloud Storage'a yazar; "Firebase projects must be on the Blaze plan"; belge başına bir okuma faturalanır [F12].

### Clerk

- **SDK.** Quickstart `@clerk/expo` + `expo-secure-store` tabanlı `tokenCache`; hosted auth ve custom flow Expo Go'da çalışıyor, `@clerk/expo-native-components` ve native Google/Apple hook'ları development build istiyor [K1][K2]. Web için `@clerk/expo/web` [K2]. Clerk makalesi SDK 54 ve 55'in iOS/Android'de desteklendiğini, Expo Go'nun "cannot register custom URL schemes" ve "cannot load custom native modules" olduğunu söylüyor [K4].
- **Magic link.** Email link custom-flow rehberleri Next.js, React, Nuxt, Vue, Astro, React Router, TanStack Start, Express, Fastify, Go, Ruby, JavaScript, Chrome Extension için listeleniyor; Expo yok [K5]. Buna karşın Clerk'in Expo 54/55 makalesi "magic links ([email links])" akışını Expo Go'da çalışan JavaScript custom flow'lar arasında sayıyor [K4]. Çelişki; doğrulanmalı. Quickstart e-posta kodu (`verifyEmailCode`) gösteriyor [K1].
- **Google.** `useSSO()` tarayıcı tabanlı OAuth; `useSignInWithGoogle()` native akış, "Google Authentication is not supported in Expo Go", native uygulamada bile web client ID gerekiyor [K2][K3].
- **Library izolasyonu.** Clerk yalnızca kimlik; Supabase ile native üçüncü taraf auth entegrasyonu: `user_id` sütunu `default auth.jwt()->>'sub'`, RLS politikaları bu claim'e göre; eski JWT template 1 Nisan 2025 itibarıyla deprecated; kullanıcı kayıtları senkronlanmaz [K7].
- **Fiyat.** Hobby $0: 50.000 MRU (monthly retained users), 3 sosyal bağlantı, 7 günlük sabit oturum süresi, 1 günlük log; Pro $25/ay ($20 yıllık), 50.001–100.000 arası $0,02/MRU; "Secured by Clerk" markası Pro'da kaldırılıyor [K6].
- **Bölgeler.** "Data is hosted on US infrastructure"; "Clerk does not offer regional data residency or region selection"; AB verisi DPF ile ABD'ye aktarılıyor [K8].
- **Dışa aktarma.** Dashboard'dan CSV, "includes their hashed passwords"; Backend API `GetUserList` [K9].

### Better Auth

- **Ne?** "framework-agnostic, universal authentication and authorization framework for TypeScript"; "Your auth lives in your codebase" [B1]. Lisans MIT [B7]. Bir backend değil; kendi sunucun ve veritabanın gerekir.
- **SDK.** `@better-auth/expo` sunucu eklentisi + `expoClient`; `expo-secure-store` oturum ve çerezleri saklıyor; sosyal giriş ya `expo-web-browser` + deep link callback ile ya da cihazda alınan `idToken` ile (yalnızca Google, Apple, Facebook; örnek `@react-native-google-signin/google-signin`); sunucu "a separate server" veya Expo API Routes (`app/api/auth/[...auth]+api.ts`); `trustedOrigins`'e `myapp://` eklenmeli; SDK 55'te New Architecture zorunlu [B2]. Expo API Routes "executed on a server", EAS Hosting veya başka sağlayıcıya dağıtılır; native için sunucu dağıtımı alpha [E4]. Expo Go hakkında bir ifade yok.
- **Magic link.** `magicLink()` eklentisi `sendMagicLink` callback'i çağırır, e-postayı sen gönderirsin; varsayılan geçerlilik 300 saniye; istemcide `signIn.magicLink` [B3].
- **Google.** `signIn.social({ provider: "google" })` yönlendirme akışı; native için `idToken` ile doğrudan giriş [B4].
- **Veritabanı / izolasyon.** Yerleşik Kysely adaptörü SQLite/D1, PostgreSQL, MySQL, MSSQL; Drizzle ve Prisma adaptörleri; MongoDB; çekirdek tablolar `user`, `session`, `account`, `verification` [B5]. Çok kiracılı roller için organization eklentisi (owner/admin/member, davet, team); uygulama verisine erişim kontrolü sende [B6].
- **Fiyat / bölge / FTS / export.** Lisans ücretsiz; maliyet barındırma + e-posta servisi (varsayım). Bölge ve dışa aktarma kendi Postgres'ine bağlı; Türkçe FTS Postgres ile gelir (aşağıdaki ortak not).

### PowerSync (çevrimdışı kuyruk)

- **SDK.** `@powersync/react-native` + `@op-engineering/op-sqlite` (≥1.17.0); "Our native database adapter is not compatible with Expo Go's sandbox environment", Expo Go için `@powersync/adapter-sql-js`; async iterator ve Android stream polyfill'leri gerekiyor; connector arayüzü `fetchCredentials` + `uploadData` [PS1]. Web: `@powersync/web`, tarayıcıda SQLite, varsayılan IndexedDB VFS, OPFS seçenekleri, shared worker ile çoklu sekme (Safari/iOS'ta varsayılan kapalı) [PS2]. React Native Web desteği "currently in a beta release", iki SDK birlikte gerekiyor [PS3].
- **Kuyruk.** Yerel yazmalar "automatically placed into an upload queue" (`ps_crud`, FIFO); SDK `uploadData()` ile backend'e yazdırır; başarısız olursa "it is automatically retried" [PS4].
- **Library izolasyonu.** Sync Streams: `SELECT * FROM lists WHERE owner_id = auth.user_id()` → kullanıcı başına bir bucket, istemci yalnızca kendi bucket'ını senkronlar [PS5]. Eski Sync Rules deprecated; `request.user_id()` JWT `sub` claim'inden gelir [PS6].
- **Supabase ile.** Postgres logical replication, `powersync` adlı publication; "Use Supabase Auth" ile Supabase JWT'leri doğrulanır; yazmalar `uploadData()` içinde supabase-js ile yapılır ve RLS geçerli kalır (42501 hatası RLS/grant eksikliği); Free planda WAL disk dolması uyarısı [PS7].
- **FTS.** İstemcide SQLite FTS5, varsayılan tokenizer unicode61 (isteğe bağlı porter); React Native'de FTS5 için ek yapılandırma [PS8]. Türkçe gövdeleme yok.
- **Fiyat.** Free $0: 2 GB senkron/ay, 500 MB barındırılan veri, 50 eşzamanlı istemci (peak), 2 instance, pasif projeler devre dışı (sayfa 1 ve 2 hafta diye iki farklı değer veriyor); Pro $49/ay'dan: 30 GB, 10 GB, 1.000 eşzamanlı; Team $599/ay [PS9]. Open Edition Docker ile self-host (`journeyapps/powersync-service`), dashboard yok [PS11]; lisans FSL-1.1-ALv2 (her sürüm 2 yıl sonra Apache 2.0) [PS12].
- **Bölgeler.** "PowerSync Cloud runs in these AWS regions": US, EU (eu-west-1), JP, AU, BR, IN; "You can't change the region afterward" [PS10].
- **Dışa aktarma.** Kaynak veri kendi Postgres'inde kalır; PowerSync senkron katmanıdır [PS7].

### WatermelonDB (çevrimdışı kuyruk)

- **SDK.** React Native iOS/Android (JSI önerilir), web (Webpack, `LokiJSAdapter`), Node (`better-sqlite3`), Windows deneysel [W1][W2]. MIT [W7]; son sürüm 0.28 (2025-04-07), npm `latest` 0.28.0 [W8][W9]. Resmî dokümanda Expo kurulumu yok; native kod içeren kütüphaneler için Expo "you should create a development build" diyor [E1]; topluluk config plugin'leri var, resmî değil [W10].
- **Senkron.** "bring your own backend": protokole uyan iki endpoint yazılır [W3]; `synchronize({ pullChanges, pushChanges })`; `pushChanges` backend onaylamadan çözülmemeli; "retry once" önerisi [W4]. Backend: pull `lastPulledAt` sonrası tüm değişiklikleri döndürmeli; push atomik olmalı; kayıt `lastPulledAt`'ten sonra sunucuda değiştiyse "abort push and return an error code" [W5].
- **Library izolasyonu.** Pull endpoint'inin hangi kayıtları döndürdüğü tamamen senin backend'ine bağlı [W5].
- **FTS.** Yok. Yalnızca `Q.like`: "SQLite cannot by default compare non-ASCII characters case-insensitively (unless you install ICU extension)" → Türkçe İ/ı/ş/ğ aramasında sorun [W6].
- **Fiyat / bölge / export.** Ücretsiz; bölge ve dışa aktarma kendi backend'ine bağlı.

### Türkçe tam metin arama: ortak not

- PostgreSQL'in Snowball derleme listesi `turkish` içeriyor (`stem_UTF_8_turkish.o`, `turkish.stop`) [P3]; `snowball_create.pl` dil listesinde `turkish` var [P1]; şablon her dil için `CREATE TEXT SEARCH DICTIONARY _DICTNAME_ (TEMPLATE = snowball, Language = _LANGNAME_ ...)` ve `CREATE TEXT SEARCH CONFIGURATION _CFGNAME_ (PARSER = default)` üretiyor [P2]. Resmî dokümanda `turkish_stem` "snowball stemmer for turkish language" olarak görünüyor [P4]. Dolayısıyla Postgres tabanlı her seçenekte (Supabase, Better Auth + Postgres) `to_tsvector('turkish', ...)` kullanılabilir; Supabase rehberi aynı deseni `'english'` ile gösteriyor, generated column + GIN index öneriyor [S6].
- Dikkat: `lower()` "according to the rules of the database's locale" çalışır [P6]; `simple` sözlüğü de küçük harfe çevirir [P5]. Türkçe noktalı/noktasız I (İ→i, I→ı) davranışı veritabanı locale'ine bağlıdır; Supabase varsayılanında denenmedi (bkz. Açık sorular).
- Convex (Latin alfabesi tokenizasyonu, gövdeleme yok), Firestore Standard (yerleşik FTS yok), SQLite FTS5 unicode61 (gövdeleme yok) ve WatermelonDB `LIKE` Türkçe gövdeleme sağlamaz; Note/Source metinlerinde "kitaplar/kitabı/kitapta" gibi çekimleri yakalamak için Postgres dışında ek arama servisi gerekir.

## Öneri

### Aday 1 — Supabase (Auth + Postgres + RLS + FTS), çevrimdışı kuyruk için PowerSync

- Tek `supabase-js` paketiyle Expo ve web; magic link ve Google için resmî React Native akışları var [S3][S4][S10].
- Library izolasyonu veritabanı seviyesinde (RLS, `auth.uid()`) [S7]; PowerSync Sync Streams aynı kullanıcı kimliğiyle çalışıyor ve yazmalarda RLS geçerli kalıyor [PS5][PS7]. Çevrimdışı Capture için upload kuyruğu hazır [PS4].
- Türkçe FTS Postgres'in yerleşik `turkish` yapılandırmasıyla geliyor [P1][P2].
- AB: Frankfurt dahil 6 AB bölgesi [S2]; PowerSync Cloud EU (eu-west-1) [PS10].
- Dışa aktarma `pg_dump` ile standart [S11].
- Maliyet: 100–500 kullanıcı Free'nin 50.000 MAU limitinin çok altında [S1]; üretim için durdurulmayan ve 7 gün yedekli Pro ($25/ay) [S1][S8] + özel SMTP [S9] gerekir. PowerSync Free'nin 50 eşzamanlı istemci sınırı aşılırsa Pro $49/ay [PS9].
- Riskler: varsayılan e-posta servisi 2/saat ve yalnızca ekip üyelerine [S9]; Free projeler 1 hafta pasiflikte durduruluyor [S1]; Google native girişi ve PowerSync native adaptörü Expo Go'da çalışmıyor, development build gerekir [E5][PS1]; PowerSync lisansı FSL [PS12].

### Aday 2 — Convex (AB bölgesi) + Clerk

- Resmî Expo quickstart ve web'de aynı React istemcisi [C1][C3]; Convex dokümanı React Native için Clerk'i öne çıkarıyor [C4]; Clerk Expo SDK'sında native Google ve `@clerk/expo/web` var [K2][K3].
- Şubat 2026'dan beri tüm planlarda AB (İrlanda) bölgesi [C15][C16]; 100–500 kullanıcı için Free yeterli görünüyor [C13].
- Dışa aktarma JSONL ZIP [C17].
- Neden ikinci sırada: Türkçe FTS zayıf (gövdeleme belgelenmemiş, yazım toleransı yok) [C12]; çevrimdışı kuyruk yok, yalnızca mutasyon yeniden deneme [C3] (Capture kuyruğu uygulama tarafında yazılmalı); Clerk verisi yalnızca ABD'de [K8]; Convex Auth beta [C4][C5]; veri ayrımı kodda ve RLS helper varsayılanı "allow" [C11]; AB kullanımı 1,3× [C15].

### Yedek yol ve elenenler

- Tam veri sahipliği istenirse: Better Auth + kendi Postgres'in (AB'de) + PowerSync Open Edition. MIT [B7], Türkçe FTS Postgres'ten gelir [P1], ama sunucu ve işletim yükü sende [B2][E4].
- Firebase: Auth yalnızca ABD [F11], Standard'da yerleşik FTS yok [F5], Spark'ta 5 magic link e-postası/gün [F9], export için Blaze [F12].
- Clerk tek başına backend değil; ABD dışı bölge yok [K8]. Supabase üzerine auth katmanı olarak eklenebilir [K7] ama Supabase Auth zaten magic link ve Google'ı karşılıyor.
- WatermelonDB: resmî Expo rehberi yok [W1], arama `LIKE` ile sınırlı ve ASCII dışı harf sorunu [W6], backend protokolünü sen yazarsın [W5], son sürüm 2025-04 [W8].

## Açık sorular

1. Supabase'in varsayılan locale/collation'ında Türkçe İ/ı küçük harfe çevrimi: `lower()` locale'e bağlı [P6]; `to_tsvector('turkish', 'İSTANBUL')` ve `websearch_to_tsquery('turkish', 'istanbul')` eşleşmesi denenmeli; gerekirse uygulama tarafı normalizasyon veya `unaccent`.
2. Clerk email link Expo'da gerçekten çalışıyor mu? Rehber listesinde yok [K5], makale var diyor [K4]. Clerk seçilirse development build'de test edilmeli.
3. Özel SMTP/e-posta sağlayıcısı seçimi ve maliyeti araştırılmadı (Supabase ve Better Auth için zorunlu [S9][B3]).
4. Identity Platform 50K MAU sonrası birim fiyatı [F13] ve Firestore bölgesel birim fiyatları [F14] okunamadı.
5. PowerSync Free'de pasiflik süresi sayfada tutarsız (1 hafta / 2 hafta) [PS9]; 50 eşzamanlı istemcinin 100–500 kullanıcıda yetip yetmeyeceği kullanım desenine bağlı.
6. Convex mutasyonlarının çevrimdışıyken bellekte tutulup tutulmadığı resmî dokümanda yok [C3].
7. Firestore Enterprise metin aramasının dil/analizör desteği (Türkçe) bulunamadı [F5].
8. PowerSync Web'de Safari/iOS çoklu sekme ve OPFS sınırlamaları web hedefi için test edilmeli [PS2].
9. #14 için: davet/paylaşım gelirse RLS politikaları Library sahipliği + üyelik tablosuna genişletilmeli; bu araştırma yalnızca "her kullanıcı kendi Library'si" modelini inceledi.

## Kaynaklar

Supabase
- [S1] https://supabase.com/pricing
- [S2] https://supabase.com/docs/guides/platform/regions
- [S3] https://supabase.com/docs/guides/auth/auth-magic-link
- [S4] https://supabase.com/docs/guides/auth/social-login/auth-google?platform=react-native
- [S5] https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native
- [S6] https://supabase.com/docs/guides/database/full-text-search
- [S7] https://supabase.com/docs/guides/database/postgres/row-level-security
- [S8] https://supabase.com/docs/guides/platform/backups
- [S9] https://supabase.com/docs/guides/auth/auth-smtp
- [S10] https://supabase.com/docs/guides/auth/native-mobile-deep-linking
- [S11] https://supabase.com/docs/reference/cli/supabase-db-dump
- [S12] https://supabase.com/docs/guides/auth/third-party/overview
- [S13] https://supabase.com/docs/guides/platform/migrating-within-supabase

PostgreSQL
- [P1] https://raw.githubusercontent.com/postgres/postgres/master/src/backend/snowball/snowball_create.pl
- [P2] https://raw.githubusercontent.com/postgres/postgres/master/src/backend/snowball/snowball.sql.in
- [P3] https://raw.githubusercontent.com/postgres/postgres/master/src/backend/snowball/Makefile
- [P4] https://www.postgresql.org/docs/current/textsearch-psql.html
- [P5] https://www.postgresql.org/docs/current/textsearch-dictionaries.html
- [P6] https://www.postgresql.org/docs/current/functions-string.html

Expo ve yardımcı kütüphaneler
- [E1] https://docs.expo.dev/workflow/using-libraries/
- [E2] https://docs.expo.dev/develop/development-builds/introduction/
- [E3] https://docs.expo.dev/guides/using-firebase/
- [E4] https://docs.expo.dev/router/reference/api-routes/
- [E5] https://react-native-google-signin.github.io/docs/setting-up/expo

Convex
- [C1] https://docs.convex.dev/quickstart/react-native
- [C2] https://docs.convex.dev/client/react-native
- [C3] https://docs.convex.dev/client/react
- [C4] https://docs.convex.dev/auth
- [C5] https://labs.convex.dev/auth
- [C6] https://labs.convex.dev/auth/config/email
- [C7] https://labs.convex.dev/auth/config/oauth
- [C8] https://labs.convex.dev/auth/config/oauth/google
- [C9] https://labs.convex.dev/auth/api_reference/react
- [C10] https://docs.convex.dev/auth/functions-auth
- [C11] https://raw.githubusercontent.com/get-convex/convex-helpers/main/packages/convex-helpers/README.md
- [C12] https://docs.convex.dev/search/text-search
- [C13] https://www.convex.dev/pricing
- [C14] https://docs.convex.dev/production/state/limits
- [C15] https://docs.convex.dev/production/regions
- [C16] https://ship.convex.dev/changelog/eu-region-hosting-dublin
- [C17] https://docs.convex.dev/database/backup-restore
- [C18] https://docs.convex.dev/database/import-export/export

Firebase / Google Cloud
- [F1] https://firebase.google.com/docs/auth/web/email-link-auth
- [F2] https://firebase.google.com/support/dynamic-links-faq
- [F3] https://firebase.google.com/docs/auth/web/google-signin
- [F4] https://firebase.google.com/docs/firestore/security/rules-conditions
- [F5] https://firebase.google.com/docs/firestore/solutions/search
- [F6] https://extensions.dev/extensions/algolia/firestore-algolia-search
- [F7] https://firebase.google.com/pricing
- [F8] https://firebase.google.com/docs/firestore/quotas
- [F9] https://firebase.google.com/docs/auth/limits
- [F10] https://firebase.google.com/docs/firestore/locations
- [F11] https://firebase.google.com/support/privacy
- [F12] https://firebase.google.com/docs/firestore/manage-data/export-import
- [F13] https://cloud.google.com/identity-platform/pricing (içerik okunamadı)
- [F14] https://cloud.google.com/firestore/pricing (içerik okunamadı)

Clerk
- [K1] https://clerk.com/docs/expo/getting-started/quickstart
- [K2] https://clerk.com/docs/reference/expo/overview.md
- [K3] https://clerk.com/docs/expo/guides/configure/auth-strategies/sign-in-with-google.md
- [K4] https://clerk.com/articles/clerk-compatibility-in-expo-54-and-55.md
- [K5] https://clerk.com/docs/custom-flows/email-links
- [K6] https://clerk.com/pricing
- [K7] https://clerk.com/docs/integrations/databases/supabase
- [K8] https://clerk.com/security.md
- [K9] https://clerk.com/docs/deployments/exporting-users

Better Auth
- [B1] https://www.better-auth.com/docs/introduction
- [B2] https://www.better-auth.com/docs/integrations/expo
- [B3] https://www.better-auth.com/docs/plugins/magic-link
- [B4] https://www.better-auth.com/docs/authentication/google
- [B5] https://www.better-auth.com/docs/concepts/database
- [B6] https://www.better-auth.com/docs/plugins/organization
- [B7] https://raw.githubusercontent.com/better-auth/better-auth/main/LICENSE.md

PowerSync
- [PS1] https://docs.powersync.com/client-sdk-references/react-native-and-expo
- [PS2] https://docs.powersync.com/client-sdk-references/javascript-web
- [PS3] https://docs.powersync.com/client-sdk-references/react-native-and-expo/react-native-web-support
- [PS4] https://docs.powersync.com/architecture/client-architecture
- [PS5] https://docs.powersync.com/usage/sync-streams
- [PS6] https://docs.powersync.com/usage/sync-rules
- [PS7] https://docs.powersync.com/integration-guides/supabase-+-powersync
- [PS8] https://docs.powersync.com/usage/use-case-examples/full-text-search
- [PS9] https://www.powersync.com/pricing
- [PS10] https://docs.powersync.com/configuration/powersync-service/cloud-instances
- [PS11] https://docs.powersync.com/self-hosting/getting-started
- [PS12] https://raw.githubusercontent.com/powersync-ja/powersync-service/main/LICENSE

WatermelonDB
- [W1] https://watermelondb.dev/docs/Installation
- [W2] https://watermelondb.dev/docs/Setup
- [W3] https://watermelondb.dev/docs/Sync/Intro
- [W4] https://watermelondb.dev/docs/Sync/Frontend
- [W5] https://watermelondb.dev/docs/Sync/Backend
- [W6] https://watermelondb.dev/docs/Query
- [W7] https://github.com/Nozbe/WatermelonDB
- [W8] https://raw.githubusercontent.com/Nozbe/WatermelonDB/master/CHANGELOG.md
- [W9] https://registry.npmjs.org/@nozbe/watermelondb/latest
- [W10] https://github.com/skam22/watermelondb-expo-plugin (topluluk eklentisi, resmî değil)
