import { useNotification } from '@mezon/core';
import { channelMetaActions, selectClanById, selectTheme, useAppDispatch, useAppSelector } from '@mezon/store';
import { INotification, NotificationCategory, TIME_OFFSET } from '@mezon/utils';
import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import NotificationWebhookClanItem from './NotificationWebhookClanItem';

type NotificationWebhookClanProps = {
	isUnreadTab?: boolean;
	notification?: INotification;
};

export const NotificationWebhookClan = ({ isUnreadTab, notification }: NotificationWebhookClanProps) => {
	const dispatch = useAppDispatch();
	const { deleteNotify } = useNotification();

	const handleDeleteNotification = useCallback(
		(notification: INotification) => {
			const timestamp = Date.now() / 1000;
			dispatch(
				channelMetaActions.setChannelLastSeenTimestamp({
					channelId: '0',
					timestamp: timestamp + TIME_OFFSET
				})
			);
			deleteNotify(notification.id, notification.category as NotificationCategory);
		},
		[deleteNotify, dispatch]
	);

	return (
		<div>
			{notification && (
				<div key={notification.content.id} className="flex flex-col gap-2 py-3 px-3 w-full">
					<NotificationClanHeader
						isUnreadTab={isUnreadTab}
						notification={notification}
						clan_id={notification.content.clan_id}
						onDeleteNotification={() => handleDeleteNotification(notification)}
					/>
					<NotificationWebhookClanItem notify={notification} key={notification.id} />
				</div>
			)}
		</div>
	);
};

export default NotificationWebhookClan;

type NotificationClanHeaderProps = {
	notification?: INotification;
	isUnreadTab?: boolean;
	clan_id?: string;
	onDeleteNotification?: () => void;
};

const NotificationClanHeader = ({ isUnreadTab, clan_id, notification, onDeleteNotification }: NotificationClanHeaderProps) => {
	const clan = useAppSelector(selectClanById(clan_id as string));

	const appearanceTheme = useSelector(selectTheme);

	return (
		<div className="flex justify-between">
			<div className="flex flex-row items-center gap-2">
				{notification?.content?.clan_logo ? (
					<img src={notification?.content?.clan_logo} className="w-[45px] h-[45px] rounded-xl" alt={notification?.content?.clan_logo} />
				) : (
					<div>
						{clan?.clan_name && (
							<div className="w-[45px] h-[45px] bg-bgDisable flex justify-center items-center text-contentSecondary text-[20px] rounded-xl">
								{clan?.clan_name.charAt(0).toUpperCase()}
							</div>
						)}
					</div>
				)}

				<div className="flex flex-col gap-1"> {clan?.clan_name} </div>
			</div>

			<div className="flex flex-row items-center gap-3 relative">
				{isUnreadTab && (
					<button
						title="Clear"
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
