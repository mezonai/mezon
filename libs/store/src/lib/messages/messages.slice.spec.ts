import {
	Direction_Mode,
	TypeMessage,
	deletePendingUpload,
	generatePathAttachments,
	getMessageCreateTimeSeconds,
	getPendingUpload,
	getPendingUploads,
	getPresignIngestKeys,
	getWebUploadedAttachments,
	holdPendingUploadLock,
	savePendingUpload,
	updatePendingUpload
} from '@mezon/utils';
import { configureStore } from '@reduxjs/toolkit';
import { ChannelStreamMode } from 'mezon-js';
import { toast } from 'react-toastify';
import { shouldForceApiCall } from '../cache-metadata';
import { ensureSocket } from '../helpers';
import { handleSendTopic } from '../topicDiscussion/topicDiscussions.slice';
import {
	addNewMessage,
	fetchMessages,
	fetchMessagesCached,
	jumpToMessage,
	loadMoreMessage,
	messagesActions,
	messagesReducer,
	resendMessage,
	selectAttachmentUploadProgress,
	selectHasMoreBottomByChannelId,
	selectHasMoreMessageByChannelId,
	selectMessageIsLoadingByChannelId,
	sendMessage
} from './messages.slice';

jest.mock('@mezon/logger', () => ({ captureSentryError: jest.fn() }));
jest.mock('@mezon/utils', () => ({
	...jest.requireActual('../../../../utils/src/lib/utils/clanChannel'),
	mergePresignFinishContent: jest.requireActual('../../../../utils/src/lib/utils/presignFinish').mergePresignFinishContent,
	TypeMessage: { Chat: 0, ChatUpdate: 1, ChatRemove: 2 },
	EMessageCode: { FIRST_MESSAGE: 4 },
	Direction_Mode: { BEFORE_TIMESTAMP: 3, AFTER_TIMESTAMP: 1, AROUND_TIMESTAMP: 2 },
	LIMIT_MESSAGE: 50,
	EBacktickType: {},
	EOgpType: {},
	createLocalPreviewUrl: jest.fn(() => 'blob:independent-preview'),
	generatePathAttachments: jest.fn(),
	getPresignIngestKeys: jest.fn(() => []),
	getPresignUploadKey: (uploadName?: string) => uploadName?.split('/').pop()?.split('.')[0],
	getWebUploadedAttachments: jest.fn(),
	getMessageCreateTimeSeconds: jest.fn(() => 1),
	getPreSendSourceFile: (attachment: { _sourceFile?: File }) => attachment._sourceFile,
	toPublicMessageAttachments: (attachments: { _sourceFile?: File }[]) => attachments.map(({ _sourceFile, ...attachment }) => attachment),
	savePendingUpload: jest.fn(async () => undefined),
	updatePendingUpload: jest.fn(async () => undefined),
	deletePendingUpload: jest.fn(async () => undefined),
	getPendingUploads: jest.fn(async () => []),
	getPendingUpload: jest.fn(async () => undefined),
	holdPendingUploadLock: jest.fn(async () => () => undefined),
	PRESIGN_PENDING_MAX_AGE_SEC: 600,
	withCreateTimeSecondsInUpdateContent: (content: unknown) => content,
	revokePreSendAttachmentUrls: jest.fn(),
	isFacebookLink: jest.fn(),
	isYouTubeLink: jest.fn(),
	isTikTokLink: jest.fn()
}));
jest.mock('mezon-js', () => ({
	safeJSONParse: JSON.parse,
	ChannelType: { CHANNEL_TYPE_CHANNEL: 1, CHANNEL_TYPE_GROUP: 2, CHANNEL_TYPE_DM: 3, CHANNEL_TYPE_THREAD: 7 },
	ChannelStreamMode: { STREAM_MODE_CHANNEL: 2, STREAM_MODE_GROUP: 3, STREAM_MODE_DM: 4, STREAM_MODE_THREAD: 6 }
}));
jest.mock('i18next', () => ({ t: (key: string) => key }));
jest.mock('react-toastify', () => ({ toast: { error: jest.fn() } }));
jest.mock('../account/account.slice', () => ({ selectAllAccount: () => ({ user: { id: 'user' } }) }));
jest.mock('../avatarOverride/avatarOverride', () => ({ getUserAvatarOverride: jest.fn(), getUserClanAvatarOverride: jest.fn() }));
jest.mock('../badge/badgeHelpers', () => ({}));
jest.mock('../badge/badgeService', () => ({}));
jest.mock('../cache-metadata', () => ({
	createCacheMetadata: () => ({}),
	createApiKey: (...args: string[]) => args.join('_'),
	shouldForceApiCall: jest.fn(() => true),
	markApiFirstCalled: jest.fn()
}));
jest.mock('../channels/channelmeta.slice', () => ({
	channelMetaActions: { setChannelLastSeenTimestamp: (payload: unknown) => ({ type: 'test/lastSeen', payload }) },
	selectDmLastSentMessage: () => undefined,
	selectLastSentMessageId: () => undefined
}));
jest.mock('../channels/channels.slice', () => ({
	selectShowScrollDownButton: () => false,
	channelsActions: { setScrollDownVisibility: (payload: unknown) => ({ type: 'test/scrollDown', payload }) }
}));
jest.mock('../clanProfile/clanProfile.slice', () => ({ selectUserClanProfileByClanID: () => () => undefined }));
jest.mock('../clans/clans.slice', () => ({ selectClanExists: () => () => true }));
jest.mock('../direct/direct.slice', () => ({}));
jest.mock('../e2ee/e2ee.slice', () => ({ checkE2EE: () => false }));
jest.mock('../threads/threads.slice', () => ({}));
jest.mock('../helpers', () => ({
	getMezonCtx: ({ extra }: { extra: { mezon: unknown } }) => extra.mezon,
	ensureSession: jest.fn(async (mezon: unknown) => mezon),
	ensureSocket: jest.fn(async (mezon: unknown) => mezon),
	withRetry: (request: (session: unknown) => unknown) => request({})
}));
jest.mock('./references.slice', () => ({
	selectOgpData: () => undefined,
	referencesActions: { clearOgpData: () => ({ type: 'test/clearOgp' }) }
}));

function deferred<T>() {
	let resolve!: (value: T) => void;
	let reject!: (error: Error) => void;
	const promise = new Promise<T>((resolvePromise, rejectPromise) => {
		resolve = resolvePromise;
		reject = rejectPromise;
	});
	return { promise, resolve, reject };
}

const attachment = { filename: 'photo.png', filetype: 'image/png', url: 'blob:original', size: 20, width: 200, height: 150 };
const prepared = { ...attachment, url: 'https://cdn.example/photo.png', uploadPath: 'https://upload.example/photo', uploadName: 'photo.png' };
const payload = { clanId: 'clan', channelId: 'channel', senderId: 'user', mode: 2, isPublic: true, content: {}, attachments: [attachment] };

function setup() {
	const client = {
		writeChatMessage: jest.fn().mockResolvedValue({ message_id: '900' }),
		sendChannelMessage: jest.fn(),
		sendChannelMessageApi: jest.fn().mockResolvedValue({ message_id: '901' }),
		updateChannelMessage: jest.fn().mockResolvedValue({}),
		listChannelMessages: jest.fn()
	};
	const mezon = { client, clientRef: { current: client }, sessionRef: { current: {} }, session: {} };
	const store = configureStore({
		reducer: {
			messages: messagesReducer,
			channels: () => ({ byClans: { clan: { currentChannelId: 'channel' } } }),
			clans: () => ({ currentClanId: 'clan' })
		},
		middleware: (defaults) => defaults({ thunk: { extraArgument: { mezon } }, serializableCheck: false })
	});
	return { store, client, mezon };
}

beforeEach(() => {
	jest.clearAllMocks();
	jest.mocked(shouldForceApiCall).mockReturnValue(true);
	jest.mocked(generatePathAttachments).mockResolvedValue([prepared]);
	jest.mocked(getWebUploadedAttachments).mockResolvedValue(['photo']);
});

const serverMessageId = (sequence: number) => (((BigInt(438845456274) + BigInt(sequence)) << BigInt(22)) | BigInt(4096)).toString();
const serverReply = (sequence: number) => ({
	id: serverMessageId(sequence),
	channel_id: 'topic',
	code: 0,
	content: { t: 'Reply' },
	create_time_seconds: sequence
});

it('recognizes complete topic history on a fresh store without a local creation marker', async () => {
	const { store, client } = setup();
	client.listChannelMessages.mockResolvedValue({ messages: [serverReply(1)], last_sent_message: { id: serverMessageId(1) } });
	await store.dispatch(fetchMessages({ clanId: 'clan', channelId: 'channel', topicId: 'topic', noCache: true, toPresent: true })).unwrap();
	expect(client.listChannelMessages).toHaveBeenCalledWith({}, 'clan', 'channel', '0', undefined, 50, 'topic');
	expect(store.getState().messages.channelViewPortMessageIds.topic).toEqual([serverMessageId(1)]);
	expect(selectHasMoreMessageByChannelId(store.getState() as any, 'topic')).toBe(false);
	expect(selectMessageIsLoadingByChannelId(store.getState() as any, 'topic')).toBe(false);
});

it.each([[150, 149, 101], [150]])('keeps older topic history available for sequence windows %s', async (...sequences) => {
	const { store, client } = setup();
	client.listChannelMessages.mockResolvedValue({ messages: sequences.map(serverReply), last_sent_message: { id: serverMessageId(150) } });
	await store.dispatch(fetchMessages({ clanId: 'clan', channelId: 'channel', topicId: 'topic', toPresent: true, noCache: true })).unwrap();
	expect(selectHasMoreMessageByChannelId(store.getState() as any, 'topic')).toBe(true);
	expect(selectMessageIsLoadingByChannelId(store.getState() as any, 'topic')).toBe(false);
});

it('scopes loaders to their topic and clears them after overlapping success and failure', () => {
	const { store } = setup();
	const topic = { clanId: 'clan', channelId: 'channel', topicId: 'topic' };
	const channel = { clanId: 'clan', channelId: 'channel' };
	store.dispatch(fetchMessages.pending('channel-fetch', channel));
	expect(selectMessageIsLoadingByChannelId(store.getState() as any, 'topic')).toBe(false);
	store.dispatch(fetchMessages.pending('topic-fetch', topic));
	store.dispatch(fetchMessages.pending('topic-fetch-2', topic));
	store.dispatch(fetchMessages.fulfilled({ messages: [] } as any, 'topic-fetch', topic));
	expect(selectMessageIsLoadingByChannelId(store.getState() as any, 'topic')).toBe(true);
	store.dispatch(fetchMessages.rejected(new Error('offline'), 'topic-fetch-2', topic));
	expect(selectMessageIsLoadingByChannelId(store.getState() as any, 'topic')).toBe(false);
	expect(selectMessageIsLoadingByChannelId(store.getState() as any, 'channel')).toBe(true);
});

it('does not return parent channel messages from a topic cache lookup', async () => {
	const { store, client, mezon } = setup();
	jest.mocked(shouldForceApiCall).mockReturnValue(false);
	store.dispatch(messagesActions.addOneMessage({ ...serverReply(1), channel_id: 'channel' } as any));
	client.listChannelMessages.mockResolvedValue({ messages: [serverReply(2)] });
	const result = await fetchMessagesCached(store.getState as any, mezon as any, 'clan', 'channel', '0', undefined, 'topic');
	expect(client.listChannelMessages).toHaveBeenCalled();
	expect(result.messages).toEqual([serverReply(2)]);
});

it.each([undefined, 'topic'])('inserts a placeholder before session or presign resolves in %s', async (topicId) => {
	const presign = deferred<(typeof prepared)[]>();
	jest.mocked(generatePathAttachments).mockReturnValue(presign.promise);
	const { store, client } = setup();
	const request = store.dispatch(sendMessage({ ...payload, topicId, anonymous: true }));
	const key = topicId || 'channel';
	const [id] = store.getState().messages.channelMessages[key].ids;
	expect(store.getState().messages.channelMessages[key].entities[id]).toMatchObject({
		isSending: true,
		attachments: [expect.objectContaining({ local_source: 'blob:independent-preview' })]
	});
	expect(client.writeChatMessage).not.toHaveBeenCalled();
	await Promise.resolve();
	expect(generatePathAttachments).toHaveBeenCalled();
	expect(store.getState().messages.channelViewPortMessageIds[key]).toEqual([id]);
	presign.resolve([prepared]);
	await request.unwrap();
	expect(store.getState().messages.channelMessages[key].ids).toEqual(['900']);
	expect(store.getState().messages.channelViewPortMessageIds[key]).toEqual(['900']);
	expect(store.getState().messages.queueSending).toEqual({});
	expect(store.getState().messages.channelMessages[key].entities['900'].isSending).toBe(false);
});

it('keeps a topic placeholder throughout upload and sends the real channel and topic IDs', async () => {
	const upload = deferred<string[]>();
	jest.mocked(getWebUploadedAttachments).mockReturnValue(upload.promise);
	const { store, client } = setup();
	const request = store.dispatch(handleSendTopic({ ...payload, topicId: 'topic' }));
	const [id] = store.getState().messages.channelMessages.topic.ids;
	await new Promise(setImmediate);
	expect(getWebUploadedAttachments).toHaveBeenCalled();
	expect(client.writeChatMessage).not.toHaveBeenCalled();
	expect(store.getState().messages.channelMessages.topic.entities[id].isSending).toBe(true);
	expect(store.getState().messages.channelMessages.channel).toBeUndefined();
	upload.resolve(['photo']);
	await request.unwrap();
	const args = client.writeChatMessage.mock.calls[0];
	expect(args[2]).toBe('channel');
	expect(args[13]).toBe('topic');
	expect(args[5]).not.toHaveProperty('presign_finish');
	expect(args[7][0]).not.toHaveProperty('uploadPath');
	expect(args[7][0]).not.toHaveProperty('local_source');
	expect(store.getState().messages.channelMessages.topic.entities['900']).toMatchObject({
		isSending: false,
		topic_id: 'topic',
		attachments: [expect.objectContaining({ url: prepared.url, local_source: 'blob:independent-preview' })]
	});
});

it.each([false, true])('keeps new topic history complete during the first send (attachment: %s)', async (withAttachment) => {
	const acknowledgement = deferred<{ message_id: string }>();
	const { store, client } = setup();
	client.writeChatMessage.mockReturnValue(acknowledgement.promise);
	const request = store.dispatch(
		handleSendTopic({
			...payload,
			content: { t: 'First reply' },
			attachments: withAttachment ? [attachment] : [],
			topicId: 'topic',
			isFirstTopicMessage: true
		})
	);
	const [id] = store.getState().messages.channelMessages.topic.ids;
	expect(store.getState().messages.firstMessageId.topic).toBe(id);
	expect(selectHasMoreMessageByChannelId(store.getState() as any, 'topic')).toBe(false);
	// Initial history can still be empty before the first reply reaches the server.
	store.dispatch(
		fetchMessages.fulfilled({ messages: [], toPresent: true } as any, 'fetch', {
			channelId: 'channel',
			clanId: 'clan',
			topicId: 'topic',
			toPresent: true
		})
	);
	expect(store.getState().messages.channelViewPortMessageIds.topic).toEqual([id]);
	expect(selectHasMoreMessageByChannelId(store.getState() as any, 'topic')).toBe(false);
	acknowledgement.resolve({ message_id: '900' });
	await request.unwrap();
	expect(store.getState().messages.firstMessageId.topic).toBe('900');
	expect(selectHasMoreMessageByChannelId(store.getState() as any, 'topic')).toBe(false);
	expect(selectHasMoreMessageByChannelId(store.getState() as any, 'channel')).toBe(true);
});

it('preserves the new topic history boundary after a failed first send is retried', async () => {
	const { store } = setup();
	jest.mocked(generatePathAttachments).mockRejectedValueOnce(new Error('offline'));
	await expect(store.dispatch(handleSendTopic({ ...payload, topicId: 'topic', isFirstTopicMessage: true })).unwrap()).rejects.toMatchObject({
		message: 'offline'
	});
	const [id] = store.getState().messages.channelMessages.topic.ids;
	expect(selectHasMoreMessageByChannelId(store.getState() as any, 'topic')).toBe(false);
	await store.dispatch(resendMessage({ channelId: 'topic', messageId: id })).unwrap();
	expect(store.getState().messages.firstMessageId.topic).toBe('900');
	expect(selectHasMoreMessageByChannelId(store.getState() as any, 'topic')).toBe(false);
});

it('does not assume an existing topic with uncached history has no older replies', async () => {
	const { store } = setup();
	await store.dispatch(handleSendTopic({ ...payload, topicId: 'existing-topic' })).unwrap();
	expect(selectHasMoreMessageByChannelId(store.getState() as any, 'existing-topic')).toBe(true);
});

it('keeps the caller message code on a topic send so a buzz reaches the topic', async () => {
	const { store, client } = setup();
	await store.dispatch(handleSendTopic({ ...payload, content: { t: 'Buzz' }, attachments: [], topicId: 'topic', code: 8 })).unwrap();
	const args = client.writeChatMessage.mock.calls[0];
	expect(args[12]).toBe(8);
	expect(args[13]).toBe('topic');
});

it.each(['presign', 'upload'])('marks a topic send as failed on %s failure and can retry it', async (stage) => {
	const { store, client } = setup();
	const failedStage = stage === 'presign' ? jest.mocked(generatePathAttachments) : jest.mocked(getWebUploadedAttachments);
	failedStage.mockRejectedValueOnce(new Error('offline'));
	await expect(store.dispatch(handleSendTopic({ ...payload, topicId: 'topic' })).unwrap()).rejects.toMatchObject({ message: 'offline' });
	const [id] = store.getState().messages.channelMessages.topic.ids;
	expect(store.getState().messages.channelMessages.topic.entities[id]).toMatchObject({
		isSending: false,
		isError: true,
		originalSendPayload: { channelId: 'channel', topicId: 'topic', attachments: [attachment] }
	});
	expect(client.writeChatMessage).not.toHaveBeenCalled();
	expect(store.getState().messages.queueSending).toEqual({});
	await store.dispatch(resendMessage({ channelId: 'topic', messageId: id })).unwrap();
	expect(store.getState().messages.channelMessages.topic.ids).toEqual(['900']);
});

it('keeps the optimistic topic row when the initial history fetch finishes', async () => {
	const presign = deferred<(typeof prepared)[]>();
	jest.mocked(generatePathAttachments).mockReturnValue(presign.promise);
	const { store } = setup();
	const request = store.dispatch(handleSendTopic({ ...payload, topicId: 'topic' }));
	const [id] = store.getState().messages.channelMessages.topic.ids;
	store.dispatch(
		fetchMessages.fulfilled(
			{
				messages: [{ id: '1', channel_id: 'topic', code: 0, content: {}, create_time_seconds: 1 } as any],
				toPresent: true
			} as any,
			'fetch',
			{ channelId: 'channel', clanId: 'clan', topicId: 'topic', toPresent: true }
		)
	);
	expect(store.getState().messages.channelMessages.topic.entities[id].isSending).toBe(true);
	expect(store.getState().messages.channelViewPortMessageIds.topic).toContain(id);
	presign.resolve([prepared]);
	await request.unwrap();
	expect(store.getState().messages.channelViewPortMessageIds.topic).toEqual(['1', '900']);
});

it('reconciles an acknowledgement without duplicate viewport IDs if an echo already arrived', () => {
	const { store } = setup();
	const message = { id: '1', channel_id: 'topic', code: 0, create_time_seconds: 1, isSending: true } as any;
	store.dispatch(messagesActions.addOneMessage(message));
	store.dispatch(messagesActions.addQueueSending('1'));
	store.dispatch(messagesActions.setViewportIds({ channelId: 'topic', viewportIds: ['1', '900'] }));
	store.dispatch(messagesActions.addOneMessage({ ...message, id: '900', isSending: false }));
	store.dispatch(messagesActions.confirmSentMessage({ channelId: 'topic', fakeId: '1', message: { ...message, id: '900', isSending: false } }));
	expect(store.getState().messages.channelMessages.topic.ids).toEqual(['900']);
	expect(store.getState().messages.channelViewPortMessageIds.topic).toEqual(['900']);
	expect(store.getState().messages.queueSending).toEqual({});
});

it('shows the channel placeholder before presign and retains upload gating after acknowledgement', async () => {
	const presign = deferred<(typeof prepared)[]>();
	const upload = deferred<string[]>();
	jest.mocked(generatePathAttachments).mockReturnValue(presign.promise);
	jest.mocked(getWebUploadedAttachments).mockReturnValue(upload.promise);
	const { store, client } = setup();
	const request = store.dispatch(sendMessage(payload));
	const [id] = store.getState().messages.channelMessages.channel.ids;
	expect(store.getState().messages.channelMessages.channel.entities[id].isSending).toBe(true);
	expect(client.writeChatMessage).not.toHaveBeenCalled();
	presign.resolve([prepared]);
	await new Promise(setImmediate);
	expect(client.writeChatMessage).toHaveBeenCalledTimes(1);
	expect(client.writeChatMessage.mock.calls[0][5]).toMatchObject({ presign_finish: [] });
	expect(store.getState().messages.channelMessages.channel.entities['900']).toMatchObject({
		content: { presign_finish: [] },
		attachments: [expect.objectContaining({ local_source: 'blob:independent-preview' })]
	});
	expect(client.updateChannelMessage).not.toHaveBeenCalled();
	upload.resolve(['photo']);
	await request.unwrap();
	await new Promise(setImmediate);
	expect(client.updateChannelMessage.mock.calls[0][5]).toBe('900');
	expect(JSON.parse(client.updateChannelMessage.mock.calls[0][6])).toMatchObject({ presign_finish: ['photo'] });
	expect(store.getState().messages.channelViewPortMessageIds.channel).toEqual(['900']);
	expect(client.writeChatMessage.mock.calls[0][5]).not.toHaveProperty('presign_ingest');
	expect(JSON.parse(client.updateChannelMessage.mock.calls[0][6])).not.toHaveProperty('presign_ingest');
});

describe('a video sent through the file ingest', () => {
	const video = { ...attachment, filename: 'clip.mp4', filetype: 'video/mp4' };
	const preparedVideo = {
		...prepared,
		filename: 'clip.mp4',
		filetype: 'video',
		url: 'https://cdn.example/1846031000000002001_clip.mp4',
		uploadName: '0000000000031031/1846031000000002001_clip.mp4'
	};
	const key = '1846031000000002001_clip';

	beforeEach(() => {
		jest.mocked(generatePathAttachments).mockImplementation(async (_client, _session, _attachments, _channelId, ingest) => [
			ingest ? { ...preparedVideo, ingestUrl: 'https://ingest.example/clip.mp4' } : preparedVideo
		]);
		jest.mocked(getPresignIngestKeys).mockImplementation((prepared = []) => (prepared.some((video) => 'ingestUrl' in video) ? [key] : []));
		jest.mocked(getWebUploadedAttachments).mockResolvedValue([key]);
	});

	it('is marked with presign_ingest next to presign_finish, on the message and on its presign_finish edit', async () => {
		const { store, client } = setup();
		await store.dispatch(sendMessage({ ...payload, content: { t: 'look' }, attachments: [video] })).unwrap();
		await new Promise(setImmediate);

		expect(jest.mocked(generatePathAttachments).mock.calls[0][4]).toBe(true);
		expect(client.writeChatMessage.mock.calls[0][5]).toEqual({ t: 'look', presign_finish: [], presign_ingest: [key] });
		expect(store.getState().messages.channelMessages.channel.entities['900'].content).toEqual({
			t: 'look',
			presign_finish: [],
			presign_ingest: [key]
		});
		expect(JSON.parse(client.updateChannelMessage.mock.calls[0][6])).toEqual({ t: 'look', presign_finish: [key], presign_ingest: [key] });
	});

	it.each([
		['topic', { topicId: 'topic' }],
		['thread', { mode: ChannelStreamMode.STREAM_MODE_THREAD }],
		['anonymous', { anonymous: true }]
	])('in a %s keeps the direct upload, done before the message is posted', async (_scope, extra) => {
		const upload = deferred<string[]>();
		jest.mocked(getWebUploadedAttachments).mockReturnValue(upload.promise);
		const { store, client } = setup();
		const request = store.dispatch(sendMessage({ ...payload, content: { t: 'look' }, attachments: [video], ...extra }));
		await new Promise(setImmediate);
		expect(jest.mocked(generatePathAttachments).mock.calls[0][4]).toBe(false);
		expect(getWebUploadedAttachments).toHaveBeenCalled();
		expect(client.writeChatMessage).not.toHaveBeenCalled();

		upload.resolve([key]);
		await request.unwrap();

		expect(client.writeChatMessage.mock.calls[0][5]).toEqual({ t: 'look' });
		expect(client.updateChannelMessage).not.toHaveBeenCalled();
	});

	it('reports the upload progress into the store until the upload ends', async () => {
		const upload = deferred<string[]>();
		jest.mocked(getWebUploadedAttachments).mockImplementation(async ({ onProgress }) => {
			onProgress?.(key, 0.25);
			onProgress?.(key, 1);
			return upload.promise;
		});
		const { store } = setup();
		const request = store.dispatch(sendMessage({ ...payload, attachments: [video] }));
		await new Promise(setImmediate);
		expect(selectAttachmentUploadProgress(store.getState() as any, key)).toBe(1);
		expect(selectAttachmentUploadProgress(store.getState() as any, undefined)).toBeUndefined();

		upload.resolve([key]);
		await request.unwrap();
		await new Promise(setImmediate);
		expect(selectAttachmentUploadProgress(store.getState() as any, key)).toBeUndefined();
		expect(store.getState().messages.attachmentUploadProgress).toEqual({});
	});

	it('keeps the upload finishing until its presign_finish edit is saved', async () => {
		const { store, client } = setup();
		const saved = deferred<unknown>();
		client.updateChannelMessage.mockReturnValue(saved.promise);
		await store.dispatch(sendMessage({ ...payload, attachments: [video] })).unwrap();
		await new Promise(setImmediate);
		expect(client.updateChannelMessage).toHaveBeenCalledTimes(1);
		expect(selectAttachmentUploadProgress(store.getState() as any, key)).toBe(1);

		saved.resolve({});
		await new Promise(setImmediate);
		expect(store.getState().messages.attachmentUploadProgress).toEqual({});
	});

	it('forgets the progress of a failed upload, drops it from disk and marks it failed', async () => {
		jest.mocked(getWebUploadedAttachments).mockImplementation(async ({ onProgress }) => {
			onProgress?.(key, 0.5);
			throw new Error('The file ingest answered 409');
		});
		jest.spyOn(console, 'error').mockImplementation(() => undefined);
		const { store, client } = setup();
		await store.dispatch(sendMessage({ ...payload, attachments: [video] })).unwrap();
		await new Promise(setImmediate);
		expect(store.getState().messages.attachmentUploadProgress).toEqual({});
		expect(deletePendingUpload).toHaveBeenCalledWith('900');
		expect(jest.mocked(deletePendingUpload).mock.invocationCallOrder[0]).toBeLessThan(client.updateChannelMessage.mock.invocationCallOrder[0]);
		expect(JSON.parse(client.updateChannelMessage.mock.calls[0][6])).toEqual({
			presign_finish: [],
			presign_ingest: [key],
			presign_failed: [key]
		});
	});

	it('keeps the marker through later edits, as it keeps presign_finish', async () => {
		const { store } = setup();
		await store.dispatch(sendMessage({ ...payload, content: { t: 'look' }, attachments: [video] })).unwrap();
		const edit = (content: unknown) =>
			store.dispatch(messagesActions.newMessage({ id: '900', channel_id: 'channel', code: 1, content, attachments: [preparedVideo] } as any));

		edit({ t: 'edited' });
		expect(store.getState().messages.channelMessages.channel.entities['900'].content).toEqual({
			t: 'edited',
			presign_finish: [],
			presign_ingest: [key]
		});

		edit({ t: 'edited', presign_finish: [key] });
		expect(store.getState().messages.channelMessages.channel.entities['900'].content).toEqual({
			t: 'edited',
			presign_finish: [key],
			presign_ingest: [key]
		});
	});
});

it('keeps the upload on disk until its presign_finish edit is saved', async () => {
	const file = new Blob(['photo']);
	jest.mocked(generatePathAttachments).mockResolvedValueOnce([{ ...prepared, _sourceFile: file } as typeof prepared]);
	const { store } = setup();
	await store.dispatch(sendMessage(payload)).unwrap();
	await new Promise(setImmediate);

	expect(savePendingUpload).toHaveBeenCalledWith(
		expect.objectContaining({ messageId: '900', channelId: 'channel', content: { presign_finish: [] }, attachments: [prepared] }),
		[file]
	);
	expect(updatePendingUpload).toHaveBeenCalledWith('900', { presignFinish: ['photo'] });
	expect(deletePendingUpload).toHaveBeenCalledWith('900');
});

it('patches presign_finish onto the message as the server holds it now, with its mentions', async () => {
	const { store, client } = setup();
	const mentions = [{ user_id: 'friend', s: 0, e: 7 }];
	client.listChannelMessages.mockResolvedValue({
		messages: [{ id: '900', content: JSON.stringify({ t: 'edited', presign_finish: [] }), mentions }]
	});
	await store.dispatch(sendMessage({ ...payload, content: { t: 'typo' } })).unwrap();
	await new Promise(setImmediate);

	expect(client.listChannelMessages).toHaveBeenCalledWith({}, 'clan', 'channel', '900', Direction_Mode.AFTER_TIMESTAMP, 1);
	expect(JSON.parse(client.updateChannelMessage.mock.calls[0][6])).toEqual({ t: 'edited', presign_finish: ['photo'] });
	expect(client.updateChannelMessage.mock.calls[0][7]).toBe(mentions);
});

it('waits for the socket before it patches presign_finish', async () => {
	const socket = deferred<unknown>();
	const { store, client, mezon } = setup();
	jest.mocked(ensureSocket)
		.mockImplementationOnce(async () => mezon as never)
		.mockImplementationOnce(async () => {
			await socket.promise;
			return mezon as never;
		});
	await store.dispatch(sendMessage(payload)).unwrap();
	await new Promise(setImmediate);
	expect(ensureSocket).toHaveBeenCalledTimes(2);
	expect(client.updateChannelMessage).not.toHaveBeenCalled();

	socket.resolve(undefined);
	await new Promise(setImmediate);
	expect(JSON.parse(client.updateChannelMessage.mock.calls[0][6])).toEqual({ presign_finish: ['photo'] });
});

it('heals a row that missed its presign_failed edit when the message is refetched', async () => {
	jest.mocked(getWebUploadedAttachments).mockRejectedValueOnce(new Error('The direct upload failed'));
	jest.spyOn(console, 'error').mockImplementation(() => undefined);
	const { store, client } = setup();
	await store.dispatch(sendMessage(payload)).unwrap();
	await new Promise(setImmediate);
	const failed = JSON.parse(client.updateChannelMessage.mock.calls[0][6]);
	expect(failed).toEqual({ presign_finish: [], presign_failed: ['photo'] });
	expect(store.getState().messages.channelMessages.channel.entities['900'].content).toEqual({ presign_finish: [] });

	client.listChannelMessages.mockResolvedValue({ messages: [{ id: '900', content: JSON.stringify(failed) }] });
	await store.dispatch(messagesActions.refreshPresignMessage({ clanId: 'clan', channelId: 'channel', messageId: '900' })).unwrap();

	expect(client.listChannelMessages).toHaveBeenLastCalledWith({}, 'clan', 'channel', '900', 1, 1, undefined);
	expect(store.getState().messages.channelMessages.channel.entities['900'].content).toEqual({ presign_finish: [], presign_failed: ['photo'] });
});

describe('an upload left behind by a closed tab', () => {
	const file = new Blob(['photo']);
	const pending = {
		messageId: '700',
		userId: 'user',
		clanId: 'clan',
		channelId: 'channel',
		mode: 2,
		isPublic: true,
		content: { t: 'look', presign_finish: [] },
		attachments: [prepared],
		createTimeSeconds: 1234,
		aliveAt: Date.now(),
		files: [file]
	};
	const resume = async (upload: Partial<typeof pending> & { presignFinish?: string[] }) => {
		const record = { ...pending, ...upload };
		jest.mocked(getPendingUploads).mockResolvedValueOnce([{ ...record, files: undefined }]);
		jest.mocked(getPendingUpload).mockImplementation(async (messageId) => (messageId === record.messageId ? record : undefined));
		const { store, client } = setup();
		await store.dispatch(messagesActions.resumePendingUploads()).unwrap();
		return client;
	};

	it('carries on uploading within ten minutes of the tab going away', async () => {
		jest.mocked(getMessageCreateTimeSeconds).mockReturnValueOnce(undefined);
		const client = await resume({ aliveAt: Date.now() - 9 * 60 * 1000 });

		expect(jest.mocked(getWebUploadedAttachments).mock.calls[0][0].attachments[0]).toMatchObject({ ...prepared, _sourceFile: file });
		expect(client.updateChannelMessage.mock.calls[0][5]).toBe('700');
		expect(JSON.parse(client.updateChannelMessage.mock.calls[0][6])).toEqual({ t: 'look', presign_finish: ['photo'] });
		expect(client.updateChannelMessage.mock.calls[0][9]).toBe(1234);
		expect(deletePendingUpload).toHaveBeenCalledWith('700');
	});

	it.each([
		['the tab has been gone ten minutes', { messageId: '701', aliveAt: Date.now() - 11 * 60 * 1000 }],
		['its file never reached the disk', { messageId: '702', files: undefined }]
	])('marks the upload failed when %s', async (_reason, upload) => {
		const client = await resume(upload);

		expect(getWebUploadedAttachments).not.toHaveBeenCalled();
		expect(JSON.parse(client.updateChannelMessage.mock.calls[0][6])).toEqual({ t: 'look', presign_finish: [], presign_failed: ['photo'] });
		expect(deletePendingUpload).toHaveBeenCalledWith(upload.messageId);
		expect(jest.mocked(deletePendingUpload).mock.invocationCallOrder[0]).toBeLessThan(client.updateChannelMessage.mock.invocationCallOrder[0]);
	});

	it.each([
		['still within ten minutes', { messageId: '706', aliveAt: Date.now() }, false],
		['gone over ten minutes', { messageId: '707', aliveAt: Date.now() - 11 * 60 * 1000 }, true],
		['saved before uploads were tied to a user', { messageId: '708', userId: undefined, aliveAt: 0 }, true]
	])('leaves an upload of another account alone, deleting it only once %s', async (_when, upload, deleted) => {
		const client = await resume({ ...upload, userId: 'userId' in upload ? upload.userId : 'someone-else' } as Partial<typeof pending>);

		expect(holdPendingUploadLock).not.toHaveBeenCalled();
		expect(getWebUploadedAttachments).not.toHaveBeenCalled();
		expect(client.updateChannelMessage).not.toHaveBeenCalled();
		expect(jest.mocked(deletePendingUpload).mock.calls).toEqual(deleted ? [[upload.messageId]] : []);
	});

	it('skips an upload that another tab finished while this one waited for the lock', async () => {
		jest.mocked(getPendingUploads).mockResolvedValueOnce([{ ...pending, messageId: '709' }]);
		jest.mocked(getPendingUpload).mockResolvedValue(undefined);
		const { store, client } = setup();
		await store.dispatch(messagesActions.resumePendingUploads()).unwrap();

		expect(getPendingUpload).toHaveBeenCalledWith('709');
		expect(getWebUploadedAttachments).not.toHaveBeenCalled();
		expect(client.updateChannelMessage).not.toHaveBeenCalled();
	});

	it('marks the upload failed when the resumed upload fails', async () => {
		jest.mocked(getWebUploadedAttachments).mockRejectedValueOnce(new Error('The direct upload failed'));
		const client = await resume({ messageId: '703' });

		expect(JSON.parse(client.updateChannelMessage.mock.calls[0][6])).toEqual({ t: 'look', presign_finish: [], presign_failed: ['photo'] });
	});

	it('only saves the edit of an upload that finished before the tab went away', async () => {
		const client = await resume({ messageId: '704', aliveAt: 0, presignFinish: ['photo'] });

		expect(getWebUploadedAttachments).not.toHaveBeenCalled();
		expect(JSON.parse(client.updateChannelMessage.mock.calls[0][6])).toEqual({ t: 'look', presign_finish: ['photo'] });
	});

	it('leaves an upload that another tab is still running', async () => {
		jest.mocked(holdPendingUploadLock).mockResolvedValueOnce(undefined);
		const client = await resume({ messageId: '705' });

		expect(getWebUploadedAttachments).not.toHaveBeenCalled();
		expect(client.updateChannelMessage).not.toHaveBeenCalled();
		expect(deletePendingUpload).not.toHaveBeenCalled();
	});
});

it('keeps the topic ID on the HTTP fallback', async () => {
	const { store, client } = setup();
	client.writeChatMessage.mockRejectedValue(new Error('socket disconnected'));
	client.sendChannelMessage.mockResolvedValue({ message_id: '901' });
	await store.dispatch(handleSendTopic({ ...payload, topicId: 'topic' })).unwrap();
	expect(client.sendChannelMessage.mock.calls[0][2]).toBe('channel');
	expect(client.sendChannelMessage.mock.calls[0][13]).toBe('topic');
	expect(store.getState().messages.channelMessages.topic.ids).toEqual(['901']);
});

it.each([undefined, 'topic'])('retains the video poster through metadata, ACK and upload completion in %s', async (topicId) => {
	const video = { ...attachment, filename: 'movie.mp4', filetype: 'video/mp4', thumbnail: 'blob:composer-poster' };
	const uploaded = { ...prepared, filename: video.filename, filetype: 'video', thumbnail: 'https://cdn.example/poster.png' };
	jest.mocked(generatePathAttachments).mockResolvedValue([uploaded]);
	const { store, client } = setup();
	const key = topicId || 'channel';
	await store.dispatch(handleSendTopic({ ...payload, attachments: [video], topicId: topicId as string })).unwrap();
	expect(store.getState().messages.channelMessages[key].entities['900'].attachments?.[0]).toMatchObject({
		thumbnail: uploaded.thumbnail,
		local_source: 'blob:independent-preview'
	});
	expect(client.writeChatMessage.mock.calls[0][7][0]).not.toHaveProperty('local_source');
	store.dispatch(
		messagesActions.newMessage({
			id: '900',
			channel_id: 'channel',
			topic_id: topicId,
			code: 1,
			content: { presign_finish: ['photo'] },
			attachments: [uploaded]
		} as any)
	);
	expect(store.getState().messages.channelMessages[key].entities['900'].attachments?.[0]).toMatchObject({
		thumbnail: uploaded.thumbnail,
		local_source: 'blob:independent-preview'
	});
	store.dispatch(
		messagesActions.newMessage({
			id: '900',
			channel_id: 'channel',
			topic_id: topicId,
			code: 1,
			content: {},
			attachments: [{ ...uploaded, url: 'https://cdn.example/replacement.mp4' }]
		} as any)
	);
	expect(store.getState().messages.channelMessages[key].entities['900'].attachments?.[0]).not.toHaveProperty('local_source');
});

it('keeps simultaneous topic uploads separate', async () => {
	const firstPresign = deferred<(typeof prepared)[]>();
	const secondPresign = deferred<(typeof prepared)[]>();
	jest.mocked(generatePathAttachments).mockReturnValueOnce(firstPresign.promise).mockReturnValueOnce(secondPresign.promise);
	const { store, client } = setup();
	client.writeChatMessage.mockResolvedValueOnce({ message_id: '901' }).mockResolvedValueOnce({ message_id: '902' });
	const first = store.dispatch(handleSendTopic({ ...payload, topicId: 'topic' }));
	const [firstId] = store.getState().messages.channelMessages.topic.ids;
	const second = store.dispatch(handleSendTopic({ ...payload, topicId: 'topic' }));
	const ids = store.getState().messages.channelMessages.topic.ids;
	expect(ids).toHaveLength(2);
	const secondId = ids.find((id) => id !== firstId) as string;
	firstPresign.resolve([prepared]);
	await first.unwrap();
	expect(store.getState().messages.channelMessages.topic.entities[secondId].isSending).toBe(true);
	expect(Object.keys(store.getState().messages.queueSending)).toEqual([secondId]);
	secondPresign.resolve([prepared]);
	await second.unwrap();
	expect(store.getState().messages.channelMessages.topic.ids).toEqual(['901', '902']);
	expect(store.getState().messages.channelViewPortMessageIds.topic).toEqual(['901', '902']);
	expect(store.getState().messages.queueSending).toEqual({});
});

it('does not suppress an own message in another channel while a topic upload is pending', async () => {
	const presign = deferred<(typeof prepared)[]>();
	jest.mocked(generatePathAttachments).mockReturnValue(presign.promise);
	const { store } = setup();
	const request = store.dispatch(handleSendTopic({ ...payload, topicId: 'topic' }));
	store.dispatch(
		messagesActions.newMessage({
			id: '10',
			channel_id: 'another-channel',
			code: 0,
			isMe: true,
			create_time_seconds: 1
		} as any)
	);
	expect(store.getState().messages.channelMessages['another-channel'].entities['10']).toBeDefined();
	presign.resolve([prepared]);
	await request.unwrap();
});

it('keeps a failed thread upload retryable without publishing a broken attachment', async () => {
	const upload = deferred<string[]>();
	jest.mocked(getWebUploadedAttachments).mockReturnValueOnce(upload.promise);
	const { store, client } = setup();
	const request = store.dispatch(sendMessage({ ...payload, channelId: 'thread', mode: ChannelStreamMode.STREAM_MODE_THREAD }));
	await new Promise(setImmediate);
	const [id] = store.getState().messages.channelMessages.thread.ids;
	expect(store.getState().messages.channelMessages.thread.entities[id].isSending).toBe(true);
	const callsBeforeUpload = client.writeChatMessage.mock.calls.length;
	upload.reject(new Error('Upload failed'));
	await expect(request.unwrap()).rejects.toMatchObject({ message: 'Upload failed' });
	expect(callsBeforeUpload).toBe(0);
	expect(client.writeChatMessage).not.toHaveBeenCalled();
	const failed = store.getState().messages.channelMessages.thread.entities[id];
	expect(failed.isError).toBe(true);
	expect(failed.isSending).toBe(false);
	expect(failed.attachments?.[0]).toHaveProperty('local_source', 'blob:independent-preview');
	expect(store.getState().messages.queueSending).toEqual({});

	await store.dispatch(resendMessage({ channelId: 'thread', messageId: id as string })).unwrap();
	expect(client.writeChatMessage).toHaveBeenCalledTimes(1);
	expect(client.updateChannelMessage).not.toHaveBeenCalled();
	expect(store.getState().messages.channelViewPortMessageIds.thread).toEqual(['900']);
	expect(store.getState().messages.channelMessages.thread.entities['900'].isSending).toBe(false);
});

it.each(['topic', 'thread', 'channel'])('receives another same-user message in %s during a pending upload', async (scope) => {
	const presign = deferred<(typeof prepared)[]>();
	jest.mocked(generatePathAttachments).mockReturnValueOnce(presign.promise);
	const { store } = setup();
	const topicId = scope === 'topic' ? scope : undefined;
	const request = store.dispatch(
		sendMessage({
			...payload,
			channelId: topicId ? 'channel' : scope,
			topicId,
			mode: scope === 'thread' ? ChannelStreamMode.STREAM_MODE_THREAD : payload.mode
		})
	);
	const other = { ...serverReply(5), channel_id: scope, topic_id: topicId, isMe: true, sender_id: 'user' };
	await store.dispatch(addNewMessage(other as any)).unwrap();
	const received = store.getState().messages.channelMessages[scope].entities[other.id];
	presign.resolve([prepared]);
	await request.unwrap();
	expect(received).toBeDefined();
	expect(store.getState().messages.channelViewPortMessageIds[scope]).toContain(other.id);
});

it.each(['topic', 'thread', 'channel'].flatMap((scope) => [true, false].map((echoBeforeAck) => ({ scope, echoBeforeAck }))))(
	'keeps one stable row in $scope when echoBeforeAck=$echoBeforeAck',
	async ({ scope, echoBeforeAck }) => {
		const ack = deferred<{ message_id: string }>();
		const { store, client } = setup();
		client.writeChatMessage.mockReturnValueOnce(ack.promise);
		const request = store.dispatch(
			sendMessage({
				...payload,
				channelId: scope,
				topicId: scope === 'topic' ? scope : undefined,
				mode: scope === 'thread' ? ChannelStreamMode.STREAM_MODE_THREAD : payload.mode,
				attachments: [],
				content: { t: 'Reply' }
			})
		);
		await new Promise(setImmediate);
		const [fakeId] = store.getState().messages.channelViewPortMessageIds[scope];
		const renderKey = store.getState().messages.channelMessages[scope].entities[fakeId].temp_id;
		const rowCounts: number[] = [];
		const unsubscribe = store.subscribe(() => rowCounts.push(store.getState().messages.channelViewPortMessageIds[scope].length));
		const echo = { ...serverReply(5), channel_id: scope, topic_id: scope === 'topic' ? scope : undefined, isMe: true, sender_id: 'user' };
		const earlyEcho = echoBeforeAck ? store.dispatch(addNewMessage(echo as any)) : undefined;
		await new Promise(setImmediate);
		expect(store.getState().messages.channelViewPortMessageIds[scope]).toEqual([fakeId]);
		ack.resolve({ message_id: echo.id });
		await request.unwrap();
		await earlyEcho?.unwrap();
		if (!echoBeforeAck) await store.dispatch(addNewMessage(echo as any)).unwrap();
		await store.dispatch(addNewMessage(echo as any)).unwrap();
		unsubscribe();
		expect(rowCounts.every((count) => count === 1)).toBe(true);
		expect(renderKey).toBeTruthy();
		expect(store.getState().messages.channelMessages[scope].entities[echo.id].temp_id).toBe(renderKey);
		expect(store.getState().messages.channelMessages[scope].ids).toEqual([echo.id]);
		expect(store.getState().messages.channelViewPortMessageIds[scope]).toEqual([echo.id]);
		expect(store.getState().messages.queueSending).toEqual({});
	}
);

it.each([false, true])('retains other-device messages when an active send fails: %s', async (fails) => {
	const ack = deferred<{ message_id: string }>();
	const { store, client } = setup();
	client.writeChatMessage.mockReturnValue(ack.promise);
	client.sendChannelMessage.mockRejectedValue(new Error('offline'));
	const request = store.dispatch(sendMessage({ ...payload, attachments: [], content: { t: 'Local' } }));
	await new Promise(setImmediate);
	const other = { ...serverReply(6), channel_id: 'channel', isMe: true, sender_id: 'user' };
	const received = store.dispatch(addNewMessage(other as any));
	// Other users and stores must not wait on this send.
	const peer = { ...serverReply(7), channel_id: 'channel', isMe: false, sender_id: 'peer' };
	await store.dispatch(addNewMessage(peer as any)).unwrap();
	expect(store.getState().messages.channelMessages.channel.entities[peer.id]).toBeDefined();
	const { store: otherStore } = setup();
	otherStore.dispatch(messagesActions.addOneMessage(peer as any));
	await otherStore.dispatch(addNewMessage(other as any)).unwrap();
	expect(otherStore.getState().messages.channelMessages.channel.entities[other.id]).toBeDefined();
	if (fails) ack.reject(new Error('offline'));
	else ack.resolve({ message_id: '900' });
	await request;
	await received.unwrap();
	expect(store.getState().messages.channelMessages.channel.entities[other.id]).toBeDefined();
	expect(store.getState().messages.channelViewPortMessageIds.channel).toContain(other.id);
});

it('reconciles concurrent sends without briefly adding their own echoes', async () => {
	const firstAck = deferred<{ message_id: string }>();
	const secondAck = deferred<{ message_id: string }>();
	const { store, client } = setup();
	client.writeChatMessage.mockReturnValueOnce(firstAck.promise).mockReturnValueOnce(secondAck.promise);
	const textPayload = { ...payload, attachments: [], content: { t: 'Same text' } };
	const first = store.dispatch(sendMessage(textPayload));
	const second = store.dispatch(sendMessage(textPayload));
	await new Promise(setImmediate);
	const echoes = [5, 6].map((sequence) => ({
		...serverReply(sequence),
		channel_id: 'channel',
		isMe: true,
		sender_id: 'user',
		content: textPayload.content
	}));
	const received = echoes.map((echo) => store.dispatch(addNewMessage(echo as any)));
	const rowCounts: number[] = [];
	const unsubscribe = store.subscribe(() => rowCounts.push(store.getState().messages.channelViewPortMessageIds.channel.length));
	secondAck.resolve({ message_id: echoes[1].id });
	await second.unwrap();
	firstAck.resolve({ message_id: echoes[0].id });
	await first.unwrap();
	await Promise.all(received.map((event) => event.unwrap()));
	unsubscribe();
	expect(rowCounts.every((count) => count === 2)).toBe(true);
	expect(store.getState().messages.channelViewPortMessageIds.channel).toEqual(echoes.map((echo) => echo.id));
});

it('releases incoming same-user messages when an acknowledgement times out', async () => {
	jest.useFakeTimers();
	try {
		const { store, client } = setup();
		client.writeChatMessage.mockReturnValue(deferred<{ message_id: string }>().promise);
		const request = store.dispatch(sendMessage({ ...payload, attachments: [], content: { t: 'Local' } }));
		await jest.advanceTimersByTimeAsync(0);
		const other = { ...serverReply(6), channel_id: 'channel', isMe: true, sender_id: 'user' };
		const received = store.dispatch(addNewMessage(other as any));
		await jest.advanceTimersByTimeAsync(30_000);
		await request;
		await received.unwrap();
		expect(store.getState().messages.channelMessages.channel.entities[other.id]).toBeDefined();
	} finally {
		jest.useRealTimers();
	}
});

it.each(['channel', 'topic'])('allows %s paging while a different message scope is fetching', async (scope) => {
	const { store, client } = setup();
	const topicId = scope === 'topic' ? scope : undefined;
	const args = { clanId: 'clan', channelId: 'channel', topicId };
	const message = { ...serverReply(50), channel_id: scope };
	store.dispatch(messagesActions.addOneMessage(message as any));
	store.dispatch(messagesActions.setViewportIds({ channelId: scope, viewportIds: [message.id] }));
	store.dispatch(
		fetchMessages.pending('other-request', { clanId: 'clan', channelId: 'channel', topicId: scope === 'channel' ? 'topic' : undefined })
	);
	client.listChannelMessages.mockResolvedValue({ messages: [{ ...serverReply(49), channel_id: scope }] });
	await store.dispatch(loadMoreMessage({ ...args, direction: Direction_Mode.BEFORE_TIMESTAMP })).unwrap();
	expect(client.listChannelMessages).toHaveBeenCalledWith({}, 'clan', 'channel', message.id, Direction_Mode.BEFORE_TIMESTAMP, 50, topicId);
	expect(selectMessageIsLoadingByChannelId(store.getState() as any, scope)).toBe(false);
});

it('blocks overlapping loads within the same scope', async () => {
	const { store, client } = setup();
	store.dispatch(fetchMessages.pending('same-request', { clanId: 'clan', channelId: 'channel' }));
	await store.dispatch(loadMoreMessage({ clanId: 'clan', channelId: 'channel', direction: Direction_Mode.BEFORE_TIMESTAMP })).unwrap();
	expect(client.listChannelMessages).not.toHaveBeenCalled();
});

describe.each(['channel', 'topic'])('distant jump pagination in %s', (scope) => {
	const topicId = scope === 'topic' ? scope : undefined;
	const args = { clanId: 'clan', channelId: 'channel', topicId };
	const msg = (n: number) => ({ ...serverReply(n), channel_id: scope, topic_id: topicId, timestamp_seconds: n });
	const page = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => msg(to - i));
	const ids = (from: number, to: number) =>
		page(from, to)
			.reverse()
			.map((m) => m.id);

	it.each([
		[10, false],
		[50, false],
		[10, true],
		[50, true]
	] as const)('keeps a %i-row jumped window continuous (cached target: %s)', async (size, cachedTarget) => {
		const { store, client } = setup();
		client.listChannelMessages.mockResolvedValueOnce({ messages: page(951, 1000), last_sent_message: msg(1000) });
		await store.dispatch(fetchMessages({ ...args, noCache: true, toPresent: true })).unwrap();
		if (cachedTarget) store.dispatch(messagesActions.addOneMessage(msg(105) as any));
		client.listChannelMessages.mockResolvedValueOnce({ messages: page(101, 100 + size), last_sent_message: msg(1000) });
		await store.dispatch(jumpToMessage({ ...args, messageId: msg(105).id })).unwrap();
		store.dispatch(messagesActions.setIdMessageToJump(null));
		const oldViewport = store.getState().messages.channelViewPortMessageIds[scope];
		await store.dispatch(addNewMessage({ ...msg(1001), isMe: false } as any)).unwrap();
		expect(store.getState().messages.channelViewPortMessageIds[scope]).toEqual(oldViewport);
		expect(selectHasMoreBottomByChannelId(store.getState() as any, scope)).toBe(true);
		let cursor = 100 + size;
		const seen = new Set(oldViewport);
		while (cursor < 1001) {
			const next = Math.min(cursor + 50, 1001);
			client.listChannelMessages.mockResolvedValueOnce({ messages: page(cursor + 1, next), last_sent_message: msg(1001) });
			await store.dispatch(loadMoreMessage({ ...args, direction: Direction_Mode.AFTER_TIMESTAMP })).unwrap();
			expect(client.listChannelMessages.mock.calls.at(-1)).toEqual([
				{},
				'clan',
				'channel',
				msg(cursor).id,
				Direction_Mode.AFTER_TIMESTAMP,
				50,
				topicId
			]);
			const viewport = store.getState().messages.channelViewPortMessageIds[scope];
			expect(viewport.at(-1)).toBe(msg(next).id);
			viewport.forEach((id) => seen.add(id));
			expect(selectHasMoreBottomByChannelId(store.getState() as any, scope)).toBe(next < 1001);
			cursor = next;
		}
		expect([...seen]).toEqual(ids(101, 1001));
	});

	it('keeps a newer realtime header when the in-flight jump returns an older snapshot', async () => {
		const { store, client } = setup();
		client.listChannelMessages.mockResolvedValueOnce({ messages: page(951, 1000), last_sent_message: msg(1000) });
		await store.dispatch(fetchMessages({ ...args, noCache: true, toPresent: true })).unwrap();
		const response = deferred<any>();
		client.listChannelMessages.mockReturnValueOnce(response.promise);
		const jumping = store.dispatch(jumpToMessage({ ...args, messageId: msg(105).id }));
		await new Promise(setImmediate);
		await store.dispatch(addNewMessage({ ...msg(1001), isMe: false } as any)).unwrap();
		response.resolve({ messages: page(101, 150), last_sent_message: msg(1000) });
		await jumping.unwrap();
		expect(store.getState().messages.lastMessageByChannel[scope]?.id).toBe(msg(1001).id);
		expect(store.getState().messages.channelViewPortMessageIds[scope]).toEqual(ids(101, 150));
	});

	it('preserves the pending row when loading older messages from the latest window', async () => {
		const { store, client } = setup();
		client.listChannelMessages.mockResolvedValueOnce({ messages: page(951, 1000), last_sent_message: msg(1000) });
		await store.dispatch(fetchMessages({ ...args, noCache: true, toPresent: true })).unwrap();
		const ack = deferred<{ message_id: string }>();
		client.writeChatMessage.mockReturnValueOnce(ack.promise);
		const sending = store.dispatch(sendMessage({ ...payload, topicId, attachments: [] }));
		await new Promise(setImmediate);
		const pendingId = store.getState().messages.channelViewPortMessageIds[scope].at(-1);
		client.listChannelMessages.mockResolvedValueOnce({ messages: page(902, 951), last_sent_message: msg(1000) });
		await store.dispatch(loadMoreMessage({ ...args, direction: Direction_Mode.BEFORE_TIMESTAMP })).unwrap();
		const viewport = store.getState().messages.channelViewPortMessageIds[scope];
		ack.resolve({ message_id: msg(1001).id });
		await sending.unwrap();
		expect(viewport).toContain(pendingId);
		expect(store.getState().messages.channelViewPortMessageIds[scope]).toEqual(viewport.map((id) => (id === pendingId ? msg(1001).id : id)));
	});

	it('keeps a pending send outside the jumped window after its ACK', async () => {
		const { store, client } = setup();
		client.listChannelMessages.mockResolvedValueOnce({ messages: page(951, 1000), last_sent_message: msg(1000) });
		await store.dispatch(fetchMessages({ ...args, noCache: true, toPresent: true })).unwrap();
		const ack = deferred<{ message_id: string }>();
		client.writeChatMessage.mockReturnValueOnce(ack.promise);
		const sending = store.dispatch(sendMessage({ ...payload, topicId, attachments: [] }));
		await new Promise(setImmediate);
		client.listChannelMessages.mockResolvedValueOnce({ messages: page(101, 150), last_sent_message: msg(1000) });
		await store.dispatch(jumpToMessage({ ...args, messageId: msg(105).id })).unwrap();
		ack.resolve({ message_id: msg(1001).id });
		await sending.unwrap();
		await store.dispatch(addNewMessage({ ...msg(1001), isMe: true } as any)).unwrap();
		expect(store.getState().messages.channelViewPortMessageIds[scope]).toEqual(ids(101, 150));
		expect(store.getState().messages.channelMessages[scope].entities[msg(1001).id]).toBeDefined();
		store.dispatch(messagesActions.setIdMessageToJump(null));
		client.listChannelMessages.mockResolvedValueOnce({ messages: page(51, 100), last_sent_message: msg(1001) });
		await store.dispatch(loadMoreMessage({ ...args, direction: Direction_Mode.BEFORE_TIMESTAMP })).unwrap();
		expect(store.getState().messages.channelViewPortMessageIds[scope]).toEqual(ids(51, 150));
		client.listChannelMessages.mockResolvedValueOnce({ messages: page(151, 200), last_sent_message: msg(1001) });
		await store.dispatch(loadMoreMessage({ ...args, direction: Direction_Mode.AFTER_TIMESTAMP })).unwrap();
		expect(client.listChannelMessages.mock.calls.at(-1)?.[3]).toBe(msg(150).id);
		expect(store.getState().messages.channelViewPortMessageIds[scope].at(-1)).toBe(msg(200).id);
		expect(selectHasMoreBottomByChannelId(store.getState() as any, scope)).toBe(true);
	});
});

describe('reopening a channel that missed messages while offline', () => {
	const args = { clanId: 'clan', channelId: 'channel' };
	const sequenceOf = (id: string) => Number((BigInt(id) >> BigInt(22)) - BigInt(438845456274));
	const msg = (n: number) => ({ ...serverReply(n), channel_id: 'channel', create_time_seconds: n > 1000 ? 5000 : n });
	const page = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => msg(to - i));
	const ids = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => msg(from + i).id);

	async function openThenMiss(latest: number) {
		const { store, client } = setup();
		const server = { latest: 1000 };
		client.listChannelMessages.mockImplementation(async (_session, _clan, _channel, cursor, direction, limit = 50) => {
			if (!cursor || cursor === '0') return { messages: page(server.latest - limit + 1, server.latest) };
			const sequence = sequenceOf(cursor);
			if (direction === Direction_Mode.AFTER_TIMESTAMP) return { messages: page(sequence, Math.min(sequence + limit - 1, server.latest)) };
			return { messages: page(Math.max(1, sequence - limit), sequence - 1) };
		});
		await store.dispatch(fetchMessages({ ...args, noCache: true, toPresent: true })).unwrap();
		server.latest = latest;
		return { store, client };
	}

	it('fetches the missed messages in order instead of the page before its newest cached row', async () => {
		const { store, client } = await openThenMiss(1003);
		await store.dispatch(fetchMessages(args)).unwrap();
		expect(client.listChannelMessages.mock.calls.at(-1)).toEqual([{}, 'clan', 'channel', '0', undefined, 50, undefined, msg(1000).id]);
		expect(store.getState().messages.channelViewPortMessageIds.channel.slice(-4)).toEqual(ids(1000, 1003));
		expect(store.getState().messages.lastMessageByChannel.channel?.id).toBe(msg(1003).id);
		expect(selectHasMoreBottomByChannelId(store.getState() as any, 'channel')).toBe(false);
	});

	it('keeps cached messages and refreshes cache metadata when server returns empty for matching lastSeenMessageId', async () => {
		const { store, client } = await openThenMiss(1000);
		client.listChannelMessages.mockResolvedValueOnce({ messages: [] });
		const beforeCache = store.getState().messages.channelMessages.channel.cache;

		await store.dispatch(fetchMessages(args)).unwrap();

		expect(client.listChannelMessages.mock.calls.at(-1)).toEqual([{}, 'clan', 'channel', '0', undefined, 50, undefined, msg(1000).id]);
		expect(store.getState().messages.channelViewPortMessageIds.channel).toEqual(ids(951, 1000));
		expect(store.getState().messages.channelMessages.channel.cache).toBeDefined();
		expect(store.getState().messages.channelMessages.channel.cache).not.toBe(beforeCache);
	});

	it('does not send lastSeenMessageId when channel only has an unfetched realtime message', async () => {
		const { store, client } = setup();
		store.dispatch(messagesActions.addOneMessage({ ...msg(1000) } as any));
		client.listChannelMessages.mockResolvedValueOnce({ messages: page(951, 1000), last_sent_message: msg(1000) });

		await store.dispatch(fetchMessages(args)).unwrap();

		expect(client.listChannelMessages.mock.calls.at(-1)).toEqual([{}, 'clan', 'channel', '0', undefined, 50, undefined]);
	});

	it('replaces a cache that no longer connects to the latest page', async () => {
		const { store } = await openThenMiss(1200);
		await store.dispatch(fetchMessages(args)).unwrap();
		expect(store.getState().messages.channelViewPortMessageIds.channel).toEqual(ids(1151, 1200));
		expect(store.getState().messages.channelMessages.channel.entities[msg(1000).id]).toBeUndefined();
		expect(selectHasMoreMessageByChannelId(store.getState() as any, 'channel')).toBe(true);
	});

	it('keeps the reading position of a user viewing older messages', async () => {
		const { store } = await openThenMiss(1200);
		store.dispatch(messagesActions.setViewingOlder({ channelId: 'channel', status: true }));
		await store.dispatch(fetchMessages(args)).unwrap();
		expect(store.getState().messages.channelViewPortMessageIds.channel).toEqual(ids(951, 1000));
		expect(store.getState().messages.lastMessageByChannel.channel?.id).toBe(msg(1200).id);
		expect(selectHasMoreBottomByChannelId(store.getState() as any, 'channel')).toBe(true);
	});
});

describe('scoping message update and delete events by conversation', () => {
	it('does not delete a colliding message ID in another channel', () => {
		const { store } = setup();
		store.dispatch(messagesActions.addOneMessage({ id: '100', channel_id: 'channel-a', code: TypeMessage.Chat, content: { t: 'keep' } } as any));
		store.dispatch(messagesActions.addOneMessage({ id: '200', channel_id: 'channel-b', code: TypeMessage.Chat, content: { t: 'other' } } as any));

		store.dispatch(messagesActions.newMessage({ id: '100', channel_id: 'channel-b', code: TypeMessage.ChatRemove } as any));

		expect(store.getState().messages.channelMessages['channel-a'].entities['100']).toMatchObject({ content: { t: 'keep' } });
	});

	it('does not update a colliding message ID in another channel', () => {
		const { store } = setup();
		store.dispatch(messagesActions.addOneMessage({ id: '100', channel_id: 'channel-a', code: TypeMessage.Chat, content: { t: 'keep' } } as any));
		store.dispatch(messagesActions.addOneMessage({ id: '200', channel_id: 'channel-b', code: TypeMessage.Chat, content: { t: 'other' } } as any));

		store.dispatch(
			messagesActions.newMessage({ id: '100', channel_id: 'channel-b', code: TypeMessage.ChatUpdate, content: { t: 'overwritten' } } as any)
		);

		expect(store.getState().messages.channelMessages['channel-a'].entities['100']?.content).toEqual({ t: 'keep' });
	});

	it('updates a topic message when the event names the parent channel', () => {
		const { store } = setup();
		store.dispatch(messagesActions.addOneMessage({ id: 'seed', channel_id: 'topic', code: TypeMessage.Chat } as any));
		store.dispatch(messagesActions.remove({ channelId: 'topic', messageId: 'seed' }));
		store.dispatch(
			messagesActions.newMessage({
				id: '100',
				channel_id: 'parent',
				topic_id: 'topic',
				code: TypeMessage.Chat,
				content: { t: 'initial' }
			} as any)
		);

		store.dispatch(
			messagesActions.newMessage({
				id: '100',
				channel_id: 'parent',
				topic_id: '0',
				code: TypeMessage.ChatUpdate,
				content: { t: 'edited' }
			} as any)
		);

		expect(store.getState().messages.channelMessages.topic.entities['100']?.content).toEqual({ t: 'edited' });
	});

	it('deletes a topic message when the event names the parent channel', () => {
		const { store } = setup();
		store.dispatch(messagesActions.addOneMessage({ id: 'seed', channel_id: 'topic', code: TypeMessage.Chat } as any));
		store.dispatch(messagesActions.remove({ channelId: 'topic', messageId: 'seed' }));
		store.dispatch(
			messagesActions.newMessage({
				id: '100',
				channel_id: 'parent',
				topic_id: 'topic',
				code: TypeMessage.Chat,
				content: { t: 'initial' }
			} as any)
		);

		store.dispatch(messagesActions.newMessage({ id: '100', channel_id: 'parent', topic_id: '0', code: TypeMessage.ChatRemove } as any));

		expect(store.getState().messages.channelMessages.topic.entities['100']).toBeUndefined();
	});

	it('normalizes negative synthetic DM/Group clan_id when fetching and sending messages', async () => {
		const { store, client, mezon } = setup();
		client.listChannelMessages.mockResolvedValue({ messages: [] });

		await fetchMessagesCached(store.getState as any, mezon as any, '-999001', 'dm-channel', '0', undefined, undefined, true);
		expect(client.listChannelMessages).toHaveBeenCalledWith({}, '0', 'dm-channel', '0', undefined, 50, undefined);

		await store
			.dispatch(
				sendMessage({
					clanId: '-999001',
					channelId: 'dm-channel',
					senderId: 'user',
					mode: ChannelStreamMode.STREAM_MODE_DM,
					isPublic: false,
					content: { t: 'hello dm' }
				})
			)
			.unwrap();

		const sentMessages = Object.values(store.getState().messages.channelMessages['dm-channel']?.entities ?? {});
		expect(sentMessages.length).toBeGreaterThan(0);
		expect(sentMessages[0]?.clan_id).toBeUndefined();
	});

	it('routes payloads exceeding 4 KB over HTTP sendChannelMessageApi instead of writeChatMessage', async () => {
		const { store, client, mezon } = setup();
		const references = [{ message_ref_id: 'ref-1', content: JSON.stringify({ t: 'q'.repeat(3000) }) }];
		const longContent = { t: 'a'.repeat(1500) };

		const result = await store.dispatch(
			sendMessage({
				...payload,
				content: longContent,
				attachments: [],
				references: references as any,
				topicId: 'topic'
			})
		);

		expect(result.meta.requestStatus).toBe('fulfilled');
		expect(result.payload).toBe(true);
		expect(client.writeChatMessage).not.toHaveBeenCalled();
		expect(client.sendChannelMessage).not.toHaveBeenCalled();
		expect(client.sendChannelMessageApi).toHaveBeenCalledTimes(1);
		expect(client.sendChannelMessageApi).toHaveBeenCalledWith(
			mezon.sessionRef.current,
			'clan',
			'channel',
			2,
			true,
			longContent,
			undefined,
			[],
			references,
			undefined,
			undefined,
			'',
			undefined,
			'topic'
		);
		expect(store.getState().messages.channelMessages.topic.ids).toEqual(['901']);
		expect(store.getState().messages.channelMessages.topic.entities['901']?.isSending).toBe(false);
	});

	it('routes small payloads over writeChatMessage and returns true', async () => {
		const { store, client } = setup();

		const result = await store.dispatch(
			sendMessage({
				...payload,
				content: { t: 'short message' },
				attachments: []
			})
		);

		expect(result.meta.requestStatus).toBe('fulfilled');
		expect(result.payload).toBe(true);
		expect(client.writeChatMessage).toHaveBeenCalledTimes(1);
		expect(client.sendChannelMessageApi).not.toHaveBeenCalled();
	});

	it('removes the optimistic row and resolves false on SEND_TIMEOUT', async () => {
		jest.useFakeTimers();
		try {
			const { store, client } = setup();
			client.writeChatMessage.mockReturnValue(deferred<{ message_id: string }>().promise);
			const request = store.dispatch(sendMessage({ ...payload, attachments: [], content: { t: 'Timeout' } }));
			await jest.advanceTimersByTimeAsync(0);
			expect(store.getState().messages.channelMessages.channel.ids).toHaveLength(1);
			await jest.advanceTimersByTimeAsync(30_000);
			const result = await request;
			expect(result.meta.requestStatus).toBe('fulfilled');
			expect(result.payload).toBe(false);
			expect(store.getState().messages.channelMessages.channel.ids).toEqual([]);
		} finally {
			jest.useRealTimers();
		}
	});

	it('refuses a presign-first channel message when its presign_finish patch would exceed 4 KB', async () => {
		const longPrepared = Array.from({ length: 8 }, (_, index) => ({
			...prepared,
			filename: `photo-${index}.png`,
			url: `https://cdn.example/${'x'.repeat(180)}-${index}.png`,
			uploadPath: `https://upload.example/${index}`,
			uploadName: `clan/channel/${index}_photo.png`
		}));
		jest.mocked(generatePathAttachments).mockResolvedValueOnce(longPrepared);
		const { store, client } = setup();

		const result = await store.dispatch(
			sendMessage({
				...payload,
				content: { t: 'a'.repeat(3900) },
				attachments: Array.from({ length: 8 }, (_, index) => ({ ...attachment, filename: `photo-${index}.png` }))
			})
		);

		expect(result.meta.requestStatus).toBe('fulfilled');
		expect(result.payload).toBe(false);
		expect(toast.error).toHaveBeenCalledWith('message:tooLongMessage');
		expect(client.writeChatMessage).not.toHaveBeenCalled();
		expect(client.sendChannelMessageApi).not.toHaveBeenCalled();
		expect(store.getState().messages.channelMessages.channel.ids).toEqual([]);
		expect(store.getState().messages.queueSending).toEqual({});
	});

	it('sends a presign-first message whose upload patch fits even though its full payload with long attachment URLs does not', async () => {
		const longPrepared = Array.from({ length: 8 }, (_, index) => ({
			...prepared,
			filename: `photo-${index}.png`,
			url: `https://cdn.example/${'x'.repeat(180)}-${index}.png`,
			uploadPath: `https://upload.example/${index}`,
			uploadName: `clan/channel/${index}_photo.png`
		}));
		jest.mocked(generatePathAttachments).mockResolvedValueOnce(longPrepared);
		const { store, client } = setup();

		const result = await store.dispatch(
			sendMessage({
				...payload,
				content: { t: 'a'.repeat(3000) },
				attachments: Array.from({ length: 8 }, (_, index) => ({ ...attachment, filename: `photo-${index}.png` }))
			})
		);

		expect(result.payload).toBe(true);
		expect(client.sendChannelMessageApi).toHaveBeenCalledTimes(1);
		expect(toast.error).not.toHaveBeenCalled();
	});

	it.each([
		['a 403 without a message', { status: 403 }],
		['a request timeout', new Error('Request timed out.')]
	])('does not retry an oversized HTTP send after %s and leaves the row failed', async (_label, failure) => {
		const { store, client } = setup();
		client.sendChannelMessageApi.mockRejectedValue(failure);

		const result = await store.dispatch(
			sendMessage({
				...payload,
				content: { t: 'a'.repeat(5000) },
				attachments: []
			})
		);

		expect(result.meta.requestStatus).toBe('rejected');
		expect(client.sendChannelMessageApi).toHaveBeenCalledTimes(1);
		expect(client.writeChatMessage).not.toHaveBeenCalled();
		const channel = store.getState().messages.channelMessages.channel;
		expect(channel?.ids).toHaveLength(1);
		expect(channel?.entities[channel.ids[0] as string]?.isError).toBe(true);
	});

	it('sends a presign-first channel reply with a long quoted message over HTTP when its patch stays under 4 KB', async () => {
		const { store, client } = setup();
		const references = [{ message_ref_id: 'ref-1', content: JSON.stringify({ t: 'q'.repeat(4000) }) }];

		const result = await store.dispatch(
			sendMessage({
				...payload,
				content: { t: 'ok' },
				attachments: [attachment],
				references: references as any
			})
		);

		expect(result.meta.requestStatus).toBe('fulfilled');
		expect(result.payload).toBe(true);
		expect(client.sendChannelMessageApi).toHaveBeenCalledTimes(1);
		expect(client.writeChatMessage).not.toHaveBeenCalled();
		expect(toast.error).not.toHaveBeenCalled();
	});
});
