import { uploadFileToPath } from '@mezon/transport';
import type { ApiMessageAttachment, ApiSession, Client } from 'mezon-js';
import { AttachmentTypeUpload } from '../types';
import { isMezonCdnUrl, isTenorUrl } from './urlSanitization';

export async function generatePathAttachments(client: Client, session: ApiSession, attachments: Array<ApiMessageAttachment>) {
	const result = await Promise.all(
		attachments.map(async (attach) => {
			const nonDirectAttachments = !isTenorUrl(attach.url) && !isMezonCdnUrl(attach.url);

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
				const data = await client.uploadAttachmentFile(session, {
					filename: (attach.filename || '').replace(/[^a-zA-Z0-9.]/g, '_'),
					filetype: fileType,
					size: attach.size,
					width: attach.width,
					height: attach.height
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
						size: thumbnailBlob.size
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
					url: `${process.env.NX_BASE_IMG_URL}/${data.filename}`,
					uploadPath: data.url,
					...(thumbnail && thumbnail?.filename && { thumbnail: `${process.env.NX_BASE_IMG_URL}/${thumbnail.filename}` })
				};
			} catch (error) {
				console.error('error: ', error);
				return null;
			}
		})
	);

	return result.filter((attachment) => Boolean(attachment) && attachment !== null) as (ApiMessageAttachment & {
		uploadPath?: string;
		thumbnail?: string;
		thumbnailUpload?: string;
		uploadName?: string;
	})[];
}
