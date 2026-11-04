import { getFileIngestUrl, isFileIngestCandidate, uploadFileToPath, uploadToFileIngest } from '@mezon/transport';
import type { ApiMessageAttachment, ApiSession, Client } from 'mezon-js';
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
