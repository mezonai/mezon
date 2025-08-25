import { captureSentryError } from '@mezon/logger';
import { LoadingStatus } from '@mezon/utils';
import { createAsyncThunk, createEntityAdapter, createSelector, createSlice, EntityState, PayloadAction } from '@reduxjs/toolkit';
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

const fetchWebhooksCached = async (mezon: MezonValueContext, channelId: string, clanId: string) => {
	const response = await mezon.client.listWebhookByChannelId(mezon.session, channelId, clanId);
	return { ...response, time: Date.now() };
};

export const fetchWebhooks = createAsyncThunk(
	'integration/fetchWebhooks',
	async ({ channelId, clanId, noCache }: IFetchWebhooksByChannelIdArg, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));

			const response = await fetchWebhooksCached(mezon, channelId, clanId);

			if (Date.now() - response.time > 100) {
				return {
					fromCache: true
				};
			}
			return { webhooks: response.webhooks, clanId: clanId };
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
			thunkAPI.dispatch(webhookActions.removeOneWebhook({ clanId: data.webhook.clan_id || '', webhookId: data.webhook.id || '' }));
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
			const { clan_id } = webhook;

			if (!clan_id) return;

			if (!state.webhookList[clan_id]) {
				state.webhookList[clan_id] = webhookAdapter.getInitialState({
					id: clan_id
				});
			}
			state.webhookList[clan_id] = webhookAdapter.upsertOne(state.webhookList[clan_id], webhook);
		},
		removeOneWebhook: (state, action: PayloadAction<{ clanId: string; webhookId: string }>) => {
			const { clanId, webhookId } = action.payload;
			if (state.webhookList[clanId]) {
				webhookAdapter.removeOne(state.webhookList[clanId], webhookId);
			}
		}
	},
	extraReducers(builder) {
		builder
			.addCase(fetchWebhooks.pending, (state) => {
				state.loadingStatus = 'loading';
			})
			.addCase(fetchWebhooks.fulfilled, (state, action: PayloadAction<{ clanId?: string; fromCache?: boolean; webhooks?: ApiWebhook[] }>) => {
				state.loadingStatus = 'loaded';
				const { webhooks, fromCache, clanId } = action.payload;
				if (fromCache) return;
				if (webhooks && clanId) {
					if (!state.webhookList[clanId]) {
						state.webhookList[clanId] = webhookAdapter.getInitialState({
							id: clanId
						});
					}

					const updatedChannelWebhook = webhookAdapter.setAll(state.webhookList[clanId], webhooks);
					state.webhookList[clanId] = updatedChannelWebhook;
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

const { selectAll } = webhookAdapter.getSelectors();
export const getChannelIdWebhookAsSecondParam = (_: unknown, channelId: string) => channelId;
export const getChannelIdWebhookAsThirdParam = (_: unknown, __: unknown, clanId: string) => clanId;

export const selectWebhooksByChannelId = createSelector(
	[getWebHookState, getChannelIdWebhookAsSecondParam, getChannelIdWebhookAsThirdParam],
	(state, channelId, clanId) => {
		if (!state.webhookList[clanId]) return [];

		if (channelId === '0') {
			return selectAll(state.webhookList[clanId]);
		}
		return selectAll(state.webhookList?.[clanId] || []).filter((entity) => entity.channel_id === channelId);
	}
);
