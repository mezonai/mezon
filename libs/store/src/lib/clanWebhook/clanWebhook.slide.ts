import { captureSentryError } from '@mezon/logger';
import { LoadingStatus } from '@mezon/utils';
import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import memoizee from 'memoizee';
import { ApiClanWebhook, ApiGenerateClanWebhookRequest, MezonUpdateClanWebhookByIdBody } from 'mezon-js/api.gen';
import { toast } from 'react-toastify';
import { MezonValueContext, ensureSession, getMezonCtx } from '../helpers';

export const INTEGRATION_CLAN_WEBHOOK = 'integrationClanWebhook';

export interface IClanWebHookState {
	loadingStatus: LoadingStatus;
	errors?: string | null;
	clanWebhookList?: Array<ApiClanWebhook>;
}

export interface IFetchClanWebhooksArg {
	clanId: string;
	noCache?: boolean;
}

export const initialClanWebhookState: IClanWebHookState = {
	loadingStatus: 'not loaded',
	errors: null,
	clanWebhookList: []
};

const LIST_CLAN_WEBHOOK_CACHED_TIME = 1000 * 60 * 60;

const fetchClanWebhooksCached = memoizee((mezon: MezonValueContext, clanId: string) => mezon.client.listClanWebhook(mezon.session, clanId), {
	promise: true,
	maxAge: LIST_CLAN_WEBHOOK_CACHED_TIME,
	normalizer: (args) => {
		return args[1] + args[0].session.username;
	}
});

export const fetchClanWebhooks = createAsyncThunk('integration/fetchClanWebhooks', async ({ clanId, noCache }: IFetchClanWebhooksArg, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		if (noCache) {
			fetchClanWebhooksCached.delete(mezon, clanId);
		}
		const response = await fetchClanWebhooksCached(mezon, clanId);
		return response.list_clan_webhooks;
	} catch (error) {
		captureSentryError(error, 'integration/fetchClanWebhooks');
		return thunkAPI.rejectWithValue(error);
	}
});

export const generateClanWebhook = createAsyncThunk(
	'integration/createClanWebhook',
	async (data: { request: ApiGenerateClanWebhookRequest; clanId: string }, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const response = await mezon.client.generateClanWebhook(mezon.session, data.request);

			if (response) {
				thunkAPI.dispatch(fetchClanWebhooks({ clanId: data.clanId, noCache: true }));
				toast.success(`Generated ${response.webhook_name} successfully !`);
			} else {
				thunkAPI.rejectWithValue({});
			}
		} catch (error) {
			captureSentryError(error, 'integration/createClanWebhook');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const deleteClanWebhookById = createAsyncThunk(
	'integration/deleteClanWebhook',
	async (data: { webhook: ApiClanWebhook; clanId: string }, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const response = await mezon.client.deleteClanWebhookById(mezon.session, data.webhook.id as string, data.clanId);
			if (response) {
				thunkAPI.dispatch(fetchClanWebhooks({ clanId: data.clanId, noCache: true }));
				return data.webhook;
			}
			thunkAPI.rejectWithValue({});
		} catch (error) {
			captureSentryError(error, 'integration/deleteClanWebhook');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const updateClanWebhookById = createAsyncThunk(
	'integration/updateClanWebhook',
	async (data: { request: MezonUpdateClanWebhookByIdBody; webhookId: string | undefined; clanId: string }, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const response = await mezon.client.updateClanWebhookById(mezon.session, data.webhookId as string, data.request);
			if (response) {
				thunkAPI.dispatch(fetchClanWebhooks({ clanId: data.clanId, noCache: true }));
			}
		} catch (error) {
			captureSentryError(error, 'integration/updateClanWebhook');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const integrationClanWebhookSlice = createSlice({
	name: INTEGRATION_CLAN_WEBHOOK,
	initialState: initialClanWebhookState,
	reducers: {},
	extraReducers(builder) {
		builder
			.addCase(fetchClanWebhooks.pending, (state) => {
				state.loadingStatus = 'loading';
			})
			.addCase(fetchClanWebhooks.fulfilled, (state, action) => {
				state.loadingStatus = 'loaded';
				state.clanWebhookList = action.payload;
			})
			.addCase(fetchClanWebhooks.rejected, (state) => {
				state.loadingStatus = 'error';
			});
	}
});

export const getClanWebHookState = (rootState: { [INTEGRATION_CLAN_WEBHOOK]: IClanWebHookState }): IClanWebHookState =>
	rootState[INTEGRATION_CLAN_WEBHOOK];
export const selectAllClanWebhooks = createSelector(getClanWebHookState, (state) => state?.clanWebhookList || []);
export const integrationClanWebhookReducer = integrationClanWebhookSlice.reducer;
