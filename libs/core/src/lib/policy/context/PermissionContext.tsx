import { getStore, selectCurrentClanId, selectMaxPermissionForChannel, selectUserMaxPermissionLevel } from '@mezon/store';
import { EOverriddenPermission, EPermission } from '@mezon/utils';
import React, { ReactNode, createContext, useCallback, useContext, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { usePermissionsLevel } from '../hooks/permissions/usePermissionsLevels';
import { useIsClanOwner } from '../hooks/useIsClanOwner';

interface PermissionContextType {
	checkPermission: (permission: string, channelId?: string, clanId?: string) => boolean;
	checkPermissions: (permissions: string[], channelId?: string, clanId?: string) => boolean[];
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export const PermissionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
	const currentClanId = useSelector(selectCurrentClanId);
	const permissionLevels = usePermissionsLevel();
	const maxPermissionLevel = useSelector(selectUserMaxPermissionLevel);
	const isClanOwner = useIsClanOwner(currentClanId ?? '');

	const checkPermission = useCallback(
		(permission: string, channelId?: string, clanId?: string) => {
			if (Object.values(EOverriddenPermission).includes(permission as EOverriddenPermission)) {
				if (!channelId) {
					return false;
				}

				const store = getStore();
				const overriddenPermissions = selectMaxPermissionForChannel(store.getState(), channelId || '');
				return overriddenPermissions[permission as unknown as EOverriddenPermission];
			}

			if (permission === EPermission.clanOwner) {
				return isClanOwner;
			}

			if (isClanOwner) {
				return true;
			}

			if (Number.isNaN(maxPermissionLevel)) {
				return false;
			}

			return permissionLevels[permission as EPermission] <= (maxPermissionLevel as number);
		},
		[currentClanId, maxPermissionLevel, permissionLevels]
	);

	const checkPermissions = useCallback(
		(permissions: string[], channelId?: string, clanId?: string): boolean[] => {
			return permissions.map((permission) => checkPermission(permission, channelId, clanId));
		},
		[checkPermission]
	);

	const contextValue = useMemo(
		() => ({
			checkPermission,
			checkPermissions
		}),
		[checkPermission, checkPermissions]
	);

	return <PermissionContext.Provider value={contextValue}>{children}</PermissionContext.Provider>;
};

export const usePermissionContext = (): PermissionContextType => {
	const context = useContext(PermissionContext);
	if (!context) {
		throw new Error('usePermissionContext must be used within a PermissionProvider');
	}
	return context;
};
