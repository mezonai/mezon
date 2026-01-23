import { Icons } from '@mezon/ui';
import type { ChartDataPoint, UsageMetrics } from '../../pages/dashboard/types';
import ActivityOverview from '../ActivityOverview';
import MemoizedSingleLineChart from '../SingleLineChart';

interface ChartSectionProps {
	activeTab: 'activeUsers' | 'activeChannels' | 'messages';
	onTabChange: (tab: 'activeUsers' | 'activeChannels' | 'messages') => void;
	metrics: UsageMetrics;
	dateRangeText: string;
	chartData: ChartDataPoint[];
	isLoading?: boolean;
}

function ChartSection({ activeTab, onTabChange, metrics, dateRangeText, chartData, isLoading }: ChartSectionProps) {
	return (
		<div className="bg-white dark:bg-[#2b2d31] p-6 rounded-lg border dark:border-[#4d4f52]">
			<div>
				<ActivityOverview
					activeTab={activeTab}
					onTabChange={onTabChange}
					totals={metrics}
					dateRangeText={dateRangeText}
					iconUsers={<Icons.MemberList defaultSize="w-5 h-5" className="text-black dark:text-white" />}
					iconChannels={<Icons.Hashtag defaultSize="w-5 h-5" className="text-black dark:text-white" />}
					iconMessages={<Icons.MessageIcon defaultSize="w-5 h-5" className="text-black dark:text-white" />}
				/>
			</div>

			<div className="border dark:border-[#4d4f52] rounded-lg p-4 mt-4">
				{isLoading ? (
					<div className="text-center py-12">
						<div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-[#5865F2] border-r-transparent"></div>
						<div className="mt-2 text-sm dark:text-textSecondary">Loading chart data...</div>
					</div>
				) : chartData.length === 0 ? (
					<div className="text-center py-12">
						<div className="text-lg font-medium dark:text-textSecondary">Metrics are available for clan owners only.</div>
					</div>
				) : (
					<>
						{activeTab === 'activeUsers' && (
							<MemoizedSingleLineChart data={chartData} dataKey="activeUsers" stroke="#5b5fc7" name="Total Active Users" />
						)}
						{activeTab === 'activeChannels' && (
							<MemoizedSingleLineChart data={chartData} dataKey="activeChannels" stroke="#ff7a59" name="Total Active Channels" />
						)}
						{activeTab === 'messages' && (
							<MemoizedSingleLineChart data={chartData} dataKey="messages" stroke="#3ac47d" name="Total Messages" />
						)}
					</>
				)}
			</div>
		</div>
	);
}

export default ChartSection;
