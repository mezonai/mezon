import { ChatContext, ChatContextProvider, useCustomNavigate, useFriends, useIdleRender } from '@mezon/core';
import {
	e2eeActions,
	gifsStickerEmojiActions,
	handleTopicNotification,
	selectAllAccount,
	selectAnyUnreadChannel,
	selectBadgeCountAllClan,
	useAppDispatch
} from '@mezon/store';
import { MessageCrypt } from '@mezon/utils';

import { WebRTCStreamProvider } from '@mezon/components';
import { selectTotalUnreadDM, useAppSelector } from '@mezon/store-mobile';
import { MezonSuspense } from '@mezon/transport';
import { SubPanelName, electronBridge, isLinuxDesktop, isWindowsDesktop } from '@mezon/utils';
import isElectron from 'is-electron';
import debounce from 'lodash.debounce';
import { memo, useContext, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Outlet } from 'react-router-dom';
import ChannelVoice from '../pages/channel/ChannelVoice';

const GlobalEventListener = () => {
	const { handleReconnect } = useContext(ChatContext);
	const navigate = useCustomNavigate();
	const dispatch = useAppDispatch();

	const allNotificationReplyMentionAllClan = useSelector(selectBadgeCountAllClan);

	const totalUnreadMessages = useSelector(selectTotalUnreadDM);

	const user = useAppSelector(selectAllAccount);

	const { quantityPendingRequest } = useFriends();

	const hasUnreadChannel = useAppSelector((state) => selectAnyUnreadChannel(state));

	useEffect(() => {
		const handleNavigateToPath = (_: unknown, notifi: any) => {
			navigate(notifi.path);
			dispatch(handleTopicNotification({ msg: notifi.msg }));
		};
		window.electron?.on('navigate-to-path', handleNavigateToPath);
		return () => {
			window.electron?.removeListener('navigate-to-path', handleNavigateToPath);
		};
	}, [navigate]);

	useEffect(() => {
		const reconnectSocket = debounce(() => {
			if (document.visibilityState === 'visible') {
				handleReconnect('Socket disconnected event, attempting to reconnect...');
			}
		}, 100);

		window.addEventListener('focus', reconnectSocket);
		window.addEventListener('online', reconnectSocket);
		return () => {
			window.removeEventListener('focus', reconnectSocket);
			window.removeEventListener('online', reconnectSocket);
		};
	}, [handleReconnect]);

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
		if (user?.encrypt_private_key) {
			MessageCrypt.checkExistingKeys(user?.user?.id as string)
				.then((found) => {
					if (found) {
						dispatch(e2eeActions.setHasKey(true));
					}
				})
				.catch((error) => {
					console.error(error);
				});
		}
	}, [dispatch, user?.encrypt_private_key, user?.user?.id]);

	useEffect(() => {
		if (!user?.encrypt_private_key) {
			MessageCrypt.checkExistingKeys(user?.user?.id as string)
				.then((found) => {
					if (found) {
						MessageCrypt.clearKeys(user?.user?.id as string);
					}
				})
				.catch((error) => {
					console.error(error);
				});
		}
	}, []);

	return null;
};

const MainLayout = memo(
	() => {
		const dispatch = useDispatch();
		const handleClickingOutside = () => {
			dispatch(gifsStickerEmojiActions.setSubPanelActive(SubPanelName.NONE));
		};
		const shouldRender = useIdleRender();

		return (
			<div
				id="main-layout"
				className={`${isWindowsDesktop || isLinuxDesktop ? 'top-[21px] fixed' : ''} w-full`}
				onClick={handleClickingOutside}
				onContextMenu={(event: React.MouseEvent) => {
					event.preventDefault();
				}}
			>
				{shouldRender && <ChannelVoice />}
				<Outlet />
				<GlobalEventListener />
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
					<MainLayout />
				</WebRTCStreamProvider>
			</ChatContextProvider>
		</MezonSuspense>
	);
};

export default MainLayoutWrapper;
