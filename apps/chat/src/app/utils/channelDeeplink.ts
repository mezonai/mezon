import { isMobileBrowser, openAppDeeplink } from './deeplink';

export const getMobileChannelPath = (pathname: string): string | null => {
	if (!isMobileBrowser() || !/^\/chat\/clans\/[1-9][0-9]*\/channels\/[1-9][0-9]*\/?$/.test(pathname)) {
		return null;
	}
	return pathname.replace(/\/$/, '');
};

// Give the native app time to open before continuing the existing web login flow.
export const attemptChannelAppBeforeLogin = (path: string, continueLogin: () => void): (() => void) => {
	let attempted = false;
	let disposed = false;
	let timer: ReturnType<typeof setTimeout>;
	const resume = () => {
		clearTimeout(timer);
		if (disposed || document.visibilityState === 'hidden') return;
		timer = setTimeout(() => {
			if (!attempted) {
				attempted = true;
				openAppDeeplink(path);
			}
			timer = setTimeout(() => {
				if (!disposed && document.visibilityState !== 'hidden') continueLogin();
			}, 1500);
		}, 0);
	};
	const pause = () => clearTimeout(timer);
	document.addEventListener('visibilitychange', resume);
	window.addEventListener('pagehide', pause);
	window.addEventListener('pageshow', resume);
	resume();
	return () => {
		disposed = true;
		pause();
		document.removeEventListener('visibilitychange', resume);
		window.removeEventListener('pagehide', pause);
		window.removeEventListener('pageshow', resume);
	};
};
