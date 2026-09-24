export const RECORDING_ANNOUNCE_INTERVAL_MS = 20_000;
export const RECORDING_INDICATOR_TTL_MS = 50_000;

export const recordingParams = (isRecording: boolean) => JSON.stringify({ isRecording });

export const parseRecordingParams = (params?: string): boolean | undefined => {
	if (!params) return undefined;
	try {
		const parsed = JSON.parse(params);
		return typeof parsed?.isRecording === 'boolean' ? parsed.isRecording : undefined;
	} catch {
		return undefined;
	}
};

export const withRecordingUser = (userIds: string[], userId: string, isRecording: boolean): string[] | null => {
	const shown = userIds.includes(userId);
	if (isRecording === shown) return null;
	return isRecording ? [...userIds, userId] : userIds.filter((id) => id !== userId);
};
