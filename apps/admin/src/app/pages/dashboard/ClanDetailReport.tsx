import {
	fetchClanMetrics,
	selectClanById,
	selectDashboardChartData,
	selectDashboardChartLoading,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import ReportControls from '../../components/ReportControls/ReportControls';
import ChannelsTable from '../../components/dashboard/ChannelsTable';
import ChartSection from '../../components/dashboard/ChartSection';
import { LoadingState, NoDataState } from '../../components/dashboard/StateComponents';
import UsersTable from '../../components/dashboard/UsersTable';
import { calculateAllowedGranularities, calculateMetrics, formatDateRangeText, getDateRangeFromPreset } from '../../utils/dashboard/reportUtils';
import type { ChannelsData, ClanDetailReportProps, UserData } from './types';

// Sample data for channels
const sampleChannelData: ChannelsData[] = [
	{ channelName: 'general', activeUsers: 5, messages: 23 },
	{ channelName: 'announcements', activeUsers: 3, messages: 8 },
	{ channelName: 'random', activeUsers: 4, messages: 15 }
];

// Sample data for users
const sampleUserData: UserData[] = [
	{ userName: 'User A', messages: 45 },
	{ userName: 'User B', messages: 32 },
	{ userName: 'User C', messages: 28 }
];

function ClanDetailReport({ clanId }: ClanDetailReportProps) {
	const [dateRange, setDateRange] = useState('7');
	const [periodFilter, setPeriodFilter] = useState<'daily' | 'weekly' | 'monthly'>('daily');
	const [activeTab, setActiveTab] = useState<'activeUsers' | 'activeChannels' | 'messages'>('activeUsers');
	const [customStartDate, setCustomStartDate] = useState('');
	const [customEndDate, setCustomEndDate] = useState('');

	const [refreshTrigger, setRefreshTrigger] = useState(0);

	const clan = useSelector(selectClanById(clanId ?? ''));

	const dispatch = useAppDispatch();
	const chartData = useAppSelector(selectDashboardChartData);
	const chartLoadingStore = useAppSelector(selectDashboardChartLoading);

	const isLoadingDerived = chartLoadingStore;
	const hasNoDataDerived = !chartLoadingStore && (chartData?.length || 0) === 0;

	// Fetch data from API
	useEffect(() => {
		const { startStr, endStr } = getDateRangeFromPreset(dateRange, customStartDate, customEndDate);

		if (clanId) {
			dispatch(fetchClanMetrics({ clanId, start: startStr, end: endStr, rangeType: periodFilter }));
		}
	}, [clanId, refreshTrigger, dateRange, customStartDate, customEndDate, periodFilter, dispatch]);

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

	const metrics = useMemo(() => calculateMetrics(chartData), [chartData]);
	const dateRangeText = formatDateRangeText(dateRange, customStartDate, customEndDate);
	const displayedData = useMemo(() => chartData || [], [chartData]);

	const handleRunReport = () => {
		setRefreshTrigger((prev) => prev + 1);
	};

	const handleReset = () => {
		setDateRange('7');
		setCustomStartDate('');
		setCustomEndDate('');
		setRefreshTrigger((prev) => prev + 1);
	};

	return (
		<div className="flex flex-col gap-5">
			<div className="flex justify-between items-center w-full">
				<h1 className="text-2xl font-medium">Dashboard {clan?.clan_name || clanId} Report</h1>
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
			/>

			{/* Loading State */}
			{isLoadingDerived && <LoadingState />}

			{/* No Data State */}
			{!isLoadingDerived && hasNoDataDerived && <NoDataState />}

			{/* Activity Chart (tabs + reusable SingleLineChart) */}
			{!isLoadingDerived && !hasNoDataDerived && (
				<ChartSection
					activeTab={activeTab}
					onTabChange={setActiveTab}
					metrics={metrics}
					dateRangeText={dateRangeText}
					chartData={displayedData}
				/>
			)}

			{/* Channels Table Section */}
			{!isLoadingDerived && !hasNoDataDerived && <ChannelsTable data={sampleChannelData} />}

			{/* User Table Section */}
			{!isLoadingDerived && !hasNoDataDerived && <UsersTable data={sampleUserData} />}
		</div>
	);
}

export default ClanDetailReport;
