import { ChannelMembersEntity } from '@mezon/store';
import { MemberProfileType } from '@mezon/utils';
import { ReactNode } from 'react';
import { DataMemberCreate } from '../../components/DmList/MemberListGroupChat';

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
	handleMarkAsRead: () => void;
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
	setCurrentOptions: (options: MemberContextMenuOptions) => void;
	showMenu: (event: React.MouseEvent) => void;
	openUserProfile: (user: ChannelMembersEntity, avatar?: string) => void;
	openRemoveMemberModal: (user: ChannelMembersEntity) => void;
	openProfileItem: (event: React.MouseEvent, user: ChannelMembersEntity) => void;
}

export interface MemberMenuHandlersOptions {
	positionType?: MemberProfileType | ExtendedMemberProfileType;
	dataMemberCreate?: DataMemberCreate;
	isDM?: boolean;
	openUserProfile?: () => void;
	onRemoveMember?: () => void;
	onMessage?: () => void;
	onAddFriend?: () => void;
	onRemoveFriend?: () => void;
	onKick?: () => void;
	isFriend?: boolean;
}
