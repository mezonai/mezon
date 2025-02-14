import { captureSentryError } from '@mezon/logger';
import { IChannelMember, IVoice, IvoiceInfo, LoadingStatus } from '@mezon/utils';
import { EntityState, PayloadAction, createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import { ChannelType } from 'mezon-js';
import { ensureSession, getMezonCtx } from '../helpers';
import { RootState } from '../store';

export const VOICE_FEATURE_KEY = 'voice';

/*
 * Update these interfaces according to your requirements.
 */
export interface VoiceEntity extends IVoice {
	id: string; // Primary ID
}

export interface VoiceState extends EntityState<VoiceEntity, string> {
	voiceInfo: IvoiceInfo | null;
	loadingStatus: LoadingStatus;
	error?: string | null;
	voiceChannelMember: IChannelMember[];
	showMicrophone: boolean;
	showCamera: boolean;
	showScreen: boolean;
	statusCall: boolean;
	voiceConnectionState: boolean;
	fullScreen?: boolean;
	isJoined: boolean;
}

export const voiceAdapter = createEntityAdapter<VoiceEntity>();

type fetchVoiceChannelMembersPayload = {
	clanId: string;
	channelId: string;
	channelType: ChannelType;
};

export const fetchVoiceChannelMembers = createAsyncThunk(
	'voice/fetchVoiceChannelMembers',
	async ({ clanId, channelId, channelType }: fetchVoiceChannelMembersPayload, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));

			const response = await mezon.client.listChannelVoiceUsers(mezon.session, clanId, channelId, channelType, 1, 100, '');
			if (!response.voice_channel_users) {
				return [];
			}

			const members = response.voice_channel_users.map((channelRes) => {
				return {
					user_id: channelRes.user_id || '',
					clan_id: clanId,
					voice_channel_id: channelRes.channel_id || '',
					clan_name: '',
					participant: channelRes.participant || '',
					voice_channel_label: '',
					last_screenshot: '',
					id: channelRes.id || ''
				};
			});

			thunkAPI.dispatch(voiceActions.addMany(members));
			const voices = response.voice_channel_users;
			return voices;
		} catch (error) {
			captureSentryError(error, 'voice/fetchVoiceChannelMembers');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const initialVoiceState: VoiceState = voiceAdapter.getInitialState({
	loadingStatus: 'not loaded',
	error: null,
	voiceChannelMember: [],
	showMicrophone: false,
	showCamera: false,
	showScreen: false,
	statusCall: false,
	voiceConnectionState: false,
	voiceInfo: null,
	fullScreen: false,
	isJoined: false
});

export const voiceSlice = createSlice({
	name: VOICE_FEATURE_KEY,
	initialState: initialVoiceState,
	reducers: {
		add: voiceAdapter.addOne,
		addMany: voiceAdapter.addMany,
		remove: voiceAdapter.removeOne,
		voiceEnded: (state, action: PayloadAction<string>) => {
			const channelId = action.payload;
			const idsToRemove = Object.values(state.entities)
				.filter((member) => member?.voice_channel_id === channelId)
				.map((member) => member?.id);
			voiceAdapter.removeMany(state, idsToRemove);
		},
		setJoined: (state, action) => {
			state.isJoined = action.payload;
		},
		setVoiceInfo: (state, action: PayloadAction<IvoiceInfo>) => {
			state.voiceInfo = action.payload;
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
		setStatusCall: (state, action: PayloadAction<boolean>) => {
			state.statusCall = action.payload;
		},
		setVoiceConnectionState: (state, action: PayloadAction<boolean>) => {
			state.voiceConnectionState = action.payload;
		},
		setFullScreen: (state, action: PayloadAction<boolean>) => {
			state.fullScreen = action.payload;
		},
		resetVoiceSettings: (state) => {
			state.showMicrophone = false;
			state.showCamera = false;
			state.showScreen = false;
			state.voiceConnectionState = false;
			state.voiceInfo = null;
			state.fullScreen = false;
			state.isJoined = false;
		}
		// ...
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchVoiceChannelMembers.pending, (state: VoiceState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(fetchVoiceChannelMembers.fulfilled, (state: VoiceState, action: PayloadAction<any>) => {
				state.voiceChannelMember = action.payload;
				state.loadingStatus = 'loaded';
			})
			.addCase(fetchVoiceChannelMembers.rejected, (state: VoiceState, action) => {
				state.loadingStatus = 'error';
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
	fetchVoiceChannelMembers
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
const { selectAll } = voiceAdapter.getSelectors();

export const getVoiceState = (rootState: { [VOICE_FEATURE_KEY]: VoiceState }): VoiceState => rootState[VOICE_FEATURE_KEY];

export const selectAllVoice = createSelector(getVoiceState, selectAll);

export const selectVoiceJoined = createSelector(getVoiceState, (state) => state.isJoined);

export const selectVoiceInfo = createSelector(getVoiceState, (state) => state.voiceInfo);

export const selectShowMicrophone = createSelector(getVoiceState, (state) => state.showMicrophone);

export const selectShowCamera = createSelector(getVoiceState, (state) => state.showCamera);

export const selectShowScreen = createSelector(getVoiceState, (state) => state.showScreen);

export const selectStatusCall = createSelector(getVoiceState, (state) => state.statusCall);

export const selectVoiceFullScreen = createSelector(getVoiceState, (state) => state.fullScreen);

const selectChannelId = (_: RootState, channelId: string) => channelId;

export const selectVoiceChannelMembersByChannelId = createSelector([selectAllVoice, selectChannelId], (entities, channelId) => {
	return entities.filter((member) => member && member.voice_channel_id === channelId);
});

export const selectNumberMemberVoiceChannel = createSelector([selectVoiceChannelMembersByChannelId], (members) => members.length);

export const selectVoiceConnectionState = createSelector(getVoiceState, (state) => state.voiceConnectionState);
