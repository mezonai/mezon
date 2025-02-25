export const FRIEND_PAGE_LINK = '/chat/direct/friends';

export const toChannelPage = (channelId: string, clanId: string) => {
	if (channelId) return `/chat/clans/${clanId}/channels/${channelId}`;
	return `/chat/clans/${clanId}`;
};

export const toMembersPage = (clanId: string) => {
	return `/chat/clans/${clanId}/member-safety`;
};
