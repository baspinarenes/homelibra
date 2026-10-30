// Turkish is the source and fallback language. Every UI string lives here;
// keys are typed through i18next.d.ts, so a missing key fails typechecking.
export const tr = {
  tabs: {
    home: 'Ana sayfa',
    sources: 'Kaynaklar',
    collections: 'Dosyalar',
    search: 'Ara',
    settings: 'Ayarlar',
  },
  collections: {
    viewLabel: 'Görünüm',
    collections: 'Dosyalar',
    tags: 'Etiketler',
  },
  settings: {
    appearance: 'Görünüm',
    themeLabel: 'Tema',
    themeSystem: 'Sistem',
    themeLight: 'Açık',
    themeDark: 'Koyu',
    account: 'Hesap',
  },
  signIn: {
    title: 'Homelibra',
    lead: 'E-posta adresini yaz; sana 6 haneli bir giriş kodu gönderelim.',
    emailLabel: 'E-posta',
    emailPlaceholder: 'ad@ornek.edu.tr',
    durableAddressHint: 'Kurumun değişse de kapanmayacak bir adres öneririz.',
    sendCode: 'Kod gönder',
    codeSentTo: '{{email}} adresine bir kod gönderdik.',
    codeLabel: 'Giriş kodu',
    submit: 'Giriş yap',
    changeEmail: 'Başka bir adres kullan',
    resend: 'Kodu yeniden gönder',
    or: 'ya da',
    google: 'Google ile devam et',
    inviteOnly: 'Homelibra şu an davetle açık.',
    inviteOnlyContact: 'Davet için bize yazabilirsin:',
    errors: {
      sendFailed: 'Kod gönderilemedi. Bağlantını kontrol edip yeniden dene.',
      invalidCode: 'Kod yanlış ya da süresi dolmuş.',
      googleFailed: 'Google ile giriş yapılamadı. Yeniden dene.',
    },
  },
  home: {
    emptyTitle: 'Kütüphanen boş',
    emptyLead: 'Okuduğun ilk kaynağı ekleyerek başla.',
    addFirstSource: 'İlk kaynağını ekle',
    loadFailed: 'Kütüphane yüklenemedi.',
  },
  placeholder: {
    comingSoon: 'Bu bölüm yakında.',
  },
  account: {
    signOut: 'Çıkış yap',
  },
} as const;
