import { initStore, MezonStoreProvider } from '@mezon/store';
import { CreateMezonClientOptions, MezonContextProvider, useMezon } from '@mezon/transport';
import { useMemo } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';
import './app.module.scss';
import AppLayout from './layouts/AppLayout';
import RootLayout from './layouts/RootLayout';
import ApplicationsPage from './pages/applications';
import EmbedsPage from './pages/embeds';
import TeamsPage from './pages/teams';
import { Routes } from './routes';

const mezon: CreateMezonClientOptions = {
	host: process.env.NX_CHAT_APP_API_HOST as string,
	port: process.env.NX_CHAT_APP_API_PORT as string,
	key: process.env.NX_CHAT_APP_API_KEY as string,
	ssl: process.env.NX_CHAT_APP_API_SECURE === 'true'
};

const AppInitializer = () => {
	return null;
};

export function App() {
	createBrowserRouter([
		{
			path: '/developers',
			element: <AppLayout />,
			children: [
				{
					path: '',
					element: <RootLayout />,
					children: [
						{
							path: '',
							element: <ApplicationsPage />
						},
						{
							path: 'teams',
							element: <TeamsPage />
						},
						{
							path: 'embeds',
							element: <EmbedsPage />
						}
					]
				}
			]
		}
	]);

	const mezon = useMezon();
	const { store, persistor } = useMemo(() => {
		return initStore(mezon);
	}, [mezon]);

	if (!store) {
		return <>loading...</>;
	}

	return (
		<MezonStoreProvider store={store} loading={null} persistor={persistor}>
			<AppInitializer />
			<Routes />
		</MezonStoreProvider>
	);
}

function AppWrapper() {
	return (
		<MezonContextProvider mezon={mezon} connect={true}>
			<App />
		</MezonContextProvider>
	);
}

export default AppWrapper;
