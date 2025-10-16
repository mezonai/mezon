import { captureSentryError } from '@mezon/logger';
import type {
	ApiChannelMessageHeaderWithChannel,
	ChannelDraftMessages,
	EmojiDataOptionals,
	IMessageSendPayload,
	IMessageWithUser,
	LoadingStatus,
	PublicKeyMaterial
} from '@mezon/utils';
import {
	Direction_Mode,
	EMessageCode,
	LIMIT_MESSAGE,
	MessageCrypt,
	TypeMessage,
	getMobileUploadedAttachments,
	getPublicKeys,
	getWebUploadedAttachments
} from '@mezon/utils';
import type { EntityState, GetThunkAPI, PayloadAction, Update } from '@reduxjs/toolkit';
import { createAsyncThunk, createEntityAdapter, createSelector, createSelectorCreator, createSlice, weakMapMemoize } from '@reduxjs/toolkit';
import { Snowflake } from '@theinternetfolks/snowflake';
import type { ChannelMessage } from 'mezon-js';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import type { ApiChannelMessageHeader, ApiMessageAttachment, ApiMessageMention, ApiMessageRef } from 'mezon-js/api.gen';
import type { MessageButtonClicked } from 'mezon-js/socket';
import { accountActions, selectAllAccount } from '../account/account.slice';
import { getUserAvatarOverride, getUserClanAvatarOverride } from '../avatarOverride/avatarOverride';
import { resetChannelBadgeCount } from '../badge/badgeHelpers';
import type { CacheMetadata } from '../cache-metadata';
import { createApiKey, createCacheMetadata, markApiFirstCalled, shouldForceApiCall } from '../cache-metadata';
import { channelMetaActions } from '../channels/channelmeta.slice';
import { channelsActions, selectCurrentChannel, selectLoadingStatus, selectShowScrollDownButton } from '../channels/channels.slice';
import { selectUserClanProfileByClanID } from '../clanProfile/clanProfile.slice';
import { clansActions, selectClanById, selectClansLoadingStatus } from '../clans/clans.slice';
import { selectCurrentDM } from '../direct/direct.slice';
import { checkE2EE, selectE2eeByUserIds } from '../e2ee/e2ee.slice';
import type { MezonValueContext } from '../helpers';
import { ensureSession, ensureSocket, getMezonCtx } from '../helpers';
import type { ReactionEntity } from '../reactionMessage/reactionMessage.slice';
import type { AppDispatch, RootState } from '../store';
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
	typingName: string;
	timeAt: number;
}

export type ChannelTypingState = {
	users: UserTypingState[];
};

export type FetchMessageParam = {
	lastLoadMessageId?: string;
	hasMore?: boolean;
};

export interface MessagesState {
	loadingStatus: LoadingStatus;
	error?: string | null;
	isSending?: boolean;
	unreadMessagesEntries?: Record<string, string>;
	typingUsers?: Record<string, ChannelTypingState>;
	openOptionMessageState: boolean;
	firstMessageId: Record<string, string | null>;
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
			cache?: CacheMetadata;
		}
	>;
	channelViewPortMessageIds: Record<string, string[]>;
	isViewingOlderMessagesByChannelId: Record<string, boolean>;
	directMessageUnread: Record<string, ChannelMessage[]>;
	isLoadingJumpMessage?: boolean;
	queuedLastSeenMessages: UpdateMessageArgs[];
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
	toPresent?: boolean;
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

export const fetchMessagesCached = async (
	getState: () => RootState,
	ensuredMezon: MezonValueContext,
	clanId: string,
	channelId: string,
	messageId?: string,
	direction?: number,
	topicId?: string,
	noCache = false,
	dispatch?: AppDispatch
) => {
	const state = getState();

	let foundClan: boolean = clanId === '0' || !!selectClanById(clanId)(state);
	if (!foundClan) {
		if (dispatch && clanId !== '0') {
			const res = await dispatch(clansActions.fetchClans({ noCache: true })).unwrap();
			foundClan = res?.clans?.some((item) => item.id === clanId) ?? false;
			if (!foundClan) {
				return {
					messages: [],
					fromCache: true
				};
			}
		}
	}
	const channelData = state[MESSAGES_FEATURE_KEY].channelMessages[channelId];
	const apiKey = createApiKey('fetchMessages', clanId, channelId, direction || 1, topicId || '');
	const shouldForceCall = shouldForceApiCall(apiKey, channelData?.cache, noCache);

	if (!shouldForceCall && channelData?.ids?.length > 0) {
		const cachedMessages = channelData.ids.map((id) => channelData.entities[id]).filter(Boolean);
		return {
			messages: cachedMessages,
			fromCache: true
		};
	}

	// const response = await fetchDataWithSocketFallback(
	// 	ensuredMezon,
	// 	{
	// 		api_name: 'ListChannelMessages',
	// 		list_channel_message_req: {
	// 			channel_id: channelId,
	// 			message_id: messageId,
	// 			direction,
	// 			clan_id: clanId,
	// 			topic_id: topicId,
	// 			limit: LIMIT_MESSAGE
	// 		}
	// 	},
	// 	() => ensuredMezon.client.listChannelMessages(ensuredMezon.session, clanId, channelId, messageId, direction, LIMIT_MESSAGE, topicId),
	// 	'channel_message_list'
	// );

	async function listChannelMessagesWithRetry(retryCount = 5) {
		try {
			return await ensuredMezon.client.listChannelMessages(
				ensuredMezon.session,
				clanId,
				channelId,
				messageId,
				direction,
				LIMIT_MESSAGE,
				topicId
			);
		} catch (error) {
			if (retryCount > 1) {
				await new Promise((resolve) => setTimeout(resolve, 1000));
				return listChannelMessagesWithRetry(retryCount - 1);
			} else {
				throw error;
			}
		}
	}

	const response = await listChannelMessagesWithRetry();

	markApiFirstCalled(apiKey);

	return {
		...response,
		fromCache: false
	};
};

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
	toPresent?: boolean;
	topicId?: string;
	foundE2ee?: boolean;
};

const MESSAGE_LIST_SLICE = 100;

function getViewportSlice(sourceIds: string[], offsetId: string | undefined, direction: Direction_Mode) {
	const { length } = sourceIds;
	const index = offsetId ? sourceIds.findIndex((id, i) => id === offsetId) : -1;
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

const shouldReturnCachedMessages = (
	isFetchingLatestMessages: boolean | undefined,
	oldMessages: MessagesEntity[],
	lastSentMessage: ApiChannelMessageHeader | undefined,
	fromCache: boolean
): boolean => {
	if (!fromCache) {
		return false;
	}

	// if (isFetchingLatestMessages && oldMessages.at(-1)?.id !== lastSentMessage?.id) {
	// 	return false;
	// }

	if (fromCache) {
		return true;
	}

	return false;
};

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
			foundE2ee,
			toPresent
		}: fetchMessageChannelPayload,
		thunkAPI
	) => {
		try {
			const state = thunkAPI.getState() as RootState;

			let chlId = channelId;
			if (topicId) {
				chlId = topicId || '';
			}

			if (isFetchingLatestMessages) {
				thunkAPI.dispatch(messagesActions.setIdMessageToJump(null));
			}

			const mezon = await ensureSession(getMezonCtx(thunkAPI));

			let currentUser = selectAllAccount(state);
			if (!currentUser) {
				currentUser = await thunkAPI.dispatch(accountActions.getUserProfile()).unwrap();
			}

			const response = await fetchMessagesCached(
				thunkAPI.getState as () => RootState,
				mezon,
				clanId,
				channelId,
				messageId,
				direction,
				topicId,
				noCache,
				thunkAPI.dispatch as AppDispatch
			);

			const fromCache = response.fromCache || false;

			if (!response.messages) {
				return {
					messages: []
				};
			}

			let lastSentMessage = (state.messages.lastMessageByChannel[chlId] as ApiChannelMessageHeader) || response.last_sent_message;

			if (!fromCache) {
				lastSentMessage = response.last_sent_message as ApiChannelMessageHeader;
			}
			const lastSentState = selectLatestMessageId(state, chlId);
			const lastSeenState = selectLastSeenMessageStateByChannelId(state, chlId);
			if (
				!lastSentState ||
				(lastSentMessage && lastSentMessage.id && (lastSentMessage?.timestamp_seconds || 0) >= (lastSeenState?.timestamp_seconds || 0))
			) {
				thunkAPI.dispatch(
					messagesActions.setLastMessage({
						...lastSentMessage,
						channel_id: chlId
					})
				);
			}

			const oldMessages = channelMessagesAdapter.getSelectors().selectAll(state.messages.channelMessages[chlId] || { ids: [], entities: {} });

			const lastLoadMessage = !fromCache ? response.messages?.at(-1) || oldMessages[0] : oldMessages[0];
			const hasMore = lastLoadMessage?.code !== EMessageCode.FIRST_MESSAGE;

			thunkAPI.dispatch(
				messagesActions.setFirstMessageId({
					channelId: chlId,
					firstMessageId: !hasMore ? lastLoadMessage?.id : null
				})
			);

			if (shouldReturnCachedMessages(isFetchingLatestMessages, oldMessages, lastSentMessage, !!fromCache)) {
				return {
					messages: [],
					isClearMessage,
					fromCache: true
				};
			}

			let messages = response.messages.map((item: ChannelMessage) => {
				return mapMessageChannelToEntity(item, response.last_seen_message?.id);
			});

			if (clanId === '0' || !clanId) {
				messages = await MessageCrypt.decryptMessages(messages, currentUser?.user?.id as string);
			}

			if (!state.messages.channelMessages?.[channelId]?.cache && response.last_seen_message?.id) {
				thunkAPI.dispatch(
					messagesActions.setChannelLastMessage({
						channelId: chlId,
						messageId: response.last_seen_message?.id
					})
				);
			}

			if (isFetchingLatestMessages && lastSentMessage?.id && !fromCache) {
				let mode: number | undefined;
				let badge_count: number | undefined;

				if (clanId !== '0') {
					const currentChannel = selectCurrentChannel(state);
					if (currentChannel) {
						badge_count = currentChannel.count_mess_unread || 0;
						if (
							currentChannel.type === ChannelType.CHANNEL_TYPE_CHANNEL ||
							currentChannel.type === ChannelType.CHANNEL_TYPE_STREAMING ||
							currentChannel.type === ChannelType.CHANNEL_TYPE_APP ||
							currentChannel.type === ChannelType.CHANNEL_TYPE_MEZON_VOICE
						) {
							mode = ChannelStreamMode.STREAM_MODE_CHANNEL;
						} else {
							mode = ChannelStreamMode.STREAM_MODE_THREAD;
						}
					}
				} else {
					const currentDmGroup = selectCurrentDM(state);
					if (currentDmGroup) {
						badge_count = currentDmGroup.count_mess_unread || 0;
						if (currentDmGroup.type === ChannelType.CHANNEL_TYPE_DM) {
							mode = ChannelStreamMode.STREAM_MODE_DM;
						} else {
							mode = ChannelStreamMode.STREAM_MODE_GROUP;
						}
					}
				}

				if (mode !== undefined && badge_count !== undefined) {
					thunkAPI.dispatch(
						messagesActions.updateLastSeenMessage({
							channelId: chlId,
							messageId: lastSentMessage.id,
							mode,
							message_time: lastSentMessage.timestamp_seconds,
							badge_count,
							clanId
						})
					);
				}
			}

			return {
				messages,
				isFetchingLatestMessages,
				isClearMessage,
				viewingOlder,
				foundE2ee,
				toPresent
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
			let chlId = channelId;
			if (topicId) {
				chlId = topicId || '';
			}

			const state = getMessagesState(getMessagesRootState(thunkAPI));
			// ignore when:
			// - jumping to present
			// - loading
			// - already have message to jump to
			// Potential bug: if the idMessageToJump is not removed, the user will not be able to load more messages
			if (state.loadingStatus === 'loading' || state.idMessageToJump?.id) {
				return;
			}

			if (direction === Direction_Mode.BEFORE_TIMESTAMP) {
				const lastScrollMessageId = state.channelViewPortMessageIds[chlId]?.[0];

				if (topicId) {
					return await thunkAPI.dispatch(
						fetchMessages({
							clanId,
							channelId,
							direction,
							topicId,
							messageId: lastScrollMessageId,
							noCache: true
						})
					);
				}

				return await thunkAPI.dispatch(
					fetchMessages({
						clanId,
						channelId,
						messageId: lastScrollMessageId,
						direction,
						noCache: true
					})
				);
			} else {
				const lastChannelMessageId = selectLatestMessageId(getMessagesRootState(thunkAPI), chlId);
				const firstScrollMessageId = selectLastLoadedMessageIdByChannelId(chlId)(getMessagesRootState(thunkAPI));
				if (!lastChannelMessageId || !firstScrollMessageId || lastChannelMessageId === firstScrollMessageId) {
					return;
				}

				if (topicId) {
					return await thunkAPI.dispatch(
						fetchMessages({
							clanId,
							channelId,
							direction,
							messageId: firstScrollMessageId,
							topicId,
							noCache: true
						})
					);
				}

				return await thunkAPI.dispatch(
					fetchMessages({
						clanId,
						channelId,
						noCache: true,
						messageId: firstScrollMessageId,
						direction
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
	topicId?: string;
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
	async (
		{ clanId, messageId, channelId, noCache = true, isFetchingLatestMessages = false, navigate, mode, topicId }: JumpToMessageArgs,
		thunkAPI
	) => {
		let timeoutId: NodeJS.Timeout | undefined;
		try {
			thunkAPI.dispatch(messagesActions.setLoadingJumpMessage(true));
			thunkAPI.dispatch(messagesActions.setIdMessageToJump({ id: 'temp', navigate: false }));
			timeoutId = setTimeout(() => {
				thunkAPI.dispatch(messagesActions.setIdMessageToJump(null));
				thunkAPI.dispatch(messagesActions.setLoadingJumpMessage(false));
			}, 15000);
			const channelMessages = selectViewportIdsByChannelId(getMessagesRootState(thunkAPI), channelId);
			const indexMessage = channelMessages.indexOf(messageId);
			let found = true;
			if (indexMessage < 10) {
				thunkAPI.dispatch(
					channelsActions.setScrollDownVisibility({
						channelId,
						isVisible: true
					})
				);
				const response = await thunkAPI
					.dispatch(
						fetchMessages({
							clanId,
							channelId,
							noCache: true,
							messageId,
							direction: Direction_Mode.AROUND_TIMESTAMP,
							isFetchingLatestMessages,
							viewingOlder: true,
							isClearMessage: true,
							topicId
						})
					)
					.unwrap();

				found = response?.messages?.some((item) => item.id === messageId);
				if (!found) {
					thunkAPI.dispatch(messagesActions.setIdMessageToJump(null));
				}
			}

			const state = thunkAPI.getState() as RootState;
			const currentClanId = state.clans?.currentClanId;
			const isDirectMessage = !clanId && currentClanId === '0';

			const isClanChanged = currentClanId !== clanId;
			const isChannelChanged = clanId && state.channels.byClans[clanId]?.currentChannelId !== channelId;
			const shouldNavigate = !isDirectMessage && (isClanChanged || (clanId && isChannelChanged));

			if (shouldNavigate) {
				let channelPath = `/chat/clans/${clanId}/channels/${channelId}`;
				if (clanId === '0') {
					channelPath = `/chat/direct/message/${channelId}/${mode}`;
				}
				found &&
					thunkAPI.dispatch(
						messagesActions.setIdMessageToJump({
							id: messageId,
							navigate: true
						})
					);
				navigate && navigate(channelPath);
			} else {
				found &&
					thunkAPI.dispatch(
						messagesActions.setIdMessageToJump({
							id: messageId,
							navigate: false
						})
					);
			}
		} catch (e) {
			captureSentryError(e, 'messages/jumpToMessage');
			thunkAPI.dispatch(messagesActions.setIdMessageToJump(null));
			if (timeoutId) clearTimeout(timeoutId);
			return thunkAPI.rejectWithValue(e);
		} finally {
			thunkAPI.dispatch(messagesActions.setLoadingJumpMessage(false));
			if (timeoutId) clearTimeout(timeoutId);
		}
	}
);

type UpdateMessageArgs = {
	clanId: string;
	channelId: string;
	messageId: string;
	mode: number;
	badge_count: number;
	message_time?: number;
	updateLast?: boolean;
};

export const updateLastSeenMessage = createAsyncThunk(
	'messages/updateLastSeenMessage',
	async ({ clanId, channelId, messageId, mode, badge_count, message_time, updateLast = false }: UpdateMessageArgs, thunkAPI) => {
		try {
			const mezon = await ensureSocket(getMezonCtx(thunkAPI));
			const now = Math.floor(Date.now() / 1000);
			const state = thunkAPI.getState() as RootState;
			const channelsLoadingStatus = selectLoadingStatus(state);
			const clansLoadingStatus = selectClansLoadingStatus(state);
			if (channelsLoadingStatus === 'loading' || clansLoadingStatus === 'loading') {
				thunkAPI.dispatch(messagesActions.queueLastSeenMessage({ clanId, channelId, messageId, mode, badge_count, message_time }));
				return;
			}

			const queuedMessages = (thunkAPI.getState() as RootState).messages?.queuedLastSeenMessages;
			if (queuedMessages.length > 0) {
				thunkAPI.dispatch(processQueuedLastSeenMessages());
			}

			const response = await mezon.socketRef.current?.writeLastSeenMessage(
				clanId,
				channelId,
				mode,
				messageId,
				message_time ?? now,
				badge_count
			);

			if (response?.channel_id !== channelId) {
				return;
			}

			resetChannelBadgeCount(thunkAPI.dispatch as AppDispatch, {
				clanId,
				channelId,
				badgeCount: badge_count,
				timestamp: message_time ?? now,
				messageId
			});

			if (clanId && clanId !== '0') {
				const state = thunkAPI.getState() as RootState;
				const clan = selectClanById(clanId)(state);

				if (clan?.has_unread_message) {
					requestIdleCallback(() => {
						thunkAPI.dispatch(clansActions.updateHasUnreadBasedOnChannels({ clanId }));
					});
				}
			}
		} catch (e) {
			console.error(e, 'updateLastSeenMessage');
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

export const processQueuedLastSeenMessages = createAsyncThunk('messages/processQueuedLastSeenMessages', async (_, thunkAPI) => {
	const state = thunkAPI.getState() as RootState;
	const queuedMessages = state.messages.queuedLastSeenMessages;

	if (queuedMessages.length === 0) {
		return;
	}

	thunkAPI.dispatch(messagesActions.clearQueuedLastSeenMessages());

	for (const queuedMessage of queuedMessages) {
		const channelEntity = state.channels.byClans[queuedMessage.clanId]?.entities?.entities?.[queuedMessage.channelId];
		const actualBadgeCount = channelEntity?.count_mess_unread || queuedMessage.badge_count;
		await thunkAPI.dispatch(
			updateLastSeenMessage({
				...queuedMessage,
				badge_count: actualBadgeCount
			})
		);
	}
});

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
		const mezon = await ensureSocket(getMezonCtx(thunkAPI));

		const session = mezon.sessionRef.current;
		const client = mezon.clientRef.current;
		const socket = mezon.socketRef.current;

		if (!client || !session || !socket || !channelId) {
			throw new Error('Client is not initialized');
		}

		let uploadedFiles: ApiMessageAttachment[] = [];
		if (attachments && attachments.length > 0) {
			if (isMobile) {
				uploadedFiles = await getMobileUploadedAttachments({
					attachments,
					channelId,
					clanId,
					client,
					session
				});
			} else {
				uploadedFiles = await getWebUploadedAttachments({
					attachments,
					channelId,
					clanId,
					client,
					session
				});
			}
		}

		if (checkEnableE2EE) {
			const state = thunkAPI.getState() as RootState;
			const currentDM = selectCurrentDM(state);
			const keys = selectE2eeByUserIds(state, currentDM.user_ids as string[]);

			const missingKeys = keys.filter((entity) => !entity?.PK);
			if (missingKeys.length > 0) {
				throw new Error(
					"Some participants haven't set up encryption yet. Please wait for them to complete setup before sending encrypted messages."
				);
			}

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
		const rootState = thunkAPI.getState() as RootState;
		const currentUser = selectAllAccount(rootState);

		const overrideAvatar = getUserAvatarOverride(senderId);
		const overrideClanAvatar = clanId && clanId !== '0' ? getUserClanAvatarOverride(senderId, clanId) : undefined;

		let clanAvatar = avatar;
		if (clanId && clanId !== '0' && currentUser?.user?.id) {
			const userClanProfile = selectUserClanProfileByClanID(clanId, currentUser.user.id)(rootState);
			clanAvatar = overrideClanAvatar || userClanProfile?.avatar || avatar;
		}

		const finalAvatar = overrideAvatar || avatar;

		const fakeMessage: ChannelMessage = {
			id,
			code: code || 0, // Add new message
			channel_id: channelId,
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-expect-error
			content,
			attachments,
			create_time: new Date().toISOString(),
			sender_id: anonymous ? NX_CHAT_APP_ANNONYMOUS_USER_ID : senderId,
			username: anonymous ? 'Anonymous' : username || '',
			avatar: anonymous ? '' : finalAvatar,
			clan_avatar: clanId && clanId !== '0' ? clanAvatar : undefined,
			clan_id: clanId !== '0' ? clanId : undefined,
			isSending: true,
			references: references?.filter((item) => item) || [],
			isMe: true,
			hide_editted: true,
			isAnonymous: anonymous
		};
		const fakeMess = await thunkAPI
			.dispatch(
				messagesActions.mapMessageChannelToEntityAction({
					message: fakeMessage
				})
			)
			.unwrap();
		const state = getMessagesState(getMessagesRootState(thunkAPI));
		const isViewingOlderMessages = state.isViewingOlderMessagesByChannelId[channelId];

		if (!isViewingOlderMessages) {
			thunkAPI.dispatch(messagesActions.addNewMessage(fakeMess));
		}

		try {
			thunkAPI.dispatch(messagesActions.markAsSent({ id, mess: fakeMess }));
			thunkAPI.dispatch(
				channelsActions.setScrollPosition({
					channelId,
					messageId: undefined
				})
			);
			await sendWithRetry(1);

			if (!isViewingOlderMessages) {
				const timestamp = Date.now() / 1000;
				thunkAPI.dispatch(
					channelMetaActions.setChannelLastSeenTimestamp({
						channelId,
						timestamp
					})
				);
			}
		} catch (error) {
			thunkAPI.dispatch(messagesActions.markAsError({ messageId: id, channelId }));
			captureSentryError(error, 'messages/sendMessage');
			throw error;
		}
	}

	try {
		await fakeItUntilYouMakeIt();
	} catch (error) {
		return thunkAPI.rejectWithValue('Error sending message');
	}
});

// Add ephemeral message sending functionality
type SendEphemeralMessagePayload = {
	receiverId: string;
	clanId: string;
	channelId: string;
	content: IMessageSendPayload;
	mentions?: Array<ApiMessageMention>;
	attachments?: Array<ApiMessageAttachment>;
	references?: Array<ApiMessageRef>;
	mode: number;
	senderId: string;
	isPublic: boolean;
	avatar?: string;
	username?: string;
};

export const sendEphemeralMessage = createAsyncThunk('messages/sendEphemeralMessage', async (payload: SendEphemeralMessagePayload, thunkAPI) => {
	const { receiverId, clanId, channelId, content, mentions, attachments, references, mode, senderId, isPublic, avatar, username } = payload;

	try {
		const mezon = await ensureSocket(getMezonCtx(thunkAPI));
		const session = mezon.sessionRef.current;
		const client = mezon.clientRef.current;
		const socket = mezon.socketRef.current;

		if (!client || !session || !socket || !channelId) {
			throw new Error('Client is not initialized');
		}

		let uploadedFiles: ApiMessageAttachment[] = [];
		if (attachments && attachments.length > 0) {
			uploadedFiles = await getWebUploadedAttachments({
				attachments,
				channelId,
				clanId,
				client,
				session
			});
		}

		let avatarToUse = avatar;
		if (avatarToUse?.endsWith('croppedWEBP')) {
			avatarToUse = undefined;
		}

		await socket.writeEphemeralMessage(
			receiverId,
			clanId,
			channelId,
			mode,
			isPublic,
			content,
			mentions,
			uploadedFiles,
			references,
			false,
			false,
			avatarToUse || undefined,
			TypeMessage.Ephemeral
		);

		return {
			message_id: Snowflake.generate(),
			create_time: new Date().toISOString()
		};
	} catch (error) {
		console.error('Failed to send ephemeral message:', error);
		throw error;
	}
});

export const addNewMessage = createAsyncThunk('messages/addNewMessage', async (message: MessagesEntity, thunkAPI) => {
	if (!message?.channel_id) return;

	const state = thunkAPI.getState() as RootState;
	const channelId = message.channel_id;

	if (!state.messages.channelMessages?.[channelId]?.cache) {
		thunkAPI.dispatch(messagesActions.setLastMessage(message));
		return;
	}

	const isViewingOlderMessages = getMessagesState(getMessagesRootState(thunkAPI))?.isViewingOlderMessagesByChannelId?.[channelId];
	const isBottom = !selectShowScrollDownButton(state, channelId);

	const scrollPosition = state.channels?.scrollPosition?.[channelId];
	const viewportIds = selectViewportIdsByChannelId(state, channelId);

	let shouldSetViewingOlder = isViewingOlderMessages;
	let needsRebalance = false;

	if (scrollPosition?.messageId && viewportIds?.length > 0) {
		const scrollMessageIndex = viewportIds.indexOf(scrollPosition.messageId);

		if (scrollMessageIndex === -1) {
			const allMessageIds = state.messages.channelMessages[channelId]?.ids as string[];
			const messageExistsInChannel = allMessageIds?.includes(scrollPosition.messageId);

			if (!messageExistsInChannel) {
				thunkAPI.dispatch(channelsActions.clearScrollPosition({ clanId: '', channelId }));
			} else {
				shouldSetViewingOlder = true;
			}
		} else {
			const distanceFromBottom = viewportIds.length - scrollMessageIndex - 1;
			const distanceFromTop = scrollMessageIndex;

			if (distanceFromBottom >= 25 || distanceFromTop >= 25) {
				needsRebalance = true;
				shouldSetViewingOlder = true;
			}
		}
	}

	if (shouldSetViewingOlder && !needsRebalance) {
		if (shouldSetViewingOlder !== isViewingOlderMessages) {
			thunkAPI.dispatch(messagesActions.setViewingOlder({ channelId, status: true }));
		}

		thunkAPI.dispatch(messagesActions.setLastMessage(message));
		return;
	}

	thunkAPI.dispatch(messagesActions.newMessage(message));

	if (needsRebalance && scrollPosition?.messageId) {
		const updatedState = thunkAPI.getState() as RootState;
		const allMessageIds = updatedState.messages.channelMessages[channelId]?.ids as string[];

		if (allMessageIds?.length > 0) {
			const fullMessageIndex = allMessageIds.indexOf(scrollPosition.messageId);
			if (fullMessageIndex !== -1) {
				const halfSlice = 50;
				const from = Math.max(0, fullMessageIndex - halfSlice);
				const to = Math.min(allMessageIds.length - 1, fullMessageIndex + halfSlice);
				const newViewportIds = allMessageIds.slice(from, to + 1);
				thunkAPI.dispatch(
					messagesActions.setViewportIds({
						channelId,
						viewportIds: newViewportIds
					})
				);
			}
		}
	} else {
		thunkAPI.dispatch(
			messagesActions.addMessageToViewport({
				channelId,
				messageId: message.id,
				keep50items: isBottom
			})
		);
	}
});

type UpdateTypingArgs = {
	channelId: string;
	userId: string;
	isTyping: boolean;
	typingName: string;
};

const typingTimeouts: { [key: string]: NodeJS.Timeout } = {};

export const updateTypingUsers = createAsyncThunk(
	'messages/updateTypingUsers',
	async ({ channelId, userId, isTyping, typingName }: UpdateTypingArgs, thunkAPI) => {
		// set user typing to true
		thunkAPI.dispatch(messagesActions.setUserTyping({ channelId, userId, isTyping, typingName }));

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
	username: string;
	topicId?: string;
};

export const sendTypingUser = createAsyncThunk(
	'messages/sendTypingUser',
	async ({ clanId, channelId, mode, isPublic, username, topicId = '' }: SendMessageArgs, thunkAPI) => {
		const mezon = await ensureSocket(getMezonCtx(thunkAPI));
		const ack = mezon.socketRef.current?.writeMessageTyping(clanId, channelId, mode, isPublic, username, topicId);
		return ack;
	}
);

export const clickButtonMessage = createAsyncThunk(
	'messages/clickButtonMessage',
	async ({ message_id, channel_id, button_id, sender_id, user_id, extra_data }: MessageButtonClicked, thunkAPI) => {
		const mezon = await ensureSocket(getMezonCtx(thunkAPI));
		try {
			mezon.socketRef.current?.handleMessageButtonClick(message_id, channel_id, button_id, sender_id, user_id, extra_data);
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
	typingName: string;
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
	directMessageUnread: {},
	channelViewPortMessageIds: {},
	isLoadingJumpMessage: false,
	queuedLastSeenMessages: []
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
		setFirstMessageId: (
			state,
			action: PayloadAction<{
				channelId: string;
				firstMessageId: string | null;
			}>
		) => {
			state.firstMessageId[action.payload.channelId] = action.payload.firstMessageId;
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
			const {
				code,
				channel_id: channelId,
				id: messageId,
				isSending,
				isMe,
				isAnonymous,
				content,
				topic_id,
				referenced_message
			} = action.payload;

			if (!channelId || !messageId) return state;

			if (!state.channelMessages[channelId]) {
				state.channelMessages[channelId] = channelMessagesAdapter.getInitialState({
					id: channelId
				});
			}
			const messageChannelId = topic_id !== '0' && topic_id && !content?.tp ? topic_id : channelId;
			const channelEntity = state.channelMessages[messageChannelId];

			switch (code) {
				case TypeMessage.Welcome:
				case TypeMessage.UpcomingEvent:
				case TypeMessage.CreateThread:
				case TypeMessage.CreatePin:
				case TypeMessage.MessageBuzz:
				case TypeMessage.AuditLog:
				case TypeMessage.SendToken:
				case TypeMessage.Ephemeral:
				case TypeMessage.Chat: {
					if (topic_id !== '0' && topic_id) {
						handleAddOneMessage({
							state,
							channelId: topic_id,
							adapterPayload: action.payload
						});
						state.lastMessageByChannel[channelId] = action.payload;
					} else {
						handleAddOneMessage({
							state,
							channelId,
							adapterPayload: action.payload
						});
						// update last message
						const lastMessage: ApiChannelMessageHeaderWithChannel = {
							...action.payload,
							timestamp_seconds: action.payload.create_time_seconds
						};

						state.lastMessageByChannel[channelId] = lastMessage;

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
										state.channelMessages[channelId] = handleRemoveOneMessage({
											state,
											channelId,
											messageId: mid
										});

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
										? [
												{
													...message.references[0],
													content: JSON.stringify(action.payload.content)
												}
											]
										: []
								}
							};
						});
						channelMessagesAdapter.updateMany(channelEntity, updates);
					}
					break;
				}
				case TypeMessage.ChatRemove: {
					updateReferenceMessage({
						state,
						channelId,
						listMessageIds: referenced_message as string[]
					});
					handleRemoveOneMessage({ state, channelId, messageId });
					break;
				}
				default:
					break;
			}
		},
		setManyLastMessages: (state, action: PayloadAction<ApiChannelMessageHeaderWithChannel[]>) => {
			action.payload.forEach((message) => {
				state.lastMessageByChannel[message.channel_id] = message;
			});
		},
		setLastMessage: (state, action: PayloadAction<ApiChannelMessageHeaderWithChannel>) => {
			state.lastMessageByChannel[action.payload.channel_id] = action.payload;
		},
		setViewingOlder: (state, action: PayloadAction<{ channelId: string; status: boolean }>) => {
			const { channelId, status } = action.payload;
			state.isViewingOlderMessagesByChannelId[channelId] = status;
		},

		markAsSent: (state, action: PayloadAction<MarkAsSentArgs>) => {
			const channelId = action.payload.mess.channel_id;
			if (channelId) {
				state.unreadMessagesEntries = {
					...state.unreadMessagesEntries,
					[channelId]: ''
				};
			}
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
			const lastMess = state.channelViewPortMessageIds?.[action.payload.channelId]?.at(-1);
			state.unreadMessagesEntries = {
				...state.unreadMessagesEntries,
				[action.payload.channelId]: lastMess || ''
			};
		},
		setUserTyping: (state, action: PayloadAction<SetUserTypingArgs>) => {
			const { channelId, userId, typingName } = action.payload || {};
			const found = state.typingUsers?.[channelId]?.users?.find((user) => user.id === userId);
			if (found) {
				found.timeAt = Date.now();
				return;
			}

			const user = {
				id: userId,
				timeAt: Date.now(),
				typingName
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
		setChannelDraftMessage(
			state,
			action: PayloadAction<{
				channelId: string;
				channelDraftMessage: ChannelDraftMessages;
			}>
		) {
			state.channelDraftMessage[action.payload.channelId] = action.payload.channelDraftMessage;
		},
		deleteChannelDraftMessage(state, action: PayloadAction<{ channelId: string }>) {
			delete state.channelDraftMessage[action.payload.channelId];
		},
		setIsJumpingToPresent(state, action: PayloadAction<{ channelId: string; status: boolean }>) {
			state.isJumpingToPresent[action.payload.channelId] = action.payload.status;
		},
		updateToBeTopicMessage(
			state,
			action: PayloadAction<{
				channelId: string;
				messageId: string;
				topicId: string;
				creatorId: string;
			}>
		) {
			state.channelMessages[action.payload.channelId].entities[action.payload.messageId].code = 9;
			state.channelMessages[action.payload.channelId].entities[action.payload.messageId].content!.tp = action.payload.topicId;
			state.channelMessages[action.payload.channelId].entities[action.payload.messageId].content!.cid = action.payload.creatorId;
		},
		updateUserMessage: (
			state,
			action: PayloadAction<{
				userId: string;
				clanId: string;
				clanNick: string;
				clanAvt: string;
			}>
		) => {
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
		},
		setLoadingJumpMessage: (state, action) => {
			state.isLoadingJumpMessage = action.payload;
		},
		addMessageToViewport: (
			state,
			{
				payload
			}: PayloadAction<{
				channelId: string;
				messageId: string;
				keep50items: boolean;
			}>
		) => {
			const { channelId, messageId, keep50items } = payload;
			const currentViewport = state.channelViewPortMessageIds[channelId] || [];

			const updatedViewport =
				currentViewport.length >= 50 ? [...currentViewport.slice(keep50items ? -49 : 1), messageId] : [...currentViewport, messageId];

			state.channelViewPortMessageIds[channelId] = updatedViewport;

			const firstId = state.firstMessageId[channelId];
			if (firstId && !updatedViewport.includes(firstId)) {
				state.firstMessageId[channelId] = null;
			}
		},
		jumToPresent: (state, action) => {
			const { channelId } = action.payload;
			const messageIds = state.channelMessages[channelId]?.ids as string[];
			if (messageIds?.length) {
				state.channelViewPortMessageIds[channelId] = messageIds.slice(-50);
			}
		},
		setViewportIds: (
			state,
			action: PayloadAction<{
				channelId: string;
				viewportIds: string[];
			}>
		) => {
			const { channelId, viewportIds } = action.payload;
			state.channelViewPortMessageIds[channelId] = viewportIds;
		},
		resetLoading: (state) => {
			state.loadingStatus = 'loaded';
		},
		invalidateCache: (state, action: PayloadAction<string>) => {
			const channelId = action.payload;
			if (state.channelMessages[channelId]?.cache) {
				state.channelMessages[channelId].cache = undefined;
			}
		},
		invalidateAllCache: (state) => {
			Object.keys(state.channelMessages).forEach((channelId) => {
				if (state.channelMessages[channelId]?.cache) {
					state.channelMessages[channelId].cache = undefined;
				}
			});
		},

		queueLastSeenMessage: (state, action: PayloadAction<UpdateMessageArgs>) => {
			state.queuedLastSeenMessages.push(action.payload);
		},

		clearQueuedLastSeenMessages: (state) => {
			state.queuedLastSeenMessages = [];
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
					const isClearMessage = action.payload.isClearMessage || false;
					const toPresent = action.payload.toPresent || false;
					const fromCache = action.payload.fromCache || false;
					const foundE2ee = action.payload.foundE2ee || false;
					const lastSentMessageId = state.lastMessageByChannel[channelId]?.id;
					state.loadingStatus = 'loaded';
					let direction = action.meta.arg.direction;

					if (!action?.payload?.messages?.length) return;

					const isNew =
						channelId &&
						action.payload.messages.some(({ id, avatar }) => {
							const existingMessage = state.channelMessages?.[channelId]?.entities?.[id];
							return !existingMessage || existingMessage.avatar !== avatar;
						});

					if (!direction && (!isNew || !channelId) && (!isClearMessage || (isClearMessage && fromCache)) && !foundE2ee) {
						return;
					}

					if (!fromCache && channelId) {
						if (!state.channelMessages[channelId]) {
							state.channelMessages[channelId] = channelMessagesAdapter.getInitialState({
								id: channelId
							});
						}
						state.channelMessages[channelId].cache = createCacheMetadata();
					}

					direction = direction || Direction_Mode.BEFORE_TIMESTAMP;

					if (toPresent) {
						handleRemoveManyMessages(state, channelId);
					}
					const offsetId = action.meta.arg.messageId as string;

					handleSetManyMessages({
						state,
						channelId,
						adapterPayload: action.payload.messages,
						direction,
						isClearMessage,
						addMany: !!offsetId && !state.channelMessages[channelId]?.ids?.includes(offsetId)
					});

					const messageIds = state.channelMessages[channelId]?.ids as string[];

					if (messageIds?.length <= 50) {
						state.channelViewPortMessageIds[channelId] = messageIds;
						const showFab = !!lastSentMessageId && !messageIds.includes(lastSentMessageId as string) && messageIds.length >= 20;
						state.isViewingOlderMessagesByChannelId[channelId] = showFab;
						return;
					} else {
						const oldViewport = state.channelViewPortMessageIds[channelId] || [];
						let newViewportIds: string[] = [];
						if (!offsetId) {
							if (state.isViewingOlderMessagesByChannelId[channelId] && oldViewport.length) {
								return;
							} else if (oldViewport.length) {
								const apiMessageIds = [...action.payload.messages].map((msg) => msg.id);
								const newMessageIds = apiMessageIds.filter((id) => !oldViewport.includes(id));
								const combinedViewport = [...oldViewport, ...newMessageIds];
								newViewportIds = combinedViewport.sort((a, b) => {
									const aEntity = state.channelMessages[channelId].entities[a];
									const bEntity = state.channelMessages[channelId].entities[b];
									if (aEntity && bEntity && aEntity?.create_time_seconds && bEntity?.create_time_seconds) {
										return +aEntity.create_time_seconds - +bEntity.create_time_seconds;
									}
									return 0;
								});
							} else {
								newViewportIds = messageIds;
							}
						} else {
							const viewport = getViewportSlice(messageIds, offsetId, direction);
							newViewportIds = viewport.newViewportIds;
						}

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
	sendEphemeralMessage,
	fetchMessages,
	updateLastSeenMessage,
	processQueuedLastSeenMessages,
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

export const selectTypingUsersById = createSelector(
	[selectTypingUsers, (_, channelId: string) => channelId, (_, __, userId: string) => userId],
	(typingUsers, channelId, userId) => {
		const channelTypingUsers = typingUsers?.[channelId]?.users || [];

		return channelTypingUsers.filter((user) => user.id !== userId);
	}
);

export const selectIsUserTypingInChannel = createSelector(
	[selectTypingUsers, (_, channelId) => channelId, (_, __, userId) => userId],
	(listTyping, channelId, userId) => {
		const typingUsers = listTyping?.[channelId]?.users;
		if (!typingUsers || !channelId || !userId) return false;
		if (Array.isArray(userId)) {
			return typingUsers.some((user) => userId.includes(user.id));
		}
		return typingUsers.some((user) => user.id === userId);
	}
);

export const selectHasMoreMessageByChannelId = createSelector([getMessagesState, getChannelIdAsSecondParam], (state, channelId) => {
	const firstMessageId = state.firstMessageId[channelId];
	if (!firstMessageId) return true;

	const isFirstMessageInChannel = state.channelMessages[channelId]?.entities[firstMessageId];

	// if the first message is not in the channel's messages, then there are more messages
	return !isFirstMessageInChannel;
});

export const selectHasMoreBottomByChannelId = createSelector([getMessagesState, getChannelIdAsSecondParam], (state, channelId) => {
	const lastMessage = state.lastMessageByChannel[channelId];

	if (!lastMessage || !lastMessage.id || !state.channelViewPortMessageIds[channelId]) return false;

	const isLastMessageInChannel = state.channelViewPortMessageIds[channelId]?.includes(lastMessage?.id);

	return !isLastMessageInChannel;
});

export const selectIsFocused = createSelector(getMessagesState, (state) => state.isFocused);

// V2

const emptyObject = {};
const emptyArray: string[] = [];

export const createCachedSelector = createSelectorCreator({
	memoize: weakMapMemoize,
	argsMemoize: weakMapMemoize
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

export const selectMessageViewportIdsByChannelId = createSelector(
	[selectMessageIdsByChannelId, selectViewportIdsByChannelId],
	(messageIds, viewportIds) => {
		if (!viewportIds?.length) {
			return messageIds;
		}
		return messageIds.filter((id) => viewportIds.includes(id));
	}
);

export const selectMessagesByChannel = createSelector([getMessagesState, getChannelIdAsSecondParam], (messagesState, channelId) => {
	return messagesState?.channelMessages?.[channelId];
});

export const selectChannelMessageCache = createSelector([selectMessagesByChannel], (channelMessages) => {
	return channelMessages?.cache;
});

export const selectMessageByMessageId = createSelector(
	[selectMessagesByChannel, (_, __, messageId: string) => messageId],
	(channelMessages, messageId) => {
		return channelMessages?.entities?.[messageId];
	}
);

export const selectLastSeenMessageStateByChannelId = createSelector(
	[getMessagesState, (state, channelId: string) => channelId],
	(state, channelId) => {
		return state?.lastMessageByChannel?.[channelId] ?? null;
	}
);

export const selectLastMessageViewportByChannelId = createSelector(
	[selectMessagesByChannel, selectViewportIdsByChannelId],
	(channelMessages, ids) => {
		if (!channelMessages) return null;
		const { entities } = channelMessages;
		const lastId = ids?.at(-1);
		if (!lastId) return null;
		return entities[lastId];
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

// select selectLatestMessage's id
export const selectLatestMessageId = createCachedSelector([getMessagesState, getChannelIdAsSecondParam], (messagesState, channelId) => {
	return messagesState.lastMessageByChannel[channelId]?.id || '';
});

export const selectLastMessageIdByChannelId = createSelector(selectMessageIdsByChannelId, (ids) => {
	return ids?.at(-1);
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

export const selectIsLoadingJumpMessage = (state: MessagesState) => state.isLoadingJumpMessage;

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
	isClearMessage = false,
	addMany = false
}: {
	state: MessagesState;
	channelId?: string;
	adapterPayload: MessagesEntity[];
	direction?: Direction_Mode;
	isClearMessage?: boolean;
	addMany?: boolean;
}) => {
	if (!channelId) return state;
	if (!state.channelMessages[channelId])
		state.channelMessages[channelId] = channelMessagesAdapter.getInitialState({
			id: channelId
		});
	if (addMany) {
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

	// handle remove setScrollPosition

	if (Array.isArray(state.channelViewPortMessageIds[channelId])) {
		state.channelViewPortMessageIds[channelId] = state.channelViewPortMessageIds[channelId].filter((item) => item !== messageId);
	}
	return channelMessagesAdapter.removeOne(channelEntity, messageId);
};

const updateReferenceMessage = ({ state, channelId, listMessageIds }: { state: MessagesState; channelId: string; listMessageIds: string[] }) => {
	if (!listMessageIds || listMessageIds.length === 0) {
		return;
	}
	const channelEntity = state.channelMessages[channelId];
	const index = channelEntity.ids.indexOf(listMessageIds[0]);
	if (index === -1) return;

	const listReferencesUpdate: Update<MessagesEntity, string>[] = listMessageIds.map((id) => {
		return {
			id,
			changes: {
				references: [
					{
						...(channelEntity.entities[id].references?.[0] as ApiMessageRef),
						content: '{"t":"Original message was deleted"}',
						message_ref_id: undefined
					}
				]
			}
		};
	});
	channelMessagesAdapter.updateMany(channelEntity, listReferencesUpdate);
};

const handleAddOneMessage = ({ state, channelId, adapterPayload }: { state: MessagesState; channelId: string; adapterPayload: MessagesEntity }) => {
	if (state.channelMessages[channelId]) {
		state.channelMessages[channelId] = channelMessagesAdapter.addOne(state.channelMessages[channelId], adapterPayload);
	}
};

const handleUpdateReplyMessage = (channelEntity: EntityState<MessagesEntity, string> & { id: string }, message_ref_id: string) => {
	return channelMessagesAdapter
		.getSelectors()
		.selectAll(channelEntity)
		.filter((message) => message.references?.[0]?.message_ref_id === message_ref_id);
};
