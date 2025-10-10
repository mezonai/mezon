import { useClanOwner } from '@mezon/core';
import type { RolesClanEntity } from '@mezon/store';
import { getSelectedRoleId, toggleIsShowFalse } from '@mezon/store';
import { EVERYONE_ROLE_ID } from '@mezon/utils';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useCheckHasAdministrator } from '../../SettingMainRoles/listActiveRole';
import SettingDisplayRole from '../SettingDisplayRole';
import SettingManageMembers from '../SettingManageMembers';
import SettingPermissions from '../SettingPermissions';
import { TabsSelectRole } from './tabSelectRole';

enum RoleTabs {
	Display_Tab = 'Display',
	Permission_Tab = 'Permissions',
	Manage_Tab = 'Manage Members'
}

const SettingValueDisplayRole = ({ RolesClan }: { RolesClan: RolesClanEntity[] }) => {
	const { t } = useTranslation('clanRoles');
	const [selectedButton, setSelectedButton] = useState<string | null>(RoleTabs.Permission_Tab);

	const clickRole = useSelector(getSelectedRoleId);
	const activeRole = useMemo(() => RolesClan.find((role) => role.id === clickRole), [RolesClan, clickRole]);
	const isClanOwner = useClanOwner();
	const hasPermissionAdmin = useCheckHasAdministrator(activeRole?.permission_list?.permissions);
	const hasPermissionEdit = isClanOwner || !hasPermissionAdmin;
	const dispatch = useDispatch();

	const handleButtonClick = (buttonName: string) => {
		setSelectedButton(buttonName);
	};

	const renderContent = useCallback(() => {
		if (clickRole === EVERYONE_ROLE_ID) {
			return <SettingPermissions RolesClan={RolesClan} hasPermissionEdit={hasPermissionEdit} />;
		}
		switch (selectedButton) {
			case TabsSelectRole.Tab_Display:
				return <SettingDisplayRole RolesClan={RolesClan} hasPermissionEdit={hasPermissionEdit} />;
			case TabsSelectRole.Tab_Permissions:
				return <SettingPermissions RolesClan={RolesClan} hasPermissionEdit={hasPermissionEdit} />;
			case TabsSelectRole.Tab_Manage_Members:
				return <SettingManageMembers RolesClan={RolesClan} hasPermissionEdit={hasPermissionEdit} />;
			default:
				return null;
		}
	}, [selectedButton, RolesClan, hasPermissionEdit, clickRole]);

	const roleUsersCount = activeRole?.role_user_list?.role_users?.length || 0;

	const isSelectDisplayTab = selectedButton === RoleTabs.Display_Tab && EVERYONE_ROLE_ID !== clickRole;
	const isSelectPermissionTab = selectedButton === RoleTabs.Permission_Tab || EVERYONE_ROLE_ID === clickRole;
	const isSelectManageTab = selectedButton === RoleTabs.Manage_Tab && EVERYONE_ROLE_ID !== clickRole;

	return (
		<>
			<div className="pr-5">
				<div
					className={`w-full flex  mb-5 border-b border-gray-200 dark:border-gray-500 ${activeRole?.slug === `everyone-${activeRole?.clan_id}` ? 'justify-around' : 'justify-between'}`}
				>
					<span className={` ${clickRole === EVERYONE_ROLE_ID ? ' cursor-not-allowed' : ''}`}>
						<button
							className={`py-[5px] text-[15px] text-left transition duration-300 rounded relative tracking-wider font-medium group ${isSelectDisplayTab ? 'text-theme-primary-active text-bold' : 'text-theme-primary'} ${clickRole === EVERYONE_ROLE_ID ? 'pointer-events-none select-none' : ''}`}
							onClick={() => {
								if (isSelectDisplayTab) return;
								handleButtonClick('Display');
								dispatch(toggleIsShowFalse());
							}}
						>
							{t('roleManagement.display')}
							<div
								className={`absolute inset-x-0 bottom-0 h-[2px] group-hover:bg-blue-300 ${isSelectDisplayTab ? 'bg-blue-400' : ''}`}
							/>
						</button>
					</span>
					<button
						className={`py-[5px] text-[15px] text-left transition duration-300 rounded relative tracking-wider font-medium group ${isSelectPermissionTab ? 'text-theme-primary-active text-bold' : 'text-theme-primary'}`}
						onClick={() => {
							if (isSelectPermissionTab) return;
							handleButtonClick('Permissions');
							dispatch(toggleIsShowFalse());
						}}
					>
						{t('roleManagement.permissions')}
						<div
							className={`absolute inset-x-0 bottom-0 h-[2px] group-hover:bg-blue-300 ${isSelectPermissionTab ? 'bg-blue-400' : ''}`}
						/>
					</button>
					{activeRole?.slug !== `everyone-${activeRole?.clan_id}` && (
						<span className={` ${clickRole === EVERYONE_ROLE_ID ? ' cursor-not-allowed' : ''}`}>
							<button
								className={`py-[5px] text-[15px] text-left transition duration-300 rounded relative tracking-wider font-medium group ${isSelectManageTab ? 'text-theme-primary-active text-bold' : 'text-theme-primary'} ${clickRole === EVERYONE_ROLE_ID ? 'pointer-events-none select-none' : ''}`}
								onClick={() => {
									if (isSelectManageTab) return;
									handleButtonClick('Manage Members');
									dispatch(toggleIsShowFalse());
								}}
							>
								{t('roleManagement.manageMembers')} ({roleUsersCount > 0 ? roleUsersCount : 0})
								<div
									className={`absolute inset-x-0 bottom-0 h-[2px] group-hover:bg-blue-300 ${isSelectManageTab ? 'bg-blue-400' : ''}`}
								/>
							</button>
						</span>
					)}
				</div>
			</div>

			{renderContent()}
		</>
	);
};

export default SettingValueDisplayRole;
