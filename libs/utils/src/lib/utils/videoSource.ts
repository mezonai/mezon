import { fragmentedMp4InitEnd, fragmentedMp4Playlist } from './fragmentedMp4';

// The media server converts videos uploaded to these hosts into HLS and writes the stream under its own
// prefix, `<origin>/hls/<key>/master.m3u8`, while the message keeps the url of the original.
const TRANSCODING_ORIGINS = ['https://cdn.mezon.ai', 'http://cdn.mezon.ai', 'https://cdn.mezon.vn', 'http://cdn.mezon.vn'];
// Containers no browser plays, which the media server converts like any other video.
const TRANSCODED_CONTAINERS = new Set(['avi', 'flv', 'mkv', 'wmv']);
// What the media server accepts.
const HLS_TRANSCODE_EXTENSIONS = new Set(['mp4', 'mov', 'mkv', 'avi', 'flv', 'm4v', 'wmv']);
const FMP4_EXTENSIONS = new Set(['mp4', 'm4v', 'mov']);
const FMP4_HEAD_BYTES = 16384;
const FMP4_TAIL_BYTES = 256 * 1024;
const FMP4_PROBE_TIMEOUT_MS = 30000;
const MAX_MFRA_BYTES = 16 * 1024 * 1024;
const HLS_OUTPUT_PREFIX = 'hls/';
const HLS_MASTER_PLAYLIST = 'master.m3u8';
const HLS_INDEX_PLAYLIST = 'index.m3u8';
const HLS_INIT_SEGMENT = 'init.mp4';
const HLS_PLAYLIST_SUFFIX = '.m3u8';
const HLS_PLAYLIST_TAG = '#EXTM3U';
const HLS_END_TAG = '#EXT-X-ENDLIST';
const HLS_PROBE_TIMEOUT_MS = 5000;
export const HLS_INDEX_PROBE_INTERVAL_MS = 3000;

interface TranscodableUrl {
	file: string;
	origin: string;
	key: string;
	query: string;
}

// The file ingest writes its HLS under the same prefix of the configured CDN, where nothing converts other containers.
function hlsOrigins(): string[] {
	try {
		const cdn = new URL(process.env.NX_MEZON_CDN_URL ?? '').origin;
		return TRANSCODING_ORIGINS.includes(cdn) ? TRANSCODING_ORIGINS : [...TRANSCODING_ORIGINS, cdn];
	} catch {
		return TRANSCODING_ORIGINS;
	}
}

function readTranscodableUrl(url?: string, origins = hlsOrigins()): TranscodableUrl | undefined {
	if (!url || url.includes('#')) return undefined;

	const queryIndex = url.indexOf('?');
	const path = queryIndex === -1 ? url : url.slice(0, queryIndex);
	const origin = origins.find((candidate) => path.startsWith(`${candidate}/`));
	if (!origin) return undefined;

	const key = path.slice(origin.length + 1);
	const file = path.slice(path.lastIndexOf('/') + 1);
	if (!file || key.startsWith(HLS_OUTPUT_PREFIX) || file.toLowerCase().endsWith(HLS_PLAYLIST_SUFFIX)) return undefined;

	return { file, origin, key, query: queryIndex === -1 ? '' : url.slice(queryIndex + 1) };
}

function masterPlaylistPath({ origin, key }: TranscodableUrl): string {
	return `${origin}/${HLS_OUTPUT_PREFIX}${key}/${HLS_MASTER_PLAYLIST}`;
}

function indexProbeUrl(playlist: string): string {
	return `${playlist}?probe=${Math.floor(Date.now() / HLS_INDEX_PROBE_INTERVAL_MS)}`;
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
	const file = readTranscodableUrl(url, TRANSCODING_ORIGINS)?.file ?? '';
	const dot = file.lastIndexOf('.');
	return dot !== -1 && TRANSCODED_CONTAINERS.has(file.slice(dot + 1).toLowerCase());
}

/** The HLS stream the media server writes for `url`, carrying the same CDN signature. */
export function getHlsMasterPlaylistUrl(url?: string): string | undefined {
	const parts = readTranscodableUrl(url);
	if (!parts) return undefined;
	return `${masterPlaylistPath(parts)}${parts.query ? `?${parts.query}` : ''}`;
}

/** The EVENT playlist the file ingest writes for `url` while the file arrives; the CDN serves it without a signature. */
export function getHlsIndexPlaylistUrl(url?: string): string | undefined {
	const parts = readTranscodableUrl(url);
	return parts && `${parts.origin}/${HLS_OUTPUT_PREFIX}${parts.key}/${HLS_INDEX_PLAYLIST}`;
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

const startsAsPlaylist = async (body: ReadableStream<Uint8Array>) => (await readPrefix(body, HLS_PLAYLIST_TAG.length)) === HLS_PLAYLIST_TAG;
const hasEnded = async (body: ReadableStream<Uint8Array>) => (await new Response(body).text()).includes(HLS_END_TAG);

async function withProbeTimeout<T>(
	signal: AbortSignal | undefined,
	read: (signal: AbortSignal) => Promise<T | undefined>,
	timeoutMs = HLS_PROBE_TIMEOUT_MS
): Promise<T | undefined> {
	const controller = new AbortController();
	const abort = () => controller.abort();
	signal?.addEventListener('abort', abort, { once: true });
	const timeout = setTimeout(abort, timeoutMs);
	try {
		return await read(controller.signal);
	} catch {
		return undefined;
	} finally {
		clearTimeout(timeout);
		signal?.removeEventListener('abort', abort);
	}
}

function probePlaylist(
	probeUrl: string,
	playlist: string | undefined,
	signal?: AbortSignal,
	accepts = startsAsPlaylist
): Promise<string | undefined> {
	return withProbeTimeout(signal, async (timed) => {
		const response = await fetch(probeUrl, { signal: timed });
		if (!response.ok || !response.body) {
			void response.body?.cancel().catch(() => undefined);
			return undefined;
		}
		return (await accepts(response.body)) ? playlist : undefined;
	});
}

const MATRIX_ONE = 0x10000;

function isTurnedVideoHeader(view: DataView, at: number, size: number): boolean {
	if (size < 92) return false;
	const matrix = at + 8 + (view.getUint8(at + 8) === 1 ? 52 : 40);
	if (matrix + 44 > at + size || view.getUint32(matrix + 36) === 0 || view.getUint32(matrix + 40) === 0) return false;
	return (
		view.getInt32(matrix) !== MATRIX_ONE ||
		view.getInt32(matrix + 4) !== 0 ||
		view.getInt32(matrix + 12) !== 0 ||
		view.getInt32(matrix + 16) !== MATRIX_ONE
	);
}

function hasTurnedVideoTrack(bytes: Uint8Array, start = 0, end = bytes.length): boolean {
	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
	for (let at = start; at + 8 <= end; ) {
		const size = view.getUint32(at) || end - at;
		if (size < 8 || at + size > end) return false;
		const type = String.fromCharCode(...bytes.subarray(at + 4, at + 8));
		if ((type === 'moov' || type === 'trak') && hasTurnedVideoTrack(bytes, at + 8, at + size)) return true;
		if (type === 'tkhd' && isTurnedVideoHeader(view, at, size)) return true;
		at += size;
	}
	return false;
}

/** Whether the video track in the init segment next to `playlist` is turned or mirrored; false when it cannot be read. */
export async function isRotatedHlsVideo(playlist: string, signal?: AbortSignal): Promise<boolean> {
	const init = new URL(HLS_INIT_SEGMENT, playlist).href;
	const turned = await withProbeTimeout(signal, async (timed) => {
		const response = await fetch(init, { signal: timed });
		return response.ok && hasTurnedVideoTrack(new Uint8Array(await response.arrayBuffer()));
	});
	return turned === true;
}

/**
 * Resolves to the HLS stream of `url` when the media server has converted it, or undefined to play `url` itself.
 * The probe url is unique per call because the CDN caches a 404, which would hide a stream written since.
 */
export async function probeHlsMasterPlaylist(url?: string, signal?: AbortSignal): Promise<string | undefined> {
	const parts = readTranscodableUrl(url);
	if (!parts) return undefined;
	return probePlaylist(`${masterPlaylistPath(parts)}?probe=${Date.now().toString(16)}`, getHlsMasterPlaylistUrl(url), signal);
}

/** Resolves to the file ingest's playlist of `url` once stored; viewers share `probe` for 3 s so the CDN cache absorbs them. */
export async function probeHlsIndexPlaylist(url?: string, signal?: AbortSignal): Promise<string | undefined> {
	const playlist = getHlsIndexPlaylistUrl(url);
	if (!playlist) return undefined;
	return probePlaylist(indexProbeUrl(playlist), playlist, signal);
}

/** Resolves to the url it read the file ingest's playlist of `url` from, with the shared probe value, once that playlist has ended. */
export async function probeEndedHlsIndexPlaylist(url?: string, signal?: AbortSignal): Promise<string | undefined> {
	const playlist = getHlsIndexPlaylistUrl(url);
	if (!playlist) return undefined;
	const probeUrl = indexProbeUrl(playlist);
	return probePlaylist(probeUrl, probeUrl, signal, hasEnded);
}

export async function probeFragmentedMp4Playlist(url?: string, signal?: AbortSignal): Promise<string | undefined> {
	const parts = readTranscodableUrl(url);
	if (!url || !parts) return undefined;
	const dot = parts.file.lastIndexOf('.');
	if (dot <= 0 || !FMP4_EXTENSIONS.has(parts.file.slice(dot + 1).toLowerCase())) return undefined;

	return withProbeTimeout(
		signal,
		async (timed) => {
			const headRes = await fetch(url, { headers: { Range: `bytes=0-${FMP4_HEAD_BYTES - 1}` }, signal: timed });
			if (headRes.status !== 206) {
				void headRes.body?.cancel().catch(() => undefined);
				return undefined;
			}
			const rangeMatch = /^bytes \d+-\d+\/(\d+)$/i.exec(headRes.headers.get('content-range') ?? '');
			if (!rangeMatch) {
				void headRes.body?.cancel().catch(() => undefined);
				return undefined;
			}
			const size = Number(rangeMatch[1]);
			if (!Number.isSafeInteger(size) || size <= 0) {
				void headRes.body?.cancel().catch(() => undefined);
				return undefined;
			}
			const head = new Uint8Array(await headRes.arrayBuffer());
			const initEnd = fragmentedMp4InitEnd(head);
			if (initEnd === undefined || size - initEnd < 16) return undefined;

			const tailStart = Math.max(initEnd, size - FMP4_TAIL_BYTES);
			const tailRes = await fetch(url, { headers: { Range: `bytes=${tailStart}-${size - 1}` }, signal: timed });
			if (tailRes.status !== 206) {
				void tailRes.body?.cancel().catch(() => undefined);
				return undefined;
			}
			const tail = new Uint8Array(await tailRes.arrayBuffer());
			if (tail.length !== size - tailStart) return undefined;
			const mfro = tail.subarray(tail.length - 16);
			const mfroView = new DataView(mfro.buffer, mfro.byteOffset, mfro.byteLength);
			if (mfroView.getUint32(0) !== 16 || String.fromCharCode(mfro[4], mfro[5], mfro[6], mfro[7]) !== 'mfro') return undefined;
			const mfraSize = mfroView.getUint32(12);
			if (mfraSize < 16 || mfraSize > MAX_MFRA_BYTES || mfraSize > size - initEnd) return undefined;
			if (mfraSize <= tail.length) return fragmentedMp4Playlist(url, head, size, tail.subarray(tail.length - mfraSize));

			const mfraRes = await fetch(url, { headers: { Range: `bytes=${size - mfraSize}-${size - 1}` }, signal: timed });
			if (mfraRes.status !== 206) {
				void mfraRes.body?.cancel().catch(() => undefined);
				return undefined;
			}
			const mfra = new Uint8Array(await mfraRes.arrayBuffer());
			if (mfra.length !== mfraSize) return undefined;
			return fragmentedMp4Playlist(url, head, size, mfra);
		},
		FMP4_PROBE_TIMEOUT_MS
	);
}
