const MOBILE_APP_SCHEME = 'mezon.ai';
const DESKTOP_APP_SCHEME = 'mezonapp';

export const isMobileBrowser = (): boolean => {
	if (typeof navigator === 'undefined') {
		return false;
	}
	const userAgent = navigator.userAgent || '';
	const isAndroid = /android/i.test(userAgent);
	const isIOS = /iPad|iPhone|iPod/.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
	return isAndroid || isIOS;
};

export const buildAppDeeplink = (path: string): string => {
	const scheme = isMobileBrowser() ? MOBILE_APP_SCHEME : DESKTOP_APP_SCHEME;
	return `${scheme}://${path.replace(/^\/+/, '')}`;
};

export const openAppDeeplink = (path: string): void => {
	try {
		window.location.href = buildAppDeeplink(path);
	} catch (e) {
		console.error('log  => openAppDeeplink error', e);
	}
};
