import { useSendInviteMessage, useSilentSendMess } from '@mezon/core';
import { DirectEntity } from '@mezon/store';
import { UsersClanEntity, createImgproxyUrl } from '@mezon/utils';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import { useEffect, useState } from 'react';
import { AvatarImage } from '../AvatarImage/AvatarImage';

type ItemPorp = {
	url: string;
	dmGroup?: DirectEntity;
	user?: UsersClanEntity;
	isSent?: boolean;
	onSend: (dmGroup: DirectEntity) => void;
};
const ListMemberInviteItem = (props: ItemPorp) => {
	const { dmGroup, isSent, url, onSend, user } = props;
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
		setIsInviteSent(true);
		if (userId) {
			directMessageWithUser(userId);
		}
		if (directParamId && dmGroup) {
			let channelMode = 0;
			if (type === ChannelType.CHANNEL_TYPE_DM) {
				channelMode = ChannelStreamMode.STREAM_MODE_DM;
			}
			if (type === ChannelType.CHANNEL_TYPE_GROUP) {
				channelMode = ChannelStreamMode.STREAM_MODE_GROUP;
			}
			sendInviteMessage(url, directParamId, channelMode);
			onSend(dmGroup);
		}
	};
	useEffect(() => {
		setIsInviteSent(isSent);
	}, [isSent]);
	return dmGroup ? (
		<ItemInviteDM
			channelID={dmGroup.channel_id}
			type={Number(dmGroup.type)}
			avatar={dmGroup.channel_avatar?.at(0)}
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
		<div key={channelID} className="flex items-center justify-between h-fit group rounded-md dark:hover:bg-[#393c41] hover:bg-[#d1d2d4] p-1">
			<AvatarImage
				alt={username}
				username={username}
				className="min-w-10 min-h-10 max-w-10 max-h-10"
				srcImgProxy={type === ChannelType.CHANNEL_TYPE_GROUP ? 'assets/images/avatar-group.png' : createImgproxyUrl(avatar ?? '')}
				src={type === ChannelType.CHANNEL_TYPE_GROUP ? 'assets/images/avatar-group.png' : avatar}
			/>
			<p style={{ marginRight: 'auto' }} className="px-[10px] flex-1 overflow-hidden text truncate">
				{label}
			</p>
			<button
				onClick={onHandle}
				disabled={isInviteSent}
				className={
					isInviteSent
						? 'dark:text-[#9c9ea0] text-[#a1a8ef] rounded-[5px] py-[5px] px-[10px] cursor-not-allowed font-semibold'
						: 'font-sans font-normal text-[14px] bg-white dark:bg-bgPrimary group-hover:bg-green-700 dark:hover:bg-green-900 hover:bg-green-900 text-textLightTheme group-hover:text-white dark:text-textDarkTheme border border-solid border-green-700 rounded-sm py-[5px] px-[18px]'
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
			<p style={{ marginRight: 'auto' }} className="pl-[10px]">
				{displayName}
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
