import {
	ChatContext,
	ChatContextProvider,
	ColorRoleProvider,
	useDragAndDrop,
	useFriends,
	useIdleRender,
	useReconnectOnForeground
} from '@mezon/core';
import {
	appActions,
	e2eeActions,
	gifsStickerEmojiActions,
	selectAllAccount,
	selectAnyUnreadChannel,
	selectBadgeCountAllClan,
	useAppDispatch
} from '@mezon/store';
import { IS_SAFARI, MessageCrypt, UploadLimitReason, electronBridge, isElectron, throttle } from '@mezon/utils';

import { TooManyUpload, WebRTCStreamProvider, useClanLimitModalErrorHandler } from '@mezon/components';
import { selectTotalUnreadDM, useAppSelector } from '@mezon/store';
import { MezonSuspense } from '@mezon/transport';
import { SubPanelName } from '@mezon/utils';

import { memo, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Outlet } from 'react-router-dom';
import ChannelVoice from '../pages/channel/ChannelVoice';
import { getMainLayoutClassName } from './desktopWindowChrome';

const RECONNECT_SETTLE_MS = 750;
const RECONNECT_FULL_REFRESH_DELAY_MS = 3000;

const GlobalEventListener = () => {
	const { handleReconnect } = useContext(ChatContext);
	const dispatch = useAppDispatch();
	useClanLimitModalErrorHandler();

	const allNotificationReplyMentionAllClan = useSelector(selectBadgeCountAllClan);

	const totalUnreadMessages = useSelector(selectTotalUnreadDM);

	const user = useAppSelector(selectAllAccount);

	const { quantityPendingRequest } = useFriends();

	const hasUnreadChannel = useAppSelector((state) => selectAnyUnreadChannel(state));

	useReconnectOnForeground({
		scheduleReconnect: handleReconnect,
		debouncedScheduleMs: 3000
	});

	const reconnectTimersRef = useRef<{ settle?: number; full?: number }>({});

	const clearReconnectTimers = useCallback(() => {
		const timers = reconnectTimersRef.current;
		if (timers.settle !== undefined) {
			window.clearTimeout(timers.settle);
			timers.settle = undefined;
		}
		if (timers.full !== undefined) {
			window.clearTimeout(timers.full);
			timers.full = undefined;
		}
	}, []);

	const handleReconnectSuccess = useMemo(
		() =>
			throttle(() => {
				clearReconnectTimers();
				reconnectTimersRef.current.settle = window.setTimeout(() => {
					reconnectTimersRef.current.settle = undefined;
					dispatch(appActions.reconnectSync());
					reconnectTimersRef.current.full = window.setTimeout(() => {
						reconnectTimersRef.current.full = undefined;
						dispatch(appActions.refreshApp({ skipReconnectWarmup: true }));
					}, RECONNECT_FULL_REFRESH_DELAY_MS);
				}, RECONNECT_SETTLE_MS);
			}, 2000),
		[dispatch, clearReconnectTimers]
	);

	useEffect(() => {
		const mainLayout = document.getElementById('main-layout');
		if (!mainLayout) return;
		if (IS_SAFARI) {
			mainLayout.classList.add('is-safari');
		}
		return () => {
			mainLayout.classList.remove('is-safari');
		};
	}, []);

	useEffect(() => {
		if (typeof window === 'undefined') return;

		window.addEventListener('mezon:socket-reconnect', handleReconnectSuccess);
		return () => {
			window.removeEventListener('mezon:socket-reconnect', handleReconnectSuccess);
			clearReconnectTimers();
		};
	}, [handleReconnectSuccess, clearReconnectTimers]);

	useEffect(() => {
		let notificationCountAllClan = 0;
		notificationCountAllClan = allNotificationReplyMentionAllClan < 0 ? 0 : allNotificationReplyMentionAllClan;
		const notificationCount = notificationCountAllClan + totalUnreadMessages + quantityPendingRequest;
		const displayCountBrowser = notificationCount > 99 ? '99+' : notificationCount.toString();

		if (isElectron()) {
			if (hasUnreadChannel && !notificationCount) {
				electronBridge?.setBadgeCount(null);
				return;
			}
			electronBridge?.setBadgeCount(notificationCount);
		} else {
			document.title = notificationCount > 0 ? `(${displayCountBrowser}) Mezon` : 'Mezon';
		}
	}, [allNotificationReplyMentionAllClan, totalUnreadMessages, quantityPendingRequest, hasUnreadChannel]);

	useEffect(() => {
		const userId = user?.user?.id;
		if (!user?.encrypt_private_key || !userId) return;
		let cancelled = false;
		MessageCrypt.checkExistingKeys(userId as string)
			.then((found) => {
				if (cancelled) return;
				if (found) {
					dispatch(e2eeActions.setHasKey(true));
				}
			})
			.catch((error) => {
				if (cancelled) return;
				console.error(error);
			});
		return () => {
			cancelled = true;
		};
	}, [dispatch, user?.encrypt_private_key, user?.user?.id]);

	useEffect(() => {
		const userId = user?.user?.id;
		if (user?.encrypt_private_key || !userId) return;
		let cancelled = false;
		MessageCrypt.checkExistingKeys(userId as string)
			.then((found) => {
				if (cancelled) return;
				if (found) {
					MessageCrypt.clearKeys(userId as string);
				}
			})
			.catch((error) => {
				if (cancelled) return;
				console.error(error);
			});
		return () => {
			cancelled = true;
		};
	}, []);

	return null;
};

const TooManyUploadWrapper = memo(
	() => {
		const { isOverUploading, setOverUploadingState, overLimitReason, limitSize } = useDragAndDrop();

		if (!isOverUploading) return null;

		return (
			<TooManyUpload
				togglePopup={() => setOverUploadingState(false, UploadLimitReason.COUNT, limitSize)}
				limitReason={overLimitReason}
				limitSize={limitSize}
			/>
		);
	},
	() => true
);

const MainLayout = memo(
	() => {
		const dispatch = useDispatch();
		const handleClickingOutside = () => {
			dispatch(gifsStickerEmojiActions.setSubPanelActive(SubPanelName.NONE));
		};
		const shouldRender = useIdleRender();

		const mainLayoutClassName = getMainLayoutClassName();

		return (
			<div
				id="main-layout"
				className={mainLayoutClassName}
				onClick={handleClickingOutside}
				onContextMenu={(event: React.MouseEvent) => {
					event.preventDefault();
				}}
			>
				{shouldRender && <ChannelVoice />}
				<Outlet />
				<GlobalEventListener />

				<TooManyUploadWrapper />
			</div>
		);
	},
	() => true
);

const MainLayoutWrapper = () => {
	return (
		<MezonSuspense>
			<ChatContextProvider>
				<WebRTCStreamProvider>
					<ColorRoleProvider>
						<MainLayout />
					</ColorRoleProvider>
				</WebRTCStreamProvider>
			</ChatContextProvider>
		</MezonSuspense>
	);
};

export default MainLayoutWrapper;
