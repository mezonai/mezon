import { useTranslation } from 'react-i18next';

interface ModalProps {
	onClose: () => void;
	handleDelete: () => void;
}

export const DeleteModal: React.FC<ModalProps> = ({ handleDelete, onClose }) => {
	const { t } = useTranslation('confirmations');

	return (
		<div className="fixed inset-0 flex items-center justify-center z-50" onClick={onClose}>
			<div className="fixed inset-0 bg-black opacity-80" />

			<div className="relative px-[16px] md:px-0 z-10 w-[440px]" onClick={(e) => e.stopPropagation()}>
				<div className="bg-theme-setting-primary pt-[16px] px-[16px] rounded-t-md text-theme-primary">
					<h2 className="text-[20px] font-semibold text-theme-primary-active pb-[16px]">{t('deleteRole.title')}</h2>
					<p className="pb-[20px] text-theme-primary text-[14px] whitespace-pre-line">{t('deleteRole.message')}</p>
				</div>

				<div className="bg-theme-setting-nav flex justify-end items-center gap-4 p-[16px] text-[14px] font-medium rounded-b-md">
					<div onClick={onClose} className="hover:underline px-4 rounded-lg text-theme-primary text-theme-primary-hover cursor-pointer">
						{t('deleteRole.cancel')}
					</div>
					<div
						onClick={() => {
							handleDelete();
							onClose();
						}}
						className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-[25px] py-[8px] cursor-pointer"
					>
						{t('deleteRole.confirm')}
					</div>
				</div>
			</div>
		</div>
	);
};
