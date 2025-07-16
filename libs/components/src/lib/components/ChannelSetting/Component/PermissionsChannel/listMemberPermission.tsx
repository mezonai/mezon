import { useAppNavigation, useAuth, useCustomNavigate } from '@mezon/core';
import { channelUsersActions, removeChannelUsersPayload, selectAllUserChannel, selectCurrentClanId, useAppDispatch } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { IChannel, createImgproxyUrl, getAvatarForPrioritize, getNameForPrioritize } from '@mezon/utils';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { AvatarImage } from '../../../AvatarImage/AvatarImage';

type ListMemberPermissionProps = {
	channel: IChannel;
	selectedUserIds: string[];
};

const ListMemberPermission = (props: ListMemberPermissionProps) => {
	const { channel } = props;
	const dispatch = useAppDispatch();
	const rawMembers = useSelector(selectAllUserChannel(channel.channel_id || ''));
	const currentClanId = useSelector(selectCurrentClanId);
	const navigate = useCustomNavigate();
	const userProfile = useAuth();
	const { toMembersPage } = useAppNavigation();
	const deleteMember = async (userId: string) => {
		const body: removeChannelUsersPayload = {
			channelId: channel.id,
			userId: userId,
			channelType: channel.type,
			clanId: currentClanId as string
		};
		await dispatch(channelUsersActions.removeChannelUsers(body));
		if (currentClanId && userId === userProfile.userId) {
			navigate(toMembersPage(currentClanId));
		}
	};

	const listMembersInChannel = useMemo(() => {
		if (channel.channel_private === 0 || channel.channel_private === undefined) {
			const filteredMembers = rawMembers.filter((member) => member.user && member.user.id && props.selectedUserIds.includes(member.user.id));
			return filteredMembers.map((member) => ({ ...member.user, clanNick: member.clan_nick, clanAvatar: member.clan_avatar }));
		}
		const filteredMembers = rawMembers.filter((member) => member.userChannelId !== '0' && member.id);
		return filteredMembers.map((member) => ({ ...member.user, clanNick: member.clan_nick, clanAvatar: member.clan_avatar }));
	}, [rawMembers]);

	return listMembersInChannel.map((user) => (
		<ItemMemberPermission
			key={user.id}
			id={user.id}
			username={user.username}
			displayName={user.display_name}
			clanName={user.clanNick}
			clanAvatar={user.clanAvatar}
			avatar={user.avatar_url}
			onDelete={() => deleteMember(user.id as string)}
			channelOwner={channel.creator_id === user.id}
		/>
	));
};

export default ListMemberPermission;

type ItemMemberPermissionProps = {
	id?: string;
	username?: string;
	avatar?: string;
	displayName?: string;
	clanName?: string;
	clanAvatar?: string;
	onDelete: () => void;
	channelOwner?: boolean;
};

const ItemMemberPermission = (props: ItemMemberPermissionProps) => {
	const { id = '', username = '', displayName = '', clanName = '', clanAvatar = '', avatar = '', onDelete, channelOwner } = props;
	const namePrioritize = getNameForPrioritize(clanName, displayName, username);
	const avatarPrioritize = getAvatarForPrioritize(clanAvatar, avatar);

	const handleDelete = () => {
		if (!channelOwner) {
			onDelete();
		}
	};

	return (
		<div className={`flex justify-between py-2 rounded text-theme-primary`} key={id}>
			<div className="flex gap-x-2 items-center">
				<AvatarImage
					alt={username}
					username={username}
					className="min-w-6 min-h-6 max-w-6 max-h-6"
					srcImgProxy={createImgproxyUrl(avatarPrioritize ?? '')}
					src={avatarPrioritize}
					classNameText="text-[9px] pt-[3px]"
				/>
				<p className="text-sm font-semibold text-theme-primary-active">{namePrioritize}</p>
				<p className=" font-light">{username}</p>
			</div>
			<div className="flex items-center gap-x-2">
				<p className="text-xs ">{channelOwner && 'Channel Owner'}</p>
				<div onClick={handleDelete} role="button" className={`${channelOwner ? 'cursor-not-allowed' : 'cursor-pointer hover:text-red-500'}`}>
					<Icons.EscIcon defaultSize={` size-[15px]`} defaultFill={channelOwner ? 'text-theme-primary-active' : ''} />
				</div>
			</div>
		</div>
	);
};
