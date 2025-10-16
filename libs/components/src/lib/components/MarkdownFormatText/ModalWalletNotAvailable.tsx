import { toastActions, useWallet } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

type ModalWalletNotAvailableProps = {
	onClose?: () => void;
	isError?: boolean;
	errMessage?: string;
	idErr?: string;
};

function ModalWalletNotAvailable(props: ModalWalletNotAvailableProps) {
	const dispatch = useDispatch();
	const { onClose, isError = false, errMessage, idErr } = props;
	const { t } = useTranslation(['message']);
	const { enableWallet } = useWallet();

	const removeToastError = () => {
		if (idErr) {
			dispatch(toastActions.removeToastError(idErr));
		}
	};

	const handleEnableWallet = async () => {
		await enableWallet();
		onCloseAndReset();
	};

	const onCloseAndReset = () => {
		if (isError) {
			removeToastError();
		}
		onClose?.();
	};

	return (
		<div className="fixed inset-0 z-[1000] flex items-center justify-center">
			<div className="absolute inset-0 bg-black/10 backdrop-blur-sm transition-opacity" onClick={onCloseAndReset} />
			<div className="relative bg-theme-setting-primary border-theme-primary rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden animate-in zoom-in-95 duration-200">
				<div className="p-6 pt-8">
					<div className="flex flex-col items-center text-center space-y-4">
						<div className="flex items-center justify-center w-16 h-16 bg-[#5865f2]/20 rounded-full">
							<Icons.IconClockChannel />
						</div>

						<div className="space-y-2">
							<h3 className="text-xl font-semibold text-theme-primary-active">{errMessage || 'Oops! Something Went Wrong'}</h3>
							<p className="text-theme-primary text-sm leading-relaxed">{t('wallet.descNotAvailable')}</p>
						</div>
					</div>
				</div>

				<div className="bg-theme-setting-nav px-6 py-4 flex gap-3">
					<>
						<button
							onClick={handleEnableWallet}
							className="flex-1 bg-[#5865f2] hover:bg-[#4752c4] text-white font-medium py-2.5 px-4 rounded transition-colors duration-200"
						>
							{t('wallet.enableWallet')}
						</button>
						<button
							onClick={onCloseAndReset}
							className="px-4 py-2.5 text-theme-primary hover:underline rounded transition-colors duration-200"
						>
							{t('wallet.cancel')}
						</button>
					</>
				</div>
			</div>
		</div>
	);
}

export default ModalWalletNotAvailable;
