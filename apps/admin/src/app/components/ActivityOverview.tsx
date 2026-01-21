import { Icons } from '@mezon/ui';
import Tooltip from 'rc-tooltip';
import 'rc-tooltip/assets/bootstrap.css';
import React from 'react';

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
	const now = new Date().toLocaleString('en-GB', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit'
	});

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
				<button
					onClick={() => onTabChange('activeUsers')}
					className={`flex-1 px-3 py-2 rounded-md transition-colors ${
						activeTab === 'activeUsers'
							? 'border-2 border-[#93c5fd] dark:border-white bg-[#eef2ff] text-[#1b1833] dark:bg-[#1b1833] dark:text-white'
							: 'border dark:border-[#4d4f52] border-gray-200 bg-white dark:bg-[#2b2d31]'
					} focus:outline-none`}
				>
					<div className="flex items-center">
						<div className="p-2 rounded-full bg-blue-900">
							{iconUsers ?? <Icons.MemberList defaultSize="w-5 h-5" className="text-white" />}
						</div>
						<div className="ml-3 text-left">
							<Tooltip overlay="Unique users who were active at least once" placement="top">
								<p
									className={`text-sm font-medium ${activeTab === 'activeUsers' ? 'text-[#1b1833] dark:text-white' : 'text-gray-600 dark:text-textSecondary'}`}
								>
									Total Active Users
								</p>
							</Tooltip>
							<p
								className={`text-xl font-bold ${activeTab === 'activeUsers' ? 'text-[#1b1833] dark:text-white' : 'text-gray-900 dark:text-white'}`}
							>
								{totals.totalActiveUsers.toLocaleString()}
							</p>
						</div>
					</div>
				</button>

				<button
					onClick={() => onTabChange('activeChannels')}
					className={`flex-1 px-3 py-2 rounded-md transition-colors ${
						activeTab === 'activeChannels'
							? 'border-2 border-[#93c5fd] dark:border-white bg-[#fff5f7] text-[#5b2a2a] dark:bg-[#2a1f17] dark:text-white'
							: 'border dark:border-[#4d4f52] border-gray-200 bg-white dark:bg-[#2b2d31]'
					} focus:outline-none`}
				>
					<div className="flex items-center">
						<div className="p-2 rounded-full bg-purple-800">
							{iconChannels ?? <Icons.Hashtag defaultSize="w-5 h-5" className="text-white" />}
						</div>
						<div className="ml-3 text-left">
							<Tooltip overlay="Unique channels that were active at least once" placement="top">
								<p
									className={`text-sm font-medium ${activeTab === 'activeChannels' ? 'text-[#5b2a2a] dark:text-white' : 'text-gray-600 dark:text-textSecondary'}`}
								>
									Total Active Channels
								</p>
							</Tooltip>
							<p
								className={`text-xl font-bold ${activeTab === 'activeChannels' ? 'text-[#5b2a2a] dark:text-white' : 'text-gray-900 dark:text-white'}`}
							>
								{totals.totalActiveChannels.toLocaleString()}
							</p>
						</div>
					</div>
				</button>

				<button
					onClick={() => onTabChange('messages')}
					className={`flex-1 px-3 py-2 rounded-md transition-colors ${
						activeTab === 'messages'
							? 'border-2 border-[#93c5fd] dark:border-white bg-[#f0fff4] text-[#0f5132] dark:bg-[#0f2a1b] dark:text-white'
							: 'border dark:border-[#4d4f52] border-gray-200 bg-white dark:bg-[#2b2d31]'
					} focus:outline-none`}
				>
					<div className="flex items-center">
						<div className="p-2 rounded-full bg-red-800">
							{iconMessages ?? (
								<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
									/>
								</svg>
							)}
						</div>
						<div className="ml-3 text-left">
							<Tooltip overlay="Total messages sent during the selected period" placement="top">
								<p
									className={`text-sm font-medium ${activeTab === 'messages' ? 'text-[#0f5132] dark:text-white' : 'text-gray-600 dark:text-textSecondary'}`}
								>
									Total Messages
								</p>
							</Tooltip>
							<p
								className={`text-xl font-bold ${activeTab === 'messages' ? 'text-[#0f5132] dark:text-white' : 'text-gray-900 dark:text-white'}`}
							>
								{totals.totalMessages.toLocaleString()}
							</p>
						</div>
					</div>
				</button>
			</div>
		</div>
	);
}
