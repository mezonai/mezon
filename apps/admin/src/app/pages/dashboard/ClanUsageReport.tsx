import {
	fetchAllClansMetrics,
	selectDashboardChartData,
	selectDashboardChartLoading,
	selectDashboardTableData,
	selectDashboardTableLoading,
	selectDashboardUsageTotals,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ReportControls from '../../components/ReportControls/ReportControls';
import ChartSection from '../../components/dashboard/ChartSection';
import ClansTable from '../../components/dashboard/ClansTable';
import { LoadingState, NoDataState } from '../../components/dashboard/StateComponents';
import { handleCSVExport } from '../../utils/dashboard/csvExport';
import { usePagination, useTableSkeleton } from '../../utils/dashboard/reportHooks';
import { calculateAllowedGranularities, calculateMetrics, formatDateRangeText, getDateRangeFromPreset } from '../../utils/dashboard/reportUtils';
import type { ClanUsageReportProps } from './types';

function ClanUsageReport({ onClanClick }: ClanUsageReportProps) {
	const { t } = useTranslation('dashboard');
	const [dateRange, setDateRange] = useState('7');
	const [periodFilter, setPeriodFilter] = useState<'daily' | 'weekly' | 'monthly'>('daily');
	const [activeTab, setActiveTab] = useState<'activeUsers' | 'activeChannels' | 'messages'>('activeUsers');
	const [customStartDate, setCustomStartDate] = useState('');
	const [customEndDate, setCustomEndDate] = useState('');
	const [selectedColumns, setSelectedColumns] = useState<string[]>(['clan_name', 'active_users', 'active_channels', 'messages']);
	const [refreshTrigger, setRefreshTrigger] = useState(0);
	const [hasNoData, setHasNoData] = useState(false);
	const [showFullPageLoading, setShowFullPageLoading] = useState(false);
	const [isExportingCSV, setIsExportingCSV] = useState(false);
	const [sortBy, setSortBy] = useState<string | undefined>(undefined);
	const [sort, setSort] = useState<'asc' | 'desc'>('asc');

	const tableRef = useRef<HTMLDivElement>(null);
	const shouldScrollToTable = useRef(false);

	const { page, setPage, limit, total, totalPages } = usePagination(
		dateRange,
		customStartDate,
		customEndDate,
		periodFilter,
		refreshTrigger,
		sortBy,
		sort
	);

	const dispatch = useAppDispatch();
	const chartData = useAppSelector(selectDashboardChartData);
	const tableDataStore = useAppSelector(selectDashboardTableData);
	const usageTotalsStore = useAppSelector(selectDashboardUsageTotals);
	const chartLoadingStore = useAppSelector(selectDashboardChartLoading);
	const tableLoadingStore = useAppSelector(selectDashboardTableLoading);

	const isLoading = showFullPageLoading && (chartLoadingStore || tableLoadingStore);
	const showTableSkeleton = useTableSkeleton(tableLoadingStore);

	const toggleColumn = (col: string) => {
		setSelectedColumns((prev) => (prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]));
	};

	// Fetch chart data when dependencies change
	useEffect(() => {
		const { startStr, endStr } = getDateRangeFromPreset(dateRange, customStartDate, customEndDate);
		dispatch(fetchAllClansMetrics({ start: startStr, end: endStr, rangeType: periodFilter }));
	}, [refreshTrigger, dateRange, customStartDate, customEndDate, periodFilter, dispatch]);

	// Check for no data state
	useEffect(() => {
		setHasNoData(!chartLoadingStore && !tableLoadingStore && (chartData?.length || 0) === 0 && (tableDataStore?.length || 0) === 0);
	}, [chartLoadingStore, tableLoadingStore, chartData, tableDataStore]);

	// Turn off full page loading when both chart and table have finished loading
	useEffect(() => {
		if (showFullPageLoading && !chartLoadingStore && !tableLoadingStore) {
			setShowFullPageLoading(false);
		}
	}, [showFullPageLoading, chartLoadingStore, tableLoadingStore]);

	// Handle scroll to table
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

	const metrics = useMemo(() => calculateMetrics(chartData || []), [chartData]);
	const dateRangeText = formatDateRangeText(dateRange, customStartDate, customEndDate);
	const displayedData = useMemo(() => chartData || [], [chartData]);

	const allowedGranularities = useMemo(
		() => calculateAllowedGranularities(dateRange, customStartDate, customEndDate),
		[dateRange, customStartDate, customEndDate]
	);

	useEffect(() => {
		if (allowedGranularities.length === 0) return;
		if (!allowedGranularities.includes(periodFilter)) {
			setPeriodFilter(allowedGranularities[0]);
		}
	}, [allowedGranularities, periodFilter]);

	const handleRunReport = () => {
		setShowFullPageLoading(true);
		setPage(1);
		setRefreshTrigger((prev) => prev + 1);
	};

	const handleReset = () => {
		setDateRange('7');
		setCustomStartDate('');
		setCustomEndDate('');
		setShowFullPageLoading(true);
		setPage(1);
		setRefreshTrigger((prev) => prev + 1);
	};

	const handleExportCSV = async () => {
		shouldScrollToTable.current = true;
		const { startStr, endStr } = getDateRangeFromPreset(dateRange, customStartDate, customEndDate);
		await handleCSVExport(dispatch, startStr, endStr, periodFilter, selectedColumns, setIsExportingCSV, sortBy, sortBy ? sort : undefined);
	};

	const handleClanClick = (clanId: string) => {
		if (onClanClick) {
			onClanClick(clanId);
		}
	};

	const handlePageChange = (p: number) => {
		if (p !== page) shouldScrollToTable.current = true;
		setPage(p);
	};

	const handleSort = (column: string) => {
		if (sortBy === column) {
			// Toggle sort direction
			setSort((prev) => (prev === 'asc' ? 'desc' : 'asc'));
		} else {
			// New column, default to ascending
			setSortBy(column);
			setSort('asc');
		}
		setPage(1);
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="mb-[40px]">
				<h1 className="text-2xl font-medium">{t('page.clanUsageStatisticsReport')}</h1>
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
				onDateRangeChange={() => {
					setPage(1);
				}}
			/>

			{/* Loading State */}
			{isLoading && <LoadingState />}

			{/* No Data State */}
			{!isLoading && hasNoData && <NoDataState />}

			{!showFullPageLoading && !hasNoData && (
				<>
					{/* Chart Section */}
					<ChartSection
						activeTab={activeTab}
						onTabChange={setActiveTab}
						metrics={usageTotalsStore ?? metrics}
						dateRangeText={dateRangeText}
						chartData={displayedData}
						isLoading={chartLoadingStore}
					/>

					{/* Table Section */}
					<ClansTable
						data={tableDataStore}
						showSkeleton={showTableSkeleton}
						selectedColumns={selectedColumns}
						isExportingCSV={isExportingCSV}
						page={page}
						limit={limit}
						total={total}
						totalPages={totalPages}
						sortBy={sortBy}
						sort={sort}
						onClanClick={handleClanClick}
						onExportCSV={handleExportCSV}
						onToggleColumn={toggleColumn}
						onPageChange={handlePageChange}
						onSort={handleSort}
						tableRef={tableRef}
					/>
				</>
			)}
		</div>
	);
}

export default ClanUsageReport;
