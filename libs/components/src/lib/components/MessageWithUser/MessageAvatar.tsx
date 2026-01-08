import { getUserAvatarOverride, getUserClanAvatarOverride, selectAvatarVersion, useAppSelector } from '@mezon/store';
import type { IMessageWithUser } from '@mezon/utils';
import { createImgproxyUrl } from '@mezon/utils';
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
	useAppSelector(selectAvatarVersion);
	const clanAvatar = message?.clanAvatar;
	const generalAvatar = message?.avatar;

	const overrideAvatar = getUserAvatarOverride(message.user?.id || '');
	const overrideClanAvatar = message.clanId ? getUserClanAvatarOverride(message.user?.id || '', message.clanId as string) : undefined;
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
		message?.clanAvatar
	);

	const avatarUrl =
		((mode === ChannelStreamMode.STREAM_MODE_THREAD || mode === ChannelStreamMode.STREAM_MODE_CHANNEL
			? overrideClanAvatar || clanAvatar || pendingClanAvatar || overrideAvatar || pendingUserAvatar
			: overrideAvatar || pendingUserAvatar) ||
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
			className="min-w-10 min-h-10 absolute left-[16px] select-none"
			classNameText="font-semibold"
			isAnonymous={message.senderId === process.env.NX_CHAT_APP_ANNONYMOUS_USER_ID}
			onClick={onClick}
		/>
	);
};

export default memo(
	MessageAvatar,
	(prev, curr) => prev.message.clanAvatar === curr.message.clanAvatar && prev.message.avatar === curr.message.avatar
);
