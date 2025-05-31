import { captureSentryError } from '@mezon/logger';
import { LoadingStatus } from '@mezon/utils';
import { createAsyncThunk, createEntityAdapter, createSelector, createSlice, EntityState, PayloadAction } from '@reduxjs/toolkit';
import { ApiAuditLog, MezonapiListAuditLog } from 'mezon-js/api.gen';
import { ensureSession, getMezonCtx, MezonValueContext } from '../helpers';
import { memoizeAndTrack } from '../memoize';

export const AUDIT_LOG_FEATURE_KEY = 'auditlog';
const FETCH_AUDIT_LOG_CACHED_TIME = 1000 * 60 * 60;

export interface AuditLogEntity extends ApiAuditLog {
	id: string;
}

export interface IAuditLogState extends EntityState<ApiAuditLog, string> {
	loadingStatus: LoadingStatus;
	error?: string | null;
	auditLogData: MezonapiListAuditLog;
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

export const fetchAuditLogCached = memoizeAndTrack(
	async (mezon: MezonValueContext, actionLog: string, userId: string, clanId?: string, date_log?: string) => {
		const response = await mezon.client.listAuditLog(mezon.session, actionLog, userId, clanId, date_log);
		return { ...response, time: Date.now() };
	},
	{
		promise: true,
		maxAge: FETCH_AUDIT_LOG_CACHED_TIME,
		normalizer: (args) => {
			// set default value
			return args[1] + args[2] + args[3] + args[4] + args[0].session.username;
		}
	}
);

export const auditLogList = createAsyncThunk(
	'auditLog/auditLogList',
	async ({ actionLog, userId, clanId, date_log, noCache }: getAuditLogListPayload, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));

			if (noCache) {
				fetchAuditLogCached.delete(mezon, actionLog, userId, clanId, date_log);
			}
			const response = await fetchAuditLogCached(mezon, actionLog, userId, clanId, date_log);
			return response;
		} catch (error) {
			captureSentryError(error, 'attachment/fetchChannelAttachments');
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
	reducers: {},
	extraReducers: (builder) => {
		builder
			.addCase(auditLogList.pending, (state: IAuditLogState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(auditLogList.fulfilled, (state: IAuditLogState, action: PayloadAction<MezonapiListAuditLog>) => {
				state.loadingStatus = 'loaded';
				state.auditLogData = {
					...action.payload,
					total_count: action.payload?.total_count
				};
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

const { selectAll, selectById, selectEntities } = auditLogAdapter.getSelectors();
export const getAuditLogState = (rootState: { [AUDIT_LOG_FEATURE_KEY]: IAuditLogState }): IAuditLogState => rootState[AUDIT_LOG_FEATURE_KEY];
export const selectAllAuditLog = createSelector(getAuditLogState, selectAll);
export const selectAllAuditLogData = createSelector(getAuditLogState, (state) => {
	return state.auditLogData.logs || [];
});
export const selectTotalCountAuditLog = createSelector(getAuditLogState, (state) => {
	return state.auditLogData.total_count || 0;
});
