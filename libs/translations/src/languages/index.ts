export const loadLanguage = async (lang: 'en' | 'vi') => {
	const module = await import(`./${lang}/index`);
	return module.default;
};
