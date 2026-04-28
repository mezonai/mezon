import { useMezon } from '@mezon/transport';
import type { ApiSession } from 'mezon-js';
import type { MutableRefObject } from 'react';
import { useEffect, useRef, useState } from 'react';
import { Provider } from 'react-redux';
import type { Store } from 'redux';
import type { Persistor } from 'redux-persist';
import { PersistGate } from 'redux-persist/integration/react';
import { authActions } from './auth/auth.slice';
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
	const connectRef = useRef(false);

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
				await client.connect(
					sessionRef.current?.session_id || session.session_id || sessionRef.current?.token || session.token || '',
					`dev-mezon-sock.nccsoft.vn:7305`,
					true,
					false
				);

				client.onrefreshsession = (session: ApiSession) => {
					store.dispatch(authActions.setSessionId(session.session_id));
					sessionRef.current = session;
				};
				connectRef.current = true;
				sessionRef.current = session;
			} catch (error) {
				connectRef.current = true;
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
				<ConnectGate connectRef={connectRef}>{children}</ConnectGate>
			</PersistGate>
		</Provider>
	);
}
interface ConnectGateProps {
	children: React.ReactNode;
	connectRef: MutableRefObject<boolean>;
}

const ConnectGate = ({ children, connectRef }: ConnectGateProps) => {
	const { clientRef } = useMezon();
	const dispatch = useAppDispatch();

	useEffect(() => {
		if (clientRef.current && connectRef.current) {
			const isOpen = clientRef.current.isOpen();

			if (!isOpen) {
				dispatch(authActions.resetSession());
				return;
			}
		}
	}, []);

	return <>{children}</>;
};
