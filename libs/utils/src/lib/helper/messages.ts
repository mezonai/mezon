import { RE_LINK_TEMPLATE, SUPPORTED_AUDIO_CONTENT_TYPES, SUPPORTED_PHOTO_CONTENT_TYPES, SUPPORTED_VIDEO_CONTENT_TYPES } from '../types';

const RE_LINK = new RegExp(RE_LINK_TEMPLATE, 'i');

export function getAttachmentMediaType(attachment: any) {
	if (SUPPORTED_AUDIO_CONTENT_TYPES.has(attachment.mimeType)) {
		return 'audio';
	}

	if (attachment.shouldSendAsFile) return 'file';

	if (SUPPORTED_PHOTO_CONTENT_TYPES.has(attachment.mimeType)) {
		return 'photo';
	}

	if (SUPPORTED_VIDEO_CONTENT_TYPES.has(attachment.mimeType)) {
		return 'video';
	}

	return 'file';
}

export function matchLinkInMessageText(message: any) {
	const { text } = message.content;
	const match = text && text.text.match(RE_LINK);

	if (!match) {
		return undefined;
	}

	return {
		url: match[0],
		domain: match[3]
	};
}
