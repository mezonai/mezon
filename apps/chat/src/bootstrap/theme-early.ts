try {
	const raw = localStorage.getItem('persist:apps');
	if (raw) {
		const appData = JSON.parse(raw);
		if (appData && appData.theme === 'dark') {
			document.documentElement.classList.add('dark');
		}
	}
} catch {
	// Ignore corrupted persist:apps — fall back to default theme so the app still boots.
}
