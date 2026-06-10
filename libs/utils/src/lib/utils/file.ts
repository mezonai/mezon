import type { Dispatch } from '@reduxjs/toolkit';
import type { ApiMessageAttachment } from 'mezon-js';
import { IMAGE_MAX_FILE_SIZE, MAX_FILE_SIZE, fileTypeImage } from '../constant';
import { captureVideoPosterFromUrl } from '../helper/videoPoster';
import type {
	IMentionOnMessage,
	IRolesClan,
	IStartEndIndex,
	MentionDataProps,
	MentionItem,
	MentionReactInputProps,
	PreSendMediaAttachment,
	RequestInput
} from '../types';

export const VIDEO_PROCESS_CONCURRENCY = 2;
export const FILE_PROCESS_CONCURRENCY = 4;

export const getImageExtension = (url?: string): string | undefined => {
	if (!url) return undefined;

	const match = url.match(/\.(jpg|jpeg|png|webp|avif|gif|svg|heic)$/i);
	return match ? `image/${match[1].toLowerCase()}` : undefined;
};

export function getPreSendSourceFile(attachment: ApiMessageAttachment): File | undefined {
	return (attachment as PreSendMediaAttachment)._sourceFile;
}

export function getPreSendThumbnailBlob(attachment: ApiMessageAttachment): Blob | undefined {
	return (attachment as PreSendMediaAttachment)._thumbnailBlob;
}

export function revokePreSendAttachmentUrls(attachment: ApiMessageAttachment): void {
	const att = attachment as PreSendMediaAttachment;
	if (att.url?.startsWith('blob:')) {
		URL.revokeObjectURL(att.url);
	}
	if (att.thumbnail?.startsWith('blob:')) {
		URL.revokeObjectURL(att.thumbnail);
	}
}

/** Strip in-memory pre-send fields before persisting on a message entity. */
export function toPublicMessageAttachments(attachments: ApiMessageAttachment[]): ApiMessageAttachment[] {
	return attachments.map((attachment) => {
		const { _sourceFile: _sf, _thumbnailBlob: _tb, ...publicAttachment } = attachment as PreSendMediaAttachment;
		return publicAttachment;
	});
}

function createFileMetadata<T>(file: File): T {
	const checkIsImage = getImageExtension(file.name);
	return {
		filename: file.name,
		filetype: checkIsImage || file.type,
		size: file.size,
		url: URL.createObjectURL(file)
	} as T;
}

function processNonMediaFile<T>(file: File): Promise<T> {
	return Promise.resolve({
		...createFileMetadata(file),
		_sourceFile: file
	} as T);
}

async function processVideoFile<T>(file: File): Promise<T> {
	const objectUrl = URL.createObjectURL(file);
	const metadata: PreSendMediaAttachment = {
		filename: file.name,
		filetype: getImageExtension(file.name) || file.type,
		size: file.size,
		url: objectUrl,
		_sourceFile: file
	};

	try {
		const capture = await captureVideoPosterFromUrl(objectUrl);
		if (capture.width && capture.height) {
			metadata.width = capture.width;
			metadata.height = capture.height;
		}
		if (capture.posterUrl) {
			metadata.thumbnail = capture.posterUrl;
		}
		if (capture.posterBlob) {
			metadata._thumbnailBlob = capture.posterBlob;
		}
	} catch {
		/* poster optional */
	}

	return metadata as T;
}

function processImageFile<T>(file: File): Promise<T> {
	return new Promise((resolve) => {
		const reader = new FileReader();
		reader.onload = (event) => {
			const img = new Image();
			img.onload = async () => {
				const metadata = {
					...createFileMetadata(file),
					width: img.width,
					height: img.height,
					_sourceFile: file
				} as T;

				resolve(metadata);
				URL.revokeObjectURL(img.src);
			};
			img.onerror = () => {
				resolve({
					...createFileMetadata(file),
					_sourceFile: file
				} as T);
				URL.revokeObjectURL(img.src);
			};
			if (event.target?.result) {
				img.src = event.target.result as string;
			}
		};
		reader.readAsDataURL(file);
	});
}

export function processFile<T>(file: File): Promise<T> {
	if (file.type.endsWith('adobe.photoshop') || (!file.type.startsWith('image/') && !file.type.startsWith('video/'))) {
		return processNonMediaFile(file);
	}

	if (file.type.startsWith('video/')) {
		return processVideoFile(file);
	}

	return processImageFile(file);
}

export async function processFilesForAttachment(files: File[]): Promise<ApiMessageAttachment[]> {
	if (files.length === 0) {
		return [];
	}

	const results: ApiMessageAttachment[] = new Array(files.length);
	const videoIndexes: number[] = [];
	const lightweightIndexes: number[] = [];

	files.forEach((file, index) => {
		if (file.type.startsWith('video/')) {
			videoIndexes.push(index);
		} else {
			lightweightIndexes.push(index);
		}
	});

	const runPool = async (indexes: number[], concurrency: number) => {
		let next = 0;
		const worker = async () => {
			while (next < indexes.length) {
				const index = indexes[next++];
				results[index] = await processFile<ApiMessageAttachment>(files[index]);
			}
		};
		await Promise.all(Array.from({ length: Math.min(concurrency, indexes.length) }, () => worker()));
	};

	await Promise.all([
		runPool(lightweightIndexes, FILE_PROCESS_CONCURRENCY),
		runPool(videoIndexes, VIDEO_PROCESS_CONCURRENCY)
	]);
	return results;
}

export function isMediaTypeNotSupported(mediaType?: string) {
	if (!mediaType) return false;

	const unsupportedMediaTypes = new Set([
		'video/x-ms-wmv',
		'video/wmv',
		'video/avi',
		'video/flv',
		'video/mkv',
		'video/rmvb',
		'audio/wma',
		'audio/ra',
		'audio/atrac',
		'image/tiff',
		'image/bmp',
		'image/psd'
	]);

	return unsupportedMediaTypes.has(mediaType);
}

export function isImageFile(file: File): boolean {
	return fileTypeImage.includes(file.type);
}

export function getMaxFileSize(file: File): number {
	return isImageFile(file) ? IMAGE_MAX_FILE_SIZE : MAX_FILE_SIZE;
}

export function isFileSizeExceeded(file: File): boolean {
	const maxSize = getMaxFileSize(file);
	return file.size > maxSize;
}

export function formatMentionsToString(array: MentionDataProps[]) {
	const mentionStrings = array.map((item) => `@[${item?.display?.replace('@', '')}](${item.id})`);
	return mentionStrings.join(' ');
}
export function getDisplayMention(array: MentionDataProps[]) {
	const mentionStrings = array.map((item) => `${item?.display}`);
	return mentionStrings.join(' ');
}
export function filterMentionsWithAtSign(array: MentionDataProps[]) {
	const seenIds = new Set<string>();

	return array.filter((item: MentionDataProps) => {
		if (item?.display?.startsWith('@') && !seenIds.has(item?.id as string)) {
			seenIds.add(item?.id as string);
			return true;
		}
		return false;
	});
}

export const convertMentionOnfile = (roles: IRolesClan[], contentString: string, ment: MentionItem[]): IMentionOnMessage[] => {
	const roleIds = new Set(roles.map((role) => role.id));
	const mentions: IMentionOnMessage[] = [];

	ment.forEach((mention) => {
		const { id, display } = mention;
		const startIndex = contentString.indexOf(display);
		if (startIndex !== -1) {
			const s = startIndex;
			const e = s + display.length;
			const isRole = roleIds.has(id);
			if (isRole) {
				mentions.push({ role_id: id, s, e });
			} else {
				mentions.push({ user_id: id, s, e });
			}
		}
	});

	return mentions;
};

type ExtractLinksParams = {
	text: string;
	links: IStartEndIndex[];
};

type HandleProcessTextAndLinksParams = {
	newPlainTextValue: string;
	currentDmOrChannelId: string | undefined;
	request: RequestInput;
	props: MentionReactInputProps;
	dispatch: Dispatch;
	setRequestInput: (request: RequestInput, isThread?: boolean) => void;
	links: IStartEndIndex[];
	processLinks: (extractedLinks: string[]) => Promise<ApiMessageAttachment[]>;
	referencesActions: any;
	hasAttachment: boolean;
};

export function extractLinks(text: string, links: IStartEndIndex[]) {
	return links.map((link) => text.slice(link.s, link.e));
}

export const handleProcessTextAndLinks = ({
	newPlainTextValue,
	currentDmOrChannelId,
	request,
	props,
	dispatch,
	setRequestInput,
	links,
	processLinks,
	referencesActions,
	hasAttachment
}: HandleProcessTextAndLinksParams): Promise<void> => {
	const extractedLinks: string[] = extractLinks(newPlainTextValue.trim(), links);
	const uniqueLinks: string[] = [...new Set(extractedLinks)];
	const onlyLink = (links[0]?.e && links[0]?.e - (links[0]?.s ?? 0)) === newPlainTextValue.trim().length;

	return processLinks(uniqueLinks)
		.then((attachmentUrls: ApiMessageAttachment[]) => {
			dispatch(
				referencesActions.replaceAttachments({
					channelId: currentDmOrChannelId ?? '',
					files: attachmentUrls
				})
			);

			if (links.length === 1 && onlyLink && attachmentUrls.length === 1 && !hasAttachment) {
				setRequestInput(
					{
						...request,
						valueTextInput: newPlainTextValue,
						content: '',
						mentionRaw: []
					},
					props.isThread
				);
			}
		})
		.catch((error) => {
			console.error('Cannot get images from link:', error);
		});
};
