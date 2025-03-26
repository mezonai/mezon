import { selectMemberClanByUserId } from '@mezon/store';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { getShowName } from './useShowName';

export const useGetPriorityNameFromUserClan = (senderId: string) => {
	const isAnonymous = useMemo(() => senderId === process.env.NX_CHAT_APP_ANNONYMOUS_USER_ID, [senderId]);

	const userClan = useSelector(selectMemberClanByUserId(senderId));

	const usernameSender = useMemo(() => {
		return userClan?.user?.username;
	}, [userClan?.user?.username]);

	const clanNick = useMemo(() => {
		return userClan?.clan_nick;
	}, [userClan?.clan_nick]);

	const displayName = useMemo(() => {
		return userClan?.user?.display_name;
	}, [userClan?.user?.display_name]);

	const clanAvatar = useMemo(() => {
		return userClan?.clan_avatar;
	}, [userClan?.clan_avatar]);

	const generalAvatar = useMemo(() => {
		return userClan?.user?.avatar_url;
	}, [userClan?.user?.avatar_url]);

	const namePriority = getShowName(clanNick ?? '', displayName ?? '', usernameSender ?? '', senderId);

	const priorityAvatar = useMemo(() => {
		return clanAvatar ? clanAvatar : generalAvatar;
	}, [clanAvatar, generalAvatar]);

	return {
		usernameSender,
		clanNick,
		displayName,
		clanAvatar,
		generalAvatar,
		namePriority,
		priorityAvatar,
		isAnonymous
	};
};
