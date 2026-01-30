import type { ChartDataPoint, UsageMetrics } from '../../pages/dashboard/types';

export const calculateMetrics = (chartData: ChartDataPoint[]): UsageMetrics => {
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
};

export const getDateRangeFromPreset = (dateRange: string, customStartDate?: string, customEndDate?: string) => {
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

	return {
		startStr: startDate.toISOString().split('T')[0],
		endStr: endDate.toISOString().split('T')[0]
	};
};

export const formatDateRangeText = (dateRange: string, customStartDate?: string, customEndDate?: string): string => {
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

export const calculateAllowedGranularities = (
	dateRange: string,
	customStartDate: string,
	customEndDate: string
): ('daily' | 'weekly' | 'monthly')[] => {
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
};
