import { captureSentryError } from '@mezon/logger';
import type { LoadingStatus } from '@mezon/utils';
import type { EntityState, PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import type {
	ApiAddAppRequest,
	ApiApp,
	ApiAppList,
	ApiCreateChannelDescRequest,
	ApiMezonOauthClient,
	ApiUploadAttachment,
	ApiUploadAttachmentRequest,
	MezonUpdateAppBody
} from 'mezon-js';
import {
	AddAppRequest,
	App,
	AppClan,
	AppList,
	ChannelDescription,
	CreateChannelDescRequest,
	GetMezonOauthClientRequest,
	ListAppsRequest,
	MezonOauthClient,
	UpdateAppRequest,
	UploadAttachment,
	UploadAttachmentRequest
} from 'mezon-js-protobuf';
import type { AdminSessionContext } from '../auth/adminSession';
import type { CacheMetadata } from '../cache-metadata';
import { createApiKey, createCacheMetadata, markApiFirstCalled, shouldForceApiCall } from '../cache-metadata';
import type { RootState } from '../store';
import { callApiAdmin } from './adminAPI.slice';

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
	currentAppId: undefined
});

export interface IFetchAppsArg {
	noCache?: boolean;
}

export const fetchApplicationsCached = async (thunkAPI: AdminSessionContext, noCache = false) => {
	const currentState = thunkAPI.getState() as RootState;
	const applicationState = currentState[ADMIN_APPLICATIONS];

	if (!currentState?.auth?.session) {
		throw 'Session Empty';
	}
	const apiKey = createApiKey('fetchApplications', currentState.auth?.session?.token || '');

	const shouldForceCall = shouldForceApiCall(apiKey, applicationState.cache, noCache);

	if (!shouldForceCall && applicationState.appsData?.apps?.length) {
		return {
			...applicationState.appsData,
			fromCache: true,
			time: applicationState.cache?.lastFetched || Date.now()
		};
	}

	const response = await callApiAdmin({
		path: '/mezon.api.Mezon/ListApps',
		data: ListAppsRequest.encode(ListAppsRequest.fromPartial({})).finish(),
		thunkAPI,
		decodeBody: (bytes) => AppList.decode(bytes) as ApiAppList
	});

	markApiFirstCalled(apiKey);

	return {
		...response,
		fromCache: false,
		time: Date.now()
	};
};

export const uploadAppLogoAdmin = createAsyncThunk('adminApplication/uploadAppLogo', async (body: ApiUploadAttachmentRequest, thunkAPI) => {
	const state = thunkAPI.getState() as RootState;

	if (!state?.auth?.session) {
		throw 'Session Empty';
	}

	const response = await callApiAdmin({
		path: '/mezon.api.Mezon/UploadOauthFile',
		data: UploadAttachmentRequest.encode(UploadAttachmentRequest.fromPartial(body)).finish(),
		thunkAPI,
		decodeBody: (bytes) => UploadAttachment.decode(bytes) as ApiUploadAttachment
	});

	return {
		...response,
		fromCache: false,
		time: Date.now()
	};
});
export const fetchApplications = createAsyncThunk('adminApplication/fetchApplications', async ({ noCache }: IFetchAppsArg = {}, thunkAPI) => {
	try {
		const response = await fetchApplicationsCached(thunkAPI, Boolean(noCache));
		return response;
	} catch (error) {
		captureSentryError(error, 'adminApplication/fetchApplications');
		return thunkAPI.rejectWithValue(error);
	}
});

export const getApplicationDetail = createAsyncThunk('adminApplication/getApplicationDetail', async ({ appId }: { appId: string }, thunkAPI) => {
	try {
		const state = thunkAPI.getState() as RootState;
		if (!state.auth.session) {
			throw 'Empty Session';
		}
		const response = await callApiAdmin({
			path: '/mezon.api.Mezon/GetApp',
			data: App.encode(App.fromPartial({ id: appId })).finish(),
			decodeBody: (bytes) => App.decode(bytes) as ApiApp,
			thunkAPI
		});

		thunkAPI.dispatch(setCurrentAppId(appId));
		return response;
	} catch (error) {
		captureSentryError(error, 'adminApplication/getApplicationDetail');
		return thunkAPI.rejectWithValue(error);
	}
});

export const createChannelApp = createAsyncThunk('adminApplication/createChannelApp', async (body: ApiCreateChannelDescRequest, thunkAPI) => {
	try {
		const state = thunkAPI.getState() as RootState;
		if (!state.auth.session) {
			throw 'Empty Session';
		}
		const response = await callApiAdmin({
			path: '/mezon.api.Mezon/CreateChannelDesc',
			data: CreateChannelDescRequest.encode(CreateChannelDescRequest.fromPartial(body)).finish(),
			decodeBody: (bytes) => ChannelDescription.decode(bytes),
			thunkAPI
		});

		return response;
	} catch (error) {
		captureSentryError(error, 'adminApplication/createChannelApp');
		return thunkAPI.rejectWithValue(error);
	}
});

export const createApplication = createAsyncThunk('adminApplication/createApplication', async (data: { request: ApiAddAppRequest }, thunkAPI) => {
	try {
		const state = thunkAPI.getState() as RootState;
		if (!state.auth.session) {
			throw 'Empty Session';
		}
		if (!data.request.appname?.trim()) {
			throw 'Empty Appname ';
		}
		const response = await callApiAdmin({
			path: '/mezon.api.Mezon/AddApp',
			data: AddAppRequest.encode(
				AddAppRequest.fromPartial({
					...data.request,
					creator_id: data.request.creator_id && data.request.creator_id !== '0' ? data.request.creator_id : '0'
				})
			).finish(),
			decodeBody: (bytes) => App.decode(bytes) as ApiApp,
			thunkAPI
		});
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
		const state = thunkAPI.getState() as RootState;
		if (!state.auth.session) {
			throw 'Empty Session';
		}
		await callApiAdmin({
			path: '/mezon.api.Mezon/AddAppToClan',
			data: AppClan.encode(AppClan.fromPartial({ app_id: data.appId, clan_id: data.clanId })).finish(),
			decodeBody: () => ({}),
			thunkAPI
		});
	} catch (error) {
		captureSentryError(error, 'adminApplication/addBotChat');
		return thunkAPI.rejectWithValue(error);
	}
});

export const editApplication = createAsyncThunk(
	'adminApplication/editApplication',
	async (data: { request: MezonUpdateAppBody; appId: string }, thunkAPI) => {
		try {
			const state = thunkAPI.getState() as RootState;
			if (!state.auth.session) {
				throw 'Empty Session';
			}
			const response = await callApiAdmin({
				path: '/mezon.api.Mezon/UpdateApp',
				data: UpdateAppRequest.encode(UpdateAppRequest.fromPartial({ ...data.request, id: data.appId })).finish(),
				decodeBody: (bytes) => App.decode(bytes) as ApiApp,
				thunkAPI
			});
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
		const state = thunkAPI.getState() as RootState;
		if (!state.auth.session) {
			throw 'Empty Session';
		}
		const response = await callApiAdmin({
			path: '/mezon.api.Mezon/DeleteApp',
			data: App.encode(App.fromPartial({ id: appId })).finish(),
			decodeBody: () => true,
			thunkAPI
		});
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
			const state = thunkAPI.getState() as RootState;
			if (!state.auth.session) {
				throw 'Empty Session';
			}
			const response = await callApiAdmin({
				path: '/mezon.api.Mezon/GetMezonOauthClient',
				data: GetMezonOauthClientRequest.encode(
					GetMezonOauthClientRequest.fromPartial({
						client_id: appId,
						client_name: appName
					})
				).finish(),
				decodeBody: (bytes) => MezonOauthClient.decode(bytes) as ApiMezonOauthClient,
				thunkAPI
			});
			return response;
		} catch (error) {
			captureSentryError(error, 'adminApplication/fetchMezonOauthClient');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const editMezonOauthClient = createAsyncThunk<
	ApiMezonOauthClient,
	{ body: ApiMezonOauthClient },
	{ rejectedMeta: { error: { toast: boolean } } }
>('adminApplication/editMezonOauthClient', async ({ body }: { body: ApiMezonOauthClient }, thunkAPI) => {
	try {
		const state = thunkAPI.getState() as RootState;
		if (!state.auth.session) {
			throw 'Empty Session';
		}
		const response = await callApiAdmin({
			path: '/mezon.api.Mezon/UpdateMezonOauthClient',
			data: MezonOauthClient.encode(MezonOauthClient.fromPartial(body)).finish(),
			decodeBody: (bytes) => MezonOauthClient.decode(bytes) as ApiMezonOauthClient,
			thunkAPI
		});
		return response;
	} catch (error) {
		captureSentryError(error, 'adminApplication/editMezonOauthClient');
		return thunkAPI.rejectWithValue(error, { error: { toast: false } });
	}
});

export const adminApplicationSlice = createSlice({
	name: ADMIN_APPLICATIONS,
	initialState: applicationInitialState,
	reducers: {
		setCurrentAppId: (state, action) => {
			state.currentAppId = action.payload;
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
			const detail = action.payload as Record<string, unknown>;
			if (detail?.is_shadow !== undefined) {
				detail.is_shadow = detail.is_shadow === true || detail.is_shadow === 'true';
			}
			state.appDetail = detail as ApiApp;
		});
		builder.addCase(editApplication.fulfilled, (state, action) => {
			const { appId, request } = action.meta.arg;
			if (!action.payload || !appId) return;

			const payload: ApiApp & Partial<Pick<App, 'disable_time_seconds'>> = action.payload;
			const changes: Partial<typeof payload> & Pick<MezonUpdateAppBody, 'metadata'> = {};

			for (const key of ['appname', 'applogo', 'app_url', 'about', 'metadata'] as const) {
				const value = request[key];
				if (value === undefined) continue;
				if (key !== 'applogo' && value === '') continue;
				changes[key] = value;
			}

			const isShadow: unknown = request.is_shadow;
			if (isShadow !== undefined) {
				changes.is_shadow = isShadow === true || isShadow === 'true' || isShadow === 1 || isShadow === '1';
			}
			if (request.token !== undefined && payload.token) {
				changes.token = payload.token;
			}
			if (payload.disable_time_seconds !== undefined) {
				changes.disable_time_seconds = payload.disable_time_seconds;
			}

			if (state.appDetail.id === appId) {
				Object.assign(state.appDetail, changes);
			}
			const listedApp = state.appsData.apps?.find((app) => app.id === appId);
			if (listedApp) {
				Object.assign(listedApp, changes);
			}
			applicationAdapter.updateOne(state, { id: appId, changes });
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

export const selectApplicationById = createSelector(
	[getApplicationState, (state, appId: string) => appId],
	(state, appId) => state?.entities?.[appId]
);

export const selectAppsFetchingLoading = createSelector(getApplicationState, (state) => state.loadingStatus);

export const adminApplicationReducer = adminApplicationSlice.reducer;
export const { setCurrentAppId } = adminApplicationSlice.actions;
