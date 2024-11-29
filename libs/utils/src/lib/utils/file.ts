import { MentionItem } from 'react-mentions';
import { IMentionOnMessage, IRolesClan, MentionDataProps } from '../types';

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
			img.onload = () => {
				resolve({
					...createFileMetadata(file),
					width: img.width,
					height: img.height
				} as T);
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
	if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
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
