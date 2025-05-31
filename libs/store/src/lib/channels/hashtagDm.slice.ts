import { captureSentryError } from '@mezon/logger';
import { LoadingStatus } from '@mezon/utils';
import { EntityState, createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import { HashtagDm } from 'mezon-js';
import { MezonValueContext, ensureClient, getMezonCtx } from '../helpers';
import { memoizeAndTrack } from '../memoize';

export interface HashtagDmState extends EntityState<HashtagDm, string> {
	loadingStatus: LoadingStatus;
	error?: string | null;
}

export const HashtagDmAdapter = createEntityAdapter({
	selectId: (channel: HashtagDm) => channel.channel_id || ''
});

type fetchHashtagDmArgs = {
	userIds: string[];
	limit?: number;
	directId: string;
	noCache?: boolean;
};

export const fetchHashtagDmCached = memoizeAndTrack(
	async (mezon: MezonValueContext, userIds: string[]) => {
		const response = await mezon.client.hashtagDMList(mezon.session, userIds, 500);
		return { ...response, time: Date.now() };
	},
	{
		promise: true,
		maxAge: 1000 * 60 * 60,
		normalizer: (args) => {
			const username = args[0]?.session?.username || '';
			return args[1] + username;
		}
	}
);

export const fetchHashtagDm = createAsyncThunk('channels/fetchHashtagDm', async ({ userIds, noCache }: fetchHashtagDmArgs, thunkAPI) => {
	try {
		const mezon = await ensureClient(getMezonCtx(thunkAPI));
		if (noCache) {
			fetchHashtagDmCached.delete(mezon, userIds);
		}
		const response = await fetchHashtagDmCached(mezon, userIds);
		if (!response?.hashtag_dm) {
			return [];
		}
		return response.hashtag_dm.map((dm: HashtagDm) => ({
			...dm,
			id: dm.channel_id
		}));
	} catch (error) {
		captureSentryError(error, 'channels/fetchHashtagDm');
		return thunkAPI.rejectWithValue(error);
	}
});

export const initialHashtagDmState: HashtagDmState = HashtagDmAdapter.getInitialState({
	loadingStatus: 'not loaded',
	error: null
});
export const hashtagDmSlice = createSlice({
	name: 'hashtagdm',
	initialState: initialHashtagDmState,
	reducers: {},
	extraReducers: (builder) => {
		builder
			.addCase(fetchHashtagDm.pending, (state: HashtagDmState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(fetchHashtagDm.fulfilled, (state: HashtagDmState, action) => {
				HashtagDmAdapter.setAll(state, action.payload);
				state.loadingStatus = 'loaded';
			})
			.addCase(fetchHashtagDm.rejected, (state: HashtagDmState, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			});
	}
});

export const hashtagDmReducer = hashtagDmSlice.reducer;

export const hashtagDmActions = { ...hashtagDmSlice.actions, fetchHashtagDm };

const { selectAll, selectEntities, selectById } = HashtagDmAdapter.getSelectors();

export const gethashtagDmState = (rootState: { ['hashtagdm']: HashtagDmState }): HashtagDmState => rootState['hashtagdm'];

export const selectAllHashtagDm = createSelector(gethashtagDmState, selectAll);

export const selectHashtagDmEntities = createSelector(gethashtagDmState, selectEntities);

export const selectHashtagDmById = createSelector([gethashtagDmState, (state, id: string) => id], (state, id) => {
	const hashtag = selectById(state, id);
	return { ...hashtag, id: hashtag?.channel_id || '' };
});
