import { Buffer as BufferMobile } from 'buffer';
import type { Client, Session } from 'mezon-js';
import type { ApiMessageAttachment } from 'mezon-js/api.gen';

export class CustomFile extends File {
	url?: string;
	width?: number;
	height?: number;
	thumbnail?: string;
}

export const isValidUrl = (urlString: string) => {
	let url;
	try {
		url = new URL(urlString);
	} catch (e) {
		return false;
	}
	return url.protocol === 'https:' || url.protocol === 'http:';
};

export const isContainsUrl = (text: string): boolean => {
	if (!text) return false;
	return /(https?:\/\/[^\s]+)/.test(text);
};

export function uploadImageToMinIO(url: string, stream: Buffer, size: number) {
	return fetch(url, { method: 'PUT', body: stream });
}

export function uploadImageToMinIOMobile(url: string, stream: Buffer, type: string, size: number) {
	// Add header to upload success on mobile
	return fetch(url, {
		method: 'PUT',
		body: stream,
		headers: {
			'Content-Type': type,
			'Content-Length': size?.toString() || '1000'
		}
	});
}

export async function handleUploadEmoticon(client: Client, session: Session, filename: string, file: File): Promise<ApiMessageAttachment> {
	// eslint-disable-next-line no-async-promise-executor
	return new Promise<ApiMessageAttachment>(async function (resolve, reject) {
		try {
			let fileType = file.type;
			if (!fileType) {
				const fileNameParts = file.name.split('.');
				const fileExtension = fileNameParts[fileNameParts.length - 1].toLowerCase();
				fileType = `text/${fileExtension}`;
			}

			const buf = await file?.arrayBuffer();

			resolve(uploadFile(client, session, filename, fileType, file.size, Buffer.from(buf)));
		} catch (error) {
			reject(new Error(`${error}`));
		}
	});
}
const mimeTypeMap: Record<string, string> = {
	'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
	'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx'
};

function getFileType(mimeType: string): string {
	return mimeTypeMap[mimeType] || mimeType;
}

export async function handleUploadFile(
	client: Client,
	session: Session,
	currentClanId: string,
	currentChannelId: string,
	filename: string,
	file: CustomFile,
	index?: number,
	isOauth?: boolean
): Promise<ApiMessageAttachment> {
	// eslint-disable-next-line no-async-promise-executor
	return new Promise<ApiMessageAttachment>(async function (resolve, reject) {
		try {
			let fileType = file.type;
			if (!fileType) {
				const fileNameParts = file.name.split('.');
				const fileExtension = fileNameParts[fileNameParts.length - 1].toLowerCase();
				fileType = `text/${fileExtension}`;
			}
			const shortFileType = getFileType(fileType);
			const { filePath, originalFilename } = createUploadFilePath(session, currentClanId, currentChannelId, filename, false, index);
			const buf = await file?.arrayBuffer();

			resolve(
				uploadFile(
					client,
					session,
					filePath,
					shortFileType,
					file.size,
					Buffer.from(buf),
					false,
					originalFilename,
					file.width,
					file.height,
					file.thumbnail,
					isOauth
				)
			);
		} catch (error) {
			reject(new Error(`${error}`));
		}
	});
}

export async function handleUploadFileMobile(
	client: Client,
	session: Session,
	currentClanId: string,
	currentChannelId: string,
	filename: string,
	file: any,
	isOauth?: boolean
): Promise<ApiMessageAttachment> {
	// eslint-disable-next-line no-async-promise-executor
	return new Promise<ApiMessageAttachment>(async function (resolve, reject) {
		try {
			let fileType = file.type;
			if (!fileType) {
				const fileNameParts = file.name.split('.');
				const fileExtension = fileNameParts[fileNameParts.length - 1].toLowerCase();
				fileType = `text/${fileExtension}`;
			}
			if (file?.uri) {
				const arrayBuffer = BufferMobile.from(file.fileData, 'base64');
				if (!arrayBuffer) {
					console.error('Failed to read file data.');
					return;
				}
				const { filePath, originalFilename } = createUploadFilePath(session, currentClanId, currentChannelId, filename, true);
				resolve(
					uploadFile(
						client,
						session,
						filePath,
						fileType,
						file.size,
						arrayBuffer,
						true,
						originalFilename,
						file?.width,
						file?.height,
						'', // thumbnail
						isOauth
					)
				);
			}
		} catch (error) {
			reject(new Error(`${error}`));
		}
	});
}

export function createUploadFilePath(
	session: Session,
	currentClanId: string,
	currentChannelId: string,
	filename: string,
	isMobile: boolean,
	index?: number
): { filePath: string; originalFilename: string } {
	const originalFilename = filename;
	// Append milliseconds timestamp to filename
	const ms = Date.now();
	filename = isMobile ? ms + filename : `${ms}_${index || ''}${filename}`;
	filename = filename.replace(/[^a-zA-Z0-9.]/g, '_');
	// Ensure valid clan and channel IDs
	if (!currentClanId) {
		currentClanId = '0';
	}
	if (!currentChannelId) {
		currentChannelId = '0';
	}
	const filePath = `${currentClanId}/${currentChannelId}/${session.user_id}/${filename}`;
	return { filePath, originalFilename };
}

export async function uploadFile(
	client: Client,
	session: Session,
	filename: string,
	type: string,
	size: number,
	buf: Buffer,
	isMobile?: boolean,
	originalFilename?: string,
	width?: number,
	height?: number,
	thumbnail?: string,
	isOauth?: boolean
): Promise<ApiMessageAttachment> {
	// eslint-disable-next-line no-async-promise-executor
	return new Promise<ApiMessageAttachment>(async function (resolve, reject) {
		try {
			let fn = client.uploadAttachmentFile.bind(client);
			if (isOauth) {
				fn = client.uploadOauthFile.bind(client);
			}
			const data = await fn(session, {
				filename,
				filetype: type,
				size,
				width,
				height
			});
			if (!data?.url) {
				reject(new Error('Failed to upload file. URL not available.'));
				return;
			}
			const res = await (isMobile ? uploadImageToMinIOMobile(data.url || '', buf, type, size) : uploadImageToMinIO(data.url || '', buf, size));
			if (res.status !== 200) {
				throw new Error('Failed to upload file to MinIO.');
			}
			let url = `${process.env.NX_BASE_IMG_URL}/${filename}`;
			if (isOauth) {
				url = `${process.env.NX_PROFILE_IMG_URL}/${filename}`;
			}
			resolve({
				filename: originalFilename,
				url,
				filetype: type,
				size,
				width,
				height,
				thumbnail
			});
		} catch (error) {
			reject(new Error(`${error}`));
		}
	});
}

export async function handleUrlInput(url: string): Promise<ApiMessageAttachment> {
	if (!isValidUrl(url) || url.length >= 512) {
		throw new Error('Invalid URL or URL too long.');
	}

	try {
		const response = await fetch(url, { method: 'HEAD' });
		if (!response.ok) {
			throw new Error('URL not available.');
		}

		const contentSize = response.headers.get('Content-Length');
		const contentType = response.headers.get('Content-Type');

		if (!contentType || !contentType.startsWith('image/')) {
			throw new Error('URL is not an image.');
		}

		return {
			filename: `${Date.now()}_${contentType.replace('image/', '')}`,
			url,
			filetype: contentType,
			size: Number(contentSize) || 0,
			width: 0,
			height: 0
		};
	} catch (error) {
		throw new Error(error instanceof Error ? error.message : 'Failed to fetch URL.');
	}
}
