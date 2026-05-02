import { connectMezonSocketOnce, extractAndSaveConfig, resolveSessionWsUrl, useMezon } from '@mezon/transport';
import type { MutableRefObject } from 'react';
import { useEffect, useRef, useState } from 'react';
import { Provider } from 'react-redux';
import type { Store } from 'redux';
import type { Persistor } from 'redux-persist';
import { PersistGate } from 'redux-persist/integration/react';
import { authActions } from './auth/auth.slice';
import { useAppDispatch, type AppDispatch, type RootState, type RootState as RootStateMobile } from './store';

type Props = {
	readonly children: React.ReactNode;
	readonly store: Store<RootState | RootStateMobile>;
	readonly loading: React.ReactNode;
	readonly persistor: Persistor;
};

function waitForPersistorBootstrap(persistor: Persistor): Promise<void> {
	return new Promise((resolve) => {
		if (persistor.getState().bootstrapped) {
			resolve();
			return;
		}
		const unsub = persistor.subscribe(() => {
			if (persistor.getState().bootstrapped) {
				unsub();
				resolve();
			}
		});
	});
}

export function MezonStoreProvider({ children, store, loading, persistor }: Props) {
	const { sessionRef, createClient } = useMezon();
	const [connect, setConnect] = useState(false);
	const connectRef = useRef(false);

	useEffect(() => {
		let cancelled = false;

		const initConnection = async () => {
			await waitForPersistorBootstrap(persistor);

			if (cancelled) {
				return;
			}

			const client = await createClient();
			if (cancelled) {
				return;
			}

			const { auth } = store.getState();
			const session = auth.session;
			const persistClaimsLogin = Boolean(auth.isLogin);

			const finishWithoutSocket = () => {
				setConnect(true);
			};

			const logoutBrokenPersist = () => {
				store.dispatch(authActions.resetSession());
				void (store.dispatch as AppDispatch)(authActions.logOut({}));
			};

			try {
				if (!client) {
					finishWithoutSocket();
					return;
				}

				if (!session) {
					if (persistClaimsLogin) {
						logoutBrokenPersist();
					}
					finishWithoutSocket();
					return;
				}

				const hasToken = !!session.token?.trim();
				const hasSessionId = !!session.session_id?.trim();
				if (hasToken && !hasSessionId) {
					if (persistClaimsLogin) {
						logoutBrokenPersist();
					}
					finishWithoutSocket();
					return;
				}

				if (!persistClaimsLogin) {
					finishWithoutSocket();
					return;
				}

				sessionRef.current = session;

				await connectMezonSocketOnce({
					client,
					sessionRef,
					resolveWsUrl: resolveSessionWsUrl,
					persistSession: (effectiveSession) => extractAndSaveConfig(effectiveSession),
					onSessionRefreshed: (sessionNew, effectiveSession) => {
						store.dispatch(authActions.setSessionId(sessionNew.session_id));
						sessionRef.current = {
							...effectiveSession,
							session_id: sessionNew.session_id
						};
					}
				});
				connectRef.current = true;
			} catch (error) {
				connectRef.current = true;
				console.error('AppInitializer: Connection failed', error);
			}
			setConnect(true);
		};

		initConnection();

		return () => {
			cancelled = true;
		};
	}, [persistor, store, createClient, sessionRef]);
	if (!connect) return null;
	return (
		<Provider store={store}>
			<PersistGate loading={loading} persistor={persistor}>
				<ConnectGate connectRef={connectRef}>{children}</ConnectGate>
			</PersistGate>
		</Provider>
	);
}
const CONNECT_GATE_POLL_MS = 400;
const CONNECT_GATE_MAX_WAIT_MS = 60000;
const CONNECT_GATE_MAX_ATTEMPTS = Math.ceil(CONNECT_GATE_MAX_WAIT_MS / CONNECT_GATE_POLL_MS);

interface ConnectGateProps {
	children: React.ReactNode;
	connectRef: MutableRefObject<boolean>;
}

const ConnectGate = ({ children, connectRef }: ConnectGateProps) => {
	const { clientRef } = useMezon();
	const dispatch = useAppDispatch();

	useEffect(() => {
		if (!clientRef.current || !connectRef.current) {
			return;
		}
		let cancelled = false;
		let attempts = 0;
		const intervalId = window.setInterval(() => {
			if (cancelled) {
				return;
			}
			if (clientRef.current?.isOpen?.()) {
				window.clearInterval(intervalId);
				return;
			}
			attempts += 1;
			if (attempts >= CONNECT_GATE_MAX_ATTEMPTS) {
				window.clearInterval(intervalId);
				dispatch(authActions.resetSession());
			}
		}, CONNECT_GATE_POLL_MS);

		return () => {
			cancelled = true;
			window.clearInterval(intervalId);
		};
	}, []);

	return <>{children}</>;
};
