import { captureSentryError } from '@mezon/logger';
import type {
	ApiChannelAppResponseExtend,
	ApiChannelMessageHeaderWithChannel,
	BuzzArgs,
	ChannelThreads,
	ICategory,
	IChannel,
	LoadingStatus
} from '@mezon/utils';
import { ModeResponsive, TypeCheck, checkIsThread, mapChannelToAppEntity } from '@mezon/utils';
import type { EntityState, GetThunkAPI, PayloadAction, Update } from '@reduxjs/toolkit';
import { createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import isEqual from 'lodash.isequal';
import type { ChannelCreatedEvent, ChannelDeletedEvent, ChannelUpdatedEvent } from 'mezon-js';
import { ChannelType } from 'mezon-js';
import type {
	ApiAddFavoriteChannelRequest,
	ApiChangeChannelPrivateRequest,
	ApiChannelAppResponse,
	ApiChannelDescription,
	ApiCreateChannelDescRequest,
	ApiMarkAsReadRequest
} from 'mezon-js/api.gen';
import type { CacheMetadata } from '../cache-metadata';
import { createApiKey, createCacheMetadata, markApiFirstCalled, shouldForceApiCall } from '../cache-metadata';
import { categoriesActions, type FetchCategoriesPayload } from '../categories/categories.slice';
import { userChannelsActions } from '../channelmembers/AllUsersChannelByAddChannel.slice';
import { channelMembersActions } from '../channelmembers/channel.members';
import type { MezonValueContext } from '../helpers';
import { ensureSession, ensureSocket, fetchDataWithSocketFallback, getMezonCtx } from '../helpers';
import { messagesActions, processQueuedLastSeenMessages, selectUnreadMessageIdByChannelId } from '../messages/messages.slice';
import { selectEntiteschannelCategorySetting } from '../notificationSetting/notificationSettingCategory.slice';
import { notificationSettingActions } from '../notificationSetting/notificationSettingChannel.slice';
import { overriddenPoliciesActions } from '../policies/overriddenPolicies.slice';
import { reactionActions } from '../reactionMessage/reactionMessage.slice';
import { rolesClanActions } from '../roleclan/roleclan.slice';
import type { RootState } from '../store';
import { selectListThreadId, threadsActions } from '../threads/threads.slice';
import type { LIST_CHANNELS_USER_FEATURE_KEY, ListChannelsByUserState } from './channelUser.slice';
import { listChannelsByUserActions, selectEntitiesChannelsByUser } from './channelUser.slice';
import type { ChannelMetaEntity } from './channelmeta.slice';
import { channelMetaActions, enableMute } from './channelmeta.slice';
import { listChannelRenderAction, selectListChannelRenderByClanId } from './listChannelRender.slice';

const LIST_CHANNEL_CACHED_TIME = 1000 * 60 * 5;

const pendingFetchChannels = new Map<string, Promise<any>>();

export const CHANNELS_FEATURE_KEY = 'channels';

/*
 * Update these interfaces according to your requirements.
 */
export interface ChannelsEntity extends IChannel {
	id: string; // Primary ID
	showPinBadge?: boolean;
}

function extractChannelMeta(channel: ChannelsEntity): ChannelMetaEntity {
	return {
		id: channel.id,
		lastSeenTimestamp: Number(channel.last_seen_message?.timestamp_seconds) ?? 0,
		lastSentTimestamp: Number(channel.last_sent_message?.timestamp_seconds),
		clanId: channel.clan_id ?? '',
		isMute: channel.is_mute ?? false,
		senderId: channel.last_sent_message?.sender_id ?? '',
		lastSeenMessageId: channel.last_seen_message?.id
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

export interface ChannelsState {
	byClans: Record<
		string,
		{
			entities: EntityState<ChannelsEntity, string>;
			currentChannelId?: string | null;
			selectedChannelId?: string | null;
			currentVoiceChannelId: string;
			idChannelSelected: Record<string, string>;
			modeResponsive: ModeResponsive.MODE_CLAN | ModeResponsive.MODE_DM;
			previousChannels: Array<{ clanId: string; channelId: string }>;
			appChannelsList: Record<string, ApiChannelAppResponse>;
			appChannelsListShowOnPopUp: ApiChannelAppResponseExtend[];
			fetchChannelSuccess: boolean;
			favoriteChannels: string[];
			buzzState: Record<string, BuzzArgs | null>;
			isOpenCreateNewChannel?: boolean;
			currentCategory?: ICategory;
			appFocused?: Record<string, ApiChannelAppResponseExtend>;
			// Cache metadata for different data types
			channelsCache?: CacheMetadata;
			favoriteChannelsCache?: CacheMetadata;
			appChannelsCache?: CacheMetadata;
		}
	>;
	loadingStatus: LoadingStatus;
	socketStatus: LoadingStatus;
	error?: string | null;
	scrollPosition: Record<string, { messageId?: string; offset?: number }>;
	showScrollDownButton: Record<string, boolean>;
}

const channelsAdapter = createEntityAdapter<ChannelsEntity>();

const getInitialClanState = () => {
	return {
		entities: channelsAdapter.getInitialState(),
		currentChannelId: null,
		selectedChannelId: null,
		currentVoiceChannelId: '',
		idChannelSelected: {},
		modeResponsive: ModeResponsive.MODE_DM,
		previousChannels: [],
		appChannelsList: {},
		appChannelsListShowOnPopUp: [],
		fetchChannelSuccess: false,
		favoriteChannels: [],
		buzzState: {},
		appFocused: {},
		showScrollDownButton: {}
	};
};

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
	noCache?: boolean;
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

const selectCachedChannelsByClan = createSelector(
	[(state: RootState, clanId: string) => state[CHANNELS_FEATURE_KEY].byClans[clanId]?.entities],
	(entitiesState) => {
		return entitiesState ? channelsAdapter.getSelectors().selectAll(entitiesState) : [];
	}
);

export const fetchChannelsCached = async (
	getState: () => RootState,
	ensuredMezon: MezonValueContext,
	limit: number,
	state: number,
	clanId: string,
	channelType: number,
	noCache = false
) => {
	const currentState = getState();
	const clanData = currentState[CHANNELS_FEATURE_KEY].byClans[clanId];
	const apiKey = createApiKey('fetchChannels', clanId, channelType);

	const shouldForceCall = shouldForceApiCall(apiKey, clanData?.channelsCache, noCache);

	if (!shouldForceCall && clanData?.entities?.ids?.length > 0) {
		const channels = selectCachedChannelsByClan(currentState, clanId);
		return {
			channeldesc: channels,
			fromCache: true,
			time: clanData.channelsCache?.lastFetched || Date.now()
		};
	}

	const response = await fetchDataWithSocketFallback(
		ensuredMezon,
		{
			api_name: 'ListChannelDescs',
			list_channel_req: {
				limit,
				state,
				channel_type: channelType,
				clan_id: clanId
			}
		},
		() => ensuredMezon.client.listChannelDescs(ensuredMezon.session, limit, state, '', clanId, channelType),
		'channel_desc_list'
	);

	markApiFirstCalled(apiKey);

	return {
		...response,
		fromCache: false,
		time: Date.now()
	};
};

export const fetchListFavoriteChannelCached = async (getState: () => RootState, ensuredMezon: MezonValueContext, clanId: string, noCache = false) => {
	const currentState = getState();
	const clanData = currentState[CHANNELS_FEATURE_KEY].byClans[clanId];

	const apiKey = createApiKey('fetchFavoriteChannels', clanId);

	const shouldForceCall = shouldForceApiCall(apiKey, clanData?.favoriteChannelsCache, noCache);

	if (!shouldForceCall) {
		return {
			channel_ids: clanData.favoriteChannels,
			fromCache: true,
			time: clanData.favoriteChannelsCache?.lastFetched || Date.now()
		};
	}

	const response = await fetchDataWithSocketFallback(
		ensuredMezon,
		{
			api_name: 'GetListFavoriteChannel',
			favorite_channel_req: {
				clan_id: clanId
			}
		},
		() => ensuredMezon.client.getListFavoriteChannel(ensuredMezon.session, clanId),
		'favorite_channel_list'
	);

	markApiFirstCalled(apiKey);

	return {
		...response,
		fromCache: false,
		time: Date.now()
	};
};

export const fetchAppChannelCached = async (getState: () => RootState, ensuredMezon: MezonValueContext, clanId: string, noCache = false) => {
	const currentState = getState();
	const clanData = currentState[CHANNELS_FEATURE_KEY].byClans[clanId];

	const apiKey = createApiKey('fetchAppChannels', clanId);

	const shouldForceCall = shouldForceApiCall(apiKey, clanData?.appChannelsCache, noCache);

	if (!shouldForceCall) {
		return {
			channel_apps: Object.values(clanData.appChannelsList),
			fromCache: true
		};
	}

	const response = await fetchDataWithSocketFallback(
		ensuredMezon,
		{
			api_name: 'ListChannelApps',
			list_apps_req: {
				clan_id: clanId
			}
		},
		() => ensuredMezon.client.listChannelApps(ensuredMezon.session, clanId),
		'channel_apps_list'
	);

	markApiFirstCalled(apiKey);

	return {
		...response,
		fromCache: false
	};
};

export const joinChat = createAsyncThunk('channels/joinChat', async ({ clanId, channelId, channelType, isPublic }: JoinChatPayload, thunkAPI) => {
	if (
		channelType !== ChannelType.CHANNEL_TYPE_CHANNEL &&
		channelType !== ChannelType.CHANNEL_TYPE_DM &&
		channelType !== ChannelType.CHANNEL_TYPE_GROUP &&
		channelType !== ChannelType.CHANNEL_TYPE_THREAD &&
		channelType !== ChannelType.CHANNEL_TYPE_MEZON_VOICE
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
	async ({ clanId, channelId, noFetchMembers, messageId, isClearMessage = true, noCache = false }: fetchChannelMembersPayload, thunkAPI) => {
		try {
			thunkAPI.dispatch(reactionActions.removeAll());
			thunkAPI.dispatch(channelsActions.setIdChannelSelected({ clanId, channelId }));
			thunkAPI.dispatch(channelsActions.setCurrentChannelId({ clanId, channelId }));
			thunkAPI.dispatch(notificationSettingActions.getNotificationSetting({ channelId }));
			thunkAPI.dispatch(overriddenPoliciesActions.fetchMaxChannelPermission({ clanId: clanId ?? '', channelId }));

			let state = thunkAPI.getState() as RootState;

			const fetchChannelSuccess = state.channels.byClans[clanId]?.fetchChannelSuccess;
			if (!fetchChannelSuccess) {
				await thunkAPI.dispatch(fetchChannels({ clanId, noCache })).unwrap();
				state = thunkAPI.getState() as RootState;
			}

			const channel = selectChannelById(getChannelsRootState(thunkAPI), channelId);

			if (!state.messages?.idMessageToJump?.id) {
				const unreadMsgId = selectUnreadMessageIdByChannelId(thunkAPI.getState(), channelId as string);
				const lastSeenMessageId = unreadMsgId || channel?.last_seen_message?.id;
				thunkAPI.dispatch(
					messagesActions.fetchMessages({
						clanId,
						channelId,
						isClearMessage,
						noCache,
						messageId: lastSeenMessageId,
						direction: lastSeenMessageId ? 2 : undefined,
						isFetchingLatestMessages: !lastSeenMessageId
					})
				);
			}

			if (!noFetchMembers) {
				if (channel && channel?.parent_id !== '0' && channel?.parent_id !== '') {
					thunkAPI.dispatch(
						channelMembersActions.fetchChannelMembers({
							clanId,
							channelId: channel.parent_id || '',
							channelType: ChannelType.CHANNEL_TYPE_CHANNEL
						})
					);
				}
				thunkAPI.dispatch(channelMembersActions.fetchChannelMembers({ clanId, channelId, channelType: ChannelType.CHANNEL_TYPE_CHANNEL }));
			}
			thunkAPI.dispatch(userChannelsActions.fetchUserChannels({ channelId }));
			thunkAPI.dispatch(channelsActions.setModeResponsive({ clanId, mode: ModeResponsive.MODE_CLAN }));

			const isPublic = channel ? (checkIsThread(channel as ChannelsEntity) ? false : !channel.channel_private) : false;
			if (channel) {
				thunkAPI.dispatch(
					channelsActions.joinChat({
						clanId: channel.clan_id ?? '',
						channelId: channel.channel_id ?? '',
						channelType: channel.type ?? 0,
						isPublic
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
			thunkAPI.dispatch(
				channelsActions.add({ channel: { id: response.channel_id as string, ...response }, clanId: response.clan_id as string })
			);

			if (response.type !== ChannelType.CHANNEL_TYPE_MEZON_VOICE && response.type !== ChannelType.CHANNEL_TYPE_STREAMING) {
				const isPublic = checkIsThread(response as ChannelsEntity) ? false : !response.channel_private;
				thunkAPI.dispatch(
					channelsActions.joinChat({
						clanId: response.clan_id as string,
						channelId: response.channel_id as string,
						channelType: response.type as number,
						isPublic
					})
				);
			}
			if (response.parent_id !== '0') {
				await thunkAPI.dispatch(
					threadsActions.setListThreadId({ channelId: response.parent_id as string, threadId: response.channel_id as string })
				);
			}

			return response;
		} else {
			return thunkAPI.rejectWithValue([]);
		}
	} catch (error: any) {
		captureSentryError(error, 'channels/createNewChannel');

		if (error instanceof Response) {
			try {
				const errorBody = await error.json();
				return thunkAPI.rejectWithValue(errorBody);
			} catch (parseError) {
				return thunkAPI.rejectWithValue({ message: 'Unknown error from server' });
			}
		}

		return thunkAPI.rejectWithValue({
			message: error?.message || 'Something went wrong'
		});
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
		const response = await mezon.client.deleteChannelDesc(mezon.session, body.clanId, body.channelId);
		if (response) {
			if (body.isDmGroup) {
				return true;
			}
			thunkAPI.dispatch(channelsActions.remove({ channelId: body.channelId, clanId: body.clanId }));
			thunkAPI.dispatch(listChannelsByUserActions.remove(body.channelId));
			thunkAPI.dispatch(listChannelRenderAction.deleteChannelInListRender({ channelId: body.channelId, clanId: body.clanId }));
		}
	} catch (error) {
		captureSentryError(error, 'channels/deleteChannel');
		return thunkAPI.rejectWithValue(error);
	}
});

export interface IUpdateChannelRequest {
	channel_id: string;
	channel_label: string | undefined;
	category_id: string | undefined;
	e2ee?: number;
	topic?: string;
	age_restricted?: number;
	parent_id?: string;
	channel_private?: number;
	category_name?: string;
	app_id: string;
	channel_avatar?: string;
}

export const updateChannel = createAsyncThunk('channels/updateChannel', async (body: IUpdateChannelRequest, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		const state = thunkAPI.getState() as RootState;
		const clanId = state.clans.currentClanId;
		const response = await mezon.client.updateChannelDesc(mezon.session, body.channel_id, body);
		if (response) {
			if (body.category_id !== '0') {
				thunkAPI.dispatch(
					channelsActions.update({
						clanId: clanId as string,
						update: {
							id: body.channel_id,
							changes: { ...body }
						}
					})
				);
				thunkAPI.dispatch(
					listChannelRenderAction.updateChannelInListRender({ channelId: body.channel_id, clanId: clanId as string, dataUpdate: body })
				);
			}
		}
	} catch (error) {
		captureSentryError(error, 'channels/updateChannel');
		return thunkAPI.rejectWithValue(error);
	}
});

export const changeCategoryOfChannel = createAsyncThunk('channels/changeCategoryOfChannel', async (request: IUpdateChannelRequest, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		const state = thunkAPI.getState() as RootState;
		const clanId = state.clans.currentClanId;
		const response = await mezon.client.changeChannelCategory(mezon.session, request.category_id as string, {
			channel_id: request.channel_id,
			clan_id: clanId as string
		});
		if (!response) {
			return;
		}
		thunkAPI.dispatch(
			channelsActions.update({
				clanId: clanId as string,
				update: {
					id: request.channel_id,
					changes: { ...request }
				}
			})
		);
		thunkAPI.dispatch(
			listChannelRenderAction.updateChannelPositionInRenderedList({
				categoryId: request.category_id as string,
				channelId: request.channel_id as string,
				clanId: clanId as string
			})
		);
	} catch (err) {
		captureSentryError(err, 'channels/changeCategoryOfChannel');
		return thunkAPI.rejectWithValue(err);
	}
});

export const updateChannelPrivate = createAsyncThunk('channels/updateChannelPrivate', async (body: ApiChangeChannelPrivateRequest, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		const response = await mezon.client.updateChannelPrivate(mezon.session, body);
		const clanID = selectClanId()(thunkAPI.getState() as RootState) || '';

		if (response) {
			thunkAPI.dispatch(rolesClanActions.fetchRolesClan({ clanId: clanID, channelId: body.channel_id, noCache: true }));
			thunkAPI.dispatch(
				channelMembersActions.fetchChannelMembers({
					clanId: clanID,
					channelId: body.channel_id || '',
					noCache: true,
					channelType: ChannelType.CHANNEL_TYPE_CHANNEL
				})
			);
		}
	} catch (error) {
		captureSentryError(error, 'channels/updateChannelPrivate');
		return thunkAPI.rejectWithValue(error);
	}
});

export const fetchListFavoriteChannel = createAsyncThunk('channels/favorite', async ({ clanId, noCache }: FetchChannelFavoriteArgs, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));

		const response = await fetchListFavoriteChannelCached(thunkAPI.getState as () => RootState, mezon, clanId, noCache);

		if (response.fromCache) {
			return {
				fromCache: true
			};
		}

		return { ...response, clanId };
	} catch (error) {
		captureSentryError(error, 'channels/favorite');
		return thunkAPI.rejectWithValue(error);
	}
});

export const addFavoriteChannel = createAsyncThunk('channels/favorite/add', async (body: ApiAddFavoriteChannelRequest, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		const response = await mezon.client.addFavoriteChannel(mezon.session, body.channel_id as string, body.clan_id as string);
		if (response) {
			thunkAPI.dispatch(
				channelsActions.addFavorite({
					clanId: body.clan_id as string,
					channelId: body.channel_id as string
				})
			);
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
			const response = await mezon.client.removeFavoriteChannel(mezon.session, channelId, clanId);
			if (response) {
				thunkAPI.dispatch(
					channelsActions.removeFavorite({
						clanId,
						channelId
					})
				);
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
	isMobile?: boolean;
};

export const addThreadToChannels = createAsyncThunk(
	'channels/addThreadToChannels',
	async ({ clanId, channelId }: { clanId: string; channelId: string }, thunkAPI) => {
		const channelData = selectChannelByIdAndClanId(thunkAPI.getState() as RootState, clanId, channelId);
		if (channelId && !channelData) {
			const data = await thunkAPI
				.dispatch(
					threadsActions.fetchThread({
						channelId: '0',
						clanId,
						threadId: channelId
					})
				)
				.unwrap();

			if (data?.threads?.length > 0) {
				thunkAPI.dispatch(
					channelsActions.upsertOne({
						clanId,
						channel: { ...data.threads[0], active: 1 } as ChannelsEntity
					})
				);
				thunkAPI.dispatch(
					listChannelRenderAction.addThreadToListRender({
						clanId,
						channel: { ...data.threads[0], active: 1 } as ChannelsEntity
					})
				);
			}
		} else {
			thunkAPI.dispatch(
				listChannelRenderAction.addThreadToListRender({
					clanId,
					channel: channelData
				})
			);
		}
	}
);

export const addThreadSocket = createAsyncThunk(
	'channels/addThreadSocket',
	async ({ clanId, channelId, channel }: { clanId: string; channelId: string; channel: Record<string, unknown> }, thunkAPI) => {
		const channelData = selectChannelByIdAndClanId(thunkAPI.getState() as RootState, clanId, channelId);
		if (channelId && !channelData) {
			if (channel) {
				thunkAPI.dispatch(
					channelsActions.upsertOne({
						clanId,
						channel: { ...channel, active: 1 } as ChannelsEntity
					})
				);
				thunkAPI.dispatch(
					listChannelRenderAction.addThreadToListRender({
						clanId,
						channel: { ...channel, active: 1 } as ChannelsEntity
					})
				);
			}
		} else {
			thunkAPI.dispatch(
				listChannelRenderAction.addThreadToListRender({
					clanId,
					channel: { ...channelData, active: 1 }
				})
			);
		}
	}
);

type fetchAppChannelsArgs = {
	clanId: string;
	noCache: boolean;
};

export const fetchChannels = createAsyncThunk(
	'channels/fetchChannels',
	async ({ clanId, channelType = ChannelType.CHANNEL_TYPE_CHANNEL, noCache, isMobile = false }: fetchChannelsArgs, thunkAPI) => {
		const cacheKey = `${clanId}-${channelType}-${Boolean(noCache)}`;

		if (pendingFetchChannels.has(cacheKey)) {
			return pendingFetchChannels.get(cacheKey);
		}

		const fetchPromise = (async () => {
			try {
				const mezon = await ensureSession(getMezonCtx(thunkAPI));

				const response = await fetchChannelsCached(
					thunkAPI.getState as () => RootState,
					mezon,
					500,
					1,
					clanId,
					channelType,
					Boolean(noCache)
				);

				if (!response.channeldesc) {
					return { channels: [], clanId };
				}
				thunkAPI.dispatch(fetchAppChannels({ clanId, noCache: Boolean(noCache) }));
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

				const currentChannelId = state.channels?.byClans[clanId]?.currentChannelId;

				try {
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
						if (data?.threads?.length > 0) {
							response.channeldesc.push({ ...data.threads[0], active: 1 } as ChannelsEntity);
						}
					}
				} catch (error) {
					// ignore
				}

				const listChannelRender = selectListChannelRenderByClanId(thunkAPI.getState(), clanId);
				if (listChannelRender && response.fromCache) {
					return {
						channels: [],
						clanId,
						fromCache: true
					};
				}

				const channels = response.channeldesc.map((channel) => ({
					...mapChannelToEntity(channel),
					last_seen_message: channel.last_seen_message ? channel.last_seen_message : { timestamp_seconds: 0 }
				}));

				const [favorChannels, listCategory] = await Promise.all([
					thunkAPI.dispatch(fetchListFavoriteChannel({ clanId, noCache: Boolean(noCache) })),
					thunkAPI.dispatch(categoriesActions.fetchCategories({ clanId, noCache: Boolean(noCache) }))
				]);

				thunkAPI.dispatch(
					listChannelRenderAction.mapListChannelRender({
						clanId,
						listChannelFavor: favorChannels.payload.channel_ids || [],
						listCategory: (listCategory.payload as FetchCategoriesPayload)?.categories || [],
						listChannel: channels,
						isMobile
					})
				);

				const meta = channels.map((ch) => extractChannelMeta(ch));
				thunkAPI.dispatch(channelMetaActions.updateBulkChannelMetadata(meta));

				const currentState = thunkAPI.getState() as RootState;
				const queuedMessages = currentState.messages.queuedLastSeenMessages;
				if (queuedMessages.length > 0) {
					thunkAPI.dispatch(processQueuedLastSeenMessages());
				}

				return { channels, clanId };
			} catch (error) {
				captureSentryError(error, 'channels/fetchChannels');
				return thunkAPI.rejectWithValue(error);
			} finally {
				pendingFetchChannels.delete(cacheKey);
			}
		})();

		pendingFetchChannels.set(cacheKey, fetchPromise);

		return fetchPromise;
	}
);

export const fetchAppChannels = createAsyncThunk('channels/fetchAppChannels', async ({ clanId, noCache }: fetchAppChannelsArgs, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));

		const response = await fetchAppChannelCached(thunkAPI.getState as () => RootState, mezon, clanId, noCache);
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
			if (channel_id && clan_id) {
				thunkAPI.dispatch(
					channelsActions.update({
						clanId: clan_id as string,
						update: {
							id: channel_id as string,
							changes: { count_mess_unread: 0 }
						}
					})
				);
			}
			// remove because get old cache
			return response;
		} catch (error) {
			captureSentryError(error, 'channels/markAsRead');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const updateChannelBadgeCountAsync = createAsyncThunk(
	'channels/updateChannelBadgeCount',
	async ({ clanId, channelId, count, isReset = false }: { clanId: string; channelId: string; count: number; isReset?: boolean }, thunkAPI) => {
		const state = thunkAPI.getState() as RootState;
		const channelState = state.channels.byClans[clanId];
		if (!channelState) {
			return;
		}
		const entity = channelState.entities.entities[channelId];
		if (entity || state.channels.byClans[clanId].entities.entities[channelId]) {
			const updatedEntity = state.channels.byClans[clanId].entities.entities[channelId];
			const newCountMessUnread = isReset ? 0 : (updatedEntity?.count_mess_unread ?? 0) + count;

			if (updatedEntity?.count_mess_unread !== newCountMessUnread) {
				thunkAPI.dispatch(
					channelsActions.updateChannelBadgeCount({
						clanId,
						channelId,
						count: 1
					})
				);
				thunkAPI.dispatch(listChannelRenderAction.addBadgeToChannelRender({ clanId, channelId }));
			}
		}
	}
);

export const bulkDeleteChannelSocket = createAsyncThunk(
	'channels/bulkDeleteChannelSocket',
	async ({ channels, clanId }: { channels: IChannel[]; clanId: string }, thunkAPI) => {
		try {
			const channelIds = channels.map((channel) => channel.id);
			const channelDeleteEvents = channels.map((channel) => ({
				channel_id: channel.id,
				clan_id: channel.clan_id || '',
				deletor: 'user',
				channel_type: channel.type || 0,
				channel_label: channel.channel_label || '',
				category_id: channel.category_id || '',
				parent_id: channel.parent_id || ''
			}));
			thunkAPI.dispatch(channelsActions.bulkDeleteChannels({ clanId, channelIds }));
			thunkAPI.dispatch(listChannelsByUserActions.bulkRemove(channelIds));
			thunkAPI.dispatch(listChannelRenderAction.bulkUpdateClanBadgeRender({ channelIds, clanId }));
			thunkAPI.dispatch(listChannelRenderAction.bulkDeleteChannelsInListRender({ channelIds, clanId }));

			return { channelDeleteEvents, channelIds, clanId };
		} catch (error) {
			captureSentryError(error, 'channels/bulkDeleteChannelSocket');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const updateChannelPrivateSocket = createAsyncThunk(
	'channels/updateChannelPrivateSocket',
	async ({ action, isUserUpdate }: { action: ChannelUpdatedEvent; isUserUpdate: boolean }, thunkAPI) => {
		const state = thunkAPI.getState() as RootState;
		const clanId = action.clan_id;
		const channelState = state.channels.byClans[clanId];
		if (!channelState) {
			return false;
		}
		const entity = channelState.entities.entities[action.channel_id];
		if (entity) {
			if (entity.channel_private === action.channel_private) {
				return false;
			}
			if (action.channel_private !== 1) {
				thunkAPI.dispatch(
					channelsActions.updateChannelPrivateState({
						clanId,
						channelId: action.channel_id,
						channelPrivate: action.channel_private
					})
				);
				thunkAPI.dispatch(
					listChannelRenderAction.updateChannelInListRender({
						channelId: action.channel_id,
						clanId: action.clan_id as string,
						dataUpdate: { ...action }
					})
				);
				return false;
			} else {
				if (!isUserUpdate) {
					thunkAPI.dispatch(channelsActions.remove({ clanId, channelId: action.channel_id }));
					thunkAPI.dispatch(
						listChannelRenderAction.deleteChannelInListRender({
							channelId: action.channel_id,
							clanId: action.clan_id as string
						})
					);
					return true;
				}
			}
		} else {
			if (action.channel_private === 1) {
				return false;
			}
			thunkAPI.dispatch(
				channelsActions.add({
					clanId: action.clan_id as string,
					channel: { ...action, active: 1, id: action.channel_id, type: action.channel_type }
				})
			);
			if (action.channel_type === ChannelType.CHANNEL_TYPE_CHANNEL) {
				thunkAPI.dispatch(
					listChannelRenderAction.addChannelToListRender({
						type: action.channel_type,
						...action
					})
				);
			}
			if (action.channel_type === ChannelType.CHANNEL_TYPE_THREAD) {
				const thread: ChannelsEntity = {
					...action,
					id: action.channel_id
				};
				thunkAPI.dispatch(listChannelRenderAction.addThreadToListRender({ clanId: action.clan_id, channel: thread }));
			}
			return false;
		}
		return false;
	}
);

export const initialChannelsState: ChannelsState = {
	byClans: {},
	loadingStatus: 'not loaded',
	socketStatus: 'not loaded',
	scrollPosition: {},
	error: null,
	showScrollDownButton: {}
};

export const channelsSlice = createSlice({
	name: CHANNELS_FEATURE_KEY,
	initialState: initialChannelsState,
	reducers: {
		updateChannelPrivateState: (state: ChannelsState, action: PayloadAction<{ clanId: string; channelId: string; channelPrivate: number }>) => {
			const { clanId, channelId, channelPrivate } = action.payload;
			if (!state.byClans[clanId]) {
				state.byClans[clanId] = getInitialClanState();
			}
			channelsAdapter.updateOne(state.byClans[clanId].entities, {
				id: channelId,
				changes: {
					channel_private: channelPrivate
				}
			});
		},
		add: (state: ChannelsState, action: PayloadAction<{ clanId: string; channel: ChannelsEntity }>) => {
			const { clanId, channel } = action.payload;
			if (!state.byClans[clanId]) {
				state.byClans[clanId] = getInitialClanState();
			}
			channelMetaActions.add(extractChannelMeta(channel));
			channelsAdapter.addOne(state.byClans[clanId].entities, channel);
		},

		removeAll: (state, action: PayloadAction<string>) => {
			if (state.byClans[action.payload]) {
				channelsAdapter.removeAll(state.byClans[action.payload].entities);
			}
		},

		remove: (state, action: PayloadAction<{ clanId: string; channelId: string }>) => {
			const { clanId, channelId } = action.payload;
			if (state.byClans[clanId]) {
				channelsAdapter.removeOne(state.byClans[clanId].entities, channelId);
			}
		},

		removeByCategory: (state, action: PayloadAction<{ clanId: string; categoryId: string }>) => {
			const { clanId, categoryId } = action.payload;
			const clanState = state.byClans[clanId];
			if (!clanState) return;
			const entityState = clanState.entities;
			const idsToRemove = (entityState.ids as string[]).filter((id) => {
				const entity = entityState.entities[id];
				return (entity?.category_id as string) === categoryId;
			});
			if (idsToRemove.length > 0) {
				channelsAdapter.removeMany(entityState, idsToRemove);
			}
		},

		update: (state, action: PayloadAction<{ clanId: string; update: Update<ChannelsEntity, string> }>) => {
			const { clanId, update } = action.payload;
			if (!state.byClans[clanId]) {
				state.byClans[clanId] = getInitialClanState();
			}
			//For the case: There is no changes in channel label
			if (!update?.changes?.channel_label) {
				const newUpdateValue: Update<ChannelsEntity, string> = {
					id: update.id,
					changes: {
						...update.changes,
						channel_label: state.byClans[clanId].entities?.entities?.[update.id]?.channel_label
					}
				};
				channelsAdapter.updateOne(state.byClans[clanId].entities, newUpdateValue);
				return;
			}

			if (state.byClans[clanId]) {
				channelsAdapter.updateOne(state.byClans[clanId].entities, update);
			}
		},

		upsertOne: (state: ChannelsState, action: PayloadAction<{ clanId: string; channel: ChannelsEntity }>) => {
			const { clanId, channel } = action.payload;
			if (!state.byClans[clanId]) {
				state.byClans[clanId] = getInitialClanState();
			}
			const existingEntity = state.byClans[clanId].entities.entities[channel.id];
			if (
				!existingEntity ||
				!isEqual(
					{
						...existingEntity,
						last_seen_message: { ...existingEntity.last_seen_message },
						last_sent_message: { ...existingEntity.last_sent_message }
					},
					channel
				)
			) {
				channelsAdapter.upsertOne(state.byClans[clanId].entities, channel);
			}
		},

		removeByChannelID: (state, action: PayloadAction<{ clanId: string; channelId: string }>) => {
			const { clanId, channelId } = action.payload;
			if (state.byClans[clanId]) {
				channelsAdapter.removeOne(state.byClans[clanId].entities, channelId);
			}
		},
		setModeResponsive: (state, action: PayloadAction<{ clanId: string; mode: ModeResponsive }>) => {
			const { clanId, mode } = action.payload;
			if (!state.byClans[clanId]) {
				state.byClans[clanId] = getInitialClanState();
			}
			state.byClans[clanId].modeResponsive = mode;
		},
		setCurrentChannelId: (state, action: PayloadAction<{ clanId: string; channelId: string }>) => {
			const { clanId, channelId } = action.payload;
			if (!state.byClans[clanId]) {
				state.byClans[clanId] = getInitialClanState();
			}
			state.byClans[clanId].currentChannelId = channelId;
		},

		setSelectedChannelId: (state, action: PayloadAction<{ clanId: string; channelId: string }>) => {
			const { clanId, channelId } = action.payload;
			if (!state.byClans[clanId]) {
				state.byClans[clanId] = getInitialClanState();
			}
			state.byClans[clanId].selectedChannelId = channelId;
		},

		setCurrentVoiceChannelId: (state, action: PayloadAction<{ clanId: string; channelId: string }>) => {
			const { clanId, channelId } = action.payload;
			if (!state.byClans[clanId]) {
				state.byClans[clanId] = getInitialClanState();
			}
			state.byClans[clanId].currentVoiceChannelId = channelId;
		},

		openCreateNewModalChannel: (state, action: PayloadAction<{ clanId: string; isOpen: boolean }>) => {
			const { clanId, isOpen } = action.payload;
			if (!state.byClans[clanId]) {
				state.byClans[clanId] = getInitialClanState();
			}
			state.byClans[clanId].isOpenCreateNewChannel = isOpen;
		},

		setCurrentCategory: (state, action: PayloadAction<{ clanId: string; category: ICategory }>) => {
			const { clanId, category } = action.payload;
			if (!state.byClans[clanId]) {
				state.byClans[clanId] = getInitialClanState();
			}
			state.byClans[clanId].currentCategory = category;
		},
		createChannelSocket: (state, action: PayloadAction<ChannelCreatedEvent>) => {
			const payload = action.payload;
			const clanId = payload.clan_id;
			if (!state.byClans[clanId]) {
				state.byClans[clanId] = getInitialClanState();
			}
			if (payload.parent_id !== '0' && payload.channel_private !== 1) {
				const channel = mapChannelToEntity({
					...payload,
					type: payload.channel_type,
					active: 1
				});
				channelsAdapter.addOne(state.byClans[clanId].entities, channel);
			} else if (payload.parent_id === '0' && payload.channel_private !== 1) {
				const channel = mapChannelToEntity({
					...payload,
					type: payload.channel_type
				});
				channelsAdapter.addOne(state.byClans[clanId].entities, channel);
				// if type app update to => appChannelList
				if (payload.channel_type === ChannelType.CHANNEL_TYPE_APP) {
					const appMapped = mapChannelToAppEntity(payload);
					if (!state.byClans[clanId].appChannelsList) {
						state.byClans[clanId].appChannelsList = {};
					}
					state.byClans[clanId].appChannelsList[appMapped.channel_id as string] = appMapped;
				}
			}
		},

		deleteChannelSocket: (state, action: PayloadAction<ChannelDeletedEvent>) => {
			const payload = action.payload;
			const clanId = payload.clan_id;

			if (state.byClans[clanId]) {
				channelsAdapter.removeOne(state.byClans[clanId].entities, payload.channel_id);
			}
		},

		updateChannelSocket: (state, action: PayloadAction<ChannelUpdatedEvent>) => {
			const payload = action.payload;
			const clanId = payload.clan_id;

			if (state.byClans[clanId]) {
				channelsAdapter.updateOne(state.byClans[clanId].entities, {
					id: payload.channel_id,
					changes: {
						...action.payload
					}
				});
			}
		},

		setStatusChannelFetch: (state, action: PayloadAction<string>) => {
			const clanId = action.payload;
			if (state.byClans[clanId]) {
				state.byClans[clanId].fetchChannelSuccess = false;
			}
		},

		setIdChannelSelected: (state, action: PayloadAction<{ clanId: string; channelId: string }>) => {
			const { clanId, channelId } = action.payload;
			if (clanId && channelId) {
				if (!state.byClans[clanId]) {
					state.byClans[clanId] = getInitialClanState();
				}
				state.byClans[clanId].idChannelSelected[clanId] = channelId;
				const rememberChannel = JSON.parse(localStorage.getItem('remember_channel') || '{}');
				rememberChannel[clanId] = channelId;
				localStorage.setItem('remember_channel', JSON.stringify(rememberChannel));
			}
		},

		removeRememberChannel: (state, action: PayloadAction<{ clanId: string }>) => {
			const { clanId } = action.payload;
			if (state.byClans[clanId]) {
				delete state.byClans[clanId].idChannelSelected[clanId];
				localStorage.setItem('remember_channel', JSON.stringify(state.byClans[clanId].idChannelSelected));
			}
		},

		setPreviousChannels: (state: ChannelsState, action: PayloadAction<{ clanId: string; channelId: string }>) => {
			const { clanId, channelId } = action.payload;
			if (!state.byClans[clanId]) return;

			state.byClans[clanId].previousChannels = [{ clanId, channelId }, ...(state.byClans[clanId].previousChannels || []).slice(0, 4)];
		},

		updateChannelBadgeCount: (
			state: ChannelsState,
			action: PayloadAction<{ clanId: string; channelId: string; count: number; isReset?: boolean }>
		) => {
			const { clanId, channelId, count, isReset = false } = action.payload;
			if (!state.byClans[clanId]) return;
			const entity = state.byClans[clanId].entities.entities[channelId];
			if (!entity) return;
			const newCountMessUnread = isReset ? 0 : (entity.count_mess_unread ?? 0) + count;
			const finalCount = Math.max(0, newCountMessUnread);
			if (entity.count_mess_unread === finalCount) return;
			channelsAdapter.updateOne(state.byClans[clanId].entities, {
				id: channelId,
				changes: {
					count_mess_unread: finalCount
				}
			});
		},

		resetChannelsCount: (
			state: ChannelsState,
			action: PayloadAction<{
				clanId: string;
				channelIds: string[];
			}>
		) => {
			const { clanId, channelIds } = action.payload;
			const clanChannels = state.byClans[clanId];

			if (!clanChannels) return;

			const updates = channelIds.reduce<Array<{ id: string; changes: { count_mess_unread: number } }>>((acc, channelId) => {
				const entity = clanChannels.entities.entities[channelId];
				if (!entity || entity.count_mess_unread === 0) return acc;
				acc.push({
					id: channelId,
					changes: {
						count_mess_unread: 0
					}
				});
				return acc;
			}, []);
			if (updates.length > 0) {
				channelsAdapter.updateMany(state.byClans[clanId].entities, updates);
			}
		},

		updateAppChannel: (state, action: PayloadAction<{ clanId: string; channelId: string; changes: Partial<ApiChannelAppResponse> }>) => {
			const { clanId, channelId, changes } = action.payload;
			if (!state.byClans[clanId]) {
				state.byClans[clanId] = getInitialClanState();
			}
			if (state.byClans[clanId].appChannelsList[channelId]) {
				state.byClans[clanId].appChannelsList[channelId] = {
					...state.byClans[clanId].appChannelsList[channelId],
					...changes
				};
			}
		},

		addFavorite: (state, action: PayloadAction<{ clanId: string; channelId: string }>) => {
			const { clanId, channelId } = action.payload;
			if (!state.byClans[clanId]) {
				state.byClans[clanId] = getInitialClanState();
			}
			if (!Array.isArray(state.byClans[clanId].favoriteChannels)) {
				state.byClans[clanId].favoriteChannels = [];
			}
			state.byClans[clanId].favoriteChannels.push(channelId);
		},

		removeFavorite: (state, action: PayloadAction<{ clanId: string; channelId: string }>) => {
			const { clanId, channelId } = action.payload;
			if (state.byClans[clanId]) {
				state.byClans[clanId].favoriteChannels = state.byClans[clanId].favoriteChannels.filter((id) => id !== channelId);
			}
		},

		setBuzzState: (state, action: PayloadAction<{ clanId: string; channelId: string; buzzState: BuzzArgs | null }>) => {
			const { clanId, channelId, buzzState } = action.payload;
			if (!state.byClans[clanId]) {
				state.byClans[clanId] = getInitialClanState();
			}
			state.byClans[clanId].buzzState[channelId] = buzzState;
		},
		setAppChannelsListShowOnPopUp: (
			state,
			action: PayloadAction<{ clanId: string; channelId: string; appChannel: ApiChannelAppResponseExtend }>
		) => {
			const { clanId, channelId, appChannel } = action.payload;

			state.byClans[clanId] = state.byClans[clanId] ?? getInitialClanState();

			if (!Array.isArray(state.byClans[clanId].appChannelsListShowOnPopUp)) {
				state.byClans[clanId].appChannelsListShowOnPopUp = [];
			}

			const appList = state.byClans[clanId].appChannelsListShowOnPopUp;

			const index = appList.findIndex((app) => app.channel_id === channelId);

			if (index !== -1) {
				appList.splice(index, 1, appChannel);
			} else {
				appList.push(appChannel);
			}

			state.byClans[clanId].appFocused = { [channelId]: appChannel };
		},

		setAppChannelFocus: (state, action: PayloadAction<{ app: ApiChannelAppResponseExtend }>) => {
			const clanId = action.payload.app.clan_id as string;
			const channelId = action.payload.app.channel_id as string;
			if (!state.byClans[clanId]) {
				state.byClans[clanId] = getInitialClanState();
			}

			state.byClans[clanId].appFocused = { [channelId]: action.payload.app };
		},

		removeAppChannelsListShowOnPopUp: (state, action: PayloadAction<{ clanId: string; channelId: string }>) => {
			const { clanId, channelId } = action.payload;
			const clanState = state.byClans[clanId];

			if (!clanState || !Array.isArray(clanState.appChannelsListShowOnPopUp)) return;

			const appList = clanState.appChannelsListShowOnPopUp;
			const index = appList.findIndex((app) => app.channel_id === channelId);

			if (index === -1) return;

			const focusCandidates = index === 0 ? [appList[1]] : [appList[index - 1], appList[index]].filter(Boolean);

			appList.splice(index, 1);

			if (appList.length > 0 && focusCandidates.length > 0) {
				const newFocusApp = focusCandidates[0];
				clanState.appFocused = { [newFocusApp.channel_id as string]: { ...newFocusApp, isBlank: false } };
			} else {
				clanState.appFocused = {};
			}
		},

		replaceAppChannelsListShowOnPopUp: (
			state,
			action: PayloadAction<{ clanId: string; channelId: string; newApp: ApiChannelAppResponseExtend }>
		) => {
			const { clanId, channelId, newApp } = action.payload;

			if (!state.byClans[clanId]) {
				state.byClans[clanId] = getInitialClanState();
			}

			if (!Array.isArray(state.byClans[clanId].appChannelsListShowOnPopUp)) {
				state.byClans[clanId].appChannelsListShowOnPopUp = [];
			}

			const appList = state.byClans[clanId].appChannelsListShowOnPopUp;
			const index = appList.findIndex((app) => app.channel_id === channelId);

			if (index !== -1) {
				appList[index] = newApp;
			} else {
				appList.push(newApp);
			}
			state.byClans[clanId].appFocused = { [newApp.channel_id as string]: newApp };
		},
		resetAppChannelsListShowOnPopUp: (state, action: PayloadAction<{ clanId: string }>) => {
			const { clanId } = action.payload;

			if (!state.byClans[clanId]) {
				return;
			}

			state.byClans[clanId].appChannelsListShowOnPopUp = [];
		},
		clearAllAppChannelsListShowOnPopUp: (state) => {
			Object.keys(state.byClans).forEach((clanId) => {
				if (state.byClans[clanId]) {
					state.byClans[clanId].appChannelsListShowOnPopUp = [];
					state.byClans[clanId].appFocused = {};
				}
			});
		},
		setShowPinBadgeOfChannel: (state, action: PayloadAction<{ clanId: string; channelId: string; isShow: boolean }>) => {
			const { clanId, channelId, isShow } = action.payload;
			if (!state.byClans[clanId]) {
				state.byClans[clanId] = getInitialClanState();
			}
			if (!state.byClans[clanId].entities.entities?.[channelId]) return;
			state.byClans[clanId].entities.entities[channelId].showPinBadge = isShow;
		},

		setChannelEntityListByClanId: (state, action: PayloadAction<{ channels: ChannelsEntity[]; clanId: string }>) => {
			const { channels, clanId } = action.payload;
			if (!state.byClans[clanId]) return;
			channelsAdapter.setAll(state.byClans[clanId]?.entities, channels);
		},
		setScrollPosition: (state, action: PayloadAction<{ channelId: string; messageId?: string; offset?: number }>) => {
			const { channelId, messageId, offset } = action.payload;

			if (!state.scrollPosition) {
				state.scrollPosition = {};
			}

			const currentPosition = state.scrollPosition[channelId];
			if (currentPosition?.messageId === messageId && currentPosition?.offset === offset) {
				return;
			}

			state.scrollPosition[channelId] = { messageId, offset };
		},

		clearScrollPosition: (state, action: PayloadAction<{ clanId: string; channelId: string }>) => {
			const { channelId } = action.payload;
			if (state.scrollPosition) {
				delete state.scrollPosition[channelId];
			}
		},

		setScrollDownVisibility: (state, action: PayloadAction<{ channelId: string; isVisible: boolean }>) => {
			const { channelId, isVisible } = action.payload;

			if (!state.showScrollDownButton) {
				state.showScrollDownButton = {};
			}
			if (state.showScrollDownButton[channelId] === isVisible) return;
			state.showScrollDownButton[channelId] = isVisible;
		},
		invalidateCache: (state, action: PayloadAction<{ clanId: string; channelsCache?: CacheMetadata }>) => {
			const { clanId, channelsCache } = action.payload;
			if (!state.byClans[clanId]) {
				state.byClans[clanId] = getInitialClanState();
			}

			state.byClans[clanId].channelsCache = channelsCache;
		},

		bulkDeleteChannels: (state, action: PayloadAction<{ clanId: string; channelIds: string[] }>) => {
			const { clanId, channelIds } = action.payload;
			if (state.byClans[clanId]?.entities) {
				channelsAdapter.removeMany(state.byClans[clanId].entities, channelIds);
			}
		}
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchChannels.pending, (state: ChannelsState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(
				fetchChannels.fulfilled,
				(state: ChannelsState, action: PayloadAction<{ channels: ChannelsEntity[]; clanId: string; fromCache?: boolean }>) => {
					state.loadingStatus = 'loaded';
					state.byClans[action.payload.clanId].fetchChannelSuccess = true;
					if (action.payload.fromCache) return;
					channelsAdapter.setAll(state.byClans[action.payload.clanId].entities, action.payload.channels);
					state.byClans[action.payload.clanId].channelsCache = createCacheMetadata(LIST_CHANNEL_CACHED_TIME);
				}
			)
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
			.addCase(createNewChannel.fulfilled, (state: ChannelsState, action) => {
				state.loadingStatus = 'loaded';
				if (action.payload?.clan_id) {
					state.byClans[action.payload.clan_id].isOpenCreateNewChannel = false;
				}
			})
			.addCase(createNewChannel.rejected, (state: ChannelsState, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			});

		builder
			.addCase(deleteChannel.pending, (state: ChannelsState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(deleteChannel.fulfilled, (state: ChannelsState, action) => {
				state.loadingStatus = 'loaded';
			})
			.addCase(deleteChannel.rejected, (state: ChannelsState, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			});

		builder.addCase(fetchAppChannels.fulfilled, (state: ChannelsState, action) => {
			const clanId = action.meta.arg.clanId;
			if (!state.byClans[clanId]) {
				state.byClans[clanId] = getInitialClanState();
			}
			state.byClans[clanId].appChannelsList = action.payload.reduce<Record<string, ApiChannelAppResponse>>((acc, appChannel) => {
				if (appChannel.channel_id) {
					acc[appChannel.channel_id] = appChannel;
				}
				return acc;
			}, {});
			state.byClans[clanId].appChannelsCache = createCacheMetadata(LIST_CHANNEL_CACHED_TIME);
		});

		builder
			.addCase(fetchListFavoriteChannel.pending, (state) => {
				state.loadingStatus = 'loading';
			})
			.addCase(
				fetchListFavoriteChannel.fulfilled,
				(state, action: PayloadAction<{ channel_ids: string[]; clanId: string; fromCache?: boolean }>) => {
					if (!action?.payload || action.payload?.fromCache) return;
					const { clanId } = action.payload;
					if (!state.byClans[clanId]) {
						state.byClans[clanId] = getInitialClanState();
					}
					state.byClans[clanId].favoriteChannels = action.payload.channel_ids;
					state.byClans[clanId].fetchChannelSuccess = true;
					state.byClans[clanId].favoriteChannelsCache = createCacheMetadata(LIST_CHANNEL_CACHED_TIME);
				}
			)
			.addCase(fetchListFavoriteChannel.rejected, (state, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			})
			.addCase(removeFavoriteChannel.fulfilled, (state, action) => {
				const { clanId, channelId } = action.meta.arg;
				if (state.byClans[clanId]) {
					state.byClans[clanId].favoriteChannels = state.byClans[clanId].favoriteChannels.filter((id) => id !== channelId);
				}
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
	addThreadToChannels,
	addThreadSocket,
	updateChannelBadgeCountAsync,
	changeCategoryOfChannel,
	updateChannelPrivateSocket,
	bulkDeleteChannelSocket
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
const { selectAll } = channelsAdapter.getSelectors();

export const getChannelsState = (rootState: { [CHANNELS_FEATURE_KEY]: ChannelsState }): ChannelsState => rootState[CHANNELS_FEATURE_KEY];

export const selectAllChannels = createSelector(
	[getChannelsState, (state: RootState) => state.clans.currentClanId as string],
	(channelsState, clanId) => {
		return selectAll(channelsState.byClans[clanId]?.entities ?? channelsAdapter.getInitialState());
	}
);

export const selectChannelsEntities = createSelector(
	[getChannelsState, (state: RootState) => state.clans.currentClanId as string],
	(state, clanId) => state.byClans[clanId]?.entities.entities ?? {}
);

export const selectChannelByChannelId = createSelector(
	[selectChannelsEntities, (state, id) => id],
	(channelsEntities, id) => channelsEntities[id] || null
);

export const selectChannelsEntitiesByClanId = createSelector(
	[getChannelsState, (state: RootState, clanId: string) => clanId],
	(state, clanId) => state.byClans[clanId]?.entities.entities ?? {}
);

export const selectChannelByIdAndClanId = createSelector(
	[selectChannelsEntitiesByClanId, (state: RootState, clanId: string, channelId: string) => channelId],
	(channelsEntities, channelId) => channelsEntities[channelId] || null
);

export const selectCurrentChannelId = createSelector(
	[getChannelsState, (state: RootState) => state.clans.currentClanId as string],
	(state, clanId) => state.byClans[clanId]?.currentChannelId
);

export const selectSelectedChannelId = createSelector(
	[getChannelsState, (state: RootState) => state.clans.currentClanId as string],
	(state, clanId) => state.byClans[clanId]?.selectedChannelId
);

export const selectModeResponsive = createSelector(
	[getChannelsState, (state: RootState) => state.clans.currentClanId as string],
	(state, clanId) => state.byClans[clanId]?.modeResponsive
);

export const selectCurrentVoiceChannelId = createSelector(
	[getChannelsState, (state: RootState) => state.clans.currentClanId as string],
	(state, clanId) => state.byClans[clanId]?.currentVoiceChannelId
);

export const selectChannelById = createSelector(
	[selectChannelsEntities, selectEntitiesChannelsByUser, (state, id: string) => id],
	(channelsEntities, userChannels, id) => {
		return channelsEntities[id] || userChannels[id] || null;
	}
);

export const selectCurrentChannel = createSelector(
	selectChannelsEntities,
	selectCurrentChannelId,
	selectEntitiesChannelsByUser,
	(channels, channelId, userChannels) => {
		if (!channelId) return null;
		return channels[channelId] || userChannels[channelId] || null;
	}
);

export const selectCurrentChannelType = createSelector(selectCurrentChannel, (channel) => channel?.type);
export const selectCurrentChannelClanId = createSelector(selectCurrentChannel, (channel) => channel?.clan_id);
export const selectCurrentChannelPrivate = createSelector(selectCurrentChannel, (channel) => channel?.channel_private);
export const selectCurrentChannelParentId = createSelector(selectCurrentChannel, (channel) => channel?.parent_id);
export const selectCurrentChannelCategoryId = createSelector(selectCurrentChannel, (channel) => channel?.category_id);
export const selectCurrentChannelLabel = createSelector(selectCurrentChannel, (channel) => channel?.channel_label);
export const selectCurrentChannelMeetingCode = createSelector(selectCurrentChannel, (channel) => channel?.meeting_code);
export const selectCurrentChannelChannelId = createSelector(selectCurrentChannel, (channel) => channel?.channel_id);
export const selectCurrentChannelCountMessUnread = createSelector(selectCurrentChannel, (channel) => channel?.count_mess_unread);
export const selectCurrentChannelAgeRestricted = createSelector(selectCurrentChannel, (channel) => channel?.age_restricted);
export const selectCurrentChannelCreatorId = createSelector(selectCurrentChannel, (channel) => channel?.creator_id);

export const selectSelectedChannel = createSelector(selectChannelsEntities, selectSelectedChannelId, (clansEntities, clanId) =>
	clanId ? clansEntities[clanId] : null
);

export const selectClanId = () => createSelector(selectCurrentChannel, (channel) => channel?.clan_id);

export const selectCurrentVoiceChannel = createSelector(selectChannelsEntities, selectCurrentVoiceChannelId, (clansEntities, clanId) =>
	clanId ? clansEntities[clanId] : null
);

export const selectVoiceChannelAll = createSelector(selectAllChannels, (channels) =>
	channels.filter((channel) => channel.type === ChannelType.CHANNEL_TYPE_MEZON_VOICE)
);
export const selectAllTextChannel = createSelector(selectAllChannels, (channels) =>
	channels.filter(
		(channel) =>
			(channel?.type === ChannelType.CHANNEL_TYPE_CHANNEL && channel.channel_private) ||
			(channel?.type === ChannelType.CHANNEL_TYPE_THREAD && channel.channel_private)
	)
);

export const selectChannelFirst = createSelector(selectAllChannels, (channels) => channels[0]);

export const selectChannelSecond = createSelector(selectAllChannels, (channels) => channels[1]);

export const selectChannelsByClanId = createSelector([getChannelsState, (state: RootState, clanId: string) => clanId], (state, clanId) => {
	return selectAll(state.byClans[clanId]?.entities ?? channelsAdapter.getInitialState());
});

export const selectDefaultChannelIdByClanId = createSelector(
	[selectAllChannels, (state: RootState, clanId: string) => clanId],
	(channels, clanId) => {
		const defaultChannel = channels.find((channel) => channel.parent_id === '0' && channel.type === ChannelType.CHANNEL_TYPE_CHANNEL);
		return defaultChannel ? defaultChannel.id : null;
	}
);

export const selectAllIdChannelSelected = createSelector(
	[getChannelsState, (state: RootState) => state.clans.currentClanId as string],
	(state, clanId) => state.byClans[clanId]?.idChannelSelected ?? {}
);

export const selectAllChannelsFavorite = createSelector(
	[getChannelsState, (state: RootState) => state.clans.currentClanId as string],
	(state, clanId) => state.byClans[clanId]?.favoriteChannels ?? []
);

export const selectPreviousChannels = createSelector(
	[getChannelsState, (state: RootState) => state.clans.currentClanId as string],
	(state, clanId) => state.byClans[clanId]?.previousChannels ?? []
);

export const selectAppChannelById = createSelector(
	[getChannelsState, (state: RootState) => state.clans.currentClanId as string, (_: RootState, channelId: string) => channelId],
	(state, clanId, channelId) => state.byClans[clanId]?.appChannelsList[channelId]
);

export const selectFetchChannelStatus = createSelector(
	[getChannelsState, (state: RootState) => state.clans.currentClanId as string],
	(state, clanId) => state.byClans[clanId]?.fetchChannelSuccess ?? false
);

export const selectIsShowPinBadgeByChannelId = (channelId: string) =>
	createSelector(
		[getChannelsState, (state: RootState) => state.clans.currentClanId as string],
		(state, clanId) => state.byClans[clanId]?.entities.entities[channelId]?.showPinBadge
	);

export const selectAnyUnreadChannels = createSelector(
	[getChannelsState, selectEntiteschannelCategorySetting, (state: RootState) => state.clans.currentClanId as string],
	(state, settings, clanId) => {
		const entities = state.byClans[clanId]?.entities;
		if (!entities) return false;

		for (const id of entities.ids) {
			const channel = entities.entities[id];
			if (settings?.[channel?.id]?.action === enableMute) continue;
			if (channel?.count_mess_unread) return true;
		}
		return false;
	}
);

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
	const threadsByParentId = new Map<string, ChannelsEntity[]>();

	const parentChannels: ChannelsEntity[] = [];

	for (const channel of channels) {
		const parentId = channel.parent_id;

		if (parentId === '0' || parentId === '') {
			parentChannels.push(channel);
		} else {
			const threads = threadsByParentId.get(parentId as string) || [];
			threads.push(channel);
			threadsByParentId.set(parentId as string, threads);
		}
	}

	return parentChannels.flatMap((channel) => [channel, ...(threadsByParentId.get(channel.channel_id as string) || [])]) as ChannelThreads[];
});

export const selectBuzzStateByChannelId = createSelector(
	[getChannelsState, (state: RootState) => state.clans.currentClanId as string, (state, channelId: string) => channelId],
	(state, clanId, channelId) => state.byClans[clanId]?.buzzState[channelId]
);

export const selectLoadingStatus = createSelector([getChannelsState], (state) => state.loadingStatus);

export const selectIsOpenCreateNewChannel = createSelector(
	[getChannelsState, (state: RootState) => state.clans.currentClanId as string],
	(state, clanId) => state.byClans[clanId]?.isOpenCreateNewChannel ?? false
);

export const selectCurrentCategory = createSelector(
	[getChannelsState, (state: RootState) => state.clans.currentClanId as string],
	(state, clanId) => state.byClans[clanId]?.currentCategory
);

export const selectAppChannelsListShowOnPopUp = createSelector(
	[getChannelsState, (state: RootState) => state.clans.currentClanId as string],
	(state, clanId) => Object.values(state.byClans[clanId]?.appChannelsListShowOnPopUp || [])
);

export const selectCheckAppFocused = createSelector(
	[getChannelsState, (state: RootState) => state.clans.currentClanId as string, (_: RootState, channelId: string) => channelId],
	(state, clanId, channelId) => Boolean(state.byClans[clanId]?.appFocused?.[channelId])
);

export const selectAppChannelsKeysShowOnPopUp = createSelector(
	[getChannelsState, (state: RootState) => state.clans.currentClanId as string],
	(state, clanId) => {
		if (!state.byClans[clanId]) {
			return [];
		}
		const appChannelsList = state.byClans[clanId].appChannelsListShowOnPopUp;
		if (!Array.isArray(appChannelsList) || appChannelsList.length === 0) {
			return [];
		}
		return appChannelsList.map((app) => app.channel_id);
	}
);

export const selectToCheckAppIsOpening = createSelector(
	[selectAppChannelsKeysShowOnPopUp, (state: RootState, channelId: string) => channelId],
	(keys, channelId) => keys.includes(channelId)
);

export const selectAppChannelsList = createSelector([getChannelsState, (state: RootState) => state.clans.currentClanId as string], (state, clanId) =>
	Object.values(state.byClans[clanId]?.appChannelsList || {})
);

export const selectAppFocusedChannel = createSelector(
	[getChannelsState, (state: RootState) => state.clans.currentClanId as string],
	(state, clanId) => {
		const focusedApps = Object.values(state.byClans[clanId]?.appFocused || {});
		return focusedApps.length > 0 ? focusedApps[0] : null;
	}
);

export const selectScrollPositionByChannelId = createSelector(
	[getChannelsState, (state, channelId) => channelId],
	(state, channelId) => state.scrollPosition?.[channelId] ?? null
);

export const selectShowScrollDownButton = createSelector(
	[getChannelsState, (state, channelId) => channelId],
	(state, channelId) => state.showScrollDownButton?.[channelId] ?? false
);

export const selectAllAppChannelsListShowOnPopUp = createSelector(getChannelsState, (state) => {
	const data = Object.values(state.byClans).flatMap((clan) => clan.appChannelsListShowOnPopUp);
	return data?.length ? data : null;
});
