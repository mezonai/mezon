import { useTranslation } from 'react-i18next';

interface ModalProps {
	onClose: () => void;
	handleDelete: () => void;
}

export const DeleteModal: React.FC<ModalProps> = ({ handleDelete, onClose }) => {
	const { t } = useTranslation('confirmations');
	return (
		<div className="fixed  inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
			<div className="relative z-10 bg-theme-setting-primary p-6 rounded-md text-center text-theme-primary">
				<h2 className="text-[30px] font-semibold mb-4">{t('deleteRole.title')}</h2>
				<p className="text-white-600 text-[16px] whitespace-break-spaces">
					{t('deleteRole.message')}
				</p>
				<div className="flex justify-center mt-10 text-[14px] gap-x-5">
					<button
						color="gray"
						onClick={onClose}
						className="px-4 py-2 bg-gray-300 text-gray-700 hover:bg-gray-400 focus:outline-none rounded-lg"
					>
						{t('deleteRole.cancel')}
					</button>
					<button
						color="blue"
						onClick={() => {
							handleDelete();
							onClose();
						}}
						className="px-4 py-2 btn-primary btn-primary-hover focus:outline-none  rounded-lg"
					>
						{t('deleteRole.confirm')}
					</button>
				</div>
			</div>
		</div>
	);
};
