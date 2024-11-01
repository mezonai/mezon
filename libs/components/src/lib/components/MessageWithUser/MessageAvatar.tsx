import { selectMemberClanByUserId2, useAppSelector } from '@mezon/store';
import { IMessageWithUser } from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import { memo } from 'react';
import { AvatarImage } from '../AvatarImage/AvatarImage';
import usePendingNames from './usePendingNames';

type IMessageAvatarProps = {
	message: IMessageWithUser;
	isEditing?: boolean;
	mode?: number;
	onClick?: (e: React.MouseEvent<HTMLImageElement, MouseEvent>) => void;
};

const MessageAvatar = ({ message, mode, onClick }: IMessageAvatarProps) => {
	const userClan = useAppSelector((state) => selectMemberClanByUserId2(state, message.sender_id));
	const clanAvatar = userClan?.clan_avatar;
	const generalAvatar = userClan?.user?.avatar_url;
	const { pendingUserAvatar, pendingClanAvatar } = usePendingNames(
		message,
		undefined,
		undefined,
		undefined,
		undefined,
		undefined,
		undefined,
		message?.avatar,
		generalAvatar,
		clanAvatar,
		message?.clan_avatar
	);

	return (
		<AvatarImage
			onContextMenu={(e) => {
				e.preventDefault();
				e.stopPropagation();
			}}
			alt={message.username ?? ''}
			userName={message.username}
			data-popover-target="popover-content"
			src={
				(mode === ChannelStreamMode.STREAM_MODE_THREAD || mode === ChannelStreamMode.STREAM_MODE_CHANNEL
					? clanAvatar || pendingClanAvatar || pendingUserAvatar
					: pendingUserAvatar) || message?.avatar
			}
			className="min-w-10 min-h-10"
			classNameText="font-semibold"
			isAnonymous={message.sender_id === process.env.NX_CHAT_APP_ANNONYMOUS_USER_ID}
			onClick={onClick}
		/>
	);
};

export default memo(MessageAvatar, (prev, cur) => prev.message?.sender_id === cur.message?.sender_id);
