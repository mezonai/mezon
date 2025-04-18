import { captureSentryError } from '@mezon/logger';
import { LoadingStatus } from '@mezon/utils';
import { createAsyncThunk, createEntityAdapter, createSelector, createSlice, EntityState, PayloadAction } from '@reduxjs/toolkit';
import memoizee from 'memoizee';
import { ApiAddAppRequest, ApiApp, ApiAppList, ApiMezonOauthClient, MezonUpdateAppBody } from 'mezon-js/api.gen';
import { ensureSession, getMezonCtx, MezonValueContext } from '../helpers';

export const ADMIN_APPLICATIONS = 'adminApplication';

export interface IApplicationEntity extends ApiApp {
	id: string;
	oAuthClient: ApiMezonOauthClient;
}

export interface IApplicationState extends EntityState<IApplicationEntity, string> {
	loadingStatus: LoadingStatus;
	error?: string | null;
	appsData: ApiAppList;
	appDetail: ApiApp;
	currentAppId?: string;
	isElectronDownLoading: boolean;
	isElectronUpdateAvailable: boolean;
}

export const applicationAdapter = createEntityAdapter({
	selectId: (item: IApplicationEntity) => item?.id || ''
});

export const applicationInitialState: IApplicationState = applicationAdapter.getInitialState({
	loadingStatus: 'not loaded',
	error: null,
	appsData: {
		apps: [],
		next_cursor: undefined,
		total_count: undefined
	},
	appDetail: {
		id: '',
		applogo: undefined,
		appname: undefined,
		creator_id: undefined,
		disable_time: undefined,
		is_shadow: undefined,
		role: undefined,
		token: undefined
	},
	currentAppId: undefined,
	isElectronUpdateAvailable: false,
	isElectronDownLoading: false
});

const FETCH_CACHED_TIME = 3 * 60 * 1000;

export interface IFetchAppsArg {
	noCache?: boolean;
}

const fetchApplicationsCached = memoizee((mezon: MezonValueContext) => mezon.client.listApps(mezon.session), {
	promise: true,
	maxAge: FETCH_CACHED_TIME,
	normalizer: (args) => {
		return args[0].session.username as string;
	}
});

export const fetchApplications = createAsyncThunk('adminApplication/fetchApplications', async ({ noCache }: IFetchAppsArg, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		if (noCache) {
			fetchApplicationsCached.clear(mezon);
		}
		const response = await fetchApplicationsCached(mezon);
		return response;
	} catch (error) {
		captureSentryError(error, 'adminApplication/fetchApplications');
		return thunkAPI.rejectWithValue(error);
	}
});

export const getApplicationDetail = createAsyncThunk('adminApplication/getApplicationDetail', async ({ appId }: { appId: string }, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		const response = await mezon.client.getApp(mezon.session, appId);
		thunkAPI.dispatch(setCurrentAppId(appId));
		return response;
	} catch (error) {
		captureSentryError(error, 'adminApplication/getApplicationDetail');
		return thunkAPI.rejectWithValue(error);
	}
});

export const createApplication = createAsyncThunk('adminApplication/createApplication', async (data: { request: ApiAddAppRequest }, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		const response = await mezon.client.addApp(mezon.session, data.request);
		if (response) {
			thunkAPI.dispatch(fetchApplications({ noCache: true }));
		} else {
			thunkAPI.rejectWithValue({});
		}
	} catch (error) {
		captureSentryError(error, 'adminApplication/createApplication');
		return thunkAPI.rejectWithValue(error);
	}
});

export const addBotChat = createAsyncThunk('adminApplication/addBotChat', async (data: { appId: string; clanId: string }, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		await mezon.client.addAppToClan(mezon.session, data.appId, data.clanId);
	} catch (error) {
		captureSentryError(error, 'adminApplication/addBotChat');
		return thunkAPI.rejectWithValue(error);
	}
});

export const editApplication = createAsyncThunk(
	'adminApplication/editApplication',
	async (data: { request: MezonUpdateAppBody; appId: string }, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const response = await mezon.client.updateApp(mezon.session, data.appId, data.request);
			if (response) {
				return data.request;
			}
		} catch (error) {
			captureSentryError(error, 'adminApplication/editApplication');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const deleteApplication = createAsyncThunk('adminApplication/deleteApplication', async ({ appId }: { appId: string }, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		const response = await mezon.client.deleteApp(mezon.session, appId);
		return response;
	} catch (error) {
		captureSentryError(error, 'adminApplication/deleteApplication');
		return thunkAPI.rejectWithValue(error);
	}
});

export const fetchMezonOauthClient = createAsyncThunk(
	'adminApplication/fetchMezonOauthClient',
	async ({ appId, appName }: { appId: string; appName?: string }, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const response = await mezon.client.getMezonOauthClient(mezon.session, appId, appName);
			return response;
		} catch (error) {
			captureSentryError(error, 'adminApplication/fetchMezonOauthClient');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const editMezonOauthClient = createAsyncThunk(
	'adminApplication/editMezonOauthClient',
	async ({ body }: { body: ApiMezonOauthClient }, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const response = await mezon.client.updateMezonOauthClient(mezon.session, body);
			return response;
		} catch (error) {
			captureSentryError(error, 'adminApplication/editMezonOauthClient');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const adminApplicationSlice = createSlice({
	name: ADMIN_APPLICATIONS,
	initialState: applicationInitialState,
	reducers: {
		setCurrentAppId: (state, action) => {
			state.currentAppId = action.payload;
		},
		setIsElectronUpdateAvailable: (state, action) => {
			state.isElectronUpdateAvailable = action.payload;
		},
		setIsElectronDownloading: (state, action) => {
			state.isElectronDownLoading = action.payload;
		}
	},
	extraReducers(builder) {
		builder.addCase(fetchApplications.pending, (state) => {
			state.loadingStatus = 'loading';
		});
		builder.addCase(fetchApplications.fulfilled, (state, action) => {
			state.loadingStatus = 'loaded';
			state.appsData = action.payload;
			applicationAdapter.setAll(state, (action.payload.apps as IApplicationEntity[]) || []);
		});
		builder.addCase(fetchApplications.rejected, (state) => {
			state.loadingStatus = 'not loaded';
		});
		builder.addCase(getApplicationDetail.fulfilled, (state, action) => {
			state.appDetail = action.payload;
		});
		builder.addCase(editApplication.fulfilled, (state, action) => {
			state.appDetail = {
				...state.appDetail,
				...action.payload
			};
		});
		builder.addCase(fetchMezonOauthClient.fulfilled, (state, action: PayloadAction<ApiMezonOauthClient>) => {
			const clientId = action.payload.client_id ?? '';
			if (!state.entities[clientId]) return;
			state.entities[clientId].oAuthClient = action.payload;
		});
		builder.addCase(editMezonOauthClient.fulfilled, (state, action: PayloadAction<ApiMezonOauthClient>) => {
			const clientId = action.payload.client_id ?? '';
			if (!state.entities[clientId]) return;
			state.entities[clientId].oAuthClient = action.payload;
		});
	}
});

export const getApplicationState = (rootState: { [ADMIN_APPLICATIONS]: IApplicationState }): IApplicationState => rootState[ADMIN_APPLICATIONS];
export const selectAllApps = createSelector(getApplicationState, (state) => state.appsData || []);
export const selectAppDetail = createSelector(getApplicationState, (state) => state.appDetail);
export const selectCurrentAppId = createSelector(getApplicationState, (state) => state.currentAppId);
export const selectIsElectronUpdateAvailable = createSelector(getApplicationState, (state) => state.isElectronUpdateAvailable);
export const selectIsElectronDownloading = createSelector(getApplicationState, (state) => state.isElectronDownLoading);

export const selectApplicationById = createSelector(
	[getApplicationState, (state, appId: string) => appId],
	(state, appId) => state?.entities?.[appId]
);

export const selectAppsFetchingLoading = createSelector(getApplicationState, (state) => state.loadingStatus);

export const selectAppById = (appId: string) => createSelector(selectAllApps, (allApp) => allApp.apps?.find((app) => app.id === appId) || null);
export const adminApplicationReducer = adminApplicationSlice.reducer;
export const { setCurrentAppId, setIsElectronUpdateAvailable, setIsElectronDownloading } = adminApplicationSlice.actions;
