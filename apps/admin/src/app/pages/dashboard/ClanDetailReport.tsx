import {
	fetchClanMetrics,
	selectClanById,
	selectDashboardChartData,
	selectDashboardChartLoading,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import ActivityOverview from '../../components/ActivityOverview';
import ReportControls from '../../components/ReportControls/ReportControls';
import SingleLineChart from '../../components/SingleLineChart';

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

interface ChannelsData {
	channelName: string;
	activeUsers: number;
	messages: number;
}

interface UserData {
	userName: string;
	messages: number;
}

interface ClanDetailReportProps {
	clanId: string | null;
}

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
		const { startStr, endStr } = ((): { startStr: string; endStr: string } => {
			if (dateRange === 'custom') {
				return {
					startStr: customStartDate ? new Date(customStartDate).toISOString().split('T')[0] : '',
					endStr: customEndDate ? new Date(customEndDate).toISOString().split('T')[0] : ''
				};
			}
			const days = parseInt(dateRange);
			const safeDays = Number.isNaN(days) ? 7 : days;
			const endDate = new Date();
			const startDate = new Date();
			startDate.setDate(endDate.getDate() - safeDays + 1);
			return { startStr: startDate.toISOString().split('T')[0], endStr: endDate.toISOString().split('T')[0] };
		})();

		if (clanId) {
			dispatch(fetchClanMetrics({ clanId, start: startStr, end: endStr, rangeType: periodFilter }));
		}
	}, [clanId, refreshTrigger, dateRange, customStartDate, customEndDate, periodFilter, dispatch]);
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

		if (days === 0) return [];
		if (days < 7) return [];
		if (days <= 7) return ['daily'];
		if (days <= 30) return ['daily', 'weekly'];
		return ['daily', 'weekly', 'monthly'];
	}, [dateRange, customStartDate, customEndDate]);

	useEffect(() => {
		if (allowedGranularities.length === 0) return; // nothing to select
		if (!allowedGranularities.includes(periodFilter)) {
			setPeriodFilter(allowedGranularities[0]);
		}
	}, [allowedGranularities]);

	// Calculate metrics
	const metrics: UsageMetrics = useMemo(() => {
		if (chartData.length === 0) {
			return {
				totalActiveUsers: 0,
				totalActiveChannels: 0,
				totalMessages: 0
			};
		}

		const totalActiveUsers = chartData.reduce((sum, day) => sum + day.activeUsers, 0);
		const totalActiveChannels = chartData.reduce((sum, day) => sum + day.activeChannels, 0);
		const totalMessages = chartData.reduce((sum, day) => sum + day.messages, 0);

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
		// Re-fetch data by triggering useEffect
		setRefreshTrigger((prev) => prev + 1);
	};

	const handleReset = () => {
		setDateRange('7');
		setCustomStartDate('');
		setCustomEndDate('');

		// Trigger re-fetch after reset
		setRefreshTrigger((prev) => prev + 1);
	};

	// Use server-provided grouped data. No client-side grouping anymore.
	const displayedData = useMemo(() => chartData || [], [chartData]);

	const _handleExportCSV = () => {
		// TODO: Export channels and users data when available from API
		const csvContent = [
			['Date', 'Active users', 'Active channels', 'Messages'],
			...chartData.map((row) => [row.date, row.activeUsers, row.activeChannels, row.messages])
		]
			.map((row) => row.map((cell) => `"${cell}"`).join(','))
			.join('\n');

		const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
		const link = document.createElement('a');
		const url = URL.createObjectURL(blob);
		link.setAttribute('href', url);
		link.setAttribute('download', `channel_usage_${new Date().toISOString().split('T')[0]}.csv`);
		link.style.visibility = 'hidden';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	return (
		<div className="flex flex-col gap-5">
			<div className="flex justify-between items-center w-full">
				<h1 className="text-2xl font-medium">Dashboard {clan?.clanName || clanId} Report</h1>
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
			{isLoadingDerived && (
				<div className="bg-white dark:bg-[#2b2d31] p-12 rounded-lg border dark:border-[#4d4f52] text-center">
					<div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-[#5865F2] border-r-transparent"></div>
					<div className="mt-4 text-sm dark:text-textSecondary">Loading data...</div>
				</div>
			)}

			{/* No Data State */}
			{!isLoadingDerived && hasNoDataDerived && (
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

			{/* Activity Chart (tabs + reusable SingleLineChart) */}
			{!isLoadingDerived && !hasNoDataDerived && (
				<div className="bg-white dark:bg-[#2b2d31] p-6 rounded-lg border dark:border-[#4d4f52]">
					<div>
						<ActivityOverview
							activeTab={activeTab}
							onTabChange={(t) => setActiveTab(t)}
							totals={metrics}
							dateRangeText={getDateRangeText()}
							iconUsers={<Icons.MemberList defaultSize="w-5 h-5" className="text-white" />}
							iconChannels={<Icons.ThreadIcon defaultSize="w-5 h-5" className="text-white" />}
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

					{/* render single-line chart based on activeTab */}
					<div className="border dark:border-[#4d4f52] rounded-lg p-4">
						{activeTab === 'activeUsers' && (
							<SingleLineChart data={displayedData} dataKey="activeUsers" stroke="#5b5fc7" name="Total Active Users" />
						)}
						{activeTab === 'activeChannels' && (
							<SingleLineChart data={displayedData} dataKey="activeChannels" stroke="#ff7a59" name="Total Active Channels" />
						)}
						{activeTab === 'messages' && (
							<SingleLineChart data={displayedData} dataKey="messages" stroke="#3ac47d" name="Total Messages" />
						)}
					</div>
				</div>
			)}

			{/* Channels Table Section */}
			{!isLoadingDerived && !hasNoDataDerived && (
				<div className="bg-white dark:bg-[#2b2d31] p-6 rounded-lg border dark:border-[#4d4f52]">
					<div className="flex justify-between items-center mb-4">
						<h3 className="text-xl font-semibold">Channels Activity Data</h3>
						<button className="px-4 py-2 border dark:border-[#4d4f52] rounded-md hover:bg-gray-50 dark:hover:bg-[#1e1f22] text-sm flex items-center gap-2">
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
						</button>
					</div>
					<div className="overflow-x-auto">
						<table className="w-full border-collapse">
							<thead className="bg-gray-50 dark:bg-[#1e1f22]">
								<tr>
									<th className="px-4 py-3 text-left text-sm font-semibold border-b dark:border-[#4d4f52]">
										<div className="flex items-center">
											<span>Channel name</span>
											<input
												aria-label="Select Channel name column"
												type="checkbox"
												className="ml-2 h-4 w-4 rounded border dark:border-[#4d4f52]"
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
											/>
										</div>
									</th>
								</tr>
							</thead>
							<tbody>
								{sampleChannelData.map((row, index) => (
									<tr key={index} className="hover:bg-gray-50 dark:hover:bg-[#1e1f22]">
										<td className="px-4 py-3 text-sm border-b dark:border-[#4d4f52]">{row.channelName}</td>
										<td className="px-4 py-3 text-sm border-b dark:border-[#4d4f52]">{row.activeUsers}</td>
										<td className="px-4 py-3 text-sm border-b dark:border-[#4d4f52]">{row.messages}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			)}

			{/* User Table Section */}
			{!isLoadingDerived && !hasNoDataDerived && (
				<div className="bg-white dark:bg-[#2b2d31] p-6 rounded-lg border dark:border-[#4d4f52]">
					<div className="flex justify-between items-center mb-4">
						<h3 className="text-xl font-semibold">User Activity Data</h3>
						<button className="px-4 py-2 border dark:border-[#4d4f52] rounded-md hover:bg-gray-50 dark:hover:bg-[#1e1f22] text-sm flex items-center gap-2">
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
						</button>
					</div>
					<div className="overflow-x-auto">
						<table className="w-full border-collapse">
							<thead className="bg-gray-50 dark:bg-[#1e1f22]">
								<tr>
									<th className="px-4 py-3 text-left text-sm font-semibold border-b dark:border-[#4d4f52]">
										<div className="flex items-center">
											<span>User name</span>
											<input
												aria-label="Select User name column"
												type="checkbox"
												className="ml-2 h-4 w-4 rounded border dark:border-[#4d4f52]"
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
											/>
										</div>
									</th>
								</tr>
							</thead>
							<tbody>
								{sampleUserData.map((row, index) => (
									<tr key={index} className="hover:bg-gray-50 dark:hover:bg-[#1e1f22]">
										<td className="px-4 py-3 text-sm border-b dark:border-[#4d4f52]">{row.userName}</td>
										<td className="px-4 py-3 text-sm border-b dark:border-[#4d4f52]">{row.messages}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			)}
		</div>
	);
}

export default ClanDetailReport;
