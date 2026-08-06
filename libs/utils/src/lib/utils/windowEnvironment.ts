export function getPlatform(): any {
	const { userAgent, platform } = window.navigator;

	const iosPlatforms = ['iPhone', 'iPad', 'iPod'];
	if (iosPlatforms.indexOf(platform) !== -1 || (platform === 'MacIntel' && 'maxTouchPoints' in navigator && navigator.maxTouchPoints > 2))
		return 'iOS';

	const macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'];
	if (macosPlatforms.indexOf(platform) !== -1) return 'macOS';

	const windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'];
	if (windowsPlatforms.indexOf(platform) !== -1) return 'Windows';

	if (/Android/.test(userAgent)) return 'Android';

	if (/Linux/.test(platform)) return 'Linux';

	return undefined;
}

export const PLATFORM_ENV = getPlatform();
export const IS_MAC_OS = PLATFORM_ENV === 'macOS';
export const IS_WINDOWS = PLATFORM_ENV === 'Windows';
export const IS_LINUX = PLATFORM_ENV === 'Linux';
export const IS_IOS = PLATFORM_ENV === 'iOS';
export const IS_ANDROID = PLATFORM_ENV === 'Android';
export const IS_MOBILE = IS_IOS || IS_ANDROID;
export const IS_SAFARI = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
export const IS_MULTITAB_SUPPORTED = true;
export const IS_TOUCH_ENV = typeof window !== 'undefined' ? window.matchMedia('(pointer: coarse)').matches : false;

export const IS_SERVICE_WORKER_SUPPORTED = 'serviceWorker' in navigator;
const chromeVersion = navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./)?.[2];
const hasBrokenServiceWorkerStreaming = chromeVersion && Number(chromeVersion) >= 132; // TODO: Update constraint when bug is fixed
export const IS_OPFS_SUPPORTED = Boolean(navigator.storage?.getDirectory);
export const IS_OPUS_SUPPORTED = typeof window !== 'undefined' ? Boolean(new Audio().canPlayType('audio/ogg; codecs=opus')) : false;
export const IS_PROGRESSIVE_SUPPORTED = IS_SERVICE_WORKER_SUPPORTED && !hasBrokenServiceWorkerStreaming;

export const MAX_BUFFER_SIZE = (IS_MOBILE ? 512 : 2000) * 1024 ** 2; // 512 OR 2000 MB
