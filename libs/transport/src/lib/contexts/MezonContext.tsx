import EventEmitter from 'events';
import type { ApiConfirmLoginRequest, ApiLinkAccountConfirmRequest, ApiLoginIDResponse, ApiSession } from 'mezon-js';
import { Client, Session } from 'mezon-js';
import type { DongClient, IndexerClient, MmnClient, ZkClient } from 'mmn-client-js';
import React, { useCallback } from 'react';
import { firstValueFrom, from, throwError, timer, type Observable } from 'rxjs';
import { catchError, finalize, shareReplay, switchMap, take, timeout } from 'rxjs/operators';
import type { CreateMezonClientOptions } from '../mezon';
import {
	createClient as createMezonClient,
	createDongClient as createMezonDongClient,
	createIndexerClient as createMezonIndexerClient,
	createMmnClient as createMezonMmnClient,
	createZkClient as createMezonZkClient
} from '../mezon';
import { isOnline, waitForOnline$ } from '../network';
import { socketState } from '../socketState';

const MAX_WEBSOCKET_FAILS = 6;
const MIN_WEBSOCKET_RETRY_TIME = 1000;
const MAX_WEBSOCKET_RETRY_TIME = 30000;
const JITTER_RANGE = 1000;
const FAST_RETRY_ATTEMPTS = 5;
const MAX_REFRESH_RETRIES = 3;
const MAX_REFRESH_TIMEOUT_MS = 10000;
const SESSION_EXPIRY_BUFFER_SEC = 60;
const originalIsExpired = Session.prototype.isexpired;
Session.prototype.isexpired = function (currenttime: number): boolean {
	return originalIsExpired.call(this, currenttime + SESSION_EXPIRY_BUFFER_SEC);
};

const MAX_SESSION_REFRESH_FAILS = 4;
let sessionRefreshFailCount = 0;
let sessionRefreshBlocked = false;

const originalSessionRefresh = Client.prototype.sessionRefresh;
Client.prototype.sessionRefresh = async function (session: Session, vars?: Record<string, string>): Promise<Session> {
	if (sessionRefreshBlocked) {
		fireSessionExpired();
		throw new Error('Session refresh blocked after repeated auth failures');
	}

	try {
		const result = await originalSessionRefresh.call(this, session, vars);
		sessionRefreshFailCount = 0;
		return result;
	} catch (error: unknown) {
		const status = error && typeof error === 'object' && 'status' in error ? (error as { status: number }).status : 0;
		if (status === 401 || status === 403) {
			sessionRefreshBlocked = true;
			fireSessionExpired();
			throw error;
		}
		if (status === 500) {
			sessionRefreshFailCount++;
			if (sessionRefreshFailCount >= MAX_SESSION_REFRESH_FAILS) {
				sessionRefreshBlocked = true;
				fireSessionExpired();
			}
		}
		throw error;
	}
};

export function resetSessionRefreshBlock() {
	sessionRefreshFailCount = 0;
	sessionRefreshBlocked = false;
}

function isNetworkError(error: unknown): boolean {
	if (error instanceof TypeError && error.message.includes('fetch')) return true;
	if (error instanceof DOMException && error.name === 'AbortError') return true;
	if (!isOnline()) return true;
	return false;
}

function isAuthError(error: unknown): boolean {
	if (error && typeof error === 'object' && 'status' in error) {
		const status = (error as { status: number }).status;
		return status === 401 || status === 403 || status === 500;
	}
	if (error instanceof Response) {
		return error.status === 401 || error.status === 403 || error.status === 500;
	}
	return false;
}

function fireSessionExpired() {
	if (typeof window !== 'undefined') {
		window.dispatchEvent(new CustomEvent('mezon:session-expired'));
	}
}

const sessionRefreshManager = {
	_current$: null as Observable<Session> | null,

	refresh(client: Client, session: Session): Promise<Session> {
		if (this._current$) {
			return firstValueFrom(this._current$);
		}

		this._current$ = this._createRefresh$(client, session).pipe(
			shareReplay({ bufferSize: 1, refCount: true }),
			finalize(() => {
				this._current$ = null;
			})
		);

		return firstValueFrom(this._current$);
	},

	_createRefresh$(client: Client, session: Session): Observable<Session> {
		let serverRetryCount = 0;

		const jitterDelay = (base: number) => base + Math.random() * Math.min(base, 3000);

		const refreshWithTimeout$ = () =>
			from(client.sessionRefresh(session)).pipe(
				timeout(MAX_REFRESH_TIMEOUT_MS),
				catchError((error: unknown) => {
					if (error && typeof error === 'object' && 'name' in error && (error as { name: string }).name === 'TimeoutError') {
						return throwError(() => new Error('Session refresh timed out'));
					}
					return throwError(() => error);
				})
			);

		const attempt$ = (): Observable<Session> =>
			waitForOnline$().pipe(
				switchMap(() => refreshWithTimeout$()),
				catchError((error: unknown) => {
					if (isNetworkError(error)) {
						return waitForOnline$().pipe(switchMap(() => timer(jitterDelay(2000)).pipe(switchMap(() => attempt$()))));
					}

					serverRetryCount++;
					if (serverRetryCount >= MAX_REFRESH_RETRIES) {
						if (isAuthError(error)) {
							fireSessionExpired();
						}
						return throwError(() => error);
					}

					return timer(jitterDelay(1000 * serverRetryCount)).pipe(switchMap(() => attempt$()));
				})
			);

		return attempt$();
	},

	reset() {
		this._current$ = null;
	}
};

export const isSessionRefreshing = () => sessionRefreshManager._current$ !== null;

export const resetSessionRefreshManager = () => {
	sessionRefreshManager.reset();
};

export const DEFAULT_WS_URL = 'sock.mezon.ai';
export const SESSION_STORAGE_KEY = 'mezon_session';
export const MobileEventSessionEmitter = new EventEmitter();

const waitForNetworkAndDelay = (delayMs: number): Promise<void> => {
	return firstValueFrom(
		waitForOnline$().pipe(
			switchMap(() => timer(delayMs)),
			take(1)
		)
	).then(() => undefined);
};

type MezonContextProviderProps = {
	children: React.ReactNode;
	mezon: CreateMezonClientOptions;
	connect?: boolean;
	isFromMobile?: boolean;
};

type Sessionlike = {
	token: string;
	refresh_token: string;
	created: boolean;
	is_remember: boolean;
	api_url: string;
	expires_at?: number;
	refresh_expires_at?: number;
	created_at?: number;
	username?: string;
	user_id?: string;
	id_token?: string;
};

const saveMezonConfigToStorage = (host: string, port: string, useSSL: boolean, apiUrl: string, wsUrl?: string) => {
	try {
		const existingConfig = localStorage.getItem(SESSION_STORAGE_KEY);
		let existingWsUrl: string | undefined;

		if (existingConfig) {
			try {
				const parsed = JSON.parse(existingConfig);
				existingWsUrl = parsed.ws_url;
			} catch {
				existingWsUrl = '';
			}
		}

		const finalWsUrl = wsUrl || existingWsUrl;

		localStorage.setItem(
			SESSION_STORAGE_KEY,
			JSON.stringify({
				host,
				port,
				ssl: useSSL,
				api_url: apiUrl,
				...(finalWsUrl && { ws_url: finalWsUrl })
			})
		);
	} catch (error) {
		console.error('Failed to save Mezon config to local storage:', error);
	}
};

export const clearSessionFromStorage = () => {
	try {
		localStorage.removeItem(SESSION_STORAGE_KEY);
	} catch (error) {
		console.error('Failed to clear session from local storage:', error);
	}
};

export const clearSessionRefreshFromStorage = () => {
	try {
		localStorage.removeItem(SESSION_STORAGE_KEY);
	} catch (error) {
		console.error('Failed to clear session from local storage:', error);
	}
};

export type MezonConfigResult = CreateMezonClientOptions & {
	api_url?: string;
	ws_url?: string;
};

export const getMezonConfig = (): MezonConfigResult => {
	try {
		const storedConfig = localStorage.getItem('mezon_session');

		if (storedConfig) {
			const parsedConfig = JSON.parse(storedConfig);
			if (parsedConfig.host) {
				return {
					host: parsedConfig.host,
					port: parsedConfig.port || (process.env.NX_CHAT_APP_API_PORT as string),
					key: process.env.NX_CHAT_APP_API_KEY as string,
					ssl: parsedConfig.ssl,
					api_url: parsedConfig.api_url,
					ws_url: parsedConfig.ws_url
				};
			}
		}
	} catch (error) {
		console.error('Failed to get Mezon config from localStorage:', error);
	}

	return {
		host: process.env.NX_CHAT_APP_API_GW_HOST as string,
		port: process.env.NX_CHAT_APP_API_GW_PORT as string,
		key: process.env.NX_CHAT_APP_API_KEY as string,
		ssl: process.env.NX_CHAT_APP_API_SECURE === 'true'
	};
};

export const extractAndSaveConfig = (session: Session | null, isFromMobile?: boolean) => {
	if (!session || !session.api_url) return null;
	try {
		const url = new URL(session.api_url);
		const host = url.hostname;
		const port = url.port;
		const useSSL = url.protocol === 'https:';
		const wsUrl = session.ws_url;
		const apiUrl = session.api_url;

		if (!isFromMobile) {
			saveMezonConfigToStorage(host, port, useSSL, apiUrl, wsUrl);
		}

		return { host, port, useSSL, wsUrl, apiUrl };
	} catch (error) {
		console.error('Failed to extract config from session:', error);
		return null;
	}
};

export type MezonContextValue = {
	clientRef: React.MutableRefObject<Client | null>;
	sessionRef: React.MutableRefObject<Session | null>;
	socketRef: React.MutableRefObject<null>;
	zkRef: React.MutableRefObject<ZkClient | null>;
	mmnRef: React.MutableRefObject<MmnClient | null>;
	dongRef: React.MutableRefObject<DongClient | null>;
	indexerRef: React.MutableRefObject<IndexerClient | null>;
	createClient: () => Promise<Client>;
	createZkClient: () => ZkClient;
	createMmnClient: () => MmnClient;
	createDongClient: () => DongClient;
	createIndexerClient: () => IndexerClient;
	authenticateMezon: (token: string, isRemember?: boolean) => Promise<Session>;
	createQRLogin: () => Promise<ApiLoginIDResponse>;
	checkLoginRequest: (LoginRequest: ApiConfirmLoginRequest) => Promise<Session | null>;
	confirmLoginRequest: (ConfirmRequest: ApiConfirmLoginRequest) => Promise<Session | null>;
	authenticateEmail: (email: string, password: string) => Promise<Session>;
	authenticateEmailOTPRequest: (email: string) => Promise<ApiLinkAccountConfirmRequest>;
	confirmAuthenticateOTP: (data: ApiLinkAccountConfirmRequest) => Promise<Session>;
	authenticateSMSOTPRequest: (phone: string) => Promise<ApiLinkAccountConfirmRequest>;

	logOutMezon: (device_id?: string, platform?: string, clearSession?: boolean) => Promise<void>;
	refreshSession: (session: Sessionlike, isSetNewUsername?: boolean) => Promise<Session | undefined>;
	connectWithSession: (session: Sessionlike) => Promise<Session>;
	createSocket: () => Promise<any>;
	reconnectWithTimeout: (clanId: string) => Promise<unknown>;
};

const MezonContext = React.createContext<MezonContextValue>({} as MezonContextValue);

const MezonContextProvider: React.FC<MezonContextProviderProps> = ({ children, mezon, connect, isFromMobile = false }) => {
	const clientRef = React.useRef<Client | null>(null);
	const sessionRef = React.useRef<Session | null>(null);
	const socketRef = React.useRef<null>(null);
	const zkRef = React.useRef<ZkClient | null>(null);
	const dongRef = React.useRef<DongClient | null>(null);
	const mmnRef = React.useRef<MmnClient | null>(null);
	const indexerRef = React.useRef<IndexerClient | null>(null);

	const applyNewSession = useCallback(
		(newSession: Session) => {
			sessionRef.current = newSession;
			extractAndSaveConfig(newSession, isFromMobile);
			if (isFromMobile) {
				MobileEventSessionEmitter.emit('mezon:session-refreshed', {
					session: newSession
				});
			} else if (typeof window !== 'undefined') {
				window.dispatchEvent(
					new CustomEvent('mezon:session-refreshed', {
						detail: { session: newSession }
					})
				);
				if ((window as any)?.ReactNativeWebView) {
					(window as any)?.ReactNativeWebView?.postMessage?.(
						JSON.stringify({
							type: 'mezon:session-refreshed',
							data: { session: newSession }
						})
					);
				}
			}
		},
		[isFromMobile]
	);

	const createSocket = useCallback(async () => {
		if (!clientRef.current) {
			throw new Error('Mezon client not initialized');
		}

		const config = getMezonConfig();
		let useSSL = clientRef.current.useSSL;
		let host = clientRef.current.host;
		let port = clientRef.current.port;

		if (config.ws_url) {
			try {
				const wsUrl = new URL(config.ws_url.startsWith('ws') ? config.ws_url : `wss://${config.ws_url}`);
				useSSL = wsUrl.protocol === 'wss:';
				host = wsUrl.hostname;
				port = wsUrl.port;
			} catch {
				console.warn('Failed to parse ws_url, using default client config');
			}
		}

		if (sessionRef.current) {
			const socket = clientRef.current.connect(sessionRef.current, true);
			return socket;
		}
	}, [clientRef, socketRef]);

	const createZkClient = useCallback(() => {
		const zkClient = createMezonZkClient({
			endpoint: process.env.NX_CHAT_APP_ZK_API_URL || '',
			timeout: 30000,
			headers: {
				'Content-Type': 'application/json'
			}
		});
		zkRef.current = zkClient;
		return zkClient;
	}, []);

	const createDongClient = useCallback(() => {
		const dongClient = createMezonDongClient({
			endpoint: process.env.NX_CHAT_APP_DONG_SERVICE_API_URL || '',
			timeout: 30000,
			headers: {
				'Content-Type': 'application/json'
			}
		});
		dongRef.current = dongClient;
		return dongClient;
	}, []);

	const createMmnClient = useCallback(() => {
		const mmnClient = createMezonMmnClient({
			baseUrl: process.env.NX_CHAT_APP_MMN_API_URL || '',
			timeout: 30000,
			headers: {
				'Content-Type': 'application/json'
			}
		});
		mmnRef.current = mmnClient;
		return mmnClient;
	}, []);

	const createIndexerClient = useCallback(() => {
		const indexerClient = createMezonIndexerClient({
			endpoint: process.env.NX_CHAT_APP_INDEXER_API_URL || '',
			chainId: '1337',
			timeout: 10000
		});
		indexerRef.current = indexerClient;
		return indexerClient;
	}, []);

	const createClient = useCallback(async () => {
		const client = await createMezonClient(mezon);
		clientRef.current = client;

		client.onRefreshSession = (session: ApiSession) => {
			if (session) {
				const config = getMezonConfig();
				const wsUrl = config.ws_url || DEFAULT_WS_URL;
				const newSession = new Session(
					session.token || '',
					session.refresh_token || '',
					session.created || false,
					session.api_url || '',
					wsUrl,
					session.id_token || '',
					session.is_remember || false
				);
				applyNewSession(newSession);
			}
		};

		// Initialize additional clients
		createZkClient();
		createMmnClient();
		createDongClient();
		createIndexerClient();

		return client;
	}, [mezon, createZkClient, createMmnClient, createDongClient, createIndexerClient, applyNewSession]);

	const createQRLogin = useCallback(async () => {
		if (!clientRef.current) {
			throw new Error('Mezon client not initialized');
		}
		const QRlogin = await clientRef.current.createQRLogin({});
		return QRlogin;
	}, []);

	const checkLoginRequest = useCallback(async (LoginRequest: ApiConfirmLoginRequest) => {
		if (!clientRef.current) {
			throw new Error('Mezon client not initialized');
		}
		const session = await clientRef.current.checkLoginRequest(LoginRequest);
		const config = extractAndSaveConfig(session, isFromMobile);
		if (config) {
			clientRef.current.setBasePath(config.host, config.port, config.useSSL);
		}

		return session;
	}, []);

	const confirmLoginRequest = useCallback(async (confirmRequest: ApiConfirmLoginRequest) => {
		if (!clientRef.current) {
			throw new Error('Mezon client not initialized');
		}
		if (!sessionRef.current) {
			throw new Error('Mezon session not initialized');
		}
		const useSSL = process.env.NX_CHAT_APP_API_SECURE === 'true';
		const scheme = useSSL ? 'https://' : 'http://';
		const basePath = `${scheme}${process.env.NX_CHAT_APP_API_GW_HOST}:${process.env.NX_CHAT_APP_API_GW_PORT}`;
		const session = await clientRef.current.confirmLogin(sessionRef.current, basePath, confirmRequest);
		return session;
	}, []);

	const authenticateMezon = useCallback(
		async (token: string, isRemember?: boolean) => {
			if (!clientRef.current) {
				throw new Error('Mezon client not initialized');
			}
			resetSessionRefreshBlock();
			const session = await clientRef.current.authenticateMezon(token, undefined, undefined, isFromMobile ? true : (isRemember ?? false));
			sessionRef.current = session;

			const config = extractAndSaveConfig(session, isFromMobile);
			if (config) {
				clientRef.current.setBasePath(config.host, config.port, config.useSSL);
			}

			await clientRef.current.connect(session, true);
			socketState.status = 'connected';

			return session;
		},
		[createSocket, isFromMobile]
	);

	const authenticateEmail = useCallback(
		async (email: string, password: string) => {
			if (!clientRef.current) {
				throw new Error('Mezon client not initialized');
			}
			const session = await clientRef.current.authenticateEmail(email, password, undefined, isFromMobile ? { m: 'true' } : undefined);
			sessionRef.current = session;

			const config = extractAndSaveConfig(session);
			if (config) {
				clientRef.current.setBasePath(config.host, config.port, config.useSSL);
			}

			await clientRef.current.connect(session, true);
			socketState.status = 'connected';
			return session;
		},
		[createSocket, isFromMobile]
	);

	const authenticateEmailOTPRequest = useCallback(
		async (email: string) => {
			if (!clientRef.current) {
				throw new Error('Mezon client not initialized');
			}

			return await clientRef.current.authenticateEmailOTPRequest(email, undefined, isFromMobile ? { m: 'true' } : undefined);
		},
		[isFromMobile]
	);

	const confirmAuthenticateOTP = useCallback(
		async (data: ApiLinkAccountConfirmRequest) => {
			if (!clientRef.current) {
				throw new Error('Mezon client not initialized');
			}

			const session = await clientRef.current.confirmAuthenticateOTP(data);
			sessionRef.current = session;

			const config = extractAndSaveConfig(session);
			if (config) {
				clientRef.current.setBasePath(config.host, config.port, config.useSSL);
			}

			await clientRef.current.connect(session, true);
			socketState.status = 'connected';
			return session;
		},
		[createSocket, isFromMobile]
	);

	const authenticateSMSOTPRequest = useCallback(
		async (phone: string) => {
			if (!clientRef.current) {
				throw new Error('Mezon client not initialized');
			}

			return await clientRef.current.authenticateSMSOTPRequest(phone, undefined, isFromMobile ? { m: 'true' } : undefined);
		},
		[isFromMobile]
	);

	const logOutMezon = useCallback(
		async (device_id?: string, platform?: string, clearSession?: boolean) => {
			sessionRefreshManager.reset();
			resetSessionRefreshBlock();
			reconnectingRef.current = false;
			clearSessionRefreshFromStorage();

			if (clientRef.current && sessionRef.current) {
				await clientRef.current.sessionLogout(
					sessionRef.current,
					sessionRef.current?.token,
					sessionRef.current?.refresh_token,
					device_id || '',
					platform || ''
				);

				sessionRef.current = null;
				if (clearSession) {
					clearSessionFromStorage();
					clientRef.current.setBasePath(
						process.env.NX_CHAT_APP_API_GW_HOST as string,
						process.env.NX_CHAT_APP_API_GW_PORT as string,
						process.env.NX_CHAT_APP_API_SECURE === 'true'
					);
				}
			}
		},
		[socketRef]
	);

	const refreshSession = useCallback(
		async (session: Sessionlike, isSetNewUsername?: boolean) => {
			if (!clientRef.current) {
				throw new Error('Mezon client not initialized');
			}

			const config = getMezonConfig();
			const wsUrl = config.ws_url || DEFAULT_WS_URL;

			if (
				!clientRef.current.host ||
				(clientRef.current.host === process.env.NX_CHAT_APP_API_GW_HOST && clientRef.current.port === process.env.NX_CHAT_APP_API_GW_PORT)
			) {
				await logOutMezon();
				return;
			}

			const sessionObj = new Session(
				session?.token,
				session?.refresh_token,
				session.created,
				session.api_url,
				wsUrl,
				session.id_token || '',
				session.is_remember
			);

			if (session.expires_at) {
				sessionObj.expires_at = session.expires_at;
			}

			const newSession = await sessionRefreshManager.refresh(clientRef.current, sessionObj);

			await clientRef.current.connect(newSession, true);
			socketState.status = 'connected';
			return newSession;
		},
		[clientRef, socketRef, isFromMobile, logOutMezon, createSocket]
	);

	const connectWithSession = useCallback(
		async (session: any) => {
			if (!clientRef.current) {
				throw new Error('Mezon client not initialized');
			}
			sessionRef.current = session;
			extractAndSaveConfig(session, isFromMobile);
			if (!socketRef.current) {
				return session;
			}
			await clientRef.current.connect(session, true);
			socketState.status = 'connected';
			return session;
		},
		[clientRef, socketRef, isFromMobile]
	);

	const reconnectingRef = React.useRef<boolean>(false);

	const reconnectWithTimeout = React.useCallback(
		async (clanId: string) => {
			if (reconnectingRef.current) {
				return 'RECONNECTING';
			}

			if (!clientRef.current || !sessionRef.current) {
				return null;
			}

			reconnectingRef.current = true;

			try {
				let failCount = 0;

				while (failCount < MAX_WEBSOCKET_FAILS) {
					try {
						if (!clientRef.current || !sessionRef.current) {
							return null;
						}

						const config = getMezonConfig();
						const wsUrl = config.ws_url || DEFAULT_WS_URL;

						let newSession = null;
						if (sessionRef.current.refresh_token && sessionRef.current.isexpired(Date.now() / 1000)) {
							try {
								newSession = await sessionRefreshManager.refresh(
									clientRef.current,
									new Session(
										sessionRef.current.token,
										sessionRef.current.refresh_token,
										sessionRef.current.created,
										sessionRef.current.api_url,
										wsUrl,
										sessionRef.current.id_token,
										sessionRef.current.is_remember ?? false
									)
								);
							} catch (refreshError) {
								if (!sessionRef.current) {
									return null;
								}
								throw refreshError;
							}
						}

						const connect = await clientRef.current.connect(newSession || sessionRef.current, true);

						return connect;
					} catch (error) {
						failCount++;

						if (failCount >= MAX_WEBSOCKET_FAILS) {
							throw new Error('Socket reconnection failed');
						}

						let retryTime: number;

						if (isFromMobile) {
							retryTime = 1000;
						} else if (failCount <= FAST_RETRY_ATTEMPTS) {
							retryTime = MIN_WEBSOCKET_RETRY_TIME + Math.random() * JITTER_RANGE;
						} else {
							const exponentialTime = MIN_WEBSOCKET_RETRY_TIME * Math.pow(2, failCount - FAST_RETRY_ATTEMPTS);
							retryTime = Math.min(exponentialTime, MAX_WEBSOCKET_RETRY_TIME) + Math.random() * JITTER_RANGE;
						}

						await waitForNetworkAndDelay(retryTime);
					}
				}

				throw new Error('Max reconnection attempts reached');
			} finally {
				reconnectingRef.current = false;
			}
		},
		[createSocket, isFromMobile]
	);

	const value = React.useMemo<MezonContextValue>(
		() => ({
			clientRef,
			sessionRef,
			socketRef,
			zkRef,
			dongRef,
			mmnRef,
			indexerRef,
			createClient,
			createZkClient,
			createDongClient,
			createMmnClient,
			createIndexerClient,
			createQRLogin,
			checkLoginRequest,
			confirmLoginRequest,
			refreshSession,
			createSocket,
			logOutMezon,
			reconnectWithTimeout,
			authenticateMezon,
			authenticateEmail,
			connectWithSession,
			authenticateEmailOTPRequest,
			confirmAuthenticateOTP,
			authenticateSMSOTPRequest
		}),
		[
			clientRef,
			sessionRef,
			socketRef,
			zkRef,
			mmnRef,
			indexerRef,
			createClient,
			createZkClient,
			createDongClient,
			createMmnClient,
			createIndexerClient,
			createQRLogin,
			checkLoginRequest,
			confirmLoginRequest,
			refreshSession,
			createSocket,
			logOutMezon,
			reconnectWithTimeout,
			authenticateMezon,
			authenticateEmail,
			connectWithSession,
			authenticateEmailOTPRequest,
			confirmAuthenticateOTP,
			authenticateSMSOTPRequest
		]
	);

	React.useEffect(() => {
		if (connect) {
			createClient().then(() => {
				return createSocket();
			});
		}
	}, [connect, createClient, createSocket]);

	React.useEffect(() => {
		if (typeof window === 'undefined' || isFromMobile) return;

		const handleSessionRefresh = (event: Event) => {
			const customEvent = event as CustomEvent;
			const sessionData = customEvent.detail?.session;

			if (sessionData && sessionRef.current?.token !== sessionData.token) {
				const config = getMezonConfig();
				const wsUrl = config.ws_url || DEFAULT_WS_URL;
				const newSession = new Session(
					sessionData.token,
					sessionData.refresh_token,
					sessionData.created || false,
					sessionData.api_url,
					wsUrl,
					sessionData.id_token || '',
					sessionData.is_remember || false
				);

				if (sessionData.username) newSession.username = sessionData.username;
				if (sessionData.user_id) newSession.user_id = sessionData.user_id;
				if (sessionData.vars) newSession.vars = sessionData.vars;
				if (sessionData.expires_at) newSession.expires_at = sessionData.expires_at;
				if (sessionData.refresh_expires_at) newSession.refresh_expires_at = sessionData.refresh_expires_at;

				sessionRef.current = newSession;
			}
		};

		window.addEventListener('mezon:session-refreshed', handleSessionRefresh);

		return () => {
			window.removeEventListener('mezon:session-refreshed', handleSessionRefresh);
		};
	}, [isFromMobile]);

	return <MezonContext.Provider value={value}>{children}</MezonContext.Provider>;
};

const MezonContextConsumer = MezonContext.Consumer;

export type MezonSuspenseProps = {
	children: React.ReactNode;
};

const MezonSuspense: React.FC<MezonSuspenseProps> = ({ children }: MezonSuspenseProps) => {
	const { clientRef } = React.useContext(MezonContext);
	if (!clientRef.current) {
		return <>Loading...</>;
	}
	// eslint-disable-next-line react/jsx-no-useless-fragment
	return <>{children}</>;
};

export { MezonContext, MezonContextConsumer, MezonContextProvider, MezonSuspense };
