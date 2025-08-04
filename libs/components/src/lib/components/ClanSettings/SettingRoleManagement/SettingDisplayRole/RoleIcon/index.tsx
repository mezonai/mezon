import { useRoles } from '@mezon/core';
import {
	getNewAddMembers,
	getNewColorRole,
	getNewNameRole,
	getNewSelectedPermissions,
	getRemoveMemberRoles,
	getRemovePermissions,
	getSelectedRoleId,
	roleSlice,
	selectCurrentClanId,
	selectCurrentRoleIcon
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { useRef } from 'react';
import { useModal } from 'react-modal-hook';
import { useDispatch, useSelector } from 'react-redux';
import ChooseIconModal from './ChooseIconModal';

const RoleIcon = () => {
	const currentClanId = useSelector(selectCurrentClanId);
	const currentRoleId = useSelector(getSelectedRoleId);
	const currentRoleIcon = useSelector(selectCurrentRoleIcon);
	const nameRoleNew = useSelector(getNewNameRole);
	const colorRoleNew = useSelector(getNewColorRole);
	const newSelectedPermissions = useSelector(getNewSelectedPermissions);
	const removeMemberRoles = useSelector(getRemoveMemberRoles);
	const removePermissions = useSelector(getRemovePermissions);
	const newAddMembers = useSelector(getNewAddMembers);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const { updateRole } = useRoles();
	const dispatch = useDispatch();

	const [openChooseIconModal, closeChooseIconModal] = useModal(() => {
		return <ChooseIconModal onClose={closeChooseIconModal} />;
	}, []);

	const handleChooseIconModal = () => {
		openChooseIconModal();
	};

	const handleRemoveIcon = async () => {
		await updateRole(
			currentClanId || '',
			currentRoleId || '',
			nameRoleNew,
			colorRoleNew,
			newAddMembers,
			newSelectedPermissions,
			removeMemberRoles,
			removePermissions,
			''
		);
		dispatch(roleSlice.actions.setCurrentRoleIcon(''));
	};

	return (
		<div className="w-full flex flex-col text-[15px] dark:text-textSecondary text-textSecondary800 pr-5">
			<div className="border-t-[1px] h-4 dark:border-borderDividerLight"></div>
			<div className="text-xs font-bold uppercase mb-2">Role Icon</div>
			<div className="text-xs mb-2">
				Upload an image under 256 KB or pick a custom emoji from this clan. We recommended at least 64x64 pixels. Members will see the icon
				for their highest role if they have multiple roles
			</div>
			<div className={'flex items-start gap-5'}>
				{currentRoleIcon ? (
					<img src={currentRoleIcon} alt="" className={'w-20 h-20'} />
				) : (
						<div className={'bg-theme-setting-nav flex justify-center items-center w-20 h-20'}>
							<Icons.ImageUploadIcon className="w-6 h-6 text-theme-primary" />
					</div>
				)}
				<input type="file" className={'hidden'} ref={fileInputRef} />
				<button
					className={
						'flex justify-center items-center px-3 py-1 rounded border-[1px] ' +
						'dark:border-textSecondary border-textSecondary800 ' +
						'dark:hover:text-white dark:hover:border-white hover:text-black hover:border-black'
					}
					onClick={handleChooseIconModal}
				>
					Choose image
				</button>
				{currentRoleIcon && (
					<button
						className={
							'flex justify-center items-center px-3 py-1 rounded border-[1px] ' +
							'border-colorDanger hover:bg-colorDangerHover' +
							'hover:text-colorDangerHover text-colorDangerHover'
						}
						onClick={handleRemoveIcon}
					>
						Remove Icon
					</button>
				)}
			</div>
		</div>
	);
};

export default RoleIcon;
