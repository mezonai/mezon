import { rolesClanActions, selectCurrentClanId, setAddPermissions, setRemovePermissions, useAppDispatch } from '@mezon/store';
import { ApiRole } from 'mezon-js/api.gen';
import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useMyRole } from './useMyRole';
export function useRoles() {
	const dispatch = useAppDispatch();
	const currentClanId = useSelector(selectCurrentClanId);
	const { maxPermissionId } = useMyRole();

	const deleteRole = React.useCallback(
		async (roleId: string) => {
			await dispatch(rolesClanActions.fetchDeleteRole({ roleId, clanId: currentClanId || '' }));
		},
		[dispatch]
	);

	const createRole = React.useCallback(
		async (clanId: string, title: string, color: string, addUserIds: string[], activePermissionIds: string[]) => {
			const response = await dispatch(
				rolesClanActions.fetchCreateRole({
					clanId,
					title,
					color,
					addUserIds,
					activePermissionIds,
					maxPermissionId: maxPermissionId
				})
			);
			await dispatch(rolesClanActions.fetchRolesClan({ clanId, noCache: true }));
			return response?.payload as ApiRole;
		},
		[dispatch]
	);

	const updateRole = React.useCallback(
		async (
			clanId: string,
			roleId: string,
			title: string,
			color: string,
			addUserIds: string[],
			activePermissionIds: string[],
			removeUserIds: string[],
			removePermissionIds: string[],
			roleIcon?: string
		) => {
			const response = await dispatch(
				rolesClanActions.updateRole({
					roleId,
					title,
					color,
					addUserIds,
					activePermissionIds,
					removeUserIds,
					removePermissionIds,
					clanId,
					maxPermissionId: maxPermissionId,
					roleIcon
				})
			);
			if (activePermissionIds.length) dispatch(setAddPermissions([]));
			if (activePermissionIds.length) dispatch(setRemovePermissions([]));
			return response?.payload;
		},
		[dispatch]
	);
	return useMemo(
		() => ({
			deleteRole,
			createRole,
			updateRole
		}),
		[deleteRole, createRole, updateRole]
	);
}
