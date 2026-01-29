import { selectMemberClanByUserId, useAppSelector } from '@mezon/store';
import { Icons, NameComponent } from '@mezon/ui';
import type { IChannelMember } from '@mezon/utils';
import { createImgproxyUrl, generateE2eId, getAvatarForPrioritize, getNameForPrioritize } from '@mezon/utils';
import { AvatarImage } from '../../components';

function UserListItem({ user }: { user: IChannelMember }) {
	const userStream = useAppSelector((state) => selectMemberClanByUserId(state, user.user_id ?? ''));
	const name = getNameForPrioritize(userStream?.clan_nick, userStream?.user?.display_name, userStream?.user?.username);
	const avatar = getAvatarForPrioritize(userStream?.clan_avatar, userStream?.user?.avatar_url);

	return (
		<div
			className={`bg-item-hover text-theme-primary-hover w-[90%] flex p-1 rounded-lg ml-[18px] items-center gap-3 cursor-pointer`}
			data-e2e={generateE2eId('clan_page.channel_list.item.user_list.item')}
		>
			<div className="w-5 h-5 rounded-full scale-75">
				<div className="w-8 h-8 mt-[-0.3rem]">
					{userStream ? (
						<AvatarImage
							alt={userStream?.user?.username || ''}
							username={userStream?.user?.username}
							className="min-w-8 min-h-8 max-w-8 max-h-8"
							srcImgProxy={createImgproxyUrl(avatar ?? '')}
							src={avatar}
						/>
					) : (
						<Icons.AvatarUser />
					)}
				</div>
			</div>
			<div>
				{userStream ? (
					<NameComponent id={user.user_id || ''} name={name || ''} />
				) : (
					<p className="text-sm font-medium ">{user.participant}</p>
				)}
			</div>
		</div>
	);
}

export default UserListItem;
