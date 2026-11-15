# KVKK m.9: güvencesiz yurt dışı barındırmada ceza riski ve aydınlatmanın etkisi

> **Bu belge hukuki görüş değildir.** Kanun, Yönetmelik, Kurum rehberi, Kurul karar özetleri ve
> Kurum faaliyet raporlarından 2026-11-15'te okunan metinlere dayanan bir kaynak derlemesidir.
> "Çıkarım" diye işaretlenen cümleler kaynağın söylediği değil, kaynaktan bu belgede varılan
> sonuçtur. Karar vermeden önce bir hukukçuya doğrulatılmalıdır.

Tarih: 2026-11-15 · Ticket: baspinarenes/homelibra#31 · Önceki çalışmalar: `docs/research/kvkk-obligations.md` (2026-10-29),
`docs/research/kvkk-hosting-providers.md` (2026-10-29)

## Soru

Önceki iki belge şunu sabitledi: kişisel veriyi yurt dışındaki bir veri işleyende tutmak KVKK m.9
anlamında yurt dışına aktarımdır; hiçbir ülke için yeterlilik kararı yok; pratik yol Kurul'un SS-2
standart sözleşmesinin değiştirilmeden imzalanıp 5 iş günü içinde bildirilmesi; Hetzner, Resend,
Sentry, Expo ve Cloudflare'in hiçbiri SS-2 imzalayacağını yayımlamıyor.

Durum: Türkiye'de yerleşik tek bir gerçek kişi, davetle girilen ücretsiz kapalı bir beta (onlarca
kullanıcı, Türkiye'deki akademisyenler) işletiyor. Veri tabanı, API ve yedekler Almanya'da
(Hetzner); giriş e-postaları Resend (ABD), hata raporları Sentry (AB bölgesi), OTA güncellemeleri
Expo (ABD), gelen iletişim e-postası Cloudflare Email Routing üzerinden. Hiçbiriyle SS-2
imzalanmadı. Aydınlatma metni her sağlayıcıyı adıyla sayıyor ve verinin Almanya/ABD'de tutulduğunu
söylüyor. İşleticinin sorusu: **"Ceza yer miyiz? KVKK metninde kullanıcıyı uyarmak işe yarar mı?"**

Alt sorular:

1. Aydınlatma metninde alıcıları saymak veya kayıtta açık rıza almak, 1/9/2024 sonrasında sürekli
   barındırmayı hukuka uygun kılar mı?
2. Kullanıcının cihazı veriyi doğrudan yurt dışındaki veri işleyenin sunucusuna gönderiyorsa bu
   yine "aktarım" mıdır?
3. Uygulamada kim, neyle tetiklenerek, hangi hükümden, ne kadar ceza aldı? 1/9/2024 sonrasında
   değişik m.9'u uygulayan yayımlanmış karar var mı?
4. 2026 ceza aralıkları ve "hiç güvence yok" durumuna hangisinin uygulandığı.
5. 2026-10-29'dan beri ne değişti?
6. Veri sorumlusu yurt dışında kurulu bir şirket olsaydı ne değişirdi?
7. SS-2 bildiriminin bir gerçek kişi ve yabancı bir veri işleyen için mekaniği.

## Yöntem

- **Okunan birincil metinler.** Kanun, Yönetmelik, Kabahatler Kanunu ve Türk Borçlar Kanunu
  mevzuat.gov.tr PDF'lerinden; Rehber, SS-2 metni, Standart Sözleşme Bildirim Kılavuzu, 2024 ve
  2025 Faaliyet Raporları, 2026 ceza tablosu ve "Sorularla VERBİS" kvkk.gov.tr PDF'lerinden; EDPB
  Guidelines 05/2021 v2.0 edpb.europa.eu PDF'inden indirildi ve tam metin olarak okundu/arandı.
  kvkk.gov.tr HTML sayfaları doğrudan indirildi (bu oturumda site erişilebilirdi).
- **Kurul karar özetleri taraması.** kvkk.gov.tr "Kurul Karar Özetleri" listesinin 36 sayfasının
  tamamı indirildi: **313 özet** (başlıktaki karar numarasına göre: 2018: 9, 2019: 38, 2020: 94,
  2021: 67, 2022: 31, 2023: 32, 2024: 25, 2025: 5, 2026: 1; 11 başlıkta karar numarası yok). Her
  özetin gövdesi indirildi ve şu ifadeler için tam metin arandı: `yurt dışı`, `yurtdışı`,
  `9 uncu madde` / `9'uncu madde`, `standart sözleşme`, `beş iş günü`, `(d) bendi`, `taahhütname`,
  `sunucu`, `server`, `bulut`. Yaklaşık 100 özet eşleşti; çoğunda ifade m.11 metninin tekrarı veya
  tarafların iddiasıdır. İki süzgeç uygulandı: (1) aktarım ifadesi yoğun olan özetler tek tek
  okundu; (2) her özetin sonuç bölümü ("... hareketle" sonrası) `yurt dışı` + `aktar` birlikteliği
  için ayrıca tarandı (9 eşleşme; hepsi §3.1'de). Karar tarihi 1/9/2024 ve sonrası olan 12 özetin
  tamamı ayrıca kontrol edildi. Bu tarama otomatik süzgeçlere dayanır; 313 özetin her biri baştan
  sona okunmadı.
- **Duyurular taraması.** "Duyurular" listesinin 39 sayfası indirildi (535 bağlantı); başlıklar
  `yurt dışı`, `standart sözleşme`, `yeterlilik`, `aktarım`, `taahhütname`, `bağlayıcı`, `whatsapp`,
  `kanun`, `yönetmelik` için süzüldü. İlke kararları listesi (başlıklar) okundu.
- **Resmî Gazete.** 1–15 Kasım 2026 günlük fihristleri indirildi; `Vergi Usul`, `Yeniden De(ğerleme)`,
  `Kişisel Veri`, `Kabahat` arandı.
- **İkincil kaynak kullanımı.** Hukuk bürosu yazıları ve haberler yalnızca birincil kaynağa
  ulaşmak için arandı; hiçbir iddia onlara dayandırılmadı. Bir yerde ikincil kaynaktan öğrenilen
  ve doğrulanamayan bir bilgi varsa (2027 yeniden değerleme oranı hesabı) bu açıkça yazıldı.
- **Erişilemeyen / sınırlı kaynaklar.**
  - Kurul kararlarının tam metinleri yayımlanmıyor; yalnızca Kurumun seçip yayımladığı özetler
    okunabildi. 2025'te Kurul 2.528 karar aldı [13], yayımlanan 2025 tarihli özet sayısı 5. Bu yüzden
    aşağıdaki "bulunamadı" ifadeleri **"yayımlanmış özet veya duyuru bulunamadı"** anlamındadır.
  - 2027 Yılı Cumhurbaşkanlığı Yıllık Programı'nın Resmî Gazete PDF'i (451 sayfa) taranmış görüntü;
    metin katmanı yok. İçerik yalnızca Kurumun 11.11.2026 bülteninden [18] okundu.
  - kvkk.gov.tr içerik numaralarını sırayla yoklama (9078 ve sonrası) işe yaramadı (adres kısaltması
    yanlışsa ana sayfa dönüyor); "2026-10-29'dan sonra ne yayımlandı" sorusu Duyurular listesinin
    ilk sayfası ve ana sayfa üzerinden yanıtlandı.
  - TBMM kanun teklifleri sorgu sayfası taranmadı; yalnızca arama motoruyla bakıldı ve çıkan tek
    belge (Sıra Sayısı 259) 6698'e değinmiyor. "Teklif yok" sonucu bu sınırla okunmalıdır.
  - PDF metinleri macOS PDFKit ile çıkarıldı; dipnot rakamları ve sayfa sonları alıntılardan elle
    ayıklandı. Rehber sayfa numaraları basılı sayfa numaralarıdır.

## Bulgular

### 1. Aydınlatma veya kayıt anındaki açık rıza aktarımı hukuka uygun kılar mı?

**Kısa cevap: Hayır.** m.9'un saydığı üç yol yeterlilik kararı, uygun güvence ve arızi istisnadır;
aydınlatma bunların hiçbiri değildir, açık rıza ise yalnızca arızi aktarım için sayılmıştır.

Kanun metni [1]:

- m.9/1: "Kişisel veriler, 5 inci ve 6 ncı maddelerde belirtilen şartlardan birinin varlığı ve
  aktarımın yapılacağı ülke, ülke içerisindeki sektörler veya uluslararası kuruluşlar hakkında
  yeterlilik kararı bulunması halinde, veri sorumluları ve veri işleyenler tarafından yurt dışına
  aktarılabilir."
- m.9/4: "Kişisel veriler, yeterlilik kararının bulunmaması durumunda, 5 inci ve 6 ncı maddelerde
  belirtilen şartlardan birinin varlığı, ilgili kişinin aktarımın yapılacağı ülkede de haklarını
  kullanma ve etkili kanun yollarına başvurma imkânının bulunması kaydıyla, aşağıda belirtilen
  uygun güvencelerden birinin taraflarca sağlanması halinde veri sorumluları ve veri işleyenler
  tarafından yurt dışına aktarılabilir: (...) c) Kurul tarafından ilan edilen (...) standart
  sözleşmenin varlığı. ç) Yeterli korumayı sağlayacak hükümlerin yer aldığı yazılı bir
  taahhütnamenin varlığı ve Kurul tarafından aktarıma izin verilmesi."
- m.9/5: "Standart sözleşme, imzalanmasından itibaren beş iş günü içinde veri sorumlusu veya veri
  işleyen tarafından Kuruma bildirilir."
- m.9/6: "Veri sorumluları ve veri işleyenler, yeterlilik kararının bulunmaması ve dördüncü
  fıkrada öngörülen uygun güvencelerden herhangi birinin sağlanamaması durumunda, **arızi olmak
  kaydıyla sadece** aşağıdaki hallerden birinin varlığı halinde yurt dışına kişisel veri
  aktarabilir: a) İlgili kişinin, muhtemel riskler hakkında bilgilendirilmesi kaydıyla, aktarıma
  açık rıza vermesi. b) Aktarımın, ilgili kişi ile veri sorumlusu arasındaki bir sözleşmenin ifası
  veya ilgili kişinin talebi üzerine alınan sözleşme öncesi tedbirlerin uygulanması için zorunlu
  olması. (...)"
- m.9/9: "Kişisel veriler, uluslararası sözleşme hükümleri saklı kalmak üzere, Türkiye'nin veya
  ilgili kişinin menfaatinin ciddi bir şekilde zarar göreceği durumlarda, ancak ilgili kamu kurum
  veya kuruluşunun görüşü alınarak Kurulun izniyle yurt dışına aktarılabilir."
- m.9/11: "Bu maddenin uygulanmasına ilişkin usul ve esaslar yönetmelikle düzenlenir."
- Geçici m.3/1: m.9'un eski birinci fıkrası (açık rızayla aktarım) "1/9/2024 tarihine kadar
  uygulanmaya devam olunur."
- m.10/1-c: aydınlatma, "İşlenen kişisel verilerin kimlere ve hangi amaçla aktarılabileceği"
  konusunda bilgi verme yükümlülüğüdür. Ayrı bir yükümlülüktür; m.9'da bir aktarım yolu olarak
  sayılmaz.

Yönetmelik [2]:

- m.6/2: yeterlilik kararı ve uygun güvence yoksa "kişisel veriler, arızi olmak kaydıyla sadece
  16 ncı maddede belirtilen istisnai hâllerden birinin varlığı hâlinde" aktarılabilir.
- m.16/1, son cümle ("arızi" tanımı): "Düzenli olmayan, tek veya birkaç sefer gerçekleşen,
  süreklilik arz etmeyen ve olağan faaliyet akışı içinde bulunmayan aktarımlar arızi niteliktedir."

Rehber (Ocak 2025) [6]:

- Tanım (s. 10): "Arızi Aktarım (Arızilik): Yurtdışına kişisel veri aktarımlarında düzenli
  olmayan, tek veya birkaç sefer gerçekleşen, süreklilik arz etmeyen ve olağan faaliyet akışı
  içinde bulunmayan halleri ifade eder."
- s. 9: "Bu fıkrada yer alan arızilik, yalnızca tek seferlik veya birkaç kez gerçekleşecek ve
  süreklilik arz etmeyecek kişisel veri aktarımlarını işaret etmektedir."
- s. 65: "Arızi hallerde yapılan aktarımlarda istisnai bir aktarımdan söz edildiğinden son derece
  dar bir yorum yapılmalı; öncelikle yeterlilik kararı veya uygun güvencelerden birinin mevcut olup
  olmadığına bakılmalı; bunların yokluğunda istisnai aktarıma son çare olarak başvurulmalıdır."
- s. 66: "Veri aktaran ile veri alıcısı arasında süregelen bir ilişkinin sonucu olarak düzenli bir
  şekilde gerçekleşen kişisel veri aktarımları kural olarak sistematik ve sürekli tekrarlanan bir
  veri aktarımı olarak kabul edilir. Örneğin veri alıcısına, bir veri tabanına doğrudan erişim izni
  verilmesi de kural olarak düzenli ve süreklilik arz eden bir veri aktarımı olarak kabul
  edileceğinden bu kapsamda sayılmayacaktır."
- s. 66: "Olağan faaliyet akışı içindeki aktarımlar istisnai aktarıma konu edilemez." ve "İstisnai
  kabul edilemeyecek durumlarda yurtdışına kişisel veri aktarımı için arızi hallere
  başvurulamayacak; yeterlilik kararı bulunup bulunmadığına, yeterlilik kararı yoksa uygun
  güvencelerden birinin sağlanıp sağlanamayacağına bakılacaktır."
- Açık rıza istisnası (s. 68): "Veri sorumluları ve veri işleyenler, (...) arızi olmak kaydıyla
  ve ilgili kişinin, muhtemel riskler hakkında bilgilendirilmesi şartıyla aktarıma açık rıza
  vermesi halinde yurt dışına aktarılabilir." Bilgilendirmenin içeriği (s. 69): "Bilgilendirme
  açık rızanın aktarım için yasal bir gerekçe olduğunu ve verilerin aktarılacağı ülke hakkında
  Kurul tarafından alınmış bir yeterlilik kararı olmadığını da içermelidir." Özgür irade (s. 70):
  "belli bir hizmetin veya ürünün sağlanmasının açık rıza verilmesi koşuluna tabi tutulması (...)
  gibi hallerde açık rıza özgür iradeyle açıklanmış kabul edilmez."
- Sözleşmenin ifası istisnası (s. 71): "Her ne kadar aktarımın, sözleşmenin ifasına ilişkin veya
  sözleşme öncesi tedbirlerin uygulanmasına ilişkin istisnai bir hale dayandırılması kapsam olarak
  geniş gibi gözükse de 'arızi olma' ve 'zorunlu' olma kriterleri ile sınırlandırılmaktadır."
  Örnek (s. 71): grup içi bordro/İK faaliyetinin yurt dışında yürütülmesinde "Kanunda öngörülen
  standart sözleşmeler veya bağlayıcı şirket kuralları gibi uygun güvencelere başvurulmasının daha
  makul olacağı değerlendirilmektedir."
- Kurum "Yurt Dışına Aktarım" sayfası [7]: "bu istisnai hallerin dar yorumlanması gerekmektedir.
  Ayrıca, bu kapsamda öngörülen istisna hallerinin arızi, düzenli olmayan, süreklilik göstermeyen
  ve nadiren gerçekleşen aktarım faaliyetleri bakımından geçerli olacağı açıkça düzenlenmiştir."

Sonuçlar:

- m.9/6-a (açık rıza) ve m.9/6-b (sözleşmenin ifası) istisnaları Kanun metninde "arızi olmak
  kaydıyla sadece" diye sınırlandırılmıştır [1]; Rehber "olağan faaliyet akışı içindeki
  aktarımlar istisnai aktarıma konu edilemez" der [6].
- **Çıkarım:** Bir uygulamanın veri tabanının, yedeklerinin ve giriş e-postalarının yurt dışındaki
  veri işleyende durması süregelen bir ilişkinin sonucu, düzenli ve olağan faaliyet akışı içindedir;
  bu yüzden ne kayıt anındaki açık rıza ne de "kullanıcıyla sözleşmenin ifası" bu aktarım için
  dayanak olabilir. Rehber "barındırma/hosting" kelimesini istisna bölümünde anmıyor; en yakın
  örnek "veri tabanına doğrudan erişim izni verilmesi"dir.
- Aydınlatma metninde alıcıları ve ülkeleri saymak m.10 yükümlülüğünü karşılar; m.9'da bir aktarım
  dayanağı olarak yer almaz [1]. Eski rejimde bile (açık rıza tam bir dayanakken) Kurul, gizlilik
  bildiriminin kabul edilmesini aktarım rızası saymadı: Amazon kararında gizlilik bildirimindeki
  "Kişisel bilgilerinizi (...) Avrupa Birliği'ne ve Avrupa Birliği'nden Amerika Birleşik
  Devletleri'ne aktarabiliriz" ifadesi aktarımın **kanıtı** olarak kullanıldı ve "yalnızca amazon
  hizmetlerinin kullanılması suretiyle gizlilik bildiriminde yer alan hususların kabul edilmiş
  olduğu varsayımının Kanuna uygun bir açık rıza olarak nitelendirilemeyeceği" belirtildi [26].
  WhatsApp kararında aktarım rızasının hizmet koşullarına gömülmesi için "uygulamanın
  kullanılmasının aktarım şartına bağlandığı" ve açık rızanın "özgür iradeyle açıklanması unsurunun
  zedelendiği" tespit edildi [29].
- **Çıkarım:** Aydınlatma metnindeki açıklama cezayı önlemez, ama kaldırılması da çözüm değildir:
  alıcıları saymamak ayrıca m.10 (m.18/1-a) aykırılığı doğurur.

### 2. Kullanıcının cihazı veriyi doğrudan yurt dışındaki sunucuya gönderiyorsa "aktarım" var mı?

Rehber'in üç kriteri (s. 13–19) [6]:

1. "Veri sorumlusu ya da veri işleyen (veri aktaran) söz konusu kişisel veri işleme faaliyeti için
   Kanuna tabi olmalıdır."
2. "Veri aktaran tarafından işlenen kişisel veriler, iletilmeli veya başka bir suretle erişilebilir
   hale getirilmelidir."
3. "Veri aktarılan veri sorumlusu ya da veri işleyen, Kanuna tabi olup olmadığına bakılmaksızın
   üçüncü bir ülkede olmalıdır."

İkinci kriterin açıklaması (s. 16) [6]: "Söz konusu kriterin somutlaşması açısından örnek olarak
bir hesap oluşturulması, mevcut bir hesaba erişim hakkı verilmesi, uzaktan erişim için etkili bir
talebin onaylanması/kabul edilmesi, bir sabit sürücünün yerleştirilmesi veya bir dosyaya şifre
gönderilmesi verilebilecektir. Üçüncü bir ülkeden uzaktan erişimin (...) ve/veya bir hizmet
sağlayıcı tarafından sunulan yurt dışında bulunan bir bulutta depolama da bu üç kriterin
karşılanması koşuluyla bir aktarım olarak kabul edilecektir. Öte yandan, kişisel verilerin doğrudan
ilgili kişi tarafından iletilmesi gibi, kişisel verileri başka bir veri sorumlusu veya veri
işleyene ileten ya da erişilebilir hale getiren bir veri sorumlusu veya veri işleyen (veri aktaran)
olmadığı durumlarda bu ikinci kriterin yerine getirildiği kabul edilemeyecektir."

Rehber'in örnekleri (s. 17–19) [6]:

- (a) **İlgili kişiden doğrudan toplama, aktarım yok.** Örnek 1: Türkiye pazarını hedefleyen,
  Türkiye'de mukim olmayan üçüncü ülke şirketinin sitesine ilgili kişinin form doldurması:
  "ilgili kişi kişisel verilerini doğrudan üçüncü ülke şirketine iletmektedir ve kişisel veriler
  veri aktaran (veri sorumlusu/veri işleyen) tarafından aktarılmadığından ve doğrudan ilgili
  kişiden elde edildiğinden kişisel veri aktarımı teşkil etmeyecektir. Bununla birlikte, söz konusu
  işleme faaliyeti Kanuna tabi olduğundan Kanunun uygulanmasını gerektirecektir."
- Örnek 2: aynı senaryoda siparişleri üçüncü ülkedeki bir veri işleyen işliyorsa: toplama aktarım
  değildir, ancak "Türkiye dışında bir veri işleyenin bulunması ve bu verilerin üçüncü ülke şirketi
  bir veri işleyene iletilmesi kişisel veri aktarımı teşkil edecek olup (...) Kanun kapsamında yurt
  dışına veri aktarımı hükümlerinin uygulanmasını gerektirecektir."
- (b) **Türkiye'deki veri sorumlusu, yurt dışındaki veri işleyen.** Örnek 4: "Türkiye'de yerleşik
  olan veri sorumlusu şirketin çalışan ve müşterilerinin kişisel verilerini şirket adına veri
  işleyen olarak hareket eden üçünü [üçüncü] ülkedeki şirkete iletmesi kişisel veri aktarımı teşkil
  edecek olup Kanun kapsamında yurt dışına aktarım hükümleri uygulanacaktır."

EDPB Guidelines 05/2021 v2.0 (14.02.2023) [39] aynı yapıdadır: bulut cümlesi ("storage in a cloud
situated outside the EEA offered by a service provider, is also considered to be a transfer,
provided that the three criteria (...) are met"), "data are disclosed directly by the data subject
to the recipient" hâlinde ikinci kriterin sağlanmadığı, Örnek 1, 2 ve 5. Rehber'in almadığı bir
cümle (Rehber metninde "çerez" kelimesi geçmiyor) 15 numaralı dipnottadır: "personal data disclosed via cookies are not considered as being
disclosed directly by the data subject, but rather as a transmission by the operator of the website
that the data subject is visiting."

Rehber'in sustuğu yer:

- Rehber'de (ve EDPB metninde) "Türkiye'deki veri sorumlusunun uygulaması, kullanıcının cihazından
  veriyi doğrudan veri sorumlusunun yurt dışındaki veri işleyenine gönderiyor" senaryosu için
  **ayrı bir örnek yok**. "Doğrudan ilgili kişi tarafından iletilme" istisnasının örnekleri
  (Örnek 1–2) yalnızca alıcının **yurt dışındaki veri sorumlusunun kendisi** olduğu hâli anlatır.
- Kurul'un Rehber öncesi kararları yeri esas alır: "'Server'ları yurt dışında bulunan veri
  sorumlularından/veri işleyenlerden temin edilen saklama hizmetlerinin de Kanunun 9 uncu maddesi
  hükümlerine uygun olarak gerçekleştirilmesine" (2019/157, görüş) [25]; müşteri verilerinin
  "sunucuları Avrupa Birliği üyesi bir ülkede bulunan bulut veri tabanına" aktarılması (2020/559,
  ceza) [28]; "kaydetme, depolama, değiştirme, aktarma gibi her türlü işleme faaliyetinin,
  sunucuları Türkiye'de bulunmadığı sürece kişisel verilerin yurt dışına aktarımı anlamına
  geldiği" (2021/891) [29].
- **Çıkarım:** Türkiye'de yerleşik veri sorumlusu için "veri doğrudan cihazdan gidiyor" savunması
  Rehber'in metnine oturmuyor. Veri sorumlusu sağlayıcıda hesabı açan, veri tabanını kuran ve
  uygulamayı oraya yönlendiren taraftır; Rehber "bir hesap oluşturulması"nı ve yurt dışı bulutta
  depolamayı "erişilebilir hale getirme" örneği sayar, Örnek 4 de Türkiye'deki veri sorumlusu →
  yurt dışındaki veri işleyen akışını aktarım kabul eder. EDPB'nin çerez dipnotu aynı mantığı
  gösterir (veri teknik olarak tarayıcıdan çıksa da site işleticisinin iletimi sayılır). Bu
  yorum Rehber'de açıkça yazılı değildir; Kurul'un 2025 sonrası bu noktayı ele alan yayımlanmış bir
  kararı **bulunamadı**.
- **Çıkarım:** Sağlayıcı bazında: Hetzner'deki veri tabanı ve yedekler Örnek 4 + bulut cümlesi
  kapsamında; Resend'e e-posta adresini API sunucusu gönderdiği için ortada veri sorumlusu adına
  yapılan açık bir iletim var; Sentry ve Expo SDK'larının cihazdan gönderdiği veriler çerez
  dipnotundaki mantığa benziyor. Cloudflare Email Routing (kullanıcının kendi gönderdiği e-postanın
  yönlendirilmesi) için kaynaklarda bir dayanak **bulunamadı; belirsiz**.

### 3. Uygulama gerçeği

#### 3.1 Güvencesiz yurt dışı aktarımı yaptırıma bağlayan yayımlanmış kararlar

Hepsi 7499 öncesi m.9'a (açık rıza / taahhütname + Kurul izni) göre verilmiştir.

| Karar | Muhatap | Tetikleyen | Aktarıma ilişkin tespit | Uygulanan hüküm ve ceza | Kaynak |
|---|---|---|---|---|---|
| 31.05.2019, 2019/157 | Kurumsal e-postasını Gmail'e taşımak isteyen bir veri sorumlusu | Görüş talebi | Gmail altyapısı kullanılırsa "kişisel verilerin yurt dışına aktarılmış olacağı"; yurt dışı sunuculu saklama hizmetleri m.9'a uygun olmalı | **Yaptırım yok** (görüş kararı) | [25] |
| 27.02.2020, 2020/173 | Amazon Turkey Perakende Hizmetleri Ltd. Şti. | İhbar; resen inceleme | Gizlilik bildiriminden AB ve ABD'ye aktarım anlaşılıyor; taahhütname Kurulca onaylanmamış; usulüne uygun açık rıza yok | m.12/1 → m.18/1-b: **1.100.000 TL** (pazarlama rızası ve yurt içi aktarım aykırılıklarıyla birlikte); ayrıca m.18/1-a: 100.000 TL; metinlerin düzeltilmesi talimatı | [26] |
| 20.05.2020, 2020/404 | Bir işveren şirket | Çalışanın şikâyeti | Çalışan verilerinin açık rıza olmaksızın "yurtiçi ve/veya yurtdışına" aktarılması (diğer aykırılıklarla birlikte) | m.18/1-b: **200.000 TL**; m.18/1-a: 50.000 TL | [27] |
| 22.07.2020, 2020/559 | Otomotiv sektöründe bir şirket | Bir SMS şikâyeti; savunmada yurt dışı veri tabanı ortaya çıkınca resen inceleme (2019/203) | Müşteri verilerinin veri işleyenin AB'deki bulut veri tabanına aktarılması; 108 sayılı Sözleşme tek başına dayanak değil; "gerekli şartlar sağlanmadan kişisel verilerin yurt dışına aktarılması suretiyle hukuka aykırı bir kişisel veri işleme faaliyeti" | m.12/1-a → m.18/1-b: **900.000 TL**; aktarılan verilerin silinmesi/yok edilmesi ve aydınlatma metninin düzeltilmesi talimatı | [28] |
| 03.09.2021, 2021/891 | WhatsApp LLC (yurt dışında yerleşik) | Resen inceleme | Açık rıza hizmet koşuluna gömülmüş; taahhütname başvurusu yok; "Kanunun 9 uncu maddesine uygun hareket edilmediği" | m.12/1 → m.18/1-b: **1.950.000 TL**; metinlerin 3 ay içinde uygun hâle getirilmesi talimatı | [29] |
| 10.03.2022, 2022/229 | E-ticaret sektöründe bir şirket | İlgili kişinin şikâyeti | Analitik çerezlerle yurt dışına aktarım; "Kanun'un 9'uncu maddesinde yer alan aktarım usullerinden herhangi birine dayanılmaksızın kişisel veri aktarıldığı" | m.12/1 → m.18/1-b: **800.000 TL**; 30 gün içinde uyum talimatı | [31] |
| 25.11.2021, 2021/1187 | Bir işveren şirket | Eski çalışanın şikâyeti | "Microsoft serverlarının yurtdışında bulunuyor olmasından dolayı" m.9 iddiası | Bu iddia için **resen inceleme başlatılmasına** karar verildi (sonucu yayımlanmamış); başka bir aykırılıktan m.18/1-b: 250.000 TL | [30] |

Aramada "yurt dışı" geçen ama aktarımdan yaptırım çıkmayan özetler: 2021/358'de Kurul, ilgili
kişinin yurt dışına aktarım iddiası için "Kuruma tevsik edici bir bilgi veya belge sunmadığı
dikkate alındığında" işlem yapılmamasına karar verdi; 2021/1258, 2023/1309, 2024/1393, 2020/172,
2020/108 ve 2018/91'de ifade yalnızca şikâyetçinin iddiası, veri sorumlusunun savunması veya m.11
metninin tekrarıdır [16].

Karşılaştırma için o yılların m.18/1-b aralıkları [12]: 2020: 27.037–1.802.640 TL; 2021:
29.500–1.966.860 TL; 2022: 40.179–2.678.863 TL. Yani bu cezalar üst sınırın yaklaşık %30'u ile
tamamına yakını arasındadır ve muhatapların hepsi şirkettir; çoğunda aktarım tek aykırılık
değildir.

#### 3.2 1/9/2024 sonrası: değişik m.9'u uygulayan karar

- **Yayımlanmış karar özeti bulunamadı.** Karar tarihi 1/9/2024 ve sonrası olan 12 özet var
  (2024/1523, 2024/1718, 2024/1898, 2024/1899, 2024/2158, 2024/2196, 2025/88, 2025/536, 2025/601,
  2025/833, 2025/881, 2026/1183) [16]. On biri veri ihlali bildirimi veya resen inceleme, biri
  izinsiz SMS şikâyeti üzerinedir; hiçbiri m.9'u veya m.18/1-d'yi uygulamıyor. Duyurular
  listesinde de standart sözleşme imzalamadan barındırma veya geç bildirim nedeniyle verilmiş bir
  cezayı duyuran metin **bulunamadı** [17].
- **Toplu veriler var** (2025 Faaliyet Raporu) [13]:
  - "Sunulan Standart Sözleşme Sayısı: 2.497" (s. 34). 2024'te 1.364 [14].
  - "Kuruma intikal eden standart sözleşme bildirimleri hakkında yapılan değerlendirme neticesinde
    70'i ile ilgili olarak Kanun'un 15'inci maddesinin birinci fıkrası uyarınca resen inceleme
    başlatılarak 21'i sonuçlandırılmıştır. Sonuçlandırılan incelemelerin 3'ü hakkında toplam
    150.000 TL idari para cezası uygulanmıştır." (s. 43). Rapor hangi bendin uygulandığını ve
    muhatapları yazmıyor. **Çıkarım:** 150.000 / 3 = 50.000 TL, m.18/1-d'nin 2024 alt sınırına
    eşittir; bunlar bildirilmiş sözleşmelerdeki geç bildirim/usul eksikliği cezalarına benziyor,
    "hiç sözleşme yok" durumunun cezası değil.
  - Şikâyet/ihbar konuları arasında "Kişisel verilerin hukuka aykırı yurt dışına aktarılması": 2025'te
    12.512 başvurunun **105**'i (s. 38); 2024'te 111 [14]. Bu başvuruların sonucu raporda ayrıca
    verilmiyor.
  - 2025'te ceza uygulanan 876 veri sorumlusu: "140'ı ihbar ve şikâyetler, 142'si veri ihlal
    bildirimi ve 594'ü Veri Sorumluları Siciline kayıt ve bildirim yükümlülüğü kapsamında"; toplam
    352.510.494 TL (s. 42).
  - Sonuçlandırılan 13.456 dilekçenin "%68'i usul şartlarını taşımaması, %25'i (...) reddedilmiş
    (...) %5'i hakkında Kanun hükümlerine herhangi bir aykırılık bulunmaması (...) %1'i ile ilgili
    olarak veri sorumluları nezdinde idari para cezası uygulanmasına ve diğer %1'i ile ilgili
    olarak ise veri sorumlusunun talimatlandırılmasına karar verilmiştir." (s. 41).
- 2025'te taahhütname yolu: 90 başvuru, 13 izin, 76 ret (s. 34) [13]. Duyurular listesinde
  görülen tek bağlayıcı şirket kuralları onayı 20.05.2026 tarihlidir [22].

#### 3.3 Önce talimat mı, doğrudan ceza mı?

- m.15/5: "ihlalin varlığının anlaşılması hâlinde Kurul, tespit ettiği hukuka aykırılıkların veri
  sorumlusu tarafından giderilmesine karar vererek ilgililere tebliğ eder. Bu karar, tebliğden
  itibaren gecikmeksizin ve en geç otuz gün içinde yerine getirilir." [1]. Bu karara uymamak ayrı
  bir kabahattir (m.18/1-c).
- m.15/7: "Kurul, telafisi güç veya imkânsız zararların doğması ve açıkça hukuka aykırılık olması
  hâlinde, veri işlenmesinin veya verinin yurt dışına aktarılmasının durdurulmasına karar
  verebilir." [1].
- Yayımlanmış aktarım kararlarının dördünde Kurul **aynı kararda hem ceza verip hem talimat
  vermiştir** (Amazon, 2020/559, WhatsApp, 2022/229) [26][28][29][31]; önce süreli uyarı, sonra
  ceza şeklinde bir sıra bu kararlarda görülmüyor. (2020/404'te talimat olup olmadığına
  bakılmadı.) Faaliyet raporundaki "%1 ceza, %1 talimat"
  dağılımı yalnız talimatla biten dosyaların da bulunduğunu gösterir [13]; hangi tür dosyaların
  talimatla kapandığı raporda yazmıyor.
- 2021/1187'de Kurul, veri sorumlusuna başvuruda dile getirilmemiş bir iddia için ilgili kişiye
  m.14 yolunu hatırlatırken, yurt dışı sunucu iddiası için ayrıca resen inceleme açmıştır [30].
  m.15/1'e göre Kurul "şikâyet üzerine veya ihlal iddiasını öğrenmesi durumunda resen" inceleme
  yapar [1].

#### 3.4 Gerçek kişi ve küçük işletmeler için indirim var mı?

- KVKK m.18'de gerçek kişi veya küçük işletme için ayrı bir tarife ya da indirim **yok**. m.18/2:
  (a)–(ç) bentlerindeki cezalar "veri sorumlusu", (d) bendindeki ceza "veri sorumlusu veya veri
  işleyen gerçek kişiler ile özel hukuk tüzel kişileri hakkında uygulanır." m.18/3: "Kurulca
  verilen idari para cezalarına karşı, idare mahkemelerinde dava açılabilir." (7499 ile eklendi;
  bir indirim hükmü değildir) [1].
- Kabahatler Kanunu [3] (Rehber s. 14: "Kanunda düzenlenen idari para cezalarının tespiti ve
  uygulanması noktasında Kabahatler Kanunu hükümlerinin esas alınması gerekmektedir" [6]):
  - m.17/2: alt ve üst sınırlı cezalarda "idarî para cezasının miktarı belirlenirken işlenen
    kabahatin haksızlık içeriği ile failin kusuru ve ekonomik durumu birlikte göz önünde
    bulundurulur."
  - m.17/3: "Kişinin ekonomik durumunun müsait olmaması halinde, idarî para cezasının, ilk
    taksitinin peşin ödenmesi koşuluyla, bir yıl içinde ve dört eşit taksit halinde ödenmesine
    karar verilebilir."
  - m.17/6: "Kanunlarında ödeme süresi düzenlenmemiş olan idari para cezaları, tebliğinden itibaren
    bir ay içinde ödenir. İdari para cezasının ödeme süresi içinde ödenmesi halinde, cezadan %25
    oranında indirim yapılır. (...) Ödeme yapılması, kişinin bu karara karşı kanun yoluna başvurma
    hakkını etkilemez."
  - m.15/2: "Kesintisiz fiille işlenebilen kabahatlerde, bu nedenle idarî yaptırım kararı
    verilinceye kadar fiil tek sayılır."
  - m.20/2-a: yüz bin TL veya daha fazla idari para cezasını gerektiren kabahatlerde soruşturma
    zamanaşımı beş yıldır.
- Kurul'un uygulaması: "ekonomik durum" birçok kararda ölçüt olarak anılıyor (ör. 2024/415:
  "ihlalin boyutu, kabahatin haksızlık içeriği, veri sorumlusunun kusuru ve ekonomik durumu da göz
  önünde bulundurularak" 430.000 TL) [37]. Küçük veri sorumlularına verilen iki m.18/1-b cezası:
  yerel bir haber sitesi 30.000 TL (06.01.2022, 2022/13), yerel bir basın organı 40.179 TL
  (22.02.2024, 2024/275) [36]. Bu tutarlar karar yılının alt sınırının (2022: 40.179 TL; 2024:
  141.934 TL) altındadır; sırasıyla 2021 (29.500 TL) ve 2022 (40.179 TL) alt sınırlarına denk
  düşer [12]. Gerçek kişi veri sorumlusuna da ceza verilmiştir: bir avukata m.18/1-b uyarınca
  75.000 TL (02.11.2021, 2021/1111) [35].
- **Çıkarım:** Gerçek kişi olmak veya beta aşamasında olmak cezayı engellemez; etkisi cezanın
  aralık içindeki yerini (alt sınıra yakınlık) belirlemekle sınırlıdır. Yukarıdaki iki karar,
  Kurul'un karar yılının değil fiilin işlendiği yılın tarifesini uyguladığını düşündürüyor; özetler
  bunu açıkça söylemiyor. Sürmekte olan bir aktarımda hangi yılın tarifesinin uygulanacağı
  kaynaklarda **belirsiz** (Kabahatler Kanunu m.15/2 kesintisiz fiili karar anına kadar tek fiil
  sayar).

### 4. Ceza aralıkları

2026 tutarları (yeniden değerleme %25,49), Kurumun tablosundan [12]:

| Bent | Aykırılık | 2026 alt sınır | 2026 üst sınır |
|---|---|---|---|
| m.18/1-a | Aydınlatma yükümlülüğü (m.10) | 85.437 TL | 1.709.200 TL |
| m.18/1-b | Veri güvenliği yükümlülükleri (m.12) | 256.357 TL | 17.092.242 TL |
| m.18/1-c | Kurul kararlarının yerine getirilmemesi (m.15) | 427.263 TL | 17.092.242 TL |
| m.18/1-ç | Sicile kayıt ve bildirim (m.16) | 341.809 TL | 17.092.242 TL |
| m.18/1-d | m.9/5'teki standart sözleşme bildirimi | 90.308 TL | 1.806.177 TL |

"Hiç güvence olmadan sistematik aktarım"a hangisi uygulanır?

- m.18'de m.9'a aykırı aktarımın kendisi için ayrı bir bent yok. (d) bendi yalnızca "9 uncu
  maddenin beşinci fıkrasında öngörülen bildirim yükümlülüğünü yerine getirmeyenler" içindir [1].
- Kurul, eski rejimde güvencesiz aktarımı "hukuka aykırı işleme" sayıp **m.12/1 → m.18/1-b**
  uygulamıştır. Kanıt: 2020/559: gerekli şartlar sağlanmadan aktarım "hukuka aykırı bir kişisel
  veri işleme faaliyeti"dir, "12 nci maddesinin birinci fıkrasının (a) bendinde öngörülen 'Kişisel
  verilerin hukuka aykırı olarak işlenmesini önlemek' yükümlülüğünün yerine getirilmediği
  kanaatine varıldığından (...) 18 inci maddesinin birinci fıkrasının (b) bendi uyarınca 900.000 TL"
  [28]; aynı yol Amazon, WhatsApp ve 2022/229'da [26][29][31].
- **Çıkarım:** İmzalanmış bir standart sözleşme yoksa bildirilecek bir şey de yoktur; bu yüzden
  m.18/1-d (90.308–1.806.177 TL) "hiç güvence yok" durumunun aralığı değildir. Kurul'un yerleşik
  yolu izlenirse gerçekçi aralık **m.18/1-b: 2026'da 256.357–17.092.242 TL**'dir. Bu yolun 7499
  sonrası da sürdüğünü gösteren yayımlanmış bir karar bulunamadığı için bu bir çıkarımdır.
- Kurulun düzeltme kararına 30 gün içinde uyulmazsa ayrıca m.18/1-c (427.263 TL'den başlar) [1][12].
- Tebliğden itibaren bir aylık ödeme süresi içinde ödemede %25 indirim uygulanır (Kabahatler
  Kanunu m.17/6) [3]. **Çıkarım:** m.18/1-b alt sınırı bu indirimle yaklaşık 192.268 TL eder.

2027 yeniden değerleme oranı: **Resmî Gazete'de henüz ilan edilmedi** (1–15 Kasım 2026 fihristleri
kontrol edildi; 10.11.2026 tarihli 597 sıra no.lu Vergi Usul Kanunu Genel Tebliği başka bir konuya
ilişkin) [40]. Bir önceki yıl ilgili tebliğ (Sıra No: 585) 27.11.2025 tarihli Resmî Gazete
fihristinde yer alıyordu (fihrist görüldü, tebliğ metni açılmadı). Basın, TÜİK'in Ekim verisine göre oranın
%27,83 hesaplandığını yazıyor [42]; bu **ikincil kaynaktır, doğrulanmadı**. **Çıkarım:** Bu oran
resmîleşirse m.18/1-b 2027'de yaklaşık 327.701–21.849.012 TL, m.18/1-d yaklaşık 115.440–2.308.836 TL
olur; Kurumun tablosu yayımlanınca doğrulanmalıdır.

### 5. 2026-10-29'dan beri ne değişti?

- **Yeterlilik kararı:** Yok. Kurum sayfasında 15.11.2026'da hâlâ: "Yeterli korumanın bulunduğu
  ülkeler: Bu konuda Kurul tarafından henüz bir belirleme yapılmamıştır." [7].
- **Aktarıma ilişkin yeni Kurul duyurusu:** Yok. Duyurular listesinde 29.10.2026 sonrası tek kayıt
  11.11.2026 tarihli "Seçilmiş Güncel Gelişmeler-63" bültenidir; ana sayfada ayrıca üç veri ihlali
  duyurusu var. Aktarım konulu son duyurular daha eskidir: BŞK onayı (21.05.2026) [22], kamu
  kurumlarında yurt dışı menşeli haberleşme uygulamaları (29.01.2026) [24], uluslararası sözleşme
  niteliğinde olmayan anlaşmayla aktarım izni (10.11.2025) [21].
- **Standart sözleşmeler ve modül:** Standart Sözleşmeler sayfasında aynı dört tip duruyor; modül
  ana sayfasında yeni bir uyarı veya sürüm notu görülmedi [10][11].
- **Kanun değişikliği:** Kurumun 11.11.2026 bülteni şunu aktarıyor: "27.10.2026 tarih ve 33413
  mükerrer sayılı Resmî Gazete'de yayımlanan '2027 Yılı Cumhurbaşkanlığı Yıllık Programı'nda, 6698
  sayılı Kişisel Verilerin Korunması Kanunu'nun AB Genel Veri Koruma Tüzüğü (GDPR) başta olmak
  üzere AB müktesebatı ile uyumlaştırılmasına yönelik çalışmaların 2027 yılı içerisinde
  tamamlanacağı belirtildi" [18]. Programın kendi metni okunamadı (taranmış PDF) [41]. TBMM'ye
  sunulmuş bir KVKK değişiklik teklifi **bulunamadı** (sınırlı arama; bkz. Yöntem). Bir Adalet
  Bakanlığı taslağından söz eden haberler ikincil kaynaktır ve doğrulanmadı.
- **Yeni karar özeti:** Aktarıma ilişkin yeni bir özet yok; en yeni tarihli özet 10.06.2026,
  2026/1183'tür [16].
- **2027 ceza tutarları:** Henüz yok (bkz. §4).

### 6. Veri sorumlusu yurt dışında kurulu olsaydı

- **Kanun uygulanır.** Rehber, Kanun'un yer bakımından kapsamını "etki ilkesi"yle yorumlar:
  "veri sorumlularının yurt dışında yerleşik olması gerekçesiyle yapılan kişisel veri işleme
  faaliyetleri bakımından Kanunun uygulama alanı bulmayacağının kabulü hem teknolojinin mevcut
  durumu hem de Kanunun amacıyla bağdaşmamaktadır." (s. 15) [6]. Kurul 2025/601'de aynı ölçütü
  tersinden uyguladı: Hong Kong'da kurulu, ilgili kişilerin hizmetlerden "Türkiye'de
  faydalanmadıkları" bir veri sorumlusu için "Kanun kapsamına girmediği" sonucuna vardı [38].
  **Çıkarım:** Türkiye'deki kullanıcılara hizmet veren bir Estonya veya ABD şirketi Kanun'a tabidir.
- **Toplama ayağı aktarım değildir, veri işleyene iletim aktarımdır.** Rehber Örnek 1'e göre
  doğrudan ilgili kişiden toplama aktarım sayılmaz; Örnek 2'ye göre aynı yabancı veri sorumlusu
  veriyi Türkiye dışındaki bir veri işleyene iletirse bu "kişisel veri aktarımı teşkil edecek"tir
  (s. 17) [6]. EDPB Örnek 2 aynıdır: "such disclosure from the third country company to its
  non-EEA processor would amount to a transfer" [39]. **Çıkarım:** Yabancı şirket kendi
  sunucusunda barındırmıyor da Hetzner, Resend, Sentry, Expo kullanıyorsa m.9 bu sağlayıcılar için
  yine devreye girer; yapı değişikliği sorunu çözmez.
- **Kurul'un Rehber öncesi tutumu daha da katıydı.** WhatsApp LLC kararında yabancı veri
  sorumlusunun kendi sunucularında depolaması bile aktarım sayıldı: "her türlü işleme faaliyetinin,
  sunucuları Türkiye'de bulunmadığı sürece kişisel verilerin yurt dışına aktarımı anlamına geldiği"
  [29]. Bu ifade Rehber'in Örnek 1'iyle uyuşmuyor; hangisinin bugün geçerli olduğunu gösteren
  yayımlanmış bir karar **bulunamadı**.
- **Yerine geçen yükümlülükler.**
  - VERBİS: Sicil Yönetmeliği m.5/1-b: "Türkiye'de yerleşik olmayan veri sorumluları, veri işlemeye
    başlamadan önce veri sorumlusu temsilcisi marifetiyle Sicile kaydolmak zorundadır." [5].
    İstisna yok: "yurt dışında yerleşik veri sorumlularının Sicile kayıt yükümlülüğü ve başlama
    tarihi tespitinde yıllık çalışan sayısı, mali bilanço toplamı veya ana faaliyet konusunun özel
    nitelikli kişisel veri olup olmadığı bilgisi dikkate alınmamaktadır." (Sorularla VERBİS, Soru
    51) [15]. Kayıt yapmamak m.18/1-ç: 2026'da 341.809 TL'den başlar [12]; 2025'te 594 veri
    sorumlusuna bu nedenle toplam 216.860.000 TL ceza verildi ve rapor "yurtdışında yerleşik gerçek
    ve tüzel kişi veri sorumluları"nı açıkça sayıyor (s. 49) [13].
  - Temsilci: m.11/2: temsilci atama kararının "tasdikli örneği, kayıt başvurusu sırasında veri
    sorumlusu temsilcisi tarafından Kuruma sunulur"; m.11/3 temsilcinin asgari yetkilerini sayar
    (tebligatları kabul, Kurum taleplerini iletme, ilgili kişi başvurularını alma, Sicil
    işlemleri) [5]. Temsilci "Türkiye'de yerleşik bir tüzel kişi veya Türkiye Cumhuriyeti vatandaşı
    bir gerçek kişi olmalıdır" [15].
  - Aydınlatma, veri güvenliği, ihlal bildirimi gibi diğer yükümlülükler aynen sürer (Örnek 1:
    "Kanunun uygulanmasını gerektirecektir") [6].
- **m.9'u dolanmaya yönelik yapılar hakkında Kurul dili:** Rehber'de ve 313 karar özetinde
  `muvazaa`, `kanuna karşı hile`, `dolanma`, `paravan` ifadeleri m.9 bağlamında **bulunamadı**.
  İlgili tek ölçüt veri sorumlusunun işlevsel olarak belirlenmesidir: Kurul, veri sorumlusunu
  saptarken "hangi kişisel verilerin hangi amaçla işleneceği (...) kişisel verilerin paylaşılıp
  paylaşılmayacağı (...) gibi hususlarda kimin karar verdiği"ne bakar (2019/225) [32]; 2022/172'de
  de veri sorumlusu sıfatını Türkiye'deki irtibat bürosuna değil yurt dışındaki şirkete atfetmiştir
  [34]. **Çıkarım:** Kararları fiilen Türkiye'deki kurucunun verdiği bir yabancı şirket yapısında
  veri sorumlusunun kim sayılacağı tartışmaya açıktır; kaynaklarda bu senaryo ele alınmamıştır.

### 7. SS-2 bildiriminin mekaniği (gerçek kişi veri aktaran, yabancı veri işleyen)

Kaynakların söyledikleri:

- **Metin.** "Standart sözleşme metninin, üzerinde herhangi bir değişiklik yapılmaksızın
  kullanılması zorunludur. Standart sözleşmenin yabancı dilde de akdedilmesi hâlinde Türkçe metin
  esas alınır." (Yön. m.14/3) [2]. Yalnızca seçimlik/alternatif maddeler değiştirilebilir [8].
- **İmza.** "Standart sözleşmenin, aktarımın taraflarınca veya tarafları temsile ve imzaya yetkili
  kişilerce imzalanması zorunludur." (Yön. m.14/4) [2]. Kurum duyurusu: imzaların "6098 sayılı Türk
  Borçlar Kanunu'nun imzaya ilişkin düzenlemelerine uygun olması gerekmektedir"; "hem veri
  aktaranın hem de veri alıcısının Türkçe sözleşme metni üzerinde imzalarının bulunması
  gerekmektedir" (çift sütunlu metinde imzalar Türkçe sütunda) [8]. TBK m.15: "İmzanın, borç altına
  girenin el yazısıyla atılması zorunludur. Güvenli elektronik imza da, el yazısıyla atılmış
  imzanın bütün hukuki sonuçlarını doğurur." [4]. Yabancı e-imza platformlarıyla atılan imzaların
  kabul edilip edilmediği kaynaklarda **ele alınmamış; belirsiz**.
- **Geçersizlik.** "Tarafların birinin ya da her ikisinin geçerli imzasının bulunmaması halinde
  standart sözleşme geçerli olmayacaktır." Yetki belgelerinde imzalayanın adı yoksa "sözleşme
  yetkisiz kişiler tarafından imzalanmış olacağından standart sözleşme geçerli sayılmayacaktır."
  [8]. Metinde değişiklik veya geçerli imza eksikliği hâlinde "Kanunun 15 inci maddesi uyarınca
  Kurul tarafından inceleme yapılır." (Yön. m.14/7) [2].
- **Tarihler.** "aktarım taraflarının her ikisinin de imza tarihlerini standart sözleşme metni
  üzerinde belirtmeleri gerekmektedir"; geçmişe dönük "yürürlük tarihi" ibaresi konulmamalı [8].
  SS-2'nin imza bloğu her iki taraf için "İmza ve Tarih" satırı içerir [11].
- **Süre ve kanal.** "imzaların tamamlanmasından itibaren beş iş günü içinde fiziki olarak veya
  kayıtlı elektronik posta (KEP) adresi ya da Kurul tarafından belirlenen diğer yöntemlerle Kuruma
  bildirilir" (Yön. m.14/5) [2]; Kurul 17.10.2024 tarihli 2024/1793 sayılı kararıyla modül üzerinden
  bildirimi kabul etti [9]. Bildirim yükümlüsü sözleşmede belirlenmemişse veri aktarandır (SS-2
  m.16 seçimliktir) [2][11].
- **Ekler.** "Yapılacak bildirime, standart sözleşmeyi imzalayanların yetkili olduğuna dair tevsik
  edici belgeler ile yabancı dildeki her belgenin noter onaylı çevirisi eklenir." (Yön. m.14/6)
  [2]. Yabancı ülkede düzenlenmiş resmî belgeler için konsolosluk tasdiki veya, Lahey Sözleşmesi
  tarafı ülkelerde, "apostil şerhi ile birlikte Kuruma sunulması gerekmektedir" [8]; Rehber s. 59
  aynı [6].
- **Modül akışı (Kılavuz)** [10]: önce "Veri Sorumlusu/Veri İşleyen olarak sisteme kayıt"; yurt
  içinde yerleşikler için "Vergi Kimlik No/TCKN" zorunlu (10 haneli VKN veya 11 haneli T.C. kimlik
  no girilebilir); sonra "yetkili kişi" eklenir ("Yetki Belgesi: Zorunlu alandır"); "T.C.
  Vatandaşı" olarak eklenen yetkili kişi modüle e-Devlet ile girer; karşı taraf "Yurtdışında
  Yerleşik" taraf olarak ülke seçilerek eklenir; "Sözleşme Dosyası: Zorunlu alandır. Sözleşmenin
  taranıp PDF halinde modüle ekleneceği dosyadır. Yalnızca PDF formatında olabilir ve bir adet
  olabilir."; "İmzaların Tamamlandığı Tarih: Zorunlu alandır."; "Ek Dosyalar: Zorunlu değildir.
  Standart sözleşmeyi imzalayanların yetkili olduğuna dair tevsik edici belgeler ve varsa yabancı
  dildeki belgelerin noter onaylı çevirisini buradan ekleyebilirsiniz."; gönderimden sonra
  "sözleşmeniz kurum tarafından incelenecektir" ve gönderilen sözleşme değiştirilemez, yalnızca
  değişiklik/sonlandırma bildirimi yapılır.
- **Sonraki bildirimler.** Taraflarda, içerikteki bilgilerde, alt veri işleyenlerde değişiklik
  veya sözleşmenin sona ermesi de aynı usulle bildirilir (Yön. m.14/8; Rehber s. 59–60) [2][6].
- **VERBİS alanı.** SS-2 ekindeki VERBİS bilgileri yalnızca veri aktaran Sicile kayıtla yükümlüyse
  doldurulur (Rehber s. 57) [6].

Kaynakların **söylemedikleri** (belirsiz):

- Veri aktaran gerçek kişinin kendisi imzalıyorsa hangi "yetki belgesi"nin yükleneceği (Kılavuz
  alanı zorunlu tutuyor, içeriğini tarif etmiyor).
- Kılavuz ek dosyaları "zorunlu değildir" diye gösterirken Yönetmelik m.14/6 yetki belgelerini ve
  noter onaylı çevirileri zorunlu sayıyor; ikisi arasındaki fark kaynaklarda açıklanmıyor.
  **Çıkarım:** Yönetmelik üst normdur; Kılavuz'daki ifade form alanının teknik zorunluluğunu
  anlatıyor olabilir.
- Yabancı veri işleyenin imza yetkisini hangi belgeyle kanıtlayacağı (ticaret sicil özeti, imza
  sirküleri muadili vb.) sayılmamış; yalnızca apostil ve noter onaylı çeviri şartı var.
- Islak imzalı aslın fiziken gönderilmesinin gerekip gerekmediği: modül taranmış PDF kabul ediyor;
  aslın saklanması veya ibrazı hakkında hüküm okunmadı.

## Sonuç (bilgi, görüş değil)

**(i) Aydınlatma veya rıza ceza riskini kaldırır mı?** Hayır. m.9, 1/9/2024'ten beri sürekli
aktarım için yalnızca yeterlilik kararını (yok) veya uygun güvenceyi (pratikte imzalanıp
bildirilmiş standart sözleşme) tanıyor; açık rıza ve "sözleşmenin ifası" Kanun'un kendi
ifadesiyle "arızi olmak kaydıyla sadece" geçerli [1][2][6]. Aydınlatma metninde sağlayıcıları ve
ülkeleri saymak m.10'u karşılar, m.9'u karşılamaz; Kurul eski rejimde bile gizlilik bildirimindeki
aktarım açıklamasını aktarımın kanıtı olarak kullandı [26]. Metni silmek de çözüm değildir, çünkü
bu kez m.10 aykırılığı eklenir.

**(ii) Gerçekçi ceza aralığı ve tetikleyiciler.** Güvencesiz aktarımı yaptırıma bağlayan
yayımlanmış kararların hepsinde m.12/1 → m.18/1-b uygulanmıştır [26][27][28][29][31]; bu bendin 2026 aralığı
256.357–17.092.242 TL'dir [12]. m.18/1-d (90.308–1.806.177 TL) yalnızca imzalanmış bir sözleşmenin
bildirilmemesi içindir. Bu, 7499 sonrası için bir **çıkarımdır**: değişik m.9'u güvencesiz
barındırmaya uygulayan yayımlanmış bir karar bulunamadı; 2025'te Kurum 105 "hukuka aykırı yurt dışı
aktarım" başvurusu aldı ve standart sözleşme bildirimlerinden yalnızca üç ceza (toplam 150.000 TL)
çıktı [13]. Yayımlanmış aktarım cezalarının muhataplarının hepsi şirkettir ve dosyalar bir
şikâyet, ihbar, başka bir konudaki şikâyetin savunmasında aktarımın ortaya çıkması veya resen
inceleme ile başlamıştır [26][27][28][29][30][31]; 2025'te cezaların kaynağı ihbar/şikâyet (140),
veri ihlali bildirimi (142) ve VERBİS (594) idi [13]. **Çıkarım:** VERBİS'ten muaf, onlarca
kullanıcılı bir beta için fiilî tetikleyiciler bir kullanıcının veya üçüncü kişinin şikâyeti/ihbarı
ile bir veri ihlali bildirimidir; gerçek kişi olmak cezayı engellemez, yalnızca miktarı alt sınıra
yaklaştırabilir (ekonomik durum ölçütü, süresinde ödemede %25 indirim, taksit) [3][35][36]. Kurul
cezayı ve düzeltme talimatını genellikle aynı kararda verir [28][31].

**(iii) Riski gerçekten kaldıran seçenekler.** Kaynaklara göre yalnızca şunlar:

- Kişisel veriyi Türkiye'de barındırmak (o veri için m.9 devreye girmez); yurt dışında kalan her
  araç (e-posta, hata izleme, OTA) ayrıca değerlendirilir.
- Yurt dışındaki her veri işleyenle Kurul'un SS-2 metnini değiştirmeden, Türkçe metin üzerinde
  imzalamak ve imzaların tamamlanmasından itibaren beş iş günü içinde bildirmek [2][8].
- Bir yurt dışı aracı kaldırmak veya ona hiç kişisel veri göndermemek (**çıkarım**: kişisel veri
  yoksa aktarım da yoktur; IP adresi gibi sınır durumlar belirsiz).
- Taahhütname + Kurul izni (m.9/4-ç): mümkün ama 2025'te 90 başvurunun 13'üne izin verildi [13].
- Yeterlilik kararı: bugün hiçbir ülke için yok [7].

Riski **kaldırmayanlar**: aydınlatma metnine uyarı eklemek, kayıt ekranında aktarım rızası almak,
"veri cihazdan doğrudan gidiyor" savunması (Rehber'de dayanağı yok) ve veri sorumlusunu yurt
dışında kurulu bir şirkete taşımak (veri işleyene iletim yine aktarımdır; üstüne istisnasız VERBİS
kaydı ve temsilci atama yükümlülüğü gelir) [5][6][15].

## Açık sorular

1. Kurul, 7499 sonrası rejimde "hiç güvence yok" durumuna m.12/1 → m.18/1-b'yi uygulamayı
   sürdürüyor mu? Yayımlanmış karar yok; 2025'teki 105 "hukuka aykırı yurt dışı aktarım"
   başvurusunun sonuçları raporda verilmiyor [13].
2. Standart sözleşme bildirimlerinden doğan üç cezanın (toplam 150.000 TL) muhatapları, bentleri
   ve gerekçeleri yayımlanmadı [13].
3. Türkiye'deki veri sorumlusunun uygulamasının veriyi cihazdan doğrudan yurt dışındaki veri
   işleyene göndermesi Rehber'de örneklenmemiş; Sentry/Expo gibi SDK akışları ve Cloudflare Email
   Routing için Kurum kaynağı yok.
4. Rehber Örnek 2'nin son cümlesindeki "kendi adına" ifadesi EDPB metnindeki "on its behalf"
   (veri sorumlusu adına) ifadesinin çevirisi gibi duruyor; Türkçe cümle iki türlü okunabiliyor.
5. WhatsApp kararındaki "sunucuları Türkiye'de bulunmadığı sürece (...) aktarım" yaklaşımı ile
   Rehber Örnek 1 arasındaki fark bir kararla giderilmedi.
6. Hetzner, Resend, Sentry, Expo ve Cloudflare SS-2'yi Türkçe metin üzerinde, değiştirmeden,
   apostilli yetki belgesiyle imzalar mı? Yazılı soru gerekir (bkz. `kvkk-hosting-providers.md`).
7. Gerçek kişi veri aktaran için modüldeki "yetki belgesi" ve yabancı e-imzanın kabulü Kurumdan
   (ALO 198 veya standartsozlesme@kvkk.gov.tr [10]) sorulmalı.
8. 2027 yeniden değerleme oranı Resmî Gazete'de yayımlanınca §4'teki rakamlar güncellenmeli;
   Kurumun 2027 tablosu genellikle yıl sonunda yayımlanıyor [12].
9. 2027 Yıllık Programı'ndaki GDPR uyum çalışması m.9'u (ör. tek taraflı kabul edilebilir standart
   sözleşmeler, AB için yeterlilik) değiştirecek mi? Metin yok; izlenmeli [18].
10. İdare mahkemesinde dava açma süresi ve yürütmenin durdurulması bu belgede okunmadı (2577 sayılı
    Kanun incelenmedi).
11. Hata raporlarından ve OTA isteklerinden kişisel veri tamamen çıkarılabilirse (IP dâhil) bu
    akışlar m.9 dışında kalır mı? IP adresinin sağlayıcıda işlenmesi `kvkk-hosting-providers.md`'de
    de belirsiz kalmıştı.

## Kaynaklar

Birincil mevzuat:

1. 6698 sayılı Kişisel Verilerin Korunması Kanunu, güncel metin (m.9, 10, 12, 15, 18, geçici m.3):
   https://www.mevzuat.gov.tr/MevzuatMetin/1.5.6698.pdf
2. Kişisel Verilerin Yurt Dışına Aktarılmasına İlişkin Usul ve Esaslar Hakkında Yönetmelik (RG
   10.07.2024, 32598; m.4, 6, 7, 14, 16):
   https://www.mevzuat.gov.tr/MevzuatMetin/yonetmelik/7.5.40863.pdf —
   RG: https://www.resmigazete.gov.tr/eskiler/2024/07/20240710-2.htm
3. 5326 sayılı Kabahatler Kanunu, güncel metin (m.3, 15, 17, 20):
   https://www.mevzuat.gov.tr/MevzuatMetin/1.5.5326.pdf
4. 6098 sayılı Türk Borçlar Kanunu, güncel metin (m.14–15):
   https://www.mevzuat.gov.tr/MevzuatMetin/1.5.6098.pdf
5. Veri Sorumluları Sicili Hakkında Yönetmelik (m.5, 8, 11, 16):
   https://www.kvkk.gov.tr/Icerik/5442/VERI-SORUMLULARI-SICILI-HAKKINDA-YONETMELIK

Kurum rehber, duyuru ve raporları:

6. KVKK, Kişisel Verilerin Yurt Dışına Aktarılması Rehberi (Ocak 2025), PDF:
   https://www.kvkk.gov.tr/SharedFolderServer/CMSFiles/13711235-abb6-4b17-9a6b-0a68c1ad86c5.pdf
7. KVKK, Yurt Dışına Aktarım (yeterlilik kararı durumu; istisnaların dar yorumu), 15.11.2026'da
   okundu: https://www.kvkk.gov.tr/Icerik/2053/Yurtdisina-Aktarim
8. KVKK, Standart Sözleşmelerde Dikkat Edilmesi Gereken Hususlara İlişkin Kamuoyu Duyurusu
   (05.02.2025):
   https://www.kvkk.gov.tr/Icerik/8170/Yurt-Disina-Kisisel-Veri-Aktariminda-Kullanilacak-Standart-Sozlesmelerde-Dikkat-Edilmesi-Gereken-Hususlara-Iliskin-Kamuoyu-Duyurusu
9. KVKK, Standart Sözleşme Bildirim Modülü Hakkında Kamuoyu Duyurusu (25.10.2024; Kurul 17.10.2024,
   2024/1793):
   https://www.kvkk.gov.tr/Icerik/8043/Standart-Sozlesme-Bildirim-Modulu-Hakkinda-Kamuoyu-Duyurusu
10. Standart Sözleşme Bildirim Modülü ana sayfası: https://standartsozlesme.kvkk.gov.tr/ —
    Standart Sözleşme Bildirim Kılavuzu (PDF, 43 sayfa):
    https://standartsozlesme.kvkk.gov.tr/sharedFolder/kullanim-kilavuzu.pdf
11. KVKK, Standart Sözleşmeler (4 tip): https://www.kvkk.gov.tr/Icerik/7929/Standart-Sozlesmeler —
    SS-2 metni (m.16–18, imza bloğu):
    https://www.kvkk.gov.tr/SharedFolderServer/CMSFiles/b531d656-9cea-4cdb-84ce-1ab92198c9b1.pdf
12. KVKK, İdari Para Cezası Tutarları:
    https://www.kvkk.gov.tr/Icerik/8145/6698-sayili-kisisel-verilerin-korunmasi-kanunu-kapsaminda-idari-para-cezasi-tutarlari —
    2016–2026 tablosu:
    https://www.kvkk.gov.tr/SharedFolderServer/CMSFiles/MTY5NTUyNTRkNDkxNGY.pdf
13. KVKK, 2025 Yılı Faaliyet Raporu (s. 34, 38, 41–43, 49):
    https://www.kvkk.gov.tr/SharedFolderServer/CMSFiles/MTY5ZjMxYTVlZGY0Y2Y.pdf —
    liste: https://www.kvkk.gov.tr/Icerik/2094/Faaliyet-Raporu
14. KVKK, 2024 Yılı Faaliyet Raporu (standart sözleşme sayısı 1.364; yurt dışı aktarım başvurusu 111):
    https://www.kvkk.gov.tr/SharedFolderServer/CMSFiles/549ba061-ddbe-402f-9db5-3a6913ca1640.pdf
15. KVKK, Sorularla VERBİS (Soru 6, 46, 51): https://verbis.kvkk.gov.tr/sharedFolder/sorularla-verbis.pdf
16. KVKK, Kurul Karar Özetleri (36 sayfa, 313 özet; tam metin tarandı):
    https://www.kvkk.gov.tr/Icerik/5406/kurul-karar-ozetleri
17. KVKK, Duyurular (39 sayfa; başlıklar tarandı): https://www.kvkk.gov.tr/Icerik/2015/Duyurular
18. KVKK, Kişisel Verilerin Korunması ile İlgili Seçilmiş Güncel Gelişmeler-63 (11.11.2026):
    https://www.kvkk.gov.tr/SharedFolderServer/CMSFiles/MTZhZjQ0YWI3YjFmMmY.pdf
19. KVKK, İlke Kararları (başlıklar): https://www.kvkk.gov.tr/Icerik/7201/ilke-kararlari
20. KVKK, Kurul Kararlarının Yerine Getirilmesi Yükümlülüğü:
    https://www.kvkk.gov.tr/Icerik/2047/Kurul-Kararlarinin-Yerine-Getirilmesi-Yukumlulugu
21. KVKK, Uluslararası Sözleşme Niteliğinde Olmayan Anlaşma ile Yurt Dışına Kişisel Veri Aktarımına
    İzin Verilmesi Hakkında Duyuru (10.11.2025):
    https://www.kvkk.gov.tr/Icerik/8538/uluslararasi-sozlesme-niteliginde-olmayan-anlasma-ile-yurt-disina-kisisel-veri-aktarimina-izin-verilmesi-hakkinda-duyuru
22. KVKK, Bağlayıcı Şirket Kuralları Başvurusu Hakkında Duyuru (21.05.2026):
    https://www.kvkk.gov.tr/Icerik/8757/baglayici-sirket-kurallari-basvurusu-hakkinda-duyuru
23. KVKK, Taahhütname Başvurusu Hakkında Duyuru (13.03.2025):
    https://www.kvkk.gov.tr/Icerik/8261/-Taahhutname-Basvurusu-Hakkinda-Duyuru
24. KVKK, Kamu Kurumlarında Yurt Dışı Menşeli Haberleşme Uygulamaları Kullanımına İlişkin Kamuoyu
    Duyurusu (29.01.2026):
    https://www.kvkk.gov.tr/Icerik/8607/kamu-kurumlarinda-yurt-disi-menseli-haberlesme-uygulamalari-kullanimina-iliskin-kamuoyu-duyurusu

Kurul kararları (özet veya duyuru):

25. 31.05.2019, 2019/157 (Gmail; görüş): https://www.kvkk.gov.tr/Icerik/5493/2019-157
26. 27.02.2020, 2020/173 (Amazon Turkey): https://www.kvkk.gov.tr/Icerik/6739/2020-173
27. 20.05.2020, 2020/404 (işveren): https://www.kvkk.gov.tr/Icerik/6913/2020-404
28. 22.07.2020, 2020/559 (108 sayılı Sözleşme; AB'deki bulut veri tabanı):
    https://www.kvkk.gov.tr/Icerik/6790/2020-559
29. 03.09.2021, 2021/891 (WhatsApp; kamuoyu duyurusu olarak yayımlandı):
    https://www.kvkk.gov.tr/Icerik/7045/WHATSAPP-UYGULAMASI-HAKKINDA-YURUTULEN-RESEN-INCELEMEYE-ILISKIN-KAMUOYU-DUYURUSU
30. 25.11.2021, 2021/1187 (yurt dışı sunucu iddiası için resen inceleme):
    https://www.kvkk.gov.tr/Icerik/7269/2021-1187
31. 10.03.2022, 2022/229 (e-ticaret, çerezlerle aktarım): https://www.kvkk.gov.tr/Icerik/7275/2022-229
32. 23.07.2019, 2019/225 (yurt dışında yerleşik tüzel kişilerin şube ve irtibat büroları):
    https://www.kvkk.gov.tr/Icerik/5545/2019-225
33. 16.07.2020, 2020/542 (yurt dışında yerleşik veri sorumluları için irtibat kişisi):
    https://www.kvkk.gov.tr/Icerik/6797/2020-542
34. 24.02.2022, 2022/172 (yurt dışında mukim veri sorumlusunun irtibat bürosu):
    https://www.kvkk.gov.tr/Icerik/7294/2022-172
35. 02.11.2021, 2021/1111 (gerçek kişi veri sorumlusu avukata 75.000 TL):
    https://www.kvkk.gov.tr/Icerik/7266/2021-1111
36. 06.01.2022, 2022/13 (yerel haber sitesi, 30.000 TL): https://www.kvkk.gov.tr/Icerik/7179/2022-13 —
    22.02.2024, 2024/275 (yerel basın organı, 40.179 TL): https://www.kvkk.gov.tr/Icerik/8862/2024-275
37. 06.03.2024, 2024/415 (ekonomik durum ölçütü): https://www.kvkk.gov.tr/Icerik/8857/2024-415
38. 28.03.2025, 2025/601 (Hong Kong'da kurulu veri sorumlusu; etki ilkesi):
    https://www.kvkk.gov.tr/Icerik/8873/2025-601 — 1/9/2024 sonrası diğer özetler aynı adres
    kalıbındadır: /Icerik/8866/2024-1523, /8867/2024-1718, /8868/2024-1898, /8869/2024-1899,
    /8886/2024-2158, /8870/2024-2196, /8871/2025-88, /8872/2025-536, /8874/2025-833,
    /8875/2025-881, /8887/2026-1183

AB kaynağı (Rehber'in dayandığı):

39. EDPB, Guidelines 05/2021 on the Interplay between the application of Article 3 and the
    provisions on international transfers as per Chapter V of the GDPR, Version 2.0 (14.02.2023):
    https://www.edpb.europa.eu/system/files/2023-02/edpb_guidelines_05-2021_interplay_between_the_application_of_art3-chapter_v_of_the_gdpr_v2_en_0.pdf

Resmî Gazete:

40. Resmî Gazete günlük fihristleri, 1–15 Kasım 2026 (kalıp:
    https://www.resmigazete.gov.tr/eskiler/2026/11/20261110.htm) ve 27.11.2025 fihristi
    (https://www.resmigazete.gov.tr/eskiler/2025/11/20251127.htm) — Vergi Usul Kanunu Genel Tebliği
    (Sıra No: 597), RG 10.11.2026, 33426 (yeniden değerleme oranıyla ilgili değil):
    https://www.resmigazete.gov.tr/eskiler/2026/11/20261110-6.htm
41. 2027 Yılı Cumhurbaşkanlığı Yıllık Programı, RG 27.10.2026, 33413 mükerrer (taranmış PDF; metin
    okunamadı): https://www.resmigazete.gov.tr/eskiler/2026/10/20261027M1-1.pdf

İkincil (yalnızca kaynak bulmak veya doğrulanmamış bilgi için; dayanak değil):

42. Forbes Türkiye, "2027 yılı yeniden değerleme oranı belli oldu" (03.11.2026; TÜİK verisine dayalı
    hesap, resmî ilan değil): https://www.forbes.com.tr/haberler/2027-yili-yeniden-degerleme-orani-belli-oldu
43. Gün + Partners, "Türkiye'de Kişisel Verilerin Korunması ve Gizlilik 2026" (yalnızca Faaliyet
    Raporu rakamlarına ulaşmak için): https://gun.av.tr/media/uirdjt3w/fikir-liderligi-kvkk-2026.pdf
44. TBMM, Sıra Sayısı 259 (2/3560, Bazı Kanunlarda Değişiklik Yapılmasına Dair Kanun Teklifi; 6698'e
    değinmediği görüldü):
    https://cdn.tbmm.gov.tr/KKBSPublicFile/D28/Y4/T2/DosyaKomisyonRaporunuVerdi/a25edce8-fb1b-44d2-876f-ac639732b44f.pdf
