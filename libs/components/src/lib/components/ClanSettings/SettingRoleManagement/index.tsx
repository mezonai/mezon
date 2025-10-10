import { useRoles } from '@mezon/core';
import type { RolesClanEntity } from '@mezon/store';
import {
	getIsShow,
	getNewAddMembers,
	getNewAddPermissions,
	getNewColorRole,
	getNewNameRole,
	getNewRoleIcon,
	getRemovePermissions,
	getSelectedRoleId,
	roleSlice,
	selectCurrentClan,
	selectCurrentRoleIcon,
	setColorRoleNew,
	setCurrentRoleIcon,
	setNameRoleNew,
	setSelectedPermissions,
	setSelectedRoleId
} from '@mezon/store';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { SettingUserClanProfileSave } from '../../SettingProfile/SettingRightClanProfile/SettingUserClanProfileSave';
import SettingListRole from './SettingListRole';
import SettingValueDisplayRole from './SettingOptionRole';
type EditNewRole = {
	flagOption: boolean;
	rolesClan: RolesClanEntity[];
	handleClose: () => void;
};
export type ModalSettingSave = {
	flagOption: boolean;
	handleClose: () => void;
	handleUpdateUser: () => Promise<void>;
};
const ServerSettingRoleManagement = (props: EditNewRole) => {
	const { t } = useTranslation('clanRoles');
	const { rolesClan, flagOption } = props;
	const { createRole, updateRole } = useRoles();
	const clickRole = useSelector(getSelectedRoleId);
	const nameRole = useSelector(getNewNameRole);
	const colorRole = useSelector(getNewColorRole);
	const addPermissions = useSelector(getNewAddPermissions);
	const removePermissions = useSelector(getRemovePermissions);
	const addUsers = useSelector(getNewAddMembers);
	const dispatch = useDispatch();
	const currentClan = useSelector(selectCurrentClan);
	const isChange = useSelector(getIsShow);
	const isCreateNewRole = clickRole === t('roleManagement.newRoleDefault');

	const newRoleIcon = useSelector(getNewRoleIcon);
	const currentRoleIcon = useSelector(selectCurrentRoleIcon);

	const handleClose = () => {
		if (isCreateNewRole) {
			props.handleClose();
		} else {
			const activeRole = rolesClan.find((role) => role.id === clickRole);

			const permissions = activeRole?.permission_list?.permissions;
			const permissionIds = permissions ? permissions.filter((permission) => permission.active === 1).map((permission) => permission.id) : [];
			dispatch(setNameRoleNew(activeRole?.title));
			dispatch(setColorRoleNew(activeRole?.color));
			dispatch(setSelectedPermissions(permissionIds));
			dispatch(setCurrentRoleIcon(activeRole?.role_icon || ''));
			dispatch(roleSlice.actions.setNewRoleIcon(''));
		}
	};

	const handleUpdateUser = async (hasChangeRole?: boolean) => {
		if (!nameRole || nameRole.trim() === '') {
			toast.error(t('roleManagement.roleNameIsRequired'));
			return;
		}
		if (isCreateNewRole) {
			const respond = await createRole(currentClan?.id || '', nameRole, colorRole, addUsers, addPermissions);
			if (!hasChangeRole) dispatch(setSelectedRoleId(respond?.id || ''));
		} else {
			const roleIcon = newRoleIcon || currentRoleIcon || '';
			await updateRole(currentClan?.id ?? '', clickRole, nameRole, colorRole, [], addPermissions, [], removePermissions, roleIcon);
			dispatch(roleSlice.actions.setCurrentRoleIcon(roleIcon));
			dispatch(roleSlice.actions.setNewRoleIcon(''));
		}
	};

	const saveProfile: ModalSettingSave = {
		flagOption: isChange,
		handleClose,
		handleUpdateUser
	};
	return flagOption ? (
		<>
			<div className="absolute top-0 left-0 w-full h-full pl-2 flex flex-row flex-1 shrink bg-theme-setting-primary overflow-hidden sbm:pt-[-60px] pt-[10px]">
				<SettingListRole handleClose={props.handleClose} RolesClan={rolesClan} handleUpdateUser={() => handleUpdateUser(true)} />
				<div className="w-2/3">
					<div className="font-semibold pl-3 text-theme-primary-active">
						{isCreateNewRole ? (
							<div className="tracking-wide text-theme-primary-active mb-4 pr-5">{t('roleManagement.newRole')}</div>
						) : (
							<div className="tracking-wide mb-4 text-theme-primary-active uppercase pr-5">
								{t('roleManagement.editRole')} - {nameRole}
							</div>
						)}
						<SettingValueDisplayRole RolesClan={rolesClan} />
					</div>
				</div>
				<SettingUserClanProfileSave PropsSave={saveProfile} />
			</div>
			<div className="border-l border-gray-200 dark:border-gray-500 h-screen absolute sbm:top-[-60px] top-[-10px] left-1/3" />
		</>
	) : null;
};

export default ServerSettingRoleManagement;
