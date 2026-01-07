import { selectMemberClanByUserId, useAppSelector } from '@mezon/store';
import { useMemo } from 'react';
import { getShowName } from './useShowName';

export const useGetPriorityNameFromUserClan = (senderId: string) => {
	const isAnonymous = useMemo(() => senderId === process.env.NX_CHAT_APP_ANNONYMOUS_USER_ID, [senderId]);

	const userClan = useAppSelector((state) => selectMemberClanByUserId(state, senderId));

	const usernameSender = useMemo(() => {
		return userClan?.user?.username;
	}, [userClan?.user?.username]);

	const clanNick = useMemo(() => {
		return userClan?.clanNick;
	}, [userClan?.clanNick]);

	const displayName = useMemo(() => {
		return userClan?.user?.displayName;
	}, [userClan?.user?.displayName]);

	const clanAvatar = useMemo(() => {
		return userClan?.clanAvatar;
	}, [userClan?.clanAvatar]);

	const generalAvatar = useMemo(() => {
		return userClan?.user?.avatarUrl;
	}, [userClan?.user?.avatarUrl]);

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
