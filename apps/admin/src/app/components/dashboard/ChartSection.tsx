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

			<div className="border dark:border-[#4d4f52] rounded-lg p-4">
				{isLoading ? (
					<div className="text-center py-12">
						<div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-[#5865F2] border-r-transparent"></div>
						<div className="mt-2 text-sm dark:text-textSecondary">Loading chart data...</div>
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
