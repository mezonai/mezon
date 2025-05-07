import { selectClanMemberMetaUserId, selectMemberClanByUserId2, selectMemberCustomStatusById2, useAppSelector } from '@mezon/store';
import { createImgproxyUrl } from '@mezon/utils';
import { AvatarImage } from '../../components';
import { useMemberContextMenu, useMemberMenuHandlers } from '../../contexts/MemberContextMenu';
import { ClanUserName, UserStatusIcon } from './MemberProfile';

type BaseMemberProfileProps = {
	id: string;
};

export const BaseMemberProfile = ({ id }: BaseMemberProfileProps) => {
	const user = useAppSelector((state) => selectMemberClanByUserId2(state, id));
	const userMeta = useAppSelector((state) => selectClanMemberMetaUserId(state, id));
	const userCustomStatus = useAppSelector((state) => selectMemberCustomStatusById2(state, user.user?.id || ''));
	const avatar = user.clan_avatar ? user.clan_avatar : (user?.user?.avatar_url ?? '');
	const username = user?.clan_nick || user?.user?.display_name || user?.user?.username || '';

	const { showContextMenu } = useMemberMenuHandlers(user);
	const { openProfileItem } = useMemberContextMenu();

	const handleClick = (event: React.MouseEvent) => {
		openProfileItem(event, user);
	};

	return (
		<div className="relative group w-full">
			<div onContextMenu={showContextMenu} onClick={handleClick} className="cursor-pointer flex items-center gap-[9px] relative">
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
