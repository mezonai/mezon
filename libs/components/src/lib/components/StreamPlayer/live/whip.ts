import type { LiveFailure } from '@mezon/store';

const WHIP_REQUEST_TIMEOUT_MS = 10_000;
const WHIP_DELETE_TIMEOUT_MS = 3_000;
const WHIP_DELETE_RETRY_DELAY_MS = 150;
const MAX_RETRY_AFTER_MS = 16_000;

export class WhipError extends Error {
	constructor(
		readonly status: number,
		readonly retryAfterMs?: number
	) {
		super(`WHIP request failed with HTTP ${status}`);
	}
}

export function classifyWhip(status: number): LiveFailure | 'retry' {
	if (status === 409) return 'busy';
	if (status === 401 || status === 403) return 'forbidden';
	if (status === 400 || status === 406) return 'unsupported';
	return 'retry';
}

function parseRetryAfterMs(value: string | null): number | undefined {
	if (!value) return undefined;
	const trimmed = value.trim();
	if (!/^\d+$/.test(trimmed)) return undefined;
	const seconds = Number(trimmed);
	if (!Number.isFinite(seconds)) return undefined;
	return Math.min(MAX_RETRY_AFTER_MS, seconds * 1000);
}

function getHeader(headers: Headers, name: string): string | null {
	return headers.get(name) ?? headers.get(name.toLowerCase());
}

function hasInvalidLocationChars(value: string): boolean {
	for (let i = 0; i < value.length; i += 1) {
		const code = value.charCodeAt(i);
		if (code <= 0x20 || code === 0x7f) return true;
	}
	return false;
}

function resolveLocation(baseUrl: URL, location: string | null): string | null {
	if (!location) return null;
	const trimmed = location.trim();
	if (!trimmed || hasInvalidLocationChars(trimmed)) return null;
	try {
		const resolved = new URL(trimmed, baseUrl);
		if (resolved.protocol !== 'http:' && resolved.protocol !== 'https:') return null;
		if (!resolved.host) return null;
		return resolved.href;
	} catch {
		return null;
	}
}

function sleepWithSignal(ms: number, signal: AbortSignal): Promise<void> {
	if (signal.aborted) return Promise.reject(signal.reason ?? new Error('Aborted'));
	return new Promise<void>((resolve, reject) => {
		const onAbort = () => {
			clearTimeout(timer);
			reject(signal.reason ?? new Error('Aborted'));
		};
		const timer = setTimeout(() => {
			signal.removeEventListener('abort', onAbort);
			resolve();
		}, ms);
		signal.addEventListener('abort', onAbort, { once: true });
	});
}

export async function publishWhip(url: string, token: string, offerSdp: string): Promise<{ resource: string; answer: string }> {
	let baseUrl: URL;
	try {
		baseUrl = new URL(url);
	} catch {
		throw new WhipError(400);
	}
	if ((baseUrl.protocol !== 'http:' && baseUrl.protocol !== 'https:') || !baseUrl.host) {
		throw new WhipError(400);
	}

	let response: Response;
	try {
		response = await fetch(baseUrl.href, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/sdp',
				Authorization: `Bearer ${token}`
			},
			body: offerSdp,
			signal: AbortSignal.timeout(WHIP_REQUEST_TIMEOUT_MS)
		});
	} catch {
		throw new WhipError(0);
	}

	if (response.status !== 201) {
		const retryAfterMs = response.status === 503 ? parseRetryAfterMs(getHeader(response.headers, 'Retry-After')) : undefined;
		throw new WhipError(response.status, retryAfterMs);
	}

	const resource = resolveLocation(baseUrl, getHeader(response.headers, 'Location'));
	if (!resource) {
		throw new WhipError(response.status);
	}

	let answer: string;
	try {
		answer = await response.text();
	} catch {
		throw new WhipError(0);
	}

	if (!answer.trim()) {
		throw new WhipError(response.status);
	}

	return { resource, answer };
}

export async function deleteWhip(resource: string, token: string, keepalive = false): Promise<number | undefined> {
	const signal = AbortSignal.timeout(WHIP_DELETE_TIMEOUT_MS);
	for (let attempt = 0; attempt < 2; attempt += 1) {
		try {
			const response = await fetch(resource, {
				method: 'DELETE',
				headers: { Authorization: `Bearer ${token}` },
				keepalive,
				signal
			});
			if (response.status === 503 && attempt === 0) {
				await sleepWithSignal(WHIP_DELETE_RETRY_DELAY_MS, signal);
				continue;
			}
			return response.status;
		} catch {
			return undefined;
		}
	}
	return undefined;
}
