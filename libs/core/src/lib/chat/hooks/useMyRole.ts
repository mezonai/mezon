import { selectAllRolesClan, selectMemberClanByUserId, useAppSelector } from '@mezon/store';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useAuth } from '../../auth/hooks/useAuth';

export function useMyRole() {
	const { userProfile } = useAuth();
	const userById = useAppSelector((state) => selectMemberClanByUserId(state, userProfile?.user?.id || ''));
	const RolesClan = useSelector(selectAllRolesClan);

	const userRolesClan = useMemo(() => {
		return userById?.roleId ? RolesClan.filter((role) => userById?.roleId?.includes(role.id)) : [];
	}, [userById?.roleId, RolesClan]);

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
