import EventEmitter from 'events';
import type { ApiConfirmLoginRequest, ApiLinkAccountConfirmRequest, ApiLoginIDResponse, ApiSession, Client } from 'mezon-js';
import type { DongClient, IndexerClient, MmnClient, ZkClient } from 'mmn-client-js';
import React, { useCallback } from 'react';
import { firstValueFrom, timer } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';
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

const MAX_SESSION_REFRESH_FAILS = 4;
let sessionRefreshFailCount = 0;
let sessionRefreshBlocked = false;

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

// Allowlist of hosts the client is permitted to talk to. Values come from the build-time env.
// Any tampered `mezon_session` pointing to a different host will be rejected and we fall back to env defaults.
const ALLOWED_HOST_SUFFIXES: string[] = (() => {
	const defaults = [process.env.NX_CHAT_APP_API_GW_HOST, process.env.NX_CHAT_APP_API_HOST, 'mezon.ai', 'mezon.vn']
		.filter((h): h is string => typeof h === 'string' && h.length > 0)
		.map((h) => h.toLowerCase());
	return Array.from(new Set(defaults));
})();

const isAllowedHost = (host: string | undefined): boolean => {
	if (!host || typeof host !== 'string') return false;
	const lower = host.toLowerCase();
	return ALLOWED_HOST_SUFFIXES.some((suffix) => lower === suffix || lower.endsWith(`.${suffix}`));
};

export const getMezonConfig = (): MezonConfigResult => {
	try {
		const storedConfig = localStorage.getItem('mezon_session');

		if (storedConfig) {
			const parsedConfig = JSON.parse(storedConfig);
			if (parsedConfig?.host && isAllowedHost(parsedConfig.host)) {
				return {
					host: parsedConfig.host,
					port: parsedConfig.port || (process.env.NX_CHAT_APP_API_PORT as string),
					key: process.env.NX_CHAT_APP_API_KEY as string,
					ssl: parsedConfig.ssl,
					api_url: parsedConfig.api_url,
					ws_url: parsedConfig.ws_url
				};
			}
			if (parsedConfig?.host && !isAllowedHost(parsedConfig.host)) {
				console.error('Ignoring mezon_session with non-allowlisted host:', parsedConfig.host);
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

export const extractAndSaveConfig = (session: ApiSession | null, isFromMobile?: boolean) => {
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
	sessionRef: React.MutableRefObject<ApiSession | null>;
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
	authenticateMezon: (token: string, isRemember?: boolean) => Promise<ApiSession>;
	createQRLogin: () => Promise<ApiLoginIDResponse>;
	checkLoginRequest: (LoginRequest: ApiConfirmLoginRequest) => Promise<ApiSession | null>;
	confirmLoginRequest: (ConfirmRequest: ApiConfirmLoginRequest) => Promise<ApiSession | null>;
	authenticateEmail: (email: string, password: string) => Promise<ApiSession>;
	authenticateEmailOTPRequest: (email: string) => Promise<ApiLinkAccountConfirmRequest>;
	confirmAuthenticateOTP: (data: ApiLinkAccountConfirmRequest) => Promise<ApiSession>;
	authenticateSMSOTPRequest: (phone: string) => Promise<ApiLinkAccountConfirmRequest>;

	logOutMezon: (device_id?: string, platform?: string, clearSession?: boolean) => Promise<void>;
	connectWithSession: (session: ApiSession) => Promise<ApiSession>;
	createSocket: () => Promise<any>;
};

const MezonContext = React.createContext<MezonContextValue>({} as MezonContextValue);

const MezonContextProvider: React.FC<MezonContextProviderProps> = ({ children, mezon, connect, isFromMobile = false }) => {
	const clientRef = React.useRef<Client | null>(null);
	const sessionRef = React.useRef<ApiSession | null>(null);
	const socketRef = React.useRef<null>(null);
	const zkRef = React.useRef<ZkClient | null>(null);
	const dongRef = React.useRef<DongClient | null>(null);
	const mmnRef = React.useRef<MmnClient | null>(null);
	const indexerRef = React.useRef<IndexerClient | null>(null);

	const applyNewSession = useCallback(
		(newSession: ApiSession) => {
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

		if ((sessionRef.current?.token || sessionRef.current?.session_id) && sessionRef.current.ws_url) {
			const socket = clientRef.current.connect(sessionRef.current?.session_id || sessionRef.current.token || '', sessionRef.current.ws_url);
			clientRef.current.onrefreshsession = (sessionNew: ApiSession) => {
				const authData = JSON.stringify({
					...sessionRef.current,
					session_id: sessionNew.session_id
				} as ApiSession);

				localStorage.setItem('persist:auth', authData);
			};
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

		client.onrefreshsession = (session: ApiSession) => {
			if (session) {
				const config = getMezonConfig();
				const wsUrl = config.ws_url || DEFAULT_WS_URL;
				const newSession: ApiSession = {
					token: session.token || '',
					refresh_token: session.refresh_token || '',
					created: session.created || false,
					api_url: session.api_url || '',
					ws_url: wsUrl,
					id_token: session.id_token || '',
					is_remember: session.is_remember || false
				};

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
			if ((!session.token && !session.session_id) || !session.ws_url) {
				throw new Error('Mezon connect lost data');
			}
			try {
				await clientRef.current.connect(session.session_id || session.token || '', session.ws_url, true);
				clientRef.current.onrefreshsession = (sessionNew: ApiSession) => {
					const authData = JSON.stringify({
						...session,
						session_id: sessionNew.session_id
					} as ApiSession);

					localStorage.setItem('persist:auth', authData);
				};
			} catch (error) {
				console.error('error: ', error);
			}
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
			if ((!session.token && !session.session_id) || !session.ws_url) {
				throw new Error('Mezon connect lost data');
			}
			await clientRef.current.connect(session.session_id || session.token || '', session.ws_url);
			clientRef.current.onrefreshsession = (sessionNew: ApiSession) => {
				const authData = JSON.stringify({
					...session,
					session_id: sessionNew.session_id
				} as ApiSession);

				localStorage.setItem('persist:auth', authData);
			};
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

			if ((!session.token && !session.session_id) || !session.ws_url) {
				throw new Error('Mezon connect lost data');
			}
			await clientRef.current.connect(session.session_id || session.token || '', session.ws_url);
			clientRef.current.onrefreshsession = (sessionNew: ApiSession) => {
				const authData = JSON.stringify({
					...session,
					session_id: sessionNew.session_id
				} as ApiSession);

				localStorage.setItem('persist:auth', authData);
			};
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
			resetSessionRefreshBlock();
			reconnectingRef.current = false;
			clearSessionRefreshFromStorage();

			if (clientRef.current && sessionRef.current && sessionRef.current?.token) {
				await clientRef.current.sessionLogout(
					sessionRef.current,
					sessionRef.current?.token,
					sessionRef.current?.refresh_token || '',
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

	const connectWithSession = useCallback(
		async (session: ApiSession) => {
			if (!clientRef.current) {
				throw new Error('Mezon client not initialized');
			}
			extractAndSaveConfig(session, isFromMobile);

			await clientRef.current.connect(session.session_id || session.token || '', session.ws_url || '');
			clientRef.current.onrefreshsession = (sessionNew: ApiSession) => {
				const authData = JSON.stringify({
					...session,
					session_id: sessionNew.session_id
				} as ApiSession);
				localStorage.setItem('persist:auth', authData);
			};
			socketState.status = 'connected';
			return session;
		},
		[clientRef, socketRef, isFromMobile]
	);

	const reconnectingRef = React.useRef<boolean>(false);

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
			createSocket,
			logOutMezon,
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
			createSocket,
			logOutMezon,
			authenticateMezon,
			authenticateEmail,
			connectWithSession,
			authenticateEmailOTPRequest,
			confirmAuthenticateOTP,
			authenticateSMSOTPRequest
		]
	);

	React.useEffect(() => {
		if (typeof window === 'undefined' || isFromMobile) return;

		const handleSessionRefresh = (event: Event) => {
			const customEvent = event as CustomEvent;
			const sessionData = customEvent.detail?.session;

			if (sessionData && sessionRef.current?.token !== sessionData.token) {
				const config = getMezonConfig();
				const wsUrl = config.ws_url || DEFAULT_WS_URL;
				const newSession = {
					token: sessionData.token,
					refresh_token: sessionData.refresh_token,
					created: sessionData.created || false,
					api_url: sessionData.api_url,
					ws_url: wsUrl,
					id_token: sessionData.id_token || '',
					is_remember: sessionData.is_remember || false
				};

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
