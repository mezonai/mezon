import { usePermissionChecker } from '@mezon/core';
import { selectCurrentUserId, selectWelcomeChannelByClanId } from '@mezon/store';
import type { IChannel } from '@mezon/utils';
import { EOverriddenPermission, EPermission } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import { useSelector } from 'react-redux';

export const useChannelPermissions = (channel: IChannel) => {
	const currentUserId = useSelector(selectCurrentUserId);
	const welcomeChannelId = useSelector((state) => selectWelcomeChannelByClanId(state, channel.clan_id as string));

	const [hasClanOwnerPermission, hasAdminPermission, canManageClan, canManageThread, canManageChannel] = usePermissionChecker(
		[EPermission.clanOwner, EPermission.administrator, EPermission.manageClan, EOverriddenPermission.manageThread, EPermission.manageChannel],
		channel.channel_id ?? ''
	);

	const isThread = !!channel.parent_id && channel.parent_id !== '0';
	const isChatChannel = channel.type === ChannelType.CHANNEL_TYPE_CHANNEL;
	const isWelcomeChannel = channel.id === welcomeChannelId;
	const isChannelCreator = !!currentUserId && channel.creator_id === currentUserId;

	const hasArchiveChannelPermission = hasClanOwnerPermission || hasAdminPermission || canManageClan || canManageChannel || isChannelCreator;
	const hasManageThreadPermission = (canManageThread && isChannelCreator) || hasClanOwnerPermission || hasAdminPermission;

	const canEditAndDelete = isThread ? hasManageThreadPermission : canManageChannel;
	const canArchive = isThread ? hasManageThreadPermission : hasArchiveChannelPermission;
	const shouldShowArchive = (isChatChannel || isThread) && canArchive && !isWelcomeChannel;

	return {
		welcomeChannelId,
		isThread,
		isChatChannel,
		isWelcomeChannel,
		isChannelCreator,
		canManageChannel,
		hasArchiveChannelPermission,
		hasManageThreadPermission,
		canEditAndDelete,
		canArchive,
		shouldShowArchive
	};
};
