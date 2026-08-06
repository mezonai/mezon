import type { ApiPreparedMedia } from '../types';
import { ApiMediaFormat } from '../types';

export interface ApiOnProgress {
	(progress: number, ...args: any[]): void;

	isCanceled?: boolean;
}

const PROGRESSIVE_URL_PREFIX = `./progressive/`;

const MAX_MEDIA_CACHE_SIZE = 200;
const CACHE_CLEANUP_THRESHOLD = 0.8;

interface CacheEntry {
	data: ApiPreparedMedia;
	timestamp: number;
}

const memoryCache = new Map<string, CacheEntry>();
const progressCallbacks = new Map<string, Map<string, ApiOnProgress>>();

function pruneMediaCache() {
	if (memoryCache.size < MAX_MEDIA_CACHE_SIZE * CACHE_CLEANUP_THRESHOLD) {
		return;
	}
	const entries = Array.from(memoryCache.entries()).sort((a, b) => a[1].timestamp - b[1].timestamp);

	const targetSize = Math.floor(MAX_MEDIA_CACHE_SIZE * 0.5);
	const toRemove = entries.slice(0, memoryCache.size - targetSize);

	toRemove.forEach(([key, entry]) => {
		if (typeof entry.data === 'string' && entry.data.startsWith('blob:')) {
			try {
				URL.revokeObjectURL(entry.data);
			} catch (error) {
				console.warn('Failed to revoke blob URL:', error);
			}
		}
		memoryCache.delete(key);
	});
}

export function fetch<T extends ApiMediaFormat>(
	url: string,
	mediaFormat: T,
	isHtmlAllowed = false,
	onProgress?: ApiOnProgress,
	callbackUniqueId?: string
): Promise<ApiPreparedMedia> {
	return window
		.fetch(url)
		.then((response) => {
			if (mediaFormat === ApiMediaFormat.BlobUrl) {
				return response.blob().then((blob) => URL.createObjectURL(blob));
			} else if (mediaFormat === ApiMediaFormat.Text) {
				return response.text();
			}

			return response.blob().then((blob) => URL.createObjectURL(blob));
		})
		.then((data) => {
			memoryCache.set(url, {
				data,
				timestamp: Date.now()
			});
			pruneMediaCache();
			return data;
		})
		.catch((err) => {
			console.error(err);
			throw err;
		})
		.finally(() => {
			if (callbackUniqueId) {
				removeCallback(url, callbackUniqueId);
			}
		}) as Promise<ApiPreparedMedia>;
}

export function getFromMemory(url: string) {
	const entry = memoryCache.get(url);
	if (entry) {
		entry.timestamp = Date.now();
		return entry.data as ApiPreparedMedia;
	}
	return undefined;
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
export function cancelProgress(progressCallback: ApiOnProgress) {}

export function removeCallback(url: string, callbackUniqueId: string) {
	const callbacks = progressCallbacks.get(url);
	if (!callbacks) return;
	callbacks.delete(callbackUniqueId);

	if (callbacks.size === 0) {
		progressCallbacks.delete(url);
	}
}

export function getProgressiveUrl(url: string) {
	return `${PROGRESSIVE_URL_PREFIX}${url}`;
}
