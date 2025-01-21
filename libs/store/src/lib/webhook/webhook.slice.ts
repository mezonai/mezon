import { captureSentryError } from '@mezon/logger';
import { LoadingStatus } from '@mezon/utils';
import { createAsyncThunk, createEntityAdapter, createSelector, createSlice, EntityState, PayloadAction } from '@reduxjs/toolkit';
import memoizee from 'memoizee';
import { ApiWebhook, ApiWebhookCreateRequest, MezonUpdateWebhookByIdBody } from 'mezon-js/api.gen';
import { toast } from 'react-toastify';
import { ensureSession, getMezonCtx, MezonValueContext } from '../helpers';

export const INTEGRATION_WEBHOOK = 'integrationWebhook';

export interface IWebHookState {
	loadingStatus: LoadingStatus;
	errors?: string | null;
	webhookList: Record<
		string,
		EntityState<ApiWebhook, string> & {
			id: string;
		}
	>;
}

export interface IFetchWebhooksByChannelIdArg {
	channelId: string;
	clanId: string;
	noCache?: boolean;
}

export const webhookAdapter = createEntityAdapter({
	selectId: (webhook: ApiWebhook) => webhook.id || ''
});

export const initialWebhookState: IWebHookState = webhookAdapter.getInitialState({
	loadingStatus: 'not loaded',
	errors: null,
	webhookList: {}
});

const LIST_WEBHOOK_CACHED_TIME = 1000 * 60 * 60;

const fetchWebhooksCached = memoizee(
	async (mezon: MezonValueContext, channelId: string, clanId: string) => {
		const response = await mezon.client.listWebhookByChannelId(mezon.session, channelId, clanId);
		return { ...response, time: Date.now() };
	},
	{
		promise: true,
		maxAge: LIST_WEBHOOK_CACHED_TIME,
		normalizer: (args) => {
			return args[2] + args[1] + args[0].session.username;
		}
	}
);

export const fetchWebhooks = createAsyncThunk(
	'integration/fetchWebhooks',
	async ({ channelId, clanId, noCache }: IFetchWebhooksByChannelIdArg, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			if (noCache) {
				fetchWebhooksCached.clear(mezon, channelId, clanId);
			}
			const response = await fetchWebhooksCached(mezon, channelId, clanId);
			if (Date.now() - response.time > 100) {
				return {
					fromCache: true
				};
			}
			return response.webhooks;
		} catch (error) {
			captureSentryError(error, 'integration/fetchWebhooks');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const generateWebhook = createAsyncThunk(
	'integration/createWebhook',
	async (data: { request: ApiWebhookCreateRequest; channelId: string; clanId: string; isClanSetting?: boolean }, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const response = await mezon.client.generateWebhookLink(mezon.session, data.request);
			if (response) {
				toast.success(`Generated ${response.hook_name} successfully !`);
			} else {
				thunkAPI.rejectWithValue({});
			}
		} catch (error) {
			captureSentryError(error, 'integration/createWebhook');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const deleteWebhookById = createAsyncThunk(
	'integration/deleteWebhook',
	async (data: { webhook: ApiWebhook; clanId: string; channelId: string; isClanSetting?: boolean }, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const body = {
				channel_id: data.channelId,
				clan_id: data.clanId
			};
			const response = await mezon.client.deleteWebhookById(mezon.session, data.webhook.id as string, body);
			if (!response) {
				thunkAPI.rejectWithValue({});
			}
		} catch (error) {
			captureSentryError(error, 'integration/deleteWebhook');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const updateWebhookBySpecificId = createAsyncThunk(
	'integration/editWebhook',
	async (
		data: { request: MezonUpdateWebhookByIdBody; webhookId: string | undefined; channelId: string; clanId: string; isClanSetting?: boolean },
		thunkAPI
	) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			await mezon.client.updateWebhookById(mezon.session, data.webhookId as string, data.request);
		} catch (error) {
			captureSentryError(error, 'integration/editWebhook');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const integrationWebhookSlice = createSlice({
	name: INTEGRATION_WEBHOOK,
	initialState: initialWebhookState,
	reducers: {
		upsertWebhook: (state, action: PayloadAction<ApiWebhook>) => {
			const webhook = action.payload;
			const { channel_id } = webhook;

			if (!channel_id) return;

			if (!state.webhookList[channel_id]) {
				state.webhookList[channel_id] = webhookAdapter.getInitialState({
					id: channel_id
				});
			}
			webhookAdapter.upsertOne(state.webhookList[channel_id], webhook);
		},
		removeOneWebhook: (state, action: PayloadAction<{ channelId: string; webhookId: string }>) => {
			const { channelId, webhookId } = action.payload;
			if (state.webhookList[channelId]) {
				webhookAdapter.removeOne(state.webhookList[channelId], webhookId);
			}
		}
	},
	extraReducers(builder) {
		builder
			.addCase(fetchWebhooks.pending, (state) => {
				state.loadingStatus = 'loading';
			})
			.addCase(fetchWebhooks.fulfilled, (state, action: PayloadAction<any>) => {
				state.loadingStatus = 'loaded';
				if (action.payload?.fromCache) return;
				const webhooks: ApiWebhook[] = action.payload;
				if (webhooks) {
					webhooks.forEach((webhook) => {
						const { channel_id } = webhook;
						if (!channel_id) return;

						if (!state.webhookList[channel_id]) {
							state.webhookList[channel_id] = webhookAdapter.getInitialState({
								id: channel_id
							});
						}

						const updatedChannelWebhook = webhookAdapter.setMany(state.webhookList[channel_id], [webhook]);
						state.webhookList[channel_id] = updatedChannelWebhook;
					});
				}
			})
			.addCase(fetchWebhooks.rejected, (state) => {
				state.loadingStatus = 'error';
			});
	}
});
export const webhookActions = {
	...integrationWebhookSlice.actions,
	fetchWebhooks,
	updateWebhookBySpecificId,
	deleteWebhookById,
	generateWebhook
};
export const getWebHookState = (rootState: { [INTEGRATION_WEBHOOK]: IWebHookState }): IWebHookState => rootState[INTEGRATION_WEBHOOK];
export const integrationWebhookReducer = integrationWebhookSlice.reducer;
export const getChannelIdWebhookAsSecondParam = (_: unknown, channelId: string) => channelId;
export const selectWebhooksByChannelId = createSelector([getWebHookState, getChannelIdWebhookAsSecondParam], (state, channelId) => {
	if (channelId === '0') {
		const allEntities = Object.values(state?.webhookList || {}).flatMap((webhookState) => Object.values(webhookState.entities || {}));
		return allEntities.map((entity) => ({
			...entity
		}));
	}

	const entities = state?.webhookList[channelId]?.entities || {};
	return Object.values(entities).map((entity) => ({
		...entity
	}));
});
