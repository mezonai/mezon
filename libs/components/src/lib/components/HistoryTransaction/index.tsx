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
import TransactionDetail from '../HistoryTransaction/TransactionDetail';
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
		const hours = date.getHours().toString().padStart(2, '0');
		const minutes = date.getMinutes().toString().padStart(2, '0');
		return `${day}/${month}/${year} ${hours}:${minutes}`;
	};

	const renderAmount = (amount: number, transactionId: string) => {
		const isOpened = openedTransactionId === transactionId;

		if (amount < 0) {
			return (
				<div className="flex items-center gap-2">
					<div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
						{isOpened ? (
							<Icons.ArrowDown className="w-4 h-4 text-red-600 dark:text-red-400 rotate-180" />
						) : (
							<Icons.ArrowRight className="w-4 h-4 text-red-600 dark:text-red-400" />
						)}
					</div>
					<div>
						<p className="text-red-600 dark:text-red-400 font-semibold">
							{`${formatNumber(Math.abs(amount), 'vi-VN')} đ`}
						</p>
						<p className="text-xs text-gray-500 dark:text-gray-400">Sent</p>
					</div>
				</div>
			);
		}

		return (
			<div className="flex items-center gap-2">
				<div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
					{isOpened ? (
						<Icons.ArrowDown className="w-4 h-4 text-green-600 dark:text-green-400 rotate-180" />
					) : (
						<Icons.ArrowRight className="w-4 h-4 text-green-600 dark:text-green-400" />
					)}
				</div>
				<div>
					<p className="text-green-600 dark:text-green-400 font-semibold">
						{`+${formatNumber(amount, 'vi-VN')} đ`}
					</p>
					<p className="text-xs text-gray-500 dark:text-gray-400">Received</p>
				</div>
			</div>
		);
	};

	const toggleDetails = (transactionId: string) => {
		setOpenedTransactionId(openedTransactionId === transactionId ? null : transactionId);
		if (openedTransactionId !== transactionId) {
			dispatch(fetchDetailTransaction({ transId: transactionId }));
		}
	};

	const getTransactionType = (amount: number) => {
		return amount < 0 ? 'Sent' : 'Received';
	};

	const getStatusBadge = (amount: number) => {
		return (
			<span
				className={`px-2 py-1 text-xs font-medium rounded-full ${amount < 0
					? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
					: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
					}`}
			>
				{getTransactionType(amount)}
			</span>
		);
	};

	if (!walletLedger) {
		return (
			<div className="outline-none justify-center flex overflow-x-hidden items-center overflow-y-auto fixed inset-0 z-30 focus:outline-none bg-black bg-opacity-80 dark:text-white text-black hide-scrollbar overflow-hidden">
				<div className="relative w-full sm:h-auto rounded-xl max-w-[800px] mx-4 ">
					<div className="dark:bg-bgPrimary bg-bgLightMode rounded-t-xl border-b dark:border-gray-700 border-gray-200">
						<div className="flex items-center justify-between p-6">
							<div className="flex items-center gap-3">
								<div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 flex items-center justify-center shadow-lg">
									<Icons.HistoryTransaction className="w-9 h-9 text-white" />
								</div>
								<div>
									<h4 className="dark:text-white text-gray-900 text-lg font-semibold">Transaction History</h4>
									<p className="dark:text-gray-400 text-gray-500 text-sm">View all your transaction activities</p>
								</div>
							</div>
							<div className="w-8 h-8" />
						</div>
					</div>
					<div className="dark:bg-bgPrimary bg-bgLightMode rounded-b-xl">
						<div className="p-6 space-y-4 max-h-[500px] overflow-y-auto thread-scroll">
							{[...Array(6)].map((_, idx) => (
								<div key={idx} className="dark:bg-gray-800 bg-white rounded-xl border dark:border-gray-700 border-gray-200 p-4 animate-pulse">
									<div className="flex items-center gap-4">
										<div className="w-8 h-8 rounded-full bg-gray-300" />
										<div className="flex-1 space-y-2">
											<div className="h-4 w-32 bg-gray-300 rounded" />
											<div className="h-3 w-24 bg-gray-300 rounded" />
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="outline-none justify-center flex overflow-x-hidden items-center overflow-y-auto fixed inset-0 z-30 focus:outline-none bg-black bg-opacity-80 dark:text-white text-black hide-scrollbar overflow-hidden">
			<div className="relative w-full sm:h-auto rounded-xl max-w-[800px] mx-4 ">
				<div className="dark:bg-bgPrimary bg-bgLightMode rounded-t-xl border-b dark:border-gray-700 border-gray-200">					<div className="flex items-center justify-between p-6">
						<div className="flex items-center gap-3">
						<div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 flex items-center justify-center shadow-lg">
							<Icons.HistoryTransaction className="w-9 h-9 text-white" />
							</div>
							<div>
							<h4 className="dark:text-white text-gray-900 text-lg font-semibold">Transaction History</h4>
							<p className="dark:text-gray-400 text-gray-500 text-sm">View all your transaction activities</p>
							</div>
						</div>
					<button
							onClick={onClose}
						className="dark:text-gray-400 text-gray-500 hover:dark:text-white hover:text-gray-900 transition-colors p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
						>
						<Icons.Close className="w-5 h-5" />
						</button>
					</div>
				</div>

				{walletLedger?.length ? (
					<div className="dark:bg-bgPrimary bg-bgLightMode rounded-b-xl">
						<div className="p-6 space-y-4 max-h-[500px]   overflow-y-auto thread-scroll">
							{walletLedger?.map((item, index) => (
								<div
									key={index}
									className="dark:bg-gray-800 bg-white rounded-xl border dark:border-gray-700 border-gray-200 hover:shadow-lg transition-all duration-200 cursor-pointer"
									onClick={() => toggleDetails(item.transaction_id ?? '')}
								>
									<div className="p-4">
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-4">
												{renderAmount(item.value ?? 0, item.transaction_id ?? '')}
												<div className="flex flex-col">
													<div className="flex items-center gap-2">
														<p className="dark:text-white text-gray-900 font-medium text-sm">
															Transaction #{item.transaction_id?.slice(-8)}
														</p>
														{getStatusBadge(item.value ?? 0)}
													</div>
													<p className="dark:text-gray-400 text-gray-500 text-xs mt-1">
														{formatDate(item.create_time ?? '')}
													</p>
												</div>
											</div>

										</div>
									</div>

									{detailLedger && openedTransactionId === item.transaction_id && (
										<TransactionDetail detailLedger={detailLedger} formatDate={formatDate} />
									)}
								</div>
							))}
						</div>

						{totalPages > 1 && (
							<div className="border-t dark:border-gray-700 border-gray-200 px-6 py-4 flex justify-center">
								<Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />
							</div>
						)}
					</div>
				) : (
						<div className="dark:bg-bgPrimary bg-bgLightMode rounded-b-xl">
							<div className="flex flex-col items-center justify-center py-16 px-6">
								<div className="w-16 h-16 rounded-full dark:bg-gray-800 bg-gray-100 flex items-center justify-center mb-4">
									<Icons.EmptyType />
								</div>
								<h3 className="dark:text-white text-gray-900 text-lg font-semibold mb-2">No Transactions Found</h3>
								<p className="dark:text-gray-400 text-gray-500 text-sm text-center max-w-sm">
									You haven't made any transactions yet. Your transaction history will appear here once you start sending or receiving
									tokens.
								</p>
							</div>
						</div>
				)}
			</div>
		</div>
	);
};

export default HistoryTransaction;
