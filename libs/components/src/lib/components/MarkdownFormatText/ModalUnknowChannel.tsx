import { FRIEND_PAGE_LINK, toChannelPage, toMembersPage } from '@mezon/core';
import { RootState, getStoreAsync, selectCurrentClanId, selectWelcomeChannelByClanId, toastActions } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

type ModalUnknowChannelProps = {
	onClose: () => void;
	isError?: boolean;
};

function ModalUnknowChannel(props: ModalUnknowChannelProps) {
	const dispatch = useDispatch();
	const { onClose, isError = false } = props;
	const navigate = useNavigate();

	const resetErrorToastStatus = () => {
		dispatch(toastActions.setErrorToastStatus(false));
	};

	const directToWelcomeChannel = async () => {
		resetErrorToastStatus();

		const store = await getStoreAsync();
		const currentClanId = selectCurrentClanId(store.getState() as RootState);
		if (!currentClanId) {
			navigate(FRIEND_PAGE_LINK);
			return;
		}
		const welcomeChannelId = selectWelcomeChannelByClanId(store.getState(), currentClanId);

		if (welcomeChannelId) {
			navigate(toChannelPage(welcomeChannelId, currentClanId));
			return;
		}

		navigate(toMembersPage(currentClanId));
	};

	const onCloseAndReset = () => {
		onClose();
		if (isError) {
			resetErrorToastStatus();
		}
	};

	return (
		<div className="w-[100vw] h-[100vh] overflow-hidden fixed top-0 left-0 z-50 bg-black bg-opacity-80 flex flex-row justify-center items-center">
			<div className="w-fit h-fit dark:bg-bgPrimary bg-bgLightModeSecond rounded-lg flex-col justify-start  items-start gap-3 inline-flex overflow-hidden">
				<div className="dark:text-white text-black">
					<div className="p-4 relative">
						<div className="flex flex-col items-center gap-y-3 ">
							<Icons.IconClockChannel />
							{isError ? (
								<h3 className="font-bold text-2xl dark:text-white text-black">Oops! Something Went Wrong</h3>
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
