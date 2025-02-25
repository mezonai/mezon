import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

export type ToClanPageArgs = {
	clanId: string;
};

export function useAppNavigation() {
	const navigate = useNavigate();

	const toLoginPage = useCallback(() => {
		return `/guest/login`;
	}, []);

	const toHomePage = useCallback(() => {
		return `/`;
	}, []);

	const toDirectMessagePage = useCallback(() => {
		return `/direct-message`;
	}, []);

	const toChannelPage = useCallback((channelId: string, clanId: string) => {
		if (channelId) return `/chat/clans/${clanId}/channels/${channelId}`;
		return `/chat/clans/${clanId}`;
	}, []);

	const toMessageChannel = useCallback((channelId: string, clanId: string, messageId: string) => {
		return `/chat/clans/${clanId}/channels/${channelId}?messageId=${messageId}`;
	}, []);

	const toThreadPage = useCallback((channelId: string, clanId: string, threadId: string) => {
		return `/chat/clans/${clanId}/channels/${channelId}/threads/${threadId}`;
	}, []);

	const toMembersPage = useCallback((clanId: string) => {
		return `/chat/clans/${clanId}/member-safety`;
	}, []);
	const toGuidePage = useCallback((clanId: string) => {
		return `/chat/clans/${clanId}/guide`;
	}, []);
	const toChannelSettingPage = useCallback((clanId: string) => {
		return `/chat/clans/${clanId}/channel-setting`;
	}, []);

	const toClanPage = useCallback((clanId: string) => {
		return `/chat/clans/${clanId}`;
	}, []);

	const toDmGroupPage = useCallback((directId: string, type: number) => {
		return `/chat/direct/message/${directId}/${type}`;
	}, []);

	const toDmGroupPageFromFriendPage = useCallback((directId: string, type: number) => {
		return `../message/${directId}/${type}`;
	}, []);

	const toDmGroupPageFromMainApp = useCallback((directId: string, type: number) => {
		return `chat/direct/message/${directId}/${type}`;
	}, []);

	return useMemo(
		() => ({
			navigate,
			toLoginPage,
			toHomePage,
			toDirectMessagePage,
			toChannelPage,
			toThreadPage,
			toMembersPage,
			toClanPage,
			toDmGroupPage,
			toDmGroupPageFromFriendPage,
			toDmGroupPageFromMainApp,
			toMessageChannel,
			toChannelSettingPage,
			toGuidePage
		}),
		[
			navigate,
			toLoginPage,
			toHomePage,
			toDirectMessagePage,
			toChannelPage,
			toThreadPage,
			toMembersPage,
			toClanPage,
			toDmGroupPage,
			toDmGroupPageFromFriendPage,
			toDmGroupPageFromMainApp,
			toMessageChannel,
			toChannelSettingPage,
			toGuidePage
		]
	);
}
