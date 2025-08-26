import { handleUploadFile } from '@mezon/transport';
import { fileTypeImage } from '@mezon/utils';
import { Client, Session } from 'mezon-js';
import Quill, { Delta } from 'quill';

export enum CanvasFormatType {
	PARAGRAPH = 'paragraph',
	HEADING_1 = '1',
	HEADING_2 = '2',
	HEADING_3 = '3',
	CHECKED_LIST = 'check',
	ORDERED_LIST = 'ordered',
	BULLET_LIST = 'bullet',
	BLOCKQUOTE = 'blockquote'
}

export enum QuillHeaderValue {
	HEADER_1 = 1,
	HEADER_2 = 2,
	HEADER_3 = 3
}

export enum QuillListValue {
	LIST_CHECKED = 'checked',
	LIST_UNCHECKED = 'unchecked',
	LIST_ORDERED = 'ordered',
	LIST_BULLET = 'bullet'
}

export enum QuillCodeBlockValue {
	PLAIN = 'plain'
}

interface HandlePasteParams {
	event: ClipboardEvent;
	quillRef: Quill | null;
	clientRef: React.MutableRefObject<Client | null>;
	sessionRef: React.MutableRefObject<Session | null>;
	currentClanId: string;
	currentChannelId: string;
}

interface PreventBase64ImagesParams {
	delta: Delta;
	oldDelta: Delta;
	source: string;
	quillRef: Quill | null;
}

export const handlePaste = async ({ event, quillRef, sessionRef, clientRef, currentClanId, currentChannelId }: HandlePasteParams): Promise<void> => {
	const items = event.clipboardData?.items;
	if (!items) return;

	if (!quillRef) return;

	let hasImage = false;

	for (let i = 0; i < items.length; i++) {
		const item = items[i];
		if (item.type.indexOf('image') !== -1) {
			hasImage = true;
			break;
		}
	}

	if (!hasImage) return;

	event.preventDefault();
	event.stopPropagation();

	for (let i = 0; i < items.length; i++) {
		const item = items[i];
		if (item.type.indexOf('image') === -1) continue;

		const file = item.getAsFile();
		if (!file) continue;

		const range = quillRef.getSelection(true);
		if (!range) continue;

		quillRef.insertText(range.index, 'Uploading image...', 'user');

		try {
			const url = await handleImagePaste({
				file,
				sessionRef,
				clientRef,
				currentClanId,
				currentChannelId
			});

			if (url) {
				quillRef.deleteText(range.index, 'Uploading image...'.length);
				quillRef.insertEmbed(range.index, 'image', url);
				quillRef.setSelection(range.index + 1, 0);
			} else {
				quillRef.deleteText(range.index, 'Uploading image...'.length);
				console.error('Failed to upload pasted image');
			}
		} catch (error) {
			quillRef.deleteText(range.index, 'Uploading image...'.length);
			console.error('Error handling pasted image:', error);
		}

		break;
	}
};

const handleImagePaste = async ({
	file,
	sessionRef,
	clientRef,
	currentClanId,
	currentChannelId
}: {
	file: File;
	sessionRef: React.MutableRefObject<Session | null>;
	clientRef: React.MutableRefObject<Client | null>;
	currentClanId: string;
	currentChannelId: string;
}): Promise<string | null> => {
	const session = sessionRef.current;
	const client = clientRef.current;

	if (!client || !session) {
		console.error('Client or session is not initialized');
		return null;
	}

	if (!fileTypeImage.includes(file.type)) {
		return null;
	}

	try {
		const attachment = await handleUploadFile(
			client,
			session,
			currentClanId,
			currentChannelId,
			file.name || `pasted-image-${Date.now()}.png`,
			file
		);
		return attachment.url || null;
	} catch (error) {
		console.error('Error uploading pasted image:', error);
		return null;
	}
};

export const preventBase64Images = ({ delta, oldDelta, source, quillRef }: PreventBase64ImagesParams): void => {
	if (source !== 'user') return;

	if (!quillRef) return;

	const ops = delta?.ops || [];
	let hasBase64Image = false;

	ops.forEach((op: any) => {
		if (!op.insert || typeof op.insert !== 'object') return;
		if (!op.insert.image) return;

		if (typeof op.insert.image === 'string' && op.insert.image.startsWith('data:')) {
			hasBase64Image = true;
		}
	});

	if (!hasBase64Image) return;

	if (quillRef) {
		quillRef.history.undo();
	}
};
