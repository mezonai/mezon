import { getNewRoleIcon, roleSlice, selectCurrentRoleIcon } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useModal } from 'react-modal-hook';
import { useDispatch, useSelector } from 'react-redux';
import ChooseIconModal from './ChooseIconModal';

const RoleIcon = () => {
	const { t } = useTranslation('clanRoles');
	const newRoleIcon = useSelector(getNewRoleIcon);
	const currentRoleIcon = useSelector(selectCurrentRoleIcon);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const dispatch = useDispatch();

	const [openChooseIconModal, closeChooseIconModal] = useModal(() => {
		return <ChooseIconModal onClose={closeChooseIconModal} />;
	}, []);
	const iconRole = useMemo<string | null>(() => newRoleIcon || currentRoleIcon || '', [newRoleIcon, currentRoleIcon]);

	const handleChooseIconModal = () => {
		openChooseIconModal();
	};

	const handleRemoveIcon = () => {
		dispatch(roleSlice.actions.setNewRoleIcon(''));
		dispatch(roleSlice.actions.setCurrentRoleIcon(''));
	};

	return (
		<div className="w-full flex flex-col text-[15px] dark:text-textSecondary text-textSecondary800 pr-0 md:pr-5">
			<div className="border-t-[1px] h-4 dark:border-borderDividerLight"></div>
			<div className="text-xs font-bold uppercase mb-2">{t('roleManagement.roleIcon')}</div>
			<div className="text-xs mb-2">{t('roleManagement.roleIconDescription')}</div>
			<div className={'flex flex-col md:flex-row items-start gap-3 md:gap-5'}>
				{iconRole ? (
					<img src={iconRole || ''} alt="" className={'w-16 h-16 md:w-20 md:h-20'} />
				) : (
					<div className={'bg-theme-setting-nav flex justify-center items-center w-16 h-16 md:w-20 md:h-20'}>
						<Icons.ImageUploadIcon className="w-5 h-5 md:w-6 md:h-6 text-theme-primary" />
					</div>
				)}
				<input type="file" className={'hidden'} ref={fileInputRef} />
				<div className="flex flex-col md:flex-row gap-2 md:gap-0">
					<button
						className={
							'flex justify-center items-center px-3 py-1.5 md:py-1 rounded border-[1px] ' +
							'border-theme-primary ' +
							'text-theme-primary-active bg-item-theme-hover text-sm md:text-base'
						}
						onClick={handleChooseIconModal}
					>
						{t('roleManagement.chooseImage')}
					</button>
					{iconRole && (
						<button
							className={
								'flex justify-center items-center px-3 py-1.5 md:py-1 rounded border-[1px] ' +
								'border-colorDanger hover:bg-colorDangerHover ' +
								'hover:text-colorDangerHover text-colorDangerHover text-sm md:text-base md:ml-5'
							}
							onClick={handleRemoveIcon}
						>
							{t('roleManagement.removeIcon')}
						</button>
					)}
				</div>
			</div>
		</div>
	);
};

export default RoleIcon;
