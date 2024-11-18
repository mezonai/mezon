import { RolesClanEntity, selectAllRolesClan } from '@mezon/store-mobile';
import { DEFAULT_MESSAGE_CREATOR_NAME_DISPLAY_COLOR } from '@mezon/utils';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

export function useColorsRoleById(messageSenderId: string, defaultColor: string = DEFAULT_MESSAGE_CREATOR_NAME_DISPLAY_COLOR) {
	const rolesClan = useSelector(selectAllRolesClan);

	const userRolesClan = useMemo(() => {
		const activeRoles: RolesClanEntity[] =
			rolesClan?.filter((role) => role?.role_user_list?.role_users?.some((user) => user?.id === messageSenderId)) || [];

		const highestPermissionRole = activeRoles?.reduce<RolesClanEntity | null>((highest, role) => {
			const currentPermission = role?.max_level_permission ?? 0;
			const highestPermission = highest?.max_level_permission ?? 0;
			return currentPermission > highestPermission ? role : highest;
		}, null);

		return {
			highestPermissionRoleColor: highestPermissionRole?.color || activeRoles[0]?.color || defaultColor
		};
	}, [messageSenderId, rolesClan, defaultColor]);

	return userRolesClan;
}
