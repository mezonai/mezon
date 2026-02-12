import { useCallback, useSyncExternalStore } from 'react';
import type { UserTypingState } from './messages.slice';
import { typingUsersService } from './typingUsersService';

const EMPTY_ARRAY: UserTypingState[] = [];

const subscribe = (callback: () => void) => {
	const subscription = typingUsersService.getNotify$().subscribe(callback);
	return () => subscription.unsubscribe();
};

export function useTypingUsersByChannel(channelId: string): UserTypingState[] {
	const getSnapshot = useCallback(() => typingUsersService.getTypingUsersByChannel(channelId), [channelId]);
	return useSyncExternalStore(subscribe, getSnapshot, () => EMPTY_ARRAY);
}

export function useIsUserTyping(channelId: string, userId: string | string[]): boolean {
	const getSnapshot = useCallback(() => typingUsersService.hasTypingUser(channelId, userId), [channelId, userId]);
	return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
