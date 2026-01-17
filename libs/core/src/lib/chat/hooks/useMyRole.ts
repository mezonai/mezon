import { selectAllRolesClan, selectMemberClanByUserId, useAppSelector } from '@mezon/store';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useAuth } from '../../auth/hooks/useAuth';

export function useMyRole() {
	const { userProfile } = useAuth();
	const userById = useAppSelector((state) => selectMemberClanByUserId(state, userProfile?.user?.id || ''));
	const RolesClan = useSelector(selectAllRolesClan);

	const userRolesClan = useMemo(() => {
		return userById?.role_id ? RolesClan.filter((role) => userById?.role_id?.includes(BigInt(role.id))) : [];
	}, [userById?.role_id, RolesClan]);

	const maxPermissionId = useMemo(() => {
		let max = 0;
		let roleId = '';
		userRolesClan.forEach((role) => {
			if (role?.max_level_permission && max < role?.max_level_permission) {
				max = role?.max_level_permission;
				roleId = role?.id;
			}
		});
		return roleId;
	}, [userRolesClan]);

	return useMemo(
		() => ({
			maxPermissionId
		}),
		[maxPermissionId]
	);
}
