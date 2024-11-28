import { ChatContext, ChatContextProvider, useAttachments, useFriends } from '@mezon/core';
import {
	attachmentActions,
	e2eeActions,
	gifsStickerEmojiActions,
	selectAllAccount,
	selectAnyUnreadChannel,
	selectBadgeCountAllClan,
	useAppDispatch
} from '@mezon/store';
import { MessageCrypt } from '@mezon/utils';

import { selectTotalUnreadDM, useAppSelector } from '@mezon/store-mobile';
import { MezonSuspense } from '@mezon/transport';
import { ImageWindowProps, SubPanelName, electronBridge, isLinuxDesktop, isWindowsDesktop } from '@mezon/utils';
import isElectron from 'is-electron';
import debounce from 'lodash.debounce';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import { ApiPubKey } from 'mezon-js/api.gen';
import { memo, useContext, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Outlet, useNavigate } from 'react-router-dom';

const GlobalEventListener = () => {
	const { handleReconnect } = useContext(ChatContext);
	const navigate = useNavigate();
	const dispatch = useAppDispatch();
	const { setOpenModalAttachment, setAttachment } = useAttachments();

	const allNotificationReplyMentionAllClan = useSelector(selectBadgeCountAllClan);

	const totalUnreadMessages = useSelector(selectTotalUnreadDM);

	const user = useAppSelector(selectAllAccount);

	const { quantityPendingRequest } = useFriends();

	const hasUnreadChannel = useAppSelector((state) => selectAnyUnreadChannel(state));

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

	useEffect(() => {
		if (!user?.user?.id) return;
		MessageCrypt.initializeKeys(user?.user?.id as string).then((pubkey) => {
			if (!pubkey) return;
			dispatch(e2eeActions.pushPubKey(pubkey as ApiPubKey));
		});
	}, [user?.user?.id]);

	useEffect(() => {
		if (isElectron()) {
			window.electron.send('finish-render');

			const handleSetAttachmentData = (props: ImageWindowProps) => {
				const { attachmentData, messageId, mode, attachmentUrl, currentClanId, currentChannelId, currentDmId, checkListAttachment } = props;
				const dmType = mode === ChannelStreamMode.STREAM_MODE_DM ? ChannelType.CHANNEL_TYPE_DM : ChannelType.CHANNEL_TYPE_GROUP;
				if (currentDmId) {
					navigate(`/chat/direct/message/${currentDmId}/${dmType}`);
				} else {
					navigate(`/chat/clans/${currentClanId}/channels/${currentChannelId}`);
				}

				dispatch(attachmentActions.setMode(mode));
				setOpenModalAttachment(true);
				setAttachment(attachmentUrl);
				dispatch(
					attachmentActions.setCurrentAttachment({
						id: attachmentData.message_id as string,
						uploader: attachmentData.sender_id,
						create_time: attachmentData.create_time
					})
				);

				if (((currentClanId && currentChannelId) || currentDmId) && !checkListAttachment) {
					const clanId = currentDmId ? '0' : (currentClanId as string);
					const channelId = (currentDmId as string) || (currentChannelId as string);
					dispatch(attachmentActions.fetchChannelAttachments({ clanId, channelId }));
				}

				dispatch(attachmentActions.setMessageId(messageId));
			};

			window.electron.on('set-attachment-data', (event, data) => {
				handleSetAttachmentData(data);
			});

			return () => {
				window.electron?.removeListener('set-attachment-data', handleSetAttachmentData);
			};
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
	},
	() => true
);

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
