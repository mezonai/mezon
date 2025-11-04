import { useMyRole, usePermissionChecker } from '@mezon/core';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import type { ChannelMembersEntity } from '@mezon/store-mobile';
import {
	rolesClanActions,
	selectAllRolesClan,
	selectCurrentClanId,
	selectUserMaxPermissionLevel,
	setAddPermissions,
	setRemovePermissions,
	useAppDispatch,
	usersClanActions
} from '@mezon/store-mobile';
import { EPermission } from '@mezon/utils';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import BouncyCheckbox from 'react-native-bouncy-checkbox';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import MezonAvatar from '../../componentUI/MezonAvatar';
import MezonIconCDN from '../../componentUI/MezonIconCDN';
import ImageNative from '../../components/ImageNative';
import { IconCDN } from '../../constants/icon_cdn';
import { style } from './styles';
import type { IProfileSetting } from './types';
import { EActionSettingUserProfile } from './types';

interface IManageUserProp {
	user: ChannelMembersEntity;
	onClose: () => void;
	memberSettings: IProfileSetting[];
}

export const ManageUser = memo<IManageUserProp>(({ user, onClose, memberSettings }) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const [editMode, setEditMode] = useState(false);
	const rolesClan = useSelector(selectAllRolesClan);
	const currentClanId = useSelector(selectCurrentClanId);
	const { maxPermissionId } = useMyRole();
	const [selectedRole, setSelectedRole] = useState<string[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const { t } = useTranslation(['message', 'common', 'clanRoles']);
	const maxPermissionLevel = useSelector(selectUserMaxPermissionLevel);
	const dispatch = useAppDispatch();
	const [isClanOwner] = usePermissionChecker([EPermission.clanOwner]);

	const checkboxStyles = useMemo(
		() => ({
			iconStyle: { borderRadius: 5 },
			textStyle: { fontFamily: 'JosefinSans-Regular' }
		}),
		[]
	);

	const activeRoleOfUser = useMemo(() => {
		if (!rolesClan) return [];
		return rolesClan.filter((role) => selectedRole.includes(role?.id));
	}, [rolesClan, selectedRole]);

	const editableRoleList = useMemo(() => {
		if (!rolesClan) return [];
		return rolesClan.filter((role) => role?.slug !== `everyone-${role?.clan_id}`);
	}, [rolesClan]);

	const roleList = useMemo(() => {
		if (!editMode) {
			return (
				activeRoleOfUser?.map((role) => ({ ...role, disabled: false }))?.filter((role) => role?.slug !== `everyone-${role?.clan_id}`) || []
			);
		}
		return (
			editableRoleList?.map((role) => ({
				...role,
				disabled: isClanOwner ? false : maxPermissionLevel <= (role?.max_level_permission || 0)
			})) || []
		);
	}, [editMode, activeRoleOfUser, editableRoleList, isClanOwner, maxPermissionLevel]);

	const actionableProfileSettings = useMemo(() => {
		return memberSettings.filter((item) => item.value !== EActionSettingUserProfile.Manage && item.isShow);
	}, [memberSettings]);

	const hasActionableSettings = useMemo(() => {
		return actionableProfileSettings.length > 0;
	}, [actionableProfileSettings]);

	const handleAfterUpdate = useCallback((isSuccess: boolean) => {
		if (isSuccess) {
			Toast.show({
				type: 'success',
				props: {
					text2: t('clanRoles:roleDetail.changesSaved'),
					leadingIcon: <MezonIconCDN icon={IconCDN.checkmarkSmallIcon} color={baseColor.green} width={20} height={20} />
				}
			});
		} else {
			Toast.show({
				type: 'error',
				text1: t('common:saveFailed')
			});
		}
	}, []);

	const addRole = useCallback(
		async (roleId: string, roleColor: string) => {
			try {
				const activeRole = rolesClan?.find((role) => role.id === roleId);
				const response = await dispatch(
					rolesClanActions.updateRole({
						roleId,
						title: activeRole?.title ?? '',
						color: roleColor ?? '',
						addUserIds: [user?.user?.id],
						activePermissionIds: [],
						removeUserIds: [],
						removePermissionIds: [],
						clanId: currentClanId || '',
						maxPermissionId,
						roleIcon: ''
					})
				);
				handleAfterUpdate(Boolean(response?.payload));

				if (response?.payload) {
					dispatch(
						usersClanActions.addRoleIdUser({
							id: roleId,
							clanId: currentClanId,
							userId: user?.user?.id
						})
					);
					dispatch(setAddPermissions([]));
					dispatch(setRemovePermissions([]));
				}
			} catch (error) {
				console.error('Error adding role:', error);
				handleAfterUpdate(false);
			} finally {
				setIsLoading(false);
			}
		},
		[rolesClan, currentClanId, user?.user?.id, handleAfterUpdate, dispatch]
	);

	const deleteRole = useCallback(
		async (roleId: string, roleColor: string) => {
			try {
				const activeRole = rolesClan?.find((role) => role.id === roleId);
				const response = await dispatch(
					rolesClanActions.updateRole({
						roleId,
						title: activeRole?.title ?? '',
						color: roleColor ?? '',
						addUserIds: [],
						activePermissionIds: [],
						removeUserIds: [user?.user?.id],
						removePermissionIds: [],
						clanId: currentClanId || '',
						maxPermissionId,
						roleIcon: ''
					})
				);

				handleAfterUpdate(Boolean(response?.payload));

				if (response?.payload) {
					dispatch(
						usersClanActions.removeRoleIdUser({
							id: roleId,
							clanId: currentClanId,
							userId: user?.user?.id
						})
					);
				}
			} catch (error) {
				console.error('Error removing role:', error);
				handleAfterUpdate(false);
			} finally {
				setIsLoading(false);
			}
		},
		[rolesClan, currentClanId, user?.user?.id, handleAfterUpdate, dispatch]
	);

	const onSelectedRoleChange = useCallback(
		async (value: boolean, roleId: string, roleColor: string) => {
			if (isLoading) return;

			setIsLoading(true);
			const uniqueSelectedRole = new Set(selectedRole);

			if (value) {
				uniqueSelectedRole.add(roleId);
				setSelectedRole([...uniqueSelectedRole]);
				await addRole(roleId, roleColor);
			} else {
				uniqueSelectedRole.delete(roleId);
				setSelectedRole([...uniqueSelectedRole]);
				await deleteRole(roleId, roleColor);
			}
		},
		[selectedRole, isLoading, addRole, deleteRole]
	);

	const handleClose = useCallback(() => {
		onClose();
		setEditMode(false);
	}, [onClose]);

	const handleToggleEditMode = useCallback(() => {
		setEditMode((prev) => !prev);
	}, []);

	const renderCheckboxInnerStyle = useCallback(
		(isSelected: boolean) => ({
			borderWidth: 1.5,
			borderColor: isSelected ? '#5865f2' : themeValue.textDisabled,
			borderRadius: 5
		}),
		[themeValue.tertiary]
	);

	useEffect(() => {
		if (user?.role_id) {
			setIsLoading(false);
			setSelectedRole(user.role_id);
		}
	}, [user?.role_id]);

	if (!user?.user) {
		return (
			<View style={styles.container}>
				<View style={styles.headerContainer}>
					<TouchableOpacity onPress={handleClose}>
						<MezonIconCDN icon={IconCDN.closeIcon} height={size.s_30} width={size.s_30} color={themeValue.white} />
					</TouchableOpacity>
					<View style={styles.headerTitle}>
						<Text style={styles.headerTitleText}>User Not Found</Text>
					</View>
				</View>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<ScrollView>
				<View style={styles.userInfoContainer}>
					<View style={styles.userInfo}>
						<MezonAvatar avatarUrl={user?.user?.avatar_url || ''} username={user?.user?.username || ''} />
						<View>
							{user?.user?.display_name ? <Text style={styles.displayName}>{user?.user?.display_name}</Text> : null}
							<Text style={styles.username}>{user?.user?.username}</Text>
						</View>
					</View>
				</View>

				<View style={styles.rolesSection}>
					<Text style={styles.sectionTitle}>{t('manage.roles')}</Text>
					<View style={styles.roleListContainer}>
						{roleList.map((role) => {
							const isDisable = isLoading || role?.disabled;
							const isSelected = selectedRole?.includes(role?.id);

							if (editMode) {
								return (
									<TouchableOpacity
										key={role?.id}
										onPress={() => onSelectedRoleChange(!isSelected, role?.id, role?.color)}
										disabled={isDisable}
									>
										<View style={styles.roleItemContainer}>
											<View style={styles.checkboxContainer}>
												<BouncyCheckbox
													disabled={isDisable}
													size={20}
													isChecked={isSelected}
													onPress={(value) => onSelectedRoleChange(value, role?.id, role?.color)}
													fillColor={isDisable ? '#676b73' : '#5865f2'}
													iconStyle={checkboxStyles.iconStyle}
													innerIconStyle={renderCheckboxInnerStyle(isSelected)}
													textStyle={checkboxStyles.textStyle}
												/>
											</View>
											<View style={styles.roleInfo}>
												<View style={[styles.roleCircle, role?.color && { backgroundColor: role?.color }]}></View>
												<Text
													style={[styles.roleTitle, { color: isDisable ? themeValue.textDisabled : themeValue.white }]}
													numberOfLines={1}
												>
													{role?.title}
												</Text>
												{role?.role_icon && <ImageNative url={role?.role_icon} style={styles.roleIcon} />}
											</View>
										</View>
									</TouchableOpacity>
								);
							}

							return (
								<View key={role?.id} style={styles.roleDisplayContainer}>
									<Text style={styles.roleTitle}>{role?.title}</Text>
								</View>
							);
						})}

						<TouchableOpacity onPress={handleToggleEditMode} disabled={isLoading}>
							<View style={styles.editButtonContainer}>
								<Text style={[styles.editButtonText, { color: isLoading ? '#c7c7c7' : baseColor.blurple }]}>
									{editMode ? t('manage.cancel') : t('manage.editRoles')}
								</Text>
							</View>
						</TouchableOpacity>
					</View>
				</View>

				{hasActionableSettings && (
					<View style={styles.actionsSection}>
						<Text style={styles.sectionTitle}>{t('common:actions')}</Text>

						<View style={styles.roleListContainer}>
							{actionableProfileSettings.map((item, index) => (
								<Pressable
									key={`${item.value}_${index}`}
									onPress={() => item?.action?.(item?.value)}
									style={styles.actionItemContainer}
								>
									{item.icon}
									<Text style={styles.actionText}>{item.label}</Text>
								</Pressable>
							))}
						</View>
					</View>
				)}
			</ScrollView>
		</View>
	);
});

ManageUser.displayName = 'ManageUser';
