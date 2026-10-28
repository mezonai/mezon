import { isCloudflareCdnUrl, isMezonCdnUrl } from './urlSanitization';

export const CDN_SIGNATURE_TTL_MS = Number(process.env.NX_CDN_SIGNATURE_TTL_MS) || 3 * 60 * 60 * 1000;

const CHANNEL_FOLDER_RE = /\/([0-9a-fA-F]{16})\/[^/]+$/;

const PUBLIC_CDN_FOLDERS = new Set(['stickers', 'emojis', 'sounds']);

function readCdnChannelFolder(url?: string): string | null | undefined {
	if (!url || url.includes('?') || !isMezonCdnUrl(url) || isCloudflareCdnUrl(url)) return undefined;

	let pathname: string;
	try {
		pathname = new URL(url).pathname;
	} catch {
		return undefined;
	}

	if (PUBLIC_CDN_FOLDERS.has(pathname.split('/')[1]?.toLowerCase())) return '0';
	const hex = CHANNEL_FOLDER_RE.exec(pathname)?.[1];
	return hex ? BigInt(`0x${hex}`).toString() : null;
}

export function getCdnSignatureChannelId(url?: string, fallbackChannelId?: string): string | undefined {
	const folderChannelId = readCdnChannelFolder(url);
	if (folderChannelId === undefined || folderChannelId === '0') return undefined;
	if (folderChannelId !== null) return folderChannelId;
	return fallbackChannelId && fallbackChannelId !== '0' ? fallbackChannelId : undefined;
}

export function needsCdnSignature(url?: string, fallbackChannelId?: string): url is string {
	return getCdnSignatureChannelId(url, fallbackChannelId) !== undefined;
}

export function parseSignedCdnMediaSrc(src?: string, fallbackChannelId?: string): { url: string; channelId: string; signature: string } | undefined {
	if (!src) return undefined;

	let source = src;
	const plainIndex = source.indexOf('/plain/');
	if (plainIndex !== -1) {
		try {
			source = decodeURIComponent(source.slice(plainIndex + '/plain/'.length).replace(/@\w+$/, ''));
		} catch {
			return undefined;
		}
	}

	const queryIndex = source.indexOf('?');
	if (queryIndex === -1) return undefined;
	const url = source.slice(0, queryIndex);
	const signature = source.slice(queryIndex + 1);
	const channelId = getCdnSignatureChannelId(url, fallbackChannelId);
	return signature && channelId ? { url, channelId, signature } : undefined;
}

export function appendCdnSignature(url: string, signature?: string): string;
export function appendCdnSignature(url: string | undefined, signature?: string): string | undefined;
export function appendCdnSignature(url: string | undefined, signature?: string): string | undefined {
	const folderChannelId = readCdnChannelFolder(url);
	if (!signature || folderChannelId === undefined || folderChannelId === '0') {
		return url;
	}

	const query = signature.replace(/^[?&]+/, '');
	return query ? `${url}?${query}` : url;
}
