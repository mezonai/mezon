import {
	fetchListTransactionHistory,
	fetchTransactionDetail,
	selectAddress,
	selectCountWalletLedger,
	selectDetailTransaction,
	selectTransactionHistory,
	useAppDispatch,
	useAppSelector,
	walletLedgerActions
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { CURRENCY, formatBalanceToString } from '@mezon/utils';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import TransactionDetail from '../TransactionHistory/TransactionDetail';
import {
	API_FILTER_PARAMS,
	DATE_FORMAT,
	EMPTY_STATES,
	FilterType,
	HEADER,
	LIMIT_WALLET,
	TAB_LABELS,
	TRANSACTION_FILTERS,
	TRANSACTION_ITEM,
	TRANSACTION_TYPES
} from './constants/constants';

interface IProps {
	onClose: () => void;
}

const TransactionHistory = ({ onClose }: IProps) => {
	const dispatch = useAppDispatch();
	const walletLedger = useAppSelector((state) => selectTransactionHistory(state));
	const detailLedger = useAppSelector((state) => selectDetailTransaction(state));
	const count = useAppSelector((state) => selectCountWalletLedger(state));
	const walletAddress = useSelector(selectAddress);

	const [currentPage, setCurrentPage] = useState(1);
	const [activeFilter, setActiveFilter] = useState<FilterType>(TRANSACTION_FILTERS.ALL);
	const [openedTransactionId, setOpenedTransactionId] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const [isDetailLoading, setIsDetailLoading] = useState(false);
	const scrollContainerRef = useRef<HTMLDivElement>(null);

	const hasMoreData = currentPage * LIMIT_WALLET < (count || 0);

	const fetchTransactions = useCallback(
		async (filter: FilterType, page = 1, isLoadMore = false) => {
			isLoadMore ? setIsLoadingMore(true) : setIsLoading(true);
			try {
				await dispatch(
					fetchListTransactionHistory({
						address: walletAddress || '',
						page,
						filter: API_FILTER_PARAMS[filter]
					})
				);
			} catch (error) {
				console.error(`Error loading transactions:`, error);
			} finally {
				isLoadMore ? setIsLoadingMore(false) : setIsLoading(false);
			}
		},
		[dispatch]
	);

	const refreshData = () => {
		setCurrentPage(1);
		dispatch(walletLedgerActions.resetWalletLedger());
		fetchTransactions(activeFilter);
	};

	const loadMoreData = useCallback(() => {
		if (hasMoreData && !isLoadingMore && !isLoading) {
			const nextPage = currentPage + 1;
			setCurrentPage(nextPage);
			fetchTransactions(activeFilter, nextPage, true);
		}
	}, [activeFilter, currentPage, hasMoreData, isLoadingMore, isLoading, fetchTransactions]);

	useEffect(() => {
		fetchTransactions(activeFilter);
	}, [activeFilter]);

	// Infinite scroll handler
	const handleScroll = useCallback(() => {
		const container = scrollContainerRef.current;
		if (!container) return;

		const { scrollTop, scrollHeight, clientHeight } = container;
		const isNearBottom = scrollHeight - scrollTop <= clientHeight + 100; // 100px threshold

		if (isNearBottom) {
			loadMoreData();
		}
	}, [loadMoreData]);

	useEffect(() => {
		const container = scrollContainerRef.current;
		if (!container) return;

		container.addEventListener('scroll', handleScroll);
		return () => container.removeEventListener('scroll', handleScroll);
	}, [handleScroll]);

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		const day = date.getDate().toString().padStart(2, '0');
		const month = (date.getMonth() + 1).toString().padStart(2, '0');
		const year = date.getFullYear();
		const hours = date.getHours().toString().padStart(2, '0');
		const minutes = date.getMinutes().toString().padStart(2, '0');
		return `${day}${DATE_FORMAT.SEPARATOR}${month}${DATE_FORMAT.SEPARATOR}${year}${DATE_FORMAT.TIME_SEPARATOR}${hours}:${minutes}`;
	};

	const renderAmount = (amount: string, transactionId: string, fromAddress: string) => {
		const isOpened = openedTransactionId === transactionId;
		const isSender = walletAddress === fromAddress;

		const formattedAmount = formatBalanceToString(amount);
		if (isSender) {
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
						<p className="text-red-600 dark:text-red-400 font-semibold">{`- ${formattedAmount} ${CURRENCY.SYMBOL}`}</p>
						<p className="text-xs text-gray-500 dark:text-gray-400">{TRANSACTION_TYPES.SENT}</p>
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
					<p className="text-green-600 dark:text-green-400 font-semibold">{`+ ${formattedAmount} ${CURRENCY.SYMBOL}`}</p>
					<p className="text-xs text-gray-500 dark:text-gray-400">{TRANSACTION_TYPES.RECEIVED}</p>
				</div>
			</div>
		);
	};

	const toggleDetails = (txHash: string) => {
		setOpenedTransactionId(openedTransactionId === txHash ? null : txHash);
		if (openedTransactionId !== txHash) {
			setIsDetailLoading(true);
			dispatch(fetchTransactionDetail({ txHash })).finally(() => setIsDetailLoading(false));
		}
	};

	const getTransactionType = (amount: number) => (amount < 0 ? TRANSACTION_TYPES.SENT : TRANSACTION_TYPES.RECEIVED);

	const handleFilterChange = (filter: FilterType) => {
		if (activeFilter !== filter) {
			setActiveFilter(filter);
			setCurrentPage(1);
			// Reset wallet ledger data when changing filters
			dispatch(walletLedgerActions.resetWalletLedger());
		}
	};

	if (isLoading) {
		return (
			<div className="outline-none justify-center flex overflow-x-hidden items-center overflow-y-auto fixed inset-0 z-30 focus:outline-none bg-black bg-opacity-80 dark:text-white text-black hide-scrollbar overflow-hidden">
				<div className="relative w-full sm:h-auto rounded-xl max-w-[800px] mx-4">
					<div className="dark:bg-bgPrimary bg-bgLightMode rounded-t-xl border-b dark:border-gray-700 border-gray-200">
						<div className="flex items-center justify-between p-6 bg-theme-surface">
							<div className="flex items-center gap-3">
								<div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 flex items-center justify-center shadow-lg">
									<Icons.HistoryTransaction className="w-9 h-9 text-white" />
								</div>
								<div>
									<h4 className="text-theme-primary text-lg font-semibold">{HEADER.TITLE}</h4>
									<p className="dark:text-gray-400 text-gray-500 text-sm">{HEADER.SUBTITLE}</p>
								</div>
							</div>
							<div className="flex items-center gap-2">
								<button
									onClick={refreshData}
									className=" none-draggable-area text-theme-primary text-theme-primary-hover transition-colors p-2 rounded-lg hover:bg-gray-500/10 "
								>
									<Icons.ReloadIcon className="w-5 h-5 " />
								</button>
								<button
									onClick={onClose}
									className=" none-draggable-area text-theme-primary text-theme-primary-hover transition-colors p-2 rounded-lg hover:bg-gray-500/10 "
								>
									<Icons.Close className="w-5 h-5 " />
								</button>
							</div>
						</div>
					</div>
					<div className=" rounded-b-xl bg-theme-surface">
						<div className="px-6 pt-4 bg-theme-surface">
							<div className="flex gap-2 mb-4 border-b dark:border-gray-700 border-gray-200 pb-4">
								<button
									onClick={() => handleFilterChange(TRANSACTION_FILTERS.ALL)}
									className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors  ${
										activeFilter === TRANSACTION_FILTERS.ALL
											? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
											: 'dark:text-gray-400 text-gray-600  hover:bg-gray-300 hover:dark:bg-gray-100 '
									}`}
								>
									{TAB_LABELS.ALL}
								</button>
								<button
									onClick={() => handleFilterChange(TRANSACTION_FILTERS.SENT)}
									className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors  ${
										activeFilter === TRANSACTION_FILTERS.SENT
											? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
											: 'dark:text-gray-400 text-gray-600  hover:bg-gray-300 hover:dark:bg-gray-100'
									}`}
								>
									{TAB_LABELS.SENT}
								</button>
								<button
									onClick={() => handleFilterChange(TRANSACTION_FILTERS.RECEIVED)}
									className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors  ${
										activeFilter === TRANSACTION_FILTERS.RECEIVED
											? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
											: 'dark:text-gray-400 text-gray-600 hover:bg-gray-300 hover:dark:bg-gray-100 '
									}`}
								>
									{TAB_LABELS.RECEIVED}
								</button>
							</div>
						</div>
						<div className="px-6 pb-6 space-y-4 max-h-[450px] overflow-y-auto thread-scroll">
							{[...Array(TRANSACTION_ITEM.SKELETON_COUNT)].map((_, idx) => (
								<div key={idx} className="bg-item-theme rounded-lg hover:shadow-lg cursor-pointer border-theme-primary p-4">
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-4 w-full">
											<div className="flex items-center py-0.5 gap-2 w-full">
												<div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center animate-pulse"></div>
												<div className="w-full">
													<div className="h-4 w-[60%] mb-2 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
													<div className="h-4 w-[30%] bg-gray-300 dark:bg-gray-600 rounded mt-1 animate-pulse" />
												</div>
											</div>
										</div>
									</div>
								</div>
							))}
						</div>
						<div className="px-6 py-3 bg-theme-surface border-t dark:border-gray-700 border-gray-200 rounded-b-xl">
							<div className="flex justify-center items-center text-xs dark:text-gray-400 text-gray-500 h-[40px]">
								<div className="flex flex-col items-center gap-1">
									<div className="w-4 h-4 animate-spin rounded-full border-2 mb-1 border-gray-300 border-t-blue-500"></div>
									<span>Fetching transactions...</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}

	const currentData = walletLedger || [];

	return (
		<div className="outline-none justify-center flex overflow-x-hidden items-center overflow-y-auto fixed inset-0 z-30 focus:outline-none bg-black bg-opacity-80 dark:text-white text-black hide-scrollbar overflow-hidden">
			<div className="relative w-full sm:h-auto rounded-xl max-w-[800px] mx-4">
				<div className="dark:bg-bgPrimary bg-bgLightMode rounded-t-xl border-b dark:border-gray-700 border-gray-200">
					<div className="flex items-center justify-between p-6 bg-theme-surface">
						<div className="flex items-center gap-3">
							<div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 flex items-center justify-center shadow-lg">
								<Icons.HistoryTransaction className="w-9 h-9 text-white" />
							</div>
							<div>
								<h4 className="text-theme-primary text-lg font-semibold">{HEADER.TITLE}</h4>
								<p className="dark:text-gray-400 text-gray-500 text-sm">{HEADER.SUBTITLE}</p>
							</div>
						</div>
						<div className="flex items-center gap-2">
							<button
								onClick={refreshData}
								className=" none-draggable-area text-theme-primary text-theme-primary-hover transition-colors p-2 rounded-lg hover:bg-gray-500/10 "
							>
								<Icons.ReloadIcon className="w-5 h-5 " />
							</button>
							<button
								onClick={onClose}
								className=" none-draggable-area text-theme-primary text-theme-primary-hover transition-colors p-2 rounded-lg hover:bg-gray-500/10 "
							>
								<Icons.Close className="w-5 h-5 " />
							</button>
						</div>
					</div>
				</div>

				<div className=" rounded-b-xl bg-theme-surface">
					<div className="px-6 pt-4 bg-theme-surface">
						<div className="flex gap-2 mb-4 border-b dark:border-gray-700 border-gray-200 pb-4">
							<button
								onClick={() => handleFilterChange(TRANSACTION_FILTERS.ALL)}
								className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
									activeFilter === TRANSACTION_FILTERS.ALL ? 'bg-blue-100 text-blue-700 ' : 'text-theme-primary bg-item-theme-hover'
								}`}
							>
								{TAB_LABELS.ALL}
							</button>
							<button
								onClick={() => handleFilterChange(TRANSACTION_FILTERS.SENT)}
								className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
									activeFilter === TRANSACTION_FILTERS.SENT ? 'bg-red-100 text-red-700 ' : 'text-theme-primary bg-item-theme-hover'
								}`}
							>
								{TAB_LABELS.SENT}
							</button>
							<button
								onClick={() => handleFilterChange(TRANSACTION_FILTERS.RECEIVED)}
								className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
									activeFilter === TRANSACTION_FILTERS.RECEIVED
										? ' bg-green-100 text-green-700 '
										: 'text-theme-primary bg-item-theme-hover'
								}`}
							>
								{TAB_LABELS.RECEIVED}
							</button>
						</div>
					</div>
					{currentData.length ? (
						<>
							<div ref={scrollContainerRef} className="px-6 pb-6 space-y-4 h-[450px] overflow-y-auto thread-scroll">
								{currentData.length > 0 ? (
									<div className="space-y-4">
										{currentData.map((item, index) => (
											<div
												key={index}
												className=" bg-item-theme rounded-lg hover:shadow-lg cursor-pointer border-theme-primary"
												onClick={() => toggleDetails(item.hash ?? '')}
											>
												<div className="p-4">
													<div className="flex items-center justify-between">
														<div className="flex items-center gap-4">
															{renderAmount(item.value, item.hash ?? '', item.from_address ?? '')}
															<div className="flex flex-col">
																<div className="flex items-center gap-2">
																	<p className="text-theme-primary font-medium text-sm">
																		{TRANSACTION_ITEM.ID_PREFIX}
																		{item.hash?.slice(-TRANSACTION_ITEM.ID_LENGTH)}
																	</p>
																</div>
																<p className="dark:text-gray-400 text-gray-500 text-xs mt-1">
																	{formatDate(new Date((item.transaction_timestamp ?? 0) * 1000).toISOString())}
																</p>
															</div>
														</div>
													</div>
												</div>
												{openedTransactionId === item.hash && detailLedger && (
													<TransactionDetail
														detailLedger={detailLedger}
														formatDate={formatDate}
														isLoading={isDetailLoading}
													/>
												)}
											</div>
										))}
									</div>
								) : (
									!isLoading && (
										<div className="flex flex-col items-center justify-center py-12">
											<div className="w-16 h-16 rounded-full dark:bg-gray-700 bg-gray-100 flex items-center justify-center mb-4">
												<Icons.EmptyType />
											</div>
											<h3 className="text-theme-primary text-lg font-semibold mb-2">
												{activeFilter === TRANSACTION_FILTERS.ALL
													? EMPTY_STATES.NO_TRANSACTIONS.TITLE
													: EMPTY_STATES.NO_FILTERED_TRANSACTIONS.TITLE}
											</h3>
											<p className="dark:text-gray-400 text-gray-500 text-sm text-center max-w-sm">
												{activeFilter === TRANSACTION_FILTERS.ALL
													? EMPTY_STATES.NO_TRANSACTIONS.DESCRIPTION
													: EMPTY_STATES.NO_FILTERED_TRANSACTIONS.DESCRIPTION}
											</p>
										</div>
									)
								)}

								{/* Loading skeleton for infinite scroll */}
								{(isLoadingMore || isLoading) && (
									<div className="space-y-4">
										{[...Array(TRANSACTION_ITEM.SKELETON_COUNT)].map((_, idx) => (
											<div
												key={idx}
												className="bg-item-theme rounded-lg hover:shadow-lg cursor-pointer border-theme-primary p-4"
											>
												<div className="flex items-center justify-between">
													<div className="flex items-center gap-4 w-full">
														<div className="flex items-center py-0.5 gap-2 w-full">
															<div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center animate-pulse"></div>
															<div className="w-full">
																<div className="h-4 w-[60%] mb-2 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
																<div className="h-4 w-[30%] bg-gray-300 dark:bg-gray-600 rounded mt-1 animate-pulse" />
															</div>
														</div>
													</div>
												</div>
											</div>
										))}
									</div>
								)}
							</div>

							{/* Footer with scroll indicator - always visible */}
							<div className="px-6 py-3 bg-theme-surface border-t dark:border-gray-700 border-gray-200 rounded-b-xl">
								<div className="flex justify-center items-center text-xs dark:text-gray-400 text-gray-500 h-[40px]">
									{isLoading || isLoadingMore ? (
										<div className="flex flex-col items-center gap-1">
											<div className="w-4 h-4 animate-spin rounded-full border-2 mb-1 border-gray-300 border-t-blue-500"></div>
											<span>Fetching more transactions...</span>
										</div>
									) : hasMoreData ? (
										<div className="flex flex-col items-center gap-1">
											<Icons.ArrowDown className="w-4 h-4" />
											<span>Scroll down to show more</span>
										</div>
									) : (
										<span>You have loaded all of {currentData.length} transactions</span>
									)}
								</div>
							</div>
						</>
					) : (
						<div className="rounded-b-xl bg-theme-surface">
							<div className="flex flex-col items-center justify-center py-16 px-6">
								<div className="w-16 h-16 rounded-full dark:bg-gray-800 bg-gray-100 flex items-center justify-center mb-4">
									<Icons.EmptyType />
								</div>
								<h3 className="text-theme-primary text-lg font-semibold mb-2">{EMPTY_STATES.NO_TRANSACTIONS.TITLE}</h3>
								<p className="dark:text-gray-400 text-gray-500 text-sm text-center max-w-sm">
									{EMPTY_STATES.NO_TRANSACTIONS.DESCRIPTION}
								</p>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default TransactionHistory;
