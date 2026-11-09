import { FragmentedMp4Indexer, finalizedMp4Blob } from './fragmentedMp4';
import { HLS_INDEX_PROBE_INTERVAL_MS, getHlsIndexPlaylistUrl } from './videoSource';

const HLS_PLAYLIST_TAG = '#EXTM3U';
const HLS_END_TAG = '#EXT-X-ENDLIST';
const HLS_VARIANT_TAG = '#EXT-X-STREAM-INF';
const HLS_MAP_PREFIX = '#EXT-X-MAP:URI="';
const HLS_PARTS_IN_FLIGHT = 4;

export function finishedHlsParts(playlist: string, text: string): string[] | undefined {
	if (!text.startsWith(HLS_PLAYLIST_TAG) || !text.includes(HLS_END_TAG) || text.includes(HLS_VARIANT_TAG)) {
		return undefined;
	}
	let init: string | undefined;
	const segments: string[] = [];
	try {
		for (const raw of text.split('\n')) {
			const line = raw.trim();
			if (!line) {
				continue;
			}
			if (line.startsWith(HLS_MAP_PREFIX)) {
				const rest = line.slice(HLS_MAP_PREFIX.length);
				const quote = rest.indexOf('"');
				if (quote <= 0 || init !== undefined) {
					return undefined;
				}
				init = new URL(rest.slice(0, quote), playlist).href;
			} else if (!line.startsWith('#')) {
				segments.push(new URL(line, playlist).href);
			}
		}
	} catch {
		return undefined;
	}
	if (!init || segments.length === 0) {
		return undefined;
	}
	return [init, ...segments];
}

async function fetchFinishedHlsParts(url?: string, signal?: AbortSignal): Promise<string[] | undefined> {
	const playlist = getHlsIndexPlaylistUrl(url);
	if (!playlist) {
		return undefined;
	}
	const probeUrl = `${playlist}?probe=${Math.floor(Date.now() / HLS_INDEX_PROBE_INTERVAL_MS)}`;
	const response = await fetch(probeUrl, { signal });
	if (!response.ok) {
		return undefined;
	}
	return finishedHlsParts(probeUrl, await response.text());
}

export async function hasFinishedHlsCopy(url?: string, signal?: AbortSignal): Promise<boolean> {
	try {
		return (await fetchFinishedHlsParts(url, signal)) !== undefined;
	} catch {
		return false;
	}
}

export async function fetchHlsCopy(url: string, signal?: AbortSignal): Promise<Blob | undefined> {
	if (signal?.aborted) {
		return undefined;
	}
	const controller = new AbortController();
	const onAbort = () => controller.abort();
	signal?.addEventListener('abort', onAbort, { once: true });
	try {
		const partUrls = await fetchFinishedHlsParts(url, controller.signal);
		if (!partUrls) {
			return undefined;
		}
		const indexer = new FragmentedMp4Indexer();
		const parts: Blob[] = [];
		for (let start = 0; start < partUrls.length; start += HLS_PARTS_IN_FLIGHT) {
			const batch = await Promise.all(
				partUrls.slice(start, start + HLS_PARTS_IN_FLIGHT).map(async (partUrl) => {
					const response = await fetch(partUrl, { signal: controller.signal });
					if (!response.ok) {
						throw new Error(`HLS part answered ${response.status}`);
					}
					return response.arrayBuffer();
				})
			);
			for (const buffer of batch) {
				indexer.push(new Uint8Array(buffer));
				parts.push(new Blob([buffer]));
			}
		}
		if (controller.signal.aborted) {
			return undefined;
		}
		const blob = new Blob(parts, { type: 'video/mp4' });
		const fin = indexer.finish();
		return fin ? finalizedMp4Blob(blob, fin, 'video/mp4') : blob;
	} catch {
		controller.abort();
		return undefined;
	} finally {
		signal?.removeEventListener('abort', onAbort);
	}
}

export async function fetchDownloadBlob(url: string, signal?: AbortSignal, init: RequestInit = {}): Promise<Blob | undefined> {
	const response = await fetch(url, { ...init, signal });
	if (response.ok) {
		return response.blob();
	}
	if (response.status === 403 || response.status === 404) {
		return fetchHlsCopy(url, signal);
	}
	return undefined;
}
