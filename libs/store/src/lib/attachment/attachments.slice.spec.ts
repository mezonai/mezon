import type { IMessageWithUser } from '@mezon/utils';
import {
	ATTACHMENT_FEATURE_KEY,
	attachmentActions,
	attachmentReducer,
	buildTopicAttachmentList,
	initialAttachmentState,
	selectAttachmentListChannelId
} from './attachments.slice';

jest.mock('@mezon/logger', () => ({ captureSentryError: jest.fn() }), { virtual: true });
jest.mock(
	'@mezon/utils',
	() => ({
		AttachmentTypeUpload: { doc: 'doc' },
		EMimeTypes: { sticker: 'sticker' },
		ETypeLinkMedia: { IMAGE_PREFIX: 'image', VIDEO_PREFIX: 'video' },
		isMediaTypeNotSupported: jest.fn(() => false)
	}),
	{ virtual: true }
);
jest.mock('../helpers', () => ({
	ensureSession: jest.fn(),
	getMezonCtx: jest.fn()
}));

const makeMessage = (
	id: string,
	senderId: string,
	createTimeSeconds: number,
	attachments: Array<{ url?: string; filetype?: string; filename?: string }>
): IMessageWithUser =>
	({
		id,
		sender_id: senderId,
		create_time_seconds: createTimeSeconds,
		attachments
	}) as unknown as IMessageWithUser;

describe('buildTopicAttachmentList', () => {
	it('keeps only image and video attachments and skips stickers, documents, audio, missing filetype and empty urls', () => {
		const messages = [
			makeMessage('msg-1', 'user-1', 1700000001, [
				{ url: 'https://cdn.example.com/1.png', filetype: 'image/png', filename: '1.png' },
				{ url: 'https://cdn.example.com/2.mp4', filetype: 'video/mp4', filename: '2.mp4' },
				{ url: 'https://cdn.example.com/sticker.webp', filetype: 'sticker', filename: 'sticker.webp' },
				{ url: 'https://cdn.example.com/doc.pdf', filetype: 'application/pdf', filename: 'doc.pdf' },
				{ url: 'https://cdn.example.com/audio.mp3', filetype: 'audio/mpeg', filename: 'audio.mp3' },
				{ url: 'https://cdn.example.com/no-type', filename: 'no-type' },
				{ url: '', filetype: 'image/jpeg', filename: 'empty.jpg' },
				{ filetype: 'image/jpeg', filename: 'missing.jpg' }
			])
		];

		const result = buildTopicAttachmentList(messages);

		expect(result.map((att) => att.url)).toEqual(['https://cdn.example.com/2.mp4', 'https://cdn.example.com/1.png']);
	});

	it('returns newest message first and reverses an album order', () => {
		const messages = [
			makeMessage('msg-old', 'user-1', 1700000100, [{ url: 'https://cdn.example.com/origin.png', filetype: 'image/png' }]),
			makeMessage('msg-mid', 'user-2', 1700000200, [{ url: 'https://cdn.example.com/reply.jpg', filetype: 'image/jpeg' }]),
			makeMessage('msg-new', 'user-3', 1700000300, [
				{ url: 'https://cdn.example.com/album-a.png', filetype: 'image/png' },
				{ url: 'https://cdn.example.com/album-b.png', filetype: 'image/png' }
			])
		];

		const result = buildTopicAttachmentList(messages);

		expect(result.map((att) => att.url)).toEqual([
			'https://cdn.example.com/album-b.png',
			'https://cdn.example.com/album-a.png',
			'https://cdn.example.com/reply.jpg',
			'https://cdn.example.com/origin.png'
		]);
	});

	it('deduplicates repeated urls and populates id, message_id, uploader, create_time_seconds and create_time', () => {
		const messages = [
			makeMessage('msg-1', 'sender-a', 1700000000, [
				{ url: 'https://cdn.example.com/shared.png', filetype: 'image/png' },
				{ url: 'https://cdn.example.com/shared.png', filetype: 'image/png' }
			]),
			makeMessage('msg-2', 'sender-b', 1700000010, [
				{ url: 'https://cdn.example.com/shared.png', filetype: 'image/png' },
				{ url: 'https://cdn.example.com/unique.mp4', filetype: 'video/mp4' }
			])
		];

		const result = buildTopicAttachmentList(messages);

		expect(result).toEqual([
			{
				url: 'https://cdn.example.com/unique.mp4',
				filetype: 'video/mp4',
				id: 'msg-2_https://cdn.example.com/unique.mp4',
				message_id: 'msg-2',
				uploader: 'sender-b',
				create_time_seconds: 1700000010,
				create_time: new Date(1700000010 * 1000).toISOString()
			},
			{
				url: 'https://cdn.example.com/shared.png',
				filetype: 'image/png',
				id: 'msg-1_https://cdn.example.com/shared.png',
				message_id: 'msg-1',
				uploader: 'sender-a',
				create_time_seconds: 1700000000,
				create_time: new Date(1700000000 * 1000).toISOString()
			}
		]);
	});
});

describe('attachmentSlice listChannelId', () => {
	it('sets listChannelId and clears it when setOpenModalAttachment(false) is dispatched', () => {
		let state = attachmentReducer(initialAttachmentState, attachmentActions.setListChannelId('t'));
		expect(state.listChannelId).toBe('t');
		expect(selectAttachmentListChannelId({ [ATTACHMENT_FEATURE_KEY]: state })).toBe('t');

		state = attachmentReducer(state, attachmentActions.setOpenModalAttachment(true));
		expect(state.listChannelId).toBe('t');
		expect(selectAttachmentListChannelId({ [ATTACHMENT_FEATURE_KEY]: state })).toBe('t');

		state = attachmentReducer(state, attachmentActions.setOpenModalAttachment(false));
		expect(state.listChannelId).toBeUndefined();
		expect(selectAttachmentListChannelId({ [ATTACHMENT_FEATURE_KEY]: state })).toBeUndefined();
	});
});
