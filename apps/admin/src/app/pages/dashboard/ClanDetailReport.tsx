import {
	fetchChannelUsers,
	fetchClanChannels,
	fetchClanMetrics,
	selectChannelUsers,
	selectChannelUsersLoading,
	selectChannelUsersPagination,
	selectClanById,
	selectClanChannels,
	selectClanChannelsLoading,
	selectClanChannelsMetrics,
	selectClanChannelsPagination,
	selectDashboardChartData,
	selectDashboardChartLoading,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import ReportControls from '../../components/ReportControls/ReportControls';
import ChannelsTable from '../../components/dashboard/ChannelsTable';
import ChartSection from '../../components/dashboard/ChartSection';
import { LoadingState, NoDataState } from '../../components/dashboard/StateComponents';
import UsersTable from '../../components/dashboard/UsersTable';
import { handleChannelCSVExport, handleUserCSVExport } from '../../utils/dashboard/csvExport';
import { calculateAllowedGranularities, formatDateRangeText, getDateRangeFromPreset } from '../../utils/dashboard/reportUtils';
import type { ChannelsData, ClanDetailReportProps, UserData } from './types';

function ClanDetailReport({ clanId }: ClanDetailReportProps) {
	const { t } = useTranslation('dashboard');
	const [dateRange, setDateRange] = useState('7');
	const [periodFilter, setPeriodFilter] = useState<'daily' | 'weekly' | 'monthly'>('daily');
	const [activeTab, setActiveTab] = useState<'activeUsers' | 'activeChannels' | 'messages'>('activeUsers');
	const [customStartDate, setCustomStartDate] = useState('');
	const [customEndDate, setCustomEndDate] = useState('');
	const [selectedChannelColumns, setSelectedChannelColumns] = useState<string[]>(['channel_name', 'active_users', 'messages']);
	const [isExportingChannelCSV, setIsExportingChannelCSV] = useState(false);
	const [selectedUserColumns, setSelectedUserColumns] = useState<string[]>(['user_name', 'messages']);
	const [isExportingUserCSV, setIsExportingUserCSV] = useState(false);
	const [channelPage, setChannelPage] = useState(1);
	const [channelLimit] = useState(10);
	const [userPage, setUserPage] = useState(1);
	const [userLimit] = useState(10);

	const [refreshTrigger, setRefreshTrigger] = useState(0);

	const clan = useSelector(selectClanById(clanId ?? ''));

	const dispatch = useAppDispatch();
	const chartData = useAppSelector(selectDashboardChartData);
	const chartLoadingStore = useAppSelector(selectDashboardChartLoading);

	const channelsLoadingStore = useAppSelector((s) => selectClanChannelsLoading(s));
	const channelsFromStore = useAppSelector((s) => (clanId ? selectClanChannels(s, clanId) : []));

	const channelsData = channelsFromStore;

	const channelsPagination = useAppSelector((s) =>
		clanId ? selectClanChannelsPagination(s, clanId) : { page: 1, limit: 10, total: 0, totalPages: 1 }
	);
	const metrics = useAppSelector((s) =>
		clanId ? selectClanChannelsMetrics(s, clanId) : { totalActiveUsers: '0', totalActiveChannels: '0', totalMessages: '0' }
	);
	const channelUsersLoadingStore = useAppSelector((s) => selectChannelUsersLoading(s));

	const firstChannelId = (channelsFromStore as any)?.[0]?.channelId || '';
	const usersFromStore = useAppSelector((s) => (clanId && firstChannelId ? selectChannelUsers(s, clanId, firstChannelId) : []));
	const usersPagination = useAppSelector((s) =>
		clanId && firstChannelId ? selectChannelUsersPagination(s, clanId, firstChannelId) : { page: 1, limit: 10, total: 0, totalPages: 1 }
	);

	const isLoadingDerived = chartLoadingStore || channelsLoadingStore || channelUsersLoadingStore;
	const hasNoDataDerived = !chartLoadingStore && (chartData?.length || 0) === 0;

	// Fetch data from API
	useEffect(() => {
		const { startStr, endStr } = getDateRangeFromPreset(dateRange, customStartDate, customEndDate);

		if (clanId) {
			dispatch(fetchClanMetrics({ clanId, start: startStr, end: endStr, rangeType: periodFilter }));
			dispatch(fetchClanChannels({ clanId, start: startStr, end: endStr, page: 1, limit: 10 }));
		}
	}, [clanId, refreshTrigger, dateRange, customStartDate, customEndDate, periodFilter, channelPage, channelLimit, dispatch]);

	// When channels load, fetch users for the first channel by default
	useEffect(() => {
		const { startStr, endStr } = getDateRangeFromPreset(dateRange, customStartDate, customEndDate);
		if (clanId && firstChannelId) {
			dispatch(fetchChannelUsers({ clanId, channelId: firstChannelId, start: startStr, end: endStr, page: userPage, limit: userLimit }));
		} else if (clanId && channelsFromStore && channelsFromStore.length > 0) {
			// Fallback: try to extract channelId from raw payload
			const stateAny: any = (dispatch as any).getState?.() || {};
			const raw = stateAny?.dashboard?.channelsCacheByClan?.[clanId]?.rawPayload?.data?.channels || [];
			const rawFirst = raw[0];
			const cid = rawFirst?.channel_id || rawFirst?.channelId || rawFirst?.id || '';
			if (cid) dispatch(fetchChannelUsers({ clanId, channelId: cid, start: startStr, end: endStr, page: userPage, limit: userLimit }));
		}
	}, [firstChannelId, clanId, dateRange, customStartDate, customEndDate, userPage, userLimit, dispatch]);

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

	const dateRangeText = formatDateRangeText(dateRange, customStartDate, customEndDate);
	const displayedData = useMemo(() => chartData || [], [chartData]);

	const handleRunReport = () => {
		setRefreshTrigger((prev) => prev + 1);
	};

	const handleReset = () => {
		setDateRange('7');
		setCustomStartDate('');
		setCustomEndDate('');
		setChannelPage(1);
		setUserPage(1);
		setRefreshTrigger((prev) => prev + 1);
	};

	const handleChannelPageChange = (newPage: number) => {
		setChannelPage(newPage);
	};

	const handleUserPageChange = (newPage: number) => {
		setUserPage(newPage);
	};

	const toggleChannelColumn = (col: string) => {
		setSelectedChannelColumns((prev) => (prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]));
	};

	const handleExportChannelCSV = async () => {
		if (!clanId) return;
		const { startStr, endStr } = getDateRangeFromPreset(dateRange, customStartDate, customEndDate);
		await handleChannelCSVExport(dispatch, clanId, startStr, endStr, periodFilter, selectedChannelColumns, setIsExportingChannelCSV);
	};

	const toggleUserColumn = (col: string) => {
		setSelectedUserColumns((prev) => (prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]));
	};

	const handleExportUserCSV = async () => {
		if (!clanId || !firstChannelId) return;
		const { startStr, endStr } = getDateRangeFromPreset(dateRange, customStartDate, customEndDate);
		await handleUserCSVExport(dispatch, clanId, firstChannelId, startStr, endStr, periodFilter, selectedUserColumns, setIsExportingUserCSV);
	};

	return (
		<div className="flex flex-col gap-5">
			<div className="flex justify-between items-center w-full">
				<h1 className="text-2xl font-medium">
					{t('page.dashboardReport')} {clan?.clan_name || clanId} {t('page.report').toLowerCase()}
				</h1>
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
			{!isLoadingDerived && !hasNoDataDerived && (
				<ChannelsTable
					data={channelsData as ChannelsData[]}
					selectedColumns={selectedChannelColumns}
					isExportingCSV={isExportingChannelCSV}
					page={channelPage}
					limit={channelLimit}
					total={Number(channelsPagination.total) || 0}
					totalPages={channelsPagination.totalPages || 1}
					onExportCSV={handleExportChannelCSV}
					onToggleColumn={toggleChannelColumn}
					onPageChange={handleChannelPageChange}
				/>
			)}

			{/* User Table Section */}
			{!isLoadingDerived && !hasNoDataDerived && (
				<UsersTable
					data={(usersFromStore as UserData[]) || []}
					selectedColumns={selectedUserColumns}
					isExportingCSV={isExportingUserCSV}
					page={userPage}
					limit={userLimit}
					total={Number(usersPagination.total) || 0}
					totalPages={usersPagination.totalPages || 1}
					onExportCSV={handleExportUserCSV}
					onToggleColumn={toggleUserColumn}
					onPageChange={handleUserPageChange}
				/>
			)}
		</div>
	);
}

export default ClanDetailReport;
