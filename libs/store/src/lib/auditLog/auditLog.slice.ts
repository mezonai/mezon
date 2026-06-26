import { captureSentryError } from '@mezon/logger';
import type { LoadingStatus } from '@mezon/utils';
import { actionLogToApiValue } from '@mezon/utils';
import type { EntityState } from '@reduxjs/toolkit';
import { createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import type { ApiAuditLog, MezonapiListAuditLog } from 'mezon-js';
import type { CacheMetadata } from '../cache-metadata';
import { createApiKey, createCacheMetadata, markApiFirstCalled, shouldForceApiCall } from '../cache-metadata';
import type { MezonValueContext } from '../helpers';
import { ensureSession, getMezonCtx, withRetry } from '../helpers';
import type { RootState } from '../store';

export const AUDIT_LOG_FEATURE_KEY = 'auditlog';
const FETCH_AUDIT_LOG_CACHED_TIME = 1000 * 60 * 60;

export interface AuditLogEntity extends ApiAuditLog {
	id: string;
}

export interface IAuditLogState extends EntityState<ApiAuditLog, string> {
	loadingStatus: LoadingStatus;
	error?: string | null;
	auditLogData: MezonapiListAuditLog;
	cache?: CacheMetadata;
	lastFetchKey?: string;
}

type getAuditLogListPayload = {
	actionLog: string;
	userId: string;
	clanId: string;
	date_log: string;
	noCache?: boolean;
};

export const auditLogAdapter = createEntityAdapter({
	selectId: (auditLog: ApiAuditLog) => auditLog.id || '',
	sortComparer: (a: ApiAuditLog, b: ApiAuditLog) => {
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
	const canUseCachedData = !shouldForceApiCall(apiKey, auditLogState.cache, noCache) && auditLogState.lastFetchKey === apiKey;

	if (canUseCachedData) {
		return {
			...auditLogState.auditLogData,
			fromCache: true,
			time: auditLogState.cache?.lastFetched || Date.now()
		};
	}

	const apiActionLog = actionLogToApiValue(actionLog);
	const hasUserFilter = Boolean(userId);
	const hasActionFilter = Boolean(actionLog);
	const apiUserId = hasActionFilter && hasUserFilter ? undefined : userId || undefined;

	const response = await withRetry((session) => mezon.client.listAuditLog(session, apiActionLog, apiUserId, clanId, date_log), {
		maxRetries: 3,
		initialDelay: 1000,
		scope: 'audit-log',
		mezon
	});

	let logs = response?.logs ?? [];
	if (hasActionFilter && hasUserFilter) {
		logs = logs.filter((log) => String(log.user_id) === String(userId));
	}

	markApiFirstCalled(apiKey);

	return {
		...response,
		logs,
		total_count: logs.length,
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
				const { fromCache, time: _time, ...auditLogData } = action.payload;
				const { actionLog, userId, clanId, date_log } = action.meta.arg;
				const apiKey = createApiKey('fetchAuditLog', actionLog, userId, clanId, date_log);

				if (auditLogData.total_count !== undefined || auditLogData.logs !== undefined) {
					state.auditLogData = auditLogData;
				}

				if (!fromCache) {
					state.cache = createCacheMetadata(FETCH_AUDIT_LOG_CACHED_TIME);
					state.lastFetchKey = apiKey;
				}

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
