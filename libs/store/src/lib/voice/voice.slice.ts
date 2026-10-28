import { captureSentryError } from '@mezon/logger';
import type { SfuBreakoutRoomEventPayload } from '@mezon/transport';
import { SfuBreakoutApiError, callSfuBreakoutMerge, callSfuBreakoutRoom } from '@mezon/transport';
import { LENGHT_USER_ID, type IvoiceInfo, type LoadingStatus } from '@mezon/utils';
import type { EntityState, PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import type { ApiGenerateMeetTokenResponse, ApiVoiceChannelUser, VoiceLeavedEvent } from 'mezon-js';
import { ChannelType } from 'mezon-js';
import type { SfuBreakoutParticipant } from 'mezon-js-protobuf';
import type { ScreenShareEvent } from 'node_modules/mezon-js-protobuf/dist/rtapi/realtime';
import { selectCurrentUserId } from '../account/account.slice';
import type { CacheMetadata } from '../cache-metadata';
import { createApiKey, createCacheMetadata, markApiFirstCalled, shouldForceApiCall } from '../cache-metadata';
import { channelsActions, selectCurrentChannelId } from '../channels/channels.slice';
import { selectCurrentClanId } from '../clans/clans.slice';
import type { MezonValueContext } from '../helpers';
import { ensureClientAsync, ensureSession, fetchDataWithSocketFallback, getMezonCtx } from '../helpers';
import { generateMeetToken } from '../meet/meet.slice';
import type { RootState } from '../store';
import type { BreakoutInviteState, BreakoutRoomState, BreakoutRule, HostedBreakout } from './breakout';
import {
	API_FAILED_PRECONDITION,
	API_INVALID_ARGUMENT,
	API_NOT_FOUND,
	breakoutInviteRoomId,
	breakoutInviteToken,
	breakoutSignalFromEvent,
	createOpenedHostedBreakout,
	loadHostedBreakouts,
	noteHostedBreakoutAutoCloseFailure,
	observeHostedRooms,
	saveHostedBreakouts,
	voiceMembersByChannelId
} from './breakout';
import { recordingParams, withRecordingUser } from './recordingSignal';

export * from './breakout';
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
	sfuUrl: string;
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
	voiceMembersLoadedByClan: Record<string, boolean>;
	recording: VoiceRecordingState;
	recordingUserIds: string[];
	breakoutRoom: BreakoutRoomState | null;
	breakoutInvite: BreakoutInviteState | null;
	breakoutParents: string[];
	hostedBreakouts: Record<string, HostedBreakout>;
	hostedBreakoutsOwnerId: string | null;
	breakoutPending: boolean;
	closingBreakoutIds: string[];
}

type fetchVoiceChannelMembersPayload = {
	clanId: string;
	channelId: string;
	channelType: ChannelType;
	noCache?: boolean;
};

export type FetchVoiceChannelMembersResponse = {
	users: ApiVoiceChannelUser[];
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

function extractGrpcErrorCode(error: unknown): number | undefined {
	return error instanceof SfuBreakoutApiError ? error.code : undefined;
}

function buildMeetMetadataForClan(state: RootState, clanId: string): string {
	const userProfile = state.account.userProfile;
	const userId = userProfile?.user?.id || '';
	const clanMember = state.usersClan?.byClans?.[clanId]?.entities?.entities?.[userId];
	const username = clanMember?.clan_nick || clanMember?.prioritizeName || userProfile?.user?.display_name || userProfile?.user?.username || '';
	const avatar = clanMember?.clan_avatar || userProfile?.user?.avatar_url || '';
	return username || avatar ? `${username};${avatar}` : '';
}

export type OpenBreakoutRoomsPayload = {
	clanId: string;
	parentChannelId: string;
	roomCount: number;
	rule: BreakoutRule;
	listParticipants: SfuBreakoutParticipant[];
	inviteeIds: string[];
};

export type OpenBreakoutRoomsResult =
	| {
			outcome: 'opened';
			hosted: HostedBreakout;
			openedCount: number;
	  }
	| { outcome: 'failed'; code?: number };

export const openBreakoutRooms = createAsyncThunk<OpenBreakoutRoomsResult, OpenBreakoutRoomsPayload>(
	'voice/openBreakoutRooms',
	async ({ clanId, parentChannelId, roomCount, rule, listParticipants, inviteeIds }, thunkAPI) => {
		try {
			const mezon = await ensureClientAsync(getMezonCtx(thunkAPI));
			const state = thunkAPI.getState() as RootState;
			const ownerUserId = selectCurrentUserId(state);
			if (!ownerUserId) {
				return { outcome: 'failed' };
			}
			const response = await callSfuBreakoutRoom(mezon.client, {
				parent_channel_id: parentChannelId,
				room_count: roomCount,
				break_rule_type: rule,
				list_participants: listParticipants
			});
			const roomIds = (response.list_child_rooms ?? []).filter((id) => Boolean(id) && id !== '0');
			if (!response.breakout_id || response.breakout_id === '0' || roomIds.length === 0) {
				return { outcome: 'failed' };
			}
			const hosted = createOpenedHostedBreakout({
				breakoutId: response.breakout_id,
				parentChannelId,
				clanId,
				roomIds,
				ownerUserId,
				invitees: inviteeIds,
				openedAtUnixSecs: Math.floor(Date.now() / 1000)
			});
			return {
				outcome: 'opened',
				hosted,
				openedCount: roomIds.length
			};
		} catch (error) {
			const code = extractGrpcErrorCode(error);
			if (code !== API_FAILED_PRECONDITION) {
				captureSentryError(error, 'voice/openBreakoutRooms');
			}
			return { outcome: 'failed', code };
		}
	}
);

export type CloseBreakoutRoomsResult = {
	parentChannelId: string;
	breakoutId: string;
	outcome: 'closed' | 'failed';
};

export const closeBreakoutRooms = createAsyncThunk<CloseBreakoutRoomsResult, { parentChannelId: string; breakoutId: string }>(
	'voice/closeBreakoutRooms',
	async ({ parentChannelId, breakoutId }, thunkAPI) => {
		try {
			const mezon = await ensureClientAsync(getMezonCtx(thunkAPI));
			await callSfuBreakoutMerge(mezon.client, { target_id: breakoutId });
			return { parentChannelId, breakoutId, outcome: 'closed' };
		} catch (error) {
			if (extractGrpcErrorCode(error) === API_NOT_FOUND) {
				return { parentChannelId, breakoutId, outcome: 'closed' };
			}
			captureSentryError(error, 'voice/closeBreakoutRooms');
			return { parentChannelId, breakoutId, outcome: 'failed' };
		}
	}
);

export type AutoCloseHostedBreakoutResult = {
	parentChannelId: string;
	breakoutId: string;
	outcome: 'closed' | 'stillOccupied' | 'failed';
	permanent?: boolean;
};

export const autoCloseHostedBreakout = createAsyncThunk<AutoCloseHostedBreakoutResult, { parentChannelId: string; breakoutId: string }>(
	'voice/autoCloseHostedBreakout',
	async ({ parentChannelId, breakoutId }, thunkAPI) => {
		try {
			const hosted = (thunkAPI.getState() as RootState)[VOICE_FEATURE_KEY].hostedBreakouts[parentChannelId];
			if (hosted?.breakoutId === breakoutId) {
				const refreshed = await thunkAPI.dispatch(
					fetchVoiceChannelMembers({
						clanId: hosted.clanId,
						channelId: parentChannelId,
						channelType: ChannelType.CHANNEL_TYPE_MEZON_VOICE,
						noCache: true
					})
				);
				if (fetchVoiceChannelMembers.fulfilled.match(refreshed)) {
					const voiceState = (thunkAPI.getState() as RootState)[VOICE_FEATURE_KEY];
					const observation = observeHostedRooms(hosted, true, voiceMembersByChannelId(voiceState.listVoiceMemberByClan[hosted.clanId]));
					if (observation && observation.occupants.size > 0) {
						return { parentChannelId, breakoutId, outcome: 'stillOccupied' };
					}
				}
			}
			const mezon = await ensureClientAsync(getMezonCtx(thunkAPI));
			await callSfuBreakoutMerge(mezon.client, { target_id: breakoutId });
			return { parentChannelId, breakoutId, outcome: 'closed' };
		} catch (error) {
			const code = extractGrpcErrorCode(error);
			if (code === API_NOT_FOUND) {
				return { parentChannelId, breakoutId, outcome: 'closed' };
			}
			return { parentChannelId, breakoutId, outcome: 'failed', permanent: code === API_INVALID_ARGUMENT };
		}
	}
);

export const returnToMainRoom = createAsyncThunk('voice/returnToMainRoom', async (_, thunkAPI) => {
	try {
		const state = thunkAPI.getState() as RootState;
		const voiceState = state[VOICE_FEATURE_KEY];
		const breakoutRoom = voiceState.breakoutRoom;
		const voiceInfo = voiceState.voiceInfo;
		if (!breakoutRoom || !voiceInfo?.clanId) {
			return null;
		}
		const clanId = voiceInfo.clanId;
		const parentChannelId = breakoutRoom.parentChannelId;
		const parentChannel = state.channels?.byClans?.[clanId]?.entities?.entities?.[parentChannelId];
		const parentLabel = parentChannel?.channel_label || breakoutRoom.parentLabel || voiceInfo.channelLabel;
		const parentPrivate = parentChannel?.channel_private ?? 0;
		const fallbackToken = voiceState.breakoutInvite?.invite.kind === 'Return' ? breakoutInviteToken(voiceState.breakoutInvite.invite) : null;
		thunkAPI.dispatch(voiceSlice.actions.dismissBreakoutInvite());

		const metadata = buildMeetMetadataForClan(state, clanId);
		let nextToken = '';
		let nextSfuUrl = voiceState.sfuUrl;
		try {
			const tokenRes = await thunkAPI
				.dispatch(
					generateMeetToken({
						channelId: parentChannelId,
						roomName: '',
						metadata
					})
				)
				.unwrap();
			nextToken = tokenRes?.token || fallbackToken || '';
			if (tokenRes?.url) {
				nextSfuUrl = tokenRes.url;
			}
		} catch (tokenErr) {
			if (fallbackToken) {
				nextToken = fallbackToken;
			} else {
				throw tokenErr;
			}
		}
		if (!nextToken) {
			return null;
		}
		void thunkAPI.dispatch(
			channelsActions.joinChat({
				clanId,
				channelId: parentChannelId,
				channelType: ChannelType.CHANNEL_TYPE_MEZON_VOICE,
				isPublic: !parentPrivate
			})
		);
		thunkAPI.dispatch(
			voiceSlice.actions.applyBreakoutRoomSwitch({
				channelId: parentChannelId,
				channelLabel: parentLabel,
				channelPrivate: parentPrivate,
				token: nextToken,
				sfuUrl: nextSfuUrl,
				breakoutRoom: null
			})
		);
		return { clanId, channelId: parentChannelId };
	} catch (error) {
		captureSentryError(error, 'voice/returnToMainRoom');
		return thunkAPI.rejectWithValue(error);
	}
});

export const acceptBreakoutInvite = createAsyncThunk(
	'voice/acceptBreakoutInvite',
	async ({ selectedRoomId }: { selectedRoomId?: string } = {}, thunkAPI) => {
		try {
			const state = thunkAPI.getState() as RootState;
			const voiceState = state[VOICE_FEATURE_KEY];
			const inviteState = voiceState.breakoutInvite;
			const voiceInfo = voiceState.voiceInfo;
			if (!inviteState || !voiceInfo?.clanId || !voiceInfo?.channelId) {
				return null;
			}
			const activeParentId = voiceState.breakoutRoom ? voiceState.breakoutRoom.parentChannelId : voiceInfo.channelId;
			if (inviteState.parentChannelId !== activeParentId) {
				thunkAPI.dispatch(voiceSlice.actions.dismissBreakoutInvite());
				return null;
			}
			if (inviteState.invite.kind === 'Return') {
				return await thunkAPI.dispatch(returnToMainRoom()).unwrap();
			}
			const targetRoomId = breakoutInviteRoomId(inviteState.invite, selectedRoomId);
			const fallbackToken = breakoutInviteToken(inviteState.invite);
			thunkAPI.dispatch(voiceSlice.actions.dismissBreakoutInvite());
			if (!targetRoomId) {
				return null;
			}
			const clanId = voiceInfo.clanId;
			const targetChannel = state.channels?.byClans?.[clanId]?.entities?.entities?.[targetRoomId];
			const targetLabel = targetChannel?.channel_label || targetRoomId;
			const targetPrivate = targetChannel?.channel_private ?? 0;
			const parentLabel = voiceState.breakoutRoom ? voiceState.breakoutRoom.parentLabel : voiceInfo.channelLabel;

			const metadata = buildMeetMetadataForClan(state, clanId);
			let nextToken = '';
			let nextSfuUrl = voiceState.sfuUrl;
			try {
				const tokenRes = await thunkAPI
					.dispatch(
						generateMeetToken({
							channelId: targetRoomId,
							roomName: '',
							metadata
						})
					)
					.unwrap();
				nextToken = tokenRes?.token || fallbackToken || '';
				if (tokenRes?.url) {
					nextSfuUrl = tokenRes.url;
				}
			} catch (tokenErr) {
				if (fallbackToken) {
					nextToken = fallbackToken;
				} else {
					throw tokenErr;
				}
			}
			if (!nextToken) {
				return null;
			}
			void thunkAPI.dispatch(
				channelsActions.joinChat({
					clanId,
					channelId: targetRoomId,
					channelType: ChannelType.CHANNEL_TYPE_MEZON_VOICE,
					isPublic: !targetPrivate
				})
			);
			thunkAPI.dispatch(
				voiceSlice.actions.applyBreakoutRoomSwitch({
					channelId: targetRoomId,
					channelLabel: targetLabel,
					channelPrivate: targetPrivate,
					token: nextToken,
					sfuUrl: nextSfuUrl,
					breakoutRoom: {
						parentChannelId: activeParentId,
						parentLabel,
						roomId: targetRoomId
					}
				})
			);
			return { clanId, channelId: targetRoomId };
		} catch (error) {
			captureSentryError(error, 'voice/acceptBreakoutInvite');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

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
	sfuUrl: '',
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
	voiceMembersLoadedByClan: {},
	recording: {
		status: 'idle',
		startedAt: null,
		deadlineAt: null,
		streamingToDisk: false,
		pipeline: 'none',
		degraded: false,
		error: null
	},
	recordingUserIds: [],
	breakoutRoom: null,
	breakoutInvite: null,
	breakoutParents: [],
	hostedBreakouts: {},
	hostedBreakoutsOwnerId: null,
	breakoutPending: false,
	closingBreakoutIds: []
};

export const voiceSlice = createSlice({
	name: VOICE_FEATURE_KEY,
	initialState: initialVoiceState,
	reducers: {
		add: (state, action: PayloadAction<{ clan_id: string; channel_id: string; user_id: string; user_name: string; user_avatar: string }>) => {
			const { clan_id, channel_id, user_id, user_name, user_avatar } = action.payload;
			state.presenceRevisionByClan[clan_id] = (state.presenceRevisionByClan[clan_id] ?? 0) + 1;
			state.listVoiceMemberByClan[clan_id] ??= {};
			const room = (state.listVoiceMemberByClan[clan_id][channel_id] ??= UsersInVoiceAdapter.getInitialState());
			const previous = room.entities[user_id];
			state.listVoiceMemberByClan[clan_id][channel_id] = UsersInVoiceAdapter.upsertOne(room, {
				user_id,
				user_name: user_name || previous?.user_name || '',
				user_avatar: user_avatar || previous?.user_avatar || ''
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
		remove: (state, action: PayloadAction<VoiceLeavedEvent>) => {
			const voice = action.payload;
			state.presenceRevisionByClan[voice.clan_id] = (state.presenceRevisionByClan[voice.clan_id] ?? 0) + 1;
			const room = state.listVoiceMemberByClan[voice.clan_id]?.[voice.voice_channel_id];
			if (room) UsersInVoiceAdapter.removeOne(room, voice.voice_user_id);
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
		setSfuUrl: (state, action: PayloadAction<string>) => {
			state.sfuUrl = action.payload;
		},
		setVoiceInfo: (state, action: PayloadAction<IvoiceInfo>) => {
			if (state.voiceInfo?.channelId !== action.payload.channelId) {
				if (state.breakoutRoom && state.breakoutRoom.roomId !== action.payload.channelId) {
					state.breakoutRoom = null;
					state.breakoutParents = [];
				}
				if (
					state.breakoutInvite &&
					state.breakoutInvite.parentChannelId !== action.payload.channelId &&
					state.breakoutRoom?.roomId !== action.payload.channelId
				) {
					state.breakoutInvite = null;
				}
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
		resetVoiceControl: (state, action: PayloadAction<{ keepBreakout?: boolean } | undefined>) => {
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
			state.sfuUrl = '';
			state.stream = null;
			state.openPopOut = false;
			state.recordingUserIds = [];
			if (action.payload?.keepBreakout) {
				return;
			}
			state.breakoutRoom = null;
			state.breakoutInvite = null;
			state.breakoutParents = [];
			state.breakoutPending = false;
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
			state.breakoutRoom = null;
			state.breakoutInvite = null;
			state.breakoutParents = [];
			state.breakoutPending = false;
		},
		syncHostedBreakoutsOwner: (state, action: PayloadAction<string | null>) => {
			const nextOwnerId = action.payload || null;
			if (state.hostedBreakoutsOwnerId === nextOwnerId) {
				return;
			}
			state.hostedBreakoutsOwnerId = nextOwnerId;
			state.closingBreakoutIds = [];
			if (!nextOwnerId) {
				state.hostedBreakouts = {};
				state.breakoutRoom = null;
				state.breakoutInvite = null;
				state.breakoutParents = [];
				state.breakoutPending = false;
				return;
			}
			state.hostedBreakouts = loadHostedBreakouts(nextOwnerId);
		},
		receiveBreakoutRoomEvent: (state, action: PayloadAction<{ event: SfuBreakoutRoomEventPayload; selfUserId?: string }>) => {
			if (!state.isJoined || !state.voiceInfo?.channelId || state.externalGroup || state.externalToken) {
				return;
			}
			const { event, selfUserId } = action.payload;
			const inBreakout = Boolean(state.breakoutRoom && state.breakoutRoom.roomId === state.voiceInfo.channelId);
			const parentChannelId = inBreakout && state.breakoutRoom ? state.breakoutRoom.parentChannelId : state.voiceInfo.channelId;
			const clanVoiceRooms = state.listVoiceMemberByClan[state.voiceInfo.clanId];
			const signal = breakoutSignalFromEvent(event, parentChannelId, inBreakout, state.breakoutParents, (channelId) =>
				(clanVoiceRooms?.[channelId]?.ids ?? []).some((uid) => String(uid) !== selfUserId)
			);
			if (!signal) {
				return;
			}
			if (signal.kind === 'Invite') {
				if (!state.breakoutParents.includes(parentChannelId)) {
					state.breakoutParents.push(parentChannelId);
				}
				state.breakoutInvite = {
					parentChannelId,
					invite: signal.invite
				};
				return;
			}
			if (signal.kind === 'Closed') {
				const hosted = state.hostedBreakouts[parentChannelId];
				if (hosted) {
					hosted.closedSignal = true;
				}
				if (state.breakoutInvite?.parentChannelId === parentChannelId) {
					state.breakoutInvite = null;
				}
			}
		},
		dismissBreakoutInvite: (state) => {
			state.breakoutInvite = null;
		},
		applyBreakoutRoomSwitch: (
			state,
			action: PayloadAction<{
				channelId: string;
				channelLabel: string;
				channelPrivate: number;
				token: string;
				sfuUrl: string;
				breakoutRoom: BreakoutRoomState | null;
			}>
		) => {
			const { channelId, channelLabel, channelPrivate, token, sfuUrl, breakoutRoom } = action.payload;
			state.breakoutRoom = breakoutRoom;
			state.breakoutParents = breakoutRoom ? [breakoutRoom.parentChannelId] : [];
			state.breakoutInvite = null;
			state.isJoined = true;
			state.token = token;
			state.openPopOut = false;
			state.showScreen = false;
			state.stream = null;
			state.recordingUserIds = [];
			if (sfuUrl) {
				state.sfuUrl = sfuUrl;
			}
			if (state.voiceInfo) {
				state.voiceInfo = {
					...state.voiceInfo,
					channelId,
					channelLabel,
					channelPrivate
				};
			}
		},
		updateHostedBreakoutState: (state, action: PayloadAction<{ parentChannelId: string; hosted: HostedBreakout; persist?: boolean }>) => {
			const { parentChannelId, hosted, persist } = action.payload;
			if (!state.hostedBreakouts[parentChannelId] || state.hostedBreakouts[parentChannelId].breakoutId !== hosted.breakoutId) {
				return;
			}
			state.hostedBreakouts[parentChannelId] = hosted;
			if (persist && state.hostedBreakoutsOwnerId) {
				saveHostedBreakouts(state.hostedBreakoutsOwnerId, state.hostedBreakouts);
			}
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

				if (presenceRevision !== undefined && presenceRevision !== (state.presenceRevisionByClan[clanId] ?? 0)) return;
				if (clanId && clanId !== '0') {
					state.voiceMembersLoadedByClan[clanId] = true;
				}
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

					const previousRoom = state.listVoiceMemberByClan[clanId][channelId];
					for (const [userId, status] of Object.entries(state.listInVoiceStatus)) {
						if (status.clanId === clanId && status.channelId === channelId) delete state.listInVoiceStatus[userId];
					}
					const listIdInVoice: VoiceUserData[] = [];
					for (const id of new Set(listUser)) {
						if (id.length === LENGHT_USER_ID) {
							listIdInVoice.push({
								user_id: id,
								user_avatar: previousRoom?.entities[id]?.user_avatar ?? '',
								user_name: previousRoom?.entities[id]?.user_name ?? ''
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
		builder
			.addCase(openBreakoutRooms.pending, (state: VoiceState) => {
				state.breakoutPending = true;
			})
			.addCase(openBreakoutRooms.fulfilled, (state: VoiceState, action: PayloadAction<OpenBreakoutRoomsResult>) => {
				state.breakoutPending = false;
				if (action.payload.outcome !== 'opened') {
					return;
				}
				const { hosted } = action.payload;
				if (state.hostedBreakoutsOwnerId !== hosted.ownerUserId) {
					const existing = loadHostedBreakouts(hosted.ownerUserId);
					existing[hosted.parentChannelId] = hosted;
					saveHostedBreakouts(hosted.ownerUserId, existing);
					return;
				}
				state.hostedBreakouts[hosted.parentChannelId] = hosted;
				saveHostedBreakouts(state.hostedBreakoutsOwnerId, state.hostedBreakouts);
			})
			.addCase(openBreakoutRooms.rejected, (state: VoiceState) => {
				state.breakoutPending = false;
			});
		builder
			.addCase(closeBreakoutRooms.pending, (state: VoiceState) => {
				state.breakoutPending = true;
			})
			.addCase(closeBreakoutRooms.fulfilled, (state: VoiceState, action: PayloadAction<CloseBreakoutRoomsResult>) => {
				state.breakoutPending = false;
				const { parentChannelId, breakoutId, outcome } = action.payload;
				if (outcome !== 'closed') {
					return;
				}
				const current = state.hostedBreakouts[parentChannelId];
				if (current && current.breakoutId === breakoutId) {
					delete state.hostedBreakouts[parentChannelId];
					if (state.hostedBreakoutsOwnerId) {
						saveHostedBreakouts(state.hostedBreakoutsOwnerId, state.hostedBreakouts);
					}
				}
				state.closingBreakoutIds = state.closingBreakoutIds.filter((id) => id !== breakoutId);
			})
			.addCase(closeBreakoutRooms.rejected, (state: VoiceState) => {
				state.breakoutPending = false;
			});
		builder
			.addCase(autoCloseHostedBreakout.pending, (state: VoiceState, action) => {
				const { breakoutId } = action.meta.arg;
				if (!state.closingBreakoutIds.includes(breakoutId)) {
					state.closingBreakoutIds.push(breakoutId);
				}
			})
			.addCase(autoCloseHostedBreakout.fulfilled, (state: VoiceState, action: PayloadAction<AutoCloseHostedBreakoutResult>) => {
				const { parentChannelId, breakoutId, outcome, permanent } = action.payload;
				state.closingBreakoutIds = state.closingBreakoutIds.filter((id) => id !== breakoutId);
				const current = state.hostedBreakouts[parentChannelId];
				if (!current || current.breakoutId !== breakoutId || outcome === 'stillOccupied') {
					return;
				}
				if (outcome === 'failed') {
					state.hostedBreakouts[parentChannelId] = noteHostedBreakoutAutoCloseFailure(
						current,
						Boolean(permanent),
						Math.floor(Date.now() / 1000)
					);
					return;
				}
				delete state.hostedBreakouts[parentChannelId];
				if (state.hostedBreakoutsOwnerId) {
					saveHostedBreakouts(state.hostedBreakoutsOwnerId, state.hostedBreakouts);
				}
			})
			.addCase(autoCloseHostedBreakout.rejected, (state: VoiceState, action) => {
				state.closingBreakoutIds = state.closingBreakoutIds.filter((id) => id !== action.meta.arg.breakoutId);
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
	giveFlowers,
	openBreakoutRooms,
	closeBreakoutRooms,
	autoCloseHostedBreakout,
	acceptBreakoutInvite,
	returnToMainRoom
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

export const selectSfuUrlJoinVoice = createSelector(getVoiceState, (state) => state.sfuUrl);

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
export const selectBreakoutRoom = createSelector(getVoiceState, (state) => state.breakoutRoom);
export const selectBreakoutInvite = createSelector(getVoiceState, (state) => state.breakoutInvite);
export const selectBreakoutParents = createSelector(getVoiceState, (state) => state.breakoutParents);
export const selectHostedBreakouts = createSelector(getVoiceState, (state) => state.hostedBreakouts);
export const selectHasHostedBreakouts = createSelector(selectHostedBreakouts, (hostedBreakouts) => Object.keys(hostedBreakouts).length > 0);
export const selectHostedBreakoutsOwnerId = createSelector(getVoiceState, (state) => state.hostedBreakoutsOwnerId);
export const selectBreakoutPending = createSelector(getVoiceState, (state) => state.breakoutPending);
export const selectClosingBreakoutIds = createSelector(getVoiceState, (state) => state.closingBreakoutIds);
export const selectVoiceMembersLoadedByClan = createSelector(getVoiceState, (state) => state.voiceMembersLoadedByClan);
export const selectListVoiceMemberByClan = createSelector(getVoiceState, (state) => state.listVoiceMemberByClan);
export const selectHostedBreakoutByChannelId = createSelector(
	[selectHostedBreakouts, (_: RootState, channelId: string) => channelId],
	(hostedBreakouts, channelId) => (channelId ? (hostedBreakouts[channelId] ?? null) : null)
);
