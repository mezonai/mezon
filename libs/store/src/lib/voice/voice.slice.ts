import { captureSentryError } from '@mezon/logger';
import { INITIAL_NOISE_SUPPRESSION_PERCENTAGE, LENGHT_USER_ID, type IvoiceInfo, type LoadingStatus } from '@mezon/utils';
import type { EntityState, PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import type { ApiGenerateMeetTokenResponse, ApiVoiceChannelUser, ChannelType, VoiceLeavedEvent } from 'mezon-js';
import type { ScreenShareEvent } from 'node_modules/mezon-js-protobuf/dist/rtapi/realtime';
import { selectCurrentUserId } from '../account/account.slice';
import type { CacheMetadata } from '../cache-metadata';
import { createApiKey, createCacheMetadata, markApiFirstCalled, shouldForceApiCall } from '../cache-metadata';
import { selectCurrentChannelId } from '../channels/channels.slice';
import { selectCurrentClanId } from '../clans/clans.slice';
import type { MezonValueContext } from '../helpers';
import { ensureClientAsync, ensureSession, fetchDataWithSocketFallback, getMezonCtx } from '../helpers';
import type { RootState } from '../store';

export const VOICE_FEATURE_KEY = 'voice';

/*
 * Update these interfaces according to your requirements.
 */
export interface VoiceEntity extends ApiVoiceChannelUser {
	id: string; // Primary ID
}

export enum EVoiceInteractEvent {
	SENT_FLOWERS = 1
}
export enum EInvoice {
	INVOICE,
	SHARING_SCREEN
}

export enum EVoiceInteractEvent {
	RECORDING = 2,
	APP_QUIZ = 10,
	APP_BLACKBOARD = 11,
	APP_INTERACTIVE = 12
}

enum E_APP_INTERACTIVE_KEY {
	Interactive = '2089273739668623360',
	Blackboard = '2089294331818020864',
	Quiz = '2089257413122199552'
}

export const VOICE_INTERACTIVE_APPS = [
	{
		key: E_APP_INTERACTIVE_KEY.Quiz,
		eventType: EVoiceInteractEvent.APP_QUIZ,
		name: 'Quiz',
		url: 'https://test-sfu.nccsoft.vn'
	},
	{
		key: E_APP_INTERACTIVE_KEY.Blackboard,
		eventType: EVoiceInteractEvent.APP_BLACKBOARD,
		name: 'Blackboard',
		url: 'https://blackboard.mezon.ai'
	},
	{
		key: E_APP_INTERACTIVE_KEY.Interactive,
		eventType: EVoiceInteractEvent.APP_INTERACTIVE,
		name: 'Interactive',
		url: 'https://interactive.mezon.ai'
	}
];

export interface InVoiceInfor {
	clanId: string;
	channelId: string;
	status: EInvoice;
}

export interface VoiceUserData {
	user_id: string;
	user_name: string;
	user_avatar: string;
}

export const UsersInVoiceAdapter = createEntityAdapter({
	selectId: (user: VoiceUserData) => user.user_id
});

export type VoiceRecordingStatus = 'idle' | 'starting' | 'recording' | 'stopping' | 'error';

export interface VoiceRecordingState {
	status: VoiceRecordingStatus;
	startedAt: number | null;
	/** Hard stop time when chunks are buffered in RAM instead of streamed to disk. */
	deadlineAt: number | null;
	streamingToDisk: boolean;
	pipeline: 'worker' | 'canvas' | 'none';
	/** Set when the tab went hidden mid-recording on the canvas fallback. */
	degraded: boolean;
	error: string | null;
}

export interface VoiceState {
	voiceInfo: IvoiceInfo | null;
	loadingStatus: LoadingStatus;
	error?: string | null;
	showMicrophone: boolean;
	showCamera: boolean;
	showScreen: boolean;
	noiseSuppressionEnabled: boolean;
	noiseSuppressionLevel: number;
	statusCall: boolean;
	voiceConnectionState: boolean;
	fullScreen?: boolean;
	isJoined: boolean;
	isGroupCallJoined: boolean;
	token: string;
	stream: MediaStream | null | undefined;
	externalToken: string | undefined;
	guestUserId: string | undefined;
	guestAccessToken: string | undefined;
	joinCallExtStatus: LoadingStatus;
	isPiPMode?: boolean;
	openPopOut?: boolean;
	openChatBox?: boolean;
	externalGroup?: boolean;
	listInVoiceStatus: Record<string, InVoiceInfor>;
	cache?: CacheMetadata;
	contextMenu: {
		openedParticipantId: string | null;
		position: { x: number; y: number };
	} | null;
	listVoiceMemberByClan: Record<string, Record<string, EntityState<VoiceUserData, string>>>;
	recording: VoiceRecordingState;
}

type fetchVoiceChannelMembersPayload = {
	clanId: string;
	channelId: string;
	channelType: ChannelType;
	noCache?: boolean;
};

export type FetchVoiceChannelMembersResponse = {
	users: ApiVoiceChannelUser[];
	clanId: string;
	channelId: string;
	fromCache?: boolean;
};

export interface ApiGenerateMeetTokenResponseExtend extends ApiGenerateMeetTokenResponse {
	guest_user_id?: string;
	guest_access_token?: string;
}

const selectCachedVoiceMembers = createSelector(
	[(state: RootState) => state[VOICE_FEATURE_KEY], (_, clan_id: string) => clan_id, (_, __, channel_id: string) => channel_id],
	(voiceState, clan_id, channel_id) => {
		return voiceState.listVoiceMemberByClan[clan_id][channel_id];
	}
);

export const fetchVoiceChannelMembersCached = async (
	getState: () => RootState,
	ensuredMezon: MezonValueContext,
	clanId: string,
	channelId: string,
	channelType: ChannelType,
	noCache = false
) => {
	const state = getState();
	const voiceState = state[VOICE_FEATURE_KEY];
	const apiKey = createApiKey('fetchVoiceChannelMembers', clanId, 'voice_user_list');
	const shouldForceCall = shouldForceApiCall(apiKey, voiceState?.cache, noCache);

	if (!shouldForceCall) {
		return {
			fromCache: true
		};
	}

	const response = await fetchDataWithSocketFallback(
		ensuredMezon,
		{
			api_name: 'ListChannelVoiceUsers',
			list_channel_users_req: {
				limit: 100,
				state: 1,
				channel_type: channelType,
				clan_id: clanId
			}
		},
		(session) => ensuredMezon.client.listChannelVoiceUsers(session, clanId || '0'),
		'voice_user_list'
	);

	markApiFirstCalled(apiKey);

	return {
		...response,
		fromCache: false
	};
};

export const fetchVoiceChannelMembers = createAsyncThunk(
	'voice/fetchVoiceChannelMembers',
	async ({ clanId, channelId, channelType, noCache }: fetchVoiceChannelMembersPayload, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const response = await fetchVoiceChannelMembersCached(
				thunkAPI.getState as () => RootState,
				mezon,
				clanId,
				channelId,
				channelType,
				noCache
			);

			if (!response.voice_channel_users) {
				return { users: [] as ApiVoiceChannelUser[], clanId, channelId };
			}

			const payload: FetchVoiceChannelMembersResponse = {
				users: response.voice_channel_users,
				channelId,
				clanId,
				fromCache: response.fromCache
			};

			return payload;
		} catch (error) {
			captureSentryError(error, 'voice/fetchVoiceChannelMembers');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const sendVoiceInteractiveEvent = createAsyncThunk(
	'voice/sendVoiceInteractiveEvent',
	async ({ event_type, clan_id, channel_id }: { event_type: EVoiceInteractEvent; clan_id: string; channel_id: string }, thunkAPI) => {
		try {
			const mezon = await ensureClientAsync(getMezonCtx(thunkAPI));
			const state = thunkAPI.getState() as RootState;
			const sender_id = selectCurrentUserId(state);
			const response = await mezon.client.writeVoiceInteractiveEvent(mezon.session, clan_id, channel_id, sender_id, sender_id, event_type, '');
			return response;
		} catch (error) {
			captureSentryError(error, 'voice/sendVoiceInteractiveEvent');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const generateMeetTokenExternal = createAsyncThunk(
	'meet/generateMeetTokenExternal',
	async ({ token, username, metadata, isGuest }: { token: string; username?: string; metadata?: string; isGuest?: boolean }, thunkAPI) => {
		try {
			const mezon = await ensureClientAsync(getMezonCtx(thunkAPI));
			const response = await mezon.client.generateMeetTokenExternal(token, username, metadata, isGuest);
			return response;
		} catch (error) {
			captureSentryError(error, 'meet/generateMeetTokenExternal');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const kickVoiceMember = createAsyncThunk(
	'meet/kickVoiceMember',
	async ({ room_name, username }: { room_name?: string; username?: string }, thunkAPI) => {
		try {
			const mezon = await ensureClientAsync(getMezonCtx(thunkAPI));
			const state = thunkAPI.getState() as RootState;
			const voiceInfor = selectVoiceInfo(state);
			const response = await mezon.client.removeMezonMeetParticipant(mezon.session, {
				clan_id: voiceInfor?.clanId as string,
				channel_id: voiceInfor?.channelId,
				room_name,
				username: username as string
			});
			return response;
		} catch (error) {
			captureSentryError(error, 'meet/generateMeetTokenExternal');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const muteVoiceMember = createAsyncThunk(
	'meet/muteVoiceMember',
	async ({ room_name, username }: { room_name?: string; username?: string }, thunkAPI) => {
		try {
			const mezon = await ensureClientAsync(getMezonCtx(thunkAPI));
			const state = thunkAPI.getState() as RootState;
			const voiceInfor = selectVoiceInfo(state);
			const response = await mezon.client.muteMezonMeetParticipant(mezon.session, {
				clan_id: voiceInfor?.clanId as string,
				channel_id: voiceInfor?.channelId,
				room_name,
				username: username as string
			});
			return response;
		} catch (error) {
			captureSentryError(error, 'meet/generateMeetTokenExternal');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const giveFlowers = createAsyncThunk('meet/giveFlowers', async ({ receiver_id }: { receiver_id: string }, thunkAPI) => {
	try {
		const mezon = await ensureClientAsync(getMezonCtx(thunkAPI));
		const state = thunkAPI.getState() as RootState;
		const voiceInfor = selectVoiceInfo(state);
		const sender_id = selectCurrentUserId(state);
		const response = await mezon.client.writeVoiceInteractiveEvent(
			mezon.session,
			voiceInfor?.clanId as string,
			voiceInfor?.channelId as string,
			sender_id,
			receiver_id,
			EVoiceInteractEvent.SENT_FLOWERS,
			''
		);

		return response;
	} catch (error) {
		captureSentryError(error, 'meet/generateMeetTokenExternal');
		return thunkAPI.rejectWithValue(error);
	}
});

export const initialVoiceState: VoiceState = {
	loadingStatus: 'not loaded',
	error: null,
	voiceInfo: null,
	showMicrophone: false,
	showCamera: false,
	showScreen: false,
	noiseSuppressionEnabled: false,
	noiseSuppressionLevel: INITIAL_NOISE_SUPPRESSION_PERCENTAGE,
	statusCall: false,
	voiceConnectionState: false,
	fullScreen: false,
	isJoined: false,
	isGroupCallJoined: false,
	token: '',
	stream: null,
	externalToken: undefined,
	guestUserId: undefined,
	guestAccessToken: undefined,
	joinCallExtStatus: 'not loaded',
	isPiPMode: false,
	openPopOut: false,
	openChatBox: false,
	externalGroup: false,
	listInVoiceStatus: {},
	contextMenu: null,
	listVoiceMemberByClan: {},
	recording: {
		status: 'idle',
		startedAt: null,
		deadlineAt: null,
		streamingToDisk: false,
		pipeline: 'none',
		degraded: false,
		error: null
	}
};

export const voiceSlice = createSlice({
	name: VOICE_FEATURE_KEY,
	initialState: initialVoiceState,
	reducers: {
		add: (state, action: PayloadAction<{ clan_id: string; channel_id: string; user_id: string; user_name: string; user_avatar: string }>) => {
			const { clan_id, channel_id, user_id, user_name, user_avatar } = action.payload;
			if (!state.listVoiceMemberByClan[clan_id]) {
				state.listVoiceMemberByClan[clan_id] = {};
			}
			const entities = state.listVoiceMemberByClan[clan_id][channel_id];
			if (entities) {
				const duplicateEntry = UsersInVoiceAdapter.getSelectors().selectById(entities, user_id);
				if (duplicateEntry) {
					state.listVoiceMemberByClan[clan_id][channel_id] = UsersInVoiceAdapter.removeOne(entities, user_id);
				}
			} else {
				state.listVoiceMemberByClan[clan_id][channel_id] = UsersInVoiceAdapter.getInitialState();
			}
			state.listVoiceMemberByClan[clan_id][channel_id] = UsersInVoiceAdapter.addOne(state.listVoiceMemberByClan[clan_id][channel_id], {
				user_id,
				user_name,
				user_avatar
			});
			if (user_id) {
				state.listInVoiceStatus[user_id] = {
					clanId: clan_id,
					channelId: channel_id,
					status: EInvoice.INVOICE
				};
			}
		},
		remove: (state, action: PayloadAction<VoiceLeavedEvent>) => {
			const voice = action.payload;
			const clanState = state.listVoiceMemberByClan[voice.clan_id];
			if (!clanState) return;

			const channalState = clanState[voice.voice_channel_id];
			if (!channalState) return;
			const duplicateEntry = UsersInVoiceAdapter.getSelectors().selectById(channalState, voice.voice_user_id);

			if (duplicateEntry) {
				state.listVoiceMemberByClan[voice.clan_id][voice.voice_channel_id] = UsersInVoiceAdapter.removeOne(channalState, voice.voice_user_id);
				delete state.listInVoiceStatus[voice.voice_user_id];
			}
		},
		removeFromClanInvoice: (state, action: PayloadAction<{ id: string; clanId: string }>) => {
			const userId = action.payload.id;
			const entitiesOfUser = state.listVoiceMemberByClan[action.payload.clanId];

			if (entitiesOfUser) {
				delete state.listInVoiceStatus[userId];
			}
		},
		voiceEnded: (state, action: PayloadAction<{ channelId: string; clanId: string }>) => {
			const { channelId, clanId } = action.payload;
			const clanState = state.listVoiceMemberByClan[clanId];
			if (!clanState) return;
			delete state.listVoiceMemberByClan[clanId][channelId];
		},
		setJoined: (state, action) => {
			state.isJoined = action.payload;
		},
		openVoiceContextMenu: (state, action: PayloadAction<{ participantId: string; position: { x: number; y: number } }>) => {
			state.contextMenu = {
				openedParticipantId: action.payload.participantId,
				position: action.payload.position
			};
		},
		closeVoiceContextMenu: (state) => {
			state.contextMenu = null;
		},
		setGroupCallJoined: (state, action) => {
			state.isGroupCallJoined = action.payload;
		},
		setToken: (state, action) => {
			state.token = action.payload;
		},
		setVoiceInfo: (state, action: PayloadAction<IvoiceInfo>) => {
			if (state.voiceInfo?.channelId !== action.payload.channelId) {
				state.voiceInfo = action.payload;
			}
		},
		setVoiceInfoId: (state, action: PayloadAction<string>) => {
			if (state.voiceInfo) {
				state.voiceInfo = {
					...state.voiceInfo,
					roomId: action.payload
				};
			}
		},
		setShowMicrophone: (state, action: PayloadAction<boolean>) => {
			state.showMicrophone = action.payload;
		},
		setShowCamera: (state, action: PayloadAction<boolean>) => {
			state.showCamera = action.payload;
		},
		setShowScreen: (state, action: PayloadAction<boolean>) => {
			state.showScreen = action.payload;
		},
		setNoiseSuppressionEnabled: (state, action: PayloadAction<boolean>) => {
			state.noiseSuppressionEnabled = action.payload;
		},
		setNoiseSuppressionLevel: (state, action: PayloadAction<number>) => {
			state.noiseSuppressionLevel = action.payload;
		},
		setRecordingState: (state, action: PayloadAction<Partial<VoiceRecordingState>>) => {
			state.recording = { ...state.recording, ...action.payload };
		},
		resetRecordingState: (state) => {
			state.recording = { ...initialVoiceState.recording };
		},
		setStatusCall: (state, action: PayloadAction<boolean>) => {
			state.statusCall = action.payload;
		},
		setVoiceConnectionState: (state, action: PayloadAction<boolean>) => {
			state.voiceConnectionState = action.payload;
		},
		setStreamScreen: (state, action: PayloadAction<MediaStream | null | undefined>) => {
			state.stream = action.payload;
		},
		setFullScreen: (state, action: PayloadAction<boolean>) => {
			state.fullScreen = action.payload;
		},
		resetVoiceControl: (state) => {
			state.showMicrophone = false;
			state.showCamera = false;
			state.showScreen = false;
			state.noiseSuppressionEnabled = false;
			state.noiseSuppressionLevel = INITIAL_NOISE_SUPPRESSION_PERCENTAGE;
			state.voiceConnectionState = false;
			state.voiceInfo = null;
			state.fullScreen = false;
			state.isJoined = false;
			state.isGroupCallJoined = false;
			state.token = '';
			state.stream = null;
			state.openPopOut = false;
		},
		resetExternalCall: (state) => {
			state.showMicrophone = false;
			state.showCamera = false;
			state.showScreen = false;
			state.voiceConnectionState = false;
			state.voiceInfo = null;
			state.fullScreen = false;
			state.isJoined = false;
			state.externalToken = undefined;
			state.stream = null;
			state.joinCallExtStatus = 'not loaded';
		},

		setPiPModeMobile: (state, action) => {
			state.isPiPMode = action.payload;
		},
		setOpenPopOut: (state, action: PayloadAction<boolean>) => {
			state.openPopOut = action.payload;
		},
		setToggleChatBox: (state) => {
			state.openChatBox = !state.openChatBox;
		},
		setExternalGroup: (state) => {
			state.externalGroup = true;
		},
		removeInVoiceInChannel: (state, action: PayloadAction<string>) => {
			const channelId = action.payload;
			for (const key in state.listInVoiceStatus) {
				if (state.listInVoiceStatus[key].channelId === channelId) {
					delete state.listInVoiceStatus[key];
				}
			}
		},
		updateShareStatus: (state, action: PayloadAction<ScreenShareEvent>) => {
			const event = action.payload;
			if (state.listInVoiceStatus[event.user_id]) {
				state.listInVoiceStatus[event.user_id] = {
					...state.listInVoiceStatus[event.user_id],
					status: event.is_sharing ? EInvoice.SHARING_SCREEN : EInvoice.INVOICE
				};
			}
		}
		// ...
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchVoiceChannelMembers.pending, (state: VoiceState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(fetchVoiceChannelMembers.fulfilled, (state: VoiceState, action: PayloadAction<FetchVoiceChannelMembersResponse>) => {
				const { users, clanId, channelId, fromCache } = action.payload;
				state.loadingStatus = 'loaded';

				if (fromCache || !users.length) return;

				if (!state.listVoiceMemberByClan[clanId]) {
					state.listVoiceMemberByClan[clanId] = {};
				}
				if (!state.listInVoiceStatus) {
					state.listInVoiceStatus = {};
				}

				users.forEach((list) => {
					const listUser = list.user_ids;
					const channelId = list.channel_id;
					const listShare = new Set(list.share_screen_ids);

					if (!listUser || !channelId) return;

					const listIdInVoice: VoiceUserData[] = [];
					for (const id of listUser) {
						if (id.length === LENGHT_USER_ID) {
							listIdInVoice.push({
								user_id: id,
								user_avatar: '',
								user_name: ''
							});
							state.listInVoiceStatus[id] = {
								clanId,
								channelId,
								status: list.share_screen_ids?.length && listShare.has(id) ? EInvoice.SHARING_SCREEN : EInvoice.INVOICE
							};
						}
					}
					if (!state.listVoiceMemberByClan[clanId][channelId]) {
						state.listVoiceMemberByClan[clanId][channelId] = UsersInVoiceAdapter.getInitialState();
					}

					state.listVoiceMemberByClan[clanId][channelId] = UsersInVoiceAdapter.setAll(
						state.listVoiceMemberByClan[clanId][channelId],
						listIdInVoice
					);
				});

				state.cache = createCacheMetadata();
			})
			.addCase(fetchVoiceChannelMembers.rejected, (state: VoiceState, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			});
		builder
			.addCase(generateMeetTokenExternal.pending, (state: VoiceState) => {
				state.joinCallExtStatus = 'loading';
			})
			.addCase(generateMeetTokenExternal.fulfilled, (state: VoiceState, action: PayloadAction<ApiGenerateMeetTokenResponseExtend>) => {
				state.externalToken = action.payload.token;
				state.guestAccessToken = action.payload.guest_access_token || undefined;
				state.guestUserId = action.payload.guest_user_id;
				state.joinCallExtStatus = 'loaded';
			})
			.addCase(generateMeetTokenExternal.rejected, (state: VoiceState, action) => {
				state.joinCallExtStatus = 'error';
				state.error = action.error.message;
			});
	}
});

/*
 * Export reducer for store configuration.
 */
export const voiceReducer = voiceSlice.reducer;

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
export const voiceActions = {
	...voiceSlice.actions,
	fetchVoiceChannelMembers,
	sendVoiceInteractiveEvent,
	kickVoiceMember,
	muteVoiceMember,
	giveFlowers
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
export const getVoiceState = (rootState: { [VOICE_FEATURE_KEY]: VoiceState }): VoiceState => rootState[VOICE_FEATURE_KEY];

const { selectAll, selectIds, selectById } = UsersInVoiceAdapter.getSelectors();

export const selectStatusInVoice = createSelector(
	[getVoiceState, (state, userId: string) => userId],
	(state, userId) => state.listInVoiceStatus[userId]
);

export const selectAlreadyInVoice = createSelector(
	[getVoiceState, (state, userId: string) => userId, (_, __, channelId: string) => channelId],
	(state, userId, channelId) => state.listInVoiceStatus[userId].channelId === channelId
);

export const selectVoiceJoined = createSelector(getVoiceState, (state) => state.isJoined);
export const selectGroupCallJoined = createSelector(getVoiceState, (state) => state.isGroupCallJoined);

export const selectTokenJoinVoice = createSelector(getVoiceState, (state) => state.token);

export const selectVoiceInfo = createSelector(getVoiceState, (state) => state.voiceInfo);

export const selectShowMicrophone = createSelector(getVoiceState, (state) => state.showMicrophone);

export const selectShowCamera = createSelector(getVoiceState, (state) => state.showCamera);

export const selectShowScreen = createSelector(getVoiceState, (state) => state.showScreen);

export const selectNoiseSuppressionEnabled = createSelector(getVoiceState, (state) => state.noiseSuppressionEnabled);

export const selectNoiseSuppressionLevel = createSelector(getVoiceState, (state) => state.noiseSuppressionLevel);

export const selectVoiceFullScreen = createSelector(getVoiceState, (state) => state.fullScreen);

const selectChannelId = (_: RootState, channelId: string) => channelId;

export const selectVoiceChannelMembersByChannelId = createSelector(
	[getVoiceState, selectChannelId, (_, __, clanId: string) => clanId],
	(state, channelId, clanId) => {
		if (!clanId || clanId === '0') return [];
		const listByClan = state.listVoiceMemberByClan[clanId];

		if (listByClan && listByClan[channelId]) {
			return selectAll(listByClan[channelId]);
		}
		return [];
	}
);

export const selectUserInvoiceData = createSelector(
	[getVoiceState, (_, userId: string) => userId, selectCurrentChannelId, selectCurrentClanId],
	(state, userId, channelId, clanId) => {
		if (!clanId || clanId === '0' || !channelId) return null;
		const listByClan = state.listVoiceMemberByClan[clanId];

		if (listByClan && listByClan[channelId]) {
			return selectById(listByClan[channelId], userId);
		}
		return null;
	}
);

export const selectNumberMemberVoiceChannel = createSelector([selectVoiceChannelMembersByChannelId], (members) => members.length);

export const selectVoiceContextMenu = createSelector(getVoiceState, (state) => state.contextMenu);

export const selectVoiceRecording = createSelector(getVoiceState, (state) => state.recording);

export const selectIsVoiceRecording = createSelector(
	getVoiceState,
	(state) => state.recording.status === 'recording' || state.recording.status === 'starting'
);
///
export const selectJoinCallExtStatus = createSelector(getVoiceState, (state) => state.joinCallExtStatus);
export const selectExternalToken = createSelector(getVoiceState, (state) => state.externalToken);
export const selectIsPiPMode = createSelector(getVoiceState, (state) => state.isPiPMode);
export const selectVoiceOpenPopOut = createSelector(getVoiceState, (state) => state.openPopOut);
export const selectGuestAccessToken = createSelector(getVoiceState, (state) => state.guestAccessToken);
export const selectGuestUserId = createSelector(getVoiceState, (state) => state.guestUserId);
export const selectOpenExternalChatBox = createSelector(getVoiceState, (state) => state.openChatBox);
