import { fetchListWalletLedger, selectWalletLedger, selectWalletLedgerCursors, useAppDispatch, useAppSelector } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { formatNumber } from '@mezon/utils';

import { useEffect, useState } from 'react';

interface IProps {
	onClose: () => void;
}
const HistoryTransaction = ({ onClose }: IProps) => {
	const dispatch = useAppDispatch();
	const walletLedger = useAppSelector((state) => selectWalletLedger(state));
	const { nextCursor, prevCursor } = useAppSelector((state) => selectWalletLedgerCursors(state));
	const [selectedItem, setSelectedItem] = useState<string | null>(null);
	useEffect(() => {
		dispatch(fetchListWalletLedger({ cursor: undefined }));
	}, [dispatch]);
	const handleNextPage = () => {
		if (nextCursor) {
			dispatch(fetchListWalletLedger({ cursor: nextCursor }));
		}
	};

	const handlePrevPage = () => {
		if (prevCursor) {
			dispatch(fetchListWalletLedger({ cursor: prevCursor }));
		}
	};
	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		const day = date.getDate().toString().padStart(2, '0');
		const month = (date.getMonth() + 1).toString().padStart(2, '0');
		const year = date.getFullYear();
		return `${day}/${month}/${year}`;
	};
	const renderAmount = (amount: number) => {
		if (amount < 0) {
			return <p className="text-red-500 font-medium">{`${formatNumber(amount, 'vi-VN', 'VND')}`}</p>;
		}
		return <p className="text-green-500 font-medium">{`+${formatNumber(amount, 'vi-VN', 'VND')}`}</p>;
	};
	const toggleDetails = (transactionId: string) => {
		setSelectedItem(selectedItem === transactionId ? null : transactionId);
	};
	return (
		<div className="outline-none justify-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-30 focus:outline-none bg-black bg-opacity-80 dark:text-white text-black hide-scrollbar overflow-hidden">
			<div className={`relative w-full mt-[5%] sm:h-auto rounded-lg max-w-[600px] `}>
				<div className="rounded-t-lg text-sm overflow-hidden">
					<div className="dark:bg-[#1E1F22] bg-bgLightModeSecond dark:text-white text-black flex justify-between items-center p-6">
						<div>
							<h4 className="font-bold text-base">History Transaction</h4>
						</div>
						<span className="text-3xl leading-3 dark:hover:text-white hover:text-black" onClick={onClose}>
							×
						</span>
					</div>
				</div>
				{walletLedger?.length ? (
					<>
						<div>
							{walletLedger?.map((item, index) => {
								return (
									<div key={index} className="relative ">
										<div
											className="bg-white flex  border-b border-zinc-400 px-6 py-2 justify-between "
											onClick={() => toggleDetails(item.transaction_id ?? '')}
										>
											<div className=" flex flex-col gap-2">
												<p className="text-black">{formatDate(item.create_time ?? '')}</p>
												<div className="text-zinc-400 flex flex-row gap-1">
													<p className="">Transaction Code:</p>
													<p>{item.transaction_id}</p>
												</div>
											</div>
											<div className=" flex justify-center items-center ">{renderAmount(item.value ?? 0)}</div>
										</div>

										{selectedItem === item.transaction_id && (
											<div className="bg-gray-50 overflow-hidden transition-all duration-200">
												<div className="p-6 space-y-4 text-sm border-b border-zinc-400">
													<div className="grid grid-cols-2 gap-x-8 gap-y-4">
														<div>
															<p className="text-zinc-500 mb-1">ID</p>
															<p className="text-black font-medium">{item.id}</p>
														</div>
														<div>
															<p className="text-zinc-500 mb-1">User ID</p>
															<p className="text-black font-medium">{item.user_id}</p>
														</div>
														<div>
															<p className="text-zinc-500 mb-1">Transaction ID</p>
															<p className="text-black font-medium break-all">{item.transaction_id}</p>
														</div>

														<div>
															<p className="text-zinc-500 mb-1">Token</p>
															{renderAmount(item.value ?? 0)}
														</div>

														<div>
															<p className="text-zinc-500 mb-1">Transaction Time</p>
															<p className="text-black font-medium">{formatDate(item.create_time ?? '')}</p>
														</div>
													</div>
												</div>
											</div>
										)}
									</div>
								);
							})}
						</div>
						<div className="flex justify-end z-10">
							<div className="inline-flex mt-2 ">
								<button
									onClick={handlePrevPage}
									disabled={!prevCursor}
									className="flex items-center justify-center px-4  h-8 text-sm font-medium text-white bg-gray-800 rounded-s dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 enabled:dark:hover:bg-gray-700 enabled:dark:hover:text-white  enabled:hover:bg-gray-900 enabled:hover:text-white   disabled:cursor-not-allowed disabled:opacity-50 border border-zinc-400 "
								>
									<span>Prev</span>
								</button>
								<button
									onClick={handleNextPage}
									disabled={!nextCursor}
									className="flex items-center justify-center px-4  h-8 text-sm font-medium text-white bg-gray-800 rounded-e dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 enabled:dark:hover:bg-gray-700 enabled:dark:hover:text-white   enabled:hover:bg-gray-900 enabled:hover:text-white   disabled:cursor-not-allowed disabled:opacity-50 border border-zinc-400"
								>
									<span>Next</span>
								</button>
							</div>
						</div>
					</>
				) : (
					<div className="flex items-center justify-center bg-white  ">
						<div className="flex flex-col gap-1 py-20 items-center">
							<Icons.EmptyType />

							<h2 className="text-black ">No transaction</h2>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default HistoryTransaction;
