import { useClanOwner, useUserPolicy } from '@mezon/core';
import {
	RolesClanEntity,
	getNewColorRole,
	getNewNameRole,
	getNewSelectedPermissions,
	getSelectedRoleId,
	selectCurrentClan,
	setAddPermissions,
	setRemovePermissions,
	setSelectedPermissions,
	toggleIsShowFalse,
	toggleIsShowTrue
} from '@mezon/store';
import { InputField } from '@mezon/ui';
import { EVERYONE_ROLE_ID, SlugPermission } from '@mezon/utils';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

export type ModalSettingSave = {
	flagOption: boolean;
	handleClose: () => void;
	handleSaveClose: () => void;
	handleUpdateUser: () => void;
};

const SettingPermissions = ({ RolesClan, hasPermissionEdit }: { RolesClan: RolesClanEntity[]; hasPermissionEdit: boolean }) => {
	const dispatch = useDispatch();
	const { t } = useTranslation('clanRoles');
	const currentClan = useSelector(selectCurrentClan);
	const { permissionsDefault } = useUserPolicy(currentClan?.id || '');
	const clickRole = useSelector(getSelectedRoleId);
	const [searchTerm, setSearchTerm] = useState('');
	const selectedPermissions = useSelector(getNewSelectedPermissions);
	const nameRole = useSelector(getNewNameRole);
	const colorRole = useSelector(getNewColorRole);

	const activeRole = RolesClan.find((role) => role.id === clickRole);
	const permissionsRole = activeRole?.permission_list;
	const permissions = useMemo(() => permissionsRole?.permissions?.filter((permission) => permission.active === 1) || [], [permissionsRole]);
	const permissionIds = useMemo(() => permissions.map((permission) => permission.id) || [], [permissions]);

	const [searchResults, setSearchResults] = useState<typeof permissionsDefault>([]);

	useEffect(() => {
		const results = permissionsDefault.filter((permission) => permission.slug?.toLowerCase().includes(searchTerm.toLowerCase()));
		setSearchResults(results);
	}, [searchTerm, permissionsDefault]);

	const handlePermissionToggle = (permissionId: string) => {
		const isSelected = selectedPermissions.includes(permissionId);
		const newPermissions = isSelected ? selectedPermissions.filter((id) => id !== permissionId) : [...selectedPermissions, permissionId];
		dispatch(setSelectedPermissions(newPermissions));

		const newActivePermissionIds = newPermissions.filter((permissionId) => !permissionIds.includes(permissionId));
		const newRemovePermissionIds = permissionIds.filter((id) => id !== undefined && !newPermissions.includes(id));
		dispatch(setAddPermissions(newActivePermissionIds));
		dispatch(setRemovePermissions(newRemovePermissionIds));
	};

	useEffect(() => {
		const isSamePermissions =
			selectedPermissions.length === permissionIds.length && selectedPermissions.every((id) => permissionIds.includes(id));

		if (nameRole !== activeRole?.title || colorRole !== activeRole?.color || !isSamePermissions) {
			dispatch(toggleIsShowTrue());
		} else {
			dispatch(toggleIsShowFalse());
		}
	}, [nameRole, colorRole, selectedPermissions, activeRole, permissionIds, dispatch]);

	const isClanOwner = useClanOwner();
	const hiddenPermissionAdmin = (slug: string) => {
		if (isClanOwner) {
			return false;
		}
		return slug === SlugPermission.Admin && hasPermissionEdit;
	};

	const getPermissionDescription = (slug: string) => {
		return t(`permissionDescriptions.${slug}`, { defaultValue: '' });
	};

	return (
		<div className="pr-5">
			<div className="w-full flex">
				<InputField
					className="flex-grow  text-[15px] w-full p-[7px] border-theme-primary font-normal bg-input-secondary rounded-lg"
					type="text"
					placeholder={t('roleManagement.searchPermissions')}
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
				/>
			</div>
			<br />
			<div>
				<ul className="flex flex-col gap-y-[10px]">
					{searchResults.map((permission) => (
						<li
							key={permission.id}
							className={`flex items-start justify-between p-3 rounded-lg border border-color-theme ${hasPermissionEdit && clickRole !== EVERYONE_ROLE_ID ? 'cursor-pointer bg-item-hover' : 'cursor-not-allowed bg-item-hover'}`}
						>
							<div className="flex-1 pr-4">
								<div className="font-medium text-theme-primary-active mb-1">{permission.title}</div>
								<div className="text-xs text-theme-primary">
									{permission.slug
										? getPermissionDescription(permission.slug)
										: t('permissionDescriptions.notAvailable', { defaultValue: 'Permission description not available' })}
								</div>
							</div>
							<label className="flex-shrink-0">
								<input
									type="checkbox"
									checked={selectedPermissions.includes(permission.id)}
									onChange={() => {
										if (hasPermissionEdit && clickRole !== EVERYONE_ROLE_ID) {
											handlePermissionToggle(permission.id);
										}
									}}
									className={`peer relative h-4 w-8 cursor-pointer appearance-none rounded-lg
										bg-slate-300 transition-colors after:absolute after:top-0 after:left-0 after:h-4 after:w-4 after:rounded-full
										after:bg-slate-500 after:transition-all
										checked:bg-[#5265EC] checked:after:left-4 checked:after:bg-white
										${clickRole !== EVERYONE_ROLE_ID ? 'hover:bg-slate-400 after:hover:bg-slate-600 checked:hover:bg-[#4654C0] checked:after:hover:bg-white' : ''}
										focus:outline-none focus-visible:outline-none disabled:cursor-not-allowed
									`}
									disabled={hiddenPermissionAdmin(permission.slug || '') || !hasPermissionEdit || clickRole === EVERYONE_ROLE_ID}
								/>
							</label>
						</li>
					))}
				</ul>
			</div>
		</div>
	);
};

export default SettingPermissions;
