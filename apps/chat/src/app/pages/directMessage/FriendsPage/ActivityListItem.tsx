import { AvatarImage } from '@mezon/components';
import { useAppNavigation, useDirect } from '@mezon/core';
import type { ActivitiesEntity } from '@mezon/store';
import { selectActivityByUserId, useAppSelector } from '@mezon/store';
import type { IUserProfileActivity } from '@mezon/utils';
import { createImgproxyUrl } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import { useCallback } from 'react';

type ActivityProps = {
	user?: IUserProfileActivity;
};

const ActivityListItem = ({ user }: ActivityProps) => {
	const activityByUserId = useAppSelector((state) => selectActivityByUserId(state, user?.id || ''));
	const { createDirectMessageWithUser } = useDirect();
	const { toDmGroupPageFromFriendPage, navigate } = useAppNavigation();

	const handleClick = useCallback(async () => {
		if (!user?.id) return;
		const name = user.display_name || user.username;
		const res = await createDirectMessageWithUser(user.id, name, user.username, user.avatar_url);
		if (res.channel_id) {
			navigate(toDmGroupPageFromFriendPage(res.channel_id, ChannelType.CHANNEL_TYPE_DM));
		}
	}, [createDirectMessageWithUser, navigate, toDmGroupPageFromFriendPage, user]);

	return (
		<div className="border-color-primary group/list_friends">
			<div
				key={user?.id}
				onClick={handleClick}
				className="flex w-full cursor-pointer justify-between items-center rounded-lg hover:bg-item-hover"
			>
				<ActivityItem user={user} activity={activityByUserId} />
			</div>
		</div>
	);
};

const ActivityItem = ({ user, activity }: { user?: IUserProfileActivity; activity?: ActivitiesEntity }) => {
	const avatar = user?.avatar_url ?? '';
	const username = user?.display_name || user?.username || '';
	const activityDescription = activity?.activity_description;
	const activityName = activity?.activity_name;

	return (
		<div className="w-full text-theme-primary">
			<div className="flex items-center gap-[9px] relative ">
				<div className="relative">
					<AvatarImage
						alt={username}
						username={username}
						className="min-w-8 min-h-8 max-w-8 max-h-8"
						classNameText="font-semibold"
						srcImgProxy={createImgproxyUrl(avatar ?? '')}
						src={avatar}
					/>
				</div>

				<div className="flex flex-col font-medium flex-1">
					<span className="text-base font-medium">{username}</span>
					<p className="w-full text-[12px] opacity-60 line-clamp-1 break-all">{activityDescription || activityName}</p>
				</div>
			</div>
		</div>
	);
};

export default ActivityListItem;
