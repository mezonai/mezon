import { captureSentryError } from '@mezon/logger';
import type { LoadingStatus } from '@mezon/utils';
import type { EntityState } from '@reduxjs/toolkit';
import { createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import type { ApiAuditLog, MezonapiListAuditLog } from 'mezon-js/api.gen';
import type { CacheMetadata } from '../cache-metadata';
import { createApiKey, createCacheMetadata, markApiFirstCalled, shouldForceApiCall } from '../cache-metadata';
import type { MezonValueContext } from '../helpers';
import { ensureSession, getMezonCtx, withRetry } from '../helpers';
import type { RootState } from '../store';

export const AUDIT_LOG_FEATURE_KEY = 'auditlog';
const FETCH_AUDIT_LOG_CACHED_TIME = 1000 * 60 * 60;

export interface AuditLogEntity extends Omit<ApiAuditLog, 'id' | 'channel_id' | 'clan_id' | 'entity_id' | 'user_id'> {
	id: string;
	channel_id?: string;
	clan_id?: string;
	entity_id?: string;
	user_id?: string;
}

export interface IAuditLogState extends EntityState<AuditLogEntity, string> {
	loadingStatus: LoadingStatus;
	error?: string | null;
	auditLogData: Omit<MezonapiListAuditLog, 'logs'> & { logs?: AuditLogEntity[] };
	cache?: CacheMetadata;
}

type getAuditLogListPayload = {
	actionLog: string;
	userId: string;
	clanId: string;
	date_log: string;
	noCache?: boolean;
};

export const auditLogAdapter = createEntityAdapter<AuditLogEntity, string>({
	selectId: (auditLog: AuditLogEntity) => auditLog.id,
	sortComparer: (a: AuditLogEntity, b: AuditLogEntity) => {
		if (a.time_log && b.time_log) {
			return Date.parse(b.time_log) - Date.parse(a.time_log);
		}
		return 0;
	}
});

export const fetchAuditLogCached = async (
	getState: () => RootState,
	mezon: MezonValueContext,
	actionLog: string,
	userId: string,
	clanId: string,
	date_log: string,
	noCache = false
) => {
	const currentState = getState();
	const auditLogState = currentState[AUDIT_LOG_FEATURE_KEY];
	const apiKey = createApiKey('fetchAuditLog', actionLog, userId, clanId, date_log);

	const shouldForceCall = shouldForceApiCall(apiKey, auditLogState.cache, noCache);

	if (!shouldForceCall) {
		return {
			...auditLogState.auditLogData,
			fromCache: true,
			time: auditLogState.cache?.lastFetched || Date.now()
		};
	}

	const response = await withRetry(() => mezon.client.listAuditLog(mezon.session, actionLog, BigInt(userId), BigInt(clanId), date_log), {
		maxRetries: 3,
		initialDelay: 1000,
		scope: 'audit-log'
	});

	markApiFirstCalled(apiKey);

	return {
		...response,
		fromCache: false,
		time: Date.now()
	};
};

export const auditLogList = createAsyncThunk(
	'auditLog/auditLogList',
	async ({ actionLog, userId, clanId, date_log, noCache }: getAuditLogListPayload, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));

			const response = await fetchAuditLogCached(
				thunkAPI.getState as () => RootState,
				mezon,
				actionLog,
				userId,
				clanId,
				date_log,
				Boolean(noCache)
			);

			if (!response) {
				return thunkAPI.rejectWithValue('Invalid auditLogList');
			}

			if (response.fromCache) {
				return {
					fromCache: true
				};
			}

			return response;
		} catch (error) {
			captureSentryError(error, 'auditLog/auditLogList');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const initialAuditLogState: IAuditLogState = auditLogAdapter.getInitialState({
	loadingStatus: 'not loaded',
	error: null,
	auditLogData: {}
});

export const auditLogSlice = createSlice({
	name: AUDIT_LOG_FEATURE_KEY,
	initialState: initialAuditLogState,
	reducers: {
		updateCache: (state) => {
			state.cache = createCacheMetadata(FETCH_AUDIT_LOG_CACHED_TIME);
		}
	},
	extraReducers: (builder) => {
		builder
			.addCase(auditLogList.pending, (state: IAuditLogState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(auditLogList.fulfilled, (state: IAuditLogState, action) => {
				if (action.payload.fromCache) {
					state.loadingStatus = 'loaded';
					return;
				}

				const auditLogData = action.payload as MezonapiListAuditLog;

				const mappedLogs = auditLogData.logs?.map(
					(log): AuditLogEntity => ({
						...log,
						id: log.id?.toString() || '',
						channel_id: log.channel_id?.toString(),
						clan_id: log.clan_id?.toString(),
						entity_id: log.entity_id?.toString(),
						user_id: log.user_id?.toString()
					})
				);

				state.auditLogData = {
					...auditLogData,
					logs: mappedLogs
				};
				state.cache = createCacheMetadata(FETCH_AUDIT_LOG_CACHED_TIME);
				state.loadingStatus = 'loaded';
			})
			.addCase(auditLogList.rejected, (state: IAuditLogState, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			});
	}
});

export const auditLogReducer = auditLogSlice.reducer;

export const auditLogActions = {
	...auditLogSlice.actions,
	auditLogList
};

const { selectAll } = auditLogAdapter.getSelectors();
export const getAuditLogState = (rootState: { [AUDIT_LOG_FEATURE_KEY]: IAuditLogState }): IAuditLogState => rootState[AUDIT_LOG_FEATURE_KEY];
export const selectAllAuditLog = createSelector(getAuditLogState, selectAll);
export const selectAllAuditLogData = createSelector(getAuditLogState, (state) => {
	return state.auditLogData.logs || [];
});
export const selectTotalCountAuditLog = createSelector(getAuditLogState, (state) => {
	return state.auditLogData.total_count || 0;
});
