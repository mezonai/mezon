import { MezonStoreProvider, initStore, selectIsLogin, setIsElectronDownloading, setIsElectronUpdateAvailable } from '@mezon/store';
import { CreateMezonClientOptions, MezonContextProvider, useMezon } from '@mezon/transport';

import { useActivities, useSettingFooter } from '@mezon/core';
import { captureSentryError } from '@mezon/logger';
import { ACTIVE_WINDOW, DOWNLOAD_PROGRESS, TRIGGER_SHORTCUT, UPDATE_AVAILABLE, UPDATE_ERROR, electronBridge } from '@mezon/utils';
import isElectron from 'is-electron';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import 'react-toastify/dist/ReactToastify.css';
import { preloadedState } from './mock/state';
import { Routes } from './routes';

const mezon: CreateMezonClientOptions = {
	host: process.env.NX_CHAT_APP_API_HOST as string,
	port: process.env.NX_CHAT_APP_API_PORT as string,
	key: process.env.NX_CHAT_APP_API_KEY as string,
	ssl: process.env.NX_CHAT_APP_API_SECURE === 'true'
};

export const LoadingFallbackWrapper = () => <LoadingFallback />;

const LoadingFallback = () => {
	return (
		<div className="splash-screen">
			<div>
				<svg width={40} height={40} xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="69.96 139.03 468.28 466.17">
					<style type="text/css">
						{`.st0{fill:#CC1FC9;}
        .st1{fill:#E399C3;}`}
					</style>
					<path
						className="st0"
						d="M83.98,377.69c1.1-125.83,100.99-226.95,227.46-226.72c125.68,0.22,226.91,99.47,226.8,227.02  c-0.11,129.55-102.46,227.5-227.15,227.21C182.57,604.89,85.03,503.08,83.98,377.69z M312.48,187.09  c-106.14-1.2-191.04,85.07-191.39,189.54c-0.36,105.8,86.56,190.6,190.4,190.77c101.54,0.16,192.19-83.84,190.1-194.44  C499.7,272.54,416.77,186.76,312.48,187.09z"
					/>
					<path
						className="st1"
						d="M347.42,147.98c-82.52-11.58-154.52,9.75-210.71,72.12c-56.15,62.33-70.24,136.08-49.81,217  c-26.16-56.54-24.97-141.21,24.48-209.03C162.47,158.02,254.29,120.74,347.42,147.98z"
					/>
				</svg>
			</div>
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
				<AppInitializer />
				<Routes />
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
