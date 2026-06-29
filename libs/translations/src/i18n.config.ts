import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import resourcesToBackend from 'i18next-resources-to-backend';
import { initReactI18next } from 'react-i18next';
import blrTranslations from './languages/blr/index';
import deTranslations from './languages/de/index';
import enTranslations from './languages/en/index';
import esTranslations from './languages/es/index';
import frTranslations from './languages/fr/index';
import itTranslations from './languages/it/index';
import jpnTranslations from './languages/jpn/index';
import krTranslations from './languages/kr/index';
import nlTranslations from './languages/nl/index';
import plTranslations from './languages/pl/index';
import ptTranslations from './languages/pt/index';
import ruTranslations from './languages/ru/index';
import sweTranslations from './languages/swe/index';
import ttTranslations from './languages/tt/index';
import ukrTranslations from './languages/ukr/index';
import viTranslations from './languages/vi/index';

export const defaultNS = 'common';
const defaultNamespaces = ['common', 'friends'];

export const SUPPORTED_LANGUAGES = ['en', 'vi', 'ru', 'ukr', 'es', 'tt', 'de', 'it', 'pt', 'jpn', 'pl', 'kr', 'swe', 'blr', 'fr', 'nl'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const isStoredLanguage = (value: string | null): value is SupportedLanguage =>
	value !== null && (SUPPORTED_LANGUAGES as readonly string[]).includes(value);

const timezoneDetector = {
	name: 'timezone',
	lookup() {
		const storedLang = localStorage.getItem('i18nextLng');

		if (isStoredLanguage(storedLang)) {
			return undefined;
		}

		const browserLanguage = navigator.language || (navigator as Navigator & { userLanguage?: string }).userLanguage;
		if (!browserLanguage) return undefined;

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
		if (languageCode.startsWith('tt')) {
			return 'tt';
		}
		if (languageCode.startsWith('pt')) {
			return 'pt';
		}
		if (languageCode.startsWith('it')) {
			return 'it';
		}
		if (languageCode.startsWith('ja')) {
			return 'jpn';
		}
		if (languageCode.startsWith('pl')) {
			return 'pl';
		}
		if (languageCode.startsWith('ko')) {
			return 'kr';
		}
		if (languageCode.startsWith('sv')) {
			return 'swe';
		}
		if (languageCode.startsWith('de')) {
			return 'de';
		}
		if (languageCode.startsWith('fr')) {
			return 'fr';
		}
		if (languageCode.startsWith('nl')) {
			return 'nl';
		}
		if (languageCode.startsWith('uk')) {
			return 'ukr';
		}
		if (languageCode.startsWith('be')) {
			return 'blr';
		}

		return undefined;
	},
	cacheUserLanguage(lng: string) {
		if (isStoredLanguage(lng)) {
			localStorage.setItem('i18nextLng', lng);
		}
	}
};

const languageDetector = new LanguageDetector();
languageDetector.addDetector(timezoneDetector);

type NamespaceBundle = Record<string, unknown>;
type LanguageBundle = Record<string, NamespaceBundle>;
const bundleCache = new Map<string, Promise<LanguageBundle>>();

const loadLanguageBundle = (language: string): Promise<LanguageBundle> => {
	let cached = bundleCache.get(language);
	if (cached) return cached;
	cached = (async () => {
		switch (language) {
			case 'en':
				return (await import('./languages/en/index')).default as LanguageBundle;
			case 'vi':
				return (await import('./languages/vi/index')).default as LanguageBundle;
			case 'ru':
				return (await import('./languages/ru/index')).default as LanguageBundle;
			case 'ukr':
				return (await import('./languages/ukr/index')).default as LanguageBundle;
			case 'es':
				return (await import('./languages/es/index')).default as LanguageBundle;
			case 'tt':
				return (await import('./languages/tt/index')).default as LanguageBundle;
			case 'pt':
				return (await import('./languages/pt/index')).default as LanguageBundle;
			case 'it':
				return (await import('./languages/it/index')).default as LanguageBundle;
			case 'jpn':
				return (await import('./languages/jpn/index')).default as LanguageBundle;
			case 'pl':
				return (await import('./languages/pl/index')).default as LanguageBundle;
			case 'de':
				return (await import('./languages/de/index')).default as LanguageBundle;
			case 'fr':
				return (await import('./languages/fr/index')).default as LanguageBundle;
			case 'nl':
				return (await import('./languages/nl/index')).default as LanguageBundle;
			case 'kr':
				return (await import('./languages/kr/index')).default as LanguageBundle;
			case 'swe':
				return (await import('./languages/swe/index')).default as LanguageBundle;
			case 'blr':
				return (await import('./languages/blr/index')).default as LanguageBundle;
			default:
				return {} as LanguageBundle;
		}
	})();
	bundleCache.set(language, cached);
	return cached;
};

i18n.use(languageDetector)
	.use(initReactI18next)
	.use(
		resourcesToBackend(async (language: string, namespace: string) => {
			const bundle = await loadLanguageBundle(language);
			return bundle[namespace] ?? {};
		})
	)
	.init({
		defaultNS,
		ns: defaultNamespaces,
		fallbackLng: 'en',
		supportedLngs: [...SUPPORTED_LANGUAGES],
		resources: {
			en: enTranslations,
			vi: viTranslations,
			ru: ruTranslations,
			ukr: ukrTranslations,
			es: esTranslations,
			tt: ttTranslations,
			de: deTranslations,
			pt: ptTranslations,
			it: itTranslations,
			jpn: jpnTranslations,
			pl: plTranslations,
			kr: krTranslations,
			swe: sweTranslations,
			blr: blrTranslations,
			fr: frTranslations,
			nl: nlTranslations
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
		},
		partialBundledLanguages: true
	});

export default i18n;
