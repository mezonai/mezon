import { useRoles } from '@mezon/core';
import {
	RolesClanEntity,
	getIsShow,
	getNewAddMembers,
	getNewAddPermissions,
	getNewColorRole,
	getNewNameRole,
	getRemovePermissions,
	getSelectedRoleId,
	selectCurrentClan,
	selectCurrentRoleIcon,
	setColorRoleNew,
	setNameRoleNew,
	setSelectedPermissions,
	setSelectedRoleId
} from '@mezon/store';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
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
		}
	};

	const handleUpdateUser = async (hasChangeRole?: boolean) => {
		if (isCreateNewRole) {
			const respond = await createRole(currentClan?.id || '', nameRole, colorRole, addUsers, addPermissions);
			if (!hasChangeRole) dispatch(setSelectedRoleId(respond?.id || ''));
		} else {
			await updateRole(currentClan?.id ?? '', clickRole, nameRole, colorRole, [], addPermissions, [], removePermissions, currentRoleIcon || '');
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
					<div className="font-semibold pl-3 dark:text-white text-black">
						{isCreateNewRole ? (
							<div className="tracking-wide text-base mb-4 pr-5">{t('roleManagement.newRole')}</div>
						) : (
							<div className="tracking-wide mb-4 text-base uppercase pr-5">
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
