import { usePermissionChecker } from '@mezon/core';
import { useTheme } from '@mezon/mobile-ui';
import { selectAllRolesClan, selectMemberClanByUserId2, useAppSelector } from '@mezon/store-mobile';
import { EPermission, UsersClanEntity } from '@mezon/utils';
import { memo, useCallback, useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import MezonIconCDN from '../../../../../../src/app/componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../../src/app/constants/icon_cdn';
import MezonAvatar from '../../../../componentUI/MezonAvatar';
import ImageNative from '../../../ImageNative';
import { style } from './styles';

interface IUserItem {
	userID: string;
	onMemberSelect?: (member: UsersClanEntity) => void;
}

export const UserItem = memo<IUserItem>(({ userID, onMemberSelect }) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const user = useAppSelector((state) => selectMemberClanByUserId2(state, userID));
	const rolesClan = useAppSelector(selectAllRolesClan);
	const [isClanOwner] = usePermissionChecker([EPermission.clanOwner]);
	const [isManageClan] = usePermissionChecker([EPermission.manageClan]);
	const canEditRoles = useMemo(() => isClanOwner || isManageClan, [isClanOwner, isManageClan]);

	const clanUserRole = useMemo(() => {
		if (!rolesClan) return [];

		return rolesClan.filter((role) => {
			const roleUser = role?.role_user_list?.role_users;
			if (roleUser) {
				return roleUser.some((roleUserItem) => roleUserItem?.id === userID);
			}
			return false;
		});
	}, [userID, rolesClan]);

	const displayName = useMemo(() => {
		if (user?.clan_nick) {
			return user?.clan_nick;
		}
		return user?.user?.display_name ? user?.user?.display_name : user?.user?.username || '';
	}, [user?.clan_nick, user?.user?.display_name, user?.user?.username]);

	const onPressMemberItem = useCallback(() => {
		if (canEditRoles && onMemberSelect && user) {
			onMemberSelect(user);
		}
	}, [canEditRoles, onMemberSelect, user]);

	// Early return if user is not found to prevent crashes (after all hooks)
	if (!user) {
		return null;
	}

	return (
		<Pressable onPress={onPressMemberItem}>
			<View style={styles.container}>
				<MezonAvatar avatarUrl={user?.user?.avatar_url || ''} username={user?.user?.username || ''} />
				<View style={[styles.rightContent]}>
					<View style={styles.content}>
						<Text style={styles.displayName}>{displayName}</Text>
						<Text style={styles.username}>{user?.user?.username || ''}</Text>

						{clanUserRole?.length > 0 && (
							<View style={styles.roleWrapper}>
								{clanUserRole.map((role, index) => (
									<View key={`role_${role?.id || index}_${role?.title || 'unknown'}`} style={styles.roleContainer}>
										<View style={[styles.roleCircle, role?.color && { backgroundColor: role?.color }]}></View>
										{role?.role_icon && <ImageNative url={role?.role_icon} style={styles.roleIcon} />}
										<Text style={styles.roleTitle}>{role?.title || ''}</Text>
									</View>
								))}
							</View>
						)}
					</View>
					{canEditRoles && (
						<View style={styles.icon}>
							<MezonIconCDN icon={IconCDN.chevronSmallRightIcon} color={themeValue.text} height={20} width={20} />
						</View>
					)}
				</View>
			</View>
		</Pressable>
	);
});

UserItem.displayName = 'UserItem';
