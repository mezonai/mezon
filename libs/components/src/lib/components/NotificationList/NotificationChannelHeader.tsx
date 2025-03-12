import { useMarkAsRead } from '@mezon/core';
import { selectChannelById, selectClanById, useAppSelector } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { INotification, TNotificationChannel } from '@mezon/utils';
import { useMemo } from 'react';

type NotificationChannelHeaderProps = {
	itemUnread?: TNotificationChannel;
	notification?: INotification;
	isUnreadTab?: boolean;
	clan_id?: string;
	onDeleteNotification?: () => void;
};

const NotificationChannelHeader = ({ itemUnread, isUnreadTab, clan_id, notification, onDeleteNotification }: NotificationChannelHeaderProps) => {
	const clan = useAppSelector(selectClanById(clan_id as string));
	const channelId = useMemo(() => {
		return itemUnread?.channel_id ? itemUnread.channel_id : '';
	}, [itemUnread?.channel_id]);

	const getChannel = useAppSelector((state) => selectChannelById(state, channelId ?? '')) || {};

	const { handleMarkAsReadChannel } = useMarkAsRead();

	return (
		<div className="flex justify-between">
			<div className="flex flex-row items-center gap-2">
				{itemUnread?.clan_logo || notification?.content?.clan_logo ? (
					<img
						src={itemUnread?.clan_logo || notification?.content?.clan_logo}
						className="w-[45px] h-[45px] rounded-xl"
						alt={itemUnread?.clan_logo || notification?.content?.clan_logo}
					/>
				) : (
					<>
						{clan?.clan_name && (
							<div className="w-[45px] h-[45px] bg-bgDisable flex justify-center items-center text-contentSecondary text-[20px] rounded-xl">
								{clan?.clan_name.charAt(0).toUpperCase()}
							</div>
						)}
					</>
				)}

				<div className="flex flex-col gap-1">
					<div className="font-bold text-[16px] cursor-pointer flex gap-x-1">
						# <p className=" hover:underline">{itemUnread?.channel_label || notification?.content?.channel_label}</p>
					</div>
					<div className="text-[10px] uppercase">
						{clan?.clan_name} {'>'} {itemUnread?.category_name || notification?.content?.category_name}
					</div>
				</div>
			</div>

			<div className="flex flex-row items-center gap-3 relative">
				{isUnreadTab ? (
					<>
						<button
							title="Notification Settings"
							className="dark:bg-bgTertiary bg-bgLightModeButton mr-1 dark:text-contentPrimary text-colorTextLightMode rounded-full w-6 h-6 flex items-center justify-center text-[10px]"
						>
							<Icons.UnMuteBell defaultSize="w-4 h-4" />
						</button>

						<button
							title="Mark as read"
							className="dark:bg-bgTertiary bg-bgLightModeButton mr-1 dark:text-contentPrimary text-colorTextLightMode rounded-full w-6 h-6 flex items-center justify-center text-[10px]"
							onClick={() => handleMarkAsReadChannel(getChannel)}
						>
							✔
						</button>
					</>
				) : (
					<button
						title="Close"
						className="dark:bg-bgTertiary bg-bgLightModeButton mr-1 dark:text-contentPrimary text-colorTextLightMode rounded-full w-6 h-6 flex items-center justify-center text-[10px]"
						onClick={onDeleteNotification}
					>
						✕
					</button>
				)}
			</div>
		</div>
	);
};

export default NotificationChannelHeader;
