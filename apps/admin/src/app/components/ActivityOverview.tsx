import { Icons } from '@mezon/ui';
import { formatDateI18n } from '@mezon/utils';
import 'rc-tooltip/assets/bootstrap.css';
import React from 'react';
import MetricTab from './controls/MetricTab';

interface UsageMetrics {
	totalActiveUsers: number;
	totalActiveChannels: number;
	totalMessages: number;
}

type TabKey = 'activeUsers' | 'activeChannels' | 'messages';

interface Props {
	activeTab: TabKey;
	onTabChange: (t: TabKey) => void;
	totals: UsageMetrics;
	dateRangeText: string;
	iconUsers?: React.ReactNode;
	iconChannels?: React.ReactNode;
	iconMessages?: React.ReactNode;
}

export default function ActivityOverview({ activeTab, onTabChange, totals, dateRangeText, iconUsers, iconChannels, iconMessages }: Props) {
	const now = formatDateI18n(new Date(), 'en', 'dd/MM/yyyy, HH:mm:ss');

	return (
		<div className="bg-white dark:bg-[#2b2d31] p-6 rounded-lg border dark:border-[#4d4f52]">
			<div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
				<div className="flex flex-col md:flex-row items-start justify-between w-full">
					<div className="flex flex-col">
						<h2 className="text-xl font-semibold">Activity Overview</h2>
						<div className="mt-1 text-sm dark:text-textSecondary">
							<div>{now} UTC</div>
							<div>Time Period: {dateRangeText}</div>
						</div>
					</div>
					<div className="flex space-x-4"></div>
				</div>
			</div>

			<div className="flex flex-col sm:flex-row gap-3 items-stretch mb-4">
				<MetricTab
					active={activeTab === 'activeUsers'}
					onClick={() => onTabChange('activeUsers')}
					icon={iconUsers ?? <Icons.MemberList defaultSize="w-5 h-5" className="text-white" />}
					iconWrapperClass="p-2 rounded-full bg-blue-900"
					label="Total Active Users"
					tooltip="Unique users who were active at least once"
					value={totals.totalActiveUsers.toLocaleString()}
					activeClassName="border-2 border-[#93c5fd] dark:border-white bg-[#eef2ff] text-[#1b1833] dark:bg-[#1b1833] dark:text-white"
					labelClassActive="text-sm font-medium text-[#1b1833] dark:text-white"
					labelClassInactive="text-sm font-medium text-gray-600 dark:text-textSecondary"
					valueClassActive="text-xl font-bold text-[#1b1833] dark:text-white"
					valueClassInactive="text-xl font-bold text-gray-900 dark:text-white"
				/>

				<MetricTab
					active={activeTab === 'activeChannels'}
					onClick={() => onTabChange('activeChannels')}
					icon={iconChannels ?? <Icons.Hashtag defaultSize="w-5 h-5" className="text-white" />}
					iconWrapperClass="p-2 rounded-full bg-purple-800"
					label="Total Active Channels"
					tooltip="Unique channels that were active at least once"
					value={totals.totalActiveChannels.toLocaleString()}
					activeClassName="border-2 border-[#93c5fd] dark:border-white bg-[#fff5f7] text-[#5b2a2a] dark:bg-[#2a1f17] dark:text-white"
					labelClassActive="text-sm font-medium text-[#5b2a2a] dark:text-white"
					labelClassInactive="text-sm font-medium text-gray-600 dark:text-textSecondary"
					valueClassActive="text-xl font-bold text-[#5b2a2a] dark:text-white"
					valueClassInactive="text-xl font-bold text-gray-900 dark:text-white"
				/>

				<MetricTab
					active={activeTab === 'messages'}
					onClick={() => onTabChange('messages')}
					icon={
						iconMessages ?? (
							<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
								/>
							</svg>
						)
					}
					iconWrapperClass="p-2 rounded-full bg-red-800"
					label="Total Messages"
					tooltip="Total messages sent during the selected period"
					value={totals.totalMessages.toLocaleString()}
					activeClassName="border-2 border-[#93c5fd] dark:border-white bg-[#f0fff4] text-[#0f5132] dark:bg-[#0f2a1b] dark:text-white"
					labelClassActive="text-sm font-medium text-[#0f5132] dark:text-white"
					labelClassInactive="text-sm font-medium text-gray-600 dark:text-textSecondary"
					valueClassActive="text-xl font-bold text-[#0f5132] dark:text-white"
					valueClassInactive="text-xl font-bold text-gray-900 dark:text-white"
				/>
			</div>
		</div>
	);
}
