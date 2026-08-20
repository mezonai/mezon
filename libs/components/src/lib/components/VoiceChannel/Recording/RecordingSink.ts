import { getRecordingWindow, supportsDiskStreaming } from './capabilities';

/** RAM ceiling for the blob fallback — a long meeting must not take the tab down. */
export const BLOB_SINK_MAX_BYTES = 800 * 1024 * 1024;
/** Matching wall-clock cap so the user gets a warning long before the byte cap bites. */
export const BLOB_SINK_MAX_DURATION_MS = 30 * 60 * 1000;

export interface RecordingSink {
	readonly streaming: boolean;
	readonly fileName: string;
	readonly bytesWritten: number;
	write(chunk: Blob): void;
	/** Resolves once every queued chunk has landed. */
	finalize(): Promise<{ savedToDisk: boolean; bytes: number }>;
	abort(): Promise<void>;
}

/** Streams straight to a user-chosen file. No RAM growth, no duration limit. */
class FileSystemSink implements RecordingSink {
	readonly streaming = true;
	bytesWritten = 0;

	private queue: Promise<void> = Promise.resolve();
	private failed: Error | null = null;

	constructor(
		readonly fileName: string,
		private readonly writable: FileSystemWritableFileStream
	) {}

	write(chunk: Blob): void {
		if (this.failed || chunk.size === 0) return;
		this.bytesWritten += chunk.size;
		this.queue = this.queue.then(
			() =>
				this.writable.write(chunk).catch((error: Error) => {
					this.failed = error;
				}) as Promise<void>
		);
	}

	async finalize() {
		await this.queue;
		if (this.failed) {
			await this.abort();
			throw this.failed;
		}
		await this.writable.close();
		return { savedToDisk: true, bytes: this.bytesWritten };
	}

	async abort(): Promise<void> {
		try {
			await this.writable.abort();
		} catch {
			/* stream already gone */
		}
	}
}

/** Fallback for browsers without File System Access: buffer, then offer a download. */
class BlobSink implements RecordingSink {
	readonly streaming = false;
	bytesWritten = 0;

	private chunks: Blob[] = [];

	constructor(
		readonly fileName: string,
		private readonly mimeType: string
	) {}

	write(chunk: Blob): void {
		if (chunk.size === 0) return;
		this.chunks.push(chunk);
		this.bytesWritten += chunk.size;
	}

	async finalize() {
		const blob = new Blob(this.chunks, { type: this.mimeType });
		this.chunks = [];
		const bytes = blob.size;
		triggerDownload(URL.createObjectURL(blob), this.fileName);
		return { savedToDisk: false, bytes };
	}

	async abort(): Promise<void> {
		this.chunks = [];
	}
}

/**
 * Revoking releases the blob — which for a long recording is hundreds of megabytes
 * held in the tab until reload. The click is synchronous but the download itself is
 * not, and Safari cancels an in-flight download when its URL is revoked underneath
 * it, so the release is deferred rather than immediate.
 */
const DOWNLOAD_URL_TTL_MS = 60_000;

function triggerDownload(url: string, fileName: string): void {
	const anchor = document.createElement('a');
	anchor.href = url;
	anchor.download = fileName;
	anchor.rel = 'noopener';
	document.body.appendChild(anchor);
	anchor.click();
	anchor.remove();
	window.setTimeout(() => URL.revokeObjectURL(url), DOWNLOAD_URL_TTL_MS);
}

export class RecordingCancelledError extends Error {
	constructor() {
		super('recording-cancelled');
		this.name = 'RecordingCancelledError';
	}
}

/**
 * Must be called inside the click handler that starts the recording: the save
 * picker needs transient user activation.
 */
export async function createRecordingSink(fileName: string, mimeType: string, extension: string): Promise<RecordingSink> {
	const win = getRecordingWindow();

	if (win && supportsDiskStreaming() && win.showSaveFilePicker) {
		try {
			const handle = await win.showSaveFilePicker({
				suggestedName: fileName,
				types: [
					{
						description: extension === 'mp4' ? 'MPEG-4 video' : 'WebM video',
						accept: { [mimeType.split(';')[0]]: [`.${extension}`] }
					}
				]
			});
			const writable = await handle.createWritable();
			return new FileSystemSink(handle.name || fileName, writable);
		} catch (error) {
			if ((error as DOMException)?.name === 'AbortError') {
				throw new RecordingCancelledError();
			}
			console.warn('[recording] save picker unavailable, buffering in memory instead', error);
		}
	}

	return new BlobSink(fileName, mimeType);
}

export function buildRecordingFileName(channelLabel: string | undefined, extension: string): string {
	const now = new Date();
	const pad = (value: number) => String(value).padStart(2, '0');
	const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
	const safeLabel = (channelLabel || 'call')
		.normalize('NFKD')
		.replace(/[^\w\s-]/g, '')
		.trim()
		.replace(/\s+/g, '-')
		.slice(0, 40);
	return `mezon-${safeLabel || 'call'}-${stamp}.${extension}`;
}
