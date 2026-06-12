import { configureSessionAuthRetry, probeNetworkReachability, RECONNECT_NETWORK_PROBE_TIMEOUT_MS, useMezon } from '@mezon/transport';
import type { ApiSession } from 'mezon-js';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import type { Persistor } from 'redux-persist';
import { authActions } from './auth/auth.slice';
import { sessionHasCredentials } from './helpers';
import { refreshMezonSession } from './sessionAuth';
import { useAppDispatch } from './store';

const PERSIST_AUTH_KEY = 'persist:auth';
const MAX_RETRIES = 4;

function readPersistedSession(): ApiSession | null {
	try {
		const raw = localStorage.getItem(PERSIST_AUTH_KEY);
		if (!raw) return null;
		const outer = JSON.parse(raw);
		if (!outer?.session) return null;
		const parsed = JSON.parse(outer.session);
		return parsed && typeof parsed === 'object' ? (parsed as ApiSession) : null;
	} catch {
		return null;
	}
}

function waitForPersistorBootstrap(persistor: Persistor, timeoutMs = 5000): Promise<void> {
	return new Promise((resolve) => {
		if (persistor.getState().bootstrapped) {
			resolve();
			return;
		}

		const timeout = setTimeout(() => {
			unsub();
			resolve();
		}, timeoutMs);

		const unsub = persistor.subscribe(() => {
			if (persistor.getState().bootstrapped) {
				clearTimeout(timeout);
				unsub();
				resolve();
			}
		});
	});
}

type Props = {
	children: ReactNode;
	persistor: Persistor;
	fallback?: ReactNode;
	requireSocket?: boolean;
};

export function BootstrapGate({ children, persistor, fallback, requireSocket = true }: Props) {
	const mezon = useMezon();
	const { sessionRef, createClient, connectSocket } = mezon;
	const dispatch = useAppDispatch();
	const [ready, setReady] = useState(false);
	const [retryCount, setRetryCount] = useState(0);

	useEffect(() => {
		configureSessionAuthRetry({
			getSession: () => sessionRef.current,
			refreshSession: () => refreshMezonSession(mezon)
		});

		return () => configureSessionAuthRetry(null);
	}, [mezon, sessionRef]);

	useEffect(() => {
		const INITIAL_DELAY = 1000;

		const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

		const init = async () => {
			const client = await createClient();
			if (!client) {
				setReady(true);
				return;
			}

			await waitForPersistorBootstrap(persistor);

			const isOAuthCallback = typeof window !== 'undefined' && window.location.pathname.includes('/login/callback');

			const persistedSession = readPersistedSession();
			const hasCredentials = sessionHasCredentials(persistedSession, { requireSessionId: requireSocket });

			if (!hasCredentials) {
				if (!isOAuthCallback) {
					dispatch(authActions.logOut({}));
				}
				setReady(true);
				return;
			}

			sessionRef.current = persistedSession as ApiSession;

			if (!requireSocket) {
				setReady(true);
				return;
			}

			let connectOk = false;

			await Promise.all([
				(async () => {
					for (let i = 0; i <= MAX_RETRIES; i++) {
						setRetryCount(i);

						if (i > 0) {
							const reachable = await probeNetworkReachability({
								timeoutMs: RECONNECT_NETWORK_PROBE_TIMEOUT_MS
							});
							if (!reachable) {
								console.error(`Network probe failed before bootstrap retry ${i}`);
								if (i === MAX_RETRIES) break;
								const baseDelay = INITIAL_DELAY * Math.pow(2, i);
								await delay(baseDelay + Math.random() * 500);
								continue;
							}
						}

						try {
							await connectSocket();
							connectOk = true;
							break;
						} catch (error) {
							if (i === MAX_RETRIES) break;
							const baseDelay = INITIAL_DELAY * Math.pow(2, i);
							const nextDelay = baseDelay + Math.random() * 500;
							console.error(`Connection failed. Retrying attempt ${i} in ${nextDelay}ms...`);
							await delay(nextDelay);
						}
					}
				})(),

				waitForPersistorBootstrap(persistor)
			]);

			if (!connectOk) {
				dispatch(authActions.logOut({}));
			}

			setReady(true);
		};

		init();
	}, [requireSocket]);

	return <>{ready ? children : (fallback ?? <ConnectingScreen retryCount={retryCount} requireSocket={requireSocket} />)}</>;
}

const ConnectingScreen = ({ retryCount, requireSocket }: { retryCount: number; requireSocket: boolean }) => {
	const retryDelay = Math.round(2 ** retryCount);
	const [remainingTime, setRemainingTime] = useState(0);

	useEffect(() => {
		if (retryCount === 0) {
			setRemainingTime(0);
			return;
		}

		setRemainingTime(retryDelay);

		const interval = setInterval(() => {
			setRemainingTime((prev) => {
				if (prev === 0) {
					clearInterval(interval);
					return 0;
				}
				return prev - 1;
			});
		}, 1000);

		return () => clearInterval(interval);
	}, [retryCount]);

	return (
		<div className="fixed z-[10000] bg-black w-screen text-theme-primary h-screen flex items-center justify-center">
			<div className="flex min-h-[160px] flex-col items-center justify-center">
				<div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />

				<h3 className="text-lg font-semibold text-center">{requireSocket ? 'Establishing a connection...' : 'Loading...'}</h3>

				{requireSocket && retryCount > 0 && retryCount < MAX_RETRIES && (
					<p className="mt-4 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-300 backdrop-blur-md">
						<span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
						<span>
							Connection lost — retrying attempt <span className="font-semibold text-white">{retryCount}</span> in{' '}
							<span className="font-mono text-blue-400">{remainingTime}s</span>
						</span>
					</p>
				)}
			</div>
		</div>
	);
};
