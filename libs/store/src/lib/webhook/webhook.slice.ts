import { captureSentryError } from '@mezon/logger';
import i18n from '@mezon/translations';
import type { LoadingStatus } from '@mezon/utils';
import type { EntityState, PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import type { ApiWebhook, ApiWebhookCreateRequest, MezonUpdateWebhookByIdBody } from 'mezon-js/api.gen';
import { toast } from 'react-toastify';
import type { MezonValueContext } from '../helpers';
import { ensureSession, getMezonCtx } from '../helpers';

export const INTEGRATION_WEBHOOK = 'integrationWebhook';

export interface IWebhook extends Omit<ApiWebhook, 'id' | 'channel_id' | 'creator_id' | 'clan_id'> {
	channel_id?: string;
	creator_id?: string;
	id?: string;
	clan_id?: string;
}

export interface IWebHookState {
	loadingStatus: LoadingStatus;
	errors?: string | null;
	webhookList: Record<
		string,
		EntityState<IWebhook, string> & {
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
	selectId: (webhook: IWebhook) => String(webhook.id || '')
});

export const initialWebhookState: IWebHookState = webhookAdapter.getInitialState({
	loadingStatus: 'not loaded',
	errors: null,
	webhookList: {}
});

const fetchWebhooksCached = async (mezon: MezonValueContext, channelId: string, clanId: string) => {
	const response = await mezon.client.listWebhookByChannelId(mezon.session, BigInt(channelId), BigInt(clanId));
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
			return { webhooks: response.webhooks, clanId };
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
				thunkAPI.dispatch(fetchWebhooks({ channelId: data?.isClanSetting ? '0' : data?.channelId, clanId: data.clanId, noCache: true }));
				toast.success(i18n.t('integrations:toast.generateSuccess', { name: response.hook_name }));
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
	async (data: { webhook: IWebhook; clanId: string; channelId: string; isClanSetting?: boolean }, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const body = {
				channel_id: BigInt(data.channelId),
				clan_id: BigInt(data.clanId)
			};
			if (!data.webhook.id) {
				return thunkAPI.rejectWithValue({ error: 'Webhook ID is required' });
			}
			const response = await mezon.client.deleteWebhookById(mezon.session, BigInt(data.webhook.id), body);

			if (!response) {
				return thunkAPI.rejectWithValue({});
			}
			toast.success(i18n.t('integrations:toast.deleteSuccess', { name: data.webhook.webhook_name }));
			thunkAPI.dispatch(webhookActions.removeOneWebhook({ clanId: data.clanId, webhookId: String(data.webhook.id || '') }));
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
			if (!data.webhookId) {
				return thunkAPI.rejectWithValue({ error: 'Webhook ID is required' });
			}
			await mezon.client.updateWebhookById(mezon.session, BigInt(data.webhookId), data.request);
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

			const clanIdStr = String(clan_id);
			if (!state.webhookList[clanIdStr]) {
				state.webhookList[clanIdStr] = webhookAdapter.getInitialState({
					id: clanIdStr,
					channel_id: String(webhook.channel_id),
					clan_id: String(webhook.clan_id),
					creator_id: String(webhook.creator_id)
				});
			}
			state.webhookList[clanIdStr] = webhookAdapter.upsertOne(state.webhookList[clanIdStr], {
				...webhook,
				channel_id: String(webhook.channel_id),
				clan_id: String(webhook.clan_id),
				creator_id: String(webhook.creator_id),
				id: String(webhook.id)
			});
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

					const updatedChannelWebhook = webhookAdapter.setAll(
						state.webhookList[clanId],
						webhooks.map((webhook) => ({
							...webhook,
							channel_id: String(webhook.channel_id),
							clan_id: String(webhook.clan_id),
							creator_id: String(webhook.creator_id),
							id: String(webhook.id)
						}))
					);
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
