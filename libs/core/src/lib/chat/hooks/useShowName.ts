import { getNameForPrioritize } from '@mezon/utils';

export function getShowName(clanNickname: string, displayName: string, username: string, senderId: string) {
	const NX_CHAT_APP_ANNONYMOUS_USER_ID = process.env.NX_CHAT_APP_ANNONYMOUS_USER_ID || 'anonymous';

	const checkAnonymous = senderId === NX_CHAT_APP_ANNONYMOUS_USER_ID;
	if (checkAnonymous) return 'Anonymous';
	return getNameForPrioritize(clanNickname, displayName, username);
}
