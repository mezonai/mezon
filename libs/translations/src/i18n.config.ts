import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import enTranslations from './languages/en/index';
import esTranslations from './languages/es/index';
import itTranslations from './languages/it/index';
import ruTranslations from './languages/ru/index';
import viTranslations from './languages/vi/index';

export const defaultNS = 'common';

const timezoneDetector = {
	name: 'timezone',
	lookup() {
		const storedLang = localStorage.getItem('i18nextLng');

		if (storedLang && (storedLang === 'vi' || storedLang === 'en' || storedLang === 'ru' || storedLang === 'es' || storedLang === 'it')) {
			return undefined;
		}

		const browserLanguage = navigator.language || (navigator as Navigator & { userLanguage?: string }).userLanguage;

		if (browserLanguage) {
			const languageCode = browserLanguage.toLowerCase();
			if (languageCode.startsWith('vi')) {
				return 'vi';
			}
			if (languageCode.startsWith('en')) {
				return 'en';
			}
			if (languageCode.startsWith('ru')) {
				return 'ru';
			}
			if (languageCode.startsWith('es')) {
				return 'es';
			}
			if (languageCode.startsWith('it')) {
				return 'it';
			}
		}

		return undefined;
	},
	cacheUserLanguage(lng: string) {
		if (lng && (lng === 'vi' || lng === 'en' || lng === 'ru' || lng === 'es' || lng === 'it')) {
			localStorage.setItem('i18nextLng', lng);
		}
	}
};

const languageDetector = new LanguageDetector();
languageDetector.addDetector(timezoneDetector);

i18n.use(languageDetector)
	.use(initReactI18next)
	.init({
		defaultNS,
		fallbackLng: 'en',
		supportedLngs: ['en', 'vi', 'ru', 'es', 'it'],
		resources: {
			en: enTranslations,
			vi: viTranslations,
			ru: ruTranslations,
			es: esTranslations,
			it: itTranslations
		},
		detection: {
			order: ['timezone', 'localStorage', 'navigator', 'htmlTag'],
			lookupLocalStorage: 'i18nextLng',
			caches: ['localStorage']
		},
		load: 'currentOnly',
		debug: false,
		interpolation: {
			escapeValue: false
		},
		compatibilityJSON: 'v3',
		react: {
			useSuspense: false
		}
	});

export default i18n;
