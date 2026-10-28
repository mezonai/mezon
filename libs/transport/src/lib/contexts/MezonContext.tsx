import EventEmitter from 'events';
import type { ApiConfirmLoginRequest, ApiLinkAccountConfirmRequest, ApiLoginIDResponse, ApiSession, Client } from 'mezon-js';
import type { DongClient, IndexerClient, MmnClient, ZkClient } from 'mmn-client-js';
import React, { useCallback } from 'react';

import type { HealthyEndpointPayload, HealthyEndpointResult, RenewedTokens } from '../healthyEndpoint';
import {
	beginHealthyEndpointAsk,
	canAskHealthyEndpoint,
	fetchHealthyEndpoint,
	fetchSessionRefresh,
	gatewayAnsweredThisOutage,
	isJwtExpired,
	isRefreshRefused,
	noteGatewayAnswered,
	noteHealthyEndpointAsked,
	probeCredential,
	refreshTokenNeedsRotation,
	resetHealthyEndpointThrottle
} from '../healthyEndpoint';
import type { CreateMezonClientOptions } from '../mezon';
import {
	createClient as createMezonClient,
	createDongClient as createMezonDongClient,
	createIndexerClient as createMezonIndexerClient,
	createMmnClient as createMezonMmnClient,
	createZkClient as createMezonZkClient
} from '../mezon';
import { isRealtimeServerPinned, pinnedRealtimeServerHost } from '../realtimeServer';
import { publishSessionUpdate, subscribeSessionUpdate } from '../sessionBridge';
import { socketState } from '../socketState';

let connectInFlight: Promise<ApiSession | null> | null = null;
let reconnectInFlight = false;
// The session id the gateway or the api last refused, and when. While the session still holds it, it is
// neither dialed nor offered to the gateway again. The hold is shorter than the minute between failed
// asks, so the id still gets dialed in between: a refusal can also come from a gateway that failed to
// read its own cache.
let refusedSessionId = '';
let refusedSessionIdAt = 0;
const REFUSED_SESSION_ID_HOLD_MS = 30000;
// A JWT this tab has just been issued is fresh whatever the local clock makes of its exp.
let renewedToken = '';
let renewedTokenAt = 0;
const RENEWED_TOKEN_TRUST_MS = 5 * 60 * 1000;
let refreshTokenRotated = false;
let refreshTokenRotationTriedAt = 0;
const REFRESH_TOKEN_ROTATION_RETRY_MS = 5 * 60 * 1000;
const REFRESH_REFUSAL_CONFIRM_MS = 2000;
const SESSION_RECOVERY_LOCK = 'mezon-session-recovery';

const markSessionIdRefused = (sessionId: string) => {
	refusedSessionId = sessionId;
	refusedSessionIdAt = Date.now();
};

const isSessionIdRefused = (sessionId: string | undefined): boolean =>
	!!sessionId && sessionId === refusedSessionId && Date.now() - refusedSessionIdAt < REFUSED_SESSION_ID_HOLD_MS;

const isTokenFresh = (token: string | undefined): token is string =>
	!!token && ((token === renewedToken && Date.now() - renewedTokenAt < RENEWED_TOKEN_TRUST_MS) || !isJwtExpired(token));

// A renewal or a minted session id that lands after a logout or an account switch must not be written
// over whoever is signed in by then.
const isSameAccount = (current: ApiSession | null, session: ApiSession): current is ApiSession => {
	if (!current) return false;
	const currentUser = (current as { user_id?: string }).user_id;
	const sessionUser = (session as { user_id?: string }).user_id;
	return !currentUser || !sessionUser || currentUser === sessionUser;
};

const readStoredSession = (): ApiSession | null => {
	try {
		const raw = localStorage.getItem('persist:auth');
		const outer = raw ? JSON.parse(raw) : null;
		const session = outer?.session ? JSON.parse(outer.session) : null;
		return session && typeof session === 'object' ? (session as ApiSession) : null;
	} catch {
		return null;
	}
};

// Tabs restored together all find the same session id dead. One at a time, the first renews and mints and
// the rest pick up what it stored, instead of each spending a SessionRefresh and one of the user's ten
// gateway slots.
const withRecoveryLock = <T,>(work: () => Promise<T>): Promise<T> => {
	const locks = typeof navigator !== 'undefined' ? navigator.locks : undefined;
	return locks?.request ? locks.request(SESSION_RECOVERY_LOCK, work) : work();
};

export type ReconnectSocketStatus = 'SUCCESS' | 'RECONNECTING' | 'MISSING_SESSION';
export type ReconnectSocketResult = {
	status: ReconnectSocketStatus;
	attempts: number;
};

export type ConnectSocketOptions = {
	createStatus?: boolean;
	verbose?: boolean;
	useToken?: boolean;
	/** Start a new connect even if one is in flight — the caller has just dropped that socket. */
	force?: boolean;
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

// The session's api host, as long as it is one we talk to; otherwise the configured host, the way
// desktop falls back.
const allowedApiUrl = (session: Pick<ApiSession, 'api_url'>): string | null => {
	const configuredHost = process.env.NX_CHAT_APP_API_HOST;
	const configured = configuredHost
		? `${process.env.NX_CHAT_APP_API_SECURE === 'true' ? 'https' : 'http'}://${configuredHost}:${process.env.NX_CHAT_APP_API_PORT}`
		: '';
	for (const apiUrl of [session.api_url?.trim(), configured]) {
		if (!apiUrl) continue;
		let host = '';
		try {
			host = new URL(apiUrl).hostname;
		} catch {
			host = '';
		}
		if (isAllowedHost(host)) return apiUrl;
		console.error('[sessionRefresh] skipping an api host we do not talk to:', apiUrl);
	}
	return null;
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

// The node the socket actually dials. A pinned server wins over the one the gateway handed out,
// but it is never written back into the session: switching to Auto has to find the gateway's node
// still there.
export function resolveConnectWsUrl(session: Pick<ApiSession, 'ws_url'>): string {
	const pinned = pinnedRealtimeServerHost();
	if (pinned && isAllowedHost(pinned)) {
		return pinned;
	}
	return resolveSessionWsUrl(session);
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
	askHealthyEndpoint: (options?: { force?: boolean }) => Promise<HealthyEndpointResult>;
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
			return clientRef.current.connect(
				sessionRef.current.session_id || sessionRef.current.token || '',
				resolveConnectWsUrl(sessionRef.current)
			);
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
				await clientRef.current.connect(merged.session_id || merged.token || '', resolveConnectWsUrl(merged), true);
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
			await clientRef.current.connect(merged.session_id || merged.token || '', resolveConnectWsUrl(merged));
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
			await clientRef.current.connect(merged.session_id || merged.token || '', resolveConnectWsUrl(merged));
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
		if (connectInFlight && !options.force) {
			return connectInFlight;
		}

		const attempt = (async () => {
			const sr = sessionRef.current;
			if (!sr) return null;

			const wsUrl = resolveSessionWsUrl(sr);
			sessionRef.current = { ...sr, ws_url: wsUrl };

			const token = sessionRef.current.token?.trim();
			const tokenFresh = isTokenFresh(token);
			const sessionIdRefused = isSessionIdRefused(sessionRef.current.session_id?.trim());
			// An expired JWT, or a session id the server just refused, buys a certain refusal and spends a
			// handshake on proto-server's limiter, so with nothing better to offer, wait for the next
			// renewal instead (desktop holds its reconnect the same way).
			if (options.useToken ? !tokenFresh : sessionIdRefused && !tokenFresh) {
				throw new Error('No Mezon credential the server would accept yet');
			}
			const leadWithToken = options.useToken || sessionIdRefused;
			const credential = leadWithToken ? token : sessionRef.current.session_id?.trim();
			if (!credential) {
				throw new Error('Missing Mezon session credential');
			}

			await client.connect(credential, resolveConnectWsUrl(sessionRef.current), options.createStatus ?? true);

			socketState.status = 'connected';
			return sessionRef.current;
		})();

		connectInFlight = attempt;
		// Registered straight on `attempt` so the handle is gone before the caller's `await`
		// resumes — otherwise a caller retrying inside its own catch (bootstrap's token fallback)
		// gets handed this very rejection again instead of a fresh connect.
		attempt
			.finally(() => {
				if (connectInFlight === attempt) {
					connectInFlight = null;
				}
			})
			.catch(() => undefined);

		return attempt;
	}, []);

	// Every credential the gateway or the api hands out while the socket is down lands here, so the next
	// connect, a reload and the other tabs all pick it up.
	const adoptSession = useCallback(
		(next: ApiSession) => {
			sessionRef.current = next;
			try {
				const raw = localStorage.getItem('persist:auth');
				const outer = raw ? JSON.parse(raw) : {};
				outer.session = JSON.stringify(next);
				localStorage.setItem('persist:auth', JSON.stringify(outer));
			} catch (error) {
				console.error('[healthyEndpoint] could not persist the new session', error);
			}
			extractAndSaveConfig(next, isFromMobile);
			publishSessionUpdate(next, 'refresh');
		},
		[isFromMobile]
	);

	// `refused` only when the api turned the refresh token down, or there is none to send; a refresh it
	// could not answer, or could not be sent for want of an api host or a server key, keeps the session.
	const renewSessionTokens = useCallback(
		async (session: ApiSession): Promise<{ tokens: RenewedTokens | null; refused: boolean }> => {
			const refreshToken = session.refresh_token?.trim();
			if (!refreshToken) {
				return { tokens: null, refused: true };
			}
			const apiUrl = allowedApiUrl(session);
			const serverKey = getMezonConfig().key;
			if (!apiUrl || !serverKey) {
				return { tokens: null, refused: false };
			}
			const isRemember = !!session.is_remember;
			let { status, tokens } = await fetchSessionRefresh(apiUrl, serverKey, refreshToken, isRemember);
			// The api reports a refresh token it will not take as 500, the code any failure of its own would
			// produce too. A refresh token past its own expiry is beyond doubt; otherwise one more try a
			// moment later tells a refusal from a hiccup before it costs the user their session. Another tab
			// may have rotated the token meanwhile (which is what gets this one refused where the api revokes
			// on refresh), so the retry uses whatever is stored by then.
			if (!tokens && isRefreshRefused(status) && !isJwtExpired(refreshToken)) {
				await new Promise((resolve) => setTimeout(resolve, REFRESH_REFUSAL_CONFIRM_MS));
				const stored = readStoredSession();
				const latest = stored && isSameAccount(stored, session) ? stored.refresh_token?.trim() || refreshToken : refreshToken;
				({ status, tokens } = await fetchSessionRefresh(apiUrl, serverKey, latest, isRemember));
			}
			const current = sessionRef.current;
			if (!isSameAccount(current, session)) {
				return { tokens: null, refused: false };
			}
			if (tokens) {
				renewedToken = tokens.token;
				renewedTokenAt = Date.now();
				adoptSession({ ...current, ...tokens });
			}
			return { tokens, refused: !tokens && isRefreshRefused(status) };
		},
		[adoptSession]
	);

	// A tab that never needs its JWT still has to keep the refresh token alive, or the first time its
	// session id is retired after thirty days there is nothing left to renew it with. Once per page load,
	// like desktop's once-per-launch rotation; a refresh the api could not answer is tried again later.
	const rotateRefreshTokenIfDue = useCallback(() => {
		const session = sessionRef.current;
		const refreshToken = session?.refresh_token?.trim();
		const now = Date.now();
		if (
			refreshTokenRotated ||
			now - refreshTokenRotationTriedAt < REFRESH_TOKEN_ROTATION_RETRY_MS ||
			!session ||
			!refreshToken ||
			!refreshTokenNeedsRotation(refreshToken)
		) {
			return;
		}
		refreshTokenRotationTriedAt = now;
		void renewSessionTokens(session).then(({ tokens, refused }) => {
			refreshTokenRotated = !!tokens || refused;
		});
	}, [renewSessionTokens]);

	React.useEffect(
		() =>
			socketState.subscribe((status) => {
				if (status === 'connected') {
					rotateRefreshTokenIfDue();
				}
			}),
		[rotateRefreshTokenIfDue]
	);

	// The node the gateway handed out is not answering, so ask the gateway which one is, and when it is the
	// session id that died, get a working credential back. A pinned server is the user's call and is never
	// moved by this.
	const askHealthyEndpoint = useCallback(
		async ({ force = false }: { force?: boolean } = {}): Promise<HealthyEndpointResult> => {
			const session = sessionRef.current;
			// The gateway takes either credential; the session id is the one that stays fresh while the
			// socket is down (nothing refreshes the JWT on that path).
			const sessionId = session?.session_id?.trim();
			const token = session?.token?.trim();
			const credential = sessionId || token;
			if (!session || !credential || !canAskHealthyEndpoint(force)) {
				return 'skipped';
			}
			const pinned = isRealtimeServerPinned();
			const apiUrl = allowedApiUrl(session);
			// Asking about a session id that was just refused only costs another round trip.
			const knownRefused = isSessionIdRefused(sessionId);
			if (pinned && !knownRefused && (!sessionId || !apiUrl)) {
				return 'skipped';
			}

			const cfg = getMezonConfig();
			const basePath = `${cfg.ssl ? 'https://' : 'http://'}${cfg.host}:${cfg.port}`;
			beginHealthyEndpointAsk(force);
			let status = 0;
			let payload: HealthyEndpointPayload | null = null;
			let refusedByProbe = false;
			if (knownRefused) {
				status = 401;
			} else if ((pinned || gatewayAnsweredThisOutage()) && sessionId && apiUrl) {
				// Every gateway answer mints a session id, so a tab with no use for the node it names (pinned,
				// or already told this outage) only asks once the api has confirmed the session id is dead.
				const probe = await probeCredential(apiUrl, sessionId);
				if (probe !== 'rejected') {
					noteHealthyEndpointAsked(probe === 'inconclusive');
					return 'skipped';
				}
				status = 401;
				refusedByProbe = true;
			} else {
				({ status, payload } = await fetchHealthyEndpoint(basePath, credential));
				// A gateway that cannot answer says nothing about the session id, but the api can.
				if (!payload && status !== 0 && status !== 401 && status !== 403 && credential === sessionId && apiUrl) {
					if ((await probeCredential(apiUrl, sessionId)) === 'rejected') {
						status = 401;
						refusedByProbe = true;
					}
				}
			}

			// Once the session id is refused the JWT is the way back, the way desktop does it: renew it if it
			// is stale, have the gateway mint a session id with it, and if the gateway cannot, let the socket
			// lead with the JWT. Both refused is what a long-lived tab looks like once its session id is
			// retired: the JWT expired minutes after load, while the refresh token still holds.
			const credentialRefused = !payload && (status === 401 || status === 403);
			let freshToken = isTokenFresh(token) ? token : '';
			let renewed = false;
			const renew = async (): Promise<HealthyEndpointResult | null> => {
				const renewal = await renewSessionTokens(session);
				if (renewal.tokens) {
					freshToken = renewal.tokens.token;
					renewed = true;
					return null;
				}
				noteHealthyEndpointAsked(true);
				// Only the api turning the refresh token down ends the session; an api that could not
				// answer leaves it alone.
				return renewal.refused ? 'rejected' : 'failed';
			};
			// What the answers add up to, adopted while this tab still holds the recovery lock so a tab waiting
			// on it finds the new session id already stored.
			const settle = (): HealthyEndpointResult => {
				if (!payload) {
					noteHealthyEndpointAsked(true);
					// 401/403 is the gateway saying this session is gone, unless the api has just renewed it: a
					// gateway refusing a JWT the api issued a moment ago is the gateway's problem. No status at all
					// means we never reached it. Any other status (rate limit, 5xx) is the gateway being unhappy,
					// which says nothing about the session or the network.
					if ((status === 401 || status === 403) && !renewed) {
						return 'rejected';
					}
					// No new session id, but a fresh JWT the socket can lead with until one is minted.
					if (credentialRefused && freshToken) {
						return 'renewed';
					}
					return status === 0 ? 'unreachable' : 'failed';
				}
				noteHealthyEndpointAsked(false);
				noteGatewayAnswered();

				const host = (payload.ws_url ?? '').trim();
				// The gateway answers with `host` on production but `host:port` elsewhere; the allowlist
				// only knows hostnames.
				if (host && !isAllowedHost(host.split(':')[0])) {
					console.error('[healthyEndpoint] gateway named a host we do not talk to:', host);
					return 'failed';
				}

				const current = sessionRef.current;
				if (!isSameAccount(current, session)) {
					return 'skipped';
				}
				const previousHost = resolveSessionWsUrl(session);
				// The gateway mints a session id for every answer and may retire the old one, so the new
				// session id has to be adopted even when it keeps us on the same node.
				adoptSession({
					...current,
					ws_url: host || current.ws_url,
					api_url: (payload.api_url ?? '').trim() || current.api_url,
					session_id: (payload.session_id ?? '').trim() || current.session_id
				});

				if (!pinned && host && host !== previousHost) {
					console.warn(`[healthyEndpoint] gateway moved us from ${previousHost} to ${host}`);
					return 'changed';
				}
				return credentialRefused ? 'renewed' : 'same';
			};
			if (!credentialRefused) {
				return settle();
			}
			// A gateway refusal holds the id off right away (see REFUSED_SESSION_ID_HOLD_MS); a probe's waits
			// for the JWT check below.
			if (sessionId && credential === sessionId && !refusedByProbe && !knownRefused) {
				markSessionIdRefused(sessionId);
			}
			return withRecoveryLock(async (): Promise<HealthyEndpointResult> => {
				// Another tab may have recovered while this one waited: what it stored is the way back.
				const stored = readStoredSession();
				const storedSessionId = stored?.session_id?.trim();
				const current = sessionRef.current;
				if (
					stored &&
					storedSessionId &&
					storedSessionId !== sessionId &&
					!isSessionIdRefused(storedSessionId) &&
					isSameAccount(current, stored)
				) {
					sessionRef.current = { ...current, ...stored };
					noteHealthyEndpointAsked(false);
					return 'renewed';
				}
				const renewStopped = !freshToken || credential === freshToken ? await renew() : null;
				if (renewStopped) {
					return renewStopped;
				}
				// The api answers 403 to a rate-limited caller as well. A session id is only written off, and a
				// new one minted, once the same api takes the JWT: refusing that too is the limiter talking.
				if (refusedByProbe && apiUrl && (await probeCredential(apiUrl, freshToken)) !== 'alive') {
					noteHealthyEndpointAsked(true);
					return 'failed';
				}
				if (refusedByProbe && sessionId) {
					markSessionIdRefused(sessionId);
				}
				({ status, payload } = await fetchHealthyEndpoint(basePath, freshToken));
				// A JWT we still held as fresh can be refused too; a renewed one gets the last word.
				if (!payload && (status === 401 || status === 403) && !renewed) {
					const retryStopped = await renew();
					if (retryStopped) {
						return retryStopped;
					}
					({ status, payload } = await fetchHealthyEndpoint(basePath, freshToken));
				}
				return settle();
			});
		},
		[adoptSession, renewSessionTokens]
	);

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
		resetHealthyEndpointThrottle();
		reconnectInFlight = false;
		connectInFlight = null;
		refusedSessionId = '';
		renewedToken = '';
		refreshTokenRotated = false;
		refreshTokenRotationTriedAt = 0;
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

			await clientRef.current.connect(merged.session_id || merged.token || '', resolveConnectWsUrl(merged));
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
			reconnectSocket,
			askHealthyEndpoint
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
			reconnectSocket,
			askHealthyEndpoint
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
