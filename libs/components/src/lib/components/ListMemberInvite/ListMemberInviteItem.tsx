import { useSendInviteMessage, useSilentSendMess } from '@mezon/core';
import { DirectEntity, getStore, selectDirectById } from '@mezon/store';
import { UsersClanEntity, createImgproxyUrl, generateE2eId } from '@mezon/utils';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import { useEffect, useState } from 'react';
import { AvatarImage } from '../AvatarImage/AvatarImage';
import { ProcessedUser } from './dataHelper';

type ItemPorp = {
	url: string;
	dmGroup?: DirectEntity;
	user?: UsersClanEntity;
	isSent?: boolean;
	onSend: (dmGroup: DirectEntity) => void;
	usersInviteExternal?: ProcessedUser;
	isExternalCalling?: boolean;
};
const ListMemberInviteItem = (props: ItemPorp) => {
	const { dmGroup, isSent, url, onSend, user, usersInviteExternal, isExternalCalling } = props;
	const [isInviteSent, setIsInviteSent] = useState(isSent);
	const { sendInviteMessage } = useSendInviteMessage();
	const { createSilentSendMess } = useSilentSendMess();
	const directMessageWithUser = async (userId: string) => {
		const response = await createSilentSendMess(userId);
		if (response.channel_id) {
			sendInviteMessage(url, response.channel_id, ChannelStreamMode.STREAM_MODE_DM);
		}
	};

	const handleButtonClick = async (directParamId?: string, type?: number, userId?: string) => {
		const store = getStore();
		const getDirect = selectDirectById(store.getState(), directParamId);
		setIsInviteSent(true);
		if (userId) {
			directMessageWithUser(userId);
		}
		if (directParamId && getDirect) {
			let channelMode = 0;
			if (type === ChannelType.CHANNEL_TYPE_DM) {
				channelMode = ChannelStreamMode.STREAM_MODE_DM;
			}
			if (type === ChannelType.CHANNEL_TYPE_GROUP) {
				channelMode = ChannelStreamMode.STREAM_MODE_GROUP;
			}
			sendInviteMessage(url, directParamId, channelMode);
			onSend(getDirect);
		}
	};

	useEffect(() => {
		setIsInviteSent(isSent);
	}, [isSent]);
	return isExternalCalling ? (
		<ItemInviteUser
			userId={usersInviteExternal?.id}
			avatar={usersInviteExternal?.clan_avatar}
			displayName={usersInviteExternal?.clan_nick}
			username={usersInviteExternal?.username}
			isInviteSent={isInviteSent}
			onHandle={() =>
				handleButtonClick(
					usersInviteExternal?.id,
					usersInviteExternal?.type,
					usersInviteExternal?.type === ChannelType.CHANNEL_TYPE_GROUP ? '' : usersInviteExternal?.id
				)
			}
		/>
	) : dmGroup ? (
		<ItemInviteDM
			channelID={dmGroup.channel_id}
			type={Number(dmGroup.type)}
			avatar={dmGroup.type === ChannelType.CHANNEL_TYPE_GROUP ? (dmGroup.topic || 'assets/images/avatar-group.png') : dmGroup.channel_avatar?.at(0)}
			label={dmGroup.channel_label}
			isInviteSent={isInviteSent}
			onHandle={() => handleButtonClick(dmGroup.channel_id || '', dmGroup.type || 0)}
			username={dmGroup.usernames?.toString()}
		/>
	) : (
		<ItemInviteUser
			userId={user?.id}
			avatar={user?.user?.avatar_url}
			displayName={user?.user?.display_name}
			username={user?.user?.username}
			isInviteSent={isInviteSent}
			onHandle={() => handleButtonClick('', 0, user?.id)}
		/>
	);
};
export default ListMemberInviteItem;

type ItemInviteDMProps = {
	channelID?: string;
	type?: number;
	avatar?: string;
	label?: string;
	isInviteSent?: boolean;
	username?: string;
	onHandle: () => void;
};

const ItemInviteDM = (props: ItemInviteDMProps) => {
	const { channelID = '', type = '', avatar = '', label = '', isInviteSent = false, username = '', onHandle } = props;
	return (
		<div
			key={channelID}
			className="flex items-center justify-between h-fit group rounded-lg bg-item-hover p-1"
			data-e2e={generateE2eId('clan_page.modal.invite_people.user_item')}
		>
			<AvatarImage
				alt={username}
				username={username}
				className="min-w-10 min-h-10 max-w-10 max-h-10"
				srcImgProxy={createImgproxyUrl(avatar ?? '')}
				src={avatar}
			/>
			<p style={{ marginRight: 'auto' }} className="px-[10px] flex-1 overflow-hidden text truncate text-theme-primary-active">
				{label}
			</p>
			<button
				data-e2e={generateE2eId('clan_page.modal.invite_people.user_item.button.invite')}
				onClick={onHandle}
				disabled={isInviteSent}
				className={
					isInviteSent
						? ' rounded-lg py-[5px] px-[10px] cursor-not-allowed font-semibold'
						: 'font-sans font-normal text-[14px] group-hover:bg-green-700  hover:bg-green-900 group-hover:text-white border-theme-primary rounded-lg py-[5px] px-[18px]'
				}
			>
				{isInviteSent ? 'Sent' : 'Invite'}
			</button>
		</div>
	);
};

type ItemInviteUserProps = {
	userId?: string;
	avatar?: string;
	displayName?: string;
	username?: string;
	isInviteSent?: boolean;
	onHandle?: () => void;
};

const ItemInviteUser = (props: ItemInviteUserProps) => {
	const { userId = '', avatar = '', displayName = '', username = '', isInviteSent = false, onHandle } = props;
	return (
		<div key={userId} className="flex items-center justify-between h-14">
			<AvatarImage
				alt={username}
				username={username}
				className="min-w-10 min-h-10 max-w-10 max-h-10"
				srcImgProxy={createImgproxyUrl(avatar ?? '')}
				src={avatar}
			/>
			<p style={{ marginRight: 'auto' }} className="pl-[10px] max-w-[300px] truncate">
				{displayName} <span className="text-xs text-gray-500">{username}</span>
			</p>

			<button
				onClick={onHandle}
				disabled={isInviteSent}
				className={
					isInviteSent
						? 'dark:text-[#9c9ea0] text-[#a1a8ef] rounded-[5px] py-[5px] px-[10px] cursor-not-allowed font-semibold'
						: 'font-sans font-normal text-[14px] bg-white dark:bg-bgPrimary dark:hover:bg-green-700 hover:bg-green-700 text-textLightTheme hover:text-white dark:text-textDarkTheme border border-solid border-green-700 rounded-md py-[5px] px-[18px]'
				}
			>
				{isInviteSent ? 'Sent' : 'Invite'}
			</button>
		</div>
	);
};
