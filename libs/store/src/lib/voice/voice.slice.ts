import { captureSentryError } from '@mezon/logger';
import { LENGHT_USER_ID, type IvoiceInfo, type LoadingStatus } from '@mezon/utils';
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
import { recordingParams, withRecordingUser } from './recordingSignal';
import { addVoicePeer, removeVoicePeer, voicePeersFromSnapshot } from './voicePeerPresence';

export { RECORDING_ANNOUNCE_INTERVAL_MS, RECORDING_INDICATOR_TTL_MS, parseRecordingParams, recordingParams } from './recordingSignal';

export const VOICE_FEATURE_KEY = 'voice';

export interface VoiceEntity extends ApiVoiceChannelUser {
	id: string;
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

const E_APP_INTERACTIVE_KEY = {
	Interactive: process.env.NX_APP_INTERACTIVE,
	Blackboard: process.env.NX_APP_BLACKBOARD,
	Quiz: process.env.NX_APP_QUIZ
};

export const VOICE_INTERACTIVE_APPS = [
	{
		key: E_APP_INTERACTIVE_KEY.Quiz,
		eventType: EVoiceInteractEvent.APP_QUIZ,
		name: 'Quiz',
		url: 'https://quiz.mezon.ai'
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
	peer_ids?: number[];
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
	deadlineAt: number | null;
	streamingToDisk: boolean;
	pipeline: 'worker' | 'canvas' | 'none';
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
	noiseSuppressionReady: boolean;
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
	presenceRevisionByClan: Record<string, number>;
	listInVoiceStatus: Record<string, InVoiceInfor>;
	cache?: CacheMetadata;
	contextMenu: {
		openedParticipantId: string | null;
		position: { x: number; y: number };
	} | null;
	listVoiceMemberByClan: Record<string, Record<string, EntityState<VoiceUserData, string>>>;
	recording: VoiceRecordingState;
	recordingUserIds: string[];
}

type fetchVoiceChannelMembersPayload = {
	clanId: string;
	channelId: string;
	channelType: ChannelType;
	noCache?: boolean;
};

export type FetchVoiceChannelMembersResponse = {
	users: (ApiVoiceChannelUser & { peer_ids?: number[] })[];
	presenceRevision?: number;
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
			for (let attempt = 0; attempt < 3; attempt++) {
				const revision = (thunkAPI.getState() as RootState).voice.presenceRevisionByClan[clanId] ?? 0;
				const response = await fetchVoiceChannelMembersCached(
					thunkAPI.getState as () => RootState,
					mezon,
					clanId,
					channelId,
					channelType,
					noCache || attempt > 0
				);
				if (((thunkAPI.getState() as RootState).voice.presenceRevisionByClan[clanId] ?? 0) !== revision) continue;
				return { users: response.voice_channel_users ?? [], channelId, clanId, fromCache: response.fromCache, presenceRevision: revision };
			}
			throw new Error('Voice presence changed during snapshot refresh');
		} catch (error) {
			captureSentryError(error, 'voice/fetchVoiceChannelMembers');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const sendRecordingState = createAsyncThunk(
	'voice/sendRecordingState',
	async ({ isRecording, clanId, channelId }: { isRecording: boolean; clanId: string; channelId: string }, thunkAPI) => {
		try {
			const mezon = await ensureClientAsync(getMezonCtx(thunkAPI));
			const state = thunkAPI.getState() as RootState;
			const senderId = selectCurrentUserId(state);
			return await mezon.client.writeVoiceInteractiveEvent(
				mezon.session,
				clanId,
				channelId,
				senderId,
				senderId,
				EVoiceInteractEvent.RECORDING,
				recordingParams(isRecording)
			);
		} catch (error) {
			captureSentryError(error, 'voice/sendRecordingState');
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
			const params = event_type === EVoiceInteractEvent.APP_BLACKBOARD ? `userId=${sender_id}` : '';
			const response = await mezon.client.writeVoiceInteractiveEvent(
				mezon.session,
				clan_id,
				channel_id,
				sender_id,
				sender_id,
				event_type,
				params
			);
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

export const kickVoiceMember = createAsyncThunk('meet/kickVoiceMember', async ({ user_id }: { user_id?: string }, thunkAPI) => {
	try {
		const mezon = await ensureClientAsync(getMezonCtx(thunkAPI));
		const state = thunkAPI.getState() as RootState;
		const voiceInfor = selectVoiceInfo(state);
		const response = await mezon.client.removeMezonMeetParticipant(mezon.session, {
			clan_id: voiceInfor?.clanId as string,
			channel_id: voiceInfor?.channelId,
			user_id: user_id as string
		});
		return response;
	} catch (error) {
		captureSentryError(error, 'meet/generateMeetTokenExternal');
		return thunkAPI.rejectWithValue(error);
	}
});

export const muteVoiceMember = createAsyncThunk('meet/muteVoiceMember', async ({ user_id }: { user_id?: string }, thunkAPI) => {
	try {
		const mezon = await ensureClientAsync(getMezonCtx(thunkAPI));
		const state = thunkAPI.getState() as RootState;
		const voiceInfor = selectVoiceInfo(state);
		const response = await mezon.client.muteMezonMeetParticipant(mezon.session, {
			clan_id: voiceInfor?.clanId as string,
			channel_id: voiceInfor?.channelId,
			user_id: user_id as string
		});
		return response;
	} catch (error) {
		captureSentryError(error, 'meet/generateMeetTokenExternal');
		return thunkAPI.rejectWithValue(error);
	}
});

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
	noiseSuppressionReady: false,
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
	presenceRevisionByClan: {},
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
	},
	recordingUserIds: []
};

export const voiceSlice = createSlice({
	name: VOICE_FEATURE_KEY,
	initialState: initialVoiceState,
	reducers: {
		add: (
			state,
			action: PayloadAction<{ clan_id: string; channel_id: string; user_id: string; user_name: string; user_avatar: string; peer_id?: number }>
		) => {
			const { clan_id, channel_id, user_id, user_name, user_avatar, peer_id } = action.payload;
			state.presenceRevisionByClan[clan_id] = (state.presenceRevisionByClan[clan_id] ?? 0) + 1;
			state.listVoiceMemberByClan[clan_id] ??= {};
			const room = (state.listVoiceMemberByClan[clan_id][channel_id] ??= UsersInVoiceAdapter.getInitialState());
			const previous = room.entities[user_id];
			state.listVoiceMemberByClan[clan_id][channel_id] = UsersInVoiceAdapter.upsertOne(room, {
				user_id,
				user_name: user_name || previous?.user_name || '',
				user_avatar: user_avatar || previous?.user_avatar || '',
				peer_ids: addVoicePeer(previous?.peer_ids, peer_id)
			});
			if (user_id) {
				const status = state.listInVoiceStatus[user_id];
				state.listInVoiceStatus[user_id] = {
					clanId: clan_id,
					channelId: channel_id,
					status: status?.clanId === clan_id && status.channelId === channel_id ? status.status : EInvoice.INVOICE
				};
			}
		},
		remove: (state, action: PayloadAction<VoiceLeavedEvent & { peer_id?: number }>) => {
			const voice = action.payload;
			state.presenceRevisionByClan[voice.clan_id] = (state.presenceRevisionByClan[voice.clan_id] ?? 0) + 1;
			const room = state.listVoiceMemberByClan[voice.clan_id]?.[voice.voice_channel_id];
			const member = room?.entities[voice.voice_user_id];
			if (member) {
				member.peer_ids = removeVoicePeer(member.peer_ids, voice.peer_id);
				if (member.peer_ids.length) return;
				UsersInVoiceAdapter.removeOne(room, voice.voice_user_id);
			}
			const status = state.listInVoiceStatus[voice.voice_user_id];
			if (status?.clanId === voice.clan_id && status.channelId === voice.voice_channel_id) {
				delete state.listInVoiceStatus[voice.voice_user_id];
			}
		},
		removeFromClanInvoice: (state, action: PayloadAction<{ id: string; clanId: string }>) => {
			const userId = action.payload.id;
			const entitiesOfUser = state.listVoiceMemberByClan[action.payload.clanId];

			state.presenceRevisionByClan[action.payload.clanId] = (state.presenceRevisionByClan[action.payload.clanId] ?? 0) + 1;
			if (entitiesOfUser) {
				Object.values(entitiesOfUser).forEach((room) => UsersInVoiceAdapter.removeOne(room, userId));
				if (state.listInVoiceStatus[userId]?.clanId === action.payload.clanId) delete state.listInVoiceStatus[userId];
			}
		},
		voiceEnded: (state, action: PayloadAction<{ channelId: string; clanId: string }>) => {
			const { channelId, clanId } = action.payload;
			state.presenceRevisionByClan[clanId] = (state.presenceRevisionByClan[clanId] ?? 0) + 1;
			for (const [userId, status] of Object.entries(state.listInVoiceStatus)) {
				if (status.clanId === clanId && status.channelId === channelId) delete state.listInVoiceStatus[userId];
			}
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
			// Do not queue an unmute while the filter is still preparing.
			if (action.payload && state.noiseSuppressionEnabled && !state.noiseSuppressionReady) return;
			state.showMicrophone = action.payload;
		},
		setShowCamera: (state, action: PayloadAction<boolean>) => {
			state.showCamera = action.payload;
		},
		setShowScreen: (state, action: PayloadAction<boolean>) => {
			state.showScreen = action.payload;
		},
		setNoiseSuppressionEnabled: (state, action: PayloadAction<boolean>) => {
			// Preserve the user's mic intent. Only the outgoing pipeline is paused.
			if (state.noiseSuppressionEnabled !== action.payload) state.noiseSuppressionReady = false;
			state.noiseSuppressionEnabled = action.payload;
		},
		setNoiseSuppressionReady: (state, action: PayloadAction<boolean>) => {
			state.noiseSuppressionReady = state.noiseSuppressionEnabled && action.payload;
		},
		setRecordingState: (state, action: PayloadAction<Partial<VoiceRecordingState>>) => {
			state.recording = { ...state.recording, ...action.payload };
		},
		resetRecordingState: (state) => {
			state.recording = { ...initialVoiceState.recording };
		},
		setUserRecording: (state, action: PayloadAction<{ userId: string; isRecording: boolean }>) => {
			const next = withRecordingUser(state.recordingUserIds, action.payload.userId, action.payload.isRecording);
			if (next) {
				state.recordingUserIds = next;
			}
		},
		clearRecordingUsers: (state) => {
			if (state.recordingUserIds.length) {
				state.recordingUserIds = [];
			}
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
			state.noiseSuppressionReady = false;
			state.voiceConnectionState = false;
			state.voiceInfo = null;
			state.fullScreen = false;
			state.isJoined = false;
			state.isGroupCallJoined = false;
			state.token = '';
			state.stream = null;
			state.openPopOut = false;
			state.recordingUserIds = [];
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
			state.recordingUserIds = [];
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
			for (const [clanId, rooms] of Object.entries(state.listVoiceMemberByClan)) {
				if (!rooms[channelId]) continue;
				state.presenceRevisionByClan[clanId] = (state.presenceRevisionByClan[clanId] ?? 0) + 1;
				delete rooms[channelId];
			}
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
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchVoiceChannelMembers.pending, (state: VoiceState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(fetchVoiceChannelMembers.fulfilled, (state: VoiceState, action: PayloadAction<FetchVoiceChannelMembersResponse>) => {
				const { users, clanId, fromCache, presenceRevision } = action.payload;
				state.loadingStatus = 'loaded';

				if (fromCache || !users.length) return;
				if (presenceRevision !== undefined && presenceRevision !== (state.presenceRevisionByClan[clanId] ?? 0)) return;

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

					const previousRoom = state.listVoiceMemberByClan[clanId][channelId];
					for (const [userId, status] of Object.entries(state.listInVoiceStatus)) {
						if (status.clanId === clanId && status.channelId === channelId) delete state.listInVoiceStatus[userId];
					}
					const peers = voicePeersFromSnapshot(listUser, list.peer_ids);
					const listIdInVoice: VoiceUserData[] = [];
					for (const id of new Set(listUser)) {
						if (id.length === LENGHT_USER_ID) {
							listIdInVoice.push({
								user_id: id,
								user_avatar: previousRoom?.entities[id]?.user_avatar ?? '',
								user_name: previousRoom?.entities[id]?.user_name ?? '',
								peer_ids: peers[id] ?? previousRoom?.entities[id]?.peer_ids
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

export const voiceReducer = voiceSlice.reducer;

export const voiceActions = {
	...voiceSlice.actions,
	fetchVoiceChannelMembers,
	sendVoiceInteractiveEvent,
	sendRecordingState,
	kickVoiceMember,
	muteVoiceMember,
	giveFlowers
};

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
export const selectNoiseSuppressionReady = createSelector(getVoiceState, (state) => state.noiseSuppressionReady);

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

export const selectRecordingUserIds = createSelector(getVoiceState, (state) => state.recordingUserIds);

export const selectIsVoiceRecording = createSelector(
	getVoiceState,
	(state) => state.recording.status === 'recording' || state.recording.status === 'starting'
);
export const selectJoinCallExtStatus = createSelector(getVoiceState, (state) => state.joinCallExtStatus);
export const selectExternalToken = createSelector(getVoiceState, (state) => state.externalToken);
export const selectIsPiPMode = createSelector(getVoiceState, (state) => state.isPiPMode);
export const selectVoiceOpenPopOut = createSelector(getVoiceState, (state) => state.openPopOut);
export const selectGuestAccessToken = createSelector(getVoiceState, (state) => state.guestAccessToken);
export const selectGuestUserId = createSelector(getVoiceState, (state) => state.guestUserId);
export const selectOpenExternalChatBox = createSelector(getVoiceState, (state) => state.openChatBox);
