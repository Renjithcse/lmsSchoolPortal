import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslation from './locales/en/translation.json';
import arTranslation from './locales/ar/translation.json';

const resources = {
    en: {
        translation: enTranslation,
    },
    ar: {
        translation: arTranslation,
    },
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'en',
        supportedLngs: ['en', 'ar'],
        defaultNS: 'translation',
        interpolation: {
            escapeValue: false,
        },
        detection: {
            order: ['localStorage', 'navigator', 'htmlTag'],
            caches: ['localStorage'],
        },
    });

const updateHtmlDirection = (lng) => {
    if (typeof document === 'undefined') return;
    const direction = lng === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dir = direction;
    document.documentElement.lang = lng;
};

updateHtmlDirection(i18n.language || 'en');
i18n.on('languageChanged', updateHtmlDirection);

export default i18n;
