import { usePermissionChecker } from '@mezon/core';
import { EPermission } from '@mezon/utils';

export function useCanViewArchivedChannels() {
	const [isClanOwner, hasAdminPermission, canManageClan] = usePermissionChecker([
		EPermission.clanOwner,
		EPermission.administrator,
		EPermission.manageClan
	]);

	const canViewArchivedChannels = isClanOwner || hasAdminPermission || canManageClan;

	return { canViewArchivedChannels };
}
