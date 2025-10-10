import type { ChannelMembersEntity } from '@mezon/store';

export const DIRECT_MESSAGE_CONTEXT_MENU_ID = 'direct-message-context-menu';
export const DMCT_GROUP_CHAT_ID = 'group-chat-context';

export interface DirectMessageContextMenuProps {
	children: React.ReactNode;
	contextMenuId?: string;
	dataMemberCreate?: { createId: string };
}

export interface DirectMessageContextMenuHandlers {
	handleViewProfile: () => void;
	handleMessage: () => void;
	handleAddFriend: () => void;
	handleRemoveFriend: () => void;
	handleMarkAsRead: () => void;
	handleMute: (duration?: number) => void;
	handleUnmute: () => void;
	handleEnableE2EE: () => void;
	handleRemoveFromGroup: () => void;
	handleLeaveGroup: () => void;
	handleEditGroup: () => void;
	handleBlockFriend: () => Promise<void>;
	handleUnblockFriend: () => Promise<void>;
}

export interface DirectMessageContextMenuContextType {
	setCurrentHandlers: (handlers: DirectMessageContextMenuHandlers | null) => void;
	showMenu: (event: React.MouseEvent) => void;
	setCurrentUser: (user: ChannelMembersEntity | null) => void;
	showContextMenu: (event: React.MouseEvent, channelId: string, user?: ChannelMembersEntity) => void;
	openUserProfile: () => void;
	openProfileItem: (event: React.MouseEvent, user: ChannelMembersEntity) => void;
	contextMenuId: string;
	mutedUntilText: string;
}
