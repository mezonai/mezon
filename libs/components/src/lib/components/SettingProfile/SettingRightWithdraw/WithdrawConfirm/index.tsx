import { Icons } from '@mezon/ui';
import { ChangeEvent, useState } from 'react';

interface IProp {
	onClose: () => void;
	onHandelConfirm: () => void;
	isLoading: boolean;
	address: string;
	coin: number;
}
const WithdrawConfirm = ({ onClose, onHandelConfirm, isLoading, address, coin }: IProp) => {
	const [isChecked, setIsChecked] = useState<boolean>(false);
	const handleChecked = (event: ChangeEvent<HTMLInputElement>) => {
		setIsChecked(event.target.checked);
	};
	return (
		<div
			id="popup-modal"
			tabIndex={-1}
			className=" bg-black bg-opacity-80 overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 justify-center items-center w-full md:inset-0 h-[calc(100%-1rem)] max-h-full flex flex-1"
		>
			<div className="relative p-4 w-full max-w-lg max-h-full">
				<div className="relative bg-white rounded-lg shadow dark:bg-gray-700">
					<button
						type="button"
						onClick={onClose}
						className="absolute top-3 end-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
						data-modal-hide="popup-modal"
					>
						<Icons.Close defaultSize="size-4" />
					</button>
					<div className="p-4 md:p-5 text-center gap-6 flex flex-col ">
						<Icons.InfoIcon className="mx-auto  text-orange-400 w-20 h-20 dark:text-orange-400" />
						<div className="flex flex-col gap-4 ">
							<p className="text-orange-400 font-semibold text-[16px] text-start ">Risk Warning:</p>
							<div className="flex flex-col justify-start">
								<p className="dark:text-white text-black text-[14px] text-start">
									1. After you have completed your withdrawal, all ownership of the assets will belong to the owner of the
									destination address. Please make sure you have entered the correct address.
								</p>
								<p className="dark:text-white text-black text-[14px] text-start">
									2. Make sure you fully understand how the assets are used and the possible risks involved, and be on the lookout
									for any form of pyramid schemes, illegal fundraising, scams, etc.
								</p>
							</div>
							<div className="flex flex-col justify-start">
								<p className="text-orange-400 text-[14px] font-semibold text-start">Info Transaction:</p>
								<div className="flex flex-row mt-2 ">
									<p className="dark:text-white text-black text-[14px] text-start text-nowrap">Wallet Address :</p>
									<p className="text-blue-500 text-[14px] text-start text-wrap ml-2 break-all">{address}</p>
								</div>
								<div className="flex flex-row ">
									<p className="dark:text-white text-black text-[14px] text-start">Withdraw :</p>
									<p className="text-blue-500 text-[14px] text-start ml-2">{coin} MZT</p>
								</div>
							</div>
							<div className="flex flex-row gap-1">
								<input
									onChange={(e) => handleChecked(e)}
									id="default-checkbox"
									type="checkbox"
									checked={isChecked}
									className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
								/>
								<p className="dark:text-white text-black text-[14px] text-start ml-2">
									I fully understand the potential risks involved in withdrawing assets and confirm that I wish to proceed with
									withdrawing my assets.
								</p>
							</div>
						</div>
						<div className="flex flex-row gap-3 justify-end">
							<button
								onClick={onClose}
								data-modal-hide="popup-modal"
								type="button"
								className="py-2.5 px-5 ms-3 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
							>
								No, cancel
							</button>
							<button
								disabled={isLoading || !isChecked}
								onClick={onHandelConfirm}
								data-modal-hide="popup-modal"
								type="button"
								className="px-4 py-2 text-sm font-medium text-white bg-blue-500 
            rounded-md hover:bg-blue-600 
            disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{isLoading ? 'Processing...' : `Confirm`}
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default WithdrawConfirm;
