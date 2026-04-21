import { useMezon } from '@mezon/transport';
import type { ApiSession } from 'mezon-js';
import { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import type { Store } from 'redux';
import type { Persistor } from 'redux-persist';
import { PersistGate } from 'redux-persist/integration/react';
import type { RootState, RootState as RootStateMobile } from './store';

type Props = {
	readonly children: React.ReactNode;
	readonly store: Store<RootState | RootStateMobile>;
	readonly loading: React.ReactNode;
	readonly persistor: Persistor;
};

export function MezonStoreProvider({ children, store, loading, persistor }: Props) {
	const { sessionRef, createClient } = useMezon();
	const [connect, setConnect] = useState(false);

	useEffect(() => {
		const initConnection = async () => {
			const currentState = store.getState();
			const key = currentState.auth.activeAccount;
			const session = key ? currentState.auth.session?.[key] : null;
			const client = await createClient();
			try {
				if (!session || !client) {
					setConnect(true);
					return;
				}
				await client.connect(sessionRef.current?.token || session.token, `dev-mezon-sock.nccsoft.vn:7305`, true, true);
				client.onerror = (error) => {
					console.error('WebSocket Error Detail:', error);
				};

				client.onrefreshsession = (session: ApiSession) => {
					sessionRef.current = session;
				};

				sessionRef.current = session;
			} catch (error) {
				console.error('AppInitializer: Connection failed', error);
			}
			setConnect(true);
		};

		initConnection();
	}, []);

	if (!connect) return null;
	return (
		<Provider store={store}>
			<PersistGate loading={loading} persistor={persistor}>
				{children}
			</PersistGate>
		</Provider>
	);
}
