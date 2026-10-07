import { isMezonCdnUrl } from './urlSanitization';

export const CDN_SIGNATURE_TTL_MS = 5 * 60 * 60 * 1000;
const CDN_SIGNATURE_REFRESH_MARGIN_MS = 5 * 60 * 1000;

export function getCdnSignatureTtlMs(signature: string, now = Date.now()): number {
	const expiresIn = Number(/^(\d+)-/.exec(signature)?.[1]) * 1000 - now;
	const lifetime = expiresIn > 2 * CDN_SIGNATURE_REFRESH_MARGIN_MS ? Math.min(expiresIn, CDN_SIGNATURE_TTL_MS) : CDN_SIGNATURE_TTL_MS;
	return lifetime - CDN_SIGNATURE_REFRESH_MARGIN_MS;
}

const CHANNEL_FOLDER_RE = /\/([0-9a-fA-F]{16})\/[^/]+$/;

export function getCdnSignatureChannelId(url?: string): string | undefined {
	if (!url || url.includes('?') || !isMezonCdnUrl(url)) return undefined;

	let pathname: string;
	try {
		pathname = new URL(url).pathname;
	} catch {
		return undefined;
	}

	const hex = CHANNEL_FOLDER_RE.exec(pathname)?.[1];
	if (!hex) return undefined;
	const channelId = BigInt(`0x${hex}`).toString();
	return channelId === '0' ? undefined : channelId;
}

export function needsCdnSignature(url?: string): url is string {
	return getCdnSignatureChannelId(url) !== undefined;
}

export function parseSignedCdnMediaSrc(src?: string): { url: string; channelId: string; signature: string } | undefined {
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
	const channelId = getCdnSignatureChannelId(url);
	return signature && channelId ? { url, channelId, signature } : undefined;
}

export function appendCdnSignature(url: string, signature?: string): string;
export function appendCdnSignature(url: string | undefined, signature?: string): string | undefined;
export function appendCdnSignature(url: string | undefined, signature?: string): string | undefined {
	if (!signature || !needsCdnSignature(url)) {
		return url;
	}

	const query = signature.replace(/^[?&]+/, '');
	return query ? `${url}?${query}` : url;
}
