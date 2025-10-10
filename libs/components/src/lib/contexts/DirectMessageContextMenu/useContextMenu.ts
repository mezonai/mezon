import type { ChannelMembersEntity } from '@mezon/store';
import { useCallback } from 'react';
import type { DirectMessageContextMenuHandlers } from './types';

interface UseContextMenuHandlersParams {
	setCurrentUser: (user: ChannelMembersEntity | any) => void;
	setCurrentHandlers: (handlers: DirectMessageContextMenuHandlers | null) => void;
	showMenu: (event: React.MouseEvent) => void;
	createDefaultHandlers: (channelId: string, user?: any) => DirectMessageContextMenuHandlers;
	getNotificationSetting: (channelId?: string) => Promise<void>;
	openUserProfile: () => void;
}

export function useContextMenuHandlers({
	setCurrentUser,
	setCurrentHandlers,
	showMenu,
	createDefaultHandlers,
	getNotificationSetting,
	openUserProfile
}: UseContextMenuHandlersParams) {
	const showContextMenu = useCallback(
		async (event: React.MouseEvent, channelId: string, user?: ChannelMembersEntity) => {
			event.preventDefault();

			if (user) {
				setCurrentUser(user?.user ? user?.user : user);

				if (channelId) {
					await getNotificationSetting(channelId);
				}
			}

			const handlers = createDefaultHandlers(channelId, user);
			setCurrentHandlers(handlers);
			showMenu(event);
		},
		[setCurrentUser, getNotificationSetting, createDefaultHandlers, setCurrentHandlers, showMenu]
	);

	const openProfileItem = useCallback(
		(event: React.MouseEvent, user: ChannelMembersEntity) => {
			if (user) {
				setCurrentUser(user);
				openUserProfile();
			}
		},
		[setCurrentUser, openUserProfile]
	);

	return {
		showContextMenu,
		openProfileItem
	};
}
