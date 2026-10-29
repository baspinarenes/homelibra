import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { tr } from './tr';

// Only Turkish exists for now. The device language is still passed in, so a
// second language later is a new resource, not a rewrite; unsupported
// languages fall back to Turkish.
void i18n.use(initReactI18next).init({
  resources: { tr: { translation: tr } },
  supportedLngs: ['tr'],
  lng: getLocales()[0]?.languageCode ?? 'tr',
  fallbackLng: 'tr',
  interpolation: { escapeValue: false },
});

export default i18n;
