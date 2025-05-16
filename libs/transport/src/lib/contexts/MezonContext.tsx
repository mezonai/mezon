import { Client, DefaultSocket, Session, Socket } from 'mezon-js';
import { WebSocketAdapterPb } from 'mezon-js-protobuf';
import { ApiConfirmLoginRequest, ApiLoginIDResponse } from 'mezon-js/dist/api.gen';
import React, { useCallback } from 'react';
import { CreateMezonClientOptions, createClient as createMezonClient } from '../mezon';

const MAX_WEBSOCKET_FAILS = 8;
const MIN_WEBSOCKET_RETRY_TIME = 3000;
const MAX_WEBSOCKET_RETRY_TIME = 300000;
const JITTER_RANGE = 2000;
const SESSION_STORAGE_KEY = 'mezon_session';

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

const clearSessionFromStorage = () => {
	try {
		localStorage.removeItem(SESSION_STORAGE_KEY);
	} catch (error) {
		console.error('Failed to clear session from local storage:', error);
	}
};

export const extractAndSaveConfig = (session: Session | null, isFromMobile?: boolean) => {
	if (!session || !session.api_url) return null;
	try {
		const url = new URL(session.api_url);
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
	createClient: () => Promise<Client>;
	authenticateMezon: (token: string, isRemember?: boolean) => Promise<Session>;
	createQRLogin: () => Promise<ApiLoginIDResponse>;
	checkLoginRequest: (LoginRequest: ApiConfirmLoginRequest) => Promise<Session | null>;
	confirmLoginRequest: (ConfirmRequest: ApiConfirmLoginRequest) => Promise<Session | null>;
	authenticateEmail: (email: string, password: string) => Promise<Session>;

	logOutMezon: (device_id?: string, platform?: string) => Promise<void>;
	refreshSession: (session: Sessionlike) => Promise<Session | undefined>;
	connectWithSession: (session: Sessionlike) => Promise<Session>;

	reconnectWithTimeout: (clanId: string) => Promise<unknown>;
};

const isSessionExpired = (expiresAt: number): boolean => {
	const now = Math.floor(Date.now() / 1000) + 5;
	return now >= expiresAt;
};

const MezonContext = React.createContext<MezonContextValue>({} as MezonContextValue);

const MezonContextProvider: React.FC<MezonContextProviderProps> = ({ children, mezon, connect, isFromMobile = false }) => {
	const clientRef = React.useRef<Client | null>(null);
	const sessionRef = React.useRef<Session | null>(null);
	const socketRef = React.useRef<Socket | null>(null);

	const createSocket = useCallback(async () => {
		if (!clientRef.current) {
			throw new Error('Mezon client not initialized');
		}

		if (socketRef.current && socketRef.current.isOpen()) {
			await socketRef.current.disconnect(false);
		}

		const socket = clientRef.current.createSocket(clientRef.current.useSSL, false, new WebSocketAdapterPb());
		socketRef.current = socket;
		return socket;
	}, [clientRef, socketRef]);

	const createClient = useCallback(async () => {
		const client = await createMezonClient(mezon);
		clientRef.current = client;
		return client;
	}, [mezon]);

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

			const session2 = await socketRef.current.connect(session, true, isFromMobile ? '1' : '0');
			sessionRef.current = session2;

			return session;
		},
		[createSocket, isFromMobile]
	);

	const authenticateEmail = useCallback(
		async (email: string, password: string) => {
			if (!clientRef.current) {
				throw new Error('Mezon client not initialized');
			}
			const session = await clientRef.current.authenticateEmail(email, password);
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

			const session2 = await socketRef.current.connect(session, true, isFromMobile ? '1' : '0');
			sessionRef.current = session2;

			return session;
		},
		[createSocket, isFromMobile]
	);

	const logOutMezon = useCallback(
		async (device_id?: string, platform?: string) => {
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
					sessionRef.current?.refresh_token,
					device_id || '',
					platform || ''
				);

				sessionRef.current = null;
				clearSessionFromStorage();
				clientRef.current.setBasePath(
					process.env.NX_CHAT_APP_API_GW_HOST as string,
					process.env.NX_CHAT_APP_API_GW_PORT as string,
					process.env.NX_CHAT_APP_API_SECURE === 'true'
				);
			}
		},
		[socketRef]
	);

	const refreshSession = useCallback(
		async (session: Sessionlike) => {
			if (!clientRef.current) {
				throw new Error('Mezon client not initialized');
			}

			if (session.expires_at && isSessionExpired(session.expires_at)) {
				await logOutMezon();
				throw new Error('Mezon client not initialized');
			}

			if (!clientRef.current.host || clientRef.current.host === process.env.NX_CHAT_APP_API_GW_HOST) {
				await logOutMezon();
				throw new Error('Mezon client not initialized');
			}

			const newSession = await clientRef.current.sessionRefresh(
				new Session(session.token, session.refresh_token, session.created, session.api_url, session.is_remember)
			);
			sessionRef.current = newSession;
			extractAndSaveConfig(newSession, isFromMobile);

			if (!socketRef.current) {
				return newSession;
			}

			const session2 = await socketRef.current.connect(newSession, true, isFromMobile ? '1' : '0');
			sessionRef.current = session2;
			return newSession;
		},
		[clientRef, socketRef, isFromMobile, logOutMezon]
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
			const session2 = await socketRef.current.connect(session, true, isFromMobile ? '1' : '0');
			sessionRef.current = session2;
			return session;
		},
		[clientRef, socketRef, isFromMobile]
	);

	const abortControllerRef = React.useRef<AbortController | null>(null);
	const timeoutIdRef = React.useRef<NodeJS.Timeout | null>(null);

	const reconnect = React.useCallback(
		async (clanId: string) => {
			if (!clientRef.current) {
				return Promise.resolve(null);
			}

			const session = sessionRef.current;

			if (!session) {
				return Promise.resolve(null);
			}

			if (!socketRef.current) {
				return Promise.resolve(null);
			}

			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
			}

			abortControllerRef.current = new AbortController();
			const signal = abortControllerRef.current.signal;

			// eslint-disable-next-line no-async-promise-executor
			return new Promise(async (resolve, reject) => {
				let failCount = 0;

				signal.addEventListener('abort', () => {
					if (timeoutIdRef.current) {
						clearTimeout(timeoutIdRef.current);
						return resolve('RECONNECTING');
					}
				});

				const retry = async () => {
					if (failCount >= MAX_WEBSOCKET_FAILS) {
						return reject('Cannot reconnect to the socket. Please restart the app.');
					}

					try {
						if (socketRef.current && socketRef.current.isOpen()) {
							return resolve(socketRef.current);
						}

						const socket = await createSocket();
						const newSession = await clientRef?.current?.sessionRefresh(
							new Session(session.token, session.refresh_token, session.created, session.api_url, session.is_remember ?? false)
						);

						const connectedSession = await socket.connect(
							newSession || session,
							true,
							isFromMobile ? '1' : '0',
							DefaultSocket.DefaultConnectTimeoutMs,
							signal
						);

						await socket.joinClanChat(clanId);
						socketRef.current = socket;
						sessionRef.current = connectedSession;
						extractAndSaveConfig(connectedSession, isFromMobile);
						return resolve(socket);
					} catch (error) {
						failCount++;
						const retryTime = isFromMobile
							? 0
							: Math.min(MIN_WEBSOCKET_RETRY_TIME * Math.pow(2, failCount), MAX_WEBSOCKET_RETRY_TIME) + Math.random() * JITTER_RANGE;
						await new Promise((res) => {
							timeoutIdRef.current = setTimeout(res, retryTime);
						});

						if (socketRef.current && socketRef.current.isOpen()) {
							return resolve(socketRef.current);
						}
						await retry();
					}
				};

				if (socketRef.current && socketRef.current.isOpen()) {
					return resolve(socketRef.current);
				}
				await retry();
			});
		},
		[createSocket, isFromMobile]
	);

	const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

	const reconnectWithTimeout = React.useCallback(
		(clanId: string) => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}

			if (socketRef.current && socketRef.current.isOpen()) {
				return Promise.resolve(socketRef.current);
			}

			return new Promise((resolve, reject) => {
				timeoutRef.current = setTimeout(() => {
					reconnect(clanId).then(resolve).catch(reject);
				}, 500);
			});
		},
		[reconnect, socketRef]
	);

	const value = React.useMemo<MezonContextValue>(
		() => ({
			clientRef,
			sessionRef,
			socketRef,
			createClient,
			createQRLogin,
			checkLoginRequest,
			confirmLoginRequest,
			refreshSession,
			createSocket,
			logOutMezon,
			reconnectWithTimeout,
			authenticateMezon,
			authenticateEmail,
			connectWithSession
		}),
		[
			clientRef,
			sessionRef,
			socketRef,
			createClient,
			createQRLogin,
			checkLoginRequest,
			confirmLoginRequest,
			refreshSession,
			createSocket,
			logOutMezon,
			reconnectWithTimeout,
			authenticateMezon,
			authenticateEmail,
			connectWithSession
		]
	);

	React.useEffect(() => {
		if (connect) {
			createClient().then(() => {
				return createSocket();
			});
		}
	}, [connect, createClient, createSocket]);

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
