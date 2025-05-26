/**
 * Maximum number of participants allowed in a group call
 */
export const MAX_PARTICIPANTS = 50;

/**
 * Validate group call configuration
 */
export const validateGroupCallConfig = (config: { groupId?: string; meetingCode?: string; participants?: string[] }): boolean => {
	if (!config.groupId || !config.meetingCode || !config.participants || config.participants.length === 0) {
		return false;
	}

	if (config.participants.length > MAX_PARTICIPANTS) {
		return false;
	}

	return true;
};

/**
 * Check if user is in participants list
 */
export const isUserInCall = (participants: string[], userId: string): boolean => {
	return participants.includes(userId);
};

/**
 * Filter participants excluding current user
 */
export const getOtherParticipants = (participants: string[], currentUserId: string): string[] => {
	return participants.filter((id) => id !== currentUserId);
};

/**
 * Validate user permissions for group call
 */
export const canUserStartCall = (userId: string, groupParticipants: string[]): boolean => {
	return isUserInCall(groupParticipants, userId);
};

/**
 * Check if call configuration is valid for video call
 */
export const canStartVideoCall = (participants: string[]): boolean => {
	// For now, allow video calls for any number of participants
	return participants.length > 0 && participants.length <= MAX_PARTICIPANTS;
};

/**
 * Check if call configuration is valid for voice call
 */
export const canStartVoiceCall = (participants: string[]): boolean => {
	return participants.length > 0 && participants.length <= MAX_PARTICIPANTS;
};
