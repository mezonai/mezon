import { captureSentryError } from '@mezon/logger';
import { IChannelMember, LoadingStatus } from '@mezon/utils';
import { EntityState, PayloadAction, createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import { ChannelType } from 'mezon-js';
import { ApiSFUChannelUser } from 'mezon-js/api.gen';
import { ensureSession, getMezonCtx } from '../helpers';

export const SFU_USERS_FEATURES_KEY = 'sfuUsers';

export interface ISFUUsersEntity extends ApiSFUChannelUser {
	id: string;
}

export interface ISFUUsersState extends EntityState<ISFUUsersEntity, string> {
	loadingStatus: LoadingStatus;
	error?: string | null;
	usersInPTT: IChannelMember[];
}

export const pttUsersAdapter = createEntityAdapter({
	selectId: (user: ISFUUsersEntity) => user.id
});

const initialState: ISFUUsersState = pttUsersAdapter.getInitialState({
	loadingStatus: 'not loaded',
	error: null,
	usersInPTT: []
});

export interface IFetchSFUMembersInChannelRequest {
	clanId: string;
	channelId: string;
	channelType: ChannelType;
}

export const getAllSfuMembersInChannel = createAsyncThunk(
	'sfu/getAllSfuMembersInChannel',
	async ({ clanId, channelId, channelType }: IFetchSFUMembersInChannelRequest, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const response = await mezon.client.listPTTChannelUsers(mezon.session, clanId, channelId, channelType);
			return response.ptt_channel_users;
		} catch (err) {
			captureSentryError(err, 'sfu/getAllSfuMembersInChannel');
			return thunkAPI.rejectWithValue(err);
		}
	}
);

export const sfuMembersSlice = createSlice({
	name: SFU_USERS_FEATURES_KEY,
	initialState: initialState,
	reducers: {
		add: pttUsersAdapter.addOne,
		addMany: pttUsersAdapter.addMany,
		remove: pttUsersAdapter.removeOne
	},
	extraReducers: (builder) => {
		builder
			.addCase(getAllSfuMembersInChannel.pending, (state: ISFUUsersState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(getAllSfuMembersInChannel.fulfilled, (state: ISFUUsersState, action: PayloadAction<any>) => {
				pttUsersAdapter.setAll(state, action.payload);
				state.loadingStatus = 'loaded';
			})
			.addCase(getAllSfuMembersInChannel.rejected, (state: ISFUUsersState, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			});
	}
});

export const pttMembersActions = {
	...sfuMembersSlice.actions
};

const { selectEntities } = pttUsersAdapter.getSelectors();
export const pushToTalkMembersReducer = sfuMembersSlice.reducer;
export const getPttMembersState = (rootState: { [SFU_USERS_FEATURES_KEY]: ISFUUsersState }): ISFUUsersState => rootState[SFU_USERS_FEATURES_KEY];

export const selectSfuMembersEntities = createSelector(getPttMembersState, selectEntities);

export const selectSfuMembersByChannelId = (channelId: string) =>
	createSelector(selectSfuMembersEntities, (entities) => {
		const inSfuMembers = Object.values(entities);
		return inSfuMembers.filter((user) => user && user.channel_id === channelId);
	});
