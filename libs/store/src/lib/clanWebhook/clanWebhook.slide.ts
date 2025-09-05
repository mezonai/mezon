import { captureSentryError } from '@mezon/logger';
import { LoadingStatus } from '@mezon/utils';
import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import { ApiClanWebhook, ApiGenerateClanWebhookRequest, MezonUpdateClanWebhookByIdBody } from 'mezon-js/api.gen';
import { toast } from 'react-toastify';
import { CacheMetadata, createApiKey, createCacheMetadata, markApiFirstCalled, shouldForceApiCall } from '../cache-metadata';
import { MezonValueContext, ensureSession, getMezonCtx } from '../helpers';
import { RootState } from '../store';

export const INTEGRATION_CLAN_WEBHOOK = 'integrationClanWebhook';

export interface IClanWebHookState {
	loadingStatus: LoadingStatus;
	errors?: string | null;
	clanWebhookList?: Array<ApiClanWebhook>;
	byClan: Record<
		string,
		{
			webhooks?: Array<ApiClanWebhook>;
			cache?: CacheMetadata;
		}
	>;
}

export interface IFetchClanWebhooksArg {
	clanId: string;
	noCache?: boolean;
}

export const initialClanWebhookState: IClanWebHookState = {
	loadingStatus: 'not loaded',
	errors: null,
	clanWebhookList: [],
	byClan: {}
};

const getInitialClanState = () => ({
	webhooks: []
});

export const fetchClanWebhooksCached = async (getState: () => RootState, mezon: MezonValueContext, clanId: string, noCache = false) => {
	const currentState = getState();
	const clanWebhookState = currentState[INTEGRATION_CLAN_WEBHOOK];
	const clanData = clanWebhookState.byClan[clanId] || getInitialClanState();

	const apiKey = createApiKey('fetchClanWebhooks', clanId, mezon.session.username || '');

	const shouldForceCall = shouldForceApiCall(apiKey, clanData.cache, noCache);

	if (!shouldForceCall && clanData.webhooks?.length) {
		return {
			list_clan_webhooks: clanData.webhooks,
			fromCache: true,
			time: clanData.cache?.lastFetched || Date.now()
		};
	}

	const response = await mezon.client.listClanWebhook(mezon.session, clanId);

	markApiFirstCalled(apiKey);

	return {
		...response,
		fromCache: false,
		time: Date.now()
	};
};

export const fetchClanWebhooks = createAsyncThunk('integration/fetchClanWebhooks', async ({ clanId, noCache }: IFetchClanWebhooksArg, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		const response = await fetchClanWebhooksCached(thunkAPI.getState as () => RootState, mezon, clanId, Boolean(noCache));
		return {
			clanId,
			webhooks: response.list_clan_webhooks,
			fromCache: response.fromCache
		};
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
				toast.success(`Deleted ${data.webhook.webhook_name} successfully !`);
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
				const { clanId, webhooks, fromCache } = action.payload;

				state.loadingStatus = 'loaded';

				if (!fromCache) {
					state.clanWebhookList = webhooks;

					if (!state.byClan[clanId]) {
						state.byClan[clanId] = getInitialClanState();
					}

					state.byClan[clanId].webhooks = webhooks;
					state.byClan[clanId].cache = createCacheMetadata();
				}
			})
			.addCase(fetchClanWebhooks.rejected, (state) => {
				state.loadingStatus = 'error';
			});
	}
});

export const getClanWebHookState = (rootState: { [INTEGRATION_CLAN_WEBHOOK]: IClanWebHookState }): IClanWebHookState =>
	rootState[INTEGRATION_CLAN_WEBHOOK];
export const selectAllClanWebhooks = createSelector(getClanWebHookState, (state) => state?.clanWebhookList || []);

export const selectClanWebhooksByClanId = createSelector(
	[getClanWebHookState, (state: RootState, clanId: string) => clanId],
	(state, clanId) => state?.byClan[clanId]?.webhooks || []
);

export const selectClanWebhooksById = createSelector(
	[getClanWebHookState, (state: RootState, webhookId: string) => webhookId],
	(state, webhookId) => state?.clanWebhookList?.find((webhook) => webhook.id === webhookId) || null
);

export const integrationClanWebhookReducer = integrationClanWebhookSlice.reducer;
