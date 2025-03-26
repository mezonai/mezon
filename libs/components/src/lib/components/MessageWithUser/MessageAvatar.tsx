import { IMessageWithUser, createImgproxyUrl } from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import { memo } from 'react';
import { AvatarImage } from '../AvatarImage/AvatarImage';
import getPendingNames from './usePendingNames';

type IMessageAvatarProps = {
	message: IMessageWithUser;
	isEditing?: boolean;
	mode?: number;
	onClick?: (e: React.MouseEvent<HTMLImageElement, MouseEvent>) => void;
};

const MessageAvatar = ({ message, mode, onClick }: IMessageAvatarProps) => {
	const clanAvatar = message?.clan_avatar;
	const generalAvatar = message?.avatar;
	const { pendingUserAvatar, pendingClanAvatar } = getPendingNames(
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

	const avatarUrl =
		((mode === ChannelStreamMode.STREAM_MODE_THREAD || mode === ChannelStreamMode.STREAM_MODE_CHANNEL
			? clanAvatar || pendingClanAvatar || pendingUserAvatar
			: pendingUserAvatar) ||
			message?.avatar) ??
		'';

	return (
		<AvatarImage
			onContextMenu={(e) => {
				e.preventDefault();
				e.stopPropagation();
			}}
			alt={message.username ?? ''}
			username={message.username}
			data-popover-target="popover-content"
			srcImgProxy={createImgproxyUrl(avatarUrl, { width: 100, height: 100, resizeType: 'fit' })}
			src={avatarUrl}
			className="min-w-10 min-h-10 absolute left-[16px]"
			classNameText="font-semibold"
			isAnonymous={message.sender_id === process.env.NX_CHAT_APP_ANNONYMOUS_USER_ID}
			onClick={onClick}
		/>
	);
};

export default memo(
	MessageAvatar,
	(prev, curr) => prev.message.clan_avatar === curr.message.clan_avatar && prev.message.avatar === curr.message.avatar
);
