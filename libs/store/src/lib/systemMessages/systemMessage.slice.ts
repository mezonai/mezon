import { captureSentryError } from '@mezon/logger';
import { FOR_15_MINUTES_SEC, type IPSystemMessage, type LoadingStatus } from '@mezon/utils';
import type { EntityState, PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import type { ApiSystemMessage, ApiSystemMessageRequest, ApiSystemMessagesList, MezonUpdateSystemMessageBody } from 'mezon-js/api.gen';
import type { CacheMetadata } from '../cache-metadata';
import { createApiKey, createCacheMetadata, markApiFirstCalled, shouldForceApiCall } from '../cache-metadata';
import type { MezonValueContext } from '../helpers';
import { ensureSession, getMezonCtx } from '../helpers';
import type { RootState } from '../store';

export const SYSTEM_MESSAGE_FEATURE_KEY = 'systemMessages';

export interface SystemMessageEntity extends Omit<IPSystemMessage, 'id'> {
	id: string;
}

export interface SystemMessageState extends EntityState<SystemMessageEntity, string> {
	loadingStatus: LoadingStatus;
	error?: string | null;
	jumpSystemMessageId: string;
	byClans: Record<
		string,
		{
			systemMessage: ApiSystemMessage;
			cache?: CacheMetadata;
		}
	>;
}

export const systemMessageAdapter = createEntityAdapter({
	selectId: (mes: SystemMessageEntity) => mes.id || ''
});

const getInitialClanState = () => ({
	systemMessage: {}
});

export const initialSystemMessageState: SystemMessageState = systemMessageAdapter.getInitialState({
	loadingStatus: 'not loaded',
	error: null,
	jumpSystemMessageId: '',
	byClans: {}
});

export const fetchSystemMessageByClanCached = async (getState: () => RootState, mezon: MezonValueContext, clanId: string, noCache = false) => {
	const currentState = getState();
	const clanData = currentState[SYSTEM_MESSAGE_FEATURE_KEY].byClans[clanId];
	const apiKey = createApiKey('fetchSystemMessageByClan', clanId);

	const shouldForceCall = shouldForceApiCall(apiKey, clanData?.cache, noCache);

	if (!shouldForceCall) {
		return {
			...clanData.systemMessage,
			fromCache: true,
			time: clanData.cache?.lastFetched || Date.now()
		};
	}

	const response = await mezon.client.getSystemMessageByClanId(mezon.session, BigInt(clanId));

	markApiFirstCalled(apiKey);

	return {
		...response,
		fromCache: false,
		time: Date.now()
	};
};

export const fetchSystemMessages = createAsyncThunk('systemMessages/fetchSystemMessages', async (_, thunkAPI) => {
	const mezon = await ensureSession(getMezonCtx(thunkAPI));
	const response: ApiSystemMessagesList = await mezon.client.getSystemMessagesList(mezon.session);
	return response.system_messages_list;
});

export const fetchSystemMessageByClanId = createAsyncThunk(
	'systemMessages/fetchSystemMessageByClanId',
	async ({ clanId, noCache = false }: { clanId: string; noCache?: boolean }, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));

			const response = await fetchSystemMessageByClanCached(thunkAPI.getState as () => RootState, mezon, clanId, Boolean(noCache));

			if (!response) {
				return thunkAPI.rejectWithValue('Invalid fetchSystemMessageByClanId');
			}

			return { ...response, clanId };
		} catch (error) {
			captureSentryError(error, 'systemMessages/fetchSystemMessageByClanId');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const createSystemMessage = createAsyncThunk('systemMessages/createSystemMessage', async (newMessage: ApiSystemMessageRequest, thunkAPI) => {
	const mezon = await ensureSession(getMezonCtx(thunkAPI));
	const response: ApiSystemMessage = await mezon.client.createSystemMessage(mezon.session, newMessage);
	return response;
});

export interface IUpdateSystemMessage {
	clanId: string;
	newMessage: MezonUpdateSystemMessageBody;
	cachedMessage?: ApiSystemMessage;
}
export const updateSystemMessage = createAsyncThunk(
	'systemMessages/updateSystemMessage',
	async ({ clanId, newMessage, cachedMessage }: IUpdateSystemMessage, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const response: ApiSystemMessage = await mezon.client.updateSystemMessage(mezon.session, BigInt(clanId), newMessage);
			if (response) {
				// Force refresh cache after update
				thunkAPI.dispatch(fetchSystemMessageByClanId({ clanId, noCache: true }));
				return cachedMessage || response;
			}
			return response;
		} catch (error) {
			captureSentryError(error, 'systemMessages/updateSystemMessage');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const deleteSystemMessage = createAsyncThunk('systemMessages/deleteSystemMessage', async (clanId: string, thunkAPI) => {
	const mezon = await ensureSession(getMezonCtx(thunkAPI));
	await mezon.client.deleteSystemMessage(mezon.session, BigInt(clanId));
	thunkAPI.dispatch(fetchSystemMessages());
	return clanId;
});

export const systemMessageSlice = createSlice({
	name: 'systemMessages',
	initialState: initialSystemMessageState,
	reducers: {
		add: systemMessageAdapter.addOne,
		addMany: systemMessageAdapter.addMany,
		remove: systemMessageAdapter.removeOne,
		updateCache: (state, action: PayloadAction<{ clanId: string }>) => {
			const { clanId } = action.payload;
			if (!state.byClans[clanId]) {
				state.byClans[clanId] = getInitialClanState();
			}
			state.byClans[clanId].cache = createCacheMetadata(FOR_15_MINUTES_SEC);
		}
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchSystemMessages.pending, (state: SystemMessageState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(fetchSystemMessages.fulfilled, (state: SystemMessageState, action: PayloadAction<ApiSystemMessage[] | undefined>) => {
				if (action.payload) {
					const entities: SystemMessageEntity[] = action.payload.map((msg) => ({
						...msg,
						id: String(msg.id || '')
					}));
					systemMessageAdapter.setAll(state, entities);
				}
				state.loadingStatus = 'loaded';
			})
			.addCase(fetchSystemMessages.rejected, (state: SystemMessageState, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message ?? null;
			})
			.addCase(fetchSystemMessageByClanId.pending, (state: SystemMessageState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(
				fetchSystemMessageByClanId.fulfilled,
				(state: SystemMessageState, action: PayloadAction<ApiSystemMessage & { clanId: string; fromCache?: boolean }>) => {
					const { clanId, fromCache, ...systemMessageData } = action.payload;

					if (!state.byClans[clanId]) {
						state.byClans[clanId] = getInitialClanState();
					}

					if (!fromCache) {
						if (systemMessageData.id) {
							systemMessageAdapter.upsertOne(state, { ...systemMessageData, id: String(systemMessageData.id) });
						}
						state.byClans[clanId].systemMessage = systemMessageData;
						state.byClans[clanId].cache = createCacheMetadata(FOR_15_MINUTES_SEC);
					}

					state.loadingStatus = 'loaded';
				}
			)
			.addCase(fetchSystemMessageByClanId.rejected, (state: SystemMessageState, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message ?? null;
			})
			.addCase(createSystemMessage.fulfilled, (state: SystemMessageState, action: PayloadAction<ApiSystemMessage>) => {
				const payload = action.payload;
				if (payload?.id) {
					const entity: SystemMessageEntity = {
						...payload,
						id: String(payload.id)
					};
					systemMessageAdapter.addOne(state, entity);
				}
			})
			.addCase(updateSystemMessage.fulfilled, (state: SystemMessageState, action: PayloadAction<ApiSystemMessage>) => {
				const payload = action.payload;
				if (payload?.id) {
					const entity: SystemMessageEntity = {
						...payload,
						id: String(payload.id)
					};
					systemMessageAdapter.upsertOne(state, entity);
				}
			})
			.addCase(deleteSystemMessage.fulfilled, (state: SystemMessageState, action: PayloadAction<string>) => {
				const clanId = action.payload;
				if (state.byClans[clanId]?.systemMessage?.id) {
					systemMessageAdapter.removeOne(state, String(state.byClans[clanId].systemMessage.id));
					delete state.byClans[clanId];
				}
			});
	}
});

export const getSystemMessageState = (rootState: { [SYSTEM_MESSAGE_FEATURE_KEY]: SystemMessageState }): SystemMessageState =>
	rootState[SYSTEM_MESSAGE_FEATURE_KEY];
export const systemMessageReducer = systemMessageSlice.reducer;

export const selectClanSystemMessage = createSelector(
	[getSystemMessageState, (state: RootState) => state.clans.currentClanId as string],
	(state, clanId) => state.byClans[clanId]?.systemMessage
);

export const systemMessageActions = {
	...systemMessageSlice.actions,
	fetchSystemMessageByClanId,
	fetchSystemMessages,
	createSystemMessage,
	updateSystemMessage,
	deleteSystemMessage
};
