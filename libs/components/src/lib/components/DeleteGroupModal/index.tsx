import type { DirectEntity } from '@mezon/store';
import { useTranslation } from 'react-i18next';

interface DeleteGroupModalProps {
	onClose: () => void;
	groupWillBeDeleted: DirectEntity;
	onConfirmDelete: () => void;
}

function DeleteGroupModal({ groupWillBeDeleted, onClose, onConfirmDelete }: DeleteGroupModalProps) {
	const { t } = useTranslation('deleteGroup');

	const handleDeleteAndClose = (e: React.MouseEvent<HTMLDivElement>) => {
		e.stopPropagation();
		onConfirmDelete();
		onClose();
	};

	return (
		<div className="fixed inset-0 flex items-center justify-center z-50">
			<div className="fixed inset-0 bg-black opacity-80"></div>
			<form className="relative z-10 bg-theme-setting-primary rounded-[5px] w-[500px]">
				<div className="top-block p-[16px] text-theme-primary-active flex flex-col gap-[15px]">
					<div className="text-xl font-semibold break-words whitespace-normal overflow-wrap-break-word">
						{t('title', { groupName: groupWillBeDeleted?.channel_label })}
					</div>
					<div className="text-lg break-all">{t('confirmMessage', { groupName: groupWillBeDeleted?.channel_label })}</div>
				</div>
				<div className="bottom-block flex justify-end p-[16px] items-center gap-[20px] font-semibold rounded-[5px] bg-theme-setting-nav">
					<div onClick={onClose} className="cursor-pointer hover:underline text-theme-primary">
						{t('cancel')}
					</div>
					<div onClick={handleDeleteAndClose} className="bg-[#da373c] text-white hover:bg-[#a12828] rounded-md px-4 py-2 cursor-pointer">
						{t('deleteGroup')}
					</div>
				</div>
			</form>
		</div>
	);
}

export default DeleteGroupModal;
