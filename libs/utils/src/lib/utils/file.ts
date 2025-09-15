import type { Dispatch } from '@reduxjs/toolkit';
import type { ApiMessageAttachment } from 'mezon-js/api.gen';
import type { MentionItem } from 'react-mentions';
import { IMAGE_MAX_FILE_SIZE, MAX_FILE_SIZE, fileTypeImage } from '../constant';
import type { IMentionOnMessage, IRolesClan, IStartEndIndex, MentionDataProps, MentionReactInputProps, RequestInput } from '../types';

function createFileMetadata<T>(file: File): T {
	return {
		filename: file.name,
		filetype: file.type,
		size: file.size,
		url: URL.createObjectURL(file)
	} as T;
}

function processNonMediaFile<T>(file: File): Promise<T> {
	return Promise.resolve(createFileMetadata(file));
}

function processVideoFile<T>(file: File): Promise<T> {
	return new Promise((resolve) => {
		const video = document.createElement('video');
		video.onloadedmetadata = () => {
			resolve({
				...createFileMetadata(file),
				width: video.videoWidth,
				height: video.videoHeight
			} as T);
			URL.revokeObjectURL(video.src);
		};
		video.onerror = () => {
			resolve({
				...createFileMetadata(file)
			} as T);
			URL.revokeObjectURL(video.src);
		};
		video.src = URL.createObjectURL(file);
	});
}

function processImageFile<T>(file: File): Promise<T> {
	return new Promise((resolve) => {
		const reader = new FileReader();
		reader.onload = (event) => {
			const img = new Image();
			img.onload = async () => {
				const MAX_THUMB_IMG_SIZE = 40;
				const shouldShrinkPreview = Math.max(img.width, img.height) > MAX_THUMB_IMG_SIZE;
				const metadata = {
					...createFileMetadata(file),
					width: img.width,
					height: img.height
				} as T;

				if (shouldShrinkPreview) {
					try {
						const hash = await encodeImageToBlurhash(file);
						(metadata as any).thumbnail = hash;
					} catch (error) {
						console.error('Error generating blurhash:', error);
					}
				}
				resolve(metadata);
				URL.revokeObjectURL(img.src);
			};
			img.onerror = () => {
				resolve({
					...createFileMetadata(file)
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

async function encodeImageToBlurhash(file: File, maxSize = 32): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = async (event) => {
			try {
				const img = new Image();
				img.onload = async () => {
					try {
						const canvas = document.createElement('canvas');
						const ctx = canvas.getContext('2d');
						if (!ctx) {
							console.error('cannot init canvas');
							return;
						}
						const scale = maxSize / Math.max(img.width, img.height);
						const width = Math.round(img.width * scale);
						const height = Math.round(img.height * scale);

						canvas.width = width;
						canvas.height = height;
						ctx.drawImage(img, 0, 0, width, height);
						const imageData = ctx.getImageData(0, 0, width, height);

						if (typeof (window as any).blurhash === 'undefined') {
							const script = document.createElement('script');
							script.src = `${window.location.origin}/assets/js/blurhash.js`;
							script.onload = () => {
								(window as any).blurhash = module.exports;
								try {
									const hash = (window as any).blurhash.encode(imageData.data, width, height, 4, 3);
									resolve(hash);
								} catch (encodingError) {
									reject(encodingError);
								}
							};
							script.onerror = (err) => {
								reject(new Error('Failed to load blurhash.js'));
							};
							document.head.appendChild(script);
						} else {
							const hash = (window as any).blurhash.encode(imageData.data, width, height, 4, 3);
							resolve(hash);
						}
					} catch (error) {
						reject(error);
					}
				};

				img.onerror = () => {
					reject(new Error('Failed to load image'));
				};

				if (event.target?.result) {
					img.src = event.target.result as string;
				} else {
					reject(new Error('Failed to read file'));
				}
			} catch (error) {
				reject(error);
			}
		};

		reader.onerror = () => {
			reject(new Error('Failed to read file'));
		};

		reader.readAsDataURL(file);
	});
}
