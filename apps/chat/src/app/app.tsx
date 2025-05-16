import { MezonStoreProvider, initStore, selectIsLogin, setIsElectronDownloading, setIsElectronUpdateAvailable } from '@mezon/store';
import { CreateMezonClientOptions, MezonContextProvider, useMezon } from '@mezon/transport';

import { PermissionProvider, useActivities, useSettingFooter } from '@mezon/core';
import { captureSentryError } from '@mezon/logger';
import { ACTIVE_WINDOW, DOWNLOAD_PROGRESS, TRIGGER_SHORTCUT, UPDATE_AVAILABLE, UPDATE_ERROR, electronBridge } from '@mezon/utils';
import isElectron from 'is-electron';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import 'react-contexify/ReactContexify.css';
import { useDispatch, useSelector } from 'react-redux';
import 'react-toastify/dist/ReactToastify.css';

import { preloadedState } from './mock/state';
import { Routes } from './routes';

const getMezonConfig = (): CreateMezonClientOptions => {
	try {
		const storedConfig = localStorage.getItem('mezon_session');
		if (storedConfig) {
			const parsedConfig = JSON.parse(storedConfig);
			if (parsedConfig.host) {
				parsedConfig.port = parsedConfig.port || (process.env.NX_CHAT_APP_API_PORT as string);
				parsedConfig.key = process.env.NX_CHAT_APP_API_KEY as string;
				return parsedConfig;
			}
		}
	} catch (error) {
		console.error('Failed to get Mezon config from localStorage:', error);
	}

	return {
		host: process.env.NX_CHAT_APP_API_GW_HOST as string,
		port: process.env.NX_CHAT_APP_API_GW_PORT as string,
		key: process.env.NX_CHAT_APP_API_KEY as string,
		ssl: process.env.NX_CHAT_APP_API_SECURE === 'true'
	};
};

const mezon = getMezonConfig();

export const LoadingFallbackWrapper = () => <LoadingFallback />;

const LoadingFallback = () => {
	return (
		<div className="splash-screen">
			<div>Loading ...</div>
		</div>
	);
};

export const LoadingContext = createContext<{
	isLoading: boolean;
	setIsLoading: (value: boolean) => void;
	suspenseLoading?: boolean;
	setSuspenseLoading?: (value: boolean) => void;
}>({
	isLoading: false,
	setIsLoading: () => {
		/* empty */
	}
});

export const useLoading = () => useContext(LoadingContext);

const AppInitializer = () => {
	const isLogin = useSelector(selectIsLogin);
	const dispatch = useDispatch();
	const { setIsShowSettingFooterStatus } = useSettingFooter();
	const { setUserActivity } = useActivities();

	useEffect(() => {
		if (isElectron() && isLogin) {
			const handleNotificationClick = (_: any, data: any) => {
				if (data?.link) {
					const notificationUrl = new URL(data.link);
					const path = notificationUrl.pathname;
					const fromTopic = data.msg?.extras?.topicId && data.msg?.extras?.topicId !== '0';
					window.dispatchEvent(
						new CustomEvent('mezon:navigate', {
							detail: { url: path, msg: fromTopic ? data.msg : null }
						})
					);
				}
			};
			window.electron.on('APP::NOTIFICATION_CLICKED', handleNotificationClick);
			return () => {
				window.electron.removeListener('APP::NOTIFICATION_CLICKED', handleNotificationClick);
			};
		}
	}, [isLogin]);

	if (isElectron()) {
		if (isLogin) {
			electronBridge?.initListeners({
				[TRIGGER_SHORTCUT]: () => {
					setIsShowSettingFooterStatus(true);
				},
				[ACTIVE_WINDOW]: (activitiesInfo) => {
					setUserActivity(activitiesInfo);
				},
				[UPDATE_AVAILABLE]: () => {
					dispatch(setIsElectronDownloading(false));
					dispatch(setIsElectronUpdateAvailable(true));
				},
				[DOWNLOAD_PROGRESS]: (progressObj) => {
					let status = true;
					if (progressObj?.transferred) {
						status = progressObj?.transferred < progressObj?.total;
					}
					dispatch(setIsElectronDownloading(status));
				},
				[UPDATE_ERROR]: (error) => {
					console.error(error);
					captureSentryError(error, 'electron/update');
				}
			});
		} else {
			electronBridge?.removeAllListeners();
		}
	}

	useEffect(() => {
		isElectron() && isLogin && electronBridge.invoke('APP::CHECK_UPDATE');
	}, [isLogin]);

	return null;
};

export function App() {
	const mezon = useMezon();

	const [isLoading, setIsLoading] = useState(true);
	const [suspenseLoading, setSuspenseLoading] = useState(false);

	const { store, persistor } = useMemo(() => {
		if (!mezon) {
			return { store: null, persistor: null };
		}

		return initStore(mezon, preloadedState);
	}, [mezon]);

	if (!store) {
		return <LoadingFallbackWrapper />;
	}

	const showLoading = isLoading || suspenseLoading;

	return (
		<LoadingContext.Provider
			value={{
				isLoading,
				setIsLoading,
				suspenseLoading,
				setSuspenseLoading
			}}
		>
			{showLoading && <LoadingFallbackWrapper />}
			<MezonStoreProvider store={store} loading={null} persistor={persistor}>
				<PermissionProvider>
					<AppInitializer />
					<Routes />
				</PermissionProvider>
			</MezonStoreProvider>
		</LoadingContext.Provider>
	);
}

function AppWrapper() {
	useEffect(() => {
		const splashScreen = document.getElementById('splash-screen');
		if (splashScreen) {
			splashScreen.style.display = 'none';
		}
	}, []);

	return (
		<MezonContextProvider mezon={mezon} connect={true}>
			<App />
		</MezonContextProvider>
	);
}

export default AppWrapper;
