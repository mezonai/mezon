import { AvatarImage } from '@mezon/components';
import type { ActivitiesEntity } from '@mezon/store';
import { selectActivityByUserId, useAppSelector } from '@mezon/store';
import type { IUserProfileActivity } from '@mezon/utils';
import { ActivitiesType, createImgproxyUrl } from '@mezon/utils';
import { useTranslation } from 'react-i18next';

type ActivityProps = {
	user?: IUserProfileActivity;
};

const activityStatusKeys: Record<number, string> = {
	[ActivitiesType.VISUAL_STUDIO_CODE]: 'activity.codingStatus',
	[ActivitiesType.SPOTIFY]: 'activity.musicStatus',
	[ActivitiesType.LOL]: 'activity.gamingStatus'
};

const ActivityListItem = ({ user }: ActivityProps) => {
	const activityByUserId = useAppSelector((state) => selectActivityByUserId(state, user?.id || ''));

	return (
		<div className="border-color-primary group/list_friends">
			<div key={user?.id} className="flex justify-between items-center rounded-lg">
				<ActivityItem user={user} activity={activityByUserId} />
			</div>
		</div>
	);
};

const ActivityItem = ({ user, activity }: { user?: IUserProfileActivity; activity?: ActivitiesEntity }) => {
	const { t } = useTranslation('friendsPage');
	const avatar = user?.avatar_url ?? '';
	const username = user?.display_name || user?.username || '';
	const activityName = activity?.activity_name || '';
	const statusKey = activityStatusKeys[activity?.activity_type as number];
	const statusLabel = statusKey ? t(statusKey) : '';
	const subtitle =
		activity?.activity_description || (statusLabel ? (activityName ? `${statusLabel} · ${activityName}` : statusLabel) : activityName);

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

				<div className="flex flex-col font-medium flex-1 min-w-0">
					<span className="text-base font-medium truncate">{username}</span>
					{subtitle && <p className="w-full text-[12px] opacity-60 truncate">{subtitle}</p>}
				</div>
			</div>
		</div>
	);
};

export default ActivityListItem;
