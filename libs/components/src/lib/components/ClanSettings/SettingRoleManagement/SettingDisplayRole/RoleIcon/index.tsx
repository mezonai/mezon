import { useRoles } from '@mezon/core';
import {
	getNewColorRole,
	getNewNameRole,
	getNewRoleIcon,
	getNewSelectedPermissions,
	getRemoveMemberRoles,
	getRemovePermissions,
	getSelectedRoleId,
	roleSlice,
	selectCurrentClanId,
	selectCurrentRoleIcon
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useModal } from 'react-modal-hook';
import { useDispatch, useSelector } from 'react-redux';
import ChooseIconModal from './ChooseIconModal';

const RoleIcon = () => {
	const { t } = useTranslation('clanRoles');
	const currentClanId = useSelector(selectCurrentClanId);
	const currentRoleId = useSelector(getSelectedRoleId);
	const newRoleIcon = useSelector(getNewRoleIcon);
	const currentRoleIcon = useSelector(selectCurrentRoleIcon);
	const nameRoleNew = useSelector(getNewNameRole);
	const colorRoleNew = useSelector(getNewColorRole);
	const newSelectedPermissions = useSelector(getNewSelectedPermissions);
	const removeMemberRoles = useSelector(getRemoveMemberRoles);
	const removePermissions = useSelector(getRemovePermissions);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const { updateRole } = useRoles();
	const dispatch = useDispatch();

	const [openChooseIconModal, closeChooseIconModal] = useModal(() => {
		return <ChooseIconModal onClose={closeChooseIconModal} />;
	}, []);
	const iconRole = useMemo<string | null>(() => newRoleIcon || currentRoleIcon || '', [newRoleIcon, currentRoleIcon]);

	const handleChooseIconModal = () => {
		openChooseIconModal();
	};

	const handleRemoveIcon = async () => {
		dispatch(roleSlice.actions.setNewRoleIcon(''));
		dispatch(roleSlice.actions.setCurrentRoleIcon(''));

		await updateRole(
			currentClanId || '',
			currentRoleId || '',
			nameRoleNew,
			colorRoleNew,
			[],
			newSelectedPermissions,
			removeMemberRoles,
			removePermissions,
			''
		);
	};

	return (
		<div className="w-full flex flex-col text-[15px] dark:text-textSecondary text-textSecondary800 pr-5">
			<div className="border-t-[1px] h-4 dark:border-borderDividerLight"></div>
			<div className="text-xs font-bold uppercase mb-2">{t('roleManagement.roleIcon')}</div>
			<div className="text-xs mb-2">{t('roleManagement.roleIconDescription')}</div>
			<div className={'flex items-start gap-5'}>
				{iconRole ? (
					<img src={iconRole || ''} alt="" className={'w-20 h-20'} />
				) : (
					<div className={'bg-theme-setting-nav flex justify-center items-center w-20 h-20'}>
						<Icons.ImageUploadIcon className="w-6 h-6 text-theme-primary" />
					</div>
				)}
				<input type="file" className={'hidden'} ref={fileInputRef} />
				<button
					className={
						'flex justify-center items-center px-3 py-1 rounded border-[1px] ' +
						'border-theme-primary ' +
						'text-theme-primary-active bg-item-theme-hover'
					}
					onClick={handleChooseIconModal}
				>
					{t('roleManagement.chooseImage')}
				</button>
				{iconRole && (
					<button
						className={
							'flex justify-center items-center px-3 py-1 rounded border-[1px] ' +
							'border-colorDanger hover:bg-colorDangerHover' +
							'hover:text-colorDangerHover text-colorDangerHover'
						}
						onClick={handleRemoveIcon}
					>
						{t('roleManagement.removeIcon')}
					</button>
				)}
			</div>
		</div>
	);
};

export default RoleIcon;
