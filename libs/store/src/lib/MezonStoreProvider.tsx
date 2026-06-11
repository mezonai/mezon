import { Provider } from 'react-redux';
import type { Store } from 'redux';
import type { Persistor } from 'redux-persist';
import { PersistGate } from 'redux-persist/integration/react';
import { BootstrapGate } from './BootstrapGate';
import type { RootState, RootState as RootStateMobile } from './store';

type Props = {
	readonly children: React.ReactNode;
	readonly store: Store<RootState | RootStateMobile>;
	readonly loading: React.ReactNode;
	readonly persistor: Persistor;
	readonly requireSocket?: boolean;
};

export function MezonStoreProvider({ children, store, loading, persistor, requireSocket = true }: Props) {
	return (
		<Provider store={store}>
			<BootstrapGate persistor={persistor} requireSocket={requireSocket}>
				<PersistGate loading={loading} persistor={persistor}>
					{children}
				</PersistGate>
			</BootstrapGate>
		</Provider>
	);
}
