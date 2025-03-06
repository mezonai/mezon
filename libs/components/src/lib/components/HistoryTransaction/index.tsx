import {
	fetchDetailTransaction,
	fetchListWalletLedger,
	selectCountWalletLedger,
	selectDetailedger,
	selectWalletLedger,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { formatNumber } from '@mezon/utils';
import { Pagination } from 'flowbite-react';

import { useEffect, useState } from 'react';
const limitWallet = 8;

interface IProps {
	onClose: () => void;
}
const HistoryTransaction = ({ onClose }: IProps) => {
	const dispatch = useAppDispatch();
	const walletLedger = useAppSelector((state) => selectWalletLedger(state));
	const detailLedger = useAppSelector((state) => selectDetailedger(state));

	const count = useAppSelector((state) => selectCountWalletLedger(state));
	const [currentPage, setCurrentPage] = useState(1);
	const totalPages = count === undefined ? 0 : Math.ceil(count / limitWallet);
	const [openedTransactionId, setOpenedTransactionId] = useState<string | null>(null);
	useEffect(() => {
		dispatch(fetchListWalletLedger({ page: 1 }));
	}, [dispatch]);

	const onPageChange = (page: number) => {
		setCurrentPage(page);
		dispatch(fetchListWalletLedger({ page: page }));
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
			return <p className="text-red-500 font-bold">{`${formatNumber(amount, 'vi-VN', 'VND')}`}</p>;
		}
		return <p className="text-green-500 font-bold">{`+${formatNumber(amount, 'vi-VN', 'VND')}`}</p>;
	};
	const toggleDetails = (transactionId: string) => {
		setOpenedTransactionId(openedTransactionId === transactionId ? null : transactionId);
		if (openedTransactionId !== transactionId) {
			dispatch(fetchDetailTransaction({ transId: transactionId }));
		}
	};
	return (
		<div className="outline-none justify-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-30 focus:outline-none bg-black bg-opacity-80 dark:text-white text-black hide-scrollbar overflow-hidden">
			<div className={`relative w-full mt-[5%] sm:h-auto rounded-lg max-w-[600px] `}>
				<div className="rounded-t-lg text-sm overflow-hidden">
					<div className="dark:bg-[#1E1F22] bg-bgLightModeSecond dark:text-white text-black flex justify-between items-center p-4">
						<div>
							<h4 className="font-bold text-base">History Transaction</h4>
						</div>
						<span className="text-3xl leading-3 dark:hover:text-white hover:text-black" onClick={onClose}>
							×
						</span>
					</div>
				</div>
				{walletLedger?.length ? (
					<div className="dark:bg-bgPrimary bg-bgLightMode rounded-b-lg dark:text-textDarkTheme text-textLightTheme">
						<div>
							<div className="flex flex-row justify-between items-center px-4 h-[48px] shadow border-b-[1px] dark:border-bgTertiary">
								<div className="flex-[3] p-1 ">
									<span className="text-xs dark:text-textDarkTheme text-textLightTheme font-bold uppercase">Transaction Code</span>
								</div>
								<div className="flex-[3] p-1 text-center">
									<span className="text-xs dark:text-textDarkTheme text-textLightTheme font-bold uppercase">Time</span>
								</div>
								<div className="flex-[2] p-1 text-center">
									<span className="text-xs dark:text-textDarkTheme text-textLightTheme font-bold uppercase">Amount</span>
								</div>
							</div>
							<div className="flex flex-col overflow-y-auto px-4 py-2 shadow border-b-[1px] dark:border-bgTertiary border-t-[textSecondary]">
								{walletLedger?.map((item, index) => {
									return (
										<div key={index} className="relative dark:border-borderDivider border-buttonLightTertiary last:border-b-0">
											<div
												className="flex flex-row justify-between items-center h-[48px] border-b-[1px] dark:border-borderDivider border-buttonLightTertiary last:border-b-0 "
												onClick={() => toggleDetails(item.transaction_id ?? '')}
											>
												<div className="flex-[3] p-1 ">
													<span className="text-xs dark:text-textDarkTheme text-textLightTheme font-bold uppercase">
														{item.transaction_id}
													</span>
												</div>
												<div className="flex-[3] p-1 text-center">
													<span className="text-xs dark:text-textDarkTheme text-textLightTheme font-bold uppercase">
														{formatDate(item.create_time ?? '')}
													</span>
												</div>
												<div className="flex-[2] p-1 text-center">
													<span className="text-xs dark:text-textDarkTheme text-textLightTheme font-bold uppercase">
														{renderAmount(item.value ?? 0)}
													</span>
												</div>
											</div>
											{detailLedger && openedTransactionId === item.transaction_id && (
												<div className="bg-gray-50 p-4 rounded-lg shadow-md transition-all duration-300 ease-in-out ">
													<div className="grid grid-cols-2 gap-4 text-sm">
														{[
															{ label: 'TRANSACTION ID', value: detailLedger.trans_id },
															{ label: 'SENDER ID', value: detailLedger.sender_id },
															{ label: 'SENDER USERNAME', value: detailLedger.sender_username },
															{ label: 'RECEIVER ID', value: detailLedger.receiver_id },
															{ label: 'RECEIVER USERNAME', value: detailLedger.receiver_username },
															{ label: 'AMOUNT', value: detailLedger.amount },
															{ label: 'METADATA', value: detailLedger.metadata },
															{ label: 'TIME CREATE', value: formatDate(detailLedger.create_time ?? '') },
															{ label: 'TIME UPDATE', value: formatDate(detailLedger.update_time ?? '') }
														].map(({ label, value }) => (
															<div key={label} className="space-y-1">
																<p className="text-zinc-500 text-xs font-semibold uppercase">{label}</p>
																<p className="text-black font-medium break-all">{value}</p>
															</div>
														))}
													</div>
												</div>
											)}
										</div>
									);
								})}
							</div>
						</div>
						<div className="flex flex-row justify-end items-center px-4 h-[54px] border-t-[1px] dark:border-borderDivider border-buttonLightTertiary mb-2">
							<Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />
						</div>
					</div>
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
