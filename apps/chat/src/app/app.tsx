import {
	MezonStoreProvider,
	appActions,
	attachmentActions,
	getStore,
	initStore,
	selectAllListAttachmentByChannel,
	selectAttachmentPaginationByChannel,
	selectCurrentChannelId,
	selectCurrentClanId,
	selectCurrentLanguage,
	selectIsActivityTrackingEnabled,
	selectIsLogin,
	setIsElectronDownloading,
	setIsElectronUpdateAvailable
} from '@mezon/store';
import i18n from '@mezon/translations';
import { MezonContextProvider, clearSessionFromStorage, clearSessionRefreshFromStorage, getMezonConfig, useMezon } from '@mezon/transport';

import { PopupManagerProvider } from '@mezon/components';
import { PermissionProvider, getCurrentChatData, useActivities, useSettingFooter } from '@mezon/core';
import { captureSentryError } from '@mezon/logger';
import {
	ACTIVE_WINDOW,
	DOWNLOAD_PROGRESS,
	ETypeLinkMedia,
	LOCK_SCREEN,
	TRIGGER_SHORTCUT,
	UNLOCK_SCREEN,
	UPDATE_ACTIVITY_TRACKING,
	UPDATE_AVAILABLE,
	UPDATE_ERROR,
	electronBridge,
	getAttachmentDataForWindow
} from '@mezon/utils';
import isElectron from 'is-electron';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import 'react-contexify/ReactContexify.css';
import { I18nextProvider, useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import 'react-toastify/dist/ReactToastify.css';

import { preloadedState } from './mock/state';
import { Routes } from './routes';

import { ThemeManager } from '@mezon/themes';

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
		if (detectedLang && (detectedLang === 'vi' || detectedLang === 'en') && detectedLang !== currentLanguage) {
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
	const isLogin = useSelector(selectIsLogin);
	const isActivityTrackingEnabled = useSelector(selectIsActivityTrackingEnabled);
	const dispatch = useDispatch();
	const { setIsShowSettingFooterStatus } = useSettingFooter();
	const { setUserActivity, setUserAFK } = useActivities();

	const { clientRef } = useMezon();
	if (clientRef?.current?.setBasePath) {
		if (!isLogin) {
			clearSessionFromStorage();
			clearSessionRefreshFromStorage();
			clientRef.current.setBasePath(
				process.env.NX_CHAT_APP_API_GW_HOST as string,
				process.env.NX_CHAT_APP_API_GW_PORT as string,
				process.env.NX_CHAT_APP_API_SECURE === 'true'
			);
		} else {
			const config = getMezonConfig();
			if (config) {
				clientRef.current.setBasePath(config.host, config.port, config.ssl);
			}
		}
	}

	useEffect(() => {
		if (!isElectron()) {
			return;
		}

		const handleLoadMoreFromElectron = async (_event: unknown, { direction }: { direction: 'before' | 'after' }) => {
			try {
				const state = getStore()?.getState();
				if (!state) return;

				const currentChannelId = selectCurrentChannelId(state);
				const currentClanId = selectCurrentClanId(state);
				const currentAttachments = selectAllListAttachmentByChannel(state, currentChannelId as string);
				const paginationState = selectAttachmentPaginationByChannel(state, currentChannelId as string);

				if (!currentChannelId || paginationState.isLoading) {
					return;
				}

				if (direction === 'before' && !paginationState.hasMoreBefore) {
					return;
				}
				if (direction === 'after' && !paginationState.hasMoreAfter) {
					return;
				}

				const timestamp =
					direction === 'before' ? currentAttachments?.[currentAttachments.length - 1]?.create_time : currentAttachments?.[0]?.create_time;
				const timestampNumber = timestamp ? Math.floor(new Date(timestamp).getTime() / 1000) : undefined;

				const clanId = currentClanId === '0' ? '0' : currentClanId;

				let beforeParam: number | undefined;
				let afterParam: number | undefined;

				if (direction === 'before') {
					beforeParam = timestampNumber;
				} else {
					afterParam = timestampNumber;
				}

				dispatch(attachmentActions.setAttachmentLoading({ channelId: currentChannelId, isLoading: true }));

				try {
					await dispatch(
						attachmentActions.fetchChannelAttachments({
							clanId: clanId as string,
							channelId: currentChannelId,
							limit: paginationState.limit,
							direction,
							...(beforeParam && { before: beforeParam }),
							...(afterParam && { after: afterParam })
						}) as any
					);
				} catch (error) {
					console.error('Error fetching attachments:', error);
					dispatch(attachmentActions.setAttachmentLoading({ channelId: currentChannelId, isLoading: false }));
					return;
				}

				const updatedState = getStore()?.getState();
				if (!updatedState) return;

				const updatedAttachments = selectAllListAttachmentByChannel(updatedState, currentChannelId);
				const updatedPagination = selectAttachmentPaginationByChannel(updatedState, currentChannelId);
				const currentChatUsersEntities = getCurrentChatData()?.currentChatUsersEntities;

				const imageAttachments = updatedAttachments
					?.filter((att) => att?.filetype?.startsWith(ETypeLinkMedia.IMAGE_PREFIX))
					.map((att) => ({
						...att,
						id: att.id || '',
						channelId: currentChannelId,
						clanId: clanId || ''
					}));

				if (imageAttachments && currentChatUsersEntities) {
					const attachmentsWithUploaderData = getAttachmentDataForWindow(imageAttachments as any, currentChatUsersEntities);
					window.electron?.send('APP::UPDATE_ATTACHMENTS', {
						attachments: attachmentsWithUploaderData,
						hasMoreBefore: updatedPagination.hasMoreBefore,
						hasMoreAfter: updatedPagination.hasMoreAfter
					});
				}
			} catch (error) {
				console.error('Error loading more attachments from app.tsx:', error);
			}
		};

		window.electron.on('APP::LOAD_MORE_ATTACHMENTS', handleLoadMoreFromElectron);

		return () => {
			if (window.electron?.removeListener) {
				window.electron.removeListener('APP::LOAD_MORE_ATTACHMENTS', handleLoadMoreFromElectron);
			}
		};
	}, [dispatch]);

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
				},
				[LOCK_SCREEN]: () => {
					setUserAFK(1);
				},
				[UNLOCK_SCREEN]: () => {
					setUserAFK(0);
				}
			});
		} else {
			electronBridge?.removeAllListeners();
		}
	}

	useEffect(() => {
		isElectron() && isLogin && electronBridge.invoke('APP::CHECK_UPDATE');
	}, [isLogin]);

	useEffect(() => {
		if (isElectron() && typeof window !== 'undefined' && window.electron) {
			try {
				window.electron.send(UPDATE_ACTIVITY_TRACKING, { isActivityTrackingEnabled });
			} catch (error) {
				console.error('Failed to sync activity tracking state with electron:', error);
			}
		}
	}, [isActivityTrackingEnabled]);

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
			<MezonContextProvider mezon={mezon} connect={true}>
				<App />
			</MezonContextProvider>
		</I18nextProvider>
	);
}

export default AppWrapper;
