import {
	overriddenPoliciesActions,
	selectCurrentClanId,
	selectMaxPermissionForChannel,
	selectUserMaxPermissionLevel,
	useAppDispatch
} from '@mezon/store';
import { EOverriddenPermission, EPermission } from '@mezon/utils';
import { useCallback, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useIsClanOwner } from '../useIsClanOwner';
import { usePermissionsLevel } from './usePermissionsLevels';

function usePermissionChecker(permissions: EPermission[]): boolean[];
function usePermissionChecker(permissions: Array<EPermission | EOverriddenPermission>, channelId: string, clanId?: string): boolean[];

function usePermissionChecker(permissions: string[], channelId?: string, clanId?: string) {
	const currentClanId = useSelector(selectCurrentClanId);

	const effectiveClanId = clanId && clanId !== '0' ? clanId : currentClanId;

	const dispatch = useAppDispatch();

	// Retrieve the permission levels for different permission types
	const permissionLevels = usePermissionsLevel();

	// Get the maximum permission level the user has
	const maxPermissionLevel = useSelector(selectUserMaxPermissionLevel);

	// Get the overridden permissions for a specific channel (if channelId is provided)
	const overriddenPermissions = useSelector(selectMaxPermissionForChannel(channelId ?? ''));

	// Check if the user is a Clan Owner, which grants all permissions
	const isClanOwner = useIsClanOwner(effectiveClanId ?? '');

	// Function to check if a user has a particular permission
	const checkPermission = useCallback(
		(permission: string) => {
			// If the permission is an overridden permission for a channel
			if (Object.values(EOverriddenPermission).includes(permission as EOverriddenPermission)) {
				// If no channelId is provided, the check fails for overridden permissions
				if (!channelId) {
					return false;
				}
				// Return the overridden permission for the specific channel
				return overriddenPermissions[permission as unknown as EOverriddenPermission];
			}

			if (permission === EPermission.clanOwner) {
				return isClanOwner;
			}

			if (isClanOwner) {
				return true;
			}

			// If user's max permission level is not defined, return false
			if (Number.isNaN(maxPermissionLevel)) {
				return false;
			}

			// Check if the user's max permission level is high enough for the permission
			return permissionLevels[permission as EPermission] <= (maxPermissionLevel as number);
		},
		[channelId, isClanOwner, maxPermissionLevel, overriddenPermissions, permissionLevels]
	);

	const results = useMemo(() => {
		// Map through the permissions array and check each one
		return permissions.map((permission) => checkPermission(permission));
	}, [permissions, checkPermission]);

	useEffect(() => {
		if (effectiveClanId && effectiveClanId !== '0' && channelId && !Object.keys(overriddenPermissions).length) {
			dispatch(overriddenPoliciesActions.fetchMaxChannelPermission({ clanId: effectiveClanId, channelId }));
		}
	}, [channelId, effectiveClanId, dispatch, overriddenPermissions]);

	// Return the result array where each entry represents if the user has that permission
	return results;
}

export { usePermissionChecker };
