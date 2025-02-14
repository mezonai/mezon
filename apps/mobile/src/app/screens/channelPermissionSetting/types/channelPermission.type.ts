import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { ChannelMembersEntity, ChannelsEntity, PermissionUserEntity, RolesClanEntity } from '@mezon/store-mobile';
import { IChannel, UsersClanEntity } from '@mezon/utils';
import { RefObject } from 'react';
import { EAdvancedPermissionSetting, EOverridePermissionType, EPermissionStatus } from './channelPermission.enum';

export interface IMemberItemProps {
	member: ChannelMembersEntity | UsersClanEntity;
	channel?: IChannel;
	isCheckbox?: boolean;
	isChecked?: boolean;
	isAdvancedSetting?: boolean;
	onPress?: (memberId: string, type: EOverridePermissionType) => void;
	onSelectMemberChange?: (value: boolean, memberId: string) => void;
}

export interface IRoleItemProps {
	role: RolesClanEntity;
	channel?: ChannelsEntity;
	isCheckbox?: boolean;
	isChecked?: boolean;
	isAdvancedSetting?: boolean;
	onPress?: (roleId: string, type: EOverridePermissionType) => void;
	onSelectRoleChange?: (value: boolean, roleId: string) => void;
}

export interface IAddMemberOrRoleBSProps {
	bottomSheetRef: RefObject<BottomSheetModal>;
	channel: ChannelsEntity;
}

export interface IAdvancedSettingBSProps {
	bottomSheetRef: RefObject<BottomSheetModal>;
	channel: ChannelsEntity;
	currentAdvancedPermissionType?: EAdvancedPermissionSetting;
}

export interface IAdvancedViewProps {
	isAdvancedEditMode: boolean;
	channel: ChannelsEntity;
}

export interface IBasicViewProps {
	channel: ChannelsEntity;
}

export interface IAddMemberOrRoleContentProps {
	channel: ChannelsEntity;
	onDismiss?: () => void;
}

export interface IPermissionItemProps {
	permission: PermissionUserEntity;
	status?: EPermissionStatus;
	onPermissionStatusChange?: (id: string, status: EPermissionStatus) => void;
}

export interface IPermissionSetting {
	[id: string]: EPermissionStatus;
}
