import { EBacktickType } from '../types';

export function isYouTubeLink(url: string): boolean {
	return /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|e\/|shorts\/)|youtu\.be\/)/.test(url);
}

export function getLinkType(url: string): EBacktickType {
	if (isYouTubeLink(url)) return EBacktickType.LINKYOUTUBE;
	if (isTikTokLink(url)) return EBacktickType.LINKTIKTOK;
	return EBacktickType.LINK;
}

// A YouTube id is always 11 chars of [A-Za-z0-9_-]; anchoring on that is what keeps
// a hostile `url` from being pasted straight into an iframe src.
const YOUTUBE_VIDEO_ID_REGEX = /(?:youtube\.com\/(?:watch\?(?:[^#]*&)?v=|v\/|e\/|embed\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

export function extractYouTubeVideoId(url: string): string {
	return url.match(YOUTUBE_VIDEO_ID_REGEX)?.[1] ?? '';
}

const YOUTUBE_HOSTS = ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtu.be'];

/**
 * The video a link points at, or '' when the link is not a YouTube URL.
 *
 * The host check matters where the link comes from outside: `extractYouTubeVideoId`
 * matches anywhere in the string, so `https://elsewhere.example/?next=youtu.be/<id>`
 * would otherwise read as a video.
 */
export function youtubeVideoIdFromLink(url: string): string {
	try {
		return YOUTUBE_HOSTS.includes(new URL(url).hostname.toLowerCase()) ? extractYouTubeVideoId(url) : '';
	} catch {
		return '';
	}
}

/** `?t=90`, `?t=1m30s` and `?start=90` all mean "start 90 seconds in". */
export function extractYouTubeStartSeconds(url: string): number {
	const raw = url.match(/[?&](?:t|start)=([0-9hms]+)/i)?.[1];
	if (!raw) return 0;
	if (/^\d+$/.test(raw)) return Number(raw);
	const [, h = '0', m = '0', s = '0'] = raw.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/) ?? [];
	return Number(h) * 3600 + Number(m) * 60 + Number(s);
}

export function getYouTubeEmbedUrl(url: string): string {
	// check xss
	const videoId = extractYouTubeVideoId(url);
	return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
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
