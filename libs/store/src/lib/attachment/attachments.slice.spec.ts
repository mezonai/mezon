import type { IMessageWithUser } from '@mezon/utils';
import type { ApiMessageAttachment } from 'mezon-js';
import {
	ATTACHMENT_FEATURE_KEY,
	attachmentActions,
	attachmentReducer,
	buildTopicAttachmentList,
	initialAttachmentState,
	selectAllListAttachmentByChannel,
	selectAttachmentListChannelId
} from './attachments.slice';

jest.mock('@mezon/logger', () => ({ captureSentryError: jest.fn() }), { virtual: true });
jest.mock(
	'@mezon/utils',
	() => {
		const presignFinish = jest.requireActual('../../../../utils/src/lib/utils/presignFinish');
		return {
			AttachmentTypeUpload: { doc: 'doc' },
			EMimeTypes: { sticker: 'sticker', mp4: 'video/mp4', mov: 'video/quicktime' },
			ETypeLinkMedia: { IMAGE_PREFIX: 'image', VIDEO_PREFIX: 'video' },
			isMediaTypeNotSupported: jest.fn(() => false),
			filterExpiredPresignAttachments: presignFinish.filterExpiredPresignAttachments,
			getMessageCreateTimeSeconds: presignFinish.getMessageCreateTimeSeconds,
			isAttachmentPresignPendingForMessage: presignFinish.isAttachmentPresignPendingForMessage
		};
	},
	{ virtual: true }
);
jest.mock('../helpers', () => ({
	ensureSession: jest.fn(),
	getMezonCtx: jest.fn()
}));

const defaultPickMedia = (attachments: ApiMessageAttachment[]) =>
	attachments.filter(
		(attachment) => (attachment.filetype?.startsWith('image') || attachment.filetype?.startsWith('video')) && attachment.filetype !== 'sticker'
	);

const makeMessage = (
	id: string,
	senderId: string,
	createTimeSeconds: number | undefined,
	attachments: Array<{ url?: string; filetype?: string; filename?: string }>,
	extra: Partial<IMessageWithUser> = {}
): IMessageWithUser =>
	({
		id,
		sender_id: senderId,
		create_time_seconds: createTimeSeconds,
		attachments,
		...extra
	}) as unknown as IMessageWithUser;

describe('buildTopicAttachmentList', () => {
	it('uses pickMedia selection and skips empty or missing urls', () => {
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

		const result = buildTopicAttachmentList(messages, defaultPickMedia);

		expect(result.map((att) => att.url)).toEqual(['https://cdn.example.com/2.mp4', 'https://cdn.example.com/1.png']);
	});

	it('skips messages with isSending or isError', () => {
		const messages = [
			makeMessage('msg-sending', 'user-1', 1700000001, [{ url: 'https://cdn.example.com/sending.png', filetype: 'image/png' }], {
				isSending: true
			}),
			makeMessage('msg-error', 'user-2', 1700000002, [{ url: 'https://cdn.example.com/error.png', filetype: 'image/png' }], {
				isError: true
			}),
			makeMessage('msg-ok', 'user-3', 1700000003, [{ url: 'https://cdn.example.com/ok.png', filetype: 'image/png' }])
		];

		const result = buildTopicAttachmentList(messages, defaultPickMedia);

		expect(result.map((att) => att.id)).toEqual(['msg-ok_https://cdn.example.com/ok.png']);
	});

	it('drops expired presign attachments and skips active presign-pending attachments while keeping finished ones', () => {
		const nowSeconds = Math.floor(Date.now() / 1000);
		const messages = [
			makeMessage('msg-expired', 'user-1', 1000, [{ url: 'https://cdn.example.com/expired.png', filetype: 'image/png' }], {
				content: { presign_finish: [] } as unknown as IMessageWithUser['content']
			}),
			makeMessage(
				'msg-pending',
				'user-2',
				nowSeconds,
				[
					{ url: 'https://cdn.example.com/12345_pending.png', filetype: 'image/png' },
					{ url: 'https://cdn.example.com/67890_done.png', filetype: 'image/png' }
				],
				{ content: { presign_finish: ['67890_done'] } as unknown as IMessageWithUser['content'] }
			)
		];

		const result = buildTopicAttachmentList(messages, defaultPickMedia);

		expect(result.map((att) => att.id)).toEqual(['msg-pending_https://cdn.example.com/67890_done.png']);
	});

	it('resolves create_time_seconds and create_time via getMessageCreateTimeSeconds', () => {
		const isoTime = '2024-01-02T03:04:05.000Z';
		const expectedSeconds = Math.floor(new Date(isoTime).getTime() / 1000);
		const messages = [
			makeMessage('msg-iso', 'user-1', undefined, [{ url: 'https://cdn.example.com/iso.png', filetype: 'image/png' }], {
				create_time: isoTime
			}),
			makeMessage('msg-update', 'user-2', undefined, [{ url: 'https://cdn.example.com/upd.png', filetype: 'image/png' }], {
				update_time_seconds: 1700000500
			})
		];

		const result = buildTopicAttachmentList(messages, defaultPickMedia);

		expect(result[0]).toMatchObject({
			id: 'msg-update_https://cdn.example.com/upd.png',
			create_time_seconds: 1700000500,
			create_time: new Date(1700000500 * 1000).toISOString()
		});
		expect(result[1]).toMatchObject({
			id: 'msg-iso_https://cdn.example.com/iso.png',
			create_time_seconds: expectedSeconds,
			create_time: new Date(expectedSeconds * 1000).toISOString()
		});
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

		const result = buildTopicAttachmentList(messages, defaultPickMedia);

		expect(result.map((att) => att.url)).toEqual([
			'https://cdn.example.com/album-b.png',
			'https://cdn.example.com/album-a.png',
			'https://cdn.example.com/reply.jpg',
			'https://cdn.example.com/origin.png'
		]);
	});

	it('deduplicates by entity id rather than url and populates id, message_id, uploader, create_time_seconds and create_time', () => {
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

		const result = buildTopicAttachmentList(messages, defaultPickMedia);

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
				id: 'msg-2_https://cdn.example.com/shared.png',
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
	it('clears listChannelId on every setOpenModalAttachment call (open and close)', () => {
		let state = attachmentReducer(initialAttachmentState, attachmentActions.setListChannelId('t'));
		expect(state.listChannelId).toBe('t');
		expect(selectAttachmentListChannelId({ [ATTACHMENT_FEATURE_KEY]: state })).toBe('t');

		state = attachmentReducer(state, attachmentActions.setOpenModalAttachment(true));
		expect(state.listChannelId).toBeUndefined();
		expect(selectAttachmentListChannelId({ [ATTACHMENT_FEATURE_KEY]: state })).toBeUndefined();

		state = attachmentReducer(state, attachmentActions.setListChannelId('t'));
		expect(state.listChannelId).toBe('t');

		state = attachmentReducer(state, attachmentActions.setOpenModalAttachment(false));
		expect(state.listChannelId).toBeUndefined();
		expect(selectAttachmentListChannelId({ [ATTACHMENT_FEATURE_KEY]: state })).toBeUndefined();
	});

	it('returns topic attachments unfiltered by filetype when listChannelId matches channelId and filters otherwise', () => {
		const topicId = 'topic-1';
		const items = [
			{ id: '1', url: 'https://cdn.example.com/anim.gif', filetype: undefined },
			{ id: '2', url: 'https://cdn.example.com/clip.mkv', filetype: 'application/octet-stream' },
			{ id: '3', url: 'https://cdn.example.com/pic.png', filetype: 'image/png' }
		];

		let state = attachmentReducer(
			initialAttachmentState,
			attachmentActions.setChannelAttachments({
				channelId: topicId,
				attachments: items,
				hasMoreBefore: false,
				hasMoreAfter: false
			})
		);

		expect(selectAllListAttachmentByChannel({ [ATTACHMENT_FEATURE_KEY]: state }, topicId)?.map((att) => att.id)).toEqual(['3']);

		state = attachmentReducer(state, attachmentActions.setListChannelId(topicId));
		expect(selectAllListAttachmentByChannel({ [ATTACHMENT_FEATURE_KEY]: state }, topicId)?.map((att) => att.id)).toEqual(['1', '2', '3']);
	});
});
