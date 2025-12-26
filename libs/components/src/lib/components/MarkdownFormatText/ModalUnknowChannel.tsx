import { FRIEND_PAGE_LINK, toChannelPage, useAppNavigation } from '@mezon/core';

import type { RootState } from '@mezon/store';
import { getStoreAsync, selectClanById, selectCurrentClanId, selectWelcomeChannelByClanId, toastActions } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { generateE2eId } from '@mezon/utils';
import { useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';

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

	const message = errMessage?.toLowerCase() || '';
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
	const dispatch = useDispatch();
	const { onClose, isError = false, errMessage, idErr } = props;
	const { toClanPage, navigate } = useAppNavigation();
	const location = useLocation();

	const errorConfig = getErrorConfig(errMessage);

	const removeToastError = () => {
		if (idErr) {
			dispatch(toastActions.removeToastError(idErr));
		}
	};

	const clearAllToastError = () => {
		dispatch(toastActions.clearAllToastErrors());
	};

	const directToWelcomeChannel = async () => {
		clearAllToastError();
		const store = await getStoreAsync();
		const currentClanId = selectCurrentClanId(store.getState() as RootState);
		if (!currentClanId || currentClanId === '0') {
			navigate(FRIEND_PAGE_LINK);
			return;
		}

		const currentClan = selectClanById(currentClanId)(store.getState() as RootState);
		if (!currentClan) {
			const isFirstEntry = location.key === 'default' || (typeof window !== 'undefined' && (window.history.state?.idx ?? 0) === 0);
			if (isFirstEntry) {
				navigate(FRIEND_PAGE_LINK);
			} else {
				navigate(-1);
			}
			return;
		}
		const welcomeChannelId = selectWelcomeChannelByClanId(store.getState(), currentClanId);

		if (welcomeChannelId) {
			navigate(toClanPage(currentClanId));
			navigate(toChannelPage(welcomeChannelId, currentClanId));
			return;
		}
	};

	const onCloseAndReset = () => {
		if (isError) {
			removeToastError();
		}
		onClose?.();
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
								<h3 className="text-xl font-semibold text-theme-primary-active">{errMessage || 'Oops! Something Went Wrong'}</h3>
								<p className="text-theme-primary text-sm leading-relaxed">
									{errorConfig.type === 'permission'
										? "You don't have the necessary permissions to access this content. Please contact an administrator if you believe this is an error."
										: "We encountered an issue while trying to access this content. Let's get you back on track."}
								</p>
							</div>
						) : (
							<div className="space-y-2">
								<h3 className="text-xl font-semibold text-theme-primary-active">Access Denied</h3>
								<p className="text-theme-primary text-sm leading-relaxed">
									You don't have permission to access this channel or clan. Please check with the server administrator if you
									believe this is an error.
								</p>
							</div>
						)}
					</div>
				</div>

				<div className="bg-theme-setting-nav px-6 py-4 flex gap-3">
					{isError ? (
						<>
							<button
								onClick={directToWelcomeChannel}
								className="flex-1 bg-[#5865f2] hover:bg-[#4752c4] text-white font-medium py-2.5 px-4 rounded transition-colors duration-200"
								data-e2e={generateE2eId('clan_page.settings.modal.permission.confirm')}
							>
								Go to Welcome Channel
							</button>
							<button
								onClick={onCloseAndReset}
								className="px-4 py-2.5 text-theme-primary hover:underline rounded transition-colors duration-200"
								data-e2e={generateE2eId('clan_page.settings.modal.permission.cancel')}
							>
								Cancel
							</button>
						</>
					) : (
						<button
							onClick={onCloseAndReset}
							className="flex-1 bg-[#5865f2] hover:bg-[#4752c4] text-white font-medium py-2.5 px-4 rounded transition-colors duration-200"
						>
							Okay, Got It
						</button>
					)}
				</div>
			</div>
		</div>
	);
}

export default ModalUnknowChannel;
