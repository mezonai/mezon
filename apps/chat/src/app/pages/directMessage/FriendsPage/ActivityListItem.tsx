import { AvatarImage } from '@mezon/components';
import { ActivitiesEntity, selectActivityByUserId, useAppSelector } from '@mezon/store';
import { IUserItemActivity, createImgproxyUrl } from '@mezon/utils';

type ActivityProps = {
	user?: IUserItemActivity;
};

const ActivityListItem = ({ user }: ActivityProps) => {
	const activityByUserId = useAppSelector(selectActivityByUserId(user?.user?.id || ''));

	return (
		<div className="dark:border-borderDefault border-gray-300 group/list_friends">
			<div key={user?.user?.id} className="flex justify-between items-center rounded-lg">
				<ActivityItem user={user} activity={activityByUserId} />
			</div>
		</div>
	);
};

const ActivityItem = ({ user, activity }: { user?: IUserItemActivity; activity?: ActivitiesEntity }) => {
	const avatar = user?.user?.avatar_url ?? '';
	const username = user?.user?.display_name || user?.user?.username || '';
	const activityDescription = activity?.activity_description;
	const activityName = activity?.activity_name;

	return (
		<div className="w-full">
			<div className="flex items-center gap-[9px] relative dark:text-channelTextLabel text-colorTextLightMode">
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
					<p className="w-full text-[12px] line-clamp-1 break-all">{activityDescription || activityName}</p>
				</div>
			</div>
		</div>
	);
};

export default ActivityListItem;
