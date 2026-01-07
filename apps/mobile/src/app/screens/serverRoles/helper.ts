import { RolesClanEntity } from '@mezon/store-mobile';
import { EPermission } from '@mezon/utils';

interface ICheckViewRole {
	role: RolesClanEntity;
	isClanOwner: boolean;
	userPermissionsStatus: any;
}

export const checkCanEditPermission = ({ isClanOwner, userPermissionsStatus, role }: ICheckViewRole): boolean => {
	if (isClanOwner) {
		return true;
	}

	const adminPermission = role?.permissionList?.permissions?.find((r) => r.slug === EPermission.administrator);
	if (adminPermission?.active) {
		return false;
	}

	const manageClanPermission = role?.permissionList?.permissions?.find((r) => r.slug === EPermission.manageClan);
	if (userPermissionsStatus.administrator || (userPermissionsStatus.hasManageClan && !manageClanPermission?.active)) {
		return true;
	}

	return false;
};
