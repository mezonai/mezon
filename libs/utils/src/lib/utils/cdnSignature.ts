import { isMezonCdnUrl } from './urlSanitization';

export const CDN_SIGNATURE_TTL_MS = 5 * 60 * 60 * 1000;

export function needsCdnSignature(url?: string): url is string {
	return !!url && !url.includes('?') && isMezonCdnUrl(url);
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
