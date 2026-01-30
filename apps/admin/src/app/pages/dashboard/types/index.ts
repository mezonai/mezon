export interface ChartDataPoint {
	date: string;
	isoDate?: string;
	activeUsers: number;
	activeChannels: number;
	messages: number;
}

export interface UsageMetrics {
	totalActiveUsers: number;
	totalActiveChannels: number;
	totalMessages: number;
}

export interface ChannelsData {
	channelName: string;
	activeUsers: number;
	messages: number;
}

export interface UserData {
	userName: string;
	messages: number;
}

export interface ClanData {
	clanId: string;
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
