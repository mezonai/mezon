import EventEmitter from 'events';
import type { ApiConfirmLoginRequest, ApiLinkAccountConfirmRequest, ApiLoginIDResponse, ApiSession, Client } from 'mezon-js';
import type { DongClient, IndexerClient, MmnClient, ZkClient } from 'mmn-client-js';
import React, { useCallback } from 'react';

import type { CreateMezonClientOptions } from '../mezon';
import {
	createClient as createMezonClient,
	createDongClient as createMezonDongClient,
	createIndexerClient as createMezonIndexerClient,
	createMmnClient as createMezonMmnClient,
	createZkClient as createMezonZkClient
} from '../mezon';
import { publishSessionUpdate, subscribeSessionUpdate } from '../sessionBridge';
import { socketState } from '../socketState';

let connectInFlight: Promise<ApiSession | null> | null = null;
let reconnectInFlight = false;

export type ReconnectSocketStatus = 'SUCCESS' | 'RECONNECTING' | 'MISSING_SESSION';
export type ReconnectSocketResult = {
	status: ReconnectSocketStatus;
	attempts: number;
};

export type ConnectSocketOptions = {
	createStatus?: boolean;
	verbose?: boolean;
};

let sessionRefreshFailCount = 0;
let sessionRefreshBlocked = false;

export function resetSessionRefreshBlock() {
	sessionRefreshFailCount = 0;
	sessionRefreshBlocked = false;
}

export const DEFAULT_WS_URL = 'sock.mezon.ai';
export const SESSION_STORAGE_KEY = 'mezon_session';
export const MobileEventSessionEmitter = new EventEmitter();

type MezonContextProviderProps = {
	children: React.ReactNode;
	mezon: CreateMezonClientOptions;
	connect?: boolean;
	isFromMobile?: boolean;
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

		const trimmedIncoming = wsUrl?.trim();
		const trimmedExisting = typeof existingWsUrl === 'string' ? existingWsUrl.trim() : '';
		const finalWsUrl = trimmedIncoming || trimmedExisting || DEFAULT_WS_URL;

		localStorage.setItem(
			SESSION_STORAGE_KEY,
			JSON.stringify({
				host,
				port,
				ssl: useSSL,
				api_url: apiUrl,
				ws_url: finalWsUrl
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
	const fallback: MezonConfigResult = {
		host: process.env.NX_CHAT_APP_API_GW_HOST as string,
		port: process.env.NX_CHAT_APP_API_GW_PORT as string,
		key: process.env.NX_CHAT_APP_API_KEY as string,
		ssl: process.env.NX_CHAT_APP_API_SECURE === 'true',
		ws_url: DEFAULT_WS_URL
	};
	return fallback;
};

export function resolveSessionWsUrl(session: Pick<ApiSession, 'ws_url'>): string {
	const cfg = getMezonConfig();
	return ((session.ws_url ?? '').trim() || cfg.ws_url || DEFAULT_WS_URL) as string;
}

export const extractAndSaveConfig = (session: ApiSession | null, isFromMobile?: boolean) => {
	if (!session || !session.api_url) return null;
	try {
		const url = new URL(session.api_url);
		const host = url.hostname;
		const port = url.port || (process.env.NX_CHAT_APP_API_GW_PORT as string);
		const useSSL = url.protocol === 'https:';
		const wsUrlResolved = resolveSessionWsUrl(session);
		const apiUrl = session.api_url;

		if (!isFromMobile) {
			saveMezonConfigToStorage(host, port, useSSL, apiUrl, wsUrlResolved);
		}

		return { host, port, useSSL, wsUrl: wsUrlResolved, apiUrl };
	} catch (error) {
		console.error('Failed to extract config from session:', error);
		return null;
	}
};

export type MezonContextValue = {
	clientRef: React.MutableRefObject<Client | null>;
	sessionRef: React.MutableRefObject<ApiSession | null>;
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
	connectSocket: (options?: ConnectSocketOptions) => Promise<ApiSession | null>;
	reconnectSocket: () => Promise<ReconnectSocketResult>;
};

const MezonContext = React.createContext<MezonContextValue>({} as MezonContextValue);

const MezonContextProvider: React.FC<MezonContextProviderProps> = ({ children, mezon, connect, isFromMobile = false }) => {
	const clientRef = React.useRef<Client | null>(null);
	const sessionRef = React.useRef<ApiSession | null>(null);
	const zkRef = React.useRef<ZkClient | null>(null);
	const dongRef = React.useRef<DongClient | null>(null);
	const mmnRef = React.useRef<MmnClient | null>(null);
	const indexerRef = React.useRef<IndexerClient | null>(null);
	const lastPersistedSidRef = React.useRef<string | null>(null);

	React.useEffect(() => {
		const unsubscribe = subscribeSessionUpdate(({ session, source }) => {
			if (source === 'refresh') return;
			sessionRef.current = session;
		});
		return unsubscribe;
	}, []);

	const createSocket = useCallback(async () => {
		if (!clientRef.current) {
			throw new Error('Mezon client not initialized');
		}

		if (clientRef.current.isOpen?.()) {
			return undefined;
		}

		if (sessionRef.current?.token || sessionRef.current?.session_id) {
			const sr = sessionRef.current as ApiSession;
			const wsUrl = resolveSessionWsUrl(sr);
			sessionRef.current = { ...sr, ws_url: wsUrl };
			return clientRef.current.connect(sessionRef.current.session_id || sessionRef.current.token || '', wsUrl);
		}
	}, [clientRef]);

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
		if (clientRef.current) {
			return Promise.resolve(clientRef.current);
		}

		const client = createMezonClient(mezon);
		clientRef.current = client;

		client.onrefreshsession = (sessionNew: ApiSession) => {
			const prev = sessionRef.current;
			const nextSid = sessionNew?.session_id;
			if (!prev || !nextSid) {
				return;
			}

			const updated: ApiSession = { ...prev, session_id: nextSid };

			if (lastPersistedSidRef.current !== nextSid) {
				try {
					const raw = localStorage.getItem('persist:auth');
					const outer = raw ? JSON.parse(raw) : {};
					outer.session = JSON.stringify(updated);
					localStorage.setItem('persist:auth', JSON.stringify(outer));
					lastPersistedSidRef.current = nextSid;
				} catch (err) {
					console.error('[SessionFix] onrefreshsession localStorage write failed', err);
				}
			}

			if (prev.session_id !== nextSid) {
				sessionRef.current = updated;
				publishSessionUpdate(updated, 'refresh');
			}
		};

		createZkClient();
		createMmnClient();
		createDongClient();
		createIndexerClient();

		return client;
	}, [mezon, createZkClient, createMmnClient, createDongClient, createIndexerClient]);

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
		const session = await clientRef.current.confirmLogin(sessionRef.current, confirmRequest);
		return session;
	}, []);

	const authenticateMezon = useCallback(
		async (token: string, isRemember?: boolean) => {
			if (!clientRef.current) {
				throw new Error('Mezon client not initialized');
			}
			resetSessionRefreshBlock();
			const session = await clientRef.current.authenticateMezon(token, undefined, undefined, isFromMobile ? true : (isRemember ?? false));
			const wsUrl = resolveSessionWsUrl(session);
			const merged: ApiSession = { ...session, ws_url: wsUrl };
			sessionRef.current = merged;

			if (!merged.token && !merged.session_id) {
				throw new Error('Mezon connect lost data');
			}
			try {
				await clientRef.current.connect(merged.session_id || merged.token || '', wsUrl, true);
			} catch (error) {
				console.error('error: ', error);
			}
			socketState.status = 'connected';

			return merged;
		},
		[isFromMobile]
	);

	const authenticateEmail = useCallback(
		async (email: string, password: string) => {
			if (!clientRef.current) {
				throw new Error('Mezon client not initialized');
			}
			const session = await clientRef.current.authenticateEmail(email, password, undefined, isFromMobile ? { m: 'true' } : undefined);
			const wsUrl = resolveSessionWsUrl(session);
			const merged: ApiSession = { ...session, ws_url: wsUrl };
			sessionRef.current = merged;

			if (!merged.token && !merged.session_id) {
				throw new Error('Mezon connect lost data');
			}
			await clientRef.current.connect(merged.session_id || merged.token || '', wsUrl);
			socketState.status = 'connected';
			return merged;
		},
		[isFromMobile]
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
			const wsUrl = resolveSessionWsUrl(session);
			const merged: ApiSession = { ...session, ws_url: wsUrl };
			sessionRef.current = merged;

			if (!merged.token && !merged.session_id) {
				throw new Error('Mezon connect lost data');
			}
			await clientRef.current.connect(merged.session_id || merged.token || '', wsUrl);
			socketState.status = 'connected';
			return merged;
		},
		[isFromMobile]
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

	const connectSocket = useCallback((options: ConnectSocketOptions = {}): Promise<ApiSession | null> => {
		const client = clientRef.current;
		if (!client || !sessionRef.current) {
			return Promise.resolve(null);
		}
		if (connectInFlight) {
			return connectInFlight;
		}

		connectInFlight = (async () => {
			const sr = sessionRef.current;
			if (!sr) return null;

			const wsUrl = resolveSessionWsUrl(sr);
			sessionRef.current = { ...sr, ws_url: wsUrl };

			const credential = sessionRef.current.session_id?.trim();
			if (!credential) {
				throw new Error('Missing Mezon session credential');
			}

			await client.connect(credential, wsUrl, options.createStatus ?? true);

			socketState.status = 'connected';
			return sessionRef.current;
		})().finally(() => {
			connectInFlight = null;
		});

		return connectInFlight;
	}, []);

	const reconnectSocket = useCallback(async (): Promise<ReconnectSocketResult> => {
		if (reconnectInFlight) {
			return { status: 'RECONNECTING', attempts: 0 };
		}
		if (!clientRef.current || !sessionRef.current) {
			return { status: 'MISSING_SESSION', attempts: 0 };
		}

		reconnectInFlight = true;
		try {
			const result = await connectSocket();
			if (result === null) {
				return { status: 'MISSING_SESSION', attempts: 1 };
			}
			return { status: 'SUCCESS', attempts: 1 };
		} catch {
			throw new Error('Socket reconnection failed');
		} finally {
			reconnectInFlight = false;
		}
	}, [connectSocket]);

	const logOutMezon = useCallback(async (device_id?: string, platform?: string, clearSession?: boolean) => {
		resetSessionRefreshBlock();
		reconnectInFlight = false;
		connectInFlight = null;
		clearSessionRefreshFromStorage();

		clearSessionFromStorage();
		if (clientRef.current && sessionRef.current && sessionRef.current?.token) {
			await clientRef.current.sessionLogout(
				sessionRef.current,
				sessionRef.current?.token,
				sessionRef.current?.refresh_token || '',
				device_id || '',
				platform || ''
			);
			sessionRef.current = null;
		}
	}, []);

	const connectWithSession = useCallback(
		async (session: ApiSession) => {
			if (!clientRef.current) {
				throw new Error('Mezon client not initialized');
			}
			const wsUrl = resolveSessionWsUrl(session);
			const merged: ApiSession = { ...session, ws_url: wsUrl };
			sessionRef.current = merged;
			extractAndSaveConfig(merged, isFromMobile);

			if (clientRef.current.isOpen?.()) {
				socketState.status = 'connected';
				return merged;
			}

			await clientRef.current.connect(merged.session_id || merged.token || '', wsUrl);
			socketState.status = 'connected';
			return merged;
		},
		[clientRef, isFromMobile]
	);

	const value = React.useMemo<MezonContextValue>(
		() => ({
			clientRef,
			sessionRef,
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
			authenticateSMSOTPRequest,
			connectSocket,
			reconnectSocket
		}),
		[
			clientRef,
			sessionRef,
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
			authenticateSMSOTPRequest,
			connectSocket,
			reconnectSocket
		]
	);

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
