import * as cacheApi from '../helper/cacheApi';
import { ApiMediaFormat, ApiParsedMedia, ApiPreparedMedia, ELECTRON_HOST_URL, IS_PACKAGED_ELECTRON } from '../types';
import { IS_PROGRESSIVE_SUPPORTED } from '../utils/windowEnvironment';

export interface ApiOnProgress {
	(
		progress: number, // Float between 0 and 1.
		...args: any[]
	): void;

	isCanceled?: boolean;
}

const asCacheApiType = {
	[ApiMediaFormat.BlobUrl]: cacheApi.Type.Blob,
	[ApiMediaFormat.Text]: cacheApi.Type.Text,
	[ApiMediaFormat.DownloadUrl]: undefined,
	[ApiMediaFormat.Progressive]: undefined
};

const PROGRESSIVE_URL_PREFIX = `${IS_PACKAGED_ELECTRON ? ELECTRON_HOST_URL : '.'}/progressive/`;
const URL_DOWNLOAD_PREFIX = './download/';
const MAX_MEDIA_RETRIES = 5;

const memoryCache = new Map<string, ApiPreparedMedia>();
const fetchPromises = new Map<string, Promise<ApiPreparedMedia | undefined>>();
const progressCallbacks = new Map<string, Map<string, ApiOnProgress>>();
const cancellableCallbacks = new Map<string, ApiOnProgress>();

export function fetch<T extends ApiMediaFormat>(
	url: string,
	mediaFormat: T,
	isHtmlAllowed = false,
	onProgress?: ApiOnProgress,
	callbackUniqueId?: string
): Promise<ApiPreparedMedia> {
	console.log(url, 'url');

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
		.catch((err) => {}) as Promise<ApiPreparedMedia>;
}
// if (mediaFormat === ApiMediaFormat.Progressive) {
// 	return (
// 		IS_PROGRESSIVE_SUPPORTED ? getProgressive(url) : fetch(url, ApiMediaFormat.BlobUrl, isHtmlAllowed, onProgress, callbackUniqueId)
// 	) as Promise<ApiPreparedMedia>;
// }

// if (mediaFormat === ApiMediaFormat.DownloadUrl) {
// 	return (
// 		IS_PROGRESSIVE_SUPPORTED ? getDownloadUrl(url) : fetch(url, ApiMediaFormat.BlobUrl, isHtmlAllowed, onProgress, callbackUniqueId)
// 	) as Promise<ApiPreparedMedia>;
// }

// if (!fetchPromises.has(url)) {
// 	const promise = fetchFromCacheOrRemote(url, mediaFormat, isHtmlAllowed)
// 		.catch(() => {
// 			// if (DEBUG) {
// 			// 	// eslint-disable-next-line no-console
// 			// 	console.warn(err);
// 			// }

// 			return undefined;
// 		})
// 		.finally(() => {
// 			fetchPromises.delete(url);
// 			progressCallbacks.delete(url);
// 			cancellableCallbacks.delete(url);
// 		});

// 	fetchPromises.set(url, promise);
// }

// if (onProgress && callbackUniqueId) {
// 	let activeCallbacks = progressCallbacks.get(url);
// 	if (!activeCallbacks) {
// 		activeCallbacks = new Map<string, ApiOnProgress>();
// 		progressCallbacks.set(url, activeCallbacks);
// 	}
// 	activeCallbacks.set(callbackUniqueId, onProgress);
// }

// return fetchPromises.get(url) as Promise<ApiPreparedMedia>;
// }

export function getFromMemory(url: string) {
	return memoryCache.get(url) as ApiPreparedMedia;
}

export function cancelProgress(progressCallback: ApiOnProgress) {
	// progressCallbacks.forEach((map, url) => {
	// 	map.forEach((callback) => {
	// 		if (callback === progressCallback) {
	// 			const parentCallback = cancellableCallbacks.get(url);
	// 			if (!parentCallback) return;
	// 			cancelApiProgress(parentCallback);
	// 			cancellableCallbacks.delete(url);
	// 			progressCallbacks.delete(url);
	// 		}
	// 	});
	// });
}

export function removeCallback(url: string, callbackUniqueId: string) {
	const callbacks = progressCallbacks.get(url);
	if (!callbacks) return;
	callbacks.delete(callbackUniqueId);
}

export function getProgressiveUrl(url: string) {
	return `${PROGRESSIVE_URL_PREFIX}${url}`;
}

function getProgressive(url: string) {
	const progressiveUrl = `${PROGRESSIVE_URL_PREFIX}${url}`;

	memoryCache.set(url, progressiveUrl);

	return Promise.resolve(progressiveUrl);
}

function getDownloadUrl(url: string) {
	return Promise.resolve(`${URL_DOWNLOAD_PREFIX}${url}`);
}

// async function fetchFromCacheOrRemote(url: string, mediaFormat: ApiMediaFormat, isHtmlAllowed: boolean, retryNumber = 0): any {
// 	if (!MEDIA_CACHE_DISABLED) {
// 		const cacheName = url.startsWith('avatar') ? MEDIA_CACHE_NAME_AVATARS : MEDIA_CACHE_NAME;
// 		const cached = await cacheApi.fetch(cacheName, url, asCacheApiType[mediaFormat]!, isHtmlAllowed);

// 		if (cached) {
// 			const media = cached;

// 			if (cached.type === 'audio/ogg' && !IS_OPUS_SUPPORTED) {
// 				// media = await oggToWav(media);
// 			}

// 			const prepared = prepareMedia(media);

// 			memoryCache.set(url, prepared);

// 			return prepared;
// 		}
// 	}

// 	const onProgress = makeOnProgress(url);
// 	cancellableCallbacks.set(url, onProgress);

// 	// const remote = await callApi('downloadMedia', { url, mediaFormat, isHtmlAllowed }, onProgress);
// 	// if (!remote) {
// 	// 	if (retryNumber >= MAX_MEDIA_RETRIES) {
// 	// 		throw new Error(`Failed to fetch media ${url}`);
// 	// 	}
// 	// 	await new Promise((resolve) => {
// 	// 		setTimeout(resolve, getRetryTimeout(retryNumber));
// 	// 	});
// 	// 	// eslint-disable-next-line no-console
// 	// 	return fetchFromCacheOrRemote(url, mediaFormat, isHtmlAllowed, retryNumber + 1);
// 	// }

// 	// const { mimeType } = remote;
// 	// const prepared = prepareMedia(remote.dataBlob);

// 	// if (mimeType === 'audio/ogg' && !IS_OPUS_SUPPORTED) {
// 	// 	const blob = await fetchBlob(prepared as string);
// 	// 	URL.revokeObjectURL(prepared as string);
// 	// 	const media = await oggToWav(blob);
// 	// 	prepared = prepareMedia(media);
// 	// 	mimeType = media.type;
// 	// }

// 	// memoryCache.set(url, prepared);

// 	// return prepared;
// }

function makeOnProgress(url: string) {
	const onProgress: ApiOnProgress = (progress: number) => {
		progressCallbacks.get(url)?.forEach((callback) => {
			callback(progress);
			if (callback.isCanceled) onProgress.isCanceled = true;
		});
	};

	return onProgress;
}

function prepareMedia(mediaData: Exclude<ApiParsedMedia, ArrayBuffer>): ApiPreparedMedia {
	if (mediaData instanceof Blob) {
		return URL.createObjectURL(mediaData);
	}

	return mediaData;
}

if (IS_PROGRESSIVE_SUPPORTED) {
	navigator.serviceWorker.addEventListener('message', async (e) => {
		const { type, messageId, params } = e.data as {
			type: string;
			messageId: string;
			params: { url: string; start: number; end: number };
		};

		if (type !== 'requestPart') {
			return;
		}

		// const result = await callApi('downloadMedia', { mediaFormat: ApiMediaFormat.Progressive, ...params });
		// if (!result) {
		// 	return;
		// }

		// const { arrayBuffer, mimeType, fullSize } = result;

		// navigator.serviceWorker.controller!.postMessage(
		// 	{
		// 		type: 'partResponse',
		// 		messageId,
		// 		result: {
		// 			arrayBuffer,
		// 			mimeType,
		// 			fullSize
		// 		}
		// 	},
		// 	[arrayBuffer!]
		// );
	});
}

function getRetryTimeout(retryNumber: number) {
	// 250ms, 500ms, 1s, 2s, 4s
	return 250 * 2 ** retryNumber;
}
