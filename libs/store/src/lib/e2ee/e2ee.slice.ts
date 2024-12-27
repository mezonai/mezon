import { captureSentryError } from '@mezon/logger';
import { LoadingStatus } from '@mezon/utils';
import { EntityState, GetThunkAPI, createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import { ApiPubKey } from 'mezon-js/api.gen';
import { selectDirectById } from '../direct/direct.slice';
import { MezonValueContext, ensureSession, getMezonCtx } from '../helpers';
import { memoizeAndTrack } from '../memoize';
import { RootState } from '../store';

export const E2EE_FEATURE_KEY = 'e2ee';

export interface PubKeyEntity {
	PK: ApiPubKey;
	id: string;
}

export interface E2eeState extends EntityState<PubKeyEntity, string> {
	loadingStatus: LoadingStatus;
	error?: string | null;
	openModalE2ee: boolean;
	isShowBtnPin: boolean;
}

export interface E2eeRootState {
	[E2EE_FEATURE_KEY]: E2eeState;
}

export const e2eeAdapter = createEntityAdapter<PubKeyEntity>();

export const pushPubKey = createAsyncThunk('e2ee/pushPubKey', async (body: ApiPubKey, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		const response = await mezon.client.pushPubKey(mezon.session, body);
		return response;
	} catch (error) {
		captureSentryError(error, 'e2ee/pushPubKey');
		return thunkAPI.rejectWithValue(error);
	}
});

export const getPubKeys = createAsyncThunk(
	'e2ee/getPubKeys',
	async (
		{
			userIds
		}: {
			userIds: Array<string>;
			noCache?: boolean;
		},
		thunkAPI
	) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const response = await fetchPubkeys(mezon, userIds);
			return response;
		} catch (error) {
			captureSentryError(error, 'e2ee/getPubKeys');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const initialE2eeState: E2eeState = e2eeAdapter.getInitialState({
	loadingStatus: 'not loaded',
	socketStatus: 'not loaded',
	error: null,
	openModalE2ee: false,
	isShowBtnPin: false
});

export const e2eeSlice = createSlice({
	name: E2EE_FEATURE_KEY,
	initialState: initialE2eeState,
	reducers: {
		setOpenModalE2ee(state, action) {
			state.openModalE2ee = action.payload;
		},
		setIsShowBtnPin(state, action) {
			state.isShowBtnPin = action.payload;
		}
	},
	extraReducers: (builder) => {
		builder
			.addCase(getPubKeys.pending, (state: E2eeState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(getPubKeys.fulfilled, (state: E2eeState, action) => {
				state.loadingStatus = 'loaded';
				const pubKeys =
					action.payload.pub_keys?.map((pk: { PK?: ApiPubKey; user_id?: string }) => ({
						id: pk.user_id || '',
						PK: pk.PK || {}
					})) || [];
				e2eeAdapter.upsertMany(state, pubKeys);
			})
			.addCase(getPubKeys.rejected, (state: E2eeState, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			});
	}
});

export const fetchPubkeys = memoizeAndTrack(
	async (mezon: MezonValueContext, userIds) => {
		const response = await mezon.client.getPubKeys(mezon.session, userIds);
		return { ...response, time: Date.now() };
	},
	{
		promise: true,
		maxAge: 30000,
		normalizer: (args) => {
			return args[1] + args[0].session.username;
		}
	}
);

export const e2eeReducer = e2eeSlice.reducer;

export const e2eeActions = {
	...e2eeSlice.actions,
	getPubKeys,
	pushPubKey
};

const { selectEntities } = e2eeAdapter.getSelectors();

export const getE2eeState = (rootState: { [E2EE_FEATURE_KEY]: E2eeState }): E2eeState => rootState[E2EE_FEATURE_KEY];
export const selectE2eeMessageEntities = createSelector(getE2eeState, selectEntities);
export const selectE2eeByUserId = createSelector([selectE2eeMessageEntities, (_, userId) => userId], (entities, userId) => entities[userId]);

export const selectE2eeByUserIds = createSelector([selectE2eeMessageEntities, (_, userIds: string[]) => userIds], (entities, userIds) => {
	return userIds.map((userId) => entities[userId]);
});

const isEnableE2EE = (enableE2ee: boolean | undefined, clanId: string) => enableE2ee && (clanId === '0' || !clanId);

export const checkE2EE = (clanId: string, channelId: string, thunkAPI: GetThunkAPI<unknown>) => {
	const state = thunkAPI.getState() as RootState;
	const currentDM = selectDirectById(state, channelId);
	const enableE2ee = currentDM?.e2ee === 1;
	return isEnableE2EE(enableE2ee, clanId);
};

export const selectOpenModalE2ee = createSelector(getE2eeState, (state) => state.openModalE2ee);

export const selectIsShowBtnPin = createSelector(getE2eeState, (state) => state.isShowBtnPin);
