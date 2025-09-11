import { captureSentryError } from '@mezon/logger';
import { IMessageWithUser, IPinMessage, LoadingStatus } from '@mezon/utils';
import { EntityState, PayloadAction, createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import { ApiPinMessage, ApiPinMessageRequest } from 'mezon-js/api.gen';
import { CacheMetadata, createApiKey, createCacheMetadata, markApiFirstCalled, shouldForceApiCall } from '../cache-metadata';
import { MezonValueContext, ensureSession, ensureSocket, getMezonCtx } from '../helpers';
import { RootState } from '../store';

export const PIN_MESSAGE_FEATURE_KEY = 'pinmessages';

/*
 * Update these interfaces according to your requirements.
 */
export interface PinMessageEntity extends IPinMessage {
	id: string; // Primary ID
}

export interface PinMessageState extends EntityState<PinMessageEntity, string> {
	byChannels: Record<
		string,
		{
			pinMessages?: PinMessageEntity[];
			cache?: CacheMetadata;
		}
	>;
	loadingStatus: LoadingStatus;
	error?: string | null;
	isPinModalVisible?: boolean;
}

export const pinMessageAdapter = createEntityAdapter<PinMessageEntity>();

type fetchChannelPinMessagesPayload = {
	channelId: string;
	clanId: string;
	noCache?: boolean;
};

const CHANNEL_PIN_MESSAGES_CACHED_TIME = 1000 * 60 * 60;

const getInitialChannelState = () => ({
	pinMessages: []
});

export const fetchChannelPinMessagesCached = async (
	getState: () => RootState,
	mezon: MezonValueContext,
	channelId: string,
	clanId: string,
	noCache = false
) => {
	const currentState = getState();
	const channelData = currentState[PIN_MESSAGE_FEATURE_KEY].byChannels[channelId];
	const apiKey = createApiKey('fetchChannelPinMessages', channelId);

	const shouldForceCall = shouldForceApiCall(apiKey, channelData?.cache, noCache);

	if (!shouldForceCall) {
		return {
			pin_messages_list: channelData.pinMessages,
			fromCache: true,
			time: channelData.cache?.lastFetched || Date.now()
		};
	}

	const response = await mezon.client.pinMessagesList(mezon.session, '', channelId, clanId);

	markApiFirstCalled(apiKey);

	return {
		...response,
		fromCache: false,
		time: Date.now()
	};
};

export const mapChannelPinMessagesToEntity = (pinMessageRes: ApiPinMessage) => {
	return { ...pinMessageRes, id: pinMessageRes.id || '' };
};

export const fetchChannelPinMessages = createAsyncThunk(
	'pinmessage/fetchChannelPinMessages',
	async ({ channelId, noCache, clanId }: fetchChannelPinMessagesPayload, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));

			const response = await fetchChannelPinMessagesCached(thunkAPI.getState as () => RootState, mezon, channelId, clanId, Boolean(noCache));

			if (!response) {
				return {
					channelId,
					pinMessages: [] as PinMessageEntity[],
					fromCache: false
				};
			}

			if (response.fromCache) {
				return {
					channelId,
					pinMessages: (response.pin_messages_list || []) as PinMessageEntity[],
					fromCache: true
				};
			}

			if (!response.pin_messages_list) {
				return {
					channelId,
					pinMessages: [] as PinMessageEntity[],
					fromCache: false
				};
			}

			const pinMessages = response.pin_messages_list.map((pinMessageRes) => mapChannelPinMessagesToEntity(pinMessageRes));
			return {
				channelId,
				pinMessages,
				fromCache: false
			};
		} catch (error) {
			captureSentryError(error, 'pinmessage/fetchChannelPinMessages');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

type SetChannelPinMessagesPayload = {
	clan_id: string;
	pin_id?: string;
	channel_id: string;
	message_id: string;
	message?: IMessageWithUser;
};

export const setChannelPinMessage = createAsyncThunk(
	'pinmessage/setChannelPinMessage',
	async ({ clan_id, channel_id, message_id, message }: SetChannelPinMessagesPayload, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const body: ApiPinMessageRequest = {
				clan_id: clan_id,
				channel_id: channel_id,
				message_id: message_id
			};
			const response = await mezon.client.createPinMessage(mezon.session, body);
			if (!response) {
				return thunkAPI.rejectWithValue([]);
			}

			return response;
		} catch (error) {
			captureSentryError(error, 'pinmessage/setChannelPinMessage');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const deleteChannelPinMessage = createAsyncThunk(
	'pinmessage/deleteChannelPinMessage',
	async ({ channel_id, message_id, pin_id, clan_id }: SetChannelPinMessagesPayload, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const response = await mezon.client.deletePinMessage(mezon.session, pin_id, message_id, channel_id, clan_id);
			if (!response) {
				return thunkAPI.rejectWithValue([]);
			}
			thunkAPI.dispatch(
				pinMessageActions.removePinMessage({
					channelId: channel_id,
					pinId: message_id
				})
			);
			return response;
		} catch (error) {
			captureSentryError(error, 'pinmessage/deleteChannelPinMessage');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export type UpdatePinMessage = {
	clanId: string;
	channelId: string;
	messageId: string;
	isPublic: boolean;
	mode: number;
	avatar: string;
	senderId: string;
	senderUsername: string;
	content: string;
	attachment: string;
	createdTime: string;
};

export const joinPinMessage = createAsyncThunk(
	'messages/joinPinMessage',
	async (
		{ clanId, channelId, messageId, isPublic, mode, senderId, senderUsername, avatar, createdTime, content, attachment }: UpdatePinMessage,
		thunkAPI
	) => {
		try {
			const mezon = await ensureSocket(getMezonCtx(thunkAPI));
			const now = Math.floor(Date.now() / 1000);
			await mezon.socketRef.current?.writeLastPinMessage(
				clanId,
				channelId,
				mode,
				isPublic,
				messageId,
				now,
				1,
				avatar,
				senderId,
				senderUsername,
				content,
				attachment,
				createdTime
			);
		} catch (error) {
			captureSentryError(error, 'pinmessage/joinPinMessage');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const initialPinMessageState: PinMessageState = pinMessageAdapter.getInitialState({
	byChannels: {},
	loadingStatus: 'not loaded',
	error: null,
	jumpPinMessageId: '',
	isPinModalVisible: false
});

export const pinMessageSlice = createSlice({
	name: PIN_MESSAGE_FEATURE_KEY,
	initialState: initialPinMessageState,
	reducers: {
		add: pinMessageAdapter.addOne,
		addMany: pinMessageAdapter.addMany,
		remove: pinMessageAdapter.removeOne,
		togglePinModal: (state: PinMessageState) => {
			state.isPinModalVisible = !state.isPinModalVisible;
		},
		clearChannelCache: (state: PinMessageState, action: PayloadAction<string>) => {
			const channelId = action.payload;
			if (state.byChannels[channelId]) {
				delete state.byChannels[channelId];
			}
		},
		addPinMessage: (state: PinMessageState, action: PayloadAction<{ channelId: string; pinMessage: PinMessageEntity }>) => {
			const { channelId, pinMessage } = action.payload;
			if (!state.byChannels[channelId]) {
				return;
			}

			state.byChannels[channelId].pinMessages?.unshift(pinMessage);
		},
		removePinMessage: (state: PinMessageState, action: PayloadAction<{ channelId: string; pinId: string }>) => {
			const { channelId, pinId } = action.payload;
			if (!state.byChannels[channelId]) {
				return;
			}
			const pinList = state.byChannels[channelId].pinMessages?.filter((pin) => pin.id !== pinId);
			state.byChannels[channelId].pinMessages = pinList;
			state.byChannels[channelId].cache = createCacheMetadata(CHANNEL_PIN_MESSAGES_CACHED_TIME);
		},
		updatePinMessage: (state: PinMessageState, action: PayloadAction<{ channelId: string; pinId: string; pinMessage: PinMessageEntity }>) => {
			const { channelId, pinId, pinMessage } = action.payload;
			const channel = state.byChannels[channelId];
			if (!channel?.pinMessages) return;

			const idx = channel.pinMessages.findIndex((p) => p.message_id === pinId);
			if (idx === -1) return;

			const updated: PinMessageEntity = {
				...channel.pinMessages[idx],
				...pinMessage,
				message_id: channel.pinMessages[idx].message_id,
				id: channel.pinMessages[idx].id,
				content: pinMessage.content
			};

			channel.pinMessages[idx] = updated;
			pinMessageAdapter.upsertOne(state, updated);
		}
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchChannelPinMessages.pending, (state: PinMessageState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(fetchChannelPinMessages.fulfilled, (state: PinMessageState, action) => {
				const { channelId, pinMessages, fromCache } = action.payload;

				if (!state.byChannels[channelId]) {
					state.byChannels[channelId] = getInitialChannelState();
				}

				if (!fromCache) {
					// Update entity adapter
					pinMessageAdapter.setAll(state, pinMessages);

					// Update channel cache
					state.byChannels[channelId].pinMessages = pinMessages;
					state.byChannels[channelId].cache = createCacheMetadata(CHANNEL_PIN_MESSAGES_CACHED_TIME);
				}

				state.loadingStatus = 'loaded';
			})
			.addCase(fetchChannelPinMessages.rejected, (state: PinMessageState, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			});
	}
});

/*
 * Export reducer for store configuration.
 */
export const pinMessageReducer = pinMessageSlice.reducer;

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
 *   dispatch(usersActions.add({ id: 1 }))
 * }, [dispatch]);
 * ```
 *
 * See: https://react-redux.js.org/next/api/hooks#usedispatch
 */
export const pinMessageActions = {
	...pinMessageSlice.actions,
	fetchChannelPinMessages,
	setChannelPinMessage,
	deleteChannelPinMessage,
	joinPinMessage
};

/*
 * Export selectors to query state. For use with the `useSelector` hook.
 *
 * e.g.
 * ```
 * import { useSelector } from 'react-redux';
 *
 * // ...
 *
 * const entities = useSelector(selectAllUsers);
 * ```
 *
 * See: https://react-redux.js.org/next/api/hooks#useselector
 */
const { selectEntities } = pinMessageAdapter.getSelectors();

export const getPinMessageState = (rootState: { [PIN_MESSAGE_FEATURE_KEY]: PinMessageState }): PinMessageState => rootState[PIN_MESSAGE_FEATURE_KEY];
export const selectPinMessageEntities = createSelector(getPinMessageState, selectEntities);

export const selectPinMessageByChannelId = createSelector(
	[getPinMessageState, (state: RootState, channelId: string) => channelId],
	(state, channelId) => {
		if (!channelId) return [];
		return state.byChannels[channelId]?.pinMessages || [];
	}
);

export const selectLastPinMessageByChannelId = createSelector(
	[getPinMessageState, (state: RootState, channelId: string) => channelId],
	(state, channelId) => {
		const pinMessages = state.byChannels[channelId]?.pinMessages || [];
		return pinMessages[pinMessages.length - 1]?.id || null;
	}
);

export const selectIsPinModalVisible = createSelector(getPinMessageState, (state: PinMessageState) => state.isPinModalVisible);
