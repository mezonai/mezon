import {
	fetchLoadMoreTransaction,
	fetchTransactionDetail,
	selectAddress,
	selectCountWalletLedger,
	selectDetailTransaction,
	selectTransactionHistory,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { formatBalanceToString } from '@mezon/utils';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import TransactionDetail from '../TransactionHistory/TransactionDetail';
import type { FilterType } from './constants/constants';
import {
	API_FILTER_PARAMS,
	CURRENCY,
	DATE_FORMAT,
	EMPTY_STATES,
	FOOTERS,
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
	const { t } = useTranslation('transactionHistory');
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

	const currentData = walletLedger || [];
	const hasData = currentData.length > 0;
	const hasMoreData = currentPage * LIMIT_WALLET < (count || 0);

	const fetchTransactions = useCallback(
		async (filter: FilterType, page = 1, isLoadMore = false) => {
			if (isLoadMore) {
				setIsLoadingMore(true);
			} else {
				setIsLoading(true);
			}

			try {
				const lastItem = page === 1 ? null : currentData[currentData.length - 1];

				await dispatch(
					fetchLoadMoreTransaction({
						address: walletAddress || '',
						filter: API_FILTER_PARAMS[filter],
						timeStamp: lastItem ? new Date(lastItem?.transaction_timestamp * 1000).toISOString() : undefined,
						lastHash: lastItem?.hash
					})
				);
			} catch (error) {
				console.error(`Error loading transactions:`, error);
			} finally {
				isLoadMore ? setIsLoadingMore(false) : setIsLoading(false);
			}
		},
		[dispatch, walletAddress, currentData]
	);

	const refreshData = () => {
		setCurrentPage(1);
		fetchTransactions(activeFilter, 1);
	};

	const loadMoreData = useCallback(() => {
		if (hasMoreData && !isLoadingMore && !isLoading) {
			const nextPage = currentPage + 1;
			setCurrentPage(nextPage);
			fetchTransactions(activeFilter, nextPage, true);
		}
	}, [activeFilter, currentPage, hasMoreData, isLoadingMore, isLoading, fetchTransactions]);

	useEffect(() => {
		fetchTransactions(activeFilter, 1);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [activeFilter]);

	// Infinite scroll handler
	const handleScroll = useCallback(() => {
		const container = scrollContainerRef.current;
		if (!container) return;

		const { scrollTop, scrollHeight, clientHeight } = container;
		const isNearBottom = scrollHeight - scrollTop <= clientHeight + 100;

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
						<p className="text-red-600 dark:text-red-400 font-semibold">{`- ${formattedAmount} ${t(CURRENCY.SYMBOL)}`}</p>
						<p className="text-xs text-gray-500 dark:text-gray-400">{t(TRANSACTION_TYPES.SENT)}</p>
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
					<p className="text-green-600 dark:text-green-400 font-semibold">{`+ ${formattedAmount} ${t(CURRENCY.SYMBOL)}`}</p>
					<p className="text-xs text-gray-500 dark:text-gray-400">{t(TRANSACTION_TYPES.RECEIVED)}</p>
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

	const handleFilterChange = (filter: FilterType) => {
		if (activeFilter !== filter) {
			setActiveFilter(filter);
		}
	};

	const renderSkeletons = () => (
		<div className="space-y-4 animate-pulse">
			{[...Array(TRANSACTION_ITEM.SKELETON_COUNT)].map((_, idx) => (
				<div key={idx} className="bg-item-theme rounded-lg border-theme-primary p-4 h-[84px] w-full">
					<div className="flex items-center gap-4 h-full">
						<div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700"></div>
						<div className="flex-1 space-y-2">
							<div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
							<div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
						</div>
					</div>
				</div>
			))}
		</div>
	);

	return (
		<div className="outline-none justify-center flex overflow-x-hidden items-center overflow-y-auto fixed inset-0 z-30 focus:outline-none bg-black bg-opacity-80 dark:text-white text-black hide-scrollbar overflow-hidden">
			<div className="relative w-full sm:h-auto rounded-xl max-w-[800px] mx-4 transition-all duration-300">
				<div className="dark:bg-bgPrimary bg-bgLightMode rounded-t-xl border-b dark:border-gray-700 border-gray-200">
					<div className="flex items-center justify-between p-6 bg-theme-surface rounded-t-lg">
						<div className="flex items-center gap-3">
							<div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 flex items-center justify-center shadow-lg">
								<Icons.HistoryTransaction className="w-9 h-9 text-white" />
							</div>
							<div>
								<h4 className="text-theme-primary text-lg font-semibold">{t(HEADER.TITLE)}</h4>
								<p className="dark:text-gray-400 text-gray-500 text-sm">{t(HEADER.SUBTITLE)}</p>
							</div>
						</div>
						<div className="flex items-center gap-2 text-theme-primary">
							<button onClick={refreshData} className="p-2 rounded-lg bg-item-theme-hover transition-colors">
								<Icons.ReloadIcon
									className={`w-5 h-5 
									 ${isLoading ? 'animate-spin' : ''}`}
								/>
							</button>
							<button onClick={onClose} className="p-2 rounded-lg  bg-item-theme-hover transition-colors">
								<Icons.Close className="w-5 h-5 " />
							</button>
						</div>
					</div>
				</div>

				<div className="rounded-b-xl bg-theme-surface">
					<div className="px-6 pt-4 bg-theme-surface">
						<div className="flex gap-2 mb-4 border-b dark:border-gray-700 border-gray-200 pb-4">
							{[
								{ type: TRANSACTION_FILTERS.ALL, label: TAB_LABELS.ALL, color: 'blue' },
								{ type: TRANSACTION_FILTERS.SENT, label: TAB_LABELS.SENT, color: 'red' },
								{ type: TRANSACTION_FILTERS.RECEIVED, label: TAB_LABELS.RECEIVED, color: 'green' }
							].map((tab) => (
								<button
									key={tab.type}
									onClick={() => handleFilterChange(tab.type as FilterType)}
									disabled={isLoading}
									className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
										activeFilter === tab.type
											? `bg-${tab.color}-100 text-${tab.color}-700 dark:bg-${tab.color}-900/30 dark:text-${tab.color}-400 shadow-sm`
											: 'text-theme-primary bg-item-theme-hover'
									}`}
								>
									{t(tab.label)}
								</button>
							))}
						</div>
					</div>

					<div ref={scrollContainerRef} className="px-6 pb-6 space-y-4 h-[450px] overflow-y-auto thread-scroll relative">
						{!hasData && isLoading ? (
							renderSkeletons()
						) : hasData ? (
							<div
								className={`space-y-4 transition-opacity duration-300 ease-in-out ${isLoading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}
							>
								{currentData.map((item, index) => (
									<div
										key={`${item.hash || index}-${index}`}
										className="bg-item-theme rounded-lg hover:shadow-lg cursor-pointer border-theme-primary transition-all duration-200"
										onClick={() => toggleDetails(item.hash ?? '')}
									>
										<div className="p-4">
											<div className="flex items-center justify-between">
												<div className="grid grid-cols-[225px_1fr] items-center w-full gap-4">
													<div className="flex items-center">
														{renderAmount(item.value, item.hash ?? '', item.from_address ?? '')}
													</div>
													<div className="flex flex-col items-start">
														<div className="flex items-center gap-2">
															<p className="text-theme-primary font-medium text-sm">
																{t(TRANSACTION_ITEM.ID_PREFIX)}
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
										<div
											className={`overflow-hidden transition-[max-height] duration-300 ease-in-out ${
												openedTransactionId === item.hash ? 'max-h-[500px]' : 'max-h-0'
											}`}
										>
											{openedTransactionId === item.hash && detailLedger && (
												<TransactionDetail detailLedger={detailLedger} formatDate={formatDate} isLoading={isDetailLoading} />
											)}
										</div>
									</div>
								))}
								{isLoadingMore && renderSkeletons()}
							</div>
						) : (
							!isLoading && (
								<div className="flex flex-col items-center justify-center py-12 h-full animate-fade-in">
									<div className="w-16 h-16 rounded-full dark:bg-gray-700 bg-gray-100 flex items-center justify-center mb-4">
										<Icons.EmptyType />
									</div>
									<h3 className="text-theme-primary text-lg font-semibold mb-2">
										{activeFilter === TRANSACTION_FILTERS.ALL
											? t(EMPTY_STATES.NO_TRANSACTIONS.TITLE)
											: t(EMPTY_STATES.NO_FILTERED_TRANSACTIONS.TITLE)}
									</h3>
									<p className="dark:text-gray-400 text-gray-500 text-sm text-center max-w-sm">
										{activeFilter === TRANSACTION_FILTERS.ALL
											? t(EMPTY_STATES.NO_TRANSACTIONS.DESCRIPTION)
											: t(EMPTY_STATES.NO_FILTERED_TRANSACTIONS.DESCRIPTION)}
									</p>
								</div>
							)
						)}
					</div>

					<div className="px-6 py-3 bg-theme-surface border-t dark:border-gray-700 border-gray-200 rounded-b-xl">
						<div className="flex justify-center items-center text-xs dark:text-gray-400 text-gray-500 h-[40px]">
							{isLoading || isLoadingMore ? (
								<div className="flex items-center gap-2">
									<div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500"></div>
									<span>{t(FOOTERS.FETCHING)}</span>
								</div>
							) : hasMoreData ? (
								<div className="flex flex-col items-center animate-bounce">
									<Icons.ArrowDown className="w-4 h-4" />
								</div>
							) : (
								hasData && <span>{t(FOOTERS.NOTI, { count: currentData.length })}</span>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default TransactionHistory;
