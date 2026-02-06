export interface ChartDataPoint {
	date: string;
	isoDate?: string;
	activeUsers: number;
	activeChannels: number;
	messages: number;
}

export interface UsageMetrics {
	totalActiveUsers: string;
	totalActiveChannels: string;
	totalMessages: string;
}

export interface ChannelsData {
	channelId: string;
	channelName: string;
	totalUsers: string;
	totalMessages: string;
}

export interface UserData {
	userName: string;
	messages: string;
}

export interface ClanData {
	clanId: string;
	clanName: string;
	totalActiveUsers: number;
	totalActiveChannels: number;
	totalMessages: number;
}

export interface ClanDetailReportProps {
	clanId: string | null;
}

export interface ClanUsageReportProps {
	onClanClick?: (clanId: string) => void;
}
