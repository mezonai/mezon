export interface SecureURLOptions {
	allowedProtocols?: string[];
	allowedDomains?: string[];
	maxLength?: number;
}

export function isFromAllowedDomain(url: string | undefined, allowedDomains: string[]): boolean {
	if (!url || !allowedDomains.length) {
		return false;
	}

	try {
		const parsedUrl = new URL(url);
		const hostname = parsedUrl.hostname.toLowerCase();

		return allowedDomains.some((domain) => {
			const normalizedDomain = domain.toLowerCase();
			return hostname === normalizedDomain || hostname.endsWith('.' + normalizedDomain);
		});
	} catch (error) {
		return false;
	}
}

export function isTenorUrl(url: string | undefined): boolean {
	return isFromAllowedDomain(url, ['tenor.com']);
}

export function isMezonCdnUrl(url: string | undefined): boolean {
	return isFromAllowedDomain(url, ['cdn.mezon.ai']);
}

export function sanitizeUrl(url: string | undefined, options: SecureURLOptions = {}): string {
	if (!url) return '';

	const { allowedProtocols = ['http:', 'https:', 'data:', 'blob:'], allowedDomains = [], maxLength = 2048 } = options;

	if (url.length > maxLength) {
		return '';
	}

	try {
		const decodedUrl = decodeURIComponent(url);
		const encodedUrl = encodeURI(decodedUrl);
		const parsed = new URL(encodedUrl);

		if (!allowedProtocols.includes(parsed.protocol)) {
			return '';
		}

		if (parsed.protocol === 'data:' && encodedUrl.startsWith('data:image/')) {
			return encodedUrl;
		}

		if (parsed.protocol === 'blob:') {
			return encodedUrl;
		}

		if (
			(parsed.protocol === 'http:' || parsed.protocol === 'https:') &&
			allowedDomains.length > 0 &&
			!isFromAllowedDomain(encodedUrl, allowedDomains)
		) {
			return '';
		}

		return encodedUrl;
	} catch (error) {
		return '';
	}
}


export function sanitizeHref(url: string | undefined): string | undefined {
	if (!url) return undefined;
	const trimmed = url.trim();
	if (!trimmed) return undefined;
	if (trimmed.startsWith('/') || trimmed.startsWith('#') || trimmed.startsWith('?')) return trimmed;
	const lower = trimmed.toLowerCase();
	if (lower.startsWith('javascript:') || lower.startsWith('data:') || lower.startsWith('vbscript:') || lower.startsWith('file:')) {
		return undefined;
	}
	try {
		const parsed = new URL(trimmed);
		if (parsed.protocol === 'http:' || parsed.protocol === 'https:' || parsed.protocol === 'mailto:' || parsed.protocol === 'tel:') {
			return parsed.toString();
		}
		return undefined;
	} catch {
		if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return undefined;
		return trimmed;
	}
}

export function isSecureAttachmentUrl(attachment: { url?: string; filetype?: string }): boolean {
	if (!attachment.url) {
		return false;
	}

	const isTenor = isTenorUrl(attachment.url);
	const isMezonCdn = isMezonCdnUrl(attachment.url);

	if (isTenor || isMezonCdn) {
		return true;
	}

	if (attachment.url.startsWith('blob:')) {
		return true;
	}

	const sanitized = sanitizeUrl(attachment.url, {
		allowedProtocols: ['https:'],
		maxLength: 512
	});

	return sanitized !== '';
}
