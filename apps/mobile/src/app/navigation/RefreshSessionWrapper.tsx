import { ActionEmitEvent, load, save, STORAGE_CLAN_ID, STORAGE_QR_INVITE_CACHE, STORAGE_SESSION_KEY } from '@mezon/mobile-components';
import { authActions, channelsActions, directActions, selectHasInternetMobile, selectIsLogin, useAppDispatch } from '@mezon/store-mobile';
import { MobileEventSessionEmitter, useMezon } from '@mezon/transport';
import type { IWithError } from '@mezon/utils';
import { sleep } from '@mezon/utils';
import { Session } from 'mezon-js';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { useSelector } from 'react-redux';
import { fetchWithTimeout } from '../components/NetworkInfo';

const MAX_RETRIES_SESSION = 5;

interface SessionContextType {
	isSessionReady: boolean;
}

const SessionContext = createContext<SessionContextType>({
	isSessionReady: false
});

export const useSessionReady = () => {
	const context = useContext(SessionContext);
	if (!context) {
		throw new Error('useSessionReady must be used within RefreshSessionWrapper');
	}
	return context.isSessionReady;
};

const RefreshSessionWrapper = ({ children }) => {
	const isLoggedIn = useSelector(selectIsLogin);
	const dispatch = useAppDispatch();
	const hasInternet = useSelector(selectHasInternetMobile);
	const [isSessionReady, setIsSessionReady] = useState<boolean>(false);
	const { clientRef } = useMezon();

	const getSessionCacheKey = async () => {
		const defaultConfig = {
			host: process.env.NX_CHAT_APP_API_HOST as string,
			port: process.env.NX_CHAT_APP_API_PORT as string
		};

		try {
			const storedConfig = await load(STORAGE_SESSION_KEY);
			if (!storedConfig) return defaultConfig;

			const parsedConfig = JSON.parse(storedConfig);
			const isCustomHost = parsedConfig.host && parsedConfig.port && parsedConfig.host !== process.env.NX_CHAT_APP_API_GW_HOST;

			if (isCustomHost) {
				return parsedConfig;
			}

			return defaultConfig;
		} catch (e) {
			return defaultConfig;
		}
	};

	const refreshSessionLoader = useCallback(async () => {
		const configSession = await getSessionCacheKey();
		save(STORAGE_QR_INVITE_CACHE, null);
		if (configSession && clientRef?.current) {
			clientRef.current.setBasePath(configSession.host as string, configSession.port as string, process.env.NX_CHAT_APP_API_SECURE === 'true');
		}

		let retries = MAX_RETRIES_SESSION;
		while (retries > 0) {
			try {
				const response = await dispatch(authActions.refreshSession());
				if ((response as unknown as IWithError).error) {
					retries -= 1;
					setIsSessionReady(true);
					if (retries === 0) {
						await sleep(500);
						if (response?.payload?.status === 500) {
							const responseNetwork = await fetchWithTimeout(`${process.env.NX_CHAT_APP_REDIRECT_URI}/favicon.ico`, 8000);
							if (!responseNetwork.ok) {
								return;
							}
							DeviceEventEmitter.emit(ActionEmitEvent.ON_SHOW_POPUP_SESSION_EXPIRED);
						}
						return;
					}
					await sleep(1000 * (MAX_RETRIES_SESSION - retries));
					continue;
				}
				dispatch(directActions.fetchDirectMessage({ noCache: true }));
				const currentClanIdCached = await load(STORAGE_CLAN_ID);
				if (currentClanIdCached) dispatch(channelsActions.fetchChannels({ clanId: currentClanIdCached, noCache: true, isMobile: true }));
				setIsSessionReady(true);
				break;
			} catch (error) {
				retries -= 1;
				setIsSessionReady(true);
				if (retries === 0) {
					await sleep(500);
					return;
				}
				await sleep(1000 * (MAX_RETRIES_SESSION - retries));
			}
		}
	}, [clientRef, dispatch]);

	useEffect(() => {
		MobileEventSessionEmitter.addListener('mezon:session-refreshed', ({ session }) => {
			if (session) {
				const newSession = new Session(
					session.token,
					session.refresh_token,
					session.created || false,
					session.api_url,
					session?.id_token || '',
					session?.is_remember || false
				);
				dispatch(authActions.updateSession(newSession));
			}
		});
	}, [dispatch]);

	useEffect(() => {
		if (isLoggedIn && hasInternet) {
			refreshSessionLoader();
		} else {
			setIsSessionReady(true);
		}
	}, [isLoggedIn, hasInternet, refreshSessionLoader]);

	return <SessionContext.Provider value={{ isSessionReady }}>{children}</SessionContext.Provider>;
};

export default RefreshSessionWrapper;
