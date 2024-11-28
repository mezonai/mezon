import { Icons } from '@mezon/ui';

interface IProp {
	onClose: () => void;
	onWalletConfirm: () => Promise<JSX.Element | undefined>;
}
const WalletConfirm = ({ onClose, onWalletConfirm }: IProp) => {
	const handleWalletConfirm = () => {
		onWalletConfirm();
		onClose();
	};
	return (
		<div
			id="crypto-modal"
			tabIndex={-1}
			className="bg-black bg-opacity-80 overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 justify-center  w-full md:inset-0 h-[calc(100%-1rem)] max-h-full flex"
		>
			<div className="relative p-4 w-full max-w-md max-h-full top-[24%]">
				<div className="relative bg-white rounded-lg shadow dark:bg-gray-700">
					<div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600">
						<h3 className="text-lg font-semibold text-gray-900 dark:text-white">Connect wallet</h3>
						<button
							type="button"
							className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm h-8 w-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
							data-modal-toggle="crypto-modal"
							onClick={onClose}
						>
							<svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
								<path
									stroke="currentColor"
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth="2"
									d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
								/>
							</svg>
							<span className="sr-only">Close modal</span>
						</button>
					</div>

					<div className="p-4 md:p-5">
						<p className="text-sm font-normal text-gray-500 dark:text-gray-400">
							Connect with one of our available wallet providers or create a new one.
						</p>

						<div className="my-5 space-y-4">
							<div
								onClick={handleWalletConfirm}
								className="flex flex-1 flex-row justify-between p-3 text-base font-bold text-gray-900 rounded-lg bg-gray-50 hover:bg-gray-100 group hover:shadow dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white"
							>
								<div className="flex  gap-1 items-center ">
									<Icons.MetaMaskIcon className="h-4" />
									<span className="flex-1 ms-3 whitespace-nowrap">Meta Mask</span>
								</div>
								<span className="inline-flex items-center justify-center px-2 py-0.5 ms-3 text-xs font-medium text-gray-500 bg-gray-200 rounded dark:bg-gray-700 dark:text-gray-400">
									Popular
								</span>
							</div>
						</div>
						<div className="relative group flex flex-1">
							<p className="inline-flex items-center text-xs font-normal text-gray-500 hover:underline dark:text-gray-400 flex-1">
								<Icons.QuestionCircle className="h-3 mr-1" />
								Why do I need to connect with my wallet?
							</p>
							<span className="absolute hidden group-hover:block w-full  p-2 text-xs text-white bg-gray-800 rounded-lg shadow-lg top-full mt-2 left-0">
								Connecting your wallet ensures the system can accurately determine the wallet address for receiving funds or
								performing secure transactions.
							</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default WalletConfirm;
