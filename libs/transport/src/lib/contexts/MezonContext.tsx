import EventEmitter from 'events';
import type { Client, Socket } from 'mezon-js';
import { Session } from 'mezon-js';
import { WebSocketAdapterPb } from 'mezon-js-protobuf';
import type { ApiConfirmLoginRequest, ApiLinkAccountConfirmRequest, ApiLoginIDResponse, ApiSession } from 'mezon-js/dist/api.gen';
import type { IndexerClient, MmnClient, ZkClient } from 'mmn-client-js';
import React, { useCallback } from 'react';
import type { CreateMezonClientOptions } from '../mezon';
import {
	createClient as createMezonClient,
	createIndexerClient as createMezonIndexerClient,
	createMmnClient as createMezonMmnClient,
	createZkClient as createMezonZkClient
} from '../mezon';

const MAX_WEBSOCKET_FAILS = 15;
const MIN_WEBSOCKET_RETRY_TIME = 1000;
const MAX_WEBSOCKET_RETRY_TIME = 30000;
const JITTER_RANGE = 1000;
const FAST_RETRY_ATTEMPTS = 5;
export const SESSION_STORAGE_KEY = 'mezon_session';
export const MobileEventSessionEmitter = new EventEmitter();

const waitForNetworkAndDelay = async (delayMs: number): Promise<void> => {
	if (!navigator.onLine) {
		return new Promise((resolve) => {
			const handleOnline = () => {
				window.removeEventListener('online', handleOnline);
				resolve();
			};
			window.addEventListener('online', handleOnline);
		});
	}
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve();
		}, delayMs);
	});
};

type MezonContextProviderProps = {
	children: React.ReactNode;
	mezon: CreateMezonClientOptions;
	connect?: boolean;
	isFromMobile?: boolean;
};

type Sessionlike = {
	token: string;
	refreshToken: string;
	created: boolean;
	isRemember: boolean;
	apiUrl: string;
	expires_at?: number;
	refresh_expires_at?: number;
	created_at?: number;
	username?: string;
	userId?: string;
	id_token?: string;
};

const saveMezonConfigToStorage = (host: string, port: string, useSSL: boolean) => {
	try {
		localStorage.setItem(
			SESSION_STORAGE_KEY,
			JSON.stringify({
				host,
				port,
				ssl: useSSL
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

export const getMezonConfig = (): CreateMezonClientOptions => {
	try {
		const storedConfig = localStorage.getItem('mezon_session');

		if (storedConfig) {
			const parsedConfig = JSON.parse(storedConfig);
			if (parsedConfig.host) {
				parsedConfig.port = parsedConfig.port || (process.env.NX_CHAT_APP_API_PORT as string);
				parsedConfig.key = process.env.NX_CHAT_APP_API_KEY as string;
				return parsedConfig;
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
	if (!session || !session.apiUrl) return null;
	try {
		const url = new URL(session.apiUrl);
		const host = url.hostname;
		const port = url.port;
		const useSSL = url.protocol === 'https:';

		// mobile will use AsyncStorage to save in source mobile app
		if (!isFromMobile) {
			saveMezonConfigToStorage(host, port, useSSL);
		}

		return { host, port, useSSL };
	} catch (error) {
		console.error('Failed to extract config from session:', error);
		return null;
	}
};

export type MezonContextValue = {
	clientRef: React.MutableRefObject<Client | null>;
	sessionRef: React.MutableRefObject<Session | null>;
	socketRef: React.MutableRefObject<Socket | null>;
	zkRef: React.MutableRefObject<ZkClient | null>;
	mmnRef: React.MutableRefObject<MmnClient | null>;
	indexerRef: React.MutableRefObject<IndexerClient | null>;
	createClient: () => Promise<Client>;
	createZkClient: () => ZkClient;
	createMmnClient: () => MmnClient;
	createIndexerClient: () => IndexerClient;
	authenticateMezon: (token: string, isRemember?: boolean) => Promise<Session>;
	createQRLogin: () => Promise<ApiLoginIDResponse>;
	checkLoginRequest: (LoginRequest: ApiConfirmLoginRequest) => Promise<Session | null>;
	confirmLoginRequest: (ConfirmRequest: ApiConfirmLoginRequest) => Promise<Session | null>;
	authenticateEmail: (email: string, password: string) => Promise<Session>;
	authenticateEmailOTPRequest: (email: string) => Promise<ApiLinkAccountConfirmRequest>;
	confirmAuthenticateOTP: (data: ApiLinkAccountConfirmRequest) => Promise<Session>;
	authenticateSMSOTPRequest: (phone: string) => Promise<ApiLinkAccountConfirmRequest>;

	logOutMezon: (deviceId?: string, platform?: string, clearSession?: boolean) => Promise<void>;
	refreshSession: (session: Sessionlike, isSetNewUsername?: boolean) => Promise<Session | undefined>;
	connectWithSession: (session: Sessionlike) => Promise<Session>;
	createSocket: () => Promise<Socket>;
	reconnectWithTimeout: (clanId: string) => Promise<unknown>;
};

const MezonContext = React.createContext<MezonContextValue>({} as MezonContextValue);

const MezonContextProvider: React.FC<MezonContextProviderProps> = ({ children, mezon, connect, isFromMobile = false }) => {
	const clientRef = React.useRef<Client | null>(null);
	const sessionRef = React.useRef<Session | null>(null);
	const socketRef = React.useRef<Socket | null>(null);
	const zkRef = React.useRef<ZkClient | null>(null);
	const mmnRef = React.useRef<MmnClient | null>(null);
	const indexerRef = React.useRef<IndexerClient | null>(null);

	const createSocket = useCallback(async () => {
		if (!clientRef.current) {
			throw new Error('Mezon client not initialized');
		}

		if (socketRef.current && socketRef.current.isOpen()) {
			await socketRef.current.disconnect(false);
		}

		const socket = clientRef.current.createSocket(clientRef.current.useSSL, false, new WebSocketAdapterPb());
		socketRef.current = socket;
		socket.onreconnect = (evt) => {
			if (typeof window === 'undefined') return;
			window.dispatchEvent(
				new CustomEvent('mezon:socket-reconnect', {
					detail: { event: evt }
				})
			);
		};

		return socket;
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
				const sessionData = session;
				const newSession = new Session(
					session.token || '',
					session.refreshToken || '',
					session.created || false,
					session.apiUrl || '',
					session.id_token || '',
					sessionData.isRemember || false
				);

				sessionRef.current = newSession;
				if (isFromMobile) {
					MobileEventSessionEmitter.emit('mezon:session-refreshed', {
						session: newSession
					});
				} else {
					if (typeof window !== 'undefined') {
						window.dispatchEvent(
							new CustomEvent('mezon:session-refreshed', {
								detail: { session: newSession }
							})
						);
					}
					// push to react native webview
					if (typeof window !== 'undefined' && (window as any)?.ReactNativeWebView) {
						(window as any)?.ReactNativeWebView?.postMessage?.(
							JSON.stringify({
								type: 'mezon:session-refreshed',
								data: { session: newSession }
							})
						);
					}
				}
			}
		};

		// Initialize additional clients
		createZkClient();
		createMmnClient();
		createIndexerClient();

		return client;
	}, [mezon, createZkClient, createMmnClient, createIndexerClient, isFromMobile]);

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

		const socket = await createSocket();
		socketRef.current = socket;
		sessionRef.current = session;

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
			const session = await clientRef.current.authenticateMezon(token, undefined, undefined, isFromMobile ? true : (isRemember ?? false));
			sessionRef.current = session;

			const config = extractAndSaveConfig(session, isFromMobile);
			if (config) {
				clientRef.current.setBasePath(config.host, config.port, config.useSSL);
			}

			const socket = await createSocket(); // Create socket after authentication
			socketRef.current = socket;

			if (!socketRef.current) {
				return session;
			}

			await socketRef.current.connect(session, true, isFromMobile ? '1' : '0');

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

			const socket = await createSocket();
			socketRef.current = socket;

			if (!socketRef.current) {
				return session;
			}

			await socketRef.current.connect(session, true, isFromMobile ? '1' : '0');
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

			const socket = await createSocket();
			socketRef.current = socket;

			if (!socketRef.current) {
				return session;
			}

			await socketRef.current.connect(session, true, isFromMobile ? '1' : '0');
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
		async (deviceId?: string, platform?: string, clearSession?: boolean) => {
			clearSessionRefreshFromStorage();
			if (socketRef.current) {
				socketRef.current.ondisconnect = () => {
					//console.log('loged out');
				};
				await socketRef.current.disconnect(false);
				socketRef.current = null;
			}

			if (clientRef.current && sessionRef.current) {
				await clientRef.current.sessionLogout(
					sessionRef.current,
					sessionRef.current?.token,
					sessionRef.current?.refreshToken,
					deviceId || '',
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

			const sessionObj = new Session(
				session?.token,
				session?.refreshToken,
				session.created,
				session.apiUrl,
				session.id_token || '',
				session.isRemember
			);

			if (session.expires_at) {
				sessionObj.expires_at = session.expires_at;
			}

			// if (sessionObj.isexpired(Date.now() / 1000)) {
			// 	await logOutMezon();
			// 	return;
			// }

			if (
				!clientRef.current.host ||
				(clientRef.current.host === process.env.NX_CHAT_APP_API_GW_HOST && clientRef.current.port === process.env.NX_CHAT_APP_API_GW_PORT)
			) {
				await logOutMezon();
				return;
			}

			const newSession = await clientRef.current.sessionRefresh(
				new Session(session?.token, session?.refreshToken, session.created, session.apiUrl, session.id_token || '', session.isRemember)
			);

			sessionRef.current = newSession;
			extractAndSaveConfig(newSession, isFromMobile);

			if (!socketRef.current || isSetNewUsername) {
				const socket = await createSocket();
				socketRef.current = socket;
			}
			await socketRef.current.connect(newSession, true, isFromMobile ? '1' : '0');
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
			await socketRef.current.connect(session, true, isFromMobile ? '1' : '0');
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

			if (socketRef.current && socketRef.current.isOpen()) {
				return socketRef.current;
			}

			if (!clientRef.current || !sessionRef.current) {
				return null;
			}

			reconnectingRef.current = true;

			try {
				let failCount = 0;

				while (failCount < MAX_WEBSOCKET_FAILS) {
					try {
						if (socketRef.current && socketRef.current.isOpen()) {
							return socketRef.current;
						}

						const socket = await createSocket();

						let newSession = null;
						if (sessionRef.current.refreshToken && sessionRef.current.isexpired(Date.now() / 1000)) {
							newSession = await clientRef.current.sessionRefresh(
								new Session(
									sessionRef.current.token,
									sessionRef.current.refreshToken,
									sessionRef.current.created,
									sessionRef.current.apiUrl,
									sessionRef.current.id_token,
									sessionRef.current.isRemember ?? false
								)
							);
						}

						await socket.connect(newSession || sessionRef.current, true, isFromMobile ? '1' : '0');
						await socket.joinClanChat(clanId);

						return socket;
					} catch (error) {
						failCount++;

						if (failCount >= MAX_WEBSOCKET_FAILS) {
							throw new Error('Socket reconnecting...');
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
			mmnRef,
			indexerRef,
			createClient,
			createZkClient,
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
				const newSession = new Session(
					sessionData.token,
					sessionData.refreshToken,
					sessionData.created || false,
					sessionData.apiUrl,
					sessionData.id_token || '',
					sessionData.isRemember || false
				);

				if (sessionData.username) newSession.username = sessionData.username;
				if (sessionData.userId) newSession.userId = sessionData.userId;
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
	const { clientRef, socketRef } = React.useContext(MezonContext);
	if (!clientRef.current || !socketRef.current) {
		return <>Loading...</>;
	}
	// eslint-disable-next-line react/jsx-no-useless-fragment
	return <>{children}</>;
};

export { MezonContext, MezonContextConsumer, MezonContextProvider, MezonSuspense };
