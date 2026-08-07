import type { ApiMessageAttachment, ApiSession, Client } from 'mezon-js';
import { isMezonCdnUrl, isTenorUrl } from './urlSanitization';

export async function generatePathAttachments(client: Client, session: ApiSession, attachments: Array<ApiMessageAttachment>) {
	const result = await Promise.all(
		attachments.map(async (attach) => {
			const nonDirectAttachments = !isTenorUrl(attach.url) && !isMezonCdnUrl(attach.url);

			if (!nonDirectAttachments) {
				return attach;
			}
			try {
				const data = await client.uploadAttachmentFile(session, {
					filename: attach.filename,
					filetype: attach.filetype,
					size: attach.size,
					width: attach.width,
					height: attach.height
				});
				let thumbnail;
				if (attach.filetype?.startsWith('video') && (attach as File & { _thumbnailBlob?: Blob })?._thumbnailBlob) {
					const thumbnailBlob = (attach as File & { _thumbnailBlob?: Blob })._thumbnailBlob as Blob;
					const ms = Date.now();
					const filename = `${ms}_${attach.filename}`;
					thumbnail = await client.uploadAttachmentFile(session, {
						filename,
						filetype: thumbnailBlob.type,
						size: thumbnailBlob.size
					});
				}

				return {
					...attach,
					filename: data.filename,
					url: `${process.env.NX_BASE_IMG_URL}/${data.filename}`,
					uploadPath: data.url,
					...(thumbnail && { thumbnail })
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
	})[];
}
