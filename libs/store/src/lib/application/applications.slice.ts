import { captureSentryError } from '@mezon/logger';
import type { LoadingStatus } from '@mezon/utils';
import type { EntityState } from '@reduxjs/toolkit';
import { createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import type { ApiAddAppRequest, ApiApp, ApiAppList, ApiMezonOauthClient, MezonUpdateAppBody } from 'mezon-js/types';
import type { CacheMetadata } from '../cache-metadata';
import { createApiKey, createCacheMetadata, markApiFirstCalled, shouldForceApiCall } from '../cache-metadata';
import type { MezonValueContext } from '../helpers';
import { ensureSession, getMezonCtx, timestampToString, withRetry } from '../helpers';
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
		nextCursor: undefined,
		totalCount: undefined
	},
	appDetail: {
		id: '',
		applogo: undefined,
		appname: undefined,
		creatorId: undefined,
		disableTime: undefined,
		isShadow: undefined,
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

	const response = await withRetry(() => mezon.client.listApps(mezon.session), {
		maxRetries: 3,
		initialDelay: 1000,
		scope: 'apps-list'
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
		const response = await withRetry(() => mezon.client.getApp(mezon.session, appId), {
			maxRetries: 3,
			initialDelay: 1000,
			scope: 'app-detail'
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
		const requestWithTypeName = {
			$typeName: 'mezon.api.AddAppRequest' as const,
			appname: data.request.appname || '',
			token: data.request.token || '',
			creatorId: data.request.creatorId || '',
			role: data.request.role ?? 0,
			isShadow: data.request.isShadow ?? false,
			appUrl: data.request.appUrl || '',
			appLogo: data.request.appLogo || '',
			aboutMe: data.request.aboutMe || ''
		};
		const response = await mezon.client.addApp(mezon.session, requestWithTypeName);
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
			const requestWithTypeName = {
				$typeName: 'mezon.api.UpdateAppRequest' as const,
				id: data.appId,
				about: data.request.about || '',
				appUrl: data.request.appUrl || '',
				isShadow: data.request.isShadow || '',
				appname: data.request.appname,
				metadata: data.request.metadata,
				applogo: data.request.applogo,
				token: data.request.token
			};
			const response = await mezon.client.updateApp(mezon.session, data.appId, requestWithTypeName);
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
			const response = await withRetry(() => mezon.client.getMezonOauthClient(mezon.session, appId, appName), {
				maxRetries: 3,
				initialDelay: 1000,
				scope: '0auth-client'
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
			const bodyWithTypeName = {
				$typeName: 'mezon.api.MezonOauthClient' as const,
				accessTokenStrategy: body.accessTokenStrategy || '',
				allowedCorsOrigins: body.allowedCorsOrigins || [],
				audience: body.audience || [],
				authorizationCodeGrantAccessTokenLifespan: body.authorizationCodeGrantAccessTokenLifespan || '',
				authorizationCodeGrantIdTokenLifespan: body.authorizationCodeGrantIdTokenLifespan || '',
				authorizationCodeGrantRefreshTokenLifespan: body.authorizationCodeGrantRefreshTokenLifespan || '',
				backchannelLogoutSessionRequired: body.backchannelLogoutSessionRequired ?? false,
				backchannelLogoutUri: body.backchannelLogoutUri || '',
				clientCredentialsGrantAccessTokenLifespan: body.clientCredentialsGrantAccessTokenLifespan || '',
				clientId: body.clientId || '',
				clientName: body.clientName || '',
				clientSecret: body.clientSecret || '',
				clientSecretExpiresAt: body.clientSecretExpiresAt ?? 0,
				clientUri: body.clientUri || '',
				contacts: body.contacts || [],
				frontchannelLogoutSessionRequired: body.frontchannelLogoutSessionRequired ?? false,
				frontchannelLogoutUri: body.frontchannelLogoutUri || '',
				grantTypes: body.grantTypes || [],
				implicitGrantAccessTokenLifespan: body.implicitGrantAccessTokenLifespan || '',
				implicitGrantIdTokenLifespan: body.implicitGrantIdTokenLifespan || '',
				jwks: body.jwks || [],
				jwksUri: body.jwksUri || '',
				jwtBearerGrantAccessTokenLifespan: body.jwtBearerGrantAccessTokenLifespan || '',
				logoUri: body.logoUri || '',
				owner: body.owner || '',
				policyUri: body.policyUri || '',
				postLogoutRedirectUris: body.postLogoutRedirectUris || [],
				redirectUris: body.redirectUris || [],
				refreshTokenGrantAccessTokenLifespan: body.refreshTokenGrantAccessTokenLifespan || '',
				refreshTokenGrantIdTokenLifespan: body.refreshTokenGrantIdTokenLifespan || '',
				refreshTokenGrantRefreshTokenLifespan: body.refreshTokenGrantRefreshTokenLifespan || '',
				requestObjectSigningAlg: body.requestObjectSigningAlg || '',
				requestUris: body.requestUris || [],
				responseTypes: body.responseTypes || [],
				scope: body.scope || '',
				sectorIdentifierUri: body.sectorIdentifierUri || '',
				skipConsent: body.skipConsent ?? false,
				skipLogoutConsent: body.skipLogoutConsent ?? false,
				subjectType: body.subjectType || '',
				tokenEndpointAuthMethod: body.tokenEndpointAuthMethod || '',
				tokenEndpointAuthSigningAlg: body.tokenEndpointAuthSigningAlg || '',
				tosUri: body.tosUri || '',
				userinfoSignedResponseAlg: body.userinfoSignedResponseAlg || '',
				registrationAccessToken: body.registrationAccessToken || '',
				registrationClientUri: body.registrationClientUri || ''
			};
			const response = await mezon.client.updateMezonOauthClient(mezon.session, bodyWithTypeName);
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
			const { fromCache, ...appsData } = action.payload;

			state.loadingStatus = 'loaded';

			if (!fromCache) {
				state.appsData = {
					...appsData,
					apps: (appsData.apps || []).map((app) => ({
						...app,
						disableTime: timestampToString((app as any).disableTime)
					})) as ApiApp[]
				};
				state.cache = createCacheMetadata();
				const apps = (state.appsData.apps || []).map((app) => ({
					...app,
					id: app.id || ''
				})) as IApplicationEntity[];
				applicationAdapter.setAll(state, apps);
			}
		});
		builder.addCase(fetchApplications.rejected, (state) => {
			state.loadingStatus = 'not loaded';
		});
		builder.addCase(getApplicationDetail.fulfilled, (state, action) => {
			state.appDetail = {
				...action.payload,
				disableTime: timestampToString(action.payload.disableTime)
			} as ApiApp;
		});
		builder.addCase(editApplication.fulfilled, (state, action) => {
			if (action.payload) {
				state.appDetail = {
					...state.appDetail,
					...action.payload,
					disableTime: timestampToString((action.payload as any).disableTime)
				} as ApiApp;
			}
		});
		builder.addCase(fetchMezonOauthClient.fulfilled, (state, action) => {
			const clientId = action.payload.clientId ?? '';
			if (!state.entities[clientId]) return;
			state.entities[clientId].oAuthClient = {
				...action.payload,
				createdAt: timestampToString(action.payload.createdAt),
				updatedAt: timestampToString(action.payload.updatedAt)
			} as ApiMezonOauthClient;
		});
		builder.addCase(editMezonOauthClient.fulfilled, (state, action) => {
			const clientId = action.payload.clientId ?? '';
			if (!state.entities[clientId]) return;
			state.entities[clientId].oAuthClient = {
				...action.payload,
				createdAt: timestampToString(action.payload.createdAt),
				updatedAt: timestampToString(action.payload.updatedAt)
			} as ApiMezonOauthClient;
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
