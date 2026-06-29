import { initAdminStore } from '@mezon/store';
import i18n from '@mezon/translations';
import type { CreateMezonClientOptions } from '@mezon/transport';
import { MezonAdminContextProvider, useAdminMezon } from '@mezon/transport';
import { useMemo } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import 'react-toastify/dist/ReactToastify.css';
import { PersistGate } from 'redux-persist/integration/react';
import './app.module.scss';
import AdminGate from './context/AdminGate';
import { Routes } from './routes';

const mezon: CreateMezonClientOptions = {
	host: process.env.NX_CHAT_APP_API_HOST as string,
	port: process.env.NX_CHAT_APP_API_PORT as string,
	key: process.env.NX_CHAT_APP_API_KEY as string,
	ssl: process.env.NX_CHAT_APP_API_SECURE === 'true'
};
export function App() {
	const mezon = useAdminMezon();
	const { store, persistor } = useMemo(() => {
		return initAdminStore(mezon);
	}, [mezon]);

	if (!store) {
		return <>loading...</>;
	}

	return (
		<I18nextProvider i18n={i18n}>
			<Provider store={store}>
				<PersistGate persistor={persistor}>
					<AdminGate>
						<Routes />
					</AdminGate>
				</PersistGate>
			</Provider>
		</I18nextProvider>
	);
}

function AppWrapper() {
	return (
		<MezonAdminContextProvider mezon={mezon}>
			<App />
		</MezonAdminContextProvider>
	);
}

export default AppWrapper;
