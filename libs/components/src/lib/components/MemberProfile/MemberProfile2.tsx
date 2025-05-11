import { useColorsRoleById } from '@mezon/core';
import { selectClanMemberMetaUserId, selectMemberClanByUserId2, selectMemberCustomStatusById2, useAppSelector } from '@mezon/store';
import { createImgproxyUrl } from '@mezon/utils';
import { AvatarImage } from '../../components';
import { useMemberContextMenu } from '../../contexts/MemberContextMenu';
import { UserStatusIcon } from './MemberProfile';

type BaseMemberProfileProps = {
	id: string;
};

export const BaseMemberProfile = ({ id }: BaseMemberProfileProps) => {
	const user = useAppSelector((state) => selectMemberClanByUserId2(state, id));
	const userMeta = useAppSelector((state) => selectClanMemberMetaUserId(state, id));
	const userCustomStatus = useAppSelector((state) => selectMemberCustomStatusById2(state, user.user?.id || ''));
	const avatar = user.clan_avatar ? user.clan_avatar : (user?.user?.avatar_url ?? '');
	const username = user?.clan_nick || user?.user?.display_name || user?.user?.username || '';

	const { showContextMenu, openProfileItem, setCurrentUser } = useMemberContextMenu();

	const handleClick = (event: React.MouseEvent) => {
		setCurrentUser(user);
		openProfileItem(event, user);
	};

	const handleContextMenu = (event: React.MouseEvent) => {
		showContextMenu(event, user);
	};

	return (
		<div className="relative group w-full">
			<div onContextMenu={handleContextMenu} onClick={handleClick} className="cursor-pointer flex items-center gap-[9px] relative">
				<div className="relative">
					<AvatarImage
						alt={username}
						username={user?.user?.username ?? username}
						className="min-w-8 min-h-8 max-w-8 max-h-8"
						classNameText="font-semibold"
						srcImgProxy={createImgproxyUrl(avatar ?? '')}
						src={avatar}
					/>
					<div className="rounded-full right-[-4px] absolute bottom-0 inline-flex items-center justify-center gap-1 p-[3px] text-sm text-white dark:bg-bgSecondary bg-bgLightMode">
						<UserStatusIcon status={userMeta?.status} />
					</div>
				</div>

				<div className="flex flex-col font-medium">
					<ClanUserName userId={user?.id} name={username} />
					<p className="dark:text-channelTextLabel text-black w-full text-[12px] line-clamp-1 break-all max-w-[176px] ">
						{userCustomStatus}
					</p>
				</div>
			</div>
		</div>
	);
};

export function ClanUserName({ name, userId }: { name: string; userId: string }) {
	const userRolesClan = useColorsRoleById(userId || '');

	return (
		<span className="one-line text-start" style={{ color: userRolesClan.highestPermissionRoleColor }}>
			{name}
		</span>
	);
}
