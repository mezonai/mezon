import { useCallback, useMemo } from 'react';
import { useCustomNavigate } from '../../chat/hooks/useCustomNavigate';

export type ToClanPageArgs = {
	clanId: string;
};

export function useAppNavigation() {
	const navigate = useCustomNavigate();

	const toChannelPage = useCallback((channelId: string, clanId: string) => {
		if (channelId) return `/chat/clans/${clanId}/channels/${channelId}`;
		return `/chat/clans/${clanId}`;
	}, []);

	const toMembersPage = useCallback((clanId: string) => {
		return `/chat/clans/${clanId}/member-safety`;
	}, []);

	const toClanPage = useCallback((clanId: string) => {
		return `/chat/clans/${clanId}`;
	}, []);

	const toDmGroupPage = useCallback((directId: string, type: number) => {
		return `/chat/direct/message/${directId}/${type}`;
	}, []);

	const toDmGroupPageFromFriendPage = useCallback((directId: string, type: number) => {
		return `/chat/direct/message/${directId}/${type}`;
	}, []);

	const toDmGroupPageFromMainApp = useCallback((directId: string, type: number) => {
		return `/chat/direct/message/${directId}/${type}`;
	}, []);

	return useMemo(
		() => ({
			navigate,
			toChannelPage,
			toMembersPage,
			toClanPage,
			toDmGroupPage,
			toDmGroupPageFromFriendPage,
			toDmGroupPageFromMainApp
		}),
		[navigate, toChannelPage, toMembersPage, toClanPage, toDmGroupPage, toDmGroupPageFromFriendPage, toDmGroupPageFromMainApp]
	);
}
