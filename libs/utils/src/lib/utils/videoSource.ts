// The media server converts videos uploaded to these hosts into HLS and writes the stream under its own
// prefix, `<origin>/hls/<key>/master.m3u8`, while the message keeps the url of the original.
const TRANSCODING_ORIGINS = ['https://cdn.mezon.ai', 'http://cdn.mezon.ai', 'https://cdn.mezon.vn', 'http://cdn.mezon.vn'];
// Containers no browser plays, which the media server converts like any other video.
const TRANSCODED_CONTAINERS = new Set(['avi', 'flv', 'mkv', 'wmv']);
// What the media server accepts.
const HLS_TRANSCODE_EXTENSIONS = new Set(['mp4', 'mov', 'mkv', 'avi', 'flv', 'm4v', 'wmv']);
const HLS_OUTPUT_PREFIX = 'hls/';
const HLS_MASTER_PLAYLIST = 'master.m3u8';
const HLS_PLAYLIST_SUFFIX = '.m3u8';
const HLS_PLAYLIST_TAG = '#EXTM3U';
const HLS_PROBE_TIMEOUT_MS = 5000;

interface TranscodableUrl {
	file: string;
	origin: string;
	key: string;
	query: string;
}

function readTranscodableUrl(url?: string): TranscodableUrl | undefined {
	if (!url || url.includes('#')) return undefined;

	const queryIndex = url.indexOf('?');
	const path = queryIndex === -1 ? url : url.slice(0, queryIndex);
	const origin = TRANSCODING_ORIGINS.find((candidate) => path.startsWith(`${candidate}/`));
	if (!origin) return undefined;

	const key = path.slice(origin.length + 1);
	const file = path.slice(path.lastIndexOf('/') + 1);
	if (!file || key.startsWith(HLS_OUTPUT_PREFIX) || file.toLowerCase().endsWith(HLS_PLAYLIST_SUFFIX)) return undefined;

	return { file, origin, key, query: queryIndex === -1 ? '' : url.slice(queryIndex + 1) };
}

function masterPlaylistPath({ origin, key }: TranscodableUrl): string {
	return `${origin}/${HLS_OUTPUT_PREFIX}${key}/${HLS_MASTER_PLAYLIST}`;
}

/** Whether an upload should ask the server to route it to the media server: every video it accepts, whatever its size. */
export function wantsHlsTranscode(filename?: string): boolean {
	if (!filename) return false;
	const dot = filename.lastIndexOf('.');
	return dot > 0 && HLS_TRANSCODE_EXTENSIONS.has(filename.slice(dot + 1).toLowerCase());
}

/** True for a video the media server may have replaced with an HLS stream. */
export function mayBeTranscodedVideo(url?: string): boolean {
	return readTranscodableUrl(url) !== undefined;
}

/** True for an mkv/avi/flv/wmv the media server converts, so it plays as a video instead of a file to download. */
export function isTranscodedVideoContainer(url?: string): boolean {
	const file = readTranscodableUrl(url)?.file ?? '';
	const dot = file.lastIndexOf('.');
	return dot !== -1 && TRANSCODED_CONTAINERS.has(file.slice(dot + 1).toLowerCase());
}

/** The HLS stream the media server writes for `url`, carrying the same CDN signature. */
export function getHlsMasterPlaylistUrl(url?: string): string | undefined {
	const parts = readTranscodableUrl(url);
	if (!parts) return undefined;
	return `${masterPlaylistPath(parts)}${parts.query ? `?${parts.query}` : ''}`;
}

async function readPrefix(body: ReadableStream<Uint8Array>, length: number): Promise<string> {
	const reader = body.getReader();
	let prefix = '';
	try {
		while (prefix.length < length) {
			const { done, value } = await reader.read();
			if (done) break;
			prefix += String.fromCharCode(...value.subarray(0, length - prefix.length));
		}
	} finally {
		void reader.cancel().catch(() => undefined);
	}
	return prefix;
}

/**
 * Resolves to the HLS stream of `url` when the media server has converted it, or undefined to play `url` itself.
 * The probe url is unique per call because the CDN caches a 404, which would hide a stream written since.
 */
export async function probeHlsMasterPlaylist(url?: string, signal?: AbortSignal): Promise<string | undefined> {
	const parts = readTranscodableUrl(url);
	if (!parts) return undefined;

	const controller = new AbortController();
	const abort = () => controller.abort();
	signal?.addEventListener('abort', abort, { once: true });
	const timeout = setTimeout(abort, HLS_PROBE_TIMEOUT_MS);
	try {
		const response = await fetch(`${masterPlaylistPath(parts)}?probe=${Date.now().toString(16)}`, { signal: controller.signal });
		if (!response.ok || !response.body) {
			void response.body?.cancel().catch(() => undefined);
			return undefined;
		}
		return (await readPrefix(response.body, HLS_PLAYLIST_TAG.length)) === HLS_PLAYLIST_TAG ? getHlsMasterPlaylistUrl(url) : undefined;
	} catch {
		return undefined;
	} finally {
		clearTimeout(timeout);
		signal?.removeEventListener('abort', abort);
	}
}
