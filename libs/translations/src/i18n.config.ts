import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import resourcesToBackend from 'i18next-resources-to-backend';
import { initReactI18next } from 'react-i18next';

export const defaultNS = 'common';

const SUPPORTED_LNGS = ['en', 'vi', 'ru', 'es', 'tt', 'pt', 'it', 'jpn', 'kr', 'swe'] as const;
type SupportedLng = (typeof SUPPORTED_LNGS)[number];
const isSupportedLng = (value: string): value is SupportedLng => (SUPPORTED_LNGS as readonly string[]).includes(value);

const timezoneDetector = {
	name: 'timezone',
	lookup() {
		const storedLang = localStorage.getItem('i18nextLng');
		if (storedLang && isSupportedLng(storedLang)) {
			return undefined;
		}

		const browserLanguage = navigator.language || (navigator as Navigator & { userLanguage?: string }).userLanguage;
		if (!browserLanguage) return undefined;

		const prefix = browserLanguage.toLowerCase().slice(0, 3);
		const match = SUPPORTED_LNGS.find((lng) => prefix.startsWith(lng));
		return match;
	},
	cacheUserLanguage(lng: string) {
		if (isSupportedLng(lng)) {
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
			case 'kr':
				return (await import('./languages/kr/index')).default as LanguageBundle;
			case 'swe':
				return (await import('./languages/swe/index')).default as LanguageBundle;
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
		fallbackLng: 'en',
		supportedLngs: SUPPORTED_LNGS as unknown as string[],
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
