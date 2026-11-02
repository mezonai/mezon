import { uploadFileToPath } from '../minio';

export const FILE_INGEST_CHUNK_SIZE = 8 * 1024 * 1024;
export const FILE_INGEST_MAX_SIZE = 1024 * 1024 * 1024;
const STATUS_POLL_MS = 2000;
const RETRY_DELAYS_MS = [1000, 2000, 4000, 8000, 16000, 30000, 30000, 30000, 30000, 30000];
const RETRY_STATUSES = new Set([408, 500, 503]);
const VIDEO_EXTENSIONS = new Set(['3g2', '3gp', 'avi', 'flv', 'm2ts', 'm4v', 'mkv', 'mov', 'mp4', 'mpeg', 'mpg', 'mts', 'ogv', 'qt', 'webm', 'wmv']);

type ByteRange = [number, number];

interface FileIngestStatus {
	size: number;
	received?: ByteRange[];
	stored: boolean;
	hls: string;
}

export interface FileIngestFile {
	type?: string;
	name?: string;
	size?: number;
}

function ingestBaseUrls(): Map<string, string> {
	const bases = new Map<string, string>();
	for (const pair of (process.env.NX_CHAT_APP_FILE_INGEST ?? '').split(',')) {
		const at = pair.indexOf('=');
		const host = pair.slice(0, at).trim().toLowerCase();
		const base = pair
			.slice(at + 1)
			.trim()
			.replace(/\/+$/, '');
		if (at > 0 && host && /^https?:\/\/[^/?#]+$/i.test(base)) bases.set(host, base);
	}
	return bases;
}

export function isFileIngestCandidate({ type, name, size = 0 }: FileIngestFile): boolean {
	const dot = name?.lastIndexOf('.') ?? -1;
	const isVideo = Boolean(type?.startsWith('video')) || (dot > 0 && VIDEO_EXTENSIONS.has((name ?? '').slice(dot + 1).toLowerCase()));
	return isVideo && size >= 1 && size <= FILE_INGEST_MAX_SIZE && ingestBaseUrls().size > 0;
}

export function getFileIngestUrl(presignedUrl: string | undefined, file: FileIngestFile): string | undefined {
	const match = presignedUrl && isFileIngestCandidate(file) ? /^https?:\/\/([^/?#]+)(\/.*)$/i.exec(presignedUrl) : null;
	const base = match ? ingestBaseUrls().get(match[1].toLowerCase()) : undefined;
	return match && base ? base + match[2] : undefined;
}

export async function moovAfterMdat(file: Blob): Promise<number> {
	let off = 0;
	let mdat = false;
	while (off + 8 <= file.size) {
		const h = new DataView(await file.slice(off, off + 16).arrayBuffer());
		let size = h.getUint32(0);
		const type = String.fromCharCode(h.getUint8(4), h.getUint8(5), h.getUint8(6), h.getUint8(7));
		if (size === 1) {
			if (h.byteLength < 16) return -1;
			size = Number(h.getBigUint64(8));
		} else if (size === 0) {
			size = file.size - off;
		}
		if (type === 'moov') return mdat ? off : -1;
		if (type === 'mdat') mdat = true;
		if (size < 8) return -1;
		off += size;
	}
	return -1;
}

/** The next chunk the ingest misses: from the start of `moov` to the end first when `moov` follows `mdat`, then from byte 0. */
export function nextFileIngestChunk(size: number, received: ByteRange[], moov: number): ByteRange | undefined {
	const order: ByteRange[] =
		moov > 0
			? [
					[moov, size - 1],
					[0, moov - 1]
				]
			: [[0, size - 1]];
	for (const [first, last] of order) {
		let start = first;
		for (const [from, to] of received) {
			if (from > start) break;
			start = Math.max(start, to + 1);
		}
		if (start > last) continue;
		const following = received.find(([from]) => from > start);
		return [start, Math.min(start + FILE_INGEST_CHUNK_SIZE - 1, last, following ? following[0] - 1 : last)];
	}
	return undefined;
}

function isPresignedUrlExpired(url: string): boolean {
	const query = new URLSearchParams(url.slice(url.indexOf('?') + 1));
	const date = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/.exec(query.get('X-Amz-Date') ?? '');
	const expires = Number(query.get('X-Amz-Expires'));
	if (!date || !expires) return false;
	return Date.now() >= Date.UTC(+date[1], +date[2] - 1, +date[3], +date[4], +date[5], +date[6]) + expires * 1000;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Uploads `file` as mezon-streaming-server's docs/protocol/file-ingest.md asks; resolves once the original is stored.
 * `onSent` runs whenever the ingest holds every byte, before the wait for the original to be stored.
 */
export async function uploadToFileIngest(
	file: Blob,
	presignedUrl: string,
	ingestUrl: string,
	onProgress?: (fraction: number) => void,
	onSent?: () => void
): Promise<void> {
	const size = file.size;
	const moov = await moovAfterMdat(file);
	let status: FileIngestStatus | undefined;
	let retries = 0;

	const put = ([first, last]: ByteRange) =>
		fetch(ingestUrl, {
			method: 'PUT',
			headers: { 'Content-Range': `bytes ${first}-${last}/${size}` },
			body: file.slice(first, last + 1),
			credentials: 'omit'
		}).catch(() => undefined);
	const getStatus = async (delayMs: number) => {
		await wait(delayMs);
		return fetch(ingestUrl, { credentials: 'omit', cache: 'no-store' }).catch(() => undefined);
	};
	const accept = async (response: Response) => {
		status = (await response.json()) as FileIngestStatus;
		onProgress?.((status.received ?? []).reduce((held, [from, to]) => held + to - from + 1, 0) / size);
	};
	const restart = () => {
		if (isPresignedUrlExpired(presignedUrl)) throw new Error('The file ingest lost the upload and its URL expired');
		status = undefined;
		onProgress?.(0);
	};
	const fail = (response: Response) => new Error(`The file ingest answered ${response.status}`);

	for (;;) {
		const chunk = nextFileIngestChunk(size, status?.received ?? [], moov);
		if (!chunk) onSent?.();
		if (!chunk && status?.stored) return;
		const response = chunk ? await put(chunk) : await getStatus(STATUS_POLL_MS);
		if (response?.status === 200) {
			await accept(response);
			retries = 0;
			continue;
		}
		if (chunk && (response?.status === 403 || (!status && (response?.status === 503 || response?.status === 413)))) {
			if (!(await uploadFileToPath(presignedUrl, file, size))) throw new Error('The direct upload failed');
			return;
		}
		if (!chunk && response?.status === 404) {
			restart();
			continue;
		}
		if (response && !RETRY_STATUSES.has(response.status)) throw fail(response);
		for (;;) {
			if (retries >= RETRY_DELAYS_MS.length) throw new Error('The file ingest is unreachable');
			const answer = await getStatus(RETRY_DELAYS_MS[retries++]);
			if (answer?.status === 200) {
				await accept(answer);
				break;
			}
			if (answer?.status === 404) {
				restart();
				break;
			}
			if (answer && !RETRY_STATUSES.has(answer.status)) throw fail(answer);
		}
	}
}
