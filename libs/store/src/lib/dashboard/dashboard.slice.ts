import type { PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { AUTH_FEATURE_KEY, AuthState } from '../auth/auth.slice';
import { selectSession } from '../auth/auth.slice';
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
			const url = `${base}/dashboard/all-clans/metrics?start_date=${start}&end_date=${end}${rangeType ? `&rangeType=${rangeType}` : ''}`;
			const session = selectSession(getState() as unknown as { [AUTH_FEATURE_KEY]: AuthState });
			const token = session?.token;
			const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
			const res = await fetch(url, { headers });
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
			const state = thunkAPI.getState() as RootState;
			const session = selectSession(state as unknown as { [AUTH_FEATURE_KEY]: AuthState });
			const token = session?.token;
			const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
			const url = `${base}/dashboard/list-all-clans/metrics?start_date=${start}&end_date=${end}&page=${page}&limit=${limit}${rangeType ? `&rangeType=${rangeType}` : ''}`;
			const res = await fetch(url, { headers });
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
			const session = selectSession(getState() as unknown as { [AUTH_FEATURE_KEY]: AuthState });
			const token = session?.token;
			const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
			const res = await fetch(
				`${base}/dashboard/${clanId}/metrics?start_date=${start}&end_date=${end}${rangeType ? `&rangeType=${rangeType}` : ''}`,
				{
					headers
				}
			);
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

export const fetchClanChannels = createAsyncThunk(
	'dashboard/fetchClanChannels',
	async ({ clanId, start, end, page, limit }: { clanId: string; start: string; end: string; page?: number; limit?: number }, thunkAPI) => {
		try {
			const getState = thunkAPI.getState as () => RootState;
			const apiKey = createApiKey('fetchClanChannels', clanId, start, end, String(page || ''), String(limit || ''));
			const cacheEntry = getState().dashboard.channelsCacheByClan?.[clanId];
			const shouldForce = shouldForceApiCall(apiKey, cacheEntry?.cache, false);

			if (!shouldForce && cacheEntry?.rawPayload) {
				return { ...(cacheEntry.rawPayload as any), fromCache: true, clanId };
			}

			const base = API_BASE || '';
			const state = getState() as RootState;
			const session = selectSession(state as unknown as { [AUTH_FEATURE_KEY]: AuthState });
			const token = session?.token;
			const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
			const url = `${base}/dashboard/${clanId}/channels?start_date=${start}&end_date=${end}${page ? `&page=${page}` : ''}${limit ? `&limit=${limit}` : ''}`;
			const res = await fetch(url, { headers });
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

export const fetchChannelUsers = createAsyncThunk(
	'dashboard/fetchChannelUsers',
	async ({ clanId, channelId, start, end }: { clanId: string; channelId: string; start: string; end: string }, thunkAPI) => {
		try {
			const getState = thunkAPI.getState as () => RootState;
			const key = `${clanId}_${channelId}`;
			const apiKey = createApiKey('fetchChannelUsers', clanId, channelId, start, end);
			const cacheEntry = getState().dashboard.usersCacheByChannel?.[key];
			const shouldForce = shouldForceApiCall(apiKey, cacheEntry?.cache, false);

			if (!shouldForce && cacheEntry?.rawPayload) {
				return { ...(cacheEntry.rawPayload as any), fromCache: true, clanId, channelId };
			}

			const base = API_BASE || '';
			const state = getState() as RootState;
			const session = selectSession(state as unknown as { [AUTH_FEATURE_KEY]: AuthState });
			const token = session?.token;
			const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
			const url = `${base}/dashboard/${clanId}/users/${channelId}/metrics?start_date=${start}&end_date=${end}`;
			const res = await fetch(url, { headers });
			if (!res.ok) {
				const text = await res.text().catch(() => '');
				return thunkAPI.rejectWithValue(text || res.statusText);
			}
			const json = await res.json();
			markApiFirstCalled(apiKey);
			return { ...(json as any), clanId, channelId };
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
			const state = thunkAPI.getState() as RootState;
			const session = selectSession(state as unknown as { [AUTH_FEATURE_KEY]: AuthState });
			const token = session?.token;
			const headers: Record<string, string> = {
				'Content-Type': 'application/json',
				...(token ? { Authorization: `Bearer ${token}` } : {})
			};
			const res = await fetch(`${base}/dashboard/list-all-clans/export-csv`, {
				method: 'POST',
				headers,
				body: JSON.stringify({ start_date: start, end_date: end, range_type: rangeType, columns })
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

export const exportChannelsCsv = createAsyncThunk(
	'dashboard/exportChannelsCsv',
	async (
		{ clanId, start, end, rangeType, columns }: { clanId: string; start: string; end: string; rangeType: string; columns: string[] },
		thunkAPI
	) => {
		try {
			const base = API_BASE || '';
			const state = thunkAPI.getState() as RootState;
			const session = selectSession(state as unknown as { [AUTH_FEATURE_KEY]: AuthState });
			const token = session?.token;
			const headers: Record<string, string> = {
				'Content-Type': 'application/json',
				...(token ? { Authorization: `Bearer ${token}` } : {})
			};
			const res = await fetch(`${base}/dashboard/${clanId}/channels/export-csv`, {
				method: 'POST',
				headers,
				body: JSON.stringify({ start_date: start, end_date: end, range_type: rangeType, columns })
			});
			if (!res.ok) {
				const text = await res.text().catch(() => '');
				return thunkAPI.rejectWithValue(text || res.statusText);
			}
			const json = await res.json();
			return json;
		} catch (err) {
			return thunkAPI.rejectWithValue(err);
		}
	}
);

export const exportUsersCsv = createAsyncThunk(
	'dashboard/exportUsersCsv',
	async (
		{
			clanId,
			channelId,
			start,
			end,
			rangeType,
			columns
		}: { clanId: string; channelId: string; start: string; end: string; rangeType: string; columns: string[] },
		thunkAPI
	) => {
		try {
			const base = API_BASE || '';
			const state = thunkAPI.getState() as RootState;
			const session = selectSession(state as unknown as { [AUTH_FEATURE_KEY]: AuthState });
			const token = session?.token;
			const headers: Record<string, string> = {
				'Content-Type': 'application/json',
				...(token ? { Authorization: `Bearer ${token}` } : {})
			};
			const res = await fetch(`${base}/dashboard/${clanId}/channels/${channelId}/users/export-csv`, {
				method: 'POST',
				headers,
				body: JSON.stringify({ start_date: start, end_date: end, range_type: rangeType, columns })
			});
			if (!res.ok) {
				const text = await res.text().catch(() => '');
				return thunkAPI.rejectWithValue(text || res.statusText);
			}
			const json = await res.json();
			return json;
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
	channelsCacheByClan: Record<string, { cache?: CacheMetadata; rawPayload?: any }>;
	tableData: ClanRow[];
	usersCacheByChannel: Record<string, { cache?: CacheMetadata; rawPayload?: any }>;
	usageTotals?: { totalActiveUsers: number; totalActiveChannels: number; totalMessages: number } | null;
	chartLoading: boolean;
	channelsLoading: boolean;
	usersLoading: boolean;
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
	channelsCacheByClan: {},
	usersCacheByChannel: {},
	tableData: [],
	usageTotals: null,
	chartLoading: false,
	channelsLoading: false,
	usersLoading: false,
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

			.addCase(fetchClanChannels.pending, (state) => {
				state.channelsLoading = true;
				state.error = null;
			})
			.addCase(fetchClanChannels.fulfilled, (state, action) => {
				state.channelsLoading = false;
				const payload = action.payload as any;
				const clanId = payload?.clanId as string | undefined;
				if (clanId) {
					if (!state.channelsCacheByClan[clanId]) state.channelsCacheByClan[clanId] = {};
					state.channelsCacheByClan[clanId].rawPayload = payload;
					state.channelsCacheByClan[clanId].cache = createCacheMetadata();
				}
			})
			.addCase(fetchClanChannels.rejected, (state, action) => {
				state.channelsLoading = false;
				state.error = action.payload as string | null;
			})

			.addCase(fetchChannelUsers.pending, (state) => {
				state.usersLoading = true;
				state.error = null;
			})
			.addCase(fetchChannelUsers.fulfilled, (state, action) => {
				state.usersLoading = false;
				const payload = action.payload as any;
				const clanId = payload?.clanId as string | undefined;
				const channelId = payload?.channelId as string | undefined;
				if (clanId && channelId) {
					const key = `${clanId}_${channelId}`;
					if (!state.usersCacheByChannel[key]) state.usersCacheByChannel[key] = {};
					state.usersCacheByChannel[key].rawPayload = payload;
					state.usersCacheByChannel[key].cache = createCacheMetadata();
				}
			})
			.addCase(fetchChannelUsers.rejected, (state, action) => {
				state.usersLoading = false;
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
			})

			.addCase(exportChannelsCsv.pending, (state) => {
				state.exportLoading = true;
				state.error = null;
			})
			.addCase(exportChannelsCsv.fulfilled, (state) => {
				state.exportLoading = false;
			})
			.addCase(exportChannelsCsv.rejected, (state, action) => {
				state.exportLoading = false;
				state.error = action.payload as string | null;
			})

			.addCase(exportUsersCsv.pending, (state) => {
				state.exportLoading = true;
				state.error = null;
			})
			.addCase(exportUsersCsv.fulfilled, (state) => {
				state.exportLoading = false;
			})
			.addCase(exportUsersCsv.rejected, (state, action) => {
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

export const selectClanChannels = (state: RootState, clanId: string) => {
	const raw = selectDashboard(state).channelsCacheByClan?.[clanId]?.rawPayload?.data?.channels;
	if (!Array.isArray(raw)) return [];
	return raw.map((c: any) => ({
		channelId: c.channelId || c.id || '',
		channelName: c.channelName || c.name || '',
		activeUsers: Number(c.totalUsers ?? c.total_users ?? 0) || 0,
		messages: Number(c.totalMessages ?? c.total_messages ?? 0) || 0
	}));
};

export const selectClanChannelsLoading = (state: RootState) => selectDashboard(state).channelsLoading;

export const selectChannelUsers = (state: RootState, clanId: string, channelId: string) => {
	const key = `${clanId}_${channelId}`;
	const raw = selectDashboard(state).usersCacheByChannel?.[key]?.rawPayload?.data?.users;
	if (!Array.isArray(raw)) return [];
	return raw.map((u: any) => ({
		userName: u.userName || u.name || u.username || '',
		messages: Number(u.totalMessages ?? u.total_messages ?? u.messages ?? 0) || 0
	}));
};

export const selectChannelUsersLoading = (state: RootState) => selectDashboard(state).usersLoading;

export default dashboardReducer;
