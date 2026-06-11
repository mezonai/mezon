import type { PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { dashboardFetch, readDashboardError } from './dashboardAuth';

import type { RootState } from '../store';

const API_BASE = process.env.NX_ADMIN_API_URL || 'http://localhost:8081';

type ChartPoint = { date: string; isoDate?: string; activeUsers: number; activeChannels: number; messages: number };
type ClanRow = { clanId: string; clanName: string; totalActiveUsers: number; totalActiveChannels: number; totalMessages: number };

export interface ListResponse<T> {
	success: boolean;
	data: T;
}

export const fetchAllClansMetrics = createAsyncThunk(
	'dashboard/fetchAllClansMetrics',
	async ({ start, end, rangeType }: { start: string; end: string; rangeType?: string }, thunkAPI) => {
		try {
			const base = API_BASE || '';
			const url = `${base}/dashboard/all-clans/metrics?start_date=${start}&end_date=${end}${rangeType ? `&rangeType=${rangeType}` : ''}`;
			const res = await dashboardFetch(url, {}, thunkAPI);
			if (!res.ok) {
				return thunkAPI.rejectWithValue(await readDashboardError(res));
			}
			const json = (await res.json()) as ListResponse<{
				labels: string[];
				active_users: string[];
				active_channels: string[];
				total_messages: string[];
			}>;
			return json;
		} catch (err) {
			return thunkAPI.rejectWithValue(err);
		}
	}
);

export const fetchClansList = createAsyncThunk(
	'dashboard/fetchClansList',
	async (
		{
			start,
			end,
			page,
			limit,
			rangeType,
			sortBy,
			sort
		}: { start: string; end: string; page: number; limit: number; rangeType?: string; sortBy?: string; sort?: 'asc' | 'desc' },
		thunkAPI
	) => {
		try {
			const base = API_BASE || '';
			let url = `${base}/dashboard/list-all-clans/metrics?start_date=${start}&end_date=${end}&page=${page}&limit=${limit}${rangeType ? `&rangeType=${rangeType}` : ''}`;
			if (sortBy) {
				url += `&sort_by=${sortBy}`;
				if (sort) {
					url += `&sort=${sort}`;
				}
			}
			const res = await dashboardFetch(url, {}, thunkAPI);
			if (!res.ok) {
				return thunkAPI.rejectWithValue(await readDashboardError(res));
			}
			// convert clan_id from int64 to string
			const text = await res.text();
			const fixed = text.replace(/("clan_id"\s*:\s*)(\d+)/g, '$1"$2"');
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
			const base = API_BASE || '';
			const res = await dashboardFetch(
				`${base}/dashboard/${clanId}/metrics?start_date=${start}&end_date=${end}${rangeType ? `&rangeType=${rangeType}` : ''}`,
				{},
				thunkAPI
			);
			if (!res.ok) {
				return thunkAPI.rejectWithValue(await readDashboardError(res));
			}
			const json = await res.json();
			return { ...json, clanId };
		} catch (err) {
			return thunkAPI.rejectWithValue(err);
		}
	}
);

export const fetchClanChannels = createAsyncThunk(
	'dashboard/fetchClanChannels',
	async (
		{
			clanId,
			start,
			end,
			page,
			limit,
			sortBy,
			sort
		}: { clanId: string; start: string; end: string; page?: number; limit?: number; sortBy?: string; sort?: 'asc' | 'desc' },
		thunkAPI
	) => {
		try {
			const base = API_BASE || '';
			let url = `${base}/dashboard/${clanId}/channels?start_date=${start}&end_date=${end}${page ? `&page=${page}` : ''}${limit ? `&limit=${limit}` : ''}`;
			if (sortBy) {
				url += `&sort_by=${sortBy}`;
				if (sort) {
					url += `&sort=${sort}`;
				}
			}
			const res = await dashboardFetch(url, {}, thunkAPI);
			if (!res.ok) {
				return thunkAPI.rejectWithValue(await readDashboardError(res));
			}
			const json = await res.json();
			return { ...json, clanId };
		} catch (err) {
			return thunkAPI.rejectWithValue(err);
		}
	}
);

export const fetchChannelUsers = createAsyncThunk(
	'dashboard/fetchChannelUsers',
	async (
		{
			clanId,
			channelId,
			start,
			end,
			page = 1,
			limit = 10,
			sortBy,
			sort
		}: { clanId: string; channelId: string; start: string; end: string; page?: number; limit?: number; sortBy?: string; sort?: 'asc' | 'desc' },
		thunkAPI
	) => {
		try {
			const base = API_BASE || '';
			let url = `${base}/dashboard/${clanId}/users?start_date=${start}&end_date=${end}&page=${page}&limit=${limit}`;
			if (sortBy) {
				url += `&sort_by=${sortBy}`;
				if (sort) {
					url += `&sort=${sort}`;
				}
			}
			const res = await dashboardFetch(url, {}, thunkAPI);
			if (!res.ok) {
				return thunkAPI.rejectWithValue(await readDashboardError(res));
			}
			const json = await res.json();
			return { ...json, clanId, channelId };
		} catch (err) {
			return thunkAPI.rejectWithValue(err);
		}
	}
);

export const exportClansCsv = createAsyncThunk(
	'dashboard/exportClansCsv',
	async (
		{
			start,
			end,
			rangeType,
			columns,
			sortBy,
			sort
		}: { start: string; end: string; rangeType: string; columns: string[]; sortBy?: string; sort?: 'asc' | 'desc' },
		thunkAPI
	) => {
		try {
			const base = API_BASE || '';
			const body: Record<string, unknown> = { start_date: start, end_date: end, range_type: rangeType, columns };
			if (sortBy) body.sort_by = sortBy;
			if (sort) body.sort = sort;
			const res = await dashboardFetch(
				`${base}/dashboard/list-all-clans/export-csv`,
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(body)
				},
				thunkAPI
			);
			if (!res.ok) {
				return thunkAPI.rejectWithValue(await readDashboardError(res));
			}
			const json = await res.json();
			return json;
		} catch (err) {
			return thunkAPI.rejectWithValue(err);
		}
	}
);

export const exportChannelsCsv = createAsyncThunk(
	'dashboard/exportChannelsCsv',
	async (
		{
			clanId,
			start,
			end,
			rangeType,
			columns,
			sortBy,
			sort
		}: { clanId: string; start: string; end: string; rangeType: string; columns: string[]; sortBy?: string; sort?: 'asc' | 'desc' },
		thunkAPI
	) => {
		try {
			const base = API_BASE || '';
			const body: Record<string, unknown> = { start_date: start, end_date: end, range_type: rangeType, columns };
			if (sortBy) body.sort_by = sortBy;
			if (sort) body.sort = sort;
			const res = await dashboardFetch(
				`${base}/dashboard/${clanId}/channels/export-csv`,
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(body)
				},
				thunkAPI
			);
			if (!res.ok) {
				return thunkAPI.rejectWithValue(await readDashboardError(res));
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
			start,
			end,
			rangeType,
			columns,
			sortBy,
			sort
		}: { clanId: string; start: string; end: string; rangeType: string; columns: string[]; sortBy?: string; sort?: 'asc' | 'desc' },
		thunkAPI
	) => {
		try {
			const base = API_BASE || '';
			const body: Record<string, unknown> = { clan_id: clanId, start_date: start, end_date: end, range_type: rangeType, columns };
			if (sortBy) body.sort_by = sortBy;
			if (sort) body.sort = sort;
			const res = await dashboardFetch(
				`${base}/dashboard/${clanId}/users/export-csv`,
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(body)
				},
				thunkAPI
			);
			if (!res.ok) {
				return thunkAPI.rejectWithValue(await readDashboardError(res));
			}
			const json = await res.json();
			return json;
		} catch (err) {
			return thunkAPI.rejectWithValue(err);
		}
	}
);

export const DASHBOARD_FEATURE_KEY = 'dashboard';

export interface RoomParticipant {
	participantIdentity: string;
	timestamp: string;
}

export interface Room {
	id: string;
	roomName: string;
	status: string;
	createdAt: string;
	participants: RoomParticipant[];
	finalizedAt: string;
	completedAt: string;
	channelName?: string;
}

interface ListRoomsApiResponse {
	status: string;
	total: number | string;
	limit: number;
	page: number;
	rooms: Array<{
		id: string;
		room_name: string;
		status: string;
		created_at: string;
		participants: Array<{ participant_identity: string; timestamp: string }>;
		finalized_at: string;
		completed_at: string;
		channel_name?: string;
	}>;
}

export interface RoomStatisticsPayload {
	room_id?: string;
	room_name?: string;
	status?: string;
	total_tracks?: number;
	completed_tracks?: number;
	remain_tracks?: number;
	total_duration_sec?: number;
	total_segments?: number | string;
	created_at?: string;
	finalized_at?: string;
	channel_name?: string;
}

export interface ActionItemsEntry {
	participant_id?: string;
	items?: string[];
}

export interface RoomSummaryDataPayload {
	summary?: string;
	action_items?: ActionItemsEntry[];
}

export interface RoomMessage {
	timestamp?: string;
	participant_id?: string;
	content?: string;
}

export interface RoomSummaryPayload {
	room_id?: string;
	room_name?: string;
	participants?: string[];
	summary_data?: RoomSummaryDataPayload;
	messages?: RoomMessage[];
	full_text?: string;
	created_at?: string;
	total_segments?: number | string;
}

export interface TrackInfo {
	filename?: string;
	started_at_ns?: string;
	ended_at_ns?: string;
}

export interface ParticipantDetail {
	participant_identity?: string;
	user_name?: string;
	display_name?: string;
	tracks?: TrackInfo[];
}

export interface GetParticipantsByRoomIdResponse {
	status: string;
	participants: ParticipantDetail[];
}

export interface TranscriptRoomDetailCacheEntry {
	statistics: RoomStatisticsPayload | null;
	summary: RoomSummaryPayload | null;
	participants: ParticipantDetail[];
	statisticsLoading: boolean;
	summaryLoading: boolean;
	participantsLoading: boolean;
	statisticsError: string | null;
	summaryError: string | null;
	participantsError: string | null;
}

function unwrapDashboardJson<T>(json: unknown): T {
	if (json && typeof json === 'object' && 'data' in json && (json as { data?: unknown }).data !== undefined) {
		return (json as { data: T }).data;
	}
	return json as T;
}

export const fetchRooms = createAsyncThunk<
	ListRoomsApiResponse,
	{ status?: string; search?: string; startDate?: string; endDate?: string; limit?: number; page?: number }
>('dashboard/fetchRooms', async ({ status, search, startDate, endDate, limit = 10, page = 1 }, thunkAPI) => {
	try {
		const base = API_BASE || '';
		const params = new URLSearchParams();
		if (status) params.append('status', status);
		if (search) params.append('search', search);
		if (startDate) params.append('start_date', startDate);
		if (endDate) params.append('end_date', endDate);
		params.append('limit', String(limit));
		params.append('page', String(page));

		const res = await dashboardFetch(`${base}/dashboard/rooms?${params.toString()}`, {}, thunkAPI);
		if (!res.ok) {
			return thunkAPI.rejectWithValue(await readDashboardError(res));
		}
		return (await res.json()) as ListRoomsApiResponse;
	} catch (err) {
		return thunkAPI.rejectWithValue(err);
	}
});

export const fetchRoomStatisticsByRoomId = createAsyncThunk(
	'dashboard/fetchRoomStatisticsByRoomId',
	async ({ roomId }: { roomId: string }, thunkAPI) => {
		try {
			const base = API_BASE || '';
			const url = `${base}/dashboard/rooms/${encodeURIComponent(roomId)}/statistics`;
			const res = await dashboardFetch(url, {}, thunkAPI);
			if (!res.ok) {
				const text = await readDashboardError(res);
				return thunkAPI.rejectWithValue({ roomId, message: text });
			}
			const json = await res.json();
			const body = unwrapDashboardJson<{ status?: string; statistics?: RoomStatisticsPayload }>(json);
			return { roomId, statistics: body.statistics ?? null };
		} catch (err) {
			return thunkAPI.rejectWithValue({ roomId, message: String(err) });
		}
	}
);

export const fetchRoomSummaryByRoomId = createAsyncThunk('dashboard/fetchRoomSummaryByRoomId', async ({ roomId }: { roomId: string }, thunkAPI) => {
	try {
		const base = API_BASE || '';
		const url = `${base}/dashboard/room/${encodeURIComponent(roomId)}/summary`;
		const res = await dashboardFetch(url, {}, thunkAPI);
		if (!res.ok) {
			if (res.status === 404) {
				return { roomId, summary: null };
			}
			const text = await readDashboardError(res);
			return thunkAPI.rejectWithValue({ roomId, message: text });
		}
		const json = await res.json();
		const body = unwrapDashboardJson<RoomSummaryPayload>(json);
		return { roomId, summary: body ?? null };
	} catch (err) {
		return thunkAPI.rejectWithValue({ roomId, message: String(err) });
	}
});

export const fetchRoomParticipantsByRoomId = createAsyncThunk(
	'dashboard/fetchRoomParticipantsByRoomId',
	async ({ roomId }: { roomId: string }, thunkAPI) => {
		try {
			const base = API_BASE || '';
			const url = `${base}/dashboard/rooms/${encodeURIComponent(roomId)}/participants`;
			const res = await dashboardFetch(url, {}, thunkAPI);
			if (!res.ok) {
				const text = await readDashboardError(res);
				return thunkAPI.rejectWithValue({ roomId, message: text });
			}
			const json = await res.json();
			const body = unwrapDashboardJson<GetParticipantsByRoomIdResponse>(json);
			return { roomId, participants: body.participants ?? [] };
		} catch (err) {
			return thunkAPI.rejectWithValue({ roomId, message: String(err) });
		}
	}
);

export interface DashboardState {
	loading: boolean;
	stats: Record<string, number>;
	chartData: ChartPoint[];
	allClansRawPayload?: any;
	channelsDataByClan: Record<string, any>;
	tableData: ClanRow[];
	usersDataByChannel: Record<string, any>;
	usageTotals?: { totalActiveUsers: string; totalActiveChannels: string; totalMessages: string } | null;
	chartLoading: boolean;
	channelsLoading: boolean;
	usersLoading: boolean;
	tableLoading: boolean;
	exportLoading: boolean;
	roomsLoading: boolean;
	rooms: Room[];
	roomsTotal: number;
	roomsLimit: number;
	roomsPage: number;
	lastUpdated?: number | null;
	error?: string | null;
	transcriptRoomDetailsById: Record<string, TranscriptRoomDetailCacheEntry>;
}

function emptyTranscriptRoomDetail(): TranscriptRoomDetailCacheEntry {
	return {
		statistics: {
			total_tracks: 0,
			completed_tracks: 0,
			remain_tracks: 0,
			total_duration_sec: 0,
			total_segments: 0
		},
		summary: null,
		participants: [],
		statisticsLoading: false,
		summaryLoading: false,
		participantsLoading: false,
		statisticsError: null,
		summaryError: null,
		participantsError: null
	};
}

export const initialDashboardState: DashboardState = {
	loading: false,
	stats: {},
	chartData: [],
	allClansRawPayload: undefined,
	channelsDataByClan: {},
	usersDataByChannel: {},
	tableData: [],
	usageTotals: null,
	chartLoading: false,
	channelsLoading: false,
	usersLoading: false,
	tableLoading: false,
	exportLoading: false,
	roomsLoading: false,
	rooms: [],
	roomsTotal: 0,
	roomsLimit: 10,
	roomsPage: 1,
	lastUpdated: null,
	error: null,
	transcriptRoomDetailsById: {}
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
				state.allClansRawPayload = payload;
				if (payload?.success && payload.data) {
					const labels: string[] = payload.data.labels || [];
					state.chartData = labels.map((label: string, idx: number) => ({
						date: new Date(label).toLocaleDateString('en-US', { month: 'short', day: '2-digit' }),
						isoDate: label,
						activeUsers: Number(payload.data.active_users?.[idx] || 0),
						activeChannels: Number(payload.data.active_channels?.[idx] || 0),
						messages: Number(payload.data.total_messages?.[idx] || 0)
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
					const clans = payload.data.clans || [];
					state.tableData = clans.map((clan: any) => ({
						clanId: clan.clan_id,
						clanName: clan.clan_name,
						totalActiveUsers: clan.total_active_users,
						totalActiveChannels: clan.total_active_channels,
						totalMessages: clan.total_messages
					}));
					const total = payload.data.total;
					state.usageTotals = total
						? {
								totalActiveUsers: total.total_active_users,
								totalActiveChannels: total.total_active_channels,
								totalMessages: total.total_messages
							}
						: null;
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
				if (payload?.success && payload.data) {
					const labels: string[] = payload.data.labels || [];
					state.chartData = labels.map((label: string, idx: number) => ({
						date: new Date(label).toLocaleDateString('en-US', { month: 'short', day: '2-digit' }),
						isoDate: label,
						activeUsers: Number(payload.data.active_users?.[idx] || 0),
						activeChannels: Number(payload.data.active_channels?.[idx] || 0),
						messages: Number(payload.data.total_messages?.[idx] || 0)
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
					state.channelsDataByClan[clanId] = payload;
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
					state.usersDataByChannel[key] = payload;
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
			})

			.addCase(fetchRooms.pending, (state) => {
				state.roomsLoading = true;
				state.error = null;
			})
			.addCase(fetchRooms.fulfilled, (state, action) => {
				state.roomsLoading = false;
				const payload = action.payload;
				state.roomsTotal = Number(payload.total ?? 0);
				state.roomsLimit = Number(payload.limit ?? 10);
				state.roomsPage = Number(payload.page ?? 1);
				state.rooms = (payload.rooms ?? []).map((r) => ({
					id: r.id ?? '',
					roomName: r.room_name ?? '',
					status: r.status ?? '',
					createdAt: r.created_at ?? '',
					participants: (r.participants ?? []).map((p) => ({
						participantIdentity: p.participant_identity ?? '',
						timestamp: p.timestamp ?? ''
					})),
					finalizedAt: r.finalized_at ?? '',
					completedAt: r.completed_at ?? '',
					channelName: r.channel_name
				}));
			})
			.addCase(fetchRooms.rejected, (state, action) => {
				state.roomsLoading = false;
				state.error = action.payload as string | null;
			})

			.addCase(fetchRoomStatisticsByRoomId.pending, (state, action) => {
				const roomId = action.meta.arg.roomId;
				if (!state.transcriptRoomDetailsById[roomId]) {
					state.transcriptRoomDetailsById[roomId] = emptyTranscriptRoomDetail();
				}
				state.transcriptRoomDetailsById[roomId].statisticsLoading = true;
				state.transcriptRoomDetailsById[roomId].statisticsError = null;
			})
			.addCase(fetchRoomStatisticsByRoomId.fulfilled, (state, action) => {
				const { roomId, statistics } = action.payload;
				if (!state.transcriptRoomDetailsById[roomId]) {
					state.transcriptRoomDetailsById[roomId] = emptyTranscriptRoomDetail();
				}
				state.transcriptRoomDetailsById[roomId].statisticsLoading = false;
				state.transcriptRoomDetailsById[roomId].statistics = statistics;
			})
			.addCase(fetchRoomStatisticsByRoomId.rejected, (state, action) => {
				const payload = action.payload as { roomId?: string; message?: string } | undefined;
				const roomId = payload?.roomId ?? action.meta.arg.roomId;
				if (!state.transcriptRoomDetailsById[roomId]) {
					state.transcriptRoomDetailsById[roomId] = emptyTranscriptRoomDetail();
				}
				state.transcriptRoomDetailsById[roomId].statisticsLoading = false;
				state.transcriptRoomDetailsById[roomId].statisticsError = payload?.message ?? 'Failed to load statistics';
			})

			.addCase(fetchRoomSummaryByRoomId.pending, (state, action) => {
				const roomId = action.meta.arg.roomId;
				if (!state.transcriptRoomDetailsById[roomId]) {
					state.transcriptRoomDetailsById[roomId] = emptyTranscriptRoomDetail();
				}
				state.transcriptRoomDetailsById[roomId].summaryLoading = true;
				state.transcriptRoomDetailsById[roomId].summaryError = null;
			})
			.addCase(fetchRoomSummaryByRoomId.fulfilled, (state, action) => {
				const { roomId, summary } = action.payload;
				if (!state.transcriptRoomDetailsById[roomId]) {
					state.transcriptRoomDetailsById[roomId] = emptyTranscriptRoomDetail();
				}
				state.transcriptRoomDetailsById[roomId].summaryLoading = false;
				state.transcriptRoomDetailsById[roomId].summary = summary;
			})
			.addCase(fetchRoomSummaryByRoomId.rejected, (state, action) => {
				const payload = action.payload as { roomId?: string; message?: string } | undefined;
				const roomId = payload?.roomId ?? action.meta.arg.roomId;
				if (!state.transcriptRoomDetailsById[roomId]) {
					state.transcriptRoomDetailsById[roomId] = emptyTranscriptRoomDetail();
				}
				state.transcriptRoomDetailsById[roomId].summaryLoading = false;
				state.transcriptRoomDetailsById[roomId].summaryError = payload?.message ?? 'Failed to load summary';
			})

			.addCase(fetchRoomParticipantsByRoomId.pending, (state, action) => {
				const roomId = action.meta.arg.roomId;
				if (!state.transcriptRoomDetailsById[roomId]) {
					state.transcriptRoomDetailsById[roomId] = emptyTranscriptRoomDetail();
				}
				state.transcriptRoomDetailsById[roomId].participantsLoading = true;
				state.transcriptRoomDetailsById[roomId].participantsError = null;
			})
			.addCase(fetchRoomParticipantsByRoomId.fulfilled, (state, action) => {
				const { roomId, participants } = action.payload;
				if (!state.transcriptRoomDetailsById[roomId]) {
					state.transcriptRoomDetailsById[roomId] = emptyTranscriptRoomDetail();
				}
				state.transcriptRoomDetailsById[roomId].participantsLoading = false;
				state.transcriptRoomDetailsById[roomId].participants = participants;
			})
			.addCase(fetchRoomParticipantsByRoomId.rejected, (state, action) => {
				const payload = action.payload as { roomId?: string; message?: string } | undefined;
				const roomId = payload?.roomId ?? action.meta.arg.roomId;
				if (!state.transcriptRoomDetailsById[roomId]) {
					state.transcriptRoomDetailsById[roomId] = emptyTranscriptRoomDetail();
				}
				state.transcriptRoomDetailsById[roomId].participantsLoading = false;
				state.transcriptRoomDetailsById[roomId].participantsError = payload?.message ?? 'Failed to load participants';
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
export const selectRooms = (state: RootState): Room[] => selectDashboard(state).rooms;
export const selectRoomsLoading = (state: RootState): boolean => selectDashboard(state).roomsLoading;
export const selectRoomsPagination = (state: RootState): { total: number; limit: number; page: number } => ({
	total: selectDashboard(state).roomsTotal,
	limit: selectDashboard(state).roomsLimit,
	page: selectDashboard(state).roomsPage
});

export const selectClanChannels = (state: RootState, clanId: string) => {
	const raw = selectDashboard(state).channelsDataByClan?.[clanId]?.data?.channels;
	if (!Array.isArray(raw)) return [];
	return raw.map((c: any) => ({
		channelId: c.channel_id || c.channelId || c.id || '',
		channelName: c.channel_name || c.channelName || c.name || '',
		totalUsers: String(c.total_users ?? c.totalUsers ?? '0'),
		totalMessages: String(c.total_messages ?? c.totalMessages ?? '0')
	}));
};

export const selectClanChannelsLoading = (state: RootState) => selectDashboard(state).channelsLoading;

export const selectClanChannelsPagination = (state: RootState, clanId: string) => {
	const raw = selectDashboard(state).channelsDataByClan?.[clanId]?.data?.pagination;
	if (!raw) return { page: 1, limit: 10, total: 0, totalPages: 1 };
	return {
		page: raw.page ?? 1,
		limit: raw.limit ?? 10,
		total: Number(raw.total ?? 0),
		totalPages: raw.total_pages ?? raw.totalPages ?? 1
	};
};

export const selectClanChannelsMetrics = (state: RootState, clanId: string) => {
	const raw = selectDashboard(state).channelsDataByClan?.[clanId]?.data?.total;
	if (!raw) return { totalActiveUsers: '0', totalActiveChannels: '0', totalMessages: '0' };
	return {
		totalActiveUsers: raw.total_active_users ?? raw.totalActiveUsers ?? '0',
		totalActiveChannels: raw.total_active_channels ?? raw.totalActiveChannels ?? '0',
		totalMessages: raw.total_messages ?? raw.totalMessages ?? '0'
	};
};

export const selectChannelUsers = (state: RootState, clanId: string, channelId: string) => {
	const key = `${clanId}_${channelId}`;
	const raw = selectDashboard(state).usersDataByChannel?.[key]?.data?.users;
	if (!Array.isArray(raw)) return [];
	return raw.map((u: any) => ({
		userName: u.user_name ?? '0',
		messages: u.total_messages ?? '0'
	}));
};

export const selectChannelUsersLoading = (state: RootState) => selectDashboard(state).usersLoading;

export const selectChannelUsersPagination = (state: RootState, clanId: string, channelId: string) => {
	const key = `${clanId}_${channelId}`;
	const raw = selectDashboard(state).usersDataByChannel?.[key]?.data?.pagination;
	if (!raw) return { page: 1, limit: 10, total: 0, totalPages: 1 };
	return {
		page: raw.page ?? 1,
		limit: raw.limit ?? 10,
		total: Number(raw.total ?? 0),
		totalPages: raw.total_pages ?? raw.totalPages ?? 1
	};
};

export const selectTranscriptRoomDetailEntry = (state: RootState, roomId: string): TranscriptRoomDetailCacheEntry => {
	const existing = selectDashboard(state).transcriptRoomDetailsById[roomId];
	return existing ?? emptyTranscriptRoomDetail();
};

/** `hasFetched` is false until the first pending/fulfilled/rejected for this `roomId`. */
export const selectTranscriptRoomDetailState = (state: RootState, roomId: string) => {
	const existing = selectDashboard(state).transcriptRoomDetailsById[roomId];
	return {
		detail: existing ?? emptyTranscriptRoomDetail(),
		hasFetched: Boolean(existing)
	};
};

export default dashboardReducer;
