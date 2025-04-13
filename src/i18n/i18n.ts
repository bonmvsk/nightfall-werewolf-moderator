
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import translationEN from './locales/en.json';
import translationTH from './locales/th.json';

// the translations
const resources = {
  en: {
    translation: translationEN
  },
  th: {
    translation: translationTH
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'th', // Default language is Thai
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // not needed for react
    }
  });

export default i18n;
