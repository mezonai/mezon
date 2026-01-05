import { selectAllRolesClan } from '@mezon/store';
import { DEFAULT_ROLE_COLOR } from '@mezon/utils';
import React, { createContext, useContext, useMemo } from 'react';
import { useSelector } from 'react-redux';

type ColorRoleContextType = {
	getUserHighestRoleColor: (userId: string) => string;
	getUserHighestRoleIcon: (userId: string) => string;
};

const ColorRoleContext = createContext<ColorRoleContextType | null>(null);

export const useColorRole = () => {
	const context = useContext(ColorRoleContext);
	if (!context) {
		throw new Error('useColorRole must be used within a ColorRoleProvider');
	}
	return context;
};

export const ColorRoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const rolesClan = useSelector(selectAllRolesClan);
	const userColorMap = useMemo(() => {
		const map = new Map<string, { roleId: string; color: string; icon: string; max_level_permission: number }>();

		rolesClan.forEach((role) => {
			role?.role_user_list?.role_users?.forEach((user) => {
				if (!user?.id) return;

				const currentRole = map.get(user.id);
				const newRole = {
					roleId: role.id,
					color: role.color || DEFAULT_ROLE_COLOR,
					icon: role?.roleIcon || '',
					max_level_permission: role.max_level_permission ?? 0
				};

				if (!currentRole) {
					map.set(user.id, newRole);
					return;
				}

				if (!currentRole.icon && newRole.icon) {
					map.set(user.id, { ...currentRole, icon: newRole.icon });
					return;
				}
			});
		});

		return map;
	}, [rolesClan]);

	const contextValue = useMemo(
		() => ({
			getUserHighestRoleColor: (userId: string) => userColorMap.get(userId)?.color || DEFAULT_ROLE_COLOR,
			getUserHighestRoleIcon: (userId: string) => userColorMap.get(userId)?.icon || ''
		}),
		[userColorMap]
	);

	return <ColorRoleContext.Provider value={contextValue}>{children}</ColorRoleContext.Provider>;
};
