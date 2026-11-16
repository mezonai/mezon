import type { ApiMessageAttachment, ApiSession, ApiUploadAttachment, Client } from 'mezon-js';
import type { MultipartUploadAttachmentPart } from 'mezon-js-protobuf';
export class CustomFile extends File {
	url?: string;
	width?: number;
	height?: number;
	thumbnail?: string;
	thumbnailBlob?: Blob;
	uploadPath?: string;
	thumbnailUpload?: string;
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
			const fileType = getUploadMimeType(file);

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

// Fall back to the file extension when the browser gives no mime type
function getUploadMimeType(file: File): string {
	if (file.type) {
		return file.type;
	}
	const fileNameParts = file.name.split('.');
	return `text/${fileNameParts[fileNameParts.length - 1].toLowerCase()}`;
}

function isRemoteUrl(url: string): boolean {
	return url.startsWith('http://') || url.startsWith('https://');
}

async function uploadThumbnailBlob(client: Client, session: ApiSession, blob: Blob, index?: number, channelId?: string): Promise<string | undefined> {
	try {
		const type = blob.type || 'image/jpeg';
		const ext = type.includes('png') ? 'png' : 'jpg';
		const { filePath, originalFilename } = createUploadFilePath(`thumb.${ext}`, index);
		const result = await uploadFile(
			client,
			session,
			filePath,
			getFileType(type),
			blob.size,
			blob,
			originalFilename,
			undefined,
			undefined,
			undefined,
			channelId
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
	channelId?: string
): Promise<string | undefined> {
	try {
		const response = await fetch(blobUrl);
		const blob = await response.blob();
		return uploadThumbnailBlob(client, session, blob, index, channelId);
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
	channelId?: string
): Promise<string | undefined> {
	if (!isVideo) {
		return file.thumbnail;
	}
	if (file.thumbnailBlob) {
		return uploadThumbnailBlob(client, session, file.thumbnailBlob, index, channelId);
	}
	const thumbnail = file.thumbnail;
	if (!thumbnail) {
		return undefined;
	}
	if (isRemoteUrl(thumbnail)) {
		return thumbnail;
	}
	if (thumbnail.startsWith('blob:')) {
		return uploadBlobThumbnail(client, session, thumbnail, index, channelId);
	}
	return thumbnail;
}

const MULTIPART_MIN_FILE_SIZE = 50 * 1024 * 1024;

const MULTIPART_PART_SIZE = 10 * 1024 * 1024;

function multipartPartCount(fileSize: number) {
	return Math.max(1, Math.floor((fileSize + MULTIPART_PART_SIZE - 1) / MULTIPART_PART_SIZE));
}

async function putFilePartToPresignedUrl(presignedUrl: string, partBytes: Blob, contentType: string) {
	const response = await fetch(presignedUrl, {
		method: 'PUT',
		headers: {
			'Content-Type': contentType
		},
		body: partBytes
	});

	if (!response.ok) {
		throw new Error(`File part upload failed (${response.status})`);
	}

	const etag = response.headers.get('ETag')?.trim()?.replace(/^"|"$/g, '');

	if (!etag) {
		throw new Error('File part upload missing ETag');
	}

	return etag;
}

type UploadMultipartParams = {
	file: Blob;
	urls: string[];
	partSize: number;
	mimeType: string;
};

export async function uploadMultipart({ file, urls, partSize, mimeType }: UploadMultipartParams): Promise<MultipartUploadAttachmentPart[]> {
	const partCount = urls.length;

	const results: MultipartUploadAttachmentPart[] = [];

	for (let index = 0; index < partCount; index++) {
		const offset = index * partSize;
		const end = index === partCount - 1 ? file.size : offset + partSize;

		const chunk = file.slice(offset, end);

		const etag = await putFilePartToPresignedUrl(urls[index], chunk, mimeType);

		results.push({
			part_number: index + 1,
			e_tag: etag
		});
	}

	return results.sort((a, b) => a.part_number - b.part_number);
}
export async function handleUploadFile(
	client: Client,
	session: ApiSession,
	filename: string,
	file: CustomFile,
	index?: number,
	channelId?: string
): Promise<ApiMessageAttachment> {
	// eslint-disable-next-line no-async-promise-executor
	return new Promise<ApiMessageAttachment>(async function (resolve, reject) {
		try {
			const fileType = getUploadMimeType(file);
			const shortFileType = getFileType(fileType);
			const { filePath, originalFilename } = createUploadFilePath(filename, index);
			const isVideo = fileType.startsWith('video/');

			if (isVideo) {
				const thumbPromise = resolveThumbnailForUpload(client, session, file, true, index, channelId);

				const videoPromise = uploadFile(
					client,
					session,
					filePath,
					shortFileType,
					file.size,
					file,
					originalFilename,
					file.width,
					file.height,
					undefined,
					channelId
				);
				const [thumbnail, videoResult] = await Promise.all([thumbPromise, videoPromise]);
				resolve({ ...videoResult, thumbnail: thumbnail ?? videoResult.thumbnail });
				return;
			}

			if (file.size > MULTIPART_MIN_FILE_SIZE) {
				const start = await client.multipartUploadAttachmentFile(session, {
					filename,
					filetype: file.type,
					height: file.height,
					size: file.size,
					width: file.width,
					part_count: multipartPartCount(file.size),
					channel_id: channelId
				});

				const uploadMultipartFiles = await uploadMultipart({
					file,
					urls: start.urls,
					partSize: MULTIPART_PART_SIZE,
					mimeType: file.type
				});

				const finish = await client.multipartUploadAttachmentFileFinish(session, {
					filename,
					parts: uploadMultipartFiles,
					upload_id: start.upload_id
				});

				resolve({
					url: filePath,
					size: file.size,
					filename,
					height: file.height,
					width: file.width
				});
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
					originalFilename,
					file.width,
					file.height,
					file.thumbnail,
					channelId
				)
			);
		} catch (error) {
			reject(new Error(`${error}`));
		}
	});
}

type PublicUploadOptions = { preserveContentType?: boolean };

export async function handleUploadPublicFile(
	client: Client,
	session: ApiSession,
	filename: string,
	file: CustomFile,
	options?: PublicUploadOptions
): Promise<ApiMessageAttachment> {
	const { filePath, originalFilename } = createUploadFilePath(filename);
	return uploadPublicFile(
		client,
		session,
		filePath,
		getFileType(getUploadMimeType(file)),
		file.size,
		file,
		originalFilename,
		file.width,
		file.height,
		options
	);
}

export function createUploadFilePath(filename: string, index?: number): { filePath: string; originalFilename: string } {
	const originalFilename = filename;
	// Append milliseconds timestamp to filename
	const ms = Date.now();
	filename = `${ms}_${index || ''}${filename}`;
	filename = filename.replace(/[^a-zA-Z0-9.]/g, '_');
	// Ensure valid clan and channel IDs

	const filePath = `${filename}`;
	return { filePath, originalFilename };
}

export async function uploadFileToPath(uploadPath: string, file: Blob, size: number) {
	try {
		const res = await uploadImageToMinIO(uploadPath, file, size);
		// fetch only rejects on a network-level failure — an expired presign (403)
		// or a bucket 5xx resolves like a success. The caller publishes the object
		// key on the strength of this return value, so a non-2xx has to read as a
		// failure; otherwise presign_finish names a key that was never written and
		// every viewer gets "Source is unreachable" from imgproxy, forever.
		// `handleUploadFile` in this same file already guards this way.
		if (!res.ok) {
			throw new Error(`Upload failed with status ${res.status}`);
		}
		return res;
	} catch (error) {
		console.error('error: ', error);
		return false;
	}
}

export async function uploadFile(
	client: Client,
	session: ApiSession,
	filename: string,
	type: string,
	size: number,
	buf: Blob,
	originalFilename?: string,
	width?: number,
	height?: number,
	thumbnail?: string,
	channelId?: string
): Promise<ApiMessageAttachment> {
	try {
		const data = await client.uploadAttachmentFile(session, {
			filename,
			filetype: type,
			size,
			width,
			height,
			channel_id: channelId
		});
		await putFileToPresignedUrl(data, buf, size);
		return {
			filename: originalFilename,
			url: `${data.type_cdn === 1 ? process.env.NX_MEZON_CDN_URL : process.env.NX_CLOUDFLARE_CDN_URL}/${data.filename}`,
			filetype: type,
			size,
			width,
			height,
			thumbnail
		};
	} catch (error) {
		throw new Error(`${error}`);
	}
}

/* eslint-disable no-console -- Development-only diagnostics for binary cover upload requests. */
export async function uploadPublicFile(
	client: Client,
	session: ApiSession,
	filename: string,
	type: string,
	size: number,
	buf: Blob,
	originalFilename?: string,
	width?: number,
	height?: number,
	options?: PublicUploadOptions
): Promise<ApiMessageAttachment> {
	const debugCover = options?.preserveContentType && process.env.NODE_ENV !== 'production';
	let stage = 'UploadOauthFile';
	try {
		const request = {
			filename,
			filetype: type,
			size,
			width,
			height
		};
		if (debugCover) console.info('[Profile cover upload] UploadOauthFile request (before protobuf)', JSON.stringify(request));
		const data = await client.uploadOauthFile(session, request);
		// The active session can upload to a different environment from the local build.
		const profileBase = options?.preserveContentType ? coverProfileReadBase(data.url) : process.env.NX_PROFILE_IMG_URL;
		const publicUrl = `${profileBase}/${data.filename}`;
		stage = 'PUT';
		if (debugCover) {
			console.info(
				'[Profile cover upload] UploadOauthFile response',
				JSON.stringify({
					filename: data.filename,
					pageOrigin: typeof window !== 'undefined' ? window.location.origin : undefined,
					uploadTarget: uploadUrlWithoutCredentials(data.url),
					publicUrl: uploadUrlWithoutCredentials(publicUrl)
				})
			);
		}
		// Cover validation checks Content-Type with HEAD. Other uploads retain their
		// existing header behavior for compatibility with their CORS configuration.
		const status = await putFileToPresignedUrl(data, buf, size, options?.preserveContentType ? type : undefined);
		if (debugCover) console.info('[Profile cover upload] PUT succeeded', JSON.stringify({ status }));
		return {
			filename: originalFilename,
			url: publicUrl,
			filetype: type,
			size,
			width,
			height
		};
	} catch (error) {
		if (options?.preserveContentType) {
			if (debugCover) {
				const failure = error as { code?: unknown; status?: unknown } | undefined;
				console.error(
					'[Profile cover upload] Failed',
					JSON.stringify({
						stage,
						errorType: error instanceof TypeError ? 'TypeError' : error instanceof Error ? 'Error' : typeof error,
						code: typeof failure?.code === 'number' ? failure.code : undefined,
						status: typeof failure?.status === 'number' ? failure.status : undefined
					})
				);
			}
			throw error;
		}
		throw new Error(`${error}`);
	}
}
/* eslint-enable no-console */

function coverProfileReadBase(uploadUrl?: string) {
	try {
		switch (new URL(uploadUrl || '').hostname) {
			case 'cdn-api.mezon.ai':
				return 'https://profile.mezon.ai';
			case 'cdn-api-dev.nccsoft.vn':
				return 'https://cdn-dev-profile.nccsoft.vn';
		}
	} catch {
		// Missing upload URLs are rejected by putFileToPresignedUrl below.
	}
	return process.env.NX_PROFILE_IMG_URL?.replace(/\/+$/, '');
}

function uploadUrlWithoutCredentials(value?: string) {
	try {
		const url = new URL(value || '');
		return `${url.origin}${url.pathname}`;
	} catch {
		return '(missing or invalid URL)';
	}
}

function coverUploadUrl(value: string) {
	if (process.env.NODE_ENV !== 'development' || typeof window === 'undefined' || window.location.hostname !== '127.0.0.1') return value;
	const url = new URL(value);
	const target = url.hostname === 'cdn-api.mezon.ai' ? 'production' : url.hostname === 'cdn-api-dev.nccsoft.vn' ? 'development' : undefined;
	return target ? `/profile-cover-upload/${target}${url.pathname}${url.search}` : value;
}

async function putFileToPresignedUrl(data: ApiUploadAttachment | undefined, buf: Blob, size: number, contentType?: string) {
	if (!data?.url) {
		throw new Error('Failed to upload file. URL not available.');
	}
	const res = contentType
		? await fetch(coverUploadUrl(data.url), { method: 'PUT', headers: { 'Content-Type': contentType }, body: buf, credentials: 'omit' })
		: await uploadImageToMinIO(data.url, buf, size);
	if (res.status !== 200) {
		const error = new Error('Failed to upload file to MinIO.');
		throw contentType ? Object.assign(error, { status: res.status }) : error;
	}
	return res.status;
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
