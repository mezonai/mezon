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
	usersInSFU: IChannelMember[];
}

export const sfuUsersAdapter = createEntityAdapter({
	selectId: (user: ISFUUsersEntity) => user.id
});

const initialState: ISFUUsersState = sfuUsersAdapter.getInitialState({
	loadingStatus: 'not loaded',
	error: null,
	usersInSFU: []
});

export interface IFetchSFUMembersInChannelRequest {
	clanId: string;
	channelId: string;
	channelType: ChannelType;
}

export const getAllSFUMembersInChannel = createAsyncThunk(
	'sfu/getAllSFUMembersInChannel',
	async ({ clanId, channelId, channelType }: IFetchSFUMembersInChannelRequest, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const response = await mezon.client.listSFUChannelUsers(mezon.session, clanId, channelId, channelType);
			return response.sfu_channel_users;
		} catch (err) {
			captureSentryError(err, 'sfu/getAllSFUMembersInChannel');
			return thunkAPI.rejectWithValue(err);
		}
	}
);

export const sfuMembersSlice = createSlice({
	name: SFU_USERS_FEATURES_KEY,
	initialState: initialState,
	reducers: {
		add: sfuUsersAdapter.addOne,
		addMany: sfuUsersAdapter.addMany,
		remove: sfuUsersAdapter.removeOne
	},
	extraReducers: (builder) => {
		builder
			.addCase(getAllSFUMembersInChannel.pending, (state: ISFUUsersState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(getAllSFUMembersInChannel.fulfilled, (state: ISFUUsersState, action: PayloadAction<any>) => {
				sfuUsersAdapter.setAll(state, action.payload);
				state.loadingStatus = 'loaded';
			})
			.addCase(getAllSFUMembersInChannel.rejected, (state: ISFUUsersState, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			});
	}
});

export const sfuMembersActions = {
	...sfuMembersSlice.actions
};

const { selectEntities } = sfuUsersAdapter.getSelectors();
export const sfuMembersReducer = sfuMembersSlice.reducer;
export const getSFUMembersState = (rootState: { [SFU_USERS_FEATURES_KEY]: ISFUUsersState }): ISFUUsersState => rootState[SFU_USERS_FEATURES_KEY];

export const selectSFUMembersEntities = createSelector(getSFUMembersState, selectEntities);

export const selectSFUMembersByChannelId = (channelId: string) =>
	createSelector(selectSFUMembersEntities, (entities) => {
		const inSFUMembers = Object.values(entities);
		return inSFUMembers.filter((user) => user && user.channel_id === channelId);
	});
