import { EBacktickType } from '../types';

export function isYouTubeLink(url: string): boolean {
	return /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|e\/|shorts\/)|youtu\.be\/)/.test(url);
}

export function getLinkType(url: string): EBacktickType {
	if (isYouTubeLink(url)) return EBacktickType.LINKYOUTUBE;
	if (isFacebookLink(url)) return EBacktickType.LINKFACEBOOK;
	if (isTikTokLink(url)) return EBacktickType.LINKTIKTOK;
	return EBacktickType.LINK;
}

export function getYouTubeEmbedUrl(url: string): string {
	// check xss
	const match = url.match(/(?:youtube\.com\/(?:watch\?v=|v\/|e\/|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
	return match ? `https://www.youtube.com/embed/${match[1]}` : '';
}

export function getFacebookEmbedUrl(url: string): string {
	const match = url.match(/(?:facebook\.com\/(?:reel\/|watch\?v=|[\w.]+\/videos\/(?:[\w.]+\/)?))([\w-]+)/);
	const reelUrl = `https://www.facebook.com/reel/${match?.[1]}`;
	return match ? `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(reelUrl)}` : '';
}

export function getFacebookEmbedSize(isSearchMessage?: boolean) {
	if (isSearchMessage) {
		return { width: `${267 * 0.65}px`, height: `${476 * 0.65}px` };
	}
	return { width: '267px', height: '476px' };
}

export function isFacebookLink(url: string): boolean {
	return /(?:facebook\.com\/(?:reel\/|watch\?v=|[\w.]+\/videos\/(?:[\w.]+\/)?))([\w-]+)/.test(url);
}

export function isYouTubeShorts(url: string) {
	return /youtube\.com\/shorts\//.test(url);
}

export function getYouTubeEmbedSize(url: string, isSearchMessage?: boolean) {
	if (isYouTubeShorts(url)) {
		return { width: '169px', height: '300px' };
	}
	if (isSearchMessage) {
		return { width: `${400 * 0.65}px`, height: `${225 * 0.65}px` };
	}
	return { width: '400px', height: '225px' };
}

export function isTikTokLink(url: string): boolean {
	return /(?:tiktok\.com\/@[^/]+\/video\/\d+|vm\.tiktok\.com\/[a-zA-Z0-9]+|tiktok\.com\/t\/[a-zA-Z0-9]+)/.test(url);
}

export function getTikTokEmbedUrl(url: string): string {
	const match = url.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/);
	return match ? `https://www.tiktok.com/player/v1/${match[1]}` : '';
}

export function getTikTokEmbedSize() {
	return { width: '253px', height: '450px' };
}
