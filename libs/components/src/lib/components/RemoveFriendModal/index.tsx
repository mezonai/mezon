import { Trans, useTranslation } from 'react-i18next';
import ModalLayout from '../Modal';

type RemoveFriendModalProps = {
	username?: string;
	displayName?: string;
	onClose: () => void;
	onConfirm: () => void;
	isProcessing?: boolean;
};

const RemoveFriendModal = ({ username, displayName, onClose, onConfirm, isProcessing }: RemoveFriendModalProps) => {
	const { t } = useTranslation('friendsPage');
	const displayUsername = displayName || username || (t('friend') as string);

	return (
		<ModalLayout onClose={onClose}>
			<div className="bg-theme-setting-primary rounded-xl w-[420px] shadow-2xl">
				<div className="px-6 pt-6 pb-4">
					<h2 className="text-theme-primary-active text-xl font-semibold mb-2 truncate" title={displayUsername}>
						{t('removeFriendModal.title', { username: displayUsername })}
					</h2>
					<p className="text-theme-primary text-sm leading-6">
						<Trans
							i18nKey="removeFriendModal.description"
							ns="friendsPage"
							values={{ username: displayUsername }}
							components={{ bold: <span className="font-semibold text-theme-primary-active" /> }}
						/>
					</p>
				</div>
				<div className="flex justify-end gap-3 px-6 pb-6">
					<button
						type="button"
						className="min-w-[120px] h-10 px-4 rounded-md bg-button-secondary text-theme-primary hover:bg-item-hover transition-colors duration-150"
						onClick={onClose}
						data-e2e="friend_remove_modal.button.cancel"
					>
						{t('removeFriendModal.cancel')}
					</button>
					<button
						type="button"
						className="min-w-[120px] h-10 px-4 rounded-md bg-colorDanger text-white font-semibold hover:bg-colorDanger/80 transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
						onClick={onConfirm}
						disabled={isProcessing}
						data-e2e="friend_remove_modal.button.confirm"
					>
						{t('removeFriendModal.confirm')}
					</button>
				</div>
			</div>
		</ModalLayout>
	);
};

export default RemoveFriendModal;
