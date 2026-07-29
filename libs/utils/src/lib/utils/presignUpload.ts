import type { ApiMessageAttachment, ApiSession, Client } from 'mezon-js';
import { isMezonCdnUrl, isTenorUrl } from './urlSanitization';

export async function generatePathAttachments(client: Client, session: ApiSession, attachments: Array<ApiMessageAttachment>) {
	const result = await Promise.all(
		attachments.map(async (attach) => {
			const nonDirectAttachments = !isTenorUrl(attach.url) && !isMezonCdnUrl(attach.url);

			if (!nonDirectAttachments) {
				return attach;
			}

			const data = await client.uploadAttachmentFile(session, {
				filename: attach.filename,
				filetype: attach.filetype,
				size: attach.size,
				width: attach.width,
				height: attach.height
			});

			return {
				...attach,
				filename: data.filename,
				url: `${process.env.NX_BASE_IMG_URL}/${data.filename}`,
				uploadPath: data.url
			};
		})
	);

	return result;
}
