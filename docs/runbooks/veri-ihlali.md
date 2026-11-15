# Veri ihlali müdahale planı

> **Taslak.** İşletici okuyup onaylayana kadar yürürlükte değildir. Hukuki görüş değildir;
> süreler ve bildirim içeriği Kurul'un 2019/10 ve 2019/271 sayılı kararlarından alınmıştır
> (bkz. Kaynaklar).

Bir kişisel veri ihlali öğrenildiğinde İşletici bu sayfayı baştan sona izler. Sıra önemlidir:
önce saat kaydedilir, sonra sızıntı durdurulur, sonra bildirilir.

## Kim sorumlu

Homelibra'yı tek kişi işletir. İhlali değerlendiren, Kurula ve ilgili kişilere bildiren ve kaydı
tutan kişi **İşletici**dir; raporlanacak başka bir kişi yoktur. İşletici ulaşılamaz durumdaysa
(hastalık, yolculuk) bu planı yürütecek ikinci bir kişi **henüz belirlenmedi** (bkz. Açık noktalar).

## Hangi durumlar ihlaldir

Kişisel verinin yetkisiz kişilerce elde edilmesi, görülmesi, değiştirilmesi ya da kaybolması.
Homelibra'da akla gelen örnekler:

- Sunucuya, Coolify paneline ya da veritabanına yetkisiz erişim.
- Yedek ya da kapak bucket'ının anahtarlarının sızması (depoya, bir log'a, bir ekran görüntüsüne).
- Bir Account'un başka bir Account'un Library'sini görebilmesi (yetkilendirme hatası).
- Bir e-postanın yanlış adrese gitmesi; giriş kodunun başkasına ulaşması.
- İşleticinin dizüstü bilgisayarının ya da `.env` dosyasının çalınması, kaybolması.
- Bir sağlayıcının (Hetzner, Resend, Sentry, Expo, Cloudflare) kendi ihlalini bildirmesi.
- Yedekten geri dönülemeyen veri kaybı.

Emin değilsen ihlal say ve saati başlat; yanlış alarm kaydı düşmek bildirimi kaçırmaktan ucuzdur.

## Süreler

| Ne | Süre | Nereden sayılır |
|---|---|---|
| Kurula bildirim | Gecikmeksizin, **en geç 72 saat** | İhlalin **öğrenildiği** an |
| İlgili kişilere bildirim | Makul olan en kısa süre | Etkilenen kişiler belirlendikten sonra |
| Sağlayıcının bize bildirimi | Gecikmeksizin | Sağlayıcının öğrendiği an; bizim 72 saatimiz bize ulaştığında başlar |

72 saat yetişmezse bildirim yine yapılır ve gecikmenin nedeni yazılır. Bilgi eksikse beklenmez:
eldeki kadarıyla bildirilir, kalanı aşamalı olarak tamamlanır.

## Adımlar

### 1. Saati kaydet (ilk 15 dakika)

Aşağıdaki **İhlal kaydı** şablonunu aç ve öğrenme anını (tarih, saat, saat dilimi) ve nasıl
öğrendiğini yaz. Bundan sonraki her adım bu kayda işlenir.

### 2. Durdur (ilk saatler)

Kanıtı silmeden sızıntıyı kes. Duruma göre:

- **Sunucu ya da panel erişimi:** SSH anahtarını ve Coolify parolasını değiştir; Coolify API
  token'ını (`COOLIFY_TOKEN`) iptal et; Hetzner Cloud Console'da güvenlik duvarını daralt.
  Sunucuyu silme: disk, incelemenin kanıtıdır. Gerekirse snapshot al, sonra yeniden kur.
- **Sızan bir anahtar:** ilgili sağlayıcıda iptal edip yenisini üret, Coolify'da kullanıldığı yere
  (ortam değişkenleri; yedek anahtarı için S3 depolama ayarı) yaz, yeniden dağıt. Sırlar: `BETTER_AUTH_SECRET`, `BACKUP_S3_*`, `COVERS_S3_*`,
  `RESEND_API_KEY`, `SENTRY_AUTH_TOKEN`, `GOOGLE_CLIENT_SECRET`, veritabanı parolaları, EAS ve
  GitHub token'ları. Hetzner Object Storage anahtarı projedeki **bütün** bucket'lara erişir
  (yedekler dahil); biri sızdıysa hepsi sızmış sayılır.
- **Ele geçmiş oturumlar:** `session` tablosundaki satırları sil (tek Account için ya da hepsi);
  herkes yeniden giriş yapar.
- **Yetkilendirme hatası:** hatalı uç noktayı kapatan sürümü dağıt; gerekirse API'yi geçici
  olarak durdur. Kapalı bir hizmet, sızdıran bir hizmetten iyidir.
- **Sağlayıcı ihlali:** sağlayıcının bildirimini kayda ekle, o sağlayıcıdaki anahtarları yenile,
  hangi verimizin onda durduğuna aşağıdaki tablodan bak.

### 3. Kapsamı belirle (ilk 24 saat)

- Hangi Account'lar etkilendi, kaç kişi? (Emin değilsen üst sınırı yaz.)
- Hangi veri kategorileri? Aşağıdaki tablodan işaretle.
- Ne zaman başladı, ne zaman bitti? Hâlâ sürüyor mu?
- Veri yalnızca görüldü mü, kopyalandı mı, değişti mi, kayboldu mu?
- Kaynaklar: API ve Coolify log'ları, Hetzner erişim kayıtları, `session` tablosu (IP, cihaz,
  zaman), sağlayıcı panellerindeki denetim kayıtları, Sentry.

### 4. Kurula bildir (en geç 72. saat)

- Form: **Kişisel Veri İhlal Bildirim Formu**, https://ihlalbildirim.kvkk.gov.tr/ . Formu yalnızca
  veri sorumlusu doldurur.
- Eksik bilgi için bekleme: bildir, sonra aşamalı tamamla.
- 72 saati geçtiysen nedenini forma yaz.
- Gönderdiğin formun bir kopyasını ve varsa başvuru numarasını ihlal kaydına ekle.

### 5. İlgili kişilere bildir (makul olan en kısa süre)

Etkilenen her Account'un kayıtlı e-posta adresine doğrudan yaz. Adrese ulaşılamıyorsa
homelibra.com üzerinden duyur. Bildirim açık ve sade bir dille yazılır ve **en az** şunları içerir:

1. İhlalin ne zaman gerçekleştiği.
2. Hangi kişisel verilerin etkilendiği, kategori kategori (özel nitelikli veri varsa ayrıca).
3. İhlalin olası sonuçları.
4. Olumsuz etkileri azaltmak için alınan ve kişinin alması önerilen önlemler.
5. Bilgi alınabilecek kişi ve iletişim adresi (`iletisim@homelibra.com`).

Bu e-posta işlem e-postasıdır; içine tanıtım girmez.

Taslak:

> Konu: Homelibra hesabınla ilgili bir güvenlik olayı
>
> [Tarih, saat] ile [tarih, saat] arasında [ne olduğu, bir cümle]. Bundan etkilenen verilerin:
> [kategoriler]. [Etkilenmeyenler: örneğin "Notların ve kaynakların etkilenmedi."]
>
> Bunun sonucu olarak [olası sonuç]. Biz [alınan önlemler]. Senin yapman gereken: [öneri ya da
> "bir şey yapmana gerek yok"].
>
> Olayı Kişisel Verileri Koruma Kurulu'na [tarih]'te bildirdik. Soruların için:
> iletisim@homelibra.com — [İşleticinin adı].

### 6. Kaydı kapat

İhlalle ilgili bilgiler, etkileri ve alınan önlemler kayıt altına alınır ve Kurul'un
incelemesine hazır tutulur. Kayıt, yanlış alarm olsa bile silinmez.

### 7. Sonrası (iki hafta içinde)

- Kök neden ve kalıcı düzeltme için bir issue aç.
- Aydınlatma metni (`apps/app/src/lib/legal.ts`) hâlâ doğru mu?
- Bu planda eksik kalan bir adım varsa ekle.

## Hangi veri nerede

| Kategori | İçerik | Nerede durur |
|---|---|---|
| Hesap | E-posta adresi, koşulları kabul anı; Google ile girenlerde ayrıca ad, profil görseli, Google hesap kimliği ve Google'ın verdiği token'lar (Better Auth'un varsayılanı; üretim veritabanında bakılmadı) | PostgreSQL (Hetzner sunucu) ve günlük yedekler (sunucuda ve Hetzner Object Storage'da, 14 gün) |
| Oturum | IP adresi, cihaz/tarayıcı bilgisi | PostgreSQL ve yedekler |
| Library | Source, Note, Excerpt, Comment, Tag, Collection | PostgreSQL ve yedekler |
| Kapaklar | Kapak görselleri | Hetzner Object Storage (yedeksiz, ADR-0011) |
| Davet listesi | Davet edilenlerin e-posta adresleri | PostgreSQL ve yedekler |
| Bekleyen kodlar | Giriş, e-posta değiştirme ve hesap silme kodları (10 dakika geçerli) | PostgreSQL ve yedekler |
| Giriş ve hesap e-postaları | E-posta adresi, tek kullanımlık kod | Resend (gönderim kayıtları) |
| Hata ve performans kayıtları | Cihaz bilgisi, hata bağlamı; Library içeriği kesilir | Sentry |
| Güncelleme istekleri | IP adresi, cihaz bilgisi | Expo |
| İletişim e-postaları | Gönderenin adresi ve yazdıkları | Cloudflare (yönlendirme), İşleticinin posta kutusu |

Library'de kullanıcının üçüncü kişiler hakkında yazdıkları da olabilir; etkilenen veri Library
ise bunu bildirimde belirt.

## İhlal kaydı şablonu

Her olay için bu bloğu kopyala ve depo **dışında**, yalnızca İşleticinin eriştiği bir yerde
sakla (kayıt, etkilenen kişilerin bilgisini içerebilir).

```
Olay no:
Öğrenme anı (tarih, saat, saat dilimi):
Nasıl öğrenildi:
İhlalin başlangıcı ve bitişi:
Ne oldu:
Etkilenen Account sayısı (kesin / tahmini):
Etkilenen veri kategorileri:
Olası sonuçlar:
Durdurmak için yapılanlar (saatleriyle):
Kurula bildirim: tarih, saat, başvuru no, (72 saati geçtiyse) neden
İlgili kişilere bildirim: tarih, yöntem, kaç kişi
Sağlayıcıyla yazışmalar:
Kök neden:
Kalıcı düzeltme (issue):
Kapanış tarihi:
```

## Gözden geçirme

Bu plan altı ayda bir ve kişisel veri alan her yeni sağlayıcıda (ADR-0009) yeniden okunur.
Son gözden geçirme: — (taslak, henüz onaylanmadı).

## Açık noktalar

- İşletici ulaşılamadığında planı kim yürütür?
- İhlal kayıtları nerede saklanacak?
- Sağlayıcıların ihlal bildirimleri hangi adrese geliyor? Her birinin hesabındaki güvenlik
  iletişim adresi İşleticinin okuduğu bir kutu mu?

## Kaynaklar

- Kişisel Verileri Koruma Kurulu'nun 24.01.2019 tarih ve 2019/10 sayılı kararına ilişkin duyuru
  (72 saat, aşamalı bildirim, ilgili kişilere bildirim, kayıt, müdahale planı):
  https://www.kvkk.gov.tr/Icerik/5362/Veri-Ihlali-Bildirimi
- Kurul'un 18.09.2019 tarih ve 2019/271 sayılı kararı (ilgili kişiye bildirimin asgari unsurları):
  https://www.kvkk.gov.tr/Icerik/5547/2019-271
- 6698 sayılı Kanun m.12/5; arka plan: `docs/research/kvkk-obligations.md` satır 8.
