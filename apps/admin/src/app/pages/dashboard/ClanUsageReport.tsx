import {
	exportClansCsv,
	fetchAllClansMetrics,
	fetchClansList,
	selectDashboardChartData,
	selectDashboardChartLoading,
	selectDashboardTableData,
	selectDashboardTableLoading,
	selectDashboardUsageTotals,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { useEffect, useMemo, useRef, useState } from 'react';
import ActivityOverview from '../../components/ActivityOverview';
import Pagination from '../../components/Pagination';
import ReportControls from '../../components/ReportControls/ReportControls';
import SingleLineChart from '../../components/SingleLineChart';

// Types
interface ClanData {
	clanId: string;
	totalActiveUsers: number;
	totalActiveChannels: number;
	totalMessages: number;
}

interface ChartDataPoint {
	date: string;
	isoDate?: string;
	activeUsers: number;
	activeChannels: number;
	messages: number;
}

interface UsageMetrics {
	totalActiveUsers: number;
	totalActiveChannels: number;
	totalMessages: number;
}

function ClanUsageReport({ onClanClick }: { onClanClick?: (clanId: string) => void }) {
	const [dateRange, setDateRange] = useState('7');
	const [periodFilter, setPeriodFilter] = useState<'daily' | 'weekly' | 'monthly'>('daily');
	const [activeTab, setActiveTab] = useState<'activeUsers' | 'activeChannels' | 'messages'>('activeUsers');
	const [customStartDate, setCustomStartDate] = useState('');
	const [customEndDate, setCustomEndDate] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	// Columns selected for CSV export. Defaults to all columns checked.
	const [selectedColumns, setSelectedColumns] = useState<string[]>(['clan_id', 'active_users', 'active_channels', 'messages']);
	const toggleColumn = (col: string) => {
		setSelectedColumns((prev) => (prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]));
	};
	const [refreshTrigger, setRefreshTrigger] = useState(0);
	const [hasNoData, setHasNoData] = useState(false);

	// Pagination state for table
	const [page, setPage] = useState(1);
	const [limit, setLimit] = useState(10);
	const [total, setTotal] = useState(0);
	const [totalPages, setTotalPages] = useState(0);

	const tableRef = useRef<HTMLDivElement>(null);
	const shouldScrollToTable = useRef(false);

	const [showFullPageLoading, setShowFullPageLoading] = useState(false);
	const [showTableSkeleton, setShowTableSkeleton] = useState(false);
	const [isExportingCSV, setIsExportingCSV] = useState(false);

	const getDateRange = () => {
		let startStr = '';
		let endStr = '';
		if (dateRange === 'custom') {
			startStr = customStartDate ? new Date(customStartDate).toISOString().split('T')[0] : '';
			endStr = customEndDate ? new Date(customEndDate).toISOString().split('T')[0] : '';
		} else {
			const days = parseInt(dateRange);
			const safeDays = Number.isNaN(days) ? 7 : days;
			const endDate = new Date();
			const startDate = new Date();
			startDate.setDate(endDate.getDate() - safeDays + 1);
			startStr = startDate.toISOString().split('T')[0];
			endStr = endDate.toISOString().split('T')[0];
		}
		return { startStr, endStr };
	};

	const dispatch = useAppDispatch();

	const chartData = useAppSelector(selectDashboardChartData);
	const tableDataStore = useAppSelector(selectDashboardTableData);
	const usageTotalsStore = useAppSelector(selectDashboardUsageTotals);
	const chartLoadingStore = useAppSelector(selectDashboardChartLoading);
	const tableLoadingStore = useAppSelector(selectDashboardTableLoading);

	// Fetch chart data only when dateRange, customStartDate, customEndDate, or refreshTrigger changes
	useEffect(() => {
		const { startStr, endStr } = getDateRange();
		dispatch(fetchAllClansMetrics({ start: startStr, end: endStr, rangeType: periodFilter }));
	}, [refreshTrigger, dateRange, customStartDate, customEndDate, periodFilter, dispatch]);

	// Fetch table data only when page, limit, dateRange, customStartDate, customEndDate, or refreshTrigger changes
	useEffect(() => {
		const fetchTable = async () => {
			const { startStr, endStr } = getDateRange();
			const action = await dispatch(fetchClansList({ start: startStr, end: endStr, page, limit, rangeType: periodFilter }));
			if (fetchClansList.fulfilled.match(action)) {
				const payload = action.payload as any;
				if (payload?.success && payload.data?.pagination) {
					setTotal(payload.data.pagination.total || 0);
					setTotalPages(payload.data.pagination.totalPages || 0);
					setPage(payload.data.pagination.page || page);
				}
			} else {
				// in error case, reset pagination
				setTotal(0);
				setTotalPages(0);
			}
		};
		fetchTable();
	}, [refreshTrigger, page, limit, dateRange, customStartDate, customEndDate, periodFilter, dispatch]);

	// Only show "no data" state when both have finished loading and there's no data
	useEffect(() => {
		setIsLoading(showFullPageLoading && (chartLoadingStore || tableLoadingStore));
		setHasNoData(!chartLoadingStore && !tableLoadingStore && (chartData?.length || 0) === 0 && (tableDataStore?.length || 0) === 0);
	}, [chartLoadingStore, tableLoadingStore, chartData, tableDataStore, showFullPageLoading]);

	// Turn off full page loading when both chart and table have finished loading
	useEffect(() => {
		if (showFullPageLoading && !chartLoadingStore && !tableLoadingStore) {
			setShowFullPageLoading(false);
		}
	}, [showFullPageLoading, chartLoadingStore, tableLoadingStore]);

	// Skeleton only shows after 300ms of loading
	useEffect(() => {
		let timeoutId: NodeJS.Timeout;
		if (tableLoadingStore) {
			timeoutId = setTimeout(() => {
				setShowTableSkeleton(true);
			}, 300);
		} else {
			setShowTableSkeleton(false);
		}

		return () => {
			if (timeoutId) {
				clearTimeout(timeoutId);
			}
		};
	}, [tableLoadingStore]);

	useEffect(() => {
		if (!tableLoadingStore && shouldScrollToTable.current && tableRef.current) {
			const timer = setTimeout(() => {
				if (tableRef.current) {
					tableRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
				}
				shouldScrollToTable.current = false;
			}, 300);
			return () => clearTimeout(timer);
		}
	}, [tableLoadingStore]);

	// Calculate metrics
	const metrics: UsageMetrics = useMemo(() => {
		const source = chartData || [];
		if (source.length === 0) {
			return {
				totalActiveUsers: 0,
				totalActiveChannels: 0,
				totalMessages: 0
			};
		}

		const totalActiveUsers = source.reduce((sum, day) => sum + day.activeUsers, 0);
		const totalActiveChannels = source.reduce((sum, day) => sum + day.activeChannels, 0);
		const totalMessages = source.reduce((sum, day) => sum + day.messages, 0);

		return {
			totalActiveUsers: Math.floor(totalActiveUsers),
			totalActiveChannels: Math.floor(totalActiveChannels),
			totalMessages: Math.floor(totalMessages)
		};
	}, [chartData]);

	// Get date range text
	const getDateRangeText = () => {
		if (dateRange === 'custom') {
			if (customStartDate && customEndDate) {
				const start = new Date(customStartDate);
				const end = new Date(customEndDate);
				return `${start.toLocaleDateString('en-GB')} - ${end.toLocaleDateString('en-GB')}`;
			}
			// Incomplete custom range -> show fallback last 7 days
			const endDate = new Date();
			const startDate = new Date();
			startDate.setDate(startDate.getDate() - 6);
			return `${startDate.toLocaleDateString('en-GB')} - ${endDate.toLocaleDateString('en-GB')}`;
		}

		const days = parseInt(dateRange);
		const endDate = new Date();
		const startDate = new Date();
		const safeDays = Number.isNaN(days) ? 7 : days;
		startDate.setDate(startDate.getDate() - (safeDays - 1));
		return `${startDate.toLocaleDateString('en-GB')} - ${endDate.toLocaleDateString('en-GB')}`;
	};

	const handleRunReport = () => {
		// Reset to first page and re-fetch data
		setShowFullPageLoading(true);
		setPage(1);
		setRefreshTrigger((prev) => prev + 1);
	};

	const handleReset = () => {
		setDateRange('7');
		setCustomStartDate('');
		setCustomEndDate('');

		setShowFullPageLoading(true);
		// Keep the current page size; just reset to first page and trigger a refetch.
		setPage(1);
		setRefreshTrigger((prev) => prev + 1);
	};
	// Use server-provided grouped data. No client-side grouping anymore.
	const displayedData = useMemo(() => chartData || [], [chartData]);

	const allowedGranularities = useMemo<('daily' | 'weekly' | 'monthly')[]>(() => {
		let days = 0;
		if (dateRange === 'custom') {
			if (!customStartDate || !customEndDate) {
				days = 0; // incomplete custom range
			} else {
				const start = new Date(customStartDate);
				const end = new Date(customEndDate);
				days = Math.max(0, Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
			}
		} else {
			const parsed = parseInt(dateRange, 10);
			days = Number.isNaN(parsed) ? 0 : parsed;
		}

		// If days is 0 or less than 7 for custom/incomplete ranges, hide the control
		if (days === 0) return [];
		if (days < 7) return [];
		if (days <= 7) return ['daily'];
		if (days <= 30) return ['daily', 'weekly'];
		return ['daily', 'weekly', 'monthly'];
	}, [dateRange, customStartDate, customEndDate]);

	// Ensure current periodFilter is allowed; if not, reset to first allowed option
	useEffect(() => {
		if (allowedGranularities.length === 0) return; // nothing to select
		if (!allowedGranularities.includes(periodFilter)) {
			setPeriodFilter(allowedGranularities[0]);
		}
	}, [allowedGranularities]);

	const handleExportCSV = async () => {
		shouldScrollToTable.current = true;
		try {
			setIsExportingCSV(true);
			const { startStr, endStr } = getDateRange();
			const action = await dispatch(exportClansCsv({ start: startStr, end: endStr, rangeType: periodFilter, columns: selectedColumns }));
			if (exportClansCsv.fulfilled.match(action)) {
				const payload = action.payload as any;
				const blob = payload?.blob as Blob;
				const headersArr = payload?.headers as Array<[string, string]> | undefined;
				const contentDisp = (headersArr || []).find((h) => h[0].toLowerCase() === 'content-disposition')?.[1] || '';
				let filename = `clan_usage_${startStr}_to_${endStr}.csv`;
				const m = contentDisp.match(/filename\*?=(?:UTF-8'')?"?([^;"\n]+)"?/);
				if (m && m[1]) filename = decodeURIComponent(m[1]);

				const link = document.createElement('a');
				const blobUrl = URL.createObjectURL(blob);
				link.href = blobUrl;
				link.download = filename;
				document.body.appendChild(link);
				link.click();
				link.remove();
				URL.revokeObjectURL(blobUrl);
			} else {
				const err = (action as any).payload || (action as any).error;
				console.error('Export failed', err);
			}
		} catch (err) {
			console.error('Error exporting CSV:', err);
		} finally {
			setIsExportingCSV(false);
		}
	};

	const handleClanClick = (clanId: string) => {
		if (onClanClick) {
			onClanClick(clanId);
		}
	};
	// TODO: Fix clan names in table
	// const clansEntities = useSelector(selectClansEntities);
	// usage: clansEntities?.[row.clanId]?.clanName

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="mb-[40px]">
				<h1 className="text-2xl font-medium">Clan Usage Statistics Report</h1>
			</div>

			<ReportControls
				dateRange={dateRange}
				setDateRange={setDateRange}
				customStartDate={customStartDate}
				setCustomStartDate={setCustomStartDate}
				customEndDate={customEndDate}
				setCustomEndDate={setCustomEndDate}
				periodFilter={periodFilter}
				setPeriodFilter={setPeriodFilter}
				allowedGranularities={allowedGranularities}
				onRun={handleRunReport}
				onReset={handleReset}
				onDateRangeChange={(v) => {
					// keep previous behavior of resetting table page on date change
					setPage(1);
				}}
			/>

			{/* Loading State */}
			{isLoading && (
				<div className="bg-white dark:bg-[#2b2d31] p-12 rounded-lg border dark:border-[#4d4f52] text-center">
					<div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-[#5865F2] border-r-transparent"></div>
					<div className="mt-4 text-sm dark:text-textSecondary">Loading data...</div>
				</div>
			)}

			{/* No Data State */}
			{!isLoading && hasNoData && (
				<div className="bg-white dark:bg-[#2b2d31] p-12 rounded-lg border dark:border-[#4d4f52] text-center">
					<svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					<h3 className="mt-4 text-lg font-medium dark:text-textPrimary">No data found</h3>
					<p className="mt-2 text-sm dark:text-textSecondary">No usage data available for the selected period.</p>
				</div>
			)}

			{!showFullPageLoading && !hasNoData && (
				<>
					{/* Chart Section (tabs + SingleLineChart) */}
					<div className="bg-white dark:bg-[#2b2d31] p-6 rounded-lg border dark:border-[#4d4f52]">
						<div>
							<ActivityOverview
								activeTab={activeTab}
								onTabChange={(t) => setActiveTab(t)}
								totals={usageTotalsStore ?? metrics}
								dateRangeText={getDateRangeText()}
								iconUsers={<Icons.MemberList defaultSize="w-5 h-5" className="text-white" />}
								iconChannels={<Icons.Hashtag defaultSize="w-5 h-5" className="text-white" />}
								iconMessages={
									<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
										/>
									</svg>
								}
							/>
						</div>

						<div className="border dark:border-[#4d4f52] rounded-lg p-4">
							{chartLoadingStore ? (
								<div className="text-center py-12">
									<div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-[#5865F2] border-r-transparent"></div>
									<div className="mt-2 text-sm dark:text-textSecondary">Loading chart data...</div>
								</div>
							) : (
								<>
									{activeTab === 'activeUsers' && (
										<SingleLineChart data={displayedData} dataKey="activeUsers" stroke="#5b5fc7" name="Total Active Users" />
									)}
									{activeTab === 'activeChannels' && (
										<SingleLineChart
											data={displayedData}
											dataKey="activeChannels"
											stroke="#ff7a59"
											name="Total Active Channels"
										/>
									)}
									{activeTab === 'messages' && (
										<SingleLineChart data={displayedData} dataKey="messages" stroke="#3ac47d" name="Total Messages" />
									)}
								</>
							)}
						</div>
					</div>

					{/* Table Section */}
					<div ref={tableRef} className="bg-white dark:bg-[#2b2d31] p-6 rounded-lg border dark:border-[#4d4f52]">
						<div className="flex justify-between items-center mb-4">
							<h3 className="text-xl font-semibold">Detailed Activity Data</h3>
							<button
								onClick={handleExportCSV}
								disabled={isExportingCSV}
								className="px-4 py-2 border dark:border-[#4d4f52] rounded-md hover:bg-gray-50 dark:hover:bg-[#1e1f22] text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{isExportingCSV ? (
									<>
										<div className="inline-block h-3 w-3 animate-spin rounded-full border border-solid border-current border-r-transparent"></div>
										Exporting...
									</>
								) : (
									<>
										<svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="inline">
											<path
												d="M7 1V9M7 9L4 6M7 9L10 6M1 13H13"
												stroke="currentColor"
												strokeWidth="1.5"
												strokeLinecap="round"
												strokeLinejoin="round"
											/>
										</svg>
										Export CSV
									</>
								)}
							</button>
						</div>
						<div className="overflow-x-auto">
							<table className="w-full border-collapse">
								<thead className="bg-gray-50 dark:bg-[#1e1f22]">
									<tr>
										<th className="px-4 py-3 text-left text-sm font-semibold border-b dark:border-[#4d4f52]">
											<div className="flex items-center">
												<span>Clan ID</span>
												<input
													aria-label="Select Clan ID column"
													type="checkbox"
													className="ml-2 h-4 w-4 rounded border dark:border-[#4d4f52]"
													checked={selectedColumns.includes('clan_id')}
													onChange={() => toggleColumn('clan_id')}
												/>
											</div>
										</th>
										<th className="px-4 py-3 text-left text-sm font-semibold border-b dark:border-[#4d4f52]">
											<div className="flex items-center">
												<span>Active users</span>
												<input
													aria-label="Select Active users column"
													type="checkbox"
													className="ml-2 h-4 w-4 rounded border dark:border-[#4d4f52]"
													checked={selectedColumns.includes('active_users')}
													onChange={() => toggleColumn('active_users')}
												/>
											</div>
										</th>
										<th className="px-4 py-3 text-left text-sm font-semibold border-b dark:border-[#4d4f52]">
											<div className="flex items-center">
												<span>Active channels</span>
												<input
													aria-label="Select Active channels column"
													type="checkbox"
													className="ml-2 h-4 w-4 rounded border dark:border-[#4d4f52]"
													checked={selectedColumns.includes('active_channels')}
													onChange={() => toggleColumn('active_channels')}
												/>
											</div>
										</th>
										<th className="px-4 py-3 text-left text-sm font-semibold border-b dark:border-[#4d4f52]">
											<div className="flex items-center">
												<span>Messages</span>
												<input
													aria-label="Select Messages column"
													type="checkbox"
													className="ml-2 h-4 w-4 rounded border dark:border-[#4d4f52]"
													checked={selectedColumns.includes('messages')}
													onChange={() => toggleColumn('messages')}
												/>
											</div>
										</th>
									</tr>
								</thead>
								<tbody>
									{showTableSkeleton ? (
										// Skeleton rows
										Array.from({ length: limit }).map((_, index) => (
											<tr key={`skeleton-${index}`}>
												<td className="px-4 py-3 text-sm border-b dark:border-[#4d4f52]">
													<div className="h-4 bg-gray-200 dark:bg-[#4d4f52] rounded animate-pulse"></div>
												</td>
												<td className="px-4 py-3 text-sm border-b dark:border-[#4d4f52]">
													<div className="h-4 bg-gray-200 dark:bg-[#4d4f52] rounded animate-pulse w-16"></div>
												</td>
												<td className="px-4 py-3 text-sm border-b dark:border-[#4d4f52]">
													<div className="h-4 bg-gray-200 dark:bg-[#4d4f52] rounded animate-pulse w-16"></div>
												</td>
												<td className="px-4 py-3 text-sm border-b dark:border-[#4d4f52]">
													<div className="h-4 bg-gray-200 dark:bg-[#4d4f52] rounded animate-pulse w-20"></div>
												</td>
											</tr>
										))
									) : (tableDataStore?.length || 0) === 0 ? (
										// Data loading
										<tr>
											<td colSpan={4} className="px-4 py-8 text-center text-sm dark:text-textSecondary">
												No data available for the selected period.
											</td>
										</tr>
									) : (
										tableDataStore.map((row, index) => (
											<tr key={index} className="hover:bg-gray-50 dark:hover:bg-[#1e1f22]">
												<td className="px-4 py-3 text-sm border-b dark:border-[#4d4f52]">
													<button
														onClick={() => handleClanClick(row.clanId)}
														className="text-blue-600 dark:text-blue-400 hover:underline"
													>
														{row.clanId}
													</button>
												</td>
												<td className="px-4 py-3 text-sm border-b dark:border-[#4d4f52]">{row.totalActiveUsers}</td>
												<td className="px-4 py-3 text-sm border-b dark:border-[#4d4f52]">{row.totalActiveChannels}</td>
												<td className="px-4 py-3 text-sm border-b dark:border-[#4d4f52]">{row.totalMessages}</td>
											</tr>
										))
									)}
								</tbody>
							</table>

							{/* Pagination controls */}
							{total > limit && (
								<>
									{/* lazy-load component from shared components folder */}
									{/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
									{/* @ts-ignore */}
									<Pagination
										page={page}
										totalPages={totalPages}
										total={total}
										pageSize={limit}
										onPageChange={(p) => {
											if (p !== page) shouldScrollToTable.current = true;
											setPage(p);
										}}
									/>
								</>
							)}
						</div>
					</div>
				</>
			)}
		</div>
	);
}

export default ClanUsageReport;
