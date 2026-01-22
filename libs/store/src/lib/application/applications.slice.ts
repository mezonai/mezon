import { captureSentryError } from '@mezon/logger';
import type { LoadingStatus } from '@mezon/utils';
import type { EntityState, PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import type { ApiAddAppRequest, ApiApp, ApiAppList, ApiMezonOauthClient, MezonUpdateAppBody } from 'mezon-js/api.gen';
import type { CacheMetadata } from '../cache-metadata';
import { createApiKey, createCacheMetadata, markApiFirstCalled, shouldForceApiCall } from '../cache-metadata';
import type { MezonValueContext } from '../helpers';
import { ensureSession, getMezonCtx, withRetry } from '../helpers';
import type { RootState } from '../store';

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
	cache?: CacheMetadata;
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

export interface IFetchAppsArg {
	noCache?: boolean;
}

export const fetchApplicationsCached = async (getState: () => RootState, mezon: MezonValueContext, noCache = false) => {
	const currentState = getState();
	const applicationState = currentState[ADMIN_APPLICATIONS];

	const apiKey = createApiKey('fetchApplications', mezon.session.username || '');

	const shouldForceCall = shouldForceApiCall(apiKey, applicationState.cache, noCache);

	if (!shouldForceCall && applicationState.appsData?.apps?.length) {
		return {
			...applicationState.appsData,
			fromCache: true,
			time: applicationState.cache?.lastFetched || Date.now()
		};
	}

	const response = await withRetry((session) => mezon.client.listApps(session), {
		maxRetries: 3,
		initialDelay: 1000,
		scope: 'apps-list',
		mezon
	});

	markApiFirstCalled(apiKey);

	return {
		...response,
		fromCache: false,
		time: Date.now()
	};
};

export const fetchApplications = createAsyncThunk('adminApplication/fetchApplications', async ({ noCache }: IFetchAppsArg = {}, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		const response = await fetchApplicationsCached(thunkAPI.getState as () => RootState, mezon, Boolean(noCache));
		return response;
	} catch (error) {
		captureSentryError(error, 'adminApplication/fetchApplications');
		return thunkAPI.rejectWithValue(error);
	}
});

export const getApplicationDetail = createAsyncThunk('adminApplication/getApplicationDetail', async ({ appId }: { appId: string }, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		const response = await withRetry((session) => mezon.client.getApp(session, appId), {
			maxRetries: 3,
			initialDelay: 1000,
			scope: 'app-detail',
			mezon
		});
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
			await thunkAPI.dispatch(fetchApplications({ noCache: true }));
			return response;
		} else {
			return thunkAPI.rejectWithValue({});
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
				return response;
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
			const response = await withRetry((session) => mezon.client.getMezonOauthClient(session, appId, appName), {
				maxRetries: 3,
				initialDelay: 1000,
				scope: '0auth-client',
				mezon
			});
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
		builder.addCase(fetchApplications.fulfilled, (state, action: PayloadAction<ApiAppList & { fromCache?: boolean }>) => {
			const { fromCache, ...appsData } = action.payload;

			state.loadingStatus = 'loaded';

			if (!fromCache) {
				state.appsData = appsData;
				state.cache = createCacheMetadata();
				applicationAdapter.setAll(state, (appsData.apps as IApplicationEntity[]) || []);
			}
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

export const adminApplicationReducer = adminApplicationSlice.reducer;
export const { setCurrentAppId, setIsElectronUpdateAvailable, setIsElectronDownloading } = adminApplicationSlice.actions;
