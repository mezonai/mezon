import { selectAllRolesClan } from '@mezon/store-mobile';
import { DEFAULT_ROLE_COLOR } from '@mezon/utils';
import React, { createContext, useContext, useMemo } from 'react';
import { useSelector } from 'react-redux';

type ColorRoleContextType = {
	getUserHighestRoleColor: (userId: string) => string;
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
		const map = new Map<string, string>();

		rolesClan.forEach((role) => {
			role?.role_user_list?.role_users?.forEach((user) => {
				if (!user?.id) return;

				const currentColor = map.get(user.id);
				const currentPermission = role?.max_level_permission ?? 0;

				if (!currentColor) {
					map.set(user.id, role.color || DEFAULT_ROLE_COLOR);
				} else {
					const existingRole = rolesClan.find((r) => r.color === currentColor);
					const existingPermission = existingRole?.max_level_permission ?? 0;

					if (currentPermission > existingPermission) {
						map.set(user.id, role.color || DEFAULT_ROLE_COLOR);
					}
				}
			});
		});

		return map;
	}, [rolesClan]);

	const contextValue = useMemo(
		() => ({
			getUserHighestRoleColor: (userId: string) => userColorMap.get(userId) || DEFAULT_ROLE_COLOR
		}),
		[userColorMap]
	);

	return <ColorRoleContext.Provider value={contextValue}>{children}</ColorRoleContext.Provider>;
};
