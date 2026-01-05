/**
 * Get display name for group call
 */
export const getGroupCallDisplayName = (group: { channelLabel?: string; usernames?: string[] }): string => {
	return group.channelLabel || group.usernames?.join(',') || 'Group Call';
};

/**
 * Calculate call duration
 */
export const calculateCallDuration = (startTime: number): string => {
	const duration = Date.now() - startTime;
	const seconds = Math.floor(duration / 1000) % 60;
	const minutes = Math.floor(duration / (1000 * 60)) % 60;
	const hours = Math.floor(duration / (1000 * 60 * 60));

	if (hours > 0) {
		return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
	}
	return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Format participant count for display
 */
export const formatParticipantCount = (count: number): string => {
	if (count === 0) return 'No participants';
	if (count === 1) return '1 participant';
	return `${count} participants`;
};

/**
 * Get call status text
 */
export const getCallStatusText = (isConnecting: boolean, isConnected: boolean, participantCount: number): string => {
	if (isConnected) {
		return `Connected • ${formatParticipantCount(participantCount)}`;
	}
	if (isConnecting) {
		return 'Connecting...';
	}
	return 'Starting call...';
};

/**
 * Get call type display text
 */
export const getCallTypeText = (isVideo: boolean, isIncoming = false): string => {
	const prefix = isIncoming ? 'Incoming' : 'Starting';
	const type = isVideo ? 'video call' : 'voice call';
	return `${prefix} ${type}`;
};

/**
 * Format time ago
 */
export const formatTimeAgo = (timestamp: number): string => {
	const now = Date.now();
	const diff = now - timestamp;
	const seconds = Math.floor(diff / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);

	if (days > 0) return `${days}d ago`;
	if (hours > 0) return `${hours}h ago`;
	if (minutes > 0) return `${minutes}m ago`;
	return 'Just now';
};
