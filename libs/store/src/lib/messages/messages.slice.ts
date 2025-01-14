import { captureSentryError } from '@mezon/logger';
import {
	ApiChannelMessageHeaderWithChannel,
	ChannelDraftMessages,
	Direction_Mode,
	EMessageCode,
	EmojiDataOptionals,
	IMessageSendPayload,
	IMessageWithUser,
	LIMIT_MESSAGE,
	LoadingStatus,
	MessageCrypt,
	PublicKeyMaterial,
	TypeMessage,
	getMobileUploadedAttachments,
	getPublicKeys,
	getWebUploadedAttachments
} from '@mezon/utils';
import {
	EntityState,
	GetThunkAPI,
	PayloadAction,
	createAsyncThunk,
	createEntityAdapter,
	createSelector,
	createSelectorCreator,
	createSlice,
	weakMapMemoize
} from '@reduxjs/toolkit';
import { Snowflake } from '@theinternetfolks/snowflake';
import { ChannelMessage } from 'mezon-js';
import { ApiMessageAttachment, ApiMessageMention, ApiMessageRef } from 'mezon-js/api.gen';
import { MessageButtonClicked } from 'mezon-js/socket';
import { accountActions, selectAllAccount } from '../account/account.slice';
import { channelMetaActions } from '../channels/channelmeta.slice';
import { selectCurrentDM } from '../direct/direct.slice';
import { checkE2EE, selectE2eeByUserIds } from '../e2ee/e2ee.slice';
import { MezonValueContext, ensureSession, ensureSocket, getMezonCtx } from '../helpers';
import { memoizeAndTrack } from '../memoize';
import { ReactionEntity, reactionActions } from '../reactionMessage/reactionMessage.slice';
import { RootState } from '../store';
import { seenMessagePool } from './SeenMessagePool';

const FETCH_MESSAGES_CACHED_TIME = 1000 * 60 * 60;
const NX_CHAT_APP_ANNONYMOUS_USER_ID = process.env.NX_CHAT_APP_ANNONYMOUS_USER_ID || 'anonymous';

export const MESSAGES_FEATURE_KEY = 'messages';

/*
 * Update these interfaces according to your requirements.
 */

export const mapMessageChannelToEntity = (channelMess: ChannelMessage, lastSeenId?: string): IMessageWithUser => {
	const creationTime = new Date(channelMess.create_time || '');
	const isAnonymous = channelMess?.sender_id === NX_CHAT_APP_ANNONYMOUS_USER_ID;
	return {
		...channelMess,
		isFirst: channelMess.code === EMessageCode.FIRST_MESSAGE,
		creationTime,
		id: channelMess.id || channelMess.message_id || '',
		date: new Date().toLocaleString(),
		isAnonymous,
		user: {
			name: channelMess.username || '',
			username: channelMess.username || '',
			id: channelMess.sender_id || ''
		},
		lastSeen: lastSeenId === (channelMess.id || channelMess.message_id),
		create_time_seconds: channelMess.create_time_seconds || creationTime.getTime() / 1000
	};
};

export interface MessagesEntity extends IMessageWithUser {
	id: string; // Primary ID
	channel_id: string;
	isStartedMessageGroup?: boolean;
	isStartedMessageOfTheDay?: boolean;
	hide_editted?: boolean;
	code: number;
}

export interface UserTypingState {
	id: string;
	timeAt: number;
}

export type ChannelTypingState = {
	users: UserTypingState[];
};

export type FetchMessageParam = {
	lastLoadMessageId: string;
	hasMore?: boolean;
};

export interface MessagesState {
	loadingStatus: LoadingStatus;
	error?: string | null;
	isSending?: boolean;
	unreadMessagesEntries?: Record<string, string>;
	typingUsers?: Record<string, ChannelTypingState>;
	paramEntries: Record<string, FetchMessageParam>;
	openOptionMessageState: boolean;
	firstMessageId: Record<string, string>;
	lastMessageByChannel: Record<string, ApiChannelMessageHeaderWithChannel>;
	dataReactionGetFromLoadMessage: EmojiDataOptionals[];
	isFocused: boolean;
	idMessageToJump?: {
		id: string;
		navigate?: boolean;
	} | null;
	channelDraftMessage: Record<string, ChannelDraftMessages>;
	isJumpingToPresent: Record<string, boolean>;
	channelMessages: Record<
		string,
		EntityState<MessagesEntity, string> & {
			id: string;
		}
	>;
	channelViewPortMessageIds: Record<string, string[]>;
	isViewingOlderMessagesByChannelId: Record<string, boolean>;
	channelIdLastFetch: string;
	directMessageUnread: Record<string, ChannelMessage[]>;
}
export type FetchMessagesMeta = {
	arg: {
		channelId: string;
		direction?: Direction_Mode;
		messageId?: string;
	};
};
export type DirectTimeStampArg = {
	directId: string;
	lastSeenTimestamp: number;
	lastSentTimestamp: number;
};

type FetchMessagesPayloadAction = {
	messages: MessagesEntity[];
	isFetchingLatestMessages?: boolean;
	isClearMessage?: boolean;
	viewingOlder?: boolean;
	foundE2ee?: boolean;
	fromCache?: boolean;
};

export interface MessagesRootState {
	[MESSAGES_FEATURE_KEY]: MessagesState;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getMessagesRootState(thunkAPI: GetThunkAPI<unknown>): MessagesRootState {
	return thunkAPI.getState() as MessagesRootState;
}

export const mapMessageChannelToEntityAction = createAsyncThunk(
	'messages/mapMessageChannelToEntity',
	async (
		{ message, lock = false, isSystem = false }: { message: ChannelMessage; lock?: boolean; isSystem?: boolean },
		thunkAPI: GetThunkAPI<unknown>
	): Promise<IMessageWithUser> => {
		const checkEnableE2EE = checkE2EE(message.clan_id as string, message.channel_id, thunkAPI);
		const currentUser = selectAllAccount(thunkAPI.getState() as RootState);
		const mapMessage = mapMessageChannelToEntity(message);

		if (checkEnableE2EE && mapMessage.content?.t) {
			const data = {
				...mapMessage,
				content: {
					...(mapMessage.content as object),
					t: await MessageCrypt.mapE2EEcontent(mapMessage.content.t, currentUser?.user?.id as string, lock),
					e2ee: 1
				}
			} as IMessageWithUser;

			return data;
		}
		return mapMessage;
	}
);

export const TYPING_TIMEOUT = 3000;

export const fetchMessagesCached = memoizeAndTrack(
	async (mezon: MezonValueContext, clanId: string, channelId: string, messageId?: string, direction?: number, topicId?: string) => {
		const response = await mezon.client.listChannelMessages(mezon.session, clanId, channelId, messageId, direction, LIMIT_MESSAGE, topicId);
		return { ...response, time: Date.now() };
	},
	{
		promise: true,
		maxAge: FETCH_MESSAGES_CACHED_TIME,
		normalizer: (args) => {
			// set default value
			if (args[3] === undefined) {
				args[3] = '';
			}
			if (args[4] === undefined) {
				args[4] = 1;
			}
			return args[1] + args[2] + args[3] + args[4] + args[5] + args[0].session.username;
		}
	}
);

type fetchMessageChannelPayload = {
	clanId: string;
	channelId: string;
	noCache?: boolean;
	messageId?: string;
	direction?: number;
	isFetchingLatestMessages?: boolean;
	isClearMessage?: boolean;
	directTimeStamp?: DirectTimeStampArg;
	viewingOlder?: boolean;
	topicId?: string;
	foundE2ee?: boolean;
};

const MESSAGE_LIST_SLICE = 100;

function findClosestIndex(sourceIds: string[], offsetId: string) {
	if (offsetId < sourceIds[0]) {
		return 0;
	}

	if (offsetId > sourceIds[sourceIds.length - 1]) {
		return sourceIds.length - 1;
	}

	return sourceIds.findIndex((id, i) => id === offsetId || (id < offsetId && sourceIds[i + 1] > offsetId));
}

function getViewportSlice(sourceIds: string[], offsetId: string | undefined, direction: Direction_Mode) {
	const { length } = sourceIds;
	const index = offsetId ? findClosestIndex(sourceIds, offsetId) : -1;
	const isBackwards = direction === Direction_Mode.BEFORE_TIMESTAMP;
	const isAround = direction === Direction_Mode.AROUND_TIMESTAMP;
	const indexForDirection = isBackwards ? index : index + 1 || length;
	const sliceSize = isAround ? Math.round(MESSAGE_LIST_SLICE / 2) : MESSAGE_LIST_SLICE;
	const from = indexForDirection - sliceSize;
	const to = indexForDirection + sliceSize - 1;
	const newViewportIds = sourceIds.slice(Math.max(0, from), to + 1);

	let areSomeLocal;
	let areAllLocal;
	switch (direction) {
		case Direction_Mode.BEFORE_TIMESTAMP:
			areSomeLocal = indexForDirection >= 0;
			areAllLocal = from >= 0;
			break;
		case Direction_Mode.AFTER_TIMESTAMP:
			areSomeLocal = indexForDirection < length;
			areAllLocal = to <= length - 1;
			break;
		case Direction_Mode.AROUND_TIMESTAMP:
		default:
			areSomeLocal = newViewportIds.length > 0;
			areAllLocal = newViewportIds.length === MESSAGE_LIST_SLICE;
			break;
	}

	return { newViewportIds, areSomeLocal, areAllLocal };
}

export const fetchMessages = createAsyncThunk(
	'messages/fetchMessages',
	async (
		{
			clanId,
			channelId,
			noCache,
			messageId,
			direction,
			isFetchingLatestMessages,
			isClearMessage,
			directTimeStamp,
			viewingOlder,
			topicId,
			foundE2ee
		}: fetchMessageChannelPayload,
		thunkAPI
	) => {
		try {
			const state = thunkAPI.getState() as RootState;
			if (isFetchingLatestMessages) {
				thunkAPI.dispatch(messagesActions.setIsViewingOlderMessages({ channelId, isViewing: false }));
			}

			let chlId = channelId;
			if (topicId) {
				chlId = topicId || '';
			}
			const mezon = await ensureSession(getMezonCtx(thunkAPI));

			let currentUser = selectAllAccount(state);
			if (!currentUser) {
				currentUser = await thunkAPI.dispatch(accountActions.getUserProfile()).unwrap();
			}
			if (noCache) {
				fetchMessagesCached.delete(mezon, clanId, channelId, messageId, direction, topicId);
			}
			const response = await fetchMessagesCached(mezon, clanId, channelId, messageId, direction, topicId);
			if (!response.messages) {
				return {
					messages: []
				};
			}

			const oldMessages = channelMessagesAdapter
				.getSelectors()
				.selectAll(state.messages.channelMessages[channelId] || { ids: [], entities: {} });

			if (!response.messages || Date.now() - response.time > 1000) {
				thunkAPI.dispatch(reactionActions.updateBulkMessageReactions({ messages: oldMessages }));
				return {
					messages: [],
					isClearMessage,
					fromCache: true
				};
			} else if (!isFetchingLatestMessages && !foundE2ee) {
				const { entities, ids } = state.messages.channelMessages?.[channelId] || {};
				if (ids?.length >= response.messages.length && response.messages.every((item) => entities[item.id]?.id === item.id)) {
					thunkAPI.dispatch(reactionActions.updateBulkMessageReactions({ messages: oldMessages }));
					return {
						messages: [],
						isClearMessage,
						fromCache: true
					};
				}
			}

			const firstMessage = response.messages[response.messages.length - 1];
			if (firstMessage?.code === EMessageCode.FIRST_MESSAGE) {
				thunkAPI.dispatch(messagesActions.setFirstMessageId({ channelId: chlId, firstMessageId: firstMessage.id }));
			}

			let lastSentMessage = response.last_sent_message;

			// no message id and direction is before timestamp means load latest messages
			// then the last sent message will be the last message of response
			if ((!messageId && direction === Direction_Mode.BEFORE_TIMESTAMP) || isFetchingLatestMessages) {
				lastSentMessage = response.messages[response.messages.length - 1];
			}

			if (lastSentMessage && lastSentMessage.id) {
				thunkAPI.dispatch(
					messagesActions.setLastMessage({
						...lastSentMessage,
						channel_id: chlId
					})
				);
			}
			thunkAPI.dispatch(messagesActions.setChannelIdLastFetch({ channelId: chlId }));

			let messages = response.messages.map((item) => {
				return mapMessageChannelToEntity(item, response.last_seen_message?.id);
			});

			if (clanId === '0' || !clanId) {
				messages = await MessageCrypt.decryptMessages(messages, currentUser.user?.id as string);
			}

			const lastLoadMessage = messages[messages.length - 1];
			const hasMore = lastLoadMessage?.isFirst === false ? false : true;

			if (messages.length > 0) {
				thunkAPI.dispatch(messagesActions.setMessageParams({ channelId: chlId, param: { lastLoadMessageId: lastLoadMessage.id, hasMore } }));
				thunkAPI.dispatch(reactionActions.updateBulkMessageReactions({ messages }));
			}

			if (response.last_seen_message?.id) {
				thunkAPI.dispatch(
					messagesActions.setChannelLastMessage({
						channelId: chlId,
						messageId: response.last_seen_message?.id
					})
				);
				const lastMessage = messages.find((message) => message.id === response.last_seen_message?.id);

				if (lastMessage) {
					seenMessagePool.updateKnownSeenMessage({
						clanId: lastMessage.clan_id || '',
						channelId: lastMessage.channel_id || '',
						channelLabel: lastMessage.channel_label,
						messageId: lastMessage.id,
						messageCreatedAt: lastMessage.create_time_seconds ? +lastMessage.create_time_seconds : 0,
						messageSeenAt: 0,
						mode: lastMessage.mode as number
					});
				}
			}

			if (isFetchingLatestMessages) {
				thunkAPI.dispatch(messagesActions.setIdMessageToJump(null));
			}

			return {
				messages,
				isFetchingLatestMessages,
				isClearMessage,
				viewingOlder,
				foundE2ee
			};
		} catch (error) {
			captureSentryError(error, 'messages/fetchMessages');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

type LoadMoreMessArgs = {
	clanId: string;
	channelId: string;
	direction?: Direction_Mode;
	fromMobile?: boolean;
	topicId?: string;
};

export const loadMoreMessage = createAsyncThunk(
	'messages/loadMoreMessage',
	async ({ clanId, channelId, direction = Direction_Mode.BEFORE_TIMESTAMP, fromMobile = false, topicId }: LoadMoreMessArgs, thunkAPI) => {
		try {
			const state = getMessagesState(getMessagesRootState(thunkAPI));
			// ignore when:
			// - jumping to present
			// - loading
			// - already have message to jump to
			// Potential bug: if the idMessageToJump is not removed, the user will not be able to load more messages
			if ((state.isJumpingToPresent[channelId] && !fromMobile) || state.loadingStatus === 'loading' || state.idMessageToJump) {
				return;
			}

			if (direction === Direction_Mode.BEFORE_TIMESTAMP) {
				if (topicId) {
					return await thunkAPI.dispatch(
						fetchMessages({
							clanId: clanId,
							channelId: channelId,
							direction: direction,
							topicId: topicId
						})
					);
				}
				// scroll up
				const lastScrollMessageId = selectLastLoadMessageIDByChannelId(channelId)(getMessagesRootState(thunkAPI));
				const firstChannelMessageId = selectFirstMessageIdByChannelId(channelId)(getMessagesRootState(thunkAPI));

				if (!lastScrollMessageId || lastScrollMessageId === firstChannelMessageId) {
					return;
				}

				return await thunkAPI.dispatch(
					fetchMessages({
						clanId: clanId,
						channelId: channelId,
						messageId: lastScrollMessageId,
						direction: direction,
						noCache: true
					})
				);
			} else {
				if (topicId) {
					return await thunkAPI.dispatch(
						fetchMessages({
							clanId: clanId,
							channelId: channelId,
							direction: direction,
							topicId: topicId
						})
					);
				}
				// scroll down
				const lastChannelMessageId = selectLatestMessageId(getMessagesRootState(thunkAPI), channelId);
				const firstScrollMessageId = selectLastLoadedMessageIdByChannelId(channelId)(getMessagesRootState(thunkAPI));
				if (!lastChannelMessageId || !firstScrollMessageId || lastChannelMessageId === firstScrollMessageId) {
					return;
				}

				return await thunkAPI.dispatch(
					fetchMessages({
						clanId: clanId,
						channelId: channelId,
						noCache: true,
						messageId: firstScrollMessageId,
						direction: direction
					})
				);
			}
		} catch (e) {
			captureSentryError(e, 'messages/loadMoreMessage');
			return thunkAPI.rejectWithValue(e);
		}
	}
);

type JumpToMessageArgs = {
	clanId: string;
	channelId: string;
	messageId: string;
	noCache?: boolean;
	isFetchingLatestMessages?: boolean;
	mode?: number;
	navigate?: (path: string) => void;
};
/**
 * Jump to message by message id
 * logic:
 * 1. check if the message is in the local store
 * 2. if not, fetch the message around the message id
 * 3. set the reference message id to jump to
 * 4. jump to the message by the reference message id
 * 5. once the message is being displayed, remove the reference message id
 */
export const jumpToMessage = createAsyncThunk(
	'messages/jumpToMessage',
	async ({ clanId, messageId, channelId, noCache = true, isFetchingLatestMessages = false, navigate, mode }: JumpToMessageArgs, thunkAPI) => {
		try {
			const channelMessages = selectMessageIdsByChannelId(getMessagesRootState(thunkAPI), channelId);
			const isMessageExist = channelMessages.includes(messageId);
			if (!isMessageExist) {
				await thunkAPI.dispatch(
					fetchMessages({
						clanId: clanId,
						channelId: channelId,
						noCache: noCache,
						messageId: messageId,
						direction: Direction_Mode.AROUND_TIMESTAMP,
						isFetchingLatestMessages,
						isClearMessage: true,
						viewingOlder: true
					})
				);
			}

			const state = thunkAPI.getState() as RootState;
			if (clanId && state.channels.byClans[clanId]?.currentChannelId !== channelId) {
				let channelPath = `/chat/clans/${clanId}/channels/${channelId}`;
				if (clanId === '0') {
					channelPath = `/chat/direct/message/${channelId}/${mode}`;
				}
				thunkAPI.dispatch(messagesActions.setIdMessageToJump({ id: messageId, navigate: true }));
				navigate && navigate(channelPath);
			} else {
				thunkAPI.dispatch(messagesActions.setIdMessageToJump({ id: messageId, navigate: false }));
			}
		} catch (e) {
			captureSentryError(e, 'messages/jumpToMessage');
			return thunkAPI.rejectWithValue(e);
		}
	}
);

type UpdateMessageArgs = {
	clanId: string;
	channelId: string;
	messageId: string;
	mode: number;
};

export const updateLastSeenMessage = createAsyncThunk(
	'messages/updateLastSeenMessage',
	async ({ clanId, channelId, messageId, mode }: UpdateMessageArgs, thunkAPI) => {
		try {
			const mezon = await ensureSocket(getMezonCtx(thunkAPI));
			const now = Math.floor(Date.now() / 1000);
			await mezon.socketRef.current?.writeLastSeenMessage(clanId, channelId, mode, messageId, now);
		} catch (e) {
			captureSentryError(e, 'messages/updateLastSeenMessage');
			return thunkAPI.rejectWithValue(e);
		}
	},
	{
		condition: ({ channelId, messageId }, { getState }) => {
			const state = getState() as MessagesRootState;
			const message = selectMessageEntityById(state, channelId, messageId);
			if (!message) {
				return false;
			}
			if (message.isSending) {
				return false;
			}
			return true;
		}
	}
);

type SendMessagePayload = {
	clanId: string;
	channelId: string;
	content: IMessageSendPayload;
	mentions?: Array<ApiMessageMention>;
	attachments?: Array<ApiMessageAttachment>;
	references?: Array<ApiMessageRef>;
	anonymous?: boolean;
	mentionEveryone?: boolean;
	mode: number;
	senderId: string;
	isPublic: boolean;
	avatar?: string;
	isMobile?: boolean;
	username?: string;
	code?: number;
};

export const sendMessage = createAsyncThunk('messages/sendMessage', async (payload: SendMessagePayload, thunkAPI) => {
	const {
		mentions,
		attachments,
		references,
		anonymous,
		mentionEveryone,
		channelId,
		mode,
		isPublic,
		clanId,
		senderId,
		avatar,
		isMobile = false,
		username,
		code
	} = payload;

	let content = payload.content;

	const checkEnableE2EE = checkE2EE(clanId, channelId, thunkAPI);

	async function doSend() {
		try {
			const mezon = await ensureSocket(getMezonCtx(thunkAPI));

			const session = mezon.sessionRef.current;
			const client = mezon.clientRef.current;
			const socket = mezon.socketRef.current;

			if (!client || !session || !socket || !channelId) {
				throw new Error('Client is not initialized');
			}

			let uploadedFiles: ApiMessageAttachment[] = [];
			// Check if there are attachments
			if (attachments && attachments.length > 0) {
				if (isMobile) {
					uploadedFiles = await getMobileUploadedAttachments({ attachments, channelId, clanId, client, session });
				} else {
					uploadedFiles = await getWebUploadedAttachments({ attachments, channelId, clanId, client, session });
				}
			}

			if (checkEnableE2EE) {
				const state = thunkAPI.getState() as RootState;
				const currentDM = selectCurrentDM(state);
				const keys = selectE2eeByUserIds(state, currentDM.user_id as string[]);
				const pubKeys = await getPublicKeys(keys.filter((item) => item?.PK).map((item) => item.PK));
				const otherUserPublicKeys: PublicKeyMaterial[] = pubKeys;
				if (content?.t) {
					const encryptedMessage = await MessageCrypt.encryptMessage(content.t, otherUserPublicKeys, senderId);
					content = { ...content, t: encryptedMessage, e2ee: 1 };
				}
			}

			const res = await socket.writeChatMessage(
				clanId,
				channelId,
				mode,
				isPublic,
				content,
				mentions,
				uploadedFiles,
				references,
				anonymous,
				mentionEveryone,
				'',
				code
			);

			return res;
		} catch (error) {
			console.error('Failed to send message:', error);
			throw error;
		}
	}

	async function sendWithRetry(retryCount: number): ReturnType<typeof doSend> {
		try {
			const res = await doSend();
			return res;
		} catch (error) {
			if (retryCount > 0) {
				const r = await sendWithRetry(retryCount - 1);
				return r;
			} else {
				throw error;
			}
		}
	}

	const id = Snowflake.generate();
	async function fakeItUntilYouMakeIt() {
		const fakeMessage: ChannelMessage = {
			id,
			code: code || 0, // Add new message
			channel_id: channelId,
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-expect-error
			content,
			attachments,
			create_time: new Date().toISOString(),
			sender_id: senderId,
			username: username || '',
			avatar: avatar,
			isSending: true,
			references: references?.filter((item) => item) || [],
			isMe: true,
			hide_editted: true
		};
		const fakeMess = await thunkAPI.dispatch(messagesActions.mapMessageChannelToEntityAction({ message: fakeMessage })).unwrap();
		const state = getMessagesState(getMessagesRootState(thunkAPI));
		const isViewingOlderMessages = state.isViewingOlderMessagesByChannelId[channelId];

		if (!isViewingOlderMessages) {
			thunkAPI.dispatch(messagesActions.newMessage(fakeMess));
		}

		const res = await sendWithRetry(1);

		if (!isViewingOlderMessages) {
			const timestamp = Date.now() / 1000;
			thunkAPI.dispatch(channelMetaActions.setChannelLastSeenTimestamp({ channelId, timestamp }));

			const mess = { ...fakeMess, id: res.message_id, create_time: res.create_time };

			thunkAPI.dispatch(messagesActions.markAsSent({ id, mess }));
		}
	}

	try {
		await fakeItUntilYouMakeIt();
	} catch (error) {
		thunkAPI.dispatch(messagesActions.markAsError({ messageId: id, channelId }));
		captureSentryError(error, 'messages/sendMessage');
		return thunkAPI.rejectWithValue('Error sending message');
	}
});

export const addNewMessage = createAsyncThunk('messages/addNewMessage', async (message: MessagesEntity, thunkAPI) => {
	// ignore the message if in view older messages mode
	const state = getMessagesState(getMessagesRootState(thunkAPI));
	const isViewingOlderMessages = state.isViewingOlderMessagesByChannelId[message.channel_id];
	if (isViewingOlderMessages) {
		thunkAPI.dispatch(messagesActions.setLastMessage(message));
		return;
	}
	thunkAPI.dispatch(messagesActions.newMessage(message));
});

type UpdateTypingArgs = {
	channelId: string;
	userId: string;
	isTyping: boolean;
};

const typingTimeouts: { [key: string]: NodeJS.Timeout } = {};

export const updateTypingUsers = createAsyncThunk(
	'messages/updateTypingUsers',
	async ({ channelId, userId, isTyping }: UpdateTypingArgs, thunkAPI) => {
		// set user typing to true
		thunkAPI.dispatch(messagesActions.setUserTyping({ channelId, userId, isTyping }));

		const typingKey = channelId + userId;

		if (typingTimeouts[typingKey]) {
			clearTimeout(typingTimeouts[typingKey]);
		}

		typingTimeouts[typingKey] = setTimeout(() => {
			thunkAPI.dispatch(messagesActions.recheckTypingUsers({ channelId, userId }));
			delete typingTimeouts[userId];
		}, TYPING_TIMEOUT + 100);
	}
);

export type SendMessageArgs = {
	clanId: string;
	channelId: string;
	mode: number;
	isPublic: boolean;
};

export const sendTypingUser = createAsyncThunk(
	'messages/sendTypingUser',
	async ({ clanId, channelId, mode, isPublic }: SendMessageArgs, thunkAPI) => {
		const mezon = await ensureSocket(getMezonCtx(thunkAPI));
		const ack = mezon.socketRef.current?.writeMessageTyping(clanId, channelId, mode, isPublic);
		return ack;
	}
);

export const clickButtonMessage = createAsyncThunk(
	'messages/clickButtonMessage',
	async ({ message_id, channel_id, button_id, sender_id, user_id, extra_data }: MessageButtonClicked, thunkAPI) => {
		const mezon = await ensureSocket(getMezonCtx(thunkAPI));
		try {
			const response = mezon.socketRef.current?.handleMessageButtonClick(message_id, channel_id, button_id, sender_id, user_id, extra_data);
		} catch (e) {
			console.error(e);
		}
	}
);

export type SetChannelLastMessageArgs = {
	channelId: string;
	messageId: string;
};

export type SetUserTypingArgs = {
	userId: string;
	channelId: string;
	isTyping: boolean;
};

const channelMessagesAdapter = createEntityAdapter({
	selectId: (message: MessagesEntity) => message.id,
	sortComparer: orderMessageByIDAscending //orderMessageByTimeMsAscending
});

export const initialMessagesState: MessagesState = {
	loadingStatus: 'not loaded',
	error: null,
	isSending: false,
	unreadMessagesEntries: {},
	typingUsers: {},
	paramEntries: {},
	openOptionMessageState: false,
	firstMessageId: {},
	lastMessageByChannel: {},
	dataReactionGetFromLoadMessage: [],
	channelMessages: {},
	channelDraftMessage: {},
	isFocused: false,
	isViewingOlderMessagesByChannelId: {},
	isJumpingToPresent: {},
	idMessageToJump: null,
	channelIdLastFetch: '',
	directMessageUnread: {},
	channelViewPortMessageIds: {}
};

export type SetCursorChannelArgs = {
	channelId: string;
	param: FetchMessageParam;
};
export type MarkAsSentArgs = {
	id: string;
	mess: IMessageWithUser;
};

export const messagesSlice = createSlice({
	name: MESSAGES_FEATURE_KEY,
	initialState: initialMessagesState,
	reducers: {
		updateLastFiftyMessagesAction: (state, action: PayloadAction<string>) => {
			const channelId = action.payload;
			const messageIds = state.channelMessages[channelId]?.ids as string[];
			if (!messageIds || messageIds?.length <= 50) return;
			const lastFiftyIds = messageIds.slice(-50);
			const lastFiftyMessages = lastFiftyIds.map((id) => state.channelMessages[channelId].entities[id]);
			channelMessagesAdapter.setAll(state.channelMessages[channelId], lastFiftyMessages);
			state.channelViewPortMessageIds[channelId] = lastFiftyIds;
			state.isViewingOlderMessagesByChannelId[channelId] = false;
		},
		setIsViewingOlderMessages: (state, action: PayloadAction<{ channelId: string; isViewing: boolean }>) => {
			const { channelId, isViewing } = action.payload;
			state.isViewingOlderMessagesByChannelId[channelId] = isViewing;
		},
		setMessageParams: (state, action: PayloadAction<SetCursorChannelArgs>) => {
			state.paramEntries[action.payload.channelId] = action.payload.param;
		},
		setFirstMessageId: (state, action: PayloadAction<{ channelId: string; firstMessageId: string }>) => {
			state.firstMessageId[action.payload.channelId] = action.payload.firstMessageId;
		},
		setChannelIdLastFetch: (state, action: PayloadAction<{ channelId: string }>) => {
			state.channelIdLastFetch = action.payload.channelId;
		},
		setIdMessageToJump(state, action) {
			state.idMessageToJump = action.payload;
		},

		updateMessageReactions: (state, action: PayloadAction<ReactionEntity>) => {
			const { channel_id, message_id, emoji_id, sender_id, action: remove } = action.payload;

			if (!state.channelMessages[channel_id]?.entities[message_id]) return;
			const message = state.channelMessages[channel_id].entities[message_id];
			if (!message.reactions) {
				message.reactions = [];
			}
			const existingReactionIndex = message.reactions.findIndex((r) => r.emoji_id === emoji_id && r.sender_id === sender_id);
			if (existingReactionIndex !== -1) {
				!remove ? message.reactions[existingReactionIndex].count++ : (message.reactions[existingReactionIndex].count = 0);
			} else {
				message.reactions.push(action.payload);
			}
		},

		newMessage: (state, action: PayloadAction<MessagesEntity>) => {
			const { code, channel_id: channelId, id: messageId, isSending, isMe, isAnonymous, content, topic_id } = action.payload;

			if (!channelId || !messageId) return state;

			if (!state.channelMessages[channelId]) {
				state.channelMessages[channelId] = channelMessagesAdapter.getInitialState({
					id: channelId
				});
			}
			const channelEntity = state.channelMessages[channelId];
			switch (code) {
				case TypeMessage.Welcome:
				case TypeMessage.CreateThread:
				case TypeMessage.CreatePin:
				case TypeMessage.MessageBuzz:
				case TypeMessage.Chat: {
					if (topic_id !== '0' && topic_id) {
						handleAddOneMessage({ state, channelId: topic_id, adapterPayload: action.payload });

						state.lastMessageByChannel[channelId] = action.payload;
						if (!isSending && (isMe || isAnonymous)) {
							const newContent = content;

							const sendingMessages = state.channelMessages[topic_id]?.ids.filter(
								(id) => state.channelMessages[topic_id].entities[id].isSending
							);
							if (sendingMessages && sendingMessages.length) {
								for (const mid of sendingMessages) {
									const message = state.channelMessages[topic_id].entities[mid];
									if (message?.content?.t === newContent?.t && message?.channel_id === channelId) {
										state.channelMessages[topic_id] = handleRemoveOneMessage({ state, channelId: topic_id, messageId: mid });
										break;
									}
								}
							}
						}
					} else {
						handleAddOneMessage({ state, channelId, adapterPayload: action.payload });

						// update last message
						state.lastMessageByChannel[channelId] = action.payload;

						// update is viewing older messages
						// state.isViewingOlderMessagesByChannelId[channelId] = computeIsViewingOlderMessagesByChannelId(state, channelId);

						// remove sending message when receive new message by the same user
						// potential bug: if the user send the same message multiple times
						// or the sending message is the same as the received message from the server
						if (!isSending && (isMe || isAnonymous)) {
							const newContent = content;

							const sendingMessages = state.channelMessages[channelId].ids.filter(
								(id) => state.channelMessages[channelId].entities[id].isSending
							);
							if (sendingMessages && sendingMessages.length) {
								for (const mid of sendingMessages) {
									const message = state.channelMessages[channelId].entities[mid];
									// temporary remove sending message that has the same content
									// for later update, we could use some kind of id to identify the message
									if (message?.content?.t === newContent?.t && message?.channel_id === channelId) {
										state.channelMessages[channelId] = handleRemoveOneMessage({ state, channelId, messageId: mid });

										// remove the first one and break
										// prevent removing all sending messages with the same content
										break;
									}
								}
							}
						}
					}

					break;
				}
				case TypeMessage.ChatUpdate: {
					channelMessagesAdapter.updateOne(channelEntity, {
						id: action.payload.id,
						changes: {
							content: action.payload.content,
							mentions: action.payload.mentions,
							attachments: action.payload.attachments,
							hide_editted: action.payload.hide_editted,
							update_time: action.payload.update_time
						}
					});
					const replyList = handleUpdateReplyMessage(channelEntity, action.payload.id);
					if (replyList.length > 0) {
						const updates: { id: string; changes: MessagesEntity }[] = replyList.map((message) => {
							return {
								id: message.id,
								changes: {
									...message,
									references: message.references?.length
										? [{ ...message.references[0], content: JSON.stringify(action.payload.content) }]
										: []
								}
							};
						});
						channelMessagesAdapter.updateMany(channelEntity, updates);
					}
					break;
				}
				case TypeMessage.ChatRemove: {
					handleRemoveOneMessage({ state, channelId, messageId });
					break;
				}
				default:
					break;
			}
		},
		setManyLastMessages: (state, action: PayloadAction<ApiChannelMessageHeaderWithChannel[]>) => {
			action.payload.forEach((message) => {
				// update last message
				state.lastMessageByChannel[message.channel_id] = message;

				// update is viewing older messages
				// state.isViewingOlderMessagesByChannelId[message.channel_id] = computeIsViewingOlderMessagesByChannelId(state, message.channel_id);
			});
		},
		setLastMessage: (state, action: PayloadAction<ApiChannelMessageHeaderWithChannel>) => {
			// update last message
			state.lastMessageByChannel[action.payload.channel_id] = action.payload;

			// update is viewing older messages
			// state.isViewingOlderMessagesByChannelId[action.payload.channel_id] = computeIsViewingOlderMessagesByChannelId(
			// 	state,
			// 	action.payload.channel_id
			// );
		},
		setViewingOlder: (state, action: PayloadAction<{ channelId: string; status: boolean }>) => {
			const { channelId, status } = action.payload;
			state.isViewingOlderMessagesByChannelId[channelId] = status;
		},

		markAsSent: (state, action: PayloadAction<MarkAsSentArgs>) => {
			// the message is sent successfully
			// will be inserted to the list
			// from onChatMessage listener
		},
		markAsError: (
			state,
			action: PayloadAction<{
				messageId: string;
				channelId: string;
			}>
		) => {
			const channelId = action.payload.channelId;
			if (!state.channelMessages?.[channelId]) {
				state.channelMessages[channelId] = channelMessagesAdapter.getInitialState({
					id: channelId
				});
			}
			channelMessagesAdapter.updateOne(state.channelMessages[channelId], {
				id: action.payload.messageId,
				changes: {
					isError: true
				}
			});
		},
		clearChannelMessages: (state, action: PayloadAction<string>) => {
			handleRemoveManyMessages(state, action.payload);
		},
		remove: (
			state,
			action: PayloadAction<{
				channelId: string;
				messageId: string;
			}>
		) => {
			const { channelId, messageId } = action.payload;
			handleRemoveOneMessage({ state, channelId, messageId });
		},
		removeAll: () => initialMessagesState,
		setChannelLastMessage: (state, action: PayloadAction<SetChannelLastMessageArgs>) => {
			state.unreadMessagesEntries = {
				...state.unreadMessagesEntries,
				[action.payload.channelId]: action.payload.messageId
			};
		},
		UpdateChannelLastMessage: (state, action: PayloadAction<{ channelId: string }>) => {
			const lastMess = state.channelMessages[action.payload.channelId]?.ids.at(-1);
			state.unreadMessagesEntries = {
				...state.unreadMessagesEntries,
				[action.payload.channelId]: lastMess || ''
			};
		},
		setUserTyping: (state, action: PayloadAction<SetUserTypingArgs>) => {
			const { channelId, userId } = action.payload || {};
			const found = state.typingUsers?.[channelId]?.users?.find((user) => user.id === userId);
			if (found) {
				found.timeAt = Date.now();
				return;
			}

			const user = {
				id: userId,
				timeAt: Date.now()
			};

			if (!state.typingUsers) {
				state.typingUsers = {};
			}

			if (!state.typingUsers?.[channelId]) {
				state.typingUsers[channelId] = {
					users: []
				};
			}
			state.typingUsers[channelId].users.push(user);
		},
		recheckTypingUsers: (state, action) => {
			const { channelId, userId } = action.payload || {};
			if (!channelId) return;
			const typingUsers = state?.typingUsers?.[channelId];
			if (typingUsers?.users?.some((item) => item.id === userId)) {
				const now = Date.now();
				typingUsers.users = typingUsers.users.filter((item) => now - item.timeAt < TYPING_TIMEOUT);
			}
		},
		setOpenOptionMessageState(state, action) {
			state.openOptionMessageState = action.payload;
		},
		setIsFocused(state, action) {
			state.isFocused = action.payload;
		},
		setChannelDraftMessage(state, action: PayloadAction<{ channelId: string; channelDraftMessage: ChannelDraftMessages }>) {
			state.channelDraftMessage[action.payload.channelId] = action.payload.channelDraftMessage;
		},
		deleteChannelDraftMessage(state, action: PayloadAction<{ channelId: string }>) {
			delete state.channelDraftMessage[action.payload.channelId];
		},
		setIsJumpingToPresent(state, action: PayloadAction<{ channelId: string; status: boolean }>) {
			state.isJumpingToPresent[action.payload.channelId] = action.payload.status;
		},
		updateToBeTopicMessage(state, action: PayloadAction<{ channelId: string; messageId: string; topicId: string; creatorId: string }>) {
			state.channelMessages[action.payload.channelId].entities[action.payload.messageId].code = 9;
			state.channelMessages[action.payload.channelId].entities[action.payload.messageId].content!.tp = action.payload.topicId;
			state.channelMessages[action.payload.channelId].entities[action.payload.messageId].content!.cid = action.payload.creatorId;
		},
		updateUserMessage: (state, action: PayloadAction<{ userId: string; clanId: string; clanNick: string; clanAvt: string }>) => {
			const { userId, clanId, clanNick, clanAvt } = action.payload;
			for (const channelId in state.channelMessages) {
				const channel = state.channelMessages[channelId];
				if (channel) {
					const updatedEntities = { ...channel.entities };
					for (const messageId in updatedEntities) {
						const message = updatedEntities[messageId];
						if (message && message.sender_id === userId && message.clan_id === clanId) {
							updatedEntities[messageId] = {
								...message,
								clan_avatar: clanAvt,
								clan_nick: clanNick
							};
						}
					}
					state.channelMessages[channelId] = {
						...channel,
						entities: updatedEntities
					};
				}
			}
		}
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchMessages.pending, (state: MessagesState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(
				fetchMessages.fulfilled,
				(state: MessagesState, action: PayloadAction<FetchMessagesPayloadAction, string, FetchMessagesMeta>) => {
					const channelId = action?.payload.messages.at(0)?.channel_id || action.meta.arg.channelId;
					const isFetchingLatestMessages = action.payload.isFetchingLatestMessages || false;
					const isClearMessage = action.payload.isClearMessage || false;
					const fromCache = action.payload.fromCache || false;
					const isViewingOlderMessages = state.isViewingOlderMessagesByChannelId[channelId || ''];
					const foundE2ee = action.payload.foundE2ee || false;
					const lastSentMessageId = state.lastMessageByChannel[channelId]?.id;
					state.loadingStatus = 'loaded';
					let direction = action.meta.arg.direction;

					const isNew = channelId && action.payload.messages.some(({ id }) => !state.channelMessages?.[channelId]?.entities?.[id]);
					if (!direction && (!isNew || !channelId) && (!isClearMessage || (isClearMessage && fromCache)) && !foundE2ee) {
						return;
					}

					direction = direction || Direction_Mode.BEFORE_TIMESTAMP;

					// const reversedMessages = action.payload.messages.reverse();

					// remove all messages if clear message is true
					if (isClearMessage) {
						handleRemoveManyMessages(state, channelId);
					}

					// remove all messages if ís fetching latest messages and is viewing older messages
					if (isFetchingLatestMessages && isViewingOlderMessages) {
						handleRemoveManyMessages(state, channelId);
					}

					handleSetManyMessages({
						state,
						channelId,
						adapterPayload: action.payload.messages,
						direction,
						isClearMessage
					});

					const messageIds = state.channelMessages[channelId]?.ids as string[];
					if (messageIds?.length <= 50) {
						state.channelViewPortMessageIds[channelId] = messageIds;
						const showFab = !!lastSentMessageId && !messageIds.includes(lastSentMessageId as string) && messageIds.length >= 20;
						state.isViewingOlderMessagesByChannelId[channelId] = showFab;
						return;
					} else {
						const offsetId = action.meta.arg.messageId;
						const { newViewportIds } = getViewportSlice(messageIds, offsetId, direction);
						state.channelViewPortMessageIds[channelId] = newViewportIds;
						const showFab = !!lastSentMessageId && !newViewportIds.includes(lastSentMessageId as string) && messageIds.length >= 20;
						state.isViewingOlderMessagesByChannelId[channelId] = showFab;
					}
				}
			)
			.addCase(fetchMessages.rejected, (state: MessagesState, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			});
	}
});

/*
 * Export reducer for store configuration.
 */
export const messagesReducer = messagesSlice.reducer;

/*
 * Export action creators to be dispatched. For use with the `useDispatch` hook.
 *
 * e.g.
 * ```
 * import React, { useEffect } from 'react';
 * import { useDispatch } from 'react-redux';
import { channel } from 'process';
import { selectAllAccount } from '@mezon/store-mobile';
 *
 * // ...
 *
 * const dispatch = useDispatch();
 * useEffect(() => {
 *   dispatch(messagesActions.add({ id: 1 }))
 * }, [dispatch]);
 * ```
 *
 * See: https://react-redux.js.org/next/api/hooks#usedispatch
 */

export const messagesActions = {
	...messagesSlice.actions,
	addNewMessage,
	sendMessage,
	fetchMessages,
	updateLastSeenMessage,
	updateTypingUsers,
	sendTypingUser,
	loadMoreMessage,
	jumpToMessage,
	clickButtonMessage,
	mapMessageChannelToEntityAction
};

export const getMessagesState = (rootState: { [MESSAGES_FEATURE_KEY]: MessagesState }): MessagesState => rootState[MESSAGES_FEATURE_KEY];

export const getChannelIdAsSecondParam = (_: unknown, channelId: string) => channelId;

export function orderMessageByDate(a: MessagesEntity, b: MessagesEntity) {
	if (a.create_time_seconds && b.create_time_seconds) {
		return +b.create_time_seconds - +a.create_time_seconds;
	}
	return 0;
}

export function orderMessageByTimeMsAscending(a: MessagesEntity, b: MessagesEntity) {
	if (a.isFirst && !b.isFirst) {
		return -1;
	}
	if (!a.isFirst && b.isFirst) {
		return 1;
	}

	if (a.create_time_seconds && b.create_time_seconds) {
		return +a.create_time_seconds - +b.create_time_seconds;
	}
	return 0;
}

export function orderMessageByIDAscending(a: MessagesEntity, b: MessagesEntity) {
	if (a.isFirst && !b.isFirst) {
		return -1;
	}
	if (!a.isFirst && b.isFirst) {
		return 1;
	}

	const aid = BigInt(a.id);
	const bid = BigInt(b.id);

	return Number(aid - bid);
}

export const selectOpenOptionMessageState = createSelector(getMessagesState, (state: MessagesState) => state.openOptionMessageState);

export const selectMessagesEntityById = createSelector(
	[getMessagesState, getChannelIdAsSecondParam, (_, channelId) => channelId],
	(messagesState, channelId) => {
		return messagesState.channelMessages[channelId]?.entities;
	}
);

export const selectUnreadMessageEntries = createSelector(getMessagesState, (state) => state.unreadMessagesEntries);

export const selectUnreadMessageIdByChannelId = createSelector(
	[selectUnreadMessageEntries, (state, channelId) => channelId],
	(lastMessagesEntries, channelId) => {
		return lastMessagesEntries?.[channelId];
	}
);

export const selectTypingUsers = createSelector(getMessagesState, (state) => state.typingUsers);

export const selectTypingUsersById = createSelector([getMessagesState, (_state, channelId: string) => channelId], (state, channelId) => {
	return state?.typingUsers?.[channelId];
});

export const selectTypingUserIdsByChannelId = createSelector([selectTypingUsersById], (typingUsers) => {
	return typingUsers?.users;
});

export const selectMessageParams = createSelector(getMessagesState, (state) => state.paramEntries);
export const selectParamByChannelId = (channelId: string) =>
	createSelector(selectMessageParams, (param) => {
		return param?.[channelId];
	});

export const selectHasMoreMessageByChannelId = (channelId: string) =>
	createSelector(getMessagesState, (state) => {
		const firstMessageId = state.firstMessageId[channelId];
		if (!firstMessageId) return true;
		const isFirstMessageInChannel = state.channelMessages[channelId]?.entities[firstMessageId];
		return !isFirstMessageInChannel;
	});

export const selectHasMoreMessageByChannelId2 = createSelector([getMessagesState, getChannelIdAsSecondParam], (state, channelId) => {
	const firstMessageId = state.firstMessageId[channelId];

	if (!firstMessageId) return true;

	const isFirstMessageInChannel = state.channelMessages[channelId]?.entities[firstMessageId];

	// if the first message is not in the channel's messages, then there are more messages
	return !isFirstMessageInChannel;
});

// has more bottom when last message is not the channel's messages
export const selectHasMoreBottomByChannelId = (channelId: string) =>
	createSelector(getMessagesState, (state) => {
		const lastMessage = state.lastMessageByChannel[channelId];

		if (!lastMessage || !lastMessage.id) return false;

		const isLastMessageInChannel = state.channelMessages[channelId]?.entities[lastMessage.id];

		return !isLastMessageInChannel;
	});

export const selectHasMoreBottomByChannelId2 = createSelector([getMessagesState, getChannelIdAsSecondParam], (state, channelId) => {
	const lastMessage = state.lastMessageByChannel[channelId];

	if (!lastMessage || !lastMessage.id) return false;

	const isLastMessageInChannel = state.channelViewPortMessageIds[channelId]?.includes(lastMessage?.id);

	return !isLastMessageInChannel;
});

export const selectLastLoadMessageIDByChannelId = (channelId: string) =>
	createSelector(selectMessageParams, (param) => {
		return param[channelId]?.lastLoadMessageId;
	});

export const selectIsFocused = createSelector(getMessagesState, (state) => state.isFocused);

// V2

const emptyObject = {};
const emptyArray: string[] = [];

export const createCachedSelector = createSelectorCreator({
	memoize: weakMapMemoize,
	argsMemoize: weakMapMemoize
});

export const selectMessageParamsByChannelId = (channelId: string) =>
	createSelector(selectMessageParams, (param) => {
		return param[channelId];
	});

export const selectFirstLoadedMessageIdByChannelId = (channelId: string) =>
	createSelector(getMessagesState, (state) => {
		return state.channelMessages[channelId]?.ids[0];
	});

export const selectLastLoadedMessageIdByChannelId = (channelId: string) =>
	createSelector(getMessagesState, (state) => {
		return state.channelViewPortMessageIds[channelId]?.at(-1);
	});

export const selectMessageEntitiesByChannelId = createCachedSelector([getMessagesState, getChannelIdAsSecondParam], (messagesState, channelId) => {
	return messagesState.channelMessages[channelId]?.entities || emptyObject;
});

export const selectMessageIdsByChannelId = createCachedSelector([getMessagesState, getChannelIdAsSecondParam], (messagesState, channelId) => {
	return messagesState?.channelMessages[channelId]?.ids || emptyArray;
});

export const selectViewportIdsByChannelId = createCachedSelector([getMessagesState, getChannelIdAsSecondParam], (messagesState, channelId) => {
	return messagesState?.channelViewPortMessageIds[channelId] || emptyArray;
});

export const selectMessageIdsByChannelId2 = createSelector([selectMessageIdsByChannelId, selectViewportIdsByChannelId], (messageIds, viewportIds) => {
	if (!viewportIds?.length) {
		return messageIds;
	}
	return messageIds.filter((id) => viewportIds.includes(id));
});

export const selectMessagesByChannel = createSelector([getMessagesState, getChannelIdAsSecondParam], (messagesState, channelId) => {
	return messagesState?.channelMessages?.[channelId];
});

export const selectMessageByMessageId = createSelector(
	[selectMessagesByChannel, (_, __, messageId: string) => messageId],
	(channelMessages, messageId) => {
		return channelMessages?.entities?.[messageId];
	}
);

export const selectLastMessageByChannelId = createSelector([selectMessagesByChannel], (channelMessages) => {
	if (!channelMessages?.ids?.length) return null;
	const { ids, entities } = channelMessages;
	return entities[ids[ids.length - 1]];
});

export const selectMessageEntityById = createCachedSelector(
	[getMessagesState, getChannelIdAsSecondParam, (_, __, messageId) => messageId],
	(messagesState, channelId, messageId) => {
		return messagesState.channelMessages[channelId]?.entities?.[messageId] || emptyObject;
	}
);

export const selectLassSendMessageEntityBySenderId = createCachedSelector(
	[selectMessageEntitiesByChannelId, selectMessageIdsByChannelId, (_, __, senderId) => senderId],
	(entities, ids, senderId) => {
		const matchedId = [...ids].reverse().find((id) => entities?.[id]?.sender_id === senderId);
		return matchedId ? entities[matchedId] : null;
	}
);

export const selectChannelDraftMessage = createCachedSelector([getMessagesState, getChannelIdAsSecondParam], (messagesState, channelId) => {
	return messagesState.channelDraftMessage[channelId];
});

export const selectFirstMessageId = createCachedSelector([getMessagesState, getChannelIdAsSecondParam], (messagesState, channelId) => {
	return messagesState.firstMessageId[channelId] ?? '';
});

export const selectFirstMessageIdByChannelId = (channelId: string) =>
	createSelector(getMessagesState, (state) => {
		return state.firstMessageId[channelId] || '';
	});

// select selectLatestMessage's id
export const selectLatestMessageId = createCachedSelector([getMessagesState, getChannelIdAsSecondParam], (messagesState, channelId) => {
	return messagesState.lastMessageByChannel[channelId]?.id || '';
});

export const selectLastMessageIdByChannelId = createSelector(selectMessageIdsByChannelId, (ids) => {
	return ids.at(-1);
});

export const selectMessageIsLoading = createSelector(getMessagesState, (state) => state.loadingStatus === 'loading');

export const selectIsViewingOlderMessagesByChannelId = createSelector([getMessagesState, getChannelIdAsSecondParam], (state, channelId) => {
	return (state.isViewingOlderMessagesByChannelId[channelId] && state.channelMessages[channelId]?.ids.length) || false;
});

export const selectIsMessageIdExist = createSelector(
	[getMessagesState, getChannelIdAsSecondParam, (_, __, messageId) => messageId],
	(state, channelId, messageId) => {
		return Boolean(state.channelMessages[channelId]?.entities[messageId]);
	}
);

export const selectIsJumpingToPresent = createSelector(
	[getMessagesState, getChannelIdAsSecondParam],
	(state, channelId) => state.isJumpingToPresent[channelId]
);

export const selectIdMessageToJump = createSelector(getMessagesState, (state: MessagesState) => state.idMessageToJump);

const handleRemoveManyMessages = (state: MessagesState, channelId?: string) => {
	if (!channelId) return state;
	if (!state.channelMessages[channelId]) return state;
	state.channelMessages[channelId] = channelMessagesAdapter.removeAll(state.channelMessages[channelId]);
	return state;
};

const handleSetManyMessages = ({
	state,
	channelId,
	adapterPayload,
	direction,
	isClearMessage = false
}: {
	state: MessagesState;
	channelId?: string;
	adapterPayload: MessagesEntity[];
	direction?: Direction_Mode;
	isClearMessage?: boolean;
}) => {
	if (!channelId) return state;
	if (!state.channelMessages[channelId])
		state.channelMessages[channelId] = channelMessagesAdapter.getInitialState({
			id: channelId
		});
	if (isClearMessage) {
		state.channelMessages[channelId] = channelMessagesAdapter.setAll(state.channelMessages[channelId], adapterPayload);
	} else {
		if (!adapterPayload.length) return;
		state.channelMessages[channelId] = channelMessagesAdapter.setMany(state.channelMessages[channelId], adapterPayload);
	}
};

const handleRemoveOneMessage = ({ state, channelId, messageId }: { state: MessagesState; channelId: string; messageId: string }) => {
	const channelEntity = state.channelMessages[channelId];
	const index = channelEntity.ids.indexOf(messageId);

	const isViewingOlderMessages = state.isViewingOlderMessagesByChannelId[channelId];

	if (index === -1) return channelEntity;

	const { isStartedMessageGroup, isStartedMessageOfTheDay } = channelEntity.entities[messageId];
	const nextMessageId = channelEntity.ids[index + 1];

	if (nextMessageId && isStartedMessageGroup) {
		channelEntity.entities[nextMessageId].isStartedMessageGroup = isStartedMessageGroup;
		channelEntity.entities[nextMessageId].isStartedMessageOfTheDay = isStartedMessageOfTheDay;
	}

	// check if the message is the  channel last message
	// if it is, remove the last message
	if (state.lastMessageByChannel[channelId]?.id === messageId) {
		if (isViewingOlderMessages) {
			// remove last message
			delete state.lastMessageByChannel[channelId];
		} else {
			// get let last message id
			const prevMessageId = channelEntity.ids[index - 1];

			if (prevMessageId) {
				// set last message id to the previous message
				state.lastMessageByChannel[channelId] = channelEntity.entities[prevMessageId];
			}
		}
	}
	if (Array.isArray(state.channelViewPortMessageIds[channelId])) {
		state.channelViewPortMessageIds[channelId] = state.channelViewPortMessageIds[channelId].filter((item) => item !== messageId);
	}
	return channelMessagesAdapter.removeOne(channelEntity, messageId);
};

const handleAddOneMessage = ({ state, channelId, adapterPayload }: { state: MessagesState; channelId: string; adapterPayload: MessagesEntity }) => {
	if (state.channelMessages[channelId]) {
		state.channelMessages[channelId] = channelMessagesAdapter.addOne(state.channelMessages[channelId], adapterPayload);
		if (Array.isArray(state.channelViewPortMessageIds[channelId])) {
			state.channelViewPortMessageIds[channelId] = [...state.channelViewPortMessageIds[channelId], adapterPayload.id];
		}
	}
};

const handleUpdateReplyMessage = (channelEntity: EntityState<MessagesEntity, string> & { id: string }, message_ref_id: string) => {
	return channelMessagesAdapter
		.getSelectors()
		.selectAll(channelEntity)
		.filter((message) => message.references?.[0]?.message_ref_id === message_ref_id);
};
