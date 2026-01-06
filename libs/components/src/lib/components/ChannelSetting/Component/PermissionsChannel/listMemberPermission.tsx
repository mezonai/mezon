import { useAppNavigation, useAuth, useCustomNavigate } from '@mezon/core';
import type { removeChannelUsersPayload } from '@mezon/store';
import { channelUsersActions, selectCurrentClanId, selectMemberClanByUserId, selectUserChannelIds, useAppDispatch } from '@mezon/store';
import { Icons } from '@mezon/ui';
import type { IChannel } from '@mezon/utils';
import { createImgproxyUrl, generateE2eId, getAvatarForPrioritize, getNameForPrioritize } from '@mezon/utils';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { AvatarImage } from '../../../AvatarImage/AvatarImage';

type ListMemberPermissionProps = {
	channel: IChannel;
	selectedUserIds: string[];
	setSelectedUserIds?: (userIds: string[]) => void;
};

const ListMemberPermission = (props: ListMemberPermissionProps) => {
	const { channel } = props;

	const dispatch = useAppDispatch();
	const idUsers = useSelector((state) => selectUserChannelIds(state, channel.id));
	const currentClanId = useSelector(selectCurrentClanId);
	const navigate = useCustomNavigate();
	const userProfile = useAuth();
	const { toMembersPage } = useAppNavigation();
	const deleteMember = async (userId: string) => {
		const body: removeChannelUsersPayload = {
			channelId: channel.id,
			userId,
			channelType: channel.type,
			clanId: currentClanId as string
		};
		await dispatch(channelUsersActions.removeChannelUsers(body));
		if (currentClanId && userId === userProfile.userId) {
			navigate(toMembersPage(currentClanId));
		}
	};

	return idUsers.map((id) => (
		<ItemMemberPermission
			key={id}
			id={id}
			onDelete={() => deleteMember(id as string)}
			channelOwner={channel.creatorId === id}
			selectedUserIds={props.selectedUserIds}
			setSelectedUserIds={props.setSelectedUserIds}
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
	selectedUserIds?: string[];
	setSelectedUserIds?: (userIds: string[]) => void;
};

const ItemMemberPermission = (props: ItemMemberPermissionProps) => {
	const { id = '', onDelete, channelOwner, selectedUserIds = [], setSelectedUserIds } = props;
	const user = useSelector((state) => selectMemberClanByUserId(state, id));
	const namePrioritize = getNameForPrioritize(user?.clanNick, user?.user?.displayName, user?.user?.username);
	const avatarPrioritize = getAvatarForPrioritize(user?.clanAvatar, user?.user?.avatarUrl);

	const handleDelete = () => {
		if (setSelectedUserIds && selectedUserIds) {
			const newSelectedUserIds = selectedUserIds.filter((userId) => userId !== id);
			setSelectedUserIds(newSelectedUserIds);
		}
		if (!channelOwner) {
			onDelete();
		}
	};
	const { t } = useTranslation('channelSetting');
	return (
		<div
			className={`flex justify-between py-2 rounded text-theme-primary`}
			key={id}
			data-e2e={generateE2eId('channel_setting_page.permissions.section.member_role_management.member_list.member_item')}
		>
			<div className="flex gap-x-2 items-center">
				<AvatarImage
					alt={namePrioritize || ''}
					username={user?.user?.username || ''}
					className="min-w-6 min-h-6 max-w-6 max-h-6"
					srcImgProxy={createImgproxyUrl(avatarPrioritize ?? '')}
					src={avatarPrioritize}
					classNameText="text-[9px] pt-[3px]"
				/>
				<p className="text-sm font-semibold text-theme-primary-active">{namePrioritize}</p>
				<p className=" font-light">{user?.user?.username || ''}</p>
			</div>
			<div className="flex items-center gap-x-2">
				<p className="text-xs ">{channelOwner && t('channelPermission.ChannelCreator')}</p>
				<div onClick={handleDelete} role="button" className={`${channelOwner ? 'cursor-not-allowed' : 'cursor-pointer hover:text-red-500'}`}>
					<Icons.EscIcon defaultSize={` size-[15px]`} defaultFill={channelOwner ? 'text-theme-primary-active' : ''} />
				</div>
			</div>
		</div>
	);
};
