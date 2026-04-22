import { useMezon } from '@mezon/transport';
import type { ApiSession } from 'mezon-js';
import { useEffect, useState } from 'react';
import { Provider, useSelector } from 'react-redux';
import type { Store } from 'redux';
import type { Persistor } from 'redux-persist';
import { PersistGate } from 'redux-persist/integration/react';
import { authActions, selectSession } from './auth/auth.slice';
import { useAppDispatch, type RootState, type RootState as RootStateMobile } from './store';

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
			const session = currentState.auth.session;
			const client = await createClient();
			try {
				if (!session || !client) {
					setConnect(true);
					return;
				}
				await client.connect(sessionRef.current?.session_id || session.token, `dev-mezon-sock.nccsoft.vn:7305`, true, true);

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
				<ConnectGate>{children}</ConnectGate>
			</PersistGate>
		</Provider>
	);
}
interface ConnectGateProps {
	children: React.ReactNode;
}

const ConnectGate = ({ children }: ConnectGateProps) => {
	const { clientRef } = useMezon();
	const dispatch = useAppDispatch();
	const session = useSelector(selectSession);
	const [passGate, setPassGate] = useState(false);

	useEffect(() => {
		if (clientRef.current && session) {
			const isOpen = clientRef.current.isOpen();

			if (!isOpen) {
				dispatch(authActions.logOut({}));
				window.location.href = '/login';
				return;
			}
		}
		setPassGate(true);
	}, [clientRef, dispatch]);

	if (!passGate) {
		return null;
	}

	return <>{children}</>;
};
