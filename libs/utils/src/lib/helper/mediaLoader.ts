import { ApiMediaFormat, ApiPreparedMedia, ELECTRON_HOST_URL, IS_PACKAGED_ELECTRON } from '../types';

export interface ApiOnProgress {
	(progress: number, ...args: any[]): void;

	isCanceled?: boolean;
}

const PROGRESSIVE_URL_PREFIX = `${IS_PACKAGED_ELECTRON ? ELECTRON_HOST_URL : '.'}/progressive/`;
const memoryCache = new Map<string, ApiPreparedMedia>();
const progressCallbacks = new Map<string, Map<string, ApiOnProgress>>();

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
			memoryCache.set(url, data);
			return data;
		})
		.catch((err) => {
			console.error(err);
		}) as Promise<ApiPreparedMedia>;
}

export function getFromMemory(url: string) {
	return memoryCache.get(url) as ApiPreparedMedia;
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
export function cancelProgress(progressCallback: ApiOnProgress) {}

export function removeCallback(url: string, callbackUniqueId: string) {
	const callbacks = progressCallbacks.get(url);
	if (!callbacks) return;
	callbacks.delete(callbackUniqueId);
}

export function getProgressiveUrl(url: string) {
	return `${PROGRESSIVE_URL_PREFIX}${url}`;
}
