import { useEffect, useState } from 'react';

export enum Platform {
	ANDROID = 'Android',
	IOS = 'iOS',
	WINDOWS_PHONE = 'Windows Phone',
	WINDOWS = 'Windows',
	MACOS = 'MacOS',
	LINUX = 'Linux',
	UNKNOWN = 'Unknown'
}

export const getPlatform = (): Platform => {
	const userAgent = navigator?.userAgent?.toLowerCase();

	if (/android/.test(userAgent)) {
		return Platform.ANDROID;
	}
	if (/iphone|ipad|ipod/.test(userAgent)) {
		return Platform.IOS;
	}
	if (/windows phone/.test(userAgent)) {
		return Platform.WINDOWS_PHONE;
	}
	if (/win/.test(userAgent)) {
		return Platform.WINDOWS;
	}
	if (/mac/.test(userAgent)) {
		return Platform.MACOS;
	}
	if (/linux/.test(userAgent)) {
		return Platform.LINUX;
	}

	return Platform.UNKNOWN;
};

const usePlatform = (): Platform => {
	const [platform, setPlatform] = useState<Platform>(Platform.UNKNOWN);

	useEffect(() => {
		setPlatform(getPlatform());
	}, []);

	return platform;
};

export { usePlatform };
