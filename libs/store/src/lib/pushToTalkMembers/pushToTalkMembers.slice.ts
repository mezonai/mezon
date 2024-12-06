import { captureSentryError } from '@mezon/logger';
import { IChannelMember, LoadingStatus } from '@mezon/utils';
import { EntityState, PayloadAction, createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import { ChannelType } from 'mezon-js';
import { ApiPTTChannelUser } from 'mezon-js/api.gen';
import { ensureSession, getMezonCtx } from '../helpers';

export const PTT_USERS_FEATURES_KEY = 'pushToTalkUsers';

export interface IPttUsersEntity extends ApiPTTChannelUser {
	id: string;
}

export interface IPttUsersState extends EntityState<IPttUsersEntity, string> {
	loadingStatus: LoadingStatus;
	error?: string | null;
	usersInPTT: IChannelMember[];
}

export const pttUsersAdapter = createEntityAdapter({
	selectId: (user: IPttUsersEntity) => user.id
});

const initialState: IPttUsersState = pttUsersAdapter.getInitialState({
	loadingStatus: 'not loaded',
	error: null,
	usersInPTT: []
});

export interface IFetchPttMembersInChannelRequest {
	clanId: string;
	channelId: string;
	channelType: ChannelType;
}

export const getAllPttMembersInChannel = createAsyncThunk(
	'pushToTalk/getAllPttMembersInChannel',
	async ({ clanId, channelId, channelType }: IFetchPttMembersInChannelRequest, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const response = await mezon.client.listPTTChannelUsers(mezon.session, clanId, channelId, channelType);
			return response.ptt_channel_users;
		} catch (err) {
			captureSentryError(err, 'pushToTalk/getAllPttMembersInChannel');
			return thunkAPI.rejectWithValue(err);
		}
	}
);

export const pushToTalkMembersSlice = createSlice({
	name: PTT_USERS_FEATURES_KEY,
	initialState: initialState,
	reducers: {
		add: pttUsersAdapter.addOne,
		addMany: pttUsersAdapter.addMany,
		remove: pttUsersAdapter.removeOne
	},
	extraReducers: (builder) => {
		builder
			.addCase(getAllPttMembersInChannel.pending, (state: IPttUsersState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(getAllPttMembersInChannel.fulfilled, (state: IPttUsersState, action: PayloadAction<any>) => {
				pttUsersAdapter.setAll(state, action.payload);
				state.loadingStatus = 'loaded';
			})
			.addCase(getAllPttMembersInChannel.rejected, (state: IPttUsersState, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			});
	}
});

export const pttMembersActions = {
	...pushToTalkMembersSlice.actions
};

const { selectEntities } = pttUsersAdapter.getSelectors();
export const pushToTalkMembersReducer = pushToTalkMembersSlice.reducer;
export const getPttMembersState = (rootState: { [PTT_USERS_FEATURES_KEY]: IPttUsersState }): IPttUsersState => rootState[PTT_USERS_FEATURES_KEY];

export const selectPttMembersEntities = createSelector(getPttMembersState, selectEntities);

export const selectPttMembersByChannelId = (channelId: string) =>
	createSelector(selectPttMembersEntities, (entities) => {
		const inPttMembers = Object.values(entities);
		return inPttMembers.filter((user) => user && user.channel_id === channelId);
	});
