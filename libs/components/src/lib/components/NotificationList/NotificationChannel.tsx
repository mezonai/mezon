import { useNotification } from '@mezon/core';
import { useAppDispatch } from '@mezon/store';
import type { INotification, NotificationCategory, TNotificationChannel } from '@mezon/utils';
import { useCallback, useMemo } from 'react';
import NotificationChannelHeader from './NotificationChannelHeader';
import NotifyMentionItem from './NotifyMentionItem';

type NotificationChannelProps = {
	unreadListConverted: any[];
	isUnreadTab?: boolean;
	notification?: INotification;
};

const NotificationChannel = ({ unreadListConverted, isUnreadTab, notification }: NotificationChannelProps) => {
	const dispatch = useAppDispatch();
	const { deleteNotify } = useNotification();

	const groupedUnread = useMemo(() => {
		return unreadListConverted.reduce((acc: Record<string, TNotificationChannel>, unreadNotification) => {
			if (!acc[unreadNotification?.content?.channelId]) {
				acc[unreadNotification?.content?.channelId] = {
					channelId: unreadNotification?.content?.channelId,
					channelLabel: unreadNotification?.content?.channelLabel,
					clanLogo: unreadNotification?.content?.clanLogo,
					clan_name: unreadNotification?.content?.clan_name,
					clanId: unreadNotification?.content?.clanId,
					categoryName: unreadNotification?.content?.categoryName,
					notifications: []
				};
			}

			acc[unreadNotification?.content?.channelId].notifications.push(unreadNotification);

			return acc;
		}, {});
	}, [unreadListConverted]);

	const groupedUnreadArray = Object.values(groupedUnread);

	const handleDeleteNotification = useCallback(
		(notification: INotification) => {
			deleteNotify(notification.id, notification.category as NotificationCategory);
		},
		[deleteNotify, dispatch]
	);

	return (
		<>
			{groupedUnreadArray.length > 0 &&
				groupedUnreadArray.map((itemUnread, index) => (
					<div key={itemUnread.channelId} className="flex flex-col gap-2 py-3 px-3 w-full">
						<NotificationChannelHeader isUnreadTab={isUnreadTab} itemUnread={itemUnread} clanId={itemUnread.clanId} />
						{itemUnread.notifications.map((notification) => (
							<NotifyMentionItem isUnreadTab={false} notify={notification} key={`mention-${notification.id}-${index}`} />
						))}
					</div>
				))}

			{notification && (
				<div key={notification.content.channelId} className="flex flex-col gap-2 py-3 px-3 w-full">
					<NotificationChannelHeader
						isUnreadTab={isUnreadTab}
						notification={notification}
						clanId={notification.content.clanId}
						onDeleteNotification={() => handleDeleteNotification(notification)}
					/>
					<NotifyMentionItem isUnreadTab={false} notify={notification} key={notification.id} />
				</div>
			)}
		</>
	);
};

export default NotificationChannel;
