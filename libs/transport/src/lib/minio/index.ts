import type { ApiMessageAttachment, ApiSession, Client } from 'mezon-js';
import { mezonHttpProtobufCall, uploadAttachmentFileHttpRpc, uploadOauthFileHttpRpc } from '../mezonHttpRpc';
import { withSessionAuthRetry } from '../sessionAuthRetry';

export class CustomFile extends File {
	url?: string;
	width?: number;
	height?: number;
	thumbnail?: string;
	thumbnailBlob?: Blob;
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

function minioPresignedPutBody(stream: Blob): Blob {
	if (!stream.type) {
		return stream;
	}
	return new Blob([stream], { type: '' });
}

export function uploadImageToMinIO(url: string, stream: Blob, _size: number) {
	return fetch(url, { method: 'PUT', body: minioPresignedPutBody(stream) });
}

export function uploadImageToMinIOMobile(url: string, stream: Blob, _type: string, _size: number) {
	return fetch(url, { method: 'PUT', body: minioPresignedPutBody(stream) });
}

export async function handleUploadEmoticon(client: Client, session: ApiSession, filename: string, file: File): Promise<ApiMessageAttachment> {
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

			resolve(uploadFile(client, session, filename, fileType, file.size, new Blob([buf], { type: fileType })));
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

function isRemoteUrl(url: string): boolean {
	return url.startsWith('http://') || url.startsWith('https://');
}

async function uploadThumbnailBlob(client: Client, session: ApiSession, blob: Blob, index?: number, isOauth?: boolean): Promise<string | undefined> {
	try {
		const type = blob.type || 'image/jpeg';
		const ext = type.includes('png') ? 'png' : 'jpg';
		const { filePath, originalFilename } = createUploadFilePath(`thumb.${ext}`, false, index);
		const result = await uploadFile(
			client,
			session,
			filePath,
			getFileType(type),
			blob.size,
			blob,
			false,
			originalFilename,
			undefined,
			undefined,
			undefined,
			isOauth
		);
		return result.url;
	} catch {
		return undefined;
	}
}

async function uploadBlobThumbnail(
	client: Client,
	session: ApiSession,
	blobUrl: string,
	index?: number,
	isOauth?: boolean
): Promise<string | undefined> {
	try {
		const response = await fetch(blobUrl);
		const blob = await response.blob();
		return uploadThumbnailBlob(client, session, blob, index, isOauth);
	} catch {
		return undefined;
	}
}

async function resolveThumbnailForUpload(
	client: Client,
	session: ApiSession,
	file: CustomFile,
	isVideo: boolean,
	index?: number,
	isOauth?: boolean
): Promise<string | undefined> {
	if (!isVideo) {
		return file.thumbnail;
	}
	if (file.thumbnailBlob) {
		return uploadThumbnailBlob(client, session, file.thumbnailBlob, index, isOauth);
	}
	const thumbnail = file.thumbnail;
	if (!thumbnail) {
		return undefined;
	}
	if (isRemoteUrl(thumbnail)) {
		return thumbnail;
	}
	if (thumbnail.startsWith('blob:')) {
		return uploadBlobThumbnail(client, session, thumbnail, index, isOauth);
	}
	return thumbnail;
}

export async function handleUploadFile(
	client: Client,
	session: ApiSession,
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
			const { filePath, originalFilename } = createUploadFilePath(filename, false, index);
			const isVideo = fileType.startsWith('video/');

			if (isVideo) {
				const thumbPromise = resolveThumbnailForUpload(client, session, file, true, index, isOauth);
				const videoPromise = uploadFile(
					client,
					session,
					filePath,
					shortFileType,
					file.size,
					file,
					false,
					originalFilename,
					file.width,
					file.height,
					undefined,
					isOauth
				);
				const [thumbnail, videoResult] = await Promise.all([thumbPromise, videoPromise]);
				resolve({ ...videoResult, thumbnail: thumbnail ?? videoResult.thumbnail });
				return;
			}

			resolve(
				uploadFile(
					client,
					session,
					filePath,
					shortFileType,
					file.size,
					file,
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
	session: ApiSession,
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
				const binaryStr = atob(file.fileData);
				const bytes = new Uint8Array(binaryStr.length);
				for (let i = 0; i < binaryStr.length; i++) {
					bytes[i] = binaryStr.charCodeAt(i);
				}
				const blob = new Blob([bytes], { type: fileType });
				const { filePath, originalFilename } = createUploadFilePath(filename, true);
				resolve(
					uploadFile(
						client,
						session,
						filePath,
						fileType,
						file.size,
						blob,
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

export function createUploadFilePath(filename: string, isMobile: boolean, index?: number): { filePath: string; originalFilename: string } {
	const originalFilename = filename;
	// Append milliseconds timestamp to filename
	const ms = Date.now();
	filename = isMobile ? ms + filename : `${ms}_${index || ''}${filename}`;
	filename = filename.replace(/[^a-zA-Z0-9.]/g, '_');
	// Ensure valid clan and channel IDs

	const filePath = `${filename}`;
	return { filePath, originalFilename };
}

export async function uploadFile(
	client: Client,
	session: ApiSession,
	filename: string,
	type: string,
	size: number,
	buf: Blob,
	isMobile?: boolean,
	originalFilename?: string,
	width?: number,
	height?: number,
	thumbnail?: string,
	isOauth?: boolean
): Promise<ApiMessageAttachment> {
	const uploadRequest = {
		filename,
		filetype: type,
		size,
		width,
		height
	};
	const socketOpen = typeof client.isOpen === 'function' && client.isOpen();

	const doUpload = async (activeSession: ApiSession): Promise<ApiMessageAttachment> => {
		const data = socketOpen
			? await (isOauth ? client.uploadOauthFile(activeSession, uploadRequest) : client.uploadAttachmentFile(activeSession, uploadRequest))
			: await mezonHttpProtobufCall(
					activeSession,
					isOauth ? uploadOauthFileHttpRpc(uploadRequest) : uploadAttachmentFileHttpRpc(uploadRequest)
				);
		if (!data?.url) {
			throw new Error('Failed to upload file. URL not available.');
		}
		const res = await (isMobile ? uploadImageToMinIOMobile(data.url || '', buf, type, size) : uploadImageToMinIO(data.url || '', buf, size));
		if (res.status !== 200) {
			throw new Error('Failed to upload file to MinIO.');
		}
		let url = `${process.env.NX_BASE_IMG_URL}/${data.filename}`;
		if (isOauth) {
			url = `${process.env.NX_PROFILE_IMG_URL}/${data.filename}`;
		}
		return {
			filename: originalFilename,
			url,
			filetype: type,
			size,
			width,
			height,
			thumbnail
		};
	};

	if (socketOpen) {
		return doUpload(session);
	}
	return withSessionAuthRetry(session, doUpload);
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
