import { captureSentryError } from '@mezon/logger';
import {
	ApiChannelMessageHeaderWithChannel,
	ChannelThreads,
	checkIsThread,
	ICategory,
	IChannel,
	LoadingStatus,
	ModeResponsive,
	RequestInput,
	TypeCheck
} from '@mezon/utils';
import { createAsyncThunk, createEntityAdapter, createSelector, createSlice, EntityState, GetThunkAPI, PayloadAction } from '@reduxjs/toolkit';
import isEqual from 'lodash.isequal';
import { ApiUpdateChannelDescRequest, ChannelCreatedEvent, ChannelDeletedEvent, ChannelType, ChannelUpdatedEvent } from 'mezon-js';
import {
	ApiAddFavoriteChannelRequest,
	ApiChangeChannelPrivateRequest,
	ApiChannelDescription,
	ApiCreateChannelDescRequest,
	ApiMarkAsReadRequest
} from 'mezon-js/api.gen';
import { ApiChannelAppResponse } from 'mezon-js/dist/api.gen';
import { fetchCategories } from '../categories/categories.slice';
import { userChannelsActions } from '../channelmembers/AllUsersChannelByAddChannel.slice';
import { channelMembersActions } from '../channelmembers/channel.members';
import { directActions } from '../direct/direct.slice';
import { ensureSession, ensureSocket, getMezonCtx, MezonValueContext } from '../helpers';
import { memoizeAndTrack } from '../memoize';
import { messagesActions } from '../messages/messages.slice';
import { notifiReactMessageActions } from '../notificationSetting/notificationReactMessage.slice';
import { selectEntiteschannelCategorySetting } from '../notificationSetting/notificationSettingCategory.slice';
import { notificationSettingActions } from '../notificationSetting/notificationSettingChannel.slice';
import { pinMessageActions } from '../pinMessages/pinMessage.slice';
import { overriddenPoliciesActions } from '../policies/overriddenPolicies.slice';
import { reactionActions } from '../reactionMessage/reactionMessage.slice';
import { rolesClanActions } from '../roleclan/roleclan.slice';
import { RootState } from '../store';
import { selectListThreadId, threadsActions } from '../threads/threads.slice';
import { channelMetaActions, ChannelMetaEntity, enableMute } from './channelmeta.slice';
import { fetchListChannelsByUser, LIST_CHANNELS_USER_FEATURE_KEY, ListChannelsByUserState, selectAllChannelsByUser } from './channelUser.slice';

const LIST_CHANNEL_CACHED_TIME = 1000 * 60 * 3;

export const CHANNELS_FEATURE_KEY = 'channels';

/*
 * Update these interfaces according to your requirements.
 */
export interface ChannelsEntity extends IChannel {
	id: string; // Primary ID
}

function extractChannelMeta(channel: ChannelsEntity): ChannelMetaEntity {
	return {
		id: channel.id,
		lastSeenTimestamp: Number(channel.last_seen_message?.timestamp_seconds) ?? 0,
		lastSentTimestamp: Number(channel.last_sent_message?.timestamp_seconds),
		lastSeenPinMessage: channel.last_pin_message || '',
		clanId: channel.clan_id ?? '',
		isMute: channel.is_mute ?? false
	};
}

export const mapChannelToEntity = (channelRes: ApiChannelDescription) => {
	return {
		...channelRes,
		id: channelRes.channel_id || '',
		status: channelRes.meeting_code ? 1 : 0,
		count_mess_unread: channelRes.count_mess_unread ? channelRes.count_mess_unread : 0
	};
};

export interface ChannelsState extends EntityState<ChannelsEntity, string> {
	loadingStatus: LoadingStatus;
	socketStatus: LoadingStatus;
	error?: string | null;
	currentChannelId?: string | null;
	isOpenCreateNewChannel?: boolean;
	currentCategory: ICategory | null;
	currentVoiceChannelId: string;
	request: Record<string, RequestInput>;
	idChannelSelected: Record<string, string>;
	modeResponsive: ModeResponsive.MODE_CLAN | ModeResponsive.MODE_DM;
	selectedChannelId?: string | null;
	previousChannels: string[];
	appChannelsList: Record<string, ApiChannelAppResponse>;
	fetchChannelSuccess: boolean;
	favoriteChannels: string[];
}

export const channelsAdapter = createEntityAdapter<ChannelsEntity>();

export interface ChannelsRootState {
	[CHANNELS_FEATURE_KEY]: ChannelsState;
	[LIST_CHANNELS_USER_FEATURE_KEY]: ListChannelsByUserState;
}

function getChannelsRootState(thunkAPI: GetThunkAPI<unknown>): ChannelsRootState {
	return thunkAPI.getState() as ChannelsRootState;
}

type fetchChannelMembersPayload = {
	clanId: string;
	channelId: string;
	noFetchMembers?: boolean;
	messageId?: string;
	isDmGroup?: boolean;
	isClearMessage?: boolean;
};

type JoinChatPayload = {
	clanId: string;
	channelId: string;
	channelType: number;
	isPublic: boolean;
};

export interface FetchChannelFavoriteArgs {
	clanId: string;
	noCache?: boolean;
}

export interface RemoveChannelFavoriteArgs {
	channelId: string;
	clanId: string;
}
export const joinChat = createAsyncThunk('channels/joinChat', async ({ clanId, channelId, channelType, isPublic }: JoinChatPayload, thunkAPI) => {
	if (
		channelType !== ChannelType.CHANNEL_TYPE_TEXT &&
		channelType !== ChannelType.CHANNEL_TYPE_DM &&
		channelType !== ChannelType.CHANNEL_TYPE_GROUP &&
		channelType !== ChannelType.CHANNEL_TYPE_THREAD
	) {
		return null;
	}

	if (!channelId) return null;

	try {
		const mezon = await ensureSocket(getMezonCtx(thunkAPI));
		const channel = await mezon.socketRef.current?.joinChat(clanId, channelId, channelType, isPublic);
		return channel;
	} catch (error) {
		captureSentryError(error, 'channels/joinChat');
		return thunkAPI.rejectWithValue(error);
	}
});

export const joinChannel = createAsyncThunk(
	'channels/joinChannel',
	async ({ clanId, channelId, noFetchMembers, messageId, isClearMessage = true }: fetchChannelMembersPayload, thunkAPI) => {
		try {
			thunkAPI.dispatch(reactionActions.removeAll());
			thunkAPI.dispatch(channelsActions.setIdChannelSelected({ clanId, channelId }));
			thunkAPI.dispatch(channelsActions.setCurrentChannelId(channelId));
			thunkAPI.dispatch(notificationSettingActions.getNotificationSetting({ channelId }));
			thunkAPI.dispatch(notifiReactMessageActions.getNotifiReactMessage({ channelId }));
			thunkAPI.dispatch(overriddenPoliciesActions.fetchMaxChannelPermission({ clanId: clanId ?? '', channelId: channelId }));

			if (messageId) {
				thunkAPI.dispatch(messagesActions.jumpToMessage({ clanId: clanId, channelId, messageId }));
			} else {
				thunkAPI.dispatch(
					messagesActions.fetchMessages({ clanId: clanId, channelId, isFetchingLatestMessages: true, isClearMessage, noCache: true })
				);
			}

			const channel = selectChannelById(getChannelsRootState(thunkAPI), channelId);
			if (!noFetchMembers) {
				if (channel && channel?.parrent_id !== '0' && channel?.parrent_id !== '') {
					thunkAPI.dispatch(
						channelMembersActions.fetchChannelMembers({
							clanId,
							channelId: channel.parrent_id || '',
							channelType: ChannelType.CHANNEL_TYPE_TEXT
						})
					);
				}
				thunkAPI.dispatch(channelMembersActions.fetchChannelMembers({ clanId, channelId, channelType: ChannelType.CHANNEL_TYPE_TEXT }));
			}
			thunkAPI.dispatch(pinMessageActions.fetchChannelPinMessages({ channelId: channelId }));
			thunkAPI.dispatch(userChannelsActions.fetchUserChannels({ channelId: channelId }));
			thunkAPI.dispatch(channelsActions.setModeResponsive(ModeResponsive.MODE_CLAN));

			const isPublic = channel ? (checkIsThread(channel as ChannelsEntity) ? false : !channel.channel_private) : false;
			if (channel) {
				thunkAPI.dispatch(
					channelsActions.joinChat({
						clanId: channel.clan_id ?? '',
						channelId: channel.channel_id ?? '',
						channelType: channel.type ?? 0,
						isPublic: isPublic
					})
				);
			}

			return channel;
		} catch (error) {
			captureSentryError(error, 'channels/joinChannel');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const createNewChannel = createAsyncThunk('channels/createNewChannel', async (body: ApiCreateChannelDescRequest, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		const response = await mezon.client.createChannelDesc(mezon.session, body);
		if (response) {
			thunkAPI.dispatch(fetchChannels({ clanId: body.clan_id as string, noCache: true }));
			thunkAPI.dispatch(fetchCategories({ clanId: body.clan_id as string }));
			thunkAPI.dispatch(fetchListChannelsByUser({ noCache: true }));
			if (response.type !== ChannelType.CHANNEL_TYPE_VOICE && response.type !== ChannelType.CHANNEL_TYPE_STREAMING) {
				const isPublic = checkIsThread(response as ChannelsEntity) ? false : !response.channel_private;
				thunkAPI.dispatch(
					channelsActions.joinChat({
						clanId: response.clan_id as string,
						channelId: response.channel_id as string,
						channelType: response.type as number,
						isPublic: isPublic
					})
				);
			}
			if (response.parrent_id !== '0') {
				await thunkAPI.dispatch(
					threadsActions.setListThreadId({ channelId: response.parrent_id as string, threadId: response.channel_id as string })
				);
			}
			return response;
		} else {
			return thunkAPI.rejectWithValue([]);
		}
	} catch (error) {
		captureSentryError(error, 'channels/createNewChannel');
		return thunkAPI.rejectWithValue(error);
	}
});

export const checkDuplicateChannelInCategory = createAsyncThunk(
	'channels/checkDuplicateChannelInCategory',
	async ({ channelName, categoryId }: { channelName: string; categoryId: string }, thunkAPI) => {
		try {
			const mezon = await ensureSocket(getMezonCtx(thunkAPI));
			const isDuplicateName = await mezon.socketRef.current?.checkDuplicateName(channelName, categoryId, TypeCheck.TYPECHANNEL);

			if (isDuplicateName?.type === TypeCheck.TYPECHANNEL) {
				return isDuplicateName.exist;
			}
			return;
		} catch (error) {
			captureSentryError(error, 'channels/checkDuplicateChannelInCategory');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const deleteChannel = createAsyncThunk('channels/deleteChannel', async (body: fetchChannelMembersPayload, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		const response = await mezon.client.deleteChannelDesc(mezon.session, body.channelId);
		if (response) {
			if (body.isDmGroup) {
				return true;
			}
			thunkAPI.dispatch(fetchChannels({ clanId: body.clanId, noCache: true }));
		}
	} catch (error) {
		captureSentryError(error, 'channels/deleteChannel');
		return thunkAPI.rejectWithValue(error);
	}
});

export const updateChannel = createAsyncThunk('channels/updateChannel', async (body: ApiUpdateChannelDescRequest, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		if (body.e2ee) {
			thunkAPI.dispatch(directActions.changeE2EE({ channel_id: body.channel_id, e2ee: body.e2ee }));
		}
		const response = await mezon.client.updateChannelDesc(mezon.session, body.channel_id, body);
		const clanID = selectClanId()(getChannelsRootState(thunkAPI)) || '';
		if (response) {
			if (body.category_id === '0') {
				thunkAPI.dispatch(directActions.fetchDirectMessage({ noCache: true }));
			} else {
				thunkAPI.dispatch(fetchChannels({ clanId: clanID, noCache: true }));
			}
		}
	} catch (error) {
		captureSentryError(error, 'channels/updateChannel');
		return thunkAPI.rejectWithValue(error);
	}
});

export const updateChannelPrivate = createAsyncThunk('channels/updateChannelPrivate', async (body: ApiChangeChannelPrivateRequest, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		const response = await mezon.client.updateChannelPrivate(mezon.session, body);
		const clanID = selectClanId()(getChannelsRootState(thunkAPI)) || '';
		if (response) {
			thunkAPI.dispatch(fetchChannels({ clanId: clanID, noCache: true }));
			thunkAPI.dispatch(rolesClanActions.fetchRolesClan({ clanId: clanID, channelId: body.channel_id }));
			thunkAPI.dispatch(
				channelMembersActions.fetchChannelMembers({
					clanId: clanID,
					channelId: body.channel_id || '',
					noCache: true,
					channelType: ChannelType.CHANNEL_TYPE_TEXT
				})
			);
		}
	} catch (error) {
		captureSentryError(error, 'channels/updateChannelPrivate');
		return thunkAPI.rejectWithValue(error);
	}
});

export const fetchListFavoriteChannelCache = memoizeAndTrack(
	async (mezon: MezonValueContext, clanId: string) => {
		const response = await mezon.client.getListFavoriteChannel(mezon.session, clanId);
		return response;
	},
	{
		promise: true,
		maxAge: LIST_CHANNEL_CACHED_TIME,
		normalizer: (args) => {
			return args[1] + args[0].session.username;
		}
	}
);

export const fetchListFavoriteChannel = createAsyncThunk('channels/favorite', async ({ clanId, noCache }: FetchChannelFavoriteArgs, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		if (noCache) {
			fetchListFavoriteChannelCache.clear(mezon, clanId);
		}

		const response = await fetchListFavoriteChannelCache(mezon, clanId);

		return response;
	} catch (error) {
		captureSentryError(error, 'channels/favorite');
		return thunkAPI.rejectWithValue(error);
	}
});

export const addFavoriteChannel = createAsyncThunk('channels/favorite/add', async (body: ApiAddFavoriteChannelRequest, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		const response = await mezon.client.addFavoriteChannel(mezon.session, body.channel_id || '', body.clan_id || '');
		if (response) {
			thunkAPI.dispatch(fetchListFavoriteChannel({ clanId: body.clan_id || '', noCache: true }));
			return response;
		}
		return;
	} catch (error) {
		captureSentryError(error, 'channels/favorite/add');
		return thunkAPI.rejectWithValue(error);
	}
});

export const removeFavoriteChannel = createAsyncThunk(
	'channels/favorite/remove',
	async ({ channelId, clanId }: RemoveChannelFavoriteArgs, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const response = await mezon.client.removeFavoriteChannel(mezon.session, channelId);
			if (response) {
				thunkAPI.dispatch(fetchListFavoriteChannel({ clanId: clanId || '', noCache: true }));
			}
		} catch (error) {
			captureSentryError(error, 'channels/favorite/remove');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

type fetchChannelsArgs = {
	clanId: string;
	cursor?: string;
	limit?: number;
	forward?: number;
	channelType?: number;
	noCache?: boolean;
};

export const fetchChannelsCached = memoizeAndTrack(
	async (mezon: MezonValueContext, limit: number, state: number, clanId: string, channelType: number) => {
		const response = await mezon.client.listChannelDescs(mezon.session, limit, state, '', clanId, channelType);
		return { ...response, time: Date.now() };
	},
	{
		promise: true,
		maxAge: LIST_CHANNEL_CACHED_TIME,
		normalizer: (args) => {
			return args[1] + args[2] + args[3] + args[4] + args[0].session.username;
		}
	}
);

export const addThreadToChannels = createAsyncThunk(
	'channels/addThreadToChannels',
	async ({ clanId, channelId }: { clanId: string; channelId: string }, thunkAPI) => {
		if (channelId && !selectChannelById2(getChannelsRootState(thunkAPI), channelId)) {
			const data = await thunkAPI
				.dispatch(
					threadsActions.fetchThread({
						channelId: '0',
						clanId,
						threadId: channelId
					})
				)
				.unwrap();
			if (data?.length > 0) {
				thunkAPI.dispatch(channelsActions.upsertOne({ ...data[0], active: 1 } as ChannelsEntity));
			}
		}
	}
);

export const fetchChannels = createAsyncThunk(
	'channels/fetchChannels',
	async ({ clanId, channelType = ChannelType.CHANNEL_TYPE_TEXT, noCache }: fetchChannelsArgs, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			if (noCache) {
				await fetchChannelsCached.clear(mezon, 500, 1, clanId, channelType);
			}
			const response = await fetchChannelsCached(mezon, 500, 1, clanId, channelType);
			if (!response.channeldesc) {
				return [];
			}
			thunkAPI.dispatch(fetchAppChannels({ clanId: clanId, noCache: Boolean(noCache) }));
			if (Date.now() - response.time < 100) {
				const lastChannelMessages =
					response.channeldesc?.map((channel) => ({
						...channel.last_sent_message,
						channel_id: channel.channel_id
					})) ?? [];

				const lastChannelMessagesTruthy = lastChannelMessages.filter((message) => message);

				thunkAPI.dispatch(messagesActions.setManyLastMessages(lastChannelMessagesTruthy as ApiChannelMessageHeaderWithChannel[]));
			}

			const state = thunkAPI.getState() as RootState;

			const currentChannelId = state.channels?.currentChannelId;

			if (currentChannelId && !response?.channeldesc?.some((item) => item.channel_id === currentChannelId)) {
				const data = await thunkAPI
					.dispatch(
						threadsActions.fetchThread({
							channelId: '0',
							clanId,
							threadId: currentChannelId
						})
					)
					.unwrap();
				if (data?.length > 0) {
					response.channeldesc.push({ ...data[0], active: 1 } as ChannelsEntity);
				}
			}

			const channels = response.channeldesc.map((channel) => ({
				...mapChannelToEntity(channel),
				last_seen_message: channel.last_seen_message ? channel.last_seen_message : { timestamp_seconds: 0 }
			}));
			const meta = channels.map((ch) => extractChannelMeta(ch));
			thunkAPI.dispatch(channelMetaActions.updateBulkChannelMetadata(meta));
			return channels;
		} catch (error) {
			captureSentryError(error, 'channels/fetchChannels');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const fetchAppChannelCached = memoizeAndTrack(
	async (mezon: MezonValueContext, clanId: string) => {
		const response = await mezon.client.listChannelApps(mezon.session, clanId);
		return response;
	},
	{
		promise: true,
		maxAge: LIST_CHANNEL_CACHED_TIME,
		normalizer: (args) => {
			return args[1] + args[0].session.username;
		}
	}
);

type fetchAppChannelsArgs = {
	clanId: string;
	noCache: boolean;
};

export const fetchAppChannels = createAsyncThunk('channels/fetchAppChannels', async ({ clanId, noCache }: fetchAppChannelsArgs, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		if (noCache) {
			await fetchAppChannelCached.clear(mezon, clanId);
		}

		const response = await fetchAppChannelCached(mezon, clanId);
		const appChannelEntities = response.channel_apps;
		return appChannelEntities || [];
	} catch (error) {
		captureSentryError(error, 'channels/fetchAppChannels');
		return thunkAPI.rejectWithValue(error);
	}
});

export const markAsReadProcessing = createAsyncThunk(
	'channels/markAsRead',
	async ({ clan_id, category_id, channel_id }: ApiMarkAsReadRequest, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const response = await mezon.client.markAsRead(mezon.session, {
				clan_id,
				category_id,
				channel_id
			});
			if (!response) {
				return thunkAPI.rejectWithValue([]);
			}
			return response;
		} catch (error) {
			captureSentryError(error, 'channels/markAsRead');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const initialChannelsState: ChannelsState = channelsAdapter.getInitialState({
	loadingStatus: 'not loaded',
	socketStatus: 'not loaded',
	error: null,
	isOpenCreateNewChannel: false,
	currentCategory: null,
	currentVoiceChannelId: '',
	request: {},
	idChannelSelected: JSON.parse(localStorage.getItem('remember_channel') || '{}'),
	modeResponsive: ModeResponsive.MODE_DM,
	quantityNotifyChannels: {},
	previousChannels: [],
	appChannelsList: {},
	fetchChannelSuccess: false,
	favoriteChannels: []
});

export const channelsSlice = createSlice({
	name: CHANNELS_FEATURE_KEY,
	initialState: initialChannelsState,
	reducers: {
		add: channelsAdapter.addOne,
		removeAll: channelsAdapter.removeAll,
		remove: channelsAdapter.removeOne,
		update: channelsAdapter.updateOne,
		upsertOne: (state: ChannelsState, action: PayloadAction<ChannelsEntity>) => {
			const existingEntity = state.entities[action.payload?.id];
			if (
				!existingEntity ||
				!isEqual(
					{
						...existingEntity,
						last_seen_message: { ...existingEntity.last_seen_message },
						last_sent_message: { ...existingEntity.last_sent_message }
					},
					action.payload
				)
			) {
				channelsAdapter.upsertOne(state, action.payload);
			}
		},
		removeByChannelID: (state, action: PayloadAction<string>) => {
			channelsAdapter.removeOne(state, action.payload);
		},
		setModeResponsive: (state, action) => {
			state.modeResponsive = action.payload;
		},
		setCurrentChannelId: (state, action: PayloadAction<string>) => {
			state.currentChannelId = action.payload;
		},
		setSelectedChannelId: (state, action: PayloadAction<string>) => {
			state.selectedChannelId = action.payload;
		},
		setCurrentVoiceChannelId: (state, action: PayloadAction<string>) => {
			state.currentVoiceChannelId = action.payload;
		},
		openCreateNewModalChannel: (state, action: PayloadAction<boolean>) => {
			state.isOpenCreateNewChannel = action.payload;
		},
		setCurrentCategory: (state, action: PayloadAction<ICategory>) => {
			state.currentCategory = action.payload;
		},
		createChannelSocket: (state, action: PayloadAction<ChannelCreatedEvent>) => {
			const payload = action.payload;

			if (payload.parrent_id !== '0' && payload.channel_private !== 1) {
				const channel = mapChannelToEntity({
					...payload,
					type: payload.channel_type,
					active: 1
				});
				channelsAdapter.addOne(state, channel);
			} else if (payload.parrent_id === '0' && payload.channel_private !== 1) {
				const channel = mapChannelToEntity({
					...payload,
					type: payload.channel_type
				});
				channelsAdapter.addOne(state, channel);
			}
		},
		deleteChannelSocket: (state, action: PayloadAction<ChannelDeletedEvent>) => {
			const payload = action.payload;
			channelsAdapter.removeOne(state, payload.channel_id);
		},
		updateChannelSocket: (state, action: PayloadAction<ChannelUpdatedEvent>) => {
			const payload = action.payload;
			channelsAdapter.updateOne(state, {
				id: payload.channel_id,
				changes: {
					channel_label: payload.channel_label,
					app_url: payload.app_url,
					status: payload.status,
					meeting_code: payload.meeting_code
				}
			});
		},

		setStatusChannelFetch: (state) => {
			state.fetchChannelSuccess = false;
		},

		updateChannelPrivateSocket: (state, action: PayloadAction<ChannelUpdatedEvent>) => {
			const payload = action.payload;
			const entity = state.entities[payload.channel_id];
			let channelPrivate: number;
			if (entity) {
				if (entity.channel_private && entity.channel_private === 1) {
					channelPrivate = 0;
				} else {
					channelPrivate = 1;
				}
			} else {
				channelPrivate = 1;
			}
			channelsAdapter.updateOne(state, {
				id: payload.channel_id,
				changes: {
					channel_private: channelPrivate
				}
			});
		},
		setRequestInput: (state, action: PayloadAction<{ channelId: string; request: RequestInput }>) => {
			state.request[action.payload.channelId] = action.payload.request;
		},
		setIdChannelSelected: (state, action: PayloadAction<{ clanId: string; channelId: string }>) => {
			state.idChannelSelected[action.payload.clanId] = action.payload.channelId;
			localStorage.setItem('remember_channel', JSON.stringify(state.idChannelSelected));
		},
		removeRememberChannel: (state, action: PayloadAction<{ clanId: string }>) => {
			delete state.idChannelSelected[action.payload.clanId];
			localStorage.setItem('remember_channel', JSON.stringify(state.idChannelSelected));
		},
		setPreviousChannels: (state, action: PayloadAction<{ channelId: string }>) => {
			state.previousChannels = state.previousChannels.filter((channelId) => channelId !== action.payload.channelId);
			state.previousChannels.unshift(action.payload.channelId);
			if (state.previousChannels.length > 3) {
				state.previousChannels.pop();
			}
		},
		updateChannelBadgeCount: (state: ChannelsState, action: PayloadAction<{ channelId: string; count: number; isReset?: boolean }>) => {
			const { channelId, count, isReset = false } = action.payload;
			const entity = state.entities[channelId];
			if (entity) {
				const newCountMessUnread = isReset ? 0 : (entity.count_mess_unread ?? 0) + count;
				if (entity.count_mess_unread !== newCountMessUnread) {
					channelsAdapter.updateOne(state, {
						id: channelId,
						changes: {
							count_mess_unread: newCountMessUnread
						}
					});
				}
			}
		}
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchChannels.pending, (state: ChannelsState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(fetchChannels.fulfilled, (state: ChannelsState, action: PayloadAction<ChannelsEntity[]>) => {
				channelsAdapter.setAll(state, action.payload);
				state.fetchChannelSuccess = true;
				state.loadingStatus = 'loaded';
			})
			.addCase(fetchChannels.rejected, (state: ChannelsState, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			});

		builder
			.addCase(joinChannel.rejected, (state: ChannelsState, action) => {
				state.socketStatus = 'error';
				state.error = action.error.message;
			})
			.addCase(joinChannel.pending, (state: ChannelsState) => {
				state.socketStatus = 'loading';
			})
			.addCase(joinChannel.fulfilled, (state: ChannelsState) => {
				state.socketStatus = 'loaded';
			});
		builder
			.addCase(createNewChannel.pending, (state: ChannelsState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(createNewChannel.fulfilled, (state: ChannelsState) => {
				state.loadingStatus = 'loaded';
				state.isOpenCreateNewChannel = false;
			})
			.addCase(createNewChannel.rejected, (state: ChannelsState, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			});

		builder
			.addCase(deleteChannel.pending, (state: ChannelsState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(deleteChannel.fulfilled, (state: ChannelsState) => {
				state.loadingStatus = 'loaded';
			})
			.addCase(deleteChannel.rejected, (state: ChannelsState, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			});

		builder.addCase(fetchAppChannels.fulfilled, (state: ChannelsState, action: PayloadAction<ApiChannelAppResponse[]>) => {
			state.appChannelsList = action.payload.reduce<Record<string, ApiChannelAppResponse>>((acc, appChannel) => {
				if (appChannel.channel_id) {
					acc[appChannel.channel_id] = appChannel;
				}
				return acc;
			}, {});
		});

		builder
			.addCase(fetchListFavoriteChannel.pending, (state) => {
				state.loadingStatus = 'loading';
			})
			.addCase(fetchListFavoriteChannel.fulfilled, (state, action) => {
				state.loadingStatus = 'loaded';
				if (action.payload) {
					state.favoriteChannels = action.payload.channel_ids;
				} else {
					state.favoriteChannels = [];
				}
				state.fetchChannelSuccess = true;
			})
			.addCase(fetchListFavoriteChannel.rejected, (state, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			})
			.addCase(addFavoriteChannel.fulfilled, (state, action) => {
				if (!state.favoriteChannels) {
					state.favoriteChannels = [];
				}
				state.favoriteChannels.push(action.payload?.channel_id || '');
			})
			.addCase(removeFavoriteChannel.fulfilled, (state, action) => {
				state.favoriteChannels = state.favoriteChannels.filter((id) => id !== action.meta.arg.channelId);
			});
	}
});

/*
 * Export reducer for store configuration.
 */
export const channelsReducer = channelsSlice.reducer;

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
 *   dispatch(channelsActions.add({ id: 1 }))
 * }, [dispatch]);
 * ```
 *
 * See: https://react-redux.js.org/next/api/hooks#usedispatch
 */
export const { openCreateNewModalChannel } = channelsSlice.actions;

export const channelsActions = {
	...channelsSlice.actions,
	fetchChannels,
	joinChannel,
	joinChat,
	createNewChannel,
	deleteChannel,
	updateChannel,
	updateChannelPrivate,
	fetchAppChannels,
	fetchListFavoriteChannel,
	addFavoriteChannel,
	removeFavoriteChannel,
	addThreadToChannels
};

/*
 * Export selectors to query state. For use with the `useSelector` hook.
 *
 * e.g.
 * ```
 * import { useSelector } from 'react-redux';
import { channel } from 'process';
import { mess } from '@mezon/store';
import { remove } from '@mezon/mobile-components';
 *
 * // ...
 *
 * const entities = useSelector(selectAllChannels);
 * ```
 *
 * See: https://react-redux.js.org/next/api/hooks#useselector
 */
const { selectAll, selectEntities } = channelsAdapter.getSelectors();

export const getChannelsState = (rootState: { [CHANNELS_FEATURE_KEY]: ChannelsState }): ChannelsState => rootState[CHANNELS_FEATURE_KEY];

export const selectAllChannels = createSelector(getChannelsState, selectAll);

export const selectChannelsEntities = createSelector(getChannelsState, selectEntities);

export const selectChannelById2 = createSelector([selectChannelsEntities, (state, id) => id], (channelsEntities, id) => channelsEntities[id] || null);

export const selectCurrentChannelId = createSelector(getChannelsState, (state) => state.currentChannelId);

export const selectSelectedChannelId = createSelector(getChannelsState, (state) => state.selectedChannelId);

export const selectModeResponsive = createSelector(getChannelsState, (state) => state.modeResponsive);

export const selectCurrentVoiceChannelId = createSelector(getChannelsState, (state) => state.currentVoiceChannelId);

export const selectChannelUserByChannelId = createSelector(
	[selectAllChannelsByUser, (state, channelId: string) => channelId],
	(channels, channelId) => channels.find((ch) => ch.channel_id === channelId) || null
);

export const selectChannelById = createSelector(
	[selectChannelsEntities, selectAllChannelsByUser, (state, id: string) => id],
	(channelsEntities, userChannels, id) => {
		const channel = channelsEntities[id];
		const channelFromUserChannel = userChannels.find((ch) => ch.channel_id === id);
		return channel || channelFromUserChannel || null;
	}
);

export const selectCurrentChannel = createSelector(
	selectChannelsEntities,
	selectCurrentChannelId,
	selectAllChannelsByUser,
	(clansEntities, clanId, userChannels) => {
		if (!clanId) return null;
		const currentChannel = clansEntities[clanId];
		const channelFromUserChannel = userChannels.find((ch) => ch.channel_id === clanId);
		return currentChannel || channelFromUserChannel || null;
	}
);

export const selectSelectedChannel = createSelector(selectChannelsEntities, selectSelectedChannelId, (clansEntities, clanId) =>
	clanId ? clansEntities[clanId] : null
);

export const selectClanId = () => createSelector(selectCurrentChannel, (channel) => channel?.clan_id);

export const selectCurrentVoiceChannel = createSelector(selectChannelsEntities, selectCurrentVoiceChannelId, (clansEntities, clanId) =>
	clanId ? clansEntities[clanId] : null
);

export const selectVoiceChannelAll = createSelector(selectAllChannels, (channels) =>
	channels.filter((channel) => channel.type === ChannelType.CHANNEL_TYPE_VOICE)
);

export const selectChannelFirst = createSelector(selectAllChannels, (channels) => channels[0]);

export const selectChannelSecond = createSelector(selectAllChannels, (channels) => channels[1]);

export const selectChannelsByClanId = (clainId: string) =>
	createSelector(selectAllChannels, (channels) => channels.filter((ch) => ch.clan_id === clainId));

export const selectDefaultChannelIdByClanId = (clanId: string, categories?: string[]) =>
	createSelector(selectChannelsByClanId(clanId), (channels) => {
		const idsSelectedChannel = JSON.parse(localStorage.getItem('remember_channel') || '{}');
		if (idsSelectedChannel && idsSelectedChannel[clanId]) {
			const selectedChannel = channels.find((channel) => channel.channel_id === idsSelectedChannel[clanId]);
			if (selectedChannel) {
				return selectedChannel.id;
			}
		}

		if (categories) {
			for (const category of categories) {
				const filteredChannel = channels.find(
					(channel) => channel.parrent_id === '0' && channel.type === ChannelType.CHANNEL_TYPE_TEXT && channel.category_id === category
				);
				if (filteredChannel) {
					return filteredChannel.id;
				}
			}
		}

		const defaultChannel = channels.find((channel) => channel.parrent_id === '0' && channel.type === ChannelType.CHANNEL_TYPE_TEXT);

		return defaultChannel ? defaultChannel.id : null;
	});

export const selectRequestByChannelId = (channelId: string) =>
	createSelector(getChannelsState, (state) => {
		return state.request?.[channelId];
	});

export const selectIdChannelSelectedByClanId = (clanId: string) =>
	createSelector(getChannelsState, (state) => {
		return state.idChannelSelected[clanId];
	});

export const selectAllIdChannelSelected = createSelector(getChannelsState, (state) => state.idChannelSelected);

export const selectAllChannelsFavorite = createSelector(getChannelsState, (state) => state.favoriteChannels);

export const selectPreviousChannels = createSelector(getChannelsState, (state) => state.previousChannels);

export const selectAppChannelById = (channelId: string) =>
	createSelector(getChannelsState, (state) => {
		return state.appChannelsList[channelId];
	});

export const selectFetchChannelStatus = createSelector(getChannelsState, (state) => state.fetchChannelSuccess);

export const selectAnyUnreadChannels = createSelector([getChannelsState, selectEntiteschannelCategorySetting], (state, settings) => {
	for (let index = 0; index < state?.ids?.length; index++) {
		const channel = state?.entities?.[state?.ids[index]];
		if (settings?.[channel?.id]?.action === enableMute) continue;
		if (channel.count_mess_unread && channel.count_mess_unread > 0) {
			return true;
		}
	}
	return false;
});

export const selectThreadCurrentChannel = createSelector(
	[selectChannelsEntities, selectCurrentChannelId, selectListThreadId],
	(channels, currentChannelId, listThreadId) => {
		if (listThreadId && currentChannelId && listThreadId[currentChannelId]) {
			return channels[listThreadId[currentChannelId]];
		}
		return undefined;
	}
);

export const selectChannelThreads = createSelector([selectAllChannels], (channels) => {
	const channelFilter = channels.filter((channel) => channel.parrent_id === '0' || channel.parrent_id === '');
	const channelThread = channelFilter.map((channel) => {
		const thread = channels.filter((thread) => channel && channel?.channel_id === thread.parrent_id) as ChannelsEntity[];
		return {
			...channel,
			threads: thread
		};
	});
	return channelThread as ChannelThreads[];
});
