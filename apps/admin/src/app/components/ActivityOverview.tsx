import { MezonIcon, MzIcons16 } from '@mezon/ui';
import { formatDateI18n } from '@mezon/utils';
import 'rc-tooltip/assets/bootstrap.css';
import React from 'react';
import { useTranslation } from 'react-i18next';
import type { UsageMetrics } from '../pages/dashboard/types';
import MetricTab from './controls/MetricTab';

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
	const { t } = useTranslation('dashboard');
	const now = formatDateI18n(new Date(), 'en', 'dd/MM/yyyy, HH:mm:ss');

	return (
		<div className="bg-white dark:bg-[#2b2d31] p-6 rounded-lg border dark:border-[#4d4f52]">
			<div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
				<div className="flex flex-col md:flex-row items-start justify-between w-full">
					<div className="flex flex-col">
						<h2 className="text-xl font-semibold">{t('activityOverview.title')}</h2>
						<div className="mt-1 text-sm dark:text-textSecondary flex items-center">
							<span className="inline-flex items-center mr-2" aria-hidden="true">
								<MezonIcon icon={MzIcons16.mzCalendar} className="text-[var(--mz-icon)]" />
							</span>
							{now} - {t('activityOverview.timePeriod')}: {dateRangeText}
						</div>
					</div>
					<div className="flex space-x-4"></div>
				</div>
			</div>

			<div className="flex flex-col sm:flex-row gap-3 items-stretch mb-4">
				<MetricTab
					active={activeTab === 'activeUsers'}
					onClick={() => onTabChange('activeUsers')}
					icon={iconUsers}
					iconWrapperClass={
						activeTab === 'activeUsers'
							? 'w-10 h-10 flex items-center justify-center rounded-lg bg-white/30 text-white dark:bg-white/20'
							: 'w-10 h-10 flex items-center justify-center rounded-lg bg-[#5865F2] text-white dark:bg-[#4752c4]'
					}
					label={t('activityOverview.totalActiveUsers')}
					tooltip={t('activityOverview.totalActiveUsersTooltip')}
					value={totals.totalActiveUsers ?? '0'}
					labelClassActive="text-sm font-medium text-white"
					valueClassActive="text-xl font-bold text-white"
				/>

				<MetricTab
					active={activeTab === 'activeChannels'}
					onClick={() => onTabChange('activeChannels')}
					icon={iconChannels}
					iconWrapperClass={
						activeTab === 'activeChannels'
							? 'w-10 h-10 flex items-center justify-center rounded-lg bg-white/30 text-white dark:bg-white/20'
							: 'w-10 h-10 flex items-center justify-center rounded-lg bg-[#5865F2] text-white dark:bg-[#4752c4]'
					}
					label={t('activityOverview.totalActiveChannels')}
					tooltip={t('activityOverview.totalActiveChannelsTooltip')}
					value={totals.totalActiveChannels ?? '0'}
					labelClassActive="text-sm font-medium text-white"
					valueClassActive="text-xl font-bold text-white"
				/>

				<MetricTab
					active={activeTab === 'messages'}
					onClick={() => onTabChange('messages')}
					icon={iconMessages}
					iconWrapperClass={
						activeTab === 'messages'
							? 'w-10 h-10 flex items-center justify-center rounded-lg bg-white/30 text-white dark:bg-white/20'
							: 'w-10 h-10 flex items-center justify-center rounded-lg bg-[#5865F2] text-white dark:bg-[#4752c4]'
					}
					label={t('activityOverview.totalMessages')}
					tooltip={t('activityOverview.totalMessagesTooltip')}
					value={totals.totalMessages ?? '0'}
					labelClassActive="text-sm font-medium text-white"
					valueClassActive="text-xl font-bold text-white"
				/>
			</div>
		</div>
	);
}
