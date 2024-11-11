import { ChatContext, ChatContextProvider, useFriends } from '@mezon/core';
import { gifsStickerEmojiActions, reactionActions, selectAnyUnreadChannel, selectBadgeCountAllClan, selectChannelsByIds } from '@mezon/store';

import { channelsActions, ChannelsEntity, selectTotalUnreadDM, useAppSelector } from '@mezon/store-mobile';
import { MezonSuspense } from '@mezon/transport';
import { electronBridge, isLinuxDesktop, isWindowsDesktop, SubPanelName } from '@mezon/utils';
import isElectron from 'is-electron';
import debounce from 'lodash.debounce';
import { ChannelType } from 'mezon-js';
import { useContext, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Outlet, useNavigate } from 'react-router-dom';

const GlobalEventListener = () => {
	const { handleReconnect } = useContext(ChatContext);
	const navigate = useNavigate();
	const dispatch = useDispatch();

	const allNotificationReplyMentionAllClan = useSelector(selectBadgeCountAllClan);

	const totalUnreadMessages = useSelector(selectTotalUnreadDM);

	const { quantityPendingRequest } = useFriends();

	const unreadChannel = useAppSelector((state) => selectAnyUnreadChannel(state));
	console.log('unreadChannel: ', unreadChannel);

	const ids = unreadChannel.map((item) => {
		return item.id;
	});

	const getChannel = useAppSelector((state) => selectChannelsByIds(state, ids));
	console.log('getChannel: ', getChannel);

	useEffect(() => {
		getChannel.map((item) => {
			if (item.type === ChannelType.CHANNEL_TYPE_THREAD) {
				const channelWithActive = { ...item, active: 1 };
				dispatch(channelsActions.add(channelWithActive as ChannelsEntity));
			}
		});
	}, [getChannel.length]);

	const hasUnreadChannel = useMemo(() => unreadChannel.length > 0, [unreadChannel]);
	console.log('hasUnreadChannel: ', hasUnreadChannel);

	useEffect(() => {
		const handleNavigateToPath = (_: unknown, path: string) => {
			navigate(path);
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

	return null;
};

const MainLayout = () => {
	const dispatch = useDispatch();
	const handleClickingOutside = () => {
		dispatch(gifsStickerEmojiActions.setSubPanelActive(SubPanelName.NONE));
		dispatch(reactionActions.setUserReactionPanelState(false));
	};
	return (
		<div
			id="main-layout"
			className={`${isWindowsDesktop || isLinuxDesktop ? 'top-[21px] fixed' : ''} w-full`}
			onClick={handleClickingOutside}
			onContextMenu={(event: React.MouseEvent) => {
				event.preventDefault();
			}}
		>
			<Outlet />
			<GlobalEventListener />
		</div>
	);
};

const MainLayoutWrapper = () => {
	return (
		<MezonSuspense>
			<ChatContextProvider>
				<MainLayout />
			</ChatContextProvider>
		</MezonSuspense>
	);
};

export default MainLayoutWrapper;
