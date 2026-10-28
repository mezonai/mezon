import { FRIEND_PAGE_LINK, toMembersPage, useAppNavigation } from '@mezon/core';

import { selectAllChannels, selectCurrentClan, toastActions } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { generateE2eId } from '@mezon/utils';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

type ModalUnknowChannelProps = {
	onClose?: () => void;
	isError?: boolean;
	errMessage?: string;
	idErr?: string;
	errorType?: 'connection' | 'permission' | 'critical' | 'unknown';
};

const getErrorConfig = (errMessage?: string) => {
	const connectionKeywords = ['disconnect', 'socket', 'network', 'timeout', 'connection', 'reconnect'];
	const permissionKeywords = ['access', 'permission', 'denied', 'unauthorized', 'forbidden'];

	const message = typeof errMessage === 'string' ? errMessage : 'unknown error';
	let detectedType = '';

	if (connectionKeywords.some((keyword) => message.includes(keyword))) {
		detectedType = 'connection';
	} else if (permissionKeywords.some((keyword) => message.includes(keyword))) {
		detectedType = 'permission';
	} else {
		detectedType = 'unknown';
	}

	return {
		type: detectedType,
		shouldShowModal: detectedType === 'permission' || detectedType === 'critical',
		shouldShowPopover: detectedType === 'connection',
		shouldAutoRetry: detectedType === 'connection'
	};
};

function ModalUnknowChannel(props: ModalUnknowChannelProps) {
	const { t } = useTranslation('common');
	const dispatch = useDispatch();
	const { onClose, isError = false, errMessage, idErr } = props;
	const { navigate } = useAppNavigation();
	const currentClan = useSelector(selectCurrentClan);
	const allChannel = useSelector(selectAllChannels);
	const currentClanId = currentClan?.id;

	const errorConfig = getErrorConfig(errMessage);

	const removeToastError = () => {
		if (idErr) {
			dispatch(toastActions.removeToastError(idErr));
		}
	};

	const clearAllToastError = () => {
		dispatch(toastActions.clearAllToastErrors());
	};

	const goToWelcomeChannel = () => {
		clearAllToastError();
		if (!currentClanId || currentClanId === '0') {
			navigate(FRIEND_PAGE_LINK);
			return;
		}

		navigate(toMembersPage(currentClanId));
	};

	const onCloseAndReset = () => {
		if (isError) {
			removeToastError();
		}
		onClose?.();
		if (!currentClanId || currentClanId === '0') {
			navigate(FRIEND_PAGE_LINK);
			return;
		}
		if (!allChannel.length) {
			navigate(toMembersPage(currentClanId));
		}
	};

	if (errorConfig.type === 'connection') return null;

	return (
		<div className="fixed inset-0 z-[1000] flex items-center justify-center" data-e2e={generateE2eId('clan_page.settings.modal.permission')}>
			<div className="absolute inset-0 bg-black/10 backdrop-blur-sm transition-opacity" onClick={onCloseAndReset} />
			<div className="relative bg-theme-setting-primary border-theme-primary rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden animate-in zoom-in-95 duration-200">
				<div className="p-6 pt-8">
					<div className="flex flex-col items-center text-center space-y-4">
						<div className="flex items-center justify-center w-16 h-16 bg-[#5865f2]/20 rounded-full">
							<Icons.IconClockChannel />
						</div>

						{isError ? (
							<div className="space-y-2">
								<h3 className="text-xl font-semibold text-theme-primary-active">
									{String(errMessage)?.trim() || t('modalUnknowChannel.defaultError')}
								</h3>
								<p className="text-theme-primary text-sm leading-relaxed">
									{errorConfig.type === 'permission'
										? t('modalUnknowChannel.permissionError')
										: t('modalUnknowChannel.genericError')}
								</p>
							</div>
						) : (
							<div className="space-y-2">
								<h3 className="text-xl font-semibold text-theme-primary-active">{t('modalUnknowChannel.accessDenied')}</h3>
								<p className="text-theme-primary text-sm leading-relaxed">{t('modalUnknowChannel.accessDeniedDesc')}</p>
							</div>
						)}
					</div>
				</div>

				<div className="bg-theme-setting-nav px-6 py-4 flex gap-3">
					{isError ? (
						<>
							<button
								onClick={goToWelcomeChannel}
								className="flex-1 bg-[#5865f2] hover:bg-[#4752c4] text-white font-medium py-2.5 px-4 rounded transition-colors duration-200"
								data-e2e={generateE2eId('clan_page.settings.modal.permission.confirm')}
							>
								{currentClanId ? t('modalUnknowChannel.goToWelcomeChannel') : t('modalUnknowChannel.goToFriendPage')}
							</button>
							{currentClanId && (
								<button
									onClick={onCloseAndReset}
									className="px-4 py-2.5 text-theme-primary hover:underline rounded transition-colors duration-200"
									data-e2e={generateE2eId('clan_page.settings.modal.permission.cancel')}
								>
									{t('cancel')}
								</button>
							)}
						</>
					) : (
						<button
							onClick={onCloseAndReset}
							className="flex-1 bg-[#5865f2] hover:bg-[#4752c4] text-white font-medium py-2.5 px-4 rounded transition-colors duration-200"
						>
							{t('modalUnknowChannel.okayGotIt')}
						</button>
					)}
				</div>
			</div>
		</div>
	);
}

export default ModalUnknowChannel;
