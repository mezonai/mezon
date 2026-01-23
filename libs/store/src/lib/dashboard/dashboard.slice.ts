import type { PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { CacheMetadata } from '../cache-metadata';
import { createApiKey, createCacheMetadata, markApiFirstCalled, shouldForceApiCall } from '../cache-metadata';
import type { RootState } from '../store';

const API_BASE = process.env.NX_ADMIN_API_URL || 'http://localhost:8080/api';

type ChartPoint = { date: string; isoDate?: string; activeUsers: number; activeChannels: number; messages: number };
type ClanRow = { clanId: string; totalActiveUsers: number; totalActiveChannels: number; totalMessages: number };

interface ListResponse<T> {
	success: boolean;
	data: T;
}

export const fetchAllClansMetrics = createAsyncThunk(
	'dashboard/fetchAllClansMetrics',
	async ({ start, end, rangeType }: { start: string; end: string; rangeType?: string }, thunkAPI) => {
		try {
			const getState = thunkAPI.getState as () => RootState;
			const apiKey = createApiKey('fetchAllClansMetrics', start, end, rangeType || '');
			const cacheEntry = getState().dashboard.allClansCacheByKey?.[apiKey];
			const shouldForce = shouldForceApiCall(apiKey, cacheEntry?.cache, false);

			if (!shouldForce && cacheEntry?.rawPayload) {
				return { ...(cacheEntry.rawPayload as any), fromCache: true };
			}

			const base = API_BASE || '';
			const url = `${base}/dashboard/all-clans/metrics?start=${start}&end=${end}${rangeType ? `&rangeType=${rangeType}` : ''}`;
			const res = await fetch(url);
			if (!res.ok) {
				const text = await res.text().catch(() => '');
				return thunkAPI.rejectWithValue(text || res.statusText);
			}
			const json = (await res.json()) as ListResponse<{
				labels: string[];
				activeUsers: number[];
				activeChannels: number[];
				totalMessages: number[];
			}>;
			markApiFirstCalled(apiKey);
			return json;
		} catch (err) {
			return thunkAPI.rejectWithValue(err);
		}
	}
);

export const fetchClansList = createAsyncThunk(
	'dashboard/fetchClansList',
	async ({ start, end, page, limit, rangeType }: { start: string; end: string; page: number; limit: number; rangeType?: string }, thunkAPI) => {
		try {
			const base = API_BASE || '';
			const res = await fetch(
				`${base}/dashboard/list-all-clans/metrics?start=${start}&end=${end}&page=${page}&limit=${limit}${rangeType ? `&rangeType=${rangeType}` : ''}`
			);
			if (!res.ok) {
				const text = await res.text().catch(() => '');
				return thunkAPI.rejectWithValue(text || res.statusText);
			}
			// convert clanId from int64 to string
			const text = await res.text();
			const fixed = text.replace(/("clanId"\s*:\s*)(\d+)/g, '$1"$2"');
			const json = JSON.parse(fixed);
			return json;
		} catch (err) {
			return thunkAPI.rejectWithValue(err);
		}
	}
);

export const fetchClanMetrics = createAsyncThunk(
	'dashboard/fetchClanMetrics',
	async ({ clanId, start, end, rangeType }: { clanId: string; start: string; end: string; rangeType?: string }, thunkAPI) => {
		try {
			const getState = thunkAPI.getState as () => RootState;
			const apiKey = createApiKey('fetchClanMetrics', clanId, start, end, rangeType || '');
			const clanCacheEntry = getState().dashboard.chartCacheByClan?.[clanId];
			const shouldForce = shouldForceApiCall(apiKey, clanCacheEntry?.cache, false);
			if (!shouldForce && clanCacheEntry?.rawPayload) {
				return { ...(clanCacheEntry.rawPayload as any), fromCache: true, clanId };
			}

			const base = API_BASE || '';
			const res = await fetch(`${base}/dashboard/${clanId}/metrics?start=${start}&end=${end}${rangeType ? `&rangeType=${rangeType}` : ''}`);
			if (!res.ok) {
				const text = await res.text().catch(() => '');
				return thunkAPI.rejectWithValue(text || res.statusText);
			}
			const json = await res.json();
			markApiFirstCalled(apiKey);
			return { ...(json as any), clanId };
		} catch (err) {
			return thunkAPI.rejectWithValue(err);
		}
	}
);

export const exportClansCsv = createAsyncThunk(
	'dashboard/exportClansCsv',
	async ({ start, end, rangeType, columns }: { start: string; end: string; rangeType: string; columns: string[] }, thunkAPI) => {
		try {
			const base = API_BASE || '';
			const res = await fetch(`${base}/dashboard/list-all-clans/export-csv?start=${start}&end=${end}&rangeType=${rangeType}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ columns })
			});
			if (!res.ok) {
				const text = await res.text().catch(() => '');
				return thunkAPI.rejectWithValue(text || res.statusText);
			}
			const blob = await res.blob();
			return { blob, headers: Array.from(res.headers.entries()) };
		} catch (err) {
			return thunkAPI.rejectWithValue(err);
		}
	}
);

export const DASHBOARD_FEATURE_KEY = 'dashboard';

export interface DashboardState {
	loading: boolean;
	stats: Record<string, number>;
	chartData: ChartPoint[];
	allClansCache?: CacheMetadata;
	allClansRawPayload?: any;
	allClansCacheByKey: Record<string, { cache?: CacheMetadata; rawPayload?: any }>;
	chartCacheByClan: Record<string, { cache?: CacheMetadata; rawPayload?: any }>;
	tableData: ClanRow[];
	usageTotals?: { totalActiveUsers: number; totalActiveChannels: number; totalMessages: number } | null;
	chartLoading: boolean;
	tableLoading: boolean;
	exportLoading: boolean;
	lastUpdated?: number | null;
	error?: string | null;
}

export const initialDashboardState: DashboardState = {
	loading: false,
	stats: {},
	chartData: [],
	allClansCache: undefined,
	allClansRawPayload: undefined,
	allClansCacheByKey: {},
	chartCacheByClan: {},
	tableData: [],
	usageTotals: null,
	chartLoading: false,
	tableLoading: false,
	exportLoading: false,
	lastUpdated: null,
	error: null
};

export const dashboardSlice = createSlice({
	name: DASHBOARD_FEATURE_KEY,
	initialState: initialDashboardState,
	reducers: {
		setLoading(state, action: PayloadAction<boolean>) {
			state.loading = action.payload;
		},
		setStats(state, action: PayloadAction<Record<string, number>>) {
			state.stats = action.payload;
			state.lastUpdated = Date.now();
			state.error = null;
		},
		setError(state, action: PayloadAction<string | null>) {
			state.error = action.payload;
			state.loading = false;
		},
		resetDashboard(state) {
			state.loading = false;
			state.stats = {};
			state.error = null;
			state.lastUpdated = null;
		}
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchAllClansMetrics.pending, (state) => {
				state.chartLoading = true;
				state.error = null;
			})
			.addCase(fetchAllClansMetrics.fulfilled, (state, action) => {
				state.chartLoading = false;
				const payload = action.payload as any;
				const { start, end, rangeType } = (action.meta.arg as any) || {};
				const apiKey = `fetchAllClansMetrics_${start}_${end}_${rangeType || ''}`;

				// store raw payload and cache metadata by key
				if (!state.allClansCacheByKey[apiKey]) state.allClansCacheByKey[apiKey] = {};
				state.allClansCacheByKey[apiKey].rawPayload = payload;
				state.allClansCacheByKey[apiKey].cache = createCacheMetadata();

				// Also keep backward compatibility
				state.allClansRawPayload = payload;
				state.allClansCache = createCacheMetadata();

				// Always update chartData even if from cache
				if (payload?.success && payload.data) {
					const labels: string[] = payload.data.labels || [];
					state.chartData = labels.map((label: string, idx: number) => ({
						date: new Date(label).toLocaleDateString('en-US', { month: 'short', day: '2-digit' }),
						isoDate: label,
						activeUsers: payload.data.activeUsers?.[idx] || 0,
						activeChannels: payload.data.activeChannels?.[idx] || 0,
						messages: payload.data.totalMessages?.[idx] || 0
					}));
				} else {
					state.chartData = [];
				}
			})
			.addCase(fetchAllClansMetrics.rejected, (state, action) => {
				state.chartLoading = false;
				state.error = action.payload as string | null;
			})

			.addCase(fetchClansList.pending, (state) => {
				state.tableLoading = true;
				state.error = null;
			})
			.addCase(fetchClansList.fulfilled, (state, action) => {
				state.tableLoading = false;
				const payload = action.payload as any;
				if (payload?.success && payload.data) {
					state.tableData = payload.data.clans || [];
					state.usageTotals = payload.data.total || null;
				} else {
					state.tableData = [];
					state.usageTotals = null;
				}
			})
			.addCase(fetchClansList.rejected, (state, action) => {
				state.tableLoading = false;
				state.error = action.payload as string | null;
			})

			.addCase(fetchClanMetrics.pending, (state) => {
				state.chartLoading = true;
				state.error = null;
			})
			.addCase(fetchClanMetrics.fulfilled, (state, action) => {
				state.chartLoading = false;
				const payload = action.payload as any;
				const clanId = payload?.clanId as string | undefined;
				if (clanId) {
					if (!state.chartCacheByClan[clanId]) state.chartCacheByClan[clanId] = {};
					state.chartCacheByClan[clanId].rawPayload = payload;
					state.chartCacheByClan[clanId].cache = createCacheMetadata();
				}
				if (payload?.fromCache) return;
				if (payload?.success && payload.data) {
					const labels: string[] = payload.data.labels || [];
					state.chartData = labels.map((label: string, idx: number) => ({
						date: new Date(label).toLocaleDateString('en-US', { month: 'short', day: '2-digit' }),
						isoDate: label,
						activeUsers: payload.data.activeUsers?.[idx] || 0,
						activeChannels: payload.data.activeChannels?.[idx] || 0,
						messages: payload.data.totalMessages?.[idx] || 0
					}));
				} else {
					state.chartData = [];
				}
			})
			.addCase(fetchClanMetrics.rejected, (state, action) => {
				state.chartLoading = false;
				state.error = action.payload as string | null;
			})

			.addCase(exportClansCsv.pending, (state) => {
				state.exportLoading = true;
				state.error = null;
			})
			.addCase(exportClansCsv.fulfilled, (state) => {
				state.exportLoading = false;
			})
			.addCase(exportClansCsv.rejected, (state, action) => {
				state.exportLoading = false;
				state.error = action.payload as string | null;
			});
	}
});

export const dashboardActions = dashboardSlice.actions;
export const dashboardReducer = dashboardSlice.reducer;

export const selectDashboard = (state: RootState) => state.dashboard as DashboardState;
export const selectDashboardStats = (state: RootState) => selectDashboard(state).stats;
export const selectDashboardChartData = (state: RootState) => selectDashboard(state).chartData;
export const selectDashboardTableData = (state: RootState) => selectDashboard(state).tableData;
export const selectDashboardUsageTotals = (state: RootState) => selectDashboard(state).usageTotals;
export const selectDashboardChartLoading = (state: RootState) => selectDashboard(state).chartLoading;
export const selectDashboardTableLoading = (state: RootState) => selectDashboard(state).tableLoading;
export const selectDashboardExportLoading = (state: RootState) => selectDashboard(state).exportLoading;

export default dashboardReducer;
