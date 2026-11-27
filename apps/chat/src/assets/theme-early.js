try {
	let theme = localStorage.getItem('current-theme');
	if (!theme) {
		const appData = JSON.parse(localStorage.getItem('persist:apps') || '{}');
		// redux-persist serializes each field separately inside persist:apps.
		theme = appData?.themeApp ? JSON.parse(appData.themeApp) : appData?.theme;
	}
	if (typeof theme === 'string') {
		// Keep light appearances aligned with ThemeManager.isLightTheme.
		document.documentElement.classList.toggle('dark', !['light', 'sunrise'].includes(theme));
	}
} catch {
	// Ignore corrupted persist:apps — fall back to default theme so the app still boots.
}
