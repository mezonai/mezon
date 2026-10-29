import { getRecordingWindow, supportsDiskStreaming, supportsOriginPrivateFileSystem } from './capabilities';

export const BLOB_SINK_MAX_BYTES = 800 * 1024 * 1024;
export const BLOB_SINK_MAX_DURATION_MS = 30 * 60 * 1000;
export const OPFS_SINK_MAX_BYTES = 4 * 1024 * 1024 * 1024;
export const RECORDING_WRITE_TIMEOUT_MS = 15_000;

function withWriteTimeout<T>(operation: Promise<T>): Promise<T> {
	return new Promise((resolve, reject) => {
		const timer = window.setTimeout(() => reject(new Error('recording-write-timeout')), RECORDING_WRITE_TIMEOUT_MS);
		operation.then(resolve, reject).finally(() => window.clearTimeout(timer));
	});
}

function abortWritable(writable: FileSystemWritableFileStream | null): void {
	try {
		void writable?.abort().catch(() => undefined);
	} catch {
		console.error('Failed to abort writable');
	}
}

export interface RecordingSink {
	readonly streaming: boolean;
	readonly fileName: string;
	readonly bytesWritten: number;
	write(chunk: Blob): Promise<void>;
	finalize(): Promise<{ savedToDisk: boolean; bytes: number }>;
	abort(): Promise<void>;
}

class FileSystemSink implements RecordingSink {
	readonly streaming = true;
	bytesWritten = 0;

	private queue: Promise<void> = Promise.resolve();
	private failed: Error | null = null;

	constructor(
		readonly fileName: string,
		private readonly writable: FileSystemWritableFileStream
	) {}

	write(chunk: Blob): Promise<void> {
		if (this.failed) return Promise.reject(this.failed);
		if (chunk.size === 0) return Promise.resolve();
		const write = this.queue.then(async () => {
			if (this.failed) throw this.failed;
			await withWriteTimeout(this.writable.write(chunk));
			if (this.failed) throw this.failed;
			this.bytesWritten += chunk.size;
		});
		// Keep the queue settled while exposing failures to the recorder immediately.
		this.queue = write.catch((error: Error) => {
			this.failed = error;
		});
		return write;
	}

	async finalize() {
		await this.queue;
		if (this.failed) {
			await this.abort();
			throw this.failed;
		}
		try {
			await withWriteTimeout(this.writable.close());
		} catch (error) {
			await this.abort();
			throw error;
		}
		return { savedToDisk: true, bytes: this.bytesWritten };
	}

	async abort(): Promise<void> {
		this.failed ??= new Error('recording-aborted');
		abortWritable(this.writable);
	}
}

const OPFS_DIRECTORY = 'mezon-recordings';
const OPFS_FILE_PREFIX = '.mezon-recording-';
const OPFS_RECOVERY_RETENTION_MS = 24 * 60 * 60 * 1000;
const OPFS_STORAGE_RESERVE_BYTES = 64 * 1024 * 1024;
const OPFS_METADATA = '.metadata';
const OPFS_EXPORTED = '.exported';
const activeRecordings = new Set<string>();

async function availableStorageBytes(): Promise<number> {
	const { quota, usage } = await navigator.storage.estimate();
	if (quota === undefined || usage === undefined || !Number.isFinite(quota) || !Number.isFinite(usage)) {
		throw new Error('recording-storage-estimate-unavailable');
	}
	return Math.max(0, quota - usage);
}

async function holdRecordingLock(name: string): Promise<() => void> {
	if (!navigator.locks?.request) return () => undefined;
	let release: () => void = () => undefined;
	const held = new Promise<void>((resolve) => {
		release = resolve;
	});
	await new Promise<void>((resolve, reject) => {
		void navigator.locks
			.request(`${OPFS_DIRECTORY}/${name}`, async () => {
				resolve();
				await held;
			})
			.catch(reject);
	});
	return release;
}

class OriginPrivateFileSystemSink implements RecordingSink {
	readonly streaming = true;
	bytesWritten = 0;

	private queue: Promise<void> = Promise.resolve();
	private failed: Error | null = null;
	private accepting = true;
	private queuedBytes = 0;
	private writable: FileSystemWritableFileStream | null = null;
	private parts: FileSystemFileHandle[] = [];

	constructor(
		readonly fileName: string,
		private readonly mimeType: string,
		private readonly directory: FileSystemDirectoryHandle,
		private readonly root: FileSystemDirectoryHandle,
		private readonly maxBytes: number,
		private readonly releaseLock: () => void
	) {}

	write(chunk: Blob): Promise<void> {
		if (this.failed) return Promise.reject(this.failed);
		if (!this.accepting) return Promise.reject(new Error('recording-sink-closed'));
		if (chunk.size === 0) return Promise.resolve();

		const exceedsLimit = this.bytesWritten + this.queuedBytes + chunk.size > this.maxBytes;
		if (exceedsLimit) this.accepting = false;
		this.queuedBytes += chunk.size;
		const write = this.queue
			.then(async () => {
				if (this.failed) throw this.failed;
				if (exceedsLimit) throw new Error('recording-storage-limit');
				await withWriteTimeout(this.writePart(chunk));
			})
			.finally(() => {
				this.queuedBytes -= chunk.size;
			});
		this.queue = write.catch((error: Error) => {
			this.failed ??= error;
			abortWritable(this.writable);
		});
		return write;
	}

	private assertWritable(): void {
		if (this.failed) throw this.failed;
	}

	private async writePart(chunk: Blob): Promise<void> {
		const freeBytes = await availableStorageBytes();
		this.assertWritable();
		if (freeBytes < chunk.size + OPFS_STORAGE_RESERVE_BYTES) throw new Error('recording-storage-limit');
		const name = `${String(this.parts.length).padStart(8, '0')}.part`;
		const handle = await this.directory.getFileHandle(name, { create: true });
		this.assertWritable();
		const writable = await handle.createWritable();
		this.writable = writable;
		if (this.failed) {
			abortWritable(writable);
			throw this.failed;
		}
		await writable.write(chunk);
		this.assertWritable();
		await writable.close();
		this.assertWritable();
		this.writable = null;
		// OPFS commits only on close. Separate parts keep a failed write from losing earlier data.
		this.parts.push(handle);
		this.bytesWritten += chunk.size;
	}

	async finalize() {
		this.accepting = false;
		await this.queue;
		if (this.parts.length === 0) {
			await this.removeTemporaryFiles();
			if (this.failed) throw this.failed;
			return { savedToDisk: false, bytes: 0 };
		}

		const files: File[] = [];
		for (const handle of this.parts) {
			files.push(await withWriteTimeout(handle.getFile()));
		}
		const blob = new Blob(files, { type: this.mimeType });
		triggerDownload(URL.createObjectURL(blob), this.fileName);
		// Keep File snapshots readable during download. The next app load removes marked exports.
		try {
			await withWriteTimeout(this.directory.getFileHandle(OPFS_EXPORTED, { create: true }));
		} catch (error) {
			console.warn('[recording] could not mark exported recording for cleanup', error);
		}
		return { savedToDisk: false, bytes: this.bytesWritten };
	}

	async abort(): Promise<void> {
		this.accepting = false;
		this.failed ??= new Error('recording-aborted');
		abortWritable(this.writable);
		// Preserve committed data, including when export failed and the caller subsequently aborts.
		if (this.parts.length === 0) void this.removeTemporaryFiles();
	}

	private async removeTemporaryFiles(): Promise<void> {
		try {
			await withWriteTimeout(this.root.removeEntry(this.directory.name, { recursive: true }));
		} catch (error) {
			if ((error as DOMException)?.name !== 'NotFoundError') {
				console.warn('[recording] could not remove temporary recording', error);
			}
		} finally {
			activeRecordings.delete(this.directory.name);
			this.releaseLock();
		}
	}
}

async function removeExpiredRecordings(directory: FileSystemDirectoryHandle): Promise<void> {
	try {
		if (typeof directory.entries !== 'function') return;
		const entries: [string, FileSystemHandle][] = [];
		for await (const [name, entry] of directory.entries()) {
			if (name.startsWith(OPFS_FILE_PREFIX)) entries.push([name, entry]);
		}
		// Do not mutate the live iterator: some browsers otherwise skip the next entry.
		for (const [name, entry] of entries) {
			if (activeRecordings.has(name)) continue;
			try {
				if (navigator.locks?.request) {
					await navigator.locks.request(`${OPFS_DIRECTORY}/${name}`, { ifAvailable: true }, async (lock) => {
						if (lock) await removeExpiredEntry(directory, name, entry, true);
					});
				} else {
					await removeExpiredEntry(directory, name, entry, false);
				}
			} catch (error) {
				if ((error as DOMException)?.name !== 'NotFoundError') console.warn('[recording] could not clean recording', error);
			}
		}
	} catch (error) {
		console.warn('[recording] could not clean expired recordings', error);
	}
}

async function removeExpiredEntry(root: FileSystemDirectoryHandle, name: string, entry: FileSystemHandle, locked: boolean): Promise<void> {
	const cutoff = Date.now() - OPFS_RECOVERY_RETENTION_MS;
	if (entry.kind === 'file') {
		const file = await (entry as FileSystemFileHandle).getFile();
		if (file.lastModified < cutoff) await root.removeEntry(name);
		return;
	}
	const files: FileSystemFileHandle[] = [];
	let exported = false;
	for await (const [fileName, child] of (entry as FileSystemDirectoryHandle).entries()) {
		if (child.kind !== 'file') continue;
		files.push(child as FileSystemFileHandle);
		if (fileName === OPFS_EXPORTED) exported = true;
	}
	if ((exported || files.length === 0) && locked) {
		await root.removeEntry(name, { recursive: true });
		return;
	}
	if (files.length === 0) {
		const createdAt = Number(name.slice(OPFS_FILE_PREFIX.length).split('-')[0]);
		if (createdAt > 0 && createdAt < cutoff) await root.removeEntry(name, { recursive: true });
		return;
	}
	for (const handle of files) {
		if ((await handle.getFile()).lastModified >= cutoff) return;
	}
	await root.removeEntry(name, { recursive: true });
}

export async function cleanupRecordingStorage(): Promise<void> {
	if (!supportsOriginPrivateFileSystem()) return;
	try {
		const root = await navigator.storage.getDirectory();
		const directory = await root.getDirectoryHandle(OPFS_DIRECTORY);
		await removeExpiredRecordings(directory);
	} catch (error) {
		if ((error as DOMException)?.name !== 'NotFoundError') console.warn('[recording] could not clean recording storage', error);
	}
}

class BlobSink implements RecordingSink {
	readonly streaming = false;
	bytesWritten = 0;

	private chunks: Blob[] = [];

	constructor(
		readonly fileName: string,
		private readonly mimeType: string
	) {}

	async write(chunk: Blob): Promise<void> {
		if (chunk.size === 0) return;
		this.chunks.push(chunk);
		this.bytesWritten += chunk.size;
	}

	async finalize() {
		const blob = new Blob(this.chunks, { type: this.mimeType });
		const bytes = blob.size;
		triggerDownload(URL.createObjectURL(blob), this.fileName);
		this.chunks = [];
		return { savedToDisk: false, bytes };
	}

	async abort(): Promise<void> {
		this.chunks = [];
	}
}

const DOWNLOAD_URL_TTL_MS = 60_000;

function triggerDownload(url: string, fileName: string): void {
	let anchor: HTMLAnchorElement | null = null;
	try {
		anchor = document.createElement('a');
		anchor.href = url;
		anchor.download = fileName;
		anchor.rel = 'noopener';
		document.body.appendChild(anchor);
		anchor.click();
	} finally {
		anchor?.remove();
		window.setTimeout(() => URL.revokeObjectURL(url), DOWNLOAD_URL_TTL_MS);
	}
}

export class RecordingCancelledError extends Error {
	constructor() {
		super('recording-cancelled');
		this.name = 'RecordingCancelledError';
	}
}

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
			console.warn('[recording] save picker unavailable, trying browser storage instead', error);
		}
	}

	if (supportsOriginPrivateFileSystem()) {
		try {
			const freeBytes = await withWriteTimeout(availableStorageBytes());
			const maxBytes = Math.min(OPFS_SINK_MAX_BYTES, Math.floor((freeBytes - OPFS_STORAGE_RESERVE_BYTES) * 0.8));
			if (maxBytes <= 0) throw new Error('recording-storage-limit');
			const root = await navigator.storage.getDirectory();
			const directory = await root.getDirectoryHandle(OPFS_DIRECTORY, { create: true });
			const name = `${OPFS_FILE_PREFIX}${Date.now()}-${crypto.randomUUID()}`;
			const releaseLock = await holdRecordingLock(name);
			activeRecordings.add(name);
			try {
				const recording = await directory.getDirectoryHandle(name, { create: true });
				const metadata = await recording.getFileHandle(OPFS_METADATA, { create: true });
				const writable = await metadata.createWritable();
				try {
					await withWriteTimeout(writable.write(new Blob([JSON.stringify({ fileName, mimeType })], { type: 'application/json' })));
					await withWriteTimeout(writable.close());
				} catch (error) {
					abortWritable(writable);
					throw error;
				}
				const sink = new OriginPrivateFileSystemSink(fileName, mimeType, recording, directory, maxBytes, releaseLock);
				void removeExpiredRecordings(directory);
				return sink;
			} catch (error) {
				activeRecordings.delete(name);
				releaseLock();
				void directory.removeEntry(name, { recursive: true }).catch(() => undefined);
				throw error;
			}
		} catch (error) {
			console.warn('[recording] browser storage unavailable, buffering in memory instead', error);
		}
	}

	return new BlobSink(fileName, mimeType);
}

void cleanupRecordingStorage();

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
