import type { RolesClanEntity } from '@mezon/store';
import {
	getNewColorRole,
	getNewNameRole,
	getNewRoleIcon,
	getNewSelectedPermissions,
	getSelectedRoleId,
	setNameRoleNew,
	toggleIsShowFalse,
	toggleIsShowTrue
} from '@mezon/store';
import { InputField } from '@mezon/ui';
import { generateE2eId } from '@mezon/utils';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import RoleColor from './RoleColor';
import RoleIcon from './RoleIcon';

export type ModalSettingSave = {
	flagOption: boolean;
	handleClose: () => void;
	handleSaveClose: () => void;
	handleUpdateUser: () => void;
};

export const colorArray = [
	'#1abc9c',
	'#2ecc71',
	'#3498db',
	'#9b59b6',
	'#e91e63',
	'#f1c40f',
	'#e67e22',
	'#e74c3c',
	'#95a5a6',
	'#607d8b',
	'#11806a',
	'#1f8b4c',
	'#206694',
	'#71368a',
	'#ad1457',
	'#c27c0e',
	'#e84300',
	'#992d22',
	'#979c9f',
	'#546e7a'
];

const SettingDisplayRole = ({ RolesClan, hasPermissionEdit }: { RolesClan: RolesClanEntity[]; hasPermissionEdit: boolean }) => {
	const { t } = useTranslation('clanRoles');
	const nameRole = useSelector(getNewNameRole);
	const newRoleIcon = useSelector(getNewRoleIcon);
	const colorRole = useSelector(getNewColorRole);
	const selectedPermissions = useSelector(getNewSelectedPermissions);
	const clickRole = useSelector(getSelectedRoleId);
	const activeRole = RolesClan.find((role) => role.id === clickRole);
	const permissionsRole = activeRole?.permission_list;
	const permissions = permissionsRole?.permissions?.filter((permission) => permission.active === 1) || [];
	const permissionIds = permissions.map((permission) => permission.id) || [];
	const dispatch = useDispatch();

	const handleDisplayName = (event: React.ChangeEvent<HTMLInputElement>) => {
		dispatch(setNameRoleNew(event.target.value));
	};

	useEffect(() => {
		const isSamePermissions =
			selectedPermissions.length === permissionIds.length && selectedPermissions.every((id) => permissionIds.includes(id));

		if ((nameRole !== activeRole?.title && nameRole && nameRole.trim()) || colorRole !== activeRole?.color || !isSamePermissions || newRoleIcon) {
			dispatch(toggleIsShowTrue());
		} else {
			dispatch(toggleIsShowFalse());
		}
	}, [nameRole, colorRole, selectedPermissions, activeRole, permissionIds, dispatch, newRoleIcon]);

	return (
		<div className="grid grid-cols-1 gap-4">
			<div className="w-full flex flex-col text-[15px] pr-5" data-e2e={generateE2eId('clan_page.settings.role.container.name_input')}>
				<div className="text-xs font-bold uppercase text-theme-primary-active mb-2">
					{t('roleManagement.roleName')}
					<b className="text-red-600">*</b>
					{!nameRole && <b className="text-red-600 pl-2 font-normal capitalize">{t('roleManagement.roleNameIsRequired')}</b>}
				</div>

				<InputField
					needOutline={true}
					className={` text-[15px] w-full  p-[7px] font-normal border-theme-primary text-theme-message bg-input-secondary rounded-lg  focus:outline focus:outline-1  outline-[#006ce7] ${!hasPermissionEdit || activeRole?.slug === `everyone-${activeRole?.clan_id}` ? 'cursor-not-allowed' : ''}`}
					type="text"
					value={nameRole}
					onChange={handleDisplayName}
					maxLength={Number(process.env.NX_MAX_LENGTH_NAME_ALLOWED)}
					disabled={!hasPermissionEdit || activeRole?.slug === `everyone-${activeRole?.clan_id}`}
				/>
			</div>
			<RoleColor />
			<RoleIcon />
		</div>
	);
};

export default SettingDisplayRole;
