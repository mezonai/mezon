import { useMezon } from '@mezon/transport';
import type { ISession } from 'mezon-js';
import { useEffect } from 'react';
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
	const { clientRef, sessionRef } = useMezon();

	// Nên dùng useEffect để theo dõi khi nào clientRef hoặc store có dữ liệu
	useEffect(() => {
		const initConnection = async () => {
			// Lấy state mới nhất bên trong effect
			const currentState = store.getState();
			const key = currentState.auth.activeAccount;
			const session = key ? currentState.auth.session?.[key] : null;
			if (!session || !clientRef.current) return;
			console.log('${session.ws_url}:${clientRef.current.port}: ', `${session.ws_url}`);

			try {
				console.log('Establishing connection...');
				const result = await clientRef.current.connect(
					'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiI5ZjQ0NzRmYS05MWEwLTRkOTQtODE2My0wMDViYTEwMDFiNzQiLCJ1aWQiOjE4MDU0MTU1MjUxMTk5NTQ5NDQsInVzbiI6ImFuaC50cmFudHJ1b25nIiwiZXhwIjoxNzc2NzQwNjg1fQ.1l7nWkPdppsCwi6xpR0agvxQnvBfRDBo-oPfhkohX5g","refresh_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiI5ZjQ0NzRmYS05MWEwLTRkOTQtODE2My0wMDViYTEwMDFiNzQiLCJ1aWQiOjE4MDU0MTU1MjUxMTk5NTQ5NDQsInVzbiI6ImFuaC50cmFudHJ1b25nIiwiZXhwIjoxNzc3MzQ0ODg1fQ.FI0AufpaYSh5haCHJRozoSUKHs7b5A0YsZjPkPPv4X4',
					`dev-mezon-sock.nccsoft.vn:7305`,
					true,
					true
				);
				console.log('Connection result: ', result);
				sessionRef.current = session as ISession;
			} catch (error) {
				console.error('AppInitializer: Connection failed', error);
			}
		};

		initConnection();

		// Thêm các dependencies cần thiết để nếu lần đầu chưa có (do PersistGate đang load)
		// thì khi có dữ liệu nó sẽ chạy lại.
	}, [clientRef.current, store]);

	return (
		<Provider store={store}>
			<PersistGate loading={loading} persistor={persistor}>
				{children}
			</PersistGate>
		</Provider>
	);
}
