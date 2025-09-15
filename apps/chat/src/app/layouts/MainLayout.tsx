import { ChatContext, ChatContextProvider, ColorRoleProvider, useDragAndDrop, useFriends, useIdleRender } from '@mezon/core';
import {
	e2eeActions,
	gifsStickerEmojiActions,
	selectAllAccount,
	selectAnyUnreadChannel,
	selectBadgeCountAllClan,
	useAppDispatch
} from '@mezon/store';
import { MessageCrypt, UploadLimitReason } from '@mezon/utils';

import { TooManyUpload, WebRTCStreamProvider, useClanLimitModalErrorHandler } from '@mezon/components';
import { selectTotalUnreadDM, useAppSelector } from '@mezon/store';
import { MezonSuspense } from '@mezon/transport';
import { SubPanelName, electronBridge, isLinuxDesktop, isWindowsDesktop } from '@mezon/utils';
import isElectron from 'is-electron';
import { memo, useContext, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Outlet } from 'react-router-dom';
import ChannelVoice from '../pages/channel/ChannelVoice';

const GlobalEventListener = () => {
	const { handleReconnect } = useContext(ChatContext);
	const dispatch = useAppDispatch();
	useClanLimitModalErrorHandler();

	const allNotificationReplyMentionAllClan = useSelector(selectBadgeCountAllClan);

	const totalUnreadMessages = useSelector(selectTotalUnreadDM);

	const user = useAppSelector(selectAllAccount);

	const { quantityPendingRequest } = useFriends();

	const hasUnreadChannel = useAppSelector((state) => selectAnyUnreadChannel(state));
	useEffect(() => {
		let timeoutId: NodeJS.Timeout | null = null;

		const reconnectSocket = () => {
			if (timeoutId) {
				clearTimeout(timeoutId);
			}

			timeoutId = setTimeout(() => {
				if (document.visibilityState === 'visible' && !document.hidden) {
					handleReconnect('Window focus/online event, attempting to reconnect...');
				}
			}, 3000);
		};

		window.addEventListener('focus', reconnectSocket);
		window.addEventListener('online', reconnectSocket);
		document.addEventListener('visibilitychange', reconnectSocket);

		return () => {
			if (timeoutId) {
				clearTimeout(timeoutId);
			}
			window.removeEventListener('focus', reconnectSocket);
			window.removeEventListener('online', reconnectSocket);
			document.removeEventListener('visibilitychange', reconnectSocket);
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

		return (
			<div
				id="main-layout"
				className={`${isWindowsDesktop || isLinuxDesktop ? 'top-[21px] fixed' : ''} w-full bg-theme-primary`}
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
