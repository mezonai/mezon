import { usePermissionChecker } from '@mezon/core';
import { selectAllChannels, selectCurrentUserId } from '@mezon/store';
import { EPermission } from '@mezon/utils';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

export function useCanViewArchivedChannels() {
	const [isClanOwner, hasAdminPermission, canManageClan] = usePermissionChecker([
		EPermission.clanOwner,
		EPermission.administrator,
		EPermission.manageClan
	]);
	const currentUserId = useSelector(selectCurrentUserId);
	const channels = useSelector(selectAllChannels);

	const isCreatorOfAnyChannel = useMemo(
		() => !!currentUserId && channels.some((channel) => channel.creator_id === currentUserId),
		[currentUserId, channels]
	);

	const canViewAllArchivedChannels = isClanOwner || hasAdminPermission || canManageClan;
	const canViewArchivedChannels = canViewAllArchivedChannels || isCreatorOfAnyChannel;

	return { canViewArchivedChannels, canViewAllArchivedChannels };
}
