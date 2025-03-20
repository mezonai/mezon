import { captureSentryError } from '@mezon/logger';
import {
	getMobileUploadedAttachments,
	getWebUploadedAttachments,
	IMentionOnMessage,
	IMessageSendPayload,
	IMessageWithUser,
	LoadingStatus
} from '@mezon/utils';
import { createAsyncThunk, createEntityAdapter, createSelector, createSlice, EntityState, PayloadAction } from '@reduxjs/toolkit';
import memoizee from 'memoizee';
import { ApiMessageAttachment, ApiMessageMention, ApiMessageRef, ApiSdTopic } from 'mezon-js/api.gen';
import { ApiChannelMessageHeader, ApiSdTopicRequest } from 'mezon-js/dist/api.gen';
import { ensureSession, ensureSocket, getMezonCtx, MezonValueContext } from '../helpers';
import { RootState } from '../store';
import { threadsActions } from '../threads/threads.slice';
const LIST_TOPIC_DISCUSSIONS_CACHED_TIME = 1000 * 60 * 60;

export const TOPIC_DISCUSSIONS_FEATURE_KEY = 'topicdiscussions';

/*
 * Update these interfaces according to your requirements.
 */
export interface TopicDiscussionsEntity extends ApiSdTopic {
	id: string; // Primary ID
}

export interface TopicDiscussionsState extends EntityState<TopicDiscussionsEntity, string> {
	loadingStatus: LoadingStatus;
	error?: string | null;
	isShowCreateTopic: boolean;
	messageTopicError?: string;
	currentTopicInitMessage: IMessageWithUser | null;
	openTopicMessageState: boolean;
	currentTopicId?: string;
	firstMessageOfCurrentTopic?: ApiSdTopic;
	isFocusTopicBox: boolean;
	channelTopics: Record<string, string>;
	clanTopics: Record<string, EntityState<TopicDiscussionsEntity, string>>;
}

export const topicsAdapter = createEntityAdapter({ selectId: (topic: TopicDiscussionsEntity) => topic.id || '' });

export interface FetchTopicDiscussionsArgs {
	clanId: string;
	noCache?: boolean;
}

const fetchTopicsCached = memoizee(
	async (mezon: MezonValueContext, clanId: string) => {
		const response = await mezon.client.listSdTopic(mezon.session, clanId, 50);
		return { ...response, time: Date.now() };
	},
	{
		promise: true,
		maxAge: LIST_TOPIC_DISCUSSIONS_CACHED_TIME,
		normalizer: (args) => {
			return args[1] + args[0].session.username;
		}
	}
);

const mapToTopicEntity = (topics: ApiSdTopic[]) => {
	return topics.map((topic) => ({
		...topic,
		id: topic.id || ''
	}));
};

export const getFirstMessageOfTopic = createAsyncThunk('topics/getFirstMessageOfTopic', async (topicId: string, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		const response = await mezon.client.getTopicDetail(mezon.session, topicId);
		return response;
	} catch (error) {
		captureSentryError(error, 'topics/getFirstMessageOfTopic');
		return thunkAPI.rejectWithValue(error);
	}
});

export const fetchTopics = createAsyncThunk('topics/fetchTopics', async ({ clanId, noCache }: FetchTopicDiscussionsArgs, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		if (noCache) {
			fetchTopicsCached.clear(mezon, clanId);
		}
		const response = await fetchTopicsCached(mezon, clanId);
		if (Date.now() - response.time > 100) {
			return {
				fromCache: true,
				topics: []
			};
		}
		const topics = mapToTopicEntity(response.topics || []);
		return {
			clan_id: clanId,
			topics: topics
		};
	} catch (error) {
		captureSentryError(error, 'topics/fetchTopics');
		return thunkAPI.rejectWithValue(error);
	}
});

export const initialTopicsState: TopicDiscussionsState = topicsAdapter.getInitialState({
	loadingStatus: 'not loaded',
	error: null,
	isShowCreateTopic: false,
	isPrivate: 0,
	currentTopicInitMessage: null,
	openTopicMessageState: false,
	isFocusTopicBox: false,
	channelTopics: {},
	clanTopics: {}
});

export const createTopic = createAsyncThunk('topics/createTopic', async (body: ApiSdTopicRequest, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		const response = await mezon.client.createSdTopic(mezon.session, body);
		if (response) {
			await thunkAPI.dispatch(fetchTopics({ clanId: body.clan_id as string, noCache: true }));
			return response;
		} else {
			return thunkAPI.rejectWithValue([]);
		}
	} catch (error) {
		captureSentryError(error, 'channels/createNewChannel');
		return thunkAPI.rejectWithValue(error);
	}
});

export const handleTopicNotification = createAsyncThunk('topics/handleTopicNotification', async ({ msg }: any, thunkAPI) => {
	const state = thunkAPI.getState() as RootState;
	const currentTopicId = state.topicdiscussions.currentTopicId;
	const currentChannelId = state.channels?.byClans[state.clans?.currentClanId as string]?.currentChannelId;
	const isShowCreateTopic = !!currentChannelId;

	if (msg?.extras?.topicId && msg?.extras?.topicId !== '0' && (currentTopicId !== msg?.extras?.topicId || !isShowCreateTopic)) {
		thunkAPI.dispatch(topicsActions.setIsShowCreateTopic(true));
		thunkAPI.dispatch(
			threadsActions.setIsShowCreateThread({
				channelId: msg.channel_id as string,
				isShowCreateThread: false
			})
		);
		thunkAPI.dispatch(topicsActions.setCurrentTopicId(msg?.extras?.topicId || ''));
		thunkAPI.dispatch(getFirstMessageOfTopic(msg?.extras?.topicId || ''));
	}
});

type SendTopicPayload = {
	clanId: string;
	channelId: string;
	mode: number;
	isPublic: boolean;
	content: IMessageSendPayload;
	mentions?: Array<ApiMessageMention>;
	attachments?: Array<ApiMessageAttachment>;
	references?: Array<ApiMessageRef>;
	anonymous?: boolean;
	mentionEveryone?: boolean;
	isMobile?: boolean;
	code?: number;
	topicId: string;
};

export const handleSendTopic = createAsyncThunk('topics/sendTopicMessage', async (payload: SendTopicPayload, thunkAPI) => {
	const { clanId, channelId, mode, isPublic, content, mentions, attachments, references, anonymous, mentionEveryone, isMobile, code, topicId } =
		payload;

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
			uploadedFiles = await getMobileUploadedAttachments({ attachments, channelId, clanId, client, session });
		} else {
			uploadedFiles = await getWebUploadedAttachments({ attachments, channelId: topicId, clanId, client, session });
		}
	}

	await socket.writeChatMessage(
		clanId as string,
		channelId as string,
		mode,
		isPublic,
		content,
		mentions,
		uploadedFiles,
		references,
		false,
		false,
		'',
		0,
		topicId
	);
});

export const topicsSlice = createSlice({
	name: TOPIC_DISCUSSIONS_FEATURE_KEY,
	initialState: initialTopicsState,
	reducers: {
		add: topicsAdapter.addOne,
		remove: topicsAdapter.removeOne,
		update: topicsAdapter.updateOne,

		setIsShowCreateTopic: (state: TopicDiscussionsState, action: PayloadAction<boolean>) => {
			state.isShowCreateTopic = action.payload;
		},
		setCurrentTopicInitMessage: (state, action: PayloadAction<IMessageWithUser | null>) => {
			state.currentTopicInitMessage = action.payload;
		},
		setOpenTopicMessageState(state, action) {
			state.openTopicMessageState = action.payload;
		},
		setCurrentTopicId: (state, action: PayloadAction<string>) => {
			state.currentTopicId = action.payload;
		},
		setFirstMessageOfCurrentTopic(state, action) {
			state.firstMessageOfCurrentTopic = action.payload;
		},
		setChannelTopic: (state, action: PayloadAction<{ channelId: string; topicId: string }>) => {
			const { channelId, topicId } = action.payload;
			state.channelTopics[channelId] = topicId;
		},
		setTopicLastSent: (state, action: PayloadAction<{ clanId: string; topicId: string; lastSentMess: ApiChannelMessageHeader }>) => {
			const topic = state.clanTopics[action.payload.clanId]?.entities?.[action.payload.topicId];
			if (topic) {
				if (!topic.last_sent_message) {
					topic.last_sent_message = {} as ApiChannelMessageHeader;
				}

				const { content, sender_id, timestamp_seconds } = action.payload.lastSentMess;

				topic.last_sent_message.content = typeof content === 'object' ? JSON.stringify(content) : content || '';
				topic.last_sent_message.sender_id = sender_id;
				topic.last_sent_message.timestamp_seconds = timestamp_seconds;
			}
		},
		updateInitMessage(state, action: PayloadAction<{ content: IMessageSendPayload; mentions: IMentionOnMessage[] }>) {
			if (!state.firstMessageOfCurrentTopic?.message) return;
			const { content, mentions } = action.payload;
			const stringifiedContent = JSON.stringify(content, null, 4);
			const stringifiedMentions = JSON.stringify(mentions, null, 4);
			state.firstMessageOfCurrentTopic.message.content = stringifiedContent;
			state.firstMessageOfCurrentTopic.message.mentions = stringifiedMentions;
		},
		setFocusTopicBox(state, action: PayloadAction<boolean>) {
			state.isFocusTopicBox = action.payload;
		},
		addTopic: (state, action: PayloadAction<{ clanId: string; topic: TopicDiscussionsEntity }>) => {
			const { clanId, topic } = action.payload;
			if (!state.clanTopics[clanId]) {
				state.clanTopics[clanId] = topicsAdapter.getInitialState();
			}
			topicsAdapter.addOne(state.clanTopics[clanId], topic);
		}
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchTopics.pending, (state: TopicDiscussionsState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(fetchTopics.fulfilled, (state: TopicDiscussionsState, action: PayloadAction<any>) => {
				if (action.payload?.fromCache) return;
				const clanId = action.payload.clan_id;
				if (!clanId) {
					return;
				}

				if (!state.clanTopics[clanId]) {
					state.clanTopics[clanId] = topicsAdapter.getInitialState();
				}
				state.clanTopics[clanId] = topicsAdapter.setAll(state.clanTopics[clanId], action.payload.topics);
				state.loadingStatus = 'loaded';
			})
			.addCase(fetchTopics.rejected, (state: TopicDiscussionsState, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			})
			.addCase(getFirstMessageOfTopic.fulfilled, (state: TopicDiscussionsState, action) => {
				state.firstMessageOfCurrentTopic = action.payload;
			});
	}
});

/*
 * Export reducer for store configuration.
 */
export const topicsReducer = topicsSlice.reducer;

/*
 * Export action creators to be dispatched. For use with the `useDispatch` hook.
 *
 * e.g.
 * ```
 * import React, { useEffect } from 'react';
 * import { useDispatch } from 'react-redux';
 *
 * // ...
 *
 * const dispatch = useDispatch();
 * useEffect(() => {
 *   dispatch(threadsActions.add({ id: 1 }))
 * }, [dispatch]);
 * ```
 *
 * See: https://react-redux.js.org/next/api/hooks#usedispatch
 */
export const topicsActions = { ...topicsSlice.actions, createTopic, fetchTopics, handleSendTopic };

/*
 * Export selectors to query state. For use with the `useSelector` hook.
 *
 * e.g.
 * ```
 * import { useSelector } from 'react-redux';
 *
 * // ...
 *
 * const entities = useSelector(selectAllThreads);
 * ```
 *
 * See: https://react-redux.js.org/next/api/hooks#useselector
 */
const { selectAll, selectEntities } = topicsAdapter.getSelectors();

export const getTopicsState = (rootState: { [TOPIC_DISCUSSIONS_FEATURE_KEY]: TopicDiscussionsState }): TopicDiscussionsState =>
	rootState[TOPIC_DISCUSSIONS_FEATURE_KEY];
export const selectAllTopics = createSelector([getTopicsState, (state: RootState) => state.clans.currentClanId as string], (state, clanId) =>
	selectAll(state.clanTopics[clanId] ?? topicsAdapter.getInitialState())
);

export const selectTopicsEntities = createSelector(getTopicsState, selectEntities);

export const selectMessageTopicError = createSelector(getTopicsState, (state) => state.messageTopicError);

export const selectCurrentTopicInitMessage = createSelector(getTopicsState, (state) => state.currentTopicInitMessage);

export const selectOpenTopicMessageState = createSelector(getTopicsState, (state: TopicDiscussionsState) => state.openTopicMessageState);

export const selectCurrentTopicId = createSelector(getTopicsState, (state: TopicDiscussionsState) => state.currentTopicId);

export const selectIsMessageChannelIdMatched = createSelector(
	[selectCurrentTopicId, (_, messageChannelId: string) => messageChannelId],
	(currentTopicId, messageChannelId) => currentTopicId === messageChannelId
);

export const selectIsShowCreateTopic = createSelector(getTopicsState, (state) => state.isShowCreateTopic);

export const selectFirstMessageOfCurrentTopic = createSelector(getTopicsState, (state) => state.firstMessageOfCurrentTopic);

export const selectTopicsSort = createSelector(selectAllTopics, (data) => {
	return data.sort((a, b) => {
		const timestampA = a?.last_sent_message?.timestamp_seconds || 0;
		const timestampB = b?.last_sent_message?.timestamp_seconds || 0;
		return timestampB - timestampA;
	});
});

export const selectTopicByChannelId = (channelId: string) =>
	createSelector(getTopicsState, (state: TopicDiscussionsState) => state.channelTopics[channelId] ?? null);

export const selectClickedOnTopicStatus = createSelector(getTopicsState, (state) => state.isFocusTopicBox);
