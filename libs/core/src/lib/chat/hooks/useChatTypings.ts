import { messagesActions, selectCurrentClanId, selectTypingUsersById, useAppDispatch, useAppSelector } from '@mezon/store';
import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useAuth } from '../../auth/hooks/useAuth';

interface UseChatTypingsOptions {
	channelId: string;
	mode: number;
	isPublic: boolean;
	isDM?: boolean;
}

export function useChatTypings({ channelId, mode, isPublic, isDM }: UseChatTypingsOptions) {
	const { userId, userProfile } = useAuth();
	const typingUsers = useAppSelector((state) => selectTypingUsersById(state, channelId, userId as string));
	const currentClanId = useSelector(selectCurrentClanId);
	const dispatch = useAppDispatch();

	const sendMessageTyping = React.useCallback(async () => {
		dispatch(
			messagesActions.sendTypingUser({
				clanId: currentClanId || '',
				channelId,
				mode,
				isPublic: isPublic,
				username: userProfile?.user?.displayName || userProfile?.user?.username || ''
			})
		);
	}, [channelId, currentClanId, dispatch, isPublic, mode]);

	return useMemo(
		() => ({
			typingUsers,
			sendMessageTyping
		}),
		[typingUsers, sendMessageTyping]
	);
}
