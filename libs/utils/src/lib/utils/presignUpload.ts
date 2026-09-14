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
				const thumbnailBlob = (attach as File & { _thumbnailBlob?: Blob })?._thumbnailBlob;
				const isVideoWithThumbnail = Boolean(attach.filetype?.startsWith('video') && thumbnailBlob);
				const originalThumbnail = attach.thumbnail;
				const [data, thumbnail] = await Promise.all([
					client.uploadAttachmentFile(session, {
						filename: (attach.filename || '').replace(/[^a-zA-Z0-9.]/g, '_'),
						filetype: fileType,
						size: attach.size,
						width: attach.width,
						height: attach.height
					}),
					isVideoWithThumbnail && thumbnailBlob
						? (async () => {
								const ms = Date.now();
								const filename = `${ms}_thumbnail.png`;
								const presignedThumbnail = await client.uploadAttachmentFile(session, {
									filename,
									filetype: thumbnailBlob.type,
									size: thumbnailBlob.size
								});
								if (presignedThumbnail?.url && (await uploadFileToPath(presignedThumbnail.url, thumbnailBlob, thumbnailBlob.size))) {
									return presignedThumbnail;
								}
								return undefined;
							})()
						: Promise.resolve(undefined)
				]);

				return {
					...attach,
					filetype: fileType,
					filename: attach.filename,
					uploadName: data.filename,
					url: `${process.env.NX_BASE_IMG_URL}/${data.filename}`,
					uploadPath: data.url,
					...(originalThumbnail && originalThumbnail.startsWith('blob:') && { local_thumbnail: originalThumbnail }),
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
		local_thumbnail?: string;
	})[];
}
