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
						: AttachmentTypeUpload.FILE;
				const data = await client.uploadAttachmentFile(session, {
					filename: (attach.filename || '').replace(/[^a-zA-Z0-9.]/g, '_'),
					filetype: fileType,
					size: attach.size,
					width: attach.width,
					height: attach.height
				});
				let thumbnail;
				if (attach.filetype?.startsWith('video') && (attach as File & { _thumbnailBlob?: Blob })?._thumbnailBlob) {
					const thumbnailBlob = (attach as File & { _thumbnailBlob?: Blob })._thumbnailBlob as Blob;
					const ms = Date.now();
					const filename = `${ms}_thumbnail.png`;
					thumbnail = await client.uploadAttachmentFile(session, {
						filename,
						filetype: thumbnailBlob.type,
						size: thumbnailBlob.size
					});
				}

				return {
					...attach,
					filetype: fileType,
					filename: attach.filename,
					uploadName: data.filename,
					url: `${process.env.NX_BASE_IMG_URL}/${data.filename}`,
					uploadPath: data.url,
					...(thumbnail && thumbnail?.filename && { thumbnail: `${process.env.NX_BASE_IMG_URL}/${thumbnail.filename}` }),
					...(thumbnail && thumbnail?.url && { thumbnailUpload: thumbnail.url })
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
