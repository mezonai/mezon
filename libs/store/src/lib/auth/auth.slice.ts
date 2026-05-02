import { captureSentryError } from '@mezon/logger';
import type { MezonContextValue } from '@mezon/transport';
import { extractAndSaveConfig, resolveSessionWsUrl, socketState } from '@mezon/transport';
import type { LoadingStatus } from '@mezon/utils';
import type { PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import { t } from 'i18next';
import type { ApiLinkAccountConfirmRequest, ApiSession } from 'mezon-js';
import { toast } from 'react-toastify';
import { clearApiCallTracker } from '../cache-metadata';
import { listChannelsByUserActions } from '../channels/channelUser.slice';
import { ensureClientAsync, ensureSession, getMezonCtx, restoreLocalStorage } from '../helpers';
import { videoStreamActions } from '../stream/videoStream.slice';
import { voiceActions } from '../voice/voice.slice';
import { walletActions } from '../wallet/wallet.slice';

export const AUTH_FEATURE_KEY = 'auth';

export interface AuthState {
	loadingStatus: LoadingStatus;
	error?: string | null;
	session: ISession | null;
	isLogin?: boolean;
	isRegistering?: LoadingStatus;
	loadingStatusEmail?: LoadingStatus;
	redirectUrl?: string | null;
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
	id_token?: string;
	ws_url?: string;
	session_id?: string;
}

export const initialAuthState: AuthState = {
	loadingStatus: 'not loaded',
	session: null,
	isLogin: false,
	isRegistering: 'not loaded',
	loadingStatusEmail: 'not loaded',
	redirectUrl: null
};

function normalizeSession(session: ApiSession): ISession {
	return session as ISession;
}

async function persistSessionConnectAfterLogin(mezon: MezonContextValue, session: ApiSession): Promise<ApiSession> {
	if (!mezon.clientRef.current) {
		throw new Error('Client not initialized');
	}
	const wsUrl = resolveSessionWsUrl(session);
	const merged: ApiSession = { ...session, ws_url: wsUrl };
	mezon.sessionRef.current = merged;

	const config = extractAndSaveConfig(merged);
	if (config) {
		mezon.clientRef.current.setBasePath(config.host, config.port, config.useSSL);
	}

	const connectId = (merged.session_id || merged.token || '').trim();
	if (!connectId) {
		throw new Error('Mezon connect: missing session_id and token');
	}

	await mezon.clientRef.current.connect(connectId, wsUrl, true, false);
	socketState.status = 'connected';

	return merged;
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

export type AuthenticateEmailOTPRequestPayload = {
	email: string;
};

export type AuthenticatePhoneSMSOTPRequestPayload = {
	phone: string;
};

export const authenticateEmail = createAsyncThunk('auth/authenticateEmail', async ({ email, password }: AuthenticateEmailPayload, thunkAPI) => {
	const mezon = getMezonCtx(thunkAPI);
	if (!mezon?.clientRef.current) {
		return thunkAPI.rejectWithValue('Client not initialized');
	}
	const session = await mezon?.clientRef.current?.authenticateEmail(email, password);
	if (session && session?.id_token) {
		const proofInput = {
			jwt: session.id_token
		};

		await thunkAPI.dispatch(walletActions.fetchZkProofs(proofInput));
	}
	if (!session) {
		return thunkAPI.rejectWithValue('Invalid session');
	}

	let merged: ApiSession;
	try {
		merged = await persistSessionConnectAfterLogin(mezon, session);
	} catch (error) {
		return thunkAPI.rejectWithValue((error as Error)?.message || 'Connect failed');
	}

	mezon.clientRef.current.onrefreshsession = (sessionNew: ApiSession) => {
		console.warn('Login Email Refresh Session');
		thunkAPI.dispatch(authActions.setSessionId(sessionNew.session_id));
		mezon.sessionRef.current = {
			...(mezon.sessionRef.current as ApiSession),
			...sessionNew,
			session_id: sessionNew.session_id
		};
	};

	return normalizeSession(merged);
});

export const authenticateMezon = createAsyncThunk('auth/authenticateMezon', async (code: string, thunkAPI) => {
	const mezon = getMezonCtx(thunkAPI);
	if (!mezon?.clientRef.current) {
		return thunkAPI.rejectWithValue('Client not initialized');
	}
	const session = await mezon?.clientRef.current?.authenticateMezon(code);
	if (session && session.id_token) {
		const proofInput = {
			jwt: session.id_token
		};

		await thunkAPI.dispatch(walletActions.fetchZkProofs(proofInput));
	}

	if (!session) {
		return thunkAPI.rejectWithValue('Invalid session');
	}

	let merged: ApiSession;
	try {
		merged = await persistSessionConnectAfterLogin(mezon, session);
	} catch (error) {
		return thunkAPI.rejectWithValue((error as Error)?.message || 'Connect failed');
	}

	mezon.clientRef.current.onrefreshsession = (sessionNew: ApiSession) => {
		console.warn('Login Mezon Refresh Session');
		thunkAPI.dispatch(authActions.setSessionId(sessionNew.session_id));
		mezon.sessionRef.current = {
			...(mezon.sessionRef.current as ApiSession),
			...sessionNew,
			session_id: sessionNew.session_id
		};
	};

	return normalizeSession(merged);
});

export const checkSessionWithToken = createAsyncThunk('auth/checkSessionWithToken', async (_, thunkAPI) => {
	const mezon = await ensureClientAsync(getMezonCtx(thunkAPI));

	if (!mezon.sessionRef.current) {
		return thunkAPI.rejectWithValue('Invalid checkSessionWithToken');
	}

	let session;
	try {
		session = await mezon?.connectWithSession({
			...mezon.sessionRef.current
		} as ApiSession);
	} catch (error: any) {
		return thunkAPI.rejectWithValue('Redirect Login');
	}

	if (!session) {
		return thunkAPI.rejectWithValue('Invalid checkSessionWithToken');
	}

	return normalizeSession(session);
});

export const authenticateEmailOTPRequest = createAsyncThunk(
	'auth/authenticateEmailOTPRequest',
	async ({ email }: AuthenticateEmailOTPRequestPayload, thunkAPI) => {
		const mezon = getMezonCtx(thunkAPI);
		if (!mezon?.clientRef.current) {
			return thunkAPI.rejectWithValue('Client not initialized');
		}
		const res = await mezon.clientRef.current.authenticateEmailOTPRequest(email);
		if (!res) {
			return thunkAPI.rejectWithValue('Invalid session');
		}

		mezon.clientRef.current.onrefreshsession = (session: ApiSession) => {
			console.warn('Login Email OTP Refresh Session');
			thunkAPI.dispatch(authActions.setSessionId(session.session_id));
			mezon.sessionRef.current = {
				...session,
				session_id: session.session_id
			};
		};
		return res;
	}
);

export const confirmAuthenticateOTP = createAsyncThunk('auth/confirmAuthenticateOTP', async (data: ApiLinkAccountConfirmRequest, thunkAPI) => {
	const mezon = getMezonCtx(thunkAPI);
	if (!mezon?.clientRef.current) {
		return thunkAPI.rejectWithValue('Client not initialized');
	}
	const session = await mezon.clientRef.current.confirmAuthenticateOTP(data);
	if (session && session?.id_token) {
		const proofInput = {
			jwt: session.id_token
		};
		await thunkAPI.dispatch(walletActions.fetchZkProofs(proofInput));
	}
	if (!session) {
		return thunkAPI.rejectWithValue('Invalid session');
	}

	let merged: ApiSession;
	try {
		merged = await persistSessionConnectAfterLogin(mezon, session);
	} catch (error) {
		return thunkAPI.rejectWithValue((error as Error)?.message || 'Connect failed');
	}

	mezon.clientRef.current.onrefreshsession = (sessionNew: ApiSession) => {
		console.warn('Confirm OTP Refresh Session');
		thunkAPI.dispatch(authActions.setSessionId(sessionNew.session_id));
		mezon.sessionRef.current = {
			...(mezon.sessionRef.current as ApiSession),
			...sessionNew,
			session_id: sessionNew.session_id
		};
	};
	return normalizeSession(merged);
});

export const authenticatePhoneSMSOTPRequest = createAsyncThunk(
	'auth/authenticatePhoneSMSOTPRequest',
	async ({ phone }: AuthenticatePhoneSMSOTPRequestPayload, thunkAPI) => {
		const mezon = getMezonCtx(thunkAPI);
		if (!mezon?.clientRef.current) {
			return thunkAPI.rejectWithValue('Client not initialized');
		}
		const res = await mezon.clientRef.current.authenticateSMSOTPRequest(phone);
		if (!res) {
			return thunkAPI.rejectWithValue('Invalid session');
		}

		mezon.clientRef.current.onrefreshsession = (session: ApiSession) => {
			console.warn('Phone SMS Refresh Session');
			thunkAPI.dispatch(authActions.setSessionId(session.session_id));
			mezon.sessionRef.current = {
				...session,
				session_id: session.session_id
			};
		};
		return res;
	}
);

export const logOut = createAsyncThunk('auth/logOut', async ({ device_id, platform }: { device_id?: string; platform?: string }, thunkAPI) => {
	const mezon = getMezonCtx(thunkAPI);
	const sessionState = selectOthersSession(thunkAPI.getState() as unknown as { [AUTH_FEATURE_KEY]: AuthState });
	await mezon?.logOutMezon(device_id, platform, !sessionState);
	mezon.createClient();
	thunkAPI.dispatch(authActions.setLogout());
	thunkAPI.dispatch(walletActions.setLogout());
	thunkAPI.dispatch(listChannelsByUserActions.removeAll());
	thunkAPI.dispatch(voiceActions.resetVoiceControl());
	thunkAPI.dispatch(videoStreamActions.setIsJoin(false));
	clearApiCallTracker();
	const restoreKey = ['persist:apps', 'current-theme', 'hideNotificationContent', 'i18nextLng'];
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
		if (!mezon?.clientRef.current) {
			return thunkAPI.rejectWithValue('Client not initialized');
		}
		const session = await mezon?.clientRef.current.checkLoginRequest({ login_id: loginId, is_remember: isRemember });
		if (session) {
			if (session.id_token) {
				const proofInput = {
					jwt: session.id_token
				};

				await thunkAPI.dispatch(walletActions.fetchZkProofs(proofInput));
			}

			let merged: ApiSession;
			try {
				merged = await persistSessionConnectAfterLogin(mezon, session);
			} catch (error) {
				return thunkAPI.rejectWithValue((error as Error)?.message || 'Connect failed');
			}

			mezon.clientRef.current.onrefreshsession = (sessionNew: ApiSession) => {
				console.warn('Login Id Request Refresh Session');
				thunkAPI.dispatch(authActions.setSessionId(sessionNew.session_id));
				mezon.sessionRef.current = {
					...(mezon.sessionRef.current as ApiSession),
					...sessionNew,
					session_id: sessionNew.session_id
				};
			};
			return normalizeSession(merged);
		}
		return null;
	}
);

export const confirmLoginRequest = createAsyncThunk('auth/confirmLoginRequest', async ({ loginId }: { loginId: string }, thunkAPI) => {
	const mezon = getMezonCtx(thunkAPI);

	const session = await mezon?.confirmLoginRequest({ login_id: loginId });
	if (session?.id_token) {
		const proofInput = {
			jwt: session.id_token
		};

		await thunkAPI.dispatch(walletActions.fetchZkProofs(proofInput));
	}
	if (session) {
		return normalizeSession(session);
	}
	return null;
});

export const registrationPassword = createAsyncThunk(
	`auth/registrationPassword`,
	async (
		{ email, password, oldPassword, isMobile = false }: { email: string; password: string; oldPassword?: string; isMobile?: boolean },
		thunkAPI
	) => {
		if (!email || !password || !email.trim() || !password.trim()) {
			return thunkAPI.rejectWithValue('Invalid input');
		}

		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const response = await mezon.client.registrationPassword(mezon.session, email, password, oldPassword || '');

			if (!response) {
				return thunkAPI.rejectWithValue('Failed to register password');
			}
			toast.success(t(`accountSetting:setPasswordAccount.toast.success`));
			return response;
		} catch (error: any) {
			captureSentryError(error, `auth/registrationPassword`);
			const errPayload = await error?.json();
			toast.error(
				oldPassword
					? errPayload?.code === 3
						? t(`accountSetting:setPasswordAccount.error.incorrectCurrent`)
						: t('accountSetting:setPasswordAccount.error.updateFail')
					: t('accountSetting:setPasswordAccount.error.createFail')
			);
			if (isMobile) {
				return thunkAPI.rejectWithValue({ ...error, message: errPayload?.message || '' });
			}
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

		setSessionId(state, action) {
			if (state.session) {
				state.session = { ...state.session, session_id: action.payload };
			}

			state.isLogin = true;
		},
		setSession(state, action) {
			state.session = action.payload;

			state.isLogin = true;
		},

		updateSession(state, action: PayloadAction<ISession>) {
			state.session = action.payload;
		},
		setLogout(state) {
			state.session = null;
			state.isLogin = false;
			state.loadingStatus = 'not loaded';
		},
		refreshStatus(state) {
			state.loadingStatus = 'not loaded';
			state.loadingStatusEmail = 'not loaded';
		},

		turnOffSetAccount(state) {
			state.isLogin = true;
		},
		resetSession(state) {
			state.session = null;
			state.isLogin = false;
			state.loadingStatus = 'not loaded';
		},
		checkFormatSession(state) {
			const session = state.session;

			if (session && typeof session === 'object' && !Array.isArray(session) && !session.token) {
				const entries = Object.entries(session);
				if (entries.length > 0) {
					const [, value] = entries[0] as [string, ISession];
					state.session = value;
				}
			}
		}
	},
	extraReducers: (builder) => {
		builder
			.addCase(authenticateApple.pending, (state: AuthState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(authenticateApple.fulfilled, (state: AuthState, action) => {
				state.loadingStatus = 'loaded';
				state.session = action.payload;
				state.isLogin = true;
			})
			.addCase(authenticateApple.rejected, (state: AuthState, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			});
		builder
			.addCase(checkSessionWithToken.pending, (state: AuthState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(checkSessionWithToken.fulfilled, (state: AuthState, action) => {
				state.loadingStatus = 'loaded';
				state.session = action.payload;
				state.isLogin = true;
			})
			.addCase(checkSessionWithToken.rejected, (state: AuthState, action) => {
				state.loadingStatus = 'not loaded';
				state.error = action.error.message;
			});
		builder
			.addCase(checkLoginRequest.fulfilled, (state: AuthState, action) => {
				if (action.payload) {
					state.session = action.payload;
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

				state.session = action.payload;
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
				state.session = action.payload;
			})
			.addCase(authenticateEmail.rejected, (state: AuthState, action) => {
				state.loadingStatusEmail = 'error';
				state.error = action.error.message;
			});
		builder
			.addCase(confirmAuthenticateOTP.pending, (state: AuthState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(confirmAuthenticateOTP.fulfilled, (state: AuthState, action) => {
				state.loadingStatus = 'loaded';
				state.session = action.payload;
				state.isLogin = true;
			})
			.addCase(confirmAuthenticateOTP.rejected, (state: AuthState, action) => {
				state.loadingStatus = 'error';
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
	createQRLogin,
	checkLoginRequest,
	confirmLoginRequest,
	logOut,
	registrationPassword,
	authenticateEmail,
	checkSessionWithToken,
	authenticateEmailOTPRequest,
	confirmAuthenticateOTP,
	authenticatePhoneSMSOTPRequest
};

export const getAuthState = (rootState: { [AUTH_FEATURE_KEY]: AuthState }): AuthState => rootState[AUTH_FEATURE_KEY];

export const selectAllAuth = createSelector(getAuthState, (state: AuthState) => state);

export const selectIsLogin = createSelector(getAuthState, (state: AuthState) => state.isLogin);

export const selectSession = createSelector(getAuthState, (state: AuthState) => {
	return state.session;
});

export const selectRegisteringStatus = createSelector(getAuthState, (state: AuthState) => state.isRegistering);

export const selectLoadingEmail = createSelector(getAuthState, (state: AuthState) => state.loadingStatusEmail);

export const selectOthersSession = createSelector(getAuthState, (state: AuthState) => {
	return state.session;
});

export const selectAllSession = createSelector(getAuthState, (state: AuthState) => {
	return state.session;
});

export const setupSessionSyncListener = (store: any) => {
	if (typeof window !== 'undefined') {
		const handleSessionRefresh = async (event: Event) => {
			const customEvent = event as CustomEvent;
			const session = customEvent.detail?.session;
			if (session) {
				store.dispatch(authActions.updateSession(session));
			}
		};

		window.addEventListener('mezon:session-refreshed', handleSessionRefresh);
		return () => {
			window.removeEventListener('mezon:session-refreshed', handleSessionRefresh);
		};
	}
	return () => {
		// noop
	};
};
