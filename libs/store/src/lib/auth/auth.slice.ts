import { captureSentryError } from '@mezon/logger';
import type { LoadingStatus } from '@mezon/utils';
import type { PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import type { Session } from 'mezon-js';
import { clearApiCallTracker } from '../cache-metadata';
import { ensureClientAsync, ensureSession, getMezonCtx, restoreLocalStorage } from '../helpers';
export const AUTH_FEATURE_KEY = 'auth';

export interface AuthState {
	loadingStatus: LoadingStatus;
	error?: string | null;
	session: Record<string, ISession> | null;
	isLogin?: boolean;
	isRegistering?: LoadingStatus;
	loadingStatusEmail?: LoadingStatus;
	redirectUrl?: string | null;
	activeAccount: string | null;
}

export interface ISession {
	readonly created: boolean;
	token: string;
	readonly created_at: number;
	expires_at?: number;
	refresh_expires_at?: number;
	refresh_token: string;
	username?: string;
	user_id?: string;
	vars?: object;
	is_remember?: boolean;
	api_url: string;
}

export const initialAuthState: AuthState = {
	loadingStatus: 'not loaded',
	session: null,
	isLogin: false,
	isRegistering: 'not loaded',
	loadingStatusEmail: 'not loaded',
	redirectUrl: null,
	activeAccount: null
};

function normalizeSession(session: Session): ISession {
	return session;
}

export const authenticateApple = createAsyncThunk('auth/authenticateApple', async (token: string, thunkAPI) => {
	const mezon = getMezonCtx(thunkAPI);
	const session = await mezon.authenticateMezon(token);
	if (!session) {
		return thunkAPI.rejectWithValue('Invalid session');
	}
	return normalizeSession(session);
});
export type AuthenticateEmailPayload = {
	email: string;
	password: string;
};

export const authenticateEmail = createAsyncThunk('auth/authenticateEmail', async ({ email, password }: AuthenticateEmailPayload, thunkAPI) => {
	const mezon = getMezonCtx(thunkAPI);
	const session = await mezon?.authenticateEmail(email, password);
	if (!session) {
		return thunkAPI.rejectWithValue('Invalid session');
	}
	return normalizeSession(session);
});

export const authenticateMezon = createAsyncThunk('auth/authenticateMezon', async (code: string, thunkAPI) => {
	const mezon = getMezonCtx(thunkAPI);
	const session = await mezon?.authenticateMezon(code).catch(function (err: any) {
		err.json().then((data: any) => {
			console.error(data.message);
		});
	});

	if (!session) {
		return thunkAPI.rejectWithValue('Invalid session');
	}
	return normalizeSession(session);
});

export const refreshSession = createAsyncThunk('auth/refreshSession', async (_, thunkAPI) => {
	const mezon = await ensureClientAsync(getMezonCtx(thunkAPI));
	const sessionState = selectSession(thunkAPI.getState() as unknown as { [AUTH_FEATURE_KEY]: AuthState });

	if (!sessionState) {
		return thunkAPI.rejectWithValue('Invalid refreshSession');
	}

	if (mezon.sessionRef.current?.token && mezon.sessionRef.current?.token === sessionState?.token) {
		return sessionState;
	}

	let session;
	try {
		session = await mezon?.refreshSession({
			...sessionState,
			is_remember: sessionState.is_remember ?? false
		});
	} catch (error: any) {
		return thunkAPI.rejectWithValue(error);
	}

	if (!session) {
		return thunkAPI.rejectWithValue('Redirect Login');
	}

	return normalizeSession(session);
});

export const checkSessionWithToken = createAsyncThunk('auth/checkSessionWithToken', async (_, thunkAPI) => {
	const mezon = await ensureClientAsync(getMezonCtx(thunkAPI));
	const sessionState = selectSession(thunkAPI.getState() as unknown as { [AUTH_FEATURE_KEY]: AuthState });

	if (!sessionState) {
		return thunkAPI.rejectWithValue('Invalid checkSessionWithToken');
	}

	if (mezon.sessionRef.current?.token === sessionState?.token) {
		return sessionState;
	}
	let session;
	try {
		session = await mezon?.connectWithSession({
			...sessionState,
			is_remember: sessionState.is_remember ?? false
		});
	} catch (error: any) {
		return thunkAPI.rejectWithValue('Redirect Login');
	}

	if (!session) {
		return thunkAPI.rejectWithValue('Invalid checkSessionWithToken');
	}

	return normalizeSession(session);
});

export const logOut = createAsyncThunk('auth/logOut', async ({ device_id, platform }: { device_id?: string; platform?: string }, thunkAPI) => {
	const mezon = getMezonCtx(thunkAPI);
	const sessionState = selectOthersSession(thunkAPI.getState() as unknown as { [AUTH_FEATURE_KEY]: AuthState });
	await mezon?.logOutMezon(device_id, platform, !sessionState);
	thunkAPI.dispatch(authActions.setLogout());
	clearApiCallTracker();
	const restoreKey = [
		'persist:apps',
		'persist:categories',
		'persist:clans',
		'current-theme',
		'hideNotificationContent',
		'remember_channel',
		'i18nextLng'
	];
	if (sessionState) {
		restoreKey.push('mezon_session');
	}
	restoreLocalStorage(restoreKey);
});

export const createQRLogin = createAsyncThunk('auth/getQRCode', async (_, thunkAPI) => {
	const mezon = getMezonCtx(thunkAPI);
	const QRlogin = await mezon?.createQRLogin();

	if (!QRlogin) {
		return thunkAPI.rejectWithValue('Invalid getQRCode');
	}
	return QRlogin;
});

export const checkLoginRequest = createAsyncThunk(
	'auth/checkLoginRequest',
	async ({ loginId, isRemember }: { loginId: string; isRemember: boolean }, thunkAPI) => {
		const mezon = getMezonCtx(thunkAPI);

		const session = await mezon?.checkLoginRequest({ login_id: loginId, is_remember: isRemember });
		if (session) {
			return normalizeSession(session);
		}
		return null;
	}
);

export const confirmLoginRequest = createAsyncThunk('auth/confirmLoginRequest', async ({ loginId }: { loginId: string }, thunkAPI) => {
	const mezon = getMezonCtx(thunkAPI);

	const session = await mezon?.confirmLoginRequest({ login_id: loginId });
	if (session) {
		return normalizeSession(session);
	}
	return null;
});

export const registrationPassword = createAsyncThunk(
	`auth/registrationPassword`,
	async ({ email, password, oldPassword }: { email: string; password: string; oldPassword?: string }, thunkAPI) => {
		if (!email || !password || !email.trim() || !password.trim()) {
			return thunkAPI.rejectWithValue('Invalid input');
		}

		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const response = await mezon.client.registrationPassword(mezon.session, email, password, oldPassword || '');

			if (!response) {
				return thunkAPI.rejectWithValue('Failed to register password');
			}
			return response;
		} catch (error) {
			captureSentryError(error, `auth/registrationPassword`);
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const authSlice = createSlice({
	name: AUTH_FEATURE_KEY,
	initialState: initialAuthState,
	reducers: {
		setRedirectUrl(state, action) {
			state.redirectUrl = action.payload;
		},

		setSession(state, action) {
			if (action.payload.user_id) {
				if (!state.session) {
					state.session = {
						[action.payload.user_id]: action.payload
					};
				} else {
					state.session[action.payload.user_id] = action.payload;
				}
				state.activeAccount = action.payload.user_id;
			}
			state.isLogin = true;
		},
		setLogout(state) {
			if (state.session && state.activeAccount && Object.keys(state.session).length >= 2) {
				delete state.session?.[state.activeAccount];
				const key = Object.keys(state.session || [])[0];
				state.activeAccount = key;
			} else {
				state.activeAccount = null;
				state.session = null;
				state.isLogin = false;
			}
			state.loadingStatus = 'not loaded';
		},
		refreshStatus(state) {
			state.loadingStatus = 'not loaded';
			state.loadingStatusEmail = 'not loaded';
		},
		checkFormatSession(state) {
			const newSession: any = state.session;
			if (newSession.token || !state.activeAccount) {
				state.session = null;
				state.isLogin = false;
				state.activeAccount = null;
			}
		},
		turnOffSetAccount(state) {
			state.isLogin = true;
		},
		switchAccount(state, action: PayloadAction<string>) {
			state.activeAccount = action.payload;
		}
	},
	extraReducers: (builder) => {
		builder
			.addCase(authenticateApple.pending, (state: AuthState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(authenticateApple.fulfilled, (state: AuthState, action) => {
				state.loadingStatus = 'loaded';
				if (action.payload.user_id) {
					if (!state.session) {
						state.session = {
							[action.payload.user_id]: action.payload
						};
					} else {
						state.session[action.payload.user_id] = action.payload;
					}
					state.activeAccount = action.payload.user_id;
				}

				state.isLogin = true;
			})
			.addCase(authenticateApple.rejected, (state: AuthState, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			});

		builder
			.addCase(refreshSession.pending, (state: AuthState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(refreshSession.fulfilled, (state: AuthState, action) => {
				state.loadingStatus = 'loaded';
				if (action.payload.user_id) {
					if (!state.session) {
						state.session = {
							[action.payload.user_id]: action.payload
						};
					} else {
						state.session[action.payload.user_id] = action.payload;
					}
					state.activeAccount = `${action.payload.user_id}`;
				}
				state.isLogin = true;
			})
			.addCase(refreshSession.rejected, (state: AuthState, action) => {
				state.loadingStatus = 'not loaded';
				state.error = action.error.message;
			});
		builder
			.addCase(checkSessionWithToken.pending, (state: AuthState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(checkSessionWithToken.fulfilled, (state: AuthState, action) => {
				state.loadingStatus = 'loaded';
				if (action.payload.user_id) {
					if (!state.session) {
						state.session = {
							[action.payload.user_id]: action.payload
						};
					} else {
						state.session[action.payload.user_id] = action.payload;
					}
					state.activeAccount = `${action.payload.user_id}`;
				}
				state.isLogin = true;
			})
			.addCase(checkSessionWithToken.rejected, (state: AuthState, action) => {
				state.loadingStatus = 'not loaded';
				state.error = action.error.message;
			});
		builder
			.addCase(checkLoginRequest.fulfilled, (state: AuthState, action) => {
				if (action.payload !== null) {
					if (state.session && action.payload.user_id) {
						state.session[action.payload.user_id] = action.payload;
					}
					if (!state.session && action.payload.user_id) {
						state.session = {
							[action.payload.user_id]: action.payload
						};
					}
					state.isLogin = true;
				}
			})
			.addCase(checkLoginRequest.rejected, (state: AuthState, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			});
		builder
			.addCase(confirmLoginRequest.pending, (state: AuthState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(confirmLoginRequest.fulfilled, (state: AuthState, action) => {
				state.loadingStatus = 'loaded';
			})
			.addCase(confirmLoginRequest.rejected, (state: AuthState, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			});
		builder
			.addCase(authenticateMezon.pending, (state: AuthState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(authenticateMezon.fulfilled, (state: AuthState, action) => {
				state.loadingStatus = 'loaded';
				if (action.payload.user_id) {
					if (!state.session) {
						state.session = {
							[action.payload.user_id]: action.payload
						};
					} else {
						state.session[action.payload.user_id] = action.payload;
					}
					state.activeAccount = `${action.payload.user_id}`;
				}
				state.isLogin = true;
			})
			.addCase(authenticateMezon.rejected, (state: AuthState, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			});
		builder
			.addCase(authenticateEmail.pending, (state: AuthState) => {
				state.loadingStatusEmail = 'loading';
			})
			.addCase(authenticateEmail.fulfilled, (state: AuthState, action) => {
				state.loadingStatusEmail = 'loaded';
				state.isLogin = true;
				if (action.payload.user_id) {
					if (!state.session) {
						state.session = {
							[action.payload.user_id]: action.payload
						};
					} else {
						state.session[action.payload.user_id] = action.payload;
					}
					state.activeAccount = `${action.payload.user_id}`;
				}
			})
			.addCase(authenticateEmail.rejected, (state: AuthState, action) => {
				state.loadingStatusEmail = 'error';
				state.error = action.error.message;
			});
		builder
			.addCase(registrationPassword.pending, (state) => {
				state.isRegistering = 'loading';
			})
			.addCase(registrationPassword.fulfilled, (state, action) => {
				state.isRegistering = 'loaded';
			})
			.addCase(registrationPassword.rejected, (state, action) => {
				state.isRegistering = 'error';
				state.error = action.error.message;
			});
	}
});

/*
 * Export reducer for store configuration.
 */
export const authReducer = authSlice.reducer;

export const authActions = {
	...authSlice.actions,
	authenticateApple,
	authenticateMezon,
	refreshSession,
	createQRLogin,
	checkLoginRequest,
	confirmLoginRequest,
	logOut,
	registrationPassword,
	authenticateEmail,
	checkSessionWithToken
};

export const getAuthState = (rootState: { [AUTH_FEATURE_KEY]: AuthState }): AuthState => rootState[AUTH_FEATURE_KEY];

export const selectAllAuth = createSelector(getAuthState, (state: AuthState) => state);

export const selectAuthIsLoaded = createSelector(getAuthState, (state: AuthState) => state.loadingStatus === 'loaded');

export const selectIsLogin = createSelector(getAuthState, (state: AuthState) => state.isLogin);

export const selectSession = createSelector(getAuthState, (state: AuthState) => {
	if (state.activeAccount) {
		return state.session?.[state.activeAccount];
	}
	const key = Object.keys(state.session || [])[0];
	return state.session?.[key];
});

export const selectRegisteringStatus = createSelector(getAuthState, (state: AuthState) => state.isRegistering);

export const selectLoadingEmail = createSelector(getAuthState, (state: AuthState) => state.loadingStatusEmail);

export const selectOthersSession = createSelector(getAuthState, (state: AuthState) => {
	const key = Object.keys(state.session || []).filter((key) => {
		return key !== state.activeAccount;
	});
	return state.session?.[key[0]];
});

export const selectAllSession = createSelector(getAuthState, (state: AuthState) => {
	return state.session;
});
