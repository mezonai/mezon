type IdleCallback = (deadline: IdleDeadline) => void;

const win = window as Window & {
	requestIdleCallback?: (cb: IdleCallback) => number;
	cancelIdleCallback?: (id: number) => void;
	electron?: { on?: (event: string, cb: () => void) => void };
};

console.log('polyfills initialized');


win.requestIdleCallback =
	win.requestIdleCallback ||
	function (cb: IdleCallback) {
		const start = Date.now();
		return window.setTimeout(() => {
			cb({
				didTimeout: false,
				timeRemaining: () => Math.max(0, 50 - (Date.now() - start))
			});
		}, 1);
	};

win.cancelIdleCallback =
	win.cancelIdleCallback ||
	function (id: number) {
		clearTimeout(id);
	};

window.addEventListener('error', (e) => {
	if (/Loading chunk [\d]+ failed/.test(e.message)) {
		window.location.reload();
	}
});

const path = window.location.pathname;
win.electron?.on?.('reload-app', () => {
	const authData = localStorage.getItem('persist:auth');
	const appData = localStorage.getItem('persist:apps');
	const clanData = localStorage.getItem('persist:clans');
	const categoriesData = localStorage.getItem('persist:categories');
	const rememberChannelData = localStorage.getItem('remember_channel');
	const mezonSession = localStorage.getItem('mezon_session');
	const mezonRefreshSession = localStorage.getItem('mezon_refresh_session');
	const hideNotificationContent = localStorage.getItem('hideNotificationContent');
	const themeName = localStorage.getItem('current-theme');
	const walletData = localStorage.getItem('persist:wallet');
	const languageData = localStorage.getItem('i18nextLng');
	const activityData = localStorage.getItem('persist:activitiesapi');
	const directData = localStorage.getItem('persist:direct');
	localStorage.clear();

	if (mezonSession) localStorage.setItem('mezon_session', mezonSession);
	if (mezonRefreshSession) localStorage.setItem('mezon_refresh_session', mezonRefreshSession);
	if (authData) localStorage.setItem('persist:auth', authData);
	if (appData) localStorage.setItem('persist:apps', appData);
	if (clanData) localStorage.setItem('persist:clans', clanData);
	if (hideNotificationContent) localStorage.setItem('hideNotificationContent', hideNotificationContent);
	if (themeName) localStorage.setItem('current-theme', themeName);
	if (categoriesData) localStorage.setItem('persist:categories', categoriesData);
	if (rememberChannelData) localStorage.setItem('remember_channel', rememberChannelData);
	if (walletData) localStorage.setItem('persist:wallet', walletData);
	if (languageData) localStorage.setItem('i18nextLng', languageData);
	if (activityData) localStorage.setItem('persist:activitiesapi', activityData);
	if (directData) localStorage.setItem('persist:direct', directData);

	const isCrashScreen = document.getElementById('error-crash');
	if (isCrashScreen) {
		window.location.replace(path);
		return;
	}
	window.location.reload();
});
