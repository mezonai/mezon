import type { ChannelMembersEntity } from '@mezon/store';
import type { ReactNode } from 'react';
import type { directMessageValueProps } from '../../components/DmList/DMListItem';

export enum ExtendedMemberProfileType {
	MEMBER_LIST = 'MEMBER_LIST',
	LIST_ACTIVITY = 'LIST_ACTIVITY',
	LIST_FRIENDS = 'LIST_FRIENDS',
	DM_LIST = 'DM_LIST',
	DM_MEMBER_GROUP = 'DM_MEMBER_GROUP',
	PANNEL_MEMBER = 'PANNEL_MEMBER'
}

export const MEMBER_CONTEXT_MENU_ID = 'member-context-menu-global';

export interface MemberContextMenuProps {
	children: ReactNode;
}

export interface MemberContextMenuHandlers {
	handleEnableE2EE: () => void;
	handleViewProfile: () => void;
	handleMention: () => void;
	handleDeafen: () => void;
	handleEditClanProfile: () => void;
	handleApps: () => void;
	handleRoles: () => void;
	handleRemoveMember: () => void;
	handleMessage: () => void;
	handleAddFriend: () => void;
	handleRemoveFriend: () => void;
	handleKick: () => void;
	handleRemoveFromThread: () => void;
	handleBanChat: () => void;
}

export interface MemberContextMenuOptions {
	showRemoveOption?: boolean;
	showAddFriendOption?: boolean;
	showRemoveFriendOption?: boolean;
	showMessageOption?: boolean;
	showKickOption?: boolean;
	hideSpecificOptions?: string[];
}

export interface MemberContextMenuContextType {
	setCurrentHandlers: (handlers: MemberContextMenuHandlers) => void;
	showMenu: (event: React.MouseEvent) => void;
	openUserProfile: (user: ChannelMembersEntity, avatar?: string) => void;
	openRemoveMemberModal: (user: ChannelMembersEntity) => void;
	openProfileItem: (event: React.MouseEvent, user: ChannelMembersEntity) => void;
	setCurrentUser: (user: ChannelMembersEntity | null) => void;
	showContextMenu: (
		event: React.MouseEvent,
		channelId: string,
		user?: ChannelMembersEntity,
		directMessageValue?: directMessageValueProps,
		isThread?: boolean
	) => Promise<void>;
}
