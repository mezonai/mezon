import { appActions, initStore, MezonStoreProvider, selectCurrentLanguage } from '@mezon/store';
import i18n from '@mezon/translations';
import { getMezonConfig, MezonContextProvider, useMezon } from '@mezon/transport';

import { PopupManagerProvider } from '@mezon/components';
import { PermissionProvider } from '@mezon/core';
import { createContext, Suspense, useContext, useEffect, useMemo, useState } from 'react';
import 'react-contexify/ReactContexify.css';
import { I18nextProvider, useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import 'react-toastify/dist/ReactToastify.css';

import { preloadedState } from './mock/state';
import { Routes } from './routes';

import { ThemeManager } from '@mezon/themes';

void import('livekit-client').then(({ LogLevel, setLogLevel }) => {
	setLogLevel(LogLevel.silent);
});

ThemeManager.initializeTheme();

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

const LanguageSyncProvider = () => {
	const currentLanguage = useSelector(selectCurrentLanguage);
	const { i18n } = useTranslation();
	const dispatch = useDispatch();

	useEffect(() => {
		const detectedLang = i18n.language;
		if (detectedLang && detectedLang !== currentLanguage) {
			dispatch(appActions.setLanguage(detectedLang));
		}
	}, []);

	useEffect(() => {
		if (currentLanguage && i18n.language !== currentLanguage) {
			i18n.changeLanguage(currentLanguage);
		}
	}, [currentLanguage]);

	return null;
};

const AppInitializer = () => {
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

	const loadingContextValue = useMemo(() => ({ isLoading, setIsLoading, suspenseLoading, setSuspenseLoading }), [isLoading, suspenseLoading]);

	if (!store) {
		return <LoadingFallbackWrapper />;
	}

	const showLoading = isLoading || suspenseLoading;

	return (
		<LoadingContext.Provider value={loadingContextValue}>
			{showLoading && <LoadingFallbackWrapper />}
			<MezonStoreProvider store={store} loading={null} persistor={persistor}>
				<LanguageSyncProvider />
				<PopupManagerProvider>
					<PermissionProvider>
						<AppInitializer />
						<Routes />
					</PermissionProvider>
				</PopupManagerProvider>
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
		<I18nextProvider i18n={i18n}>
			<Suspense fallback={<LoadingFallbackWrapper />}>
				<MezonContextProvider mezon={mezon} connect={true}>
					<App />
				</MezonContextProvider>
			</Suspense>
		</I18nextProvider>
	);
}

export default AppWrapper;
