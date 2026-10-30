import { contactEmail } from './contact';

/**
 * The privacy notice (aydınlatma metni), its short first layer and the terms
 * of use, as documents rather than UI strings (so not in i18n/tr.ts):
 * Turkish only, written by the Operator, and accepted as one versioned pair
 * on the first sign-in (account.acceptTerms). Written for scholars, not
 * engineers: the short layer names no providers, the full text names them
 * because KVKK asks for every recipient.
 *
 * PLACEHOLDERS. The Operator replaces the text before the beta opens; the
 * sections stay, since KVKK m.10 and the Tebliğ ask for each of them
 * (docs/research/kvkk-obligations.md). Change `legalVersion` with every
 * change of wording, so an Account records which text it accepted.
 */
export const legalVersion = '2026-10-30-taslak';

export type LegalSection = { heading: string; paragraphs: string[] };

/** The first layer of the notice, on the first-sign-in screen; the full text is one tap away. */
export const shortNotice = [
  'Homelibra, hesabını açmak ve sana hizmet vermek için e-posta adresini ve kütüphanene yazdıklarını işler. Bunun için rızan gerekmez; dayanağı aramızdaki sözleşmedir.',
  'Verilerin Türkiye dışında, Almanya’daki sunucularda durur. Giriş e-postalarını göndermek ve uygulamayı çalışır tutmak için yurt dışındaki birkaç hizmet sağlayıcıyla çalışırız; hangileri olduğu tam metinde yazılı.',
  'Kütüphanene yalnızca sen destek istediğinde bakarız. İçeriğini analiz etmeyiz, yapay zekâ eğitiminde ya da pazarlamada kullanmayız. Kütüphaneni her zaman ücretsiz dışa aktarabilir, hesabını silebilirsin.',
];

const placeholder = '[Yer tutucu: asıl metni İşletici yazacak.]';

export const privacyNotice: LegalSection[] = [
  {
    heading: 'Veri sorumlusu',
    paragraphs: [placeholder, `Homelibra’yı işleten kişi: [ad ya da unvan, adres]. İletişim: ${contactEmail}.`],
  },
  {
    heading: 'İşlenen veriler',
    paragraphs: [
      'Hesap: e-posta adresin ve ilk girişte kullanım koşullarını kabul ettiğin an.',
      'Oturum: giriş yaptığın cihazın tarayıcı ya da uygulama bilgisi ve IP adresi.',
      'Kütüphane: kaynakların, notların, etiketlerin ve dosyaların.',
      'Hata raporları: uygulama bir hatayla karşılaştığında o anki teknik bilgiler.',
    ],
  },
  {
    heading: 'Amaçlar ve hukuki sebepler',
    paragraphs: [
      'Hesabını ve kütüphaneni tutmak, sana giriş kodu ve hesap bildirimleri göndermek: sözleşmenin kurulması ve ifası (KVKK m.5/2-c).',
      'Hizmetin güvenliği ve hataların giderilmesi: meşru menfaat (KVKK m.5/2-f).',
      'Pazarlama e-postası göndermiyoruz ve üçüncü taraf analitik kullanmıyoruz; bu yüzden senden açık rıza istemiyoruz.',
    ],
  },
  {
    heading: 'Toplama yöntemi',
    paragraphs: [
      'Veriler, uygulamayı ve web sitesini kullanırken elektronik olarak senden toplanır. Google ile girersen Google’ın doğruladığı e-posta adresini alırız; Google hesabın ise Google ile senin aranda kalır.',
    ],
  },
  {
    heading: 'Aktarılan alıcılar ve yurt dışında saklama',
    paragraphs: [
      'Hesabın ve kütüphanen, yedekleriyle birlikte Almanya’daki sunucularda durur. Sunucuları sağlayan firma: Hetzner Online GmbH (Almanya).',
      'Giriş kodların ve hesabınla ilgili e-postalar bir e-posta gönderim hizmetiyle gider; bu hizmet e-posta adresini görür. Firma: Resend (ABD).',
      'Uygulama bir hatayla karşılaşırsa, düzeltebilmemiz için o anki teknik bilgiler bir hata kayıt hizmetine gider. Firma: Sentry (Functional Software, Inc.; kayıtlar Almanya’da tutulur).',
      'Uygulama güncellemeleri bir güncelleme hizmetinden iner; bu hizmet cihazının bilgisini ve IP adresini görür. Firma: Expo (650 Industries, Inc., ABD).',
      'Bu firmaların hepsi Türkiye dışındadır; verilerin Almanya’da ve ABD’de saklanır ve işlenir. ' + placeholder,
    ],
  },
  {
    heading: 'Kütüphanene erişim',
    paragraphs: [
      'İşletici kütüphanene yalnızca sen destek istediğinde ve yalnızca o istek için bakar. İstisnalar: yasal bir yükümlülük ve bir güvenlik olayı.',
      'Kütüphanenin içeriği analiz edilmez, yapay zekâ eğitiminde ya da pazarlamada kullanılmaz.',
    ],
  },
  {
    heading: 'Saklama süresi ve silme',
    paragraphs: [
      'Veriler hesabın açık olduğu sürece saklanır. Hesabını sildiğinde verilerin yedekler dahil en geç 30 gün içinde silinir.',
    ],
  },
  {
    heading: 'Hakların ve başvuru',
    paragraphs: [
      'KVKK m.11 uyarınca verilerinin işlenip işlenmediğini öğrenme, bilgi isteme, düzeltilmesini ya da silinmesini isteme ve itiraz etme hakların vardır.',
      `Başvurunu kayıtlı e-posta adresinden ${contactEmail} adresine yazabilirsin; en geç 30 gün içinde ücretsiz yanıtlarız.`,
    ],
  },
  {
    heading: 'Çerezler',
    paragraphs: ['Web sürümü yalnızca oturumunu açık tutan zorunlu çerezi kullanır; reklam ya da takip çerezi yoktur.'],
  },
];

export const termsOfUse: LegalSection[] = [
  { heading: 'Hizmet', paragraphs: [placeholder, 'Homelibra davetle açılan, ücretsiz bir kapalı betadır.'] },
  {
    heading: 'Kütüphanen senindir',
    paragraphs: [
      'Kütüphanene yazdıkların sana aittir. Kütüphaneni her zaman, ücretsiz ve eksiksiz dışa aktarabilirsin; bu hiçbir zaman ücretli bir özellik olmaz.',
    ],
  },
  {
    heading: 'Hizmetin değişmesi ya da sona ermesi',
    paragraphs: [
      'Beta biterse, ücretli plana geçilirse ya da Homelibra kapanırsa en az 30 gün önceden e-postayla haber veririz, böylece dışa aktarmaya vaktin olur.',
    ],
  },
  {
    heading: 'Kullanım',
    paragraphs: [
      'Hesabını yalnızca sen kullanırsın. Homelibra’yı hukuka aykırı içerik saklamak ya da hizmeti bozmak için kullanamazsın.',
    ],
  },
  {
    heading: 'Hesabı silme',
    paragraphs: ['Hesabını istediğin an Ayarlar → Hesap ve gizlilik bölümünden silebilirsin.'],
  },
  {
    heading: 'İletişim',
    paragraphs: [`Sorular için: ${contactEmail}.`],
  },
];
