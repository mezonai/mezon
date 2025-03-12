import { FRIEND_PAGE_LINK, toChannelPage, useAppNavigation } from '@mezon/core';
import { RootState, getStoreAsync, selectCurrentClanId, selectWelcomeChannelByClanId, toastActions } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { useDispatch } from 'react-redux';

type ModalUnknowChannelProps = {
	onClose?: () => void;
	isError?: boolean;
	errMessage?: string;
	idErr?: string;
};

function ModalUnknowChannel(props: ModalUnknowChannelProps) {
	const dispatch = useDispatch();
	const { onClose, isError = false, errMessage, idErr } = props;
	const { toClanPage, navigate } = useAppNavigation();
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

	return (
		<div className="w-[100vw] h-[100vh] overflow-hidden fixed top-0 left-0 z-[100] bg-black  flex flex-row justify-center items-center">
			<div className="w-fit h-fit dark:bg-bgPrimary bg-bgLightModeSecond rounded-lg flex-col justify-start  items-start gap-3 inline-flex overflow-hidden">
				<div className={`dark:text-white text-black ${isError ? 'w-[400px]' : ''} `}>
					<div className="p-4 relative">
						<div className="flex flex-col items-center gap-y-3 ">
							<Icons.IconClockChannel />
							{isError ? (
								<h5 className="font-bold text-2xl dark:text-white text-black w-full flex justify-center">
									{errMessage ? errMessage : 'Oops! Something Went Wrong'}
								</h5>
							) : (
								<>
									<h3 className="font-bold text-2xl dark:text-white text-black">You don't have access to this link.</h3>
									<p>This link is to a clan or channel you don't have access to.</p>
								</>
							)}
						</div>
						<span
							className="absolute top-3 right-2 text-5xl leading-3  dark:hover:text-white hover:text-black cursor-pointer"
							onClick={onCloseAndReset}
						>
							×
						</span>
					</div>
					<div className="w-full dark:bg-bgSecondary bg-bgLightSecondary p-4">
						{isError ? (
							<button
								className="px-4 py-2 hover:bg-opacity-85 rounded w-full bg-primary"
								onClick={() => directToWelcomeChannel()}
								style={{ color: 'white' }}
							>
								Direct to Welcome channel
							</button>
						) : (
							<button className="px-4 py-2 hover:bg-opacity-85 rounded w-full bg-primary" onClick={onClose} style={{ color: 'white' }}>
								Okay
							</button>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

export default ModalUnknowChannel;
