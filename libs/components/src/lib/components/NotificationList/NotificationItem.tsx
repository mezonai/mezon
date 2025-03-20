import { useAppParams, useNotification } from '@mezon/core';
import { selectMemberClanByUserId } from '@mezon/store';
import { INotification, NotificationCategory, convertTimeString } from '@mezon/utils';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { MemberProfile } from '../MemberProfile';
import UserProfileModalInner from '../UserProfileModalInner';
export type NotifyProps = {
	readonly notify: INotification;
};

function NotificationItem({ notify }: NotifyProps) {
	const { deleteNotify } = useNotification();
	const { clanId } = useAppParams();

	const [openUserProfileModalInner, setOpenUserProfileModalInner] = useState<boolean>(false);

	const user = useSelector(selectMemberClanByUserId(notify.sender_id ?? ''));
	const username = notify?.content?.username || notify?.content?.sender_name;
	let notice = notify?.subject;

	if (username) {
		const usernameLenght = username.length;
		notice = notify?.subject?.slice(usernameLenght);
	}

	const handleClickNotificationItem = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
		event.stopPropagation();
		setOpenUserProfileModalInner(true);
	};

	const handleCloseUserProfileModalInner = () => {
		setOpenUserProfileModalInner(false);
	};

	const handleDeleteNotification = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>, notificationId: string) => {
		event.stopPropagation();
		deleteNotify(notificationId, notify.category as NotificationCategory);
	};

	return (
		<>
			<div
				onClick={handleClickNotificationItem}
				className="relative flex flex-row justify-between items-center dark:hover:bg-bgSecondaryHover hover:bg-bgLightModeButton py-3 px-3 w-full cursor-pointer"
			>
				<div className="flex items-center gap-2">
					<MemberProfile
						isHideUserName={true}
						avatar={user?.user?.avatar_url || ''}
						name={user?.user?.display_name || notify?.content?.username || ''}
						isHideStatus={true}
						isHideIconStatus={true}
						textColor="#fff"
					/>
					<div className="flex flex-col gap-1">
						<div>
							<span className="font-bold">{user?.clan_nick || user?.user?.display_name || username}</span>
							<span>{notice}</span>
						</div>
						<span className="text-zinc-400 text-[11px]">{convertTimeString(notify.create_time as string)}</span>
					</div>
				</div>
				<button
					className="dark:bg-bgTertiary bg-bgLightModeButton mr-1 dark:text-contentPrimary text-colorTextLightMode rounded-full w-6 h-6 flex items-center justify-center text-[10px]"
					onClick={(event) => handleDeleteNotification(event, notify.id)}
				>
					✕
				</button>
			</div>
			{openUserProfileModalInner && (
				<UserProfileModalInner notify={notify} userId={notify.sender_id} onClose={handleCloseUserProfileModalInner} />
			)}
		</>
	);
}

export default NotificationItem;
