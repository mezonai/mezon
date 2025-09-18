import { selectMemberClanByGoogleId, selectMemberClanByUserId, useAppSelector } from '@mezon/store';
import { Icons, NameComponent } from '@mezon/ui';
import { IChannelMember, createImgproxyUrl, getAvatarForPrioritize, getNameForPrioritize } from '@mezon/utils';
import { AvatarImage } from '../../components';

function UserListItem({ user, channelID, isPttList }: { user: IChannelMember; channelID: string; isPttList?: boolean }) {
	const member = useAppSelector((state) => selectMemberClanByGoogleId(state, user.user_id ?? ''));
	const userStream = useAppSelector((state) => selectMemberClanByUserId(state, user.user_id ?? ''));
	const clanNick = member ? member?.clan_nick : userStream?.clan_nick;
	const displayName = member ? member?.user?.display_name : userStream?.user?.display_name;
	const username = member ? member?.user?.username : userStream?.user?.username;
	const name = getNameForPrioritize(clanNick, displayName, username);
	const clanAvatar = member ? member?.clan_avatar : userStream?.clan_avatar;
	const avatarUrl = member ? member?.user?.avatar_url : userStream?.user?.avatar_url;
	const avatar = getAvatarForPrioritize(clanAvatar, avatarUrl);

	return (
		<div
			className={`bg-item-hover text-theme-primary-hover w-[90%] flex p-1 ${isPttList ? 'w-full' : 'ml-5'} items-center gap-3 cursor-pointer rounded-sm`}
		>
			<div className="w-5 h-5 rounded-full scale-75">
				<div className="w-8 h-8 mt-[-0.3rem]">
					{member || userStream ? (
						<AvatarImage
							alt={username || ''}
							username={username}
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
				{member || userStream ? (
					<NameComponent id={user.user_id || ''} name={name || ''} />
				) : (
					<p className="text-sm font-medium ">{user.participant}</p>
				)}
			</div>
		</div>
	);
}

export default UserListItem;
