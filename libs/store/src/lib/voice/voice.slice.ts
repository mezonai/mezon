import { captureSentryError } from '@mezon/logger';
import { generateBasePath } from '@mezon/transport';
import { INITIAL_NOISE_SUPPRESSION_PERCENTAGE, type IVoice, type IvoiceInfo, type LoadingStatus } from '@mezon/utils';
import type { EntityState, PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import type { ChannelType, VoiceLeavedEvent } from 'mezon-js';
import type { ApiGenerateMeetTokenResponse, ApiVoiceChannelUser } from 'mezon-js/api.gen';
import type { CacheMetadata } from '../cache-metadata';
import { createApiKey, createCacheMetadata, markApiFirstCalled, shouldForceApiCall } from '../cache-metadata';
import type { MezonValueContext } from '../helpers';
import { ensureClientAsync, ensureSession, fetchDataWithSocketFallback, getMezonCtx } from '../helpers';
import type { RootState } from '../store';

export const VOICE_FEATURE_KEY = 'voice';

/*
 * Update these interfaces according to your requirements.
 */
export interface VoiceEntity extends IVoice {
	id: string; // Primary ID
}

export interface InVoiceInfor {
	clanId: string;
	channelId: string;
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
	showSelectScreenModal: boolean;
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
	screenSource?: {
		id: string;
		audio: boolean;
		mode: 'electron';
	} | null;
	contextMenu: {
		openedParticipantId: string | null;
		position: { x: number; y: number };
	} | null;
	listVoiceMemberByClan: Record<string, EntityState<VoiceEntity, string>>;
}

export const voiceAdapter = createEntityAdapter({
	selectId: (voice: VoiceEntity) => voice.id
});

const { selectAll: selectAllVoiceEntities } = voiceAdapter.getSelectors();

const normalizeVoiceEntity = (voice: VoiceEntity): VoiceEntity => {
	const normalizedId = voice.id && voice.id.length > 0 ? voice.id : `${voice.user_id || ''}${voice.voice_channel_id || ''}`;
	return {
		...voice,
		id: normalizedId
	};
};

type fetchVoiceChannelMembersPayload = {
	clanId: string;
	channelId: string;
	channelType: ChannelType;
	noCache?: boolean;
};

export type FetchVoiceChannelMembersResponse = {
	users: ApiVoiceChannelUser[];
	clanId: string;
	fromCache?: boolean;
};

export interface ApiGenerateMeetTokenResponseExtend extends ApiGenerateMeetTokenResponse {
	guest_user_id?: string;
	guest_access_token?: string;
}

const selectCachedVoiceMembers = createSelector(
	[(state: RootState) => state[VOICE_FEATURE_KEY], (_, clan_id: string) => clan_id],
	(voiceState, clan_id) => {
		return selectAllVoiceEntities(voiceState.listVoiceMemberByClan[clan_id]);
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
		const voiceMembers = selectCachedVoiceMembers(state, clanId);
		return {
			voice_channel_users: voiceMembers,
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
		(session) => ensuredMezon.client.listChannelVoiceUsers(session, clanId || '0', channelId || '0', channelType, 1, 100, ''),
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
				return { users: [] as ApiVoiceChannelUser[], clanId };
			}

			const payload: FetchVoiceChannelMembersResponse = {
				users: response.voice_channel_users,
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

export const generateMeetTokenExternal = createAsyncThunk(
	'meet/generateMeetTokenExternal',
	async ({ token, displayName, isGuest }: { token: string; displayName?: string; isGuest?: boolean }, thunkAPI) => {
		try {
			const mezon = await ensureClientAsync(getMezonCtx(thunkAPI));
			const response = await mezon.client.generateMeetTokenExternal(generateBasePath(), token, displayName, isGuest);
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

export const initialVoiceState: VoiceState = voiceAdapter.getInitialState({
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
	showSelectScreenModal: false,
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
	listVoiceMemberByClan: {}
});

export const voiceSlice = createSlice({
	name: VOICE_FEATURE_KEY,
	initialState: initialVoiceState,
	reducers: {
		add: (state, action: PayloadAction<VoiceEntity>) => {
			const normalizedVoice = normalizeVoiceEntity(action.payload);
			if (!state.listVoiceMemberByClan[normalizedVoice.clan_id]) {
				state.listVoiceMemberByClan[normalizedVoice.clan_id] = voiceAdapter.getInitialState({});
			}

			const duplicateEntry = Object.values(state.listVoiceMemberByClan[normalizedVoice.clan_id]?.entities).find(
				(member) =>
					member?.user_id === normalizedVoice.user_id &&
					member?.voice_channel_id === normalizedVoice.voice_channel_id &&
					member?.id !== normalizedVoice.id
			);
			if (duplicateEntry?.id) {
				state.listVoiceMemberByClan[normalizedVoice.clan_id] = voiceAdapter.removeOne(
					state.listVoiceMemberByClan[normalizedVoice.clan_id],
					duplicateEntry.id
				);
			}

			state.listVoiceMemberByClan[normalizedVoice.clan_id] = voiceAdapter.upsertOne(
				state.listVoiceMemberByClan[normalizedVoice.clan_id],
				normalizedVoice
			);
			if (normalizedVoice.user_id) {
				state.listInVoiceStatus[normalizedVoice.user_id] = {
					clanId: normalizedVoice.clan_id,
					channelId: normalizedVoice.voice_channel_id
				};
			}
		},
		remove: (state, action: PayloadAction<VoiceLeavedEvent>) => {
			const voice = action.payload;
			const keyRemove = voice.voice_user_id + voice.voice_channel_id;
			const entities = voiceAdapter.getSelectors().selectEntities(state.listVoiceMemberByClan[voice.clan_id]);
			if (entities[keyRemove]) {
				state.listVoiceMemberByClan[voice.clan_id] = voiceAdapter.removeOne(state.listVoiceMemberByClan[voice.clan_id], keyRemove);
			} else {
				state.listVoiceMemberByClan[voice.clan_id] = voiceAdapter.removeOne(state.listVoiceMemberByClan[voice.clan_id], voice.id);
			}

			const entitiesAfter = voiceAdapter.getSelectors().selectAll(state.listVoiceMemberByClan[voice.clan_id]);
			const userStillInVoice = entitiesAfter.some((entity) => entity.user_id === voice.voice_user_id);
			if (!userStillInVoice) {
				delete state.listInVoiceStatus[voice.voice_user_id];
			}
		},
		removeFromClanInvoice: (state, action: PayloadAction<{ id: string; clanId: string }>) => {
			const userId = action.payload.id;
			const entitiesOfUser = voiceAdapter
				.getSelectors()
				.selectAll(state.listVoiceMemberByClan[action.payload.clanId])
				.filter((entity) => entity.user_id === userId);
			if (entitiesOfUser.length === 0) {
				delete state.listInVoiceStatus[userId];
			}
		},
		voiceEnded: (state, action: PayloadAction<{ channelId: string; clanId: string }>) => {
			const { channelId, clanId } = action.payload;
			const idsToRemove = Object.values(state.listVoiceMemberByClan[clanId].entities)
				.filter((member) => member?.voice_channel_id === channelId)
				.map((member) => member?.id + member?.voice_channel_id);
			state.listVoiceMemberByClan[clanId] = voiceAdapter.removeMany(state.listVoiceMemberByClan[clanId], idsToRemove);
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
		setShowSelectScreenModal: (state, action: PayloadAction<boolean>) => {
			state.showSelectScreenModal = action.payload;
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
		setScreenSource: (
			state,
			action: PayloadAction<
				| {
						id: string;
						audio: boolean;
						mode: 'electron';
				  }
				| null
				| undefined
			>
		) => {
			state.screenSource = action.payload ?? null;
		},
		setFullScreen: (state, action: PayloadAction<boolean>) => {
			state.fullScreen = action.payload;
		},
		resetVoiceControl: (state) => {
			state.showMicrophone = false;
			state.showCamera = false;
			state.showScreen = false;
			state.noiseSuppressionEnabled = true;
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
		}
		// ...
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchVoiceChannelMembers.pending, (state: VoiceState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(fetchVoiceChannelMembers.fulfilled, (state: VoiceState, action: PayloadAction<FetchVoiceChannelMembersResponse>) => {
				const { users, clanId, fromCache } = action.payload;
				state.loadingStatus = 'loaded';

				if (fromCache) return;

				state.listInVoiceStatus = {};
				const members: VoiceEntity[] = users.map((channelRes) => {
					if (channelRes.user_id && channelRes?.id) {
						state.listInVoiceStatus[channelRes.user_id] = {
							channelId: channelRes.channel_id || '0',
							clanId
						};
					}
					return {
						user_id: channelRes.user_id || '',
						clan_id: clanId,
						voice_channel_id: channelRes.channel_id || '0',
						clan_name: '',
						participant: channelRes.participant || '',
						voice_channel_label: '',
						last_screenshot: '',
						id: (channelRes.user_id || '') + (channelRes.channel_id || '0')
					};
				});
				if (!state.listVoiceMemberByClan[clanId]) {
					state.listVoiceMemberByClan[clanId] = voiceAdapter.getInitialState({});
					state.listVoiceMemberByClan[clanId] = state.listVoiceMemberByClan[clanId] = voiceAdapter.setAll(
						state.listVoiceMemberByClan[clanId],
						members
					);
				}

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
	kickVoiceMember,
	muteVoiceMember
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

		if (listByClan) {
			return selectAllVoiceEntities(listByClan).filter((member) => member && member.voice_channel_id === channelId);
		}
		return [];
	}
);

export const selectScreenSource = createSelector(getVoiceState, (state) => state.screenSource);

export const selectShowSelectScreenModal = createSelector(getVoiceState, (state) => state.showSelectScreenModal);

export const selectNumberMemberVoiceChannel = createSelector([selectVoiceChannelMembersByChannelId], (members) => members.length);

export const selectVoiceContextMenu = createSelector(getVoiceState, (state) => state.contextMenu);
///
export const selectJoinCallExtStatus = createSelector(getVoiceState, (state) => state.joinCallExtStatus);
export const selectExternalToken = createSelector(getVoiceState, (state) => state.externalToken);
export const selectIsPiPMode = createSelector(getVoiceState, (state) => state.isPiPMode);
export const selectVoiceOpenPopOut = createSelector(getVoiceState, (state) => state.openPopOut);
export const selectGuestAccessToken = createSelector(getVoiceState, (state) => state.guestAccessToken);
export const selectGuestUserId = createSelector(getVoiceState, (state) => state.guestUserId);
export const selectOpenExternalChatBox = createSelector(getVoiceState, (state) => state.openChatBox);
