import { getFileIngestUrl, isFileIngestCandidate, uploadFileToPath, uploadToFileIngest } from '@mezon/transport';
import type { ApiMessageAttachment, ApiMessageMention, ApiSession, Client } from 'mezon-js';
import type { IMessageSendPayload } from '../types';
import { AttachmentTypeUpload, ETypesCDN } from '../types';
import { isMezonMediaUrl, isTenorUrl } from './urlSanitization';
import { wantsHlsTranscode } from './videoSource';

type PreparedAttachment = ApiMessageAttachment & { uploadPath?: string; uploadName?: string; ingestUrl?: string };

export function getPresignUploadKey(uploadName?: string): string | undefined {
	return uploadName?.split('/').pop()?.split('.')[0];
}

export function getPresignIngestKeys(attachments: PreparedAttachment[] = []): string[] {
	return attachments.flatMap((attachment) => {
		const key = getPresignUploadKey(attachment.uploadName);
		return key && attachment.ingestUrl ? [key] : [];
	});
}

export async function putAttachmentFile(
	attachment: PreparedAttachment,
	file: Blob,
	presignedUrl: string,
	onProgress?: (key: string, fraction: number) => void,
	onSent?: () => void
): Promise<boolean> {
	const { ingestUrl } = attachment;
	if (!ingestUrl) return Boolean(await uploadFileToPath(presignedUrl, file, file.size));
	const key = getPresignUploadKey(attachment.uploadName);
	await uploadToFileIngest(file, presignedUrl, ingestUrl, (fraction) => key && onProgress?.(key, fraction), onSent);
	return true;
}

export async function generatePathAttachments(
	client: Client,
	session: ApiSession,
	attachments: Array<ApiMessageAttachment>,
	channelId?: string,
	ingest = false
) {
	const result = await Promise.all(
		attachments.map(async (attach) => {
			const nonDirectAttachments = !isTenorUrl(attach.url) && !isMezonMediaUrl(attach.url);

			if (!nonDirectAttachments) {
				return attach;
			}
			try {
				const fileType = attach.filetype?.includes(AttachmentTypeUpload.image)
					? AttachmentTypeUpload.image
					: attach.filetype?.includes(AttachmentTypeUpload.video)
						? AttachmentTypeUpload.video
						: attach.filetype?.includes(AttachmentTypeUpload.audio)
							? AttachmentTypeUpload.audio
							: AttachmentTypeUpload.doc;
				const uploadName = (attach.filename || '').replace(/[^a-zA-Z0-9.]/g, '_');
				const data = await client.uploadAttachmentFile(session, {
					filename: uploadName,
					filetype: fileType,
					size: attach.size,
					width: attach.width,
					height: attach.height,
					channel_id: channelId,
					transcode_hls:
						wantsHlsTranscode(uploadName) &&
						!(ingest && isFileIngestCandidate({ type: fileType, name: attach.filename, size: attach.size }))
				});
				// The poster is uploaded HERE, before the message is posted, and its url
				// is published only once the object is actually on the CDN. It used to
				// ride along after the main file, with its result thrown away — so a
				// failed poster PUT left every client pointing at an object that was
				// never written, and one imgproxy miss on that url is cached for a
				// week. It is a few tens of kilobytes; paying for it up front is what
				// makes the url on the wire a promise the sender has already kept.
				let thumbnail;
				const thumbnailBlob = (attach as File & { _thumbnailBlob?: Blob })?._thumbnailBlob;
				if (attach.filetype?.startsWith('video') && thumbnailBlob) {
					const ms = Date.now();
					const filename = `${ms}_thumbnail.png`;
					const presignedThumbnail = await client.uploadAttachmentFile(session, {
						filename,
						filetype: thumbnailBlob.type,
						size: thumbnailBlob.size,
						channel_id: channelId
					});
					if (presignedThumbnail?.url && (await uploadFileToPath(presignedThumbnail.url, thumbnailBlob, thumbnailBlob.size))) {
						thumbnail = presignedThumbnail;
					}
				}

				return {
					...attach,
					filetype: fileType,
					filename: attach.filename,
					uploadName: data.filename,
					url: `${data.type_cdn === ETypesCDN.MEZON ? process.env.NX_MEZON_CDN_URL : process.env.NX_CLOUDFLARE_CDN_URL}/${data.filename}`,
					uploadPath: data.url,
					ingestUrl: ingest ? getFileIngestUrl(data.url, { type: fileType, name: attach.filename, size: attach.size }) : undefined,
					...(thumbnail &&
						thumbnail?.filename && {
							thumbnail: `${thumbnail?.type_cdn === ETypesCDN.MEZON ? process.env.NX_MEZON_CDN_URL : process.env.NX_CLOUDFLARE_CDN_URL}/${thumbnail.filename}`
						})
				};
			} catch (error) {
				console.error('error: ', error);
				throw error;
			}
		})
	);

	return result.filter((attachment) => Boolean(attachment) && attachment !== null) as (ApiMessageAttachment & {
		uploadPath?: string;
		thumbnail?: string;
		thumbnailUpload?: string;
		uploadName?: string;
		ingestUrl?: string;
	})[];
}

export type PendingUpload = {
	messageId: string;
	userId: string;
	clanId: string;
	channelId: string;
	mode: number;
	isPublic: boolean;
	content: IMessageSendPayload;
	mentions?: ApiMessageMention[];
	attachments: PreparedAttachment[];
	createTimeSeconds: number;
	aliveAt: number;
	presignFinish?: string[];
	files?: (Blob | undefined)[];
};

let pendingUploadDb: Promise<IDBDatabase> | undefined;

function pendingUploadRequest<T>(storeNames: string[], mode: IDBTransactionMode, run: (...stores: IDBObjectStore[]) => IDBRequest<T>): Promise<T> {
	pendingUploadDb ??= new Promise((resolve, reject) => {
		const request = indexedDB.open('mezon_pending_uploads', 1);
		request.onupgradeneeded = () => {
			request.result.createObjectStore('meta', { keyPath: 'messageId' });
			request.result.createObjectStore('files');
		};
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
	return pendingUploadDb.then(
		(db) =>
			new Promise<T>((resolve, reject) => {
				const transaction = db.transaction(storeNames, mode);
				const request = run(...storeNames.map((name) => transaction.objectStore(name)));
				transaction.oncomplete = () => resolve(request.result);
				transaction.onabort = () => reject(transaction.error);
			})
	);
}

export function savePendingUpload(upload: PendingUpload, files: (Blob | undefined)[]) {
	return Promise.all([
		pendingUploadRequest(['meta'], 'readwrite', (meta) => meta.put(upload)),
		pendingUploadRequest(['files'], 'readwrite', (store) => store.put(files, upload.messageId))
	]);
}

export function updatePendingUpload(messageId: string, changes: Partial<PendingUpload> = {}) {
	return pendingUploadRequest(changes.presignFinish ? ['meta', 'files'] : ['meta'], 'readwrite', (meta, files) => {
		files?.delete(messageId);
		const request = meta.get(messageId);
		request.onsuccess = () => request.result && meta.put({ ...request.result, ...changes, aliveAt: Date.now() });
		return request;
	});
}

export function deletePendingUpload(messageId: string) {
	return pendingUploadRequest(['meta', 'files'], 'readwrite', (meta, files) => {
		files.delete(messageId);
		return meta.delete(messageId);
	});
}

export function clearPendingUploads() {
	return pendingUploadRequest(['meta', 'files'], 'readwrite', (meta, files) => {
		files.clear();
		return meta.clear();
	});
}

export function getPendingUploads(): Promise<PendingUpload[]> {
	return pendingUploadRequest<PendingUpload[]>(['meta'], 'readonly', (meta) => meta.getAll());
}

export async function getPendingUpload(messageId: string): Promise<PendingUpload | undefined> {
	const upload = await pendingUploadRequest<PendingUpload | undefined>(['meta'], 'readonly', (meta) => meta.get(messageId));
	return (
		upload && {
			...upload,
			files: await pendingUploadRequest<(Blob | undefined)[] | undefined>(['files'], 'readonly', (files) => files.get(messageId))
		}
	);
}

export function holdPendingUploadLock(messageId: string): Promise<(() => void) | undefined> {
	if (typeof navigator === 'undefined' || !navigator.locks) return Promise.resolve(() => undefined);
	return new Promise((resolve) => {
		navigator.locks
			.request(`mezon_pending_upload_${messageId}`, { ifAvailable: true }, (lock) =>
				lock ? new Promise<void>((release) => resolve(release)) : resolve(undefined)
			)
			.catch(() => resolve(() => undefined));
	});
}
