export const FRIEND_PAGE_LINK = '/chat/direct/friends';

export const toChannelPage = (channelId: string, clanId: string) => {
	if (channelId) return `/chat/clans/${clanId}/channels/${channelId}`;
	return `/chat/clans/${clanId}`;
};

export const toMembersPage = (clanId: string) => {
	return `/chat/clans/${clanId}/member-safety`;
};

export const toChannelCanvas = (clanId: string, channelId: string, canvasId: string) => {
	if (clanId && channelId && canvasId) return `/chat/clans/${clanId}/channels/${channelId}/canvas/${canvasId}`;
	return `/chat/clans/${clanId}`;
};
