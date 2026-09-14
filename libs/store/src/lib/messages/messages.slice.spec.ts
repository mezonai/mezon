import { generatePathAttachments, getWebUploadedAttachments } from '@mezon/utils';
import { configureStore } from '@reduxjs/toolkit';
import { ChannelStreamMode } from 'mezon-js';
import { shouldForceApiCall } from '../cache-metadata';
import { handleSendTopic } from '../topicDiscussion/topicDiscussions.slice';
import {
	addNewMessage,
	fetchMessages,
	fetchMessagesCached,
	loadMoreMessage,
	messagesActions,
	messagesReducer,
	resendMessage,
	selectHasMoreMessageByChannelId,
	selectMessageIsLoadingByChannelId,
	sendMessage
} from './messages.slice';

jest.mock('@mezon/logger', () => ({ captureSentryError: jest.fn() }));
jest.mock('@mezon/utils', () => ({
	mergePresignFinishContent: jest.requireActual('../../../../utils/src/lib/utils/presignFinish').mergePresignFinishContent,
	TypeMessage: { Chat: 0, ChatUpdate: 1 },
	EMessageCode: { FIRST_MESSAGE: 4 },
	Direction_Mode: { BEFORE_TIMESTAMP: 1 },
	LIMIT_MESSAGE: 50,
	EBacktickType: {},
	EOgpType: {},
	createLocalPreviewUrl: jest.fn(() => 'blob:independent-preview'),
	generatePathAttachments: jest.fn(),
	getWebUploadedAttachments: jest.fn(),
	getMessageCreateTimeSeconds: () => 1,
	withCreateTimeSecondsInUpdateContent: (content: unknown) => content,
	revokePreSendAttachmentUrls: jest.fn(),
	isFacebookLink: jest.fn(),
	isYouTubeLink: jest.fn(),
	isTikTokLink: jest.fn()
}));
jest.mock('mezon-js', () => ({ safeJSONParse: JSON.parse, ChannelStreamMode: { STREAM_MODE_THREAD: 6 } }));
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
jest.mock('../channels/channels.slice', () => ({ selectShowScrollDownButton: () => false }));
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
		updateChannelMessage: jest.fn().mockResolvedValue({}),
		listChannelMessages: jest.fn()
	};
	const mezon = { client, clientRef: { current: client }, sessionRef: { current: {} }, session: {} };
	const store = configureStore({
		reducer: { messages: messagesReducer },
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
	await store.dispatch(loadMoreMessage({ ...args, direction: 1 })).unwrap();
	expect(client.listChannelMessages).toHaveBeenCalledWith({}, 'clan', 'channel', message.id, 1, 50, topicId);
	expect(selectMessageIsLoadingByChannelId(store.getState() as any, scope)).toBe(false);
});

it('blocks overlapping loads within the same scope', async () => {
	const { store, client } = setup();
	store.dispatch(fetchMessages.pending('same-request', { clanId: 'clan', channelId: 'channel' }));
	await store.dispatch(loadMoreMessage({ clanId: 'clan', channelId: 'channel', direction: 1 })).unwrap();
	expect(client.listChannelMessages).not.toHaveBeenCalled();
});
