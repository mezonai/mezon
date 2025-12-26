import { useClanOwner } from '@mezon/core';
import type { RolesClanEntity } from '@mezon/store';
import { getSelectedRoleId, toggleIsShowFalse } from '@mezon/store';
import { generateE2eId } from '@mezon/utils';
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

	const isSelectDisplayTab = selectedButton === RoleTabs.Display_Tab;
	const isSelectPermissionTab = selectedButton === RoleTabs.Permission_Tab;
	const isSelectManageTab = selectedButton === RoleTabs.Manage_Tab;

	return (
		<>
			<div className="pr-2 sbm:pr-5">
				<div
					className={`w-full flex gap-2 sbm:gap-0 mb-3 sbm:mb-5 border-b border-gray-200 dark:border-gray-500 ${activeRole?.slug === `everyone-${activeRole?.clan_id}` ? 'justify-around' : 'justify-start sbm:justify-between'}`}
				>
					<button
						className={`py-[5px] px-1 sbm:px-0 text-[12px] sbm:text-[15px] text-left transition duration-300 rounded relative tracking-normal sbm:tracking-wider font-medium group flex-shrink ${isSelectDisplayTab ? 'text-theme-primary-active text-bold' : 'text-theme-primary'} `}
						onClick={() => {
							if (isSelectDisplayTab) return;
							handleButtonClick('Display');
							dispatch(toggleIsShowFalse());
						}}
						data-e2e={generateE2eId('clan_page.settings.role.container.role_option.display')}
					>
						{t('roleManagement.display')}
						<div className={`absolute inset-x-0 bottom-0 h-[2px] group-hover:bg-blue-300 ${isSelectDisplayTab ? 'bg-blue-400' : ''}`} />
					</button>

					<button
						className={`py-[5px] px-1 sbm:px-0 text-[12px] sbm:text-[15px] text-left transition duration-300 rounded relative tracking-normal sbm:tracking-wider font-medium group flex-shrink ${isSelectPermissionTab ? 'text-theme-primary-active text-bold' : 'text-theme-primary'}`}
						onClick={() => {
							if (isSelectPermissionTab) return;
							handleButtonClick('Permissions');
							dispatch(toggleIsShowFalse());
						}}
						data-e2e={generateE2eId('clan_page.settings.role.container.role_option.permissions')}
					>
						{t('roleManagement.permissions')}
						<div
							className={`absolute inset-x-0 bottom-0 h-[2px] group-hover:bg-blue-300 ${isSelectPermissionTab ? 'bg-blue-400' : ''}`}
						/>
					</button>
					{activeRole?.slug !== `everyone-${activeRole?.clan_id}` && (
						<button
							className={`py-[5px] px-1 sbm:px-0 text-[12px] sbm:text-[15px] text-left transition duration-300 rounded relative tracking-normal sbm:tracking-wider font-medium group flex-shrink min-w-0 ${isSelectManageTab ? 'text-theme-primary-active text-bold' : 'text-theme-primary'} `}
							onClick={() => {
								if (isSelectManageTab) return;
								handleButtonClick('Manage Members');
								dispatch(toggleIsShowFalse());
							}}
							data-e2e={generateE2eId('clan_page.settings.role.container.role_option.manage_members')}
						>
							<span className="sbm:whitespace-nowrap">
								{t('roleManagement.manageMembers')} ({roleUsersCount > 0 ? roleUsersCount : 0})
							</span>
							<div
								className={`absolute inset-x-0 bottom-0 h-[2px] group-hover:bg-blue-300 ${isSelectManageTab ? 'bg-blue-400' : ''}`}
							/>
						</button>
					)}
				</div>
			</div>

			{renderContent()}
		</>
	);
};

export default SettingValueDisplayRole;
