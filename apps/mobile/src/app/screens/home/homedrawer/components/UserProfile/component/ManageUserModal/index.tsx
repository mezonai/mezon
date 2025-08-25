import { useMyRole, usePermissionChecker } from '@mezon/core';
import { baseColor, size, useTheme, verticalScale } from '@mezon/mobile-ui';
import {
	ChannelMembersEntity,
	rolesClanActions,
	selectAllRolesClan,
	selectCurrentClan,
	selectUserMaxPermissionLevel,
	setAddPermissions,
	setRemovePermissions,
	useAppDispatch,
	usersClanActions
} from '@mezon/store-mobile';
import { EPermission } from '@mezon/utils';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import BouncyCheckbox from 'react-native-bouncy-checkbox';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import MezonAvatar from '../../../../../../../componentUI/MezonAvatar';
import MezonIconCDN from '../../../../../../../componentUI/MezonIconCDN';
import ImageNative from '../../../../../../../components/ImageNative';
import { toastConfig } from '../../../../../../../configs/toastConfig';
import { IconCDN } from '../../../../../../../constants/icon_cdn';
import { EActionSettingUserProfile, IProfileSetting } from '../UserSettingProfile';

interface IManageUserModalProp {
	user: ChannelMembersEntity;
	visible: boolean;
	onclose: () => void;
	profileSetting: IProfileSetting[];
}

export const ManageUserModal = memo<IManageUserModalProp>(({ user, visible, onclose, profileSetting }) => {
	const { themeValue } = useTheme();
	const [editMode, setEditMode] = useState(false);
	const rolesClan = useSelector(selectAllRolesClan);
	const currentClan = useSelector(selectCurrentClan);
	const { maxPermissionId } = useMyRole();
	const [selectedRole, setSelectedRole] = useState<string[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const { t } = useTranslation('message');
	const maxPermissionLevel = useSelector(selectUserMaxPermissionLevel);
	const dispatch = useAppDispatch();
	const [isClanOwner] = usePermissionChecker([EPermission.clanOwner]);

	const styles = useMemo(
		() => ({
			container: { flex: 1, backgroundColor: themeValue?.charcoal, paddingTop: size.s_40 },
			headerContainer: {
				flexDirection: 'row' as const,
				alignItems: 'center' as const,
				justifyContent: 'space-between' as const,
				height: size.s_40,
				paddingHorizontal: size.s_14
			},
			headerTitle: { flex: 1 },
			userInfoContainer: {
				flexDirection: 'row' as const,
				alignItems: 'center' as const,
				justifyContent: 'space-between' as const,
				backgroundColor: themeValue.secondary,
				padding: size.s_12,
				gap: size.s_10,
				marginTop: size.s_18,
				marginHorizontal: size.s_14,
				borderRadius: size.s_14
			},
			userInfo: { flex: 1, flexDirection: 'row' as const, gap: size.s_10, alignItems: 'center' as const },
			rolesSection: { marginHorizontal: size.s_14, marginTop: size.s_20 },
			roleListContainer: { borderRadius: size.s_10, overflow: 'hidden' as const, marginTop: size.s_8 },
			roleItemContainer: {
				backgroundColor: themeValue.secondary,
				padding: size.s_14,
				borderBottomWidth: 1,
				borderBottomColor: themeValue.tertiary,
				flexDirection: 'row' as const,
				gap: size.s_10
			},
			roleDisplayContainer: {
				backgroundColor: themeValue.secondary,
				padding: size.s_14,
				borderBottomWidth: 1,
				borderBottomColor: themeValue.tertiary
			},
			checkboxContainer: { height: size.s_20, width: size.s_20 },
			editButtonContainer: { backgroundColor: themeValue.secondary, padding: size.s_14 },
			actionsSection: { marginHorizontal: size.s_14, marginTop: size.s_20 },
			actionItemContainer: {
				backgroundColor: themeValue.secondary,
				padding: size.s_14,
				flexDirection: 'row' as const,
				alignItems: 'center' as const,
				gap: size.s_12
			},
			actionText: { fontSize: verticalScale(14) },
			roleCircle: {
				height: size.s_12,
				width: size.s_12,
				borderRadius: size.s_12,
				backgroundColor: '#008ECC'
			},
			icon: {
				width: size.s_30,
				height: size.s_20,
				flexBasis: size.s_20
			},
			content: {
				flexBasis: size.s_10,
				flexGrow: 1
			},
			roleIcon: {
				height: size.s_20,
				width: size.s_20
			}
		}),
		[themeValue]
	);

	// Memoized checkbox styles
	const checkboxStyles = useMemo(
		() => ({
			iconStyle: { borderRadius: 5 },
			textStyle: { fontFamily: 'JosefinSans-Regular' }
		}),
		[]
	);

	const activeRoleOfUser = useMemo(() => {
		if (!rolesClan || !user?.role_id) return [];
		return rolesClan.filter((role) => user.role_id.includes(role?.id));
	}, [rolesClan, user?.role_id]);

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

	// Memoized filtered profile settings
	const actionableProfileSettings = useMemo(() => {
		return profileSetting.filter((item) => item.value !== EActionSettingUserProfile.Manage && item.isShow);
	}, [profileSetting]);

	const hasActionableSettings = useMemo(() => {
		return actionableProfileSettings.length > 0;
	}, [actionableProfileSettings]);

	// Memoized callback functions
	const handleAfterUpdate = useCallback((isSuccess: boolean) => {
		if (isSuccess) {
			Toast.show({
				type: 'success',
				props: {
					text2: 'Changes Saved',
					leadingIcon: <MezonIconCDN icon={IconCDN.checkmarkSmallIcon} color={baseColor.green} width={20} height={20} />
				}
			});
		} else {
			Toast.show({
				type: 'success',
				props: {
					text2: 'Failed',
					leadingIcon: <MezonIconCDN icon={IconCDN.closeIcon} color={baseColor.redStrong} width={20} height={20} />
				}
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
						clanId: currentClan?.clan_id || '',
						maxPermissionId: maxPermissionId,
						roleIcon: ''
					})
				);
				handleAfterUpdate(Boolean(response?.payload));

				if (response?.payload) {
					dispatch(
						usersClanActions.addRoleIdUser({
							id: roleId,
							clanId: currentClan?.clan_id,
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
		[rolesClan, currentClan?.clan_id, user?.user?.id, handleAfterUpdate, dispatch]
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
						clanId: currentClan?.clan_id || '',
						maxPermissionId: maxPermissionId,
						roleIcon: ''
					})
				);

				handleAfterUpdate(Boolean(response?.payload));

				if (response?.payload) {
					dispatch(
						usersClanActions.removeRoleIdUser({
							id: roleId,
							clanId: currentClan?.clan_id,
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
		[rolesClan, currentClan?.clan_id, user?.user?.id, handleAfterUpdate, dispatch]
	);

	const onSelectedRoleChange = useCallback(
		async (value: boolean, roleId: string, roleColor: string) => {
			if (isLoading) return; // Prevent multiple simultaneous operations

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
		onclose();
		setEditMode(false);
	}, [onclose]);

	const handleToggleEditMode = useCallback(() => {
		setEditMode((prev) => !prev);
	}, []);

	const renderCheckboxInnerStyle = useCallback(
		(isSelected: boolean) => ({
			borderWidth: 1.5,
			borderColor: isSelected ? '#5865f2' : themeValue.tertiary,
			borderRadius: 5
		}),
		[]
	);

	useEffect(() => {
		if (user?.role_id) {
			setIsLoading(false);
			setSelectedRole(user.role_id);
		}
	}, [user?.role_id]);

	// Early return if user is not available
	if (!user?.user) {
		return null;
	}

	return (
		<Modal visible={visible} animationType={'slide'} statusBarTranslucent={true} supportedOrientations={['portrait', 'landscape']}>
			<View style={styles.container}>
				<View style={styles.headerContainer}>
					<View>
						{!isLoading && (
							<TouchableOpacity onPress={handleClose} disabled={isLoading}>
								<MezonIconCDN icon={IconCDN.closeIcon} height={size.s_30} width={size.s_30} color={themeValue.white} />
							</TouchableOpacity>
						)}
					</View>
					<View style={styles.headerTitle}>
						<Text
							style={{
								fontSize: verticalScale(20),
								textAlign: 'center',
								color: themeValue.white
							}}
						>
							{t('manage.edit')} {user?.user?.username}
						</Text>
					</View>
				</View>

				<ScrollView>
					<View style={styles.userInfoContainer}>
						<View style={styles.userInfo}>
							<MezonAvatar avatarUrl={user?.user?.avatar_url || ''} username={user?.user?.username || ''} />
							<View>
								{user?.user?.display_name ? (
									<Text
										style={{
											color: themeValue.white
										}}
									>
										{user?.user?.display_name}
									</Text>
								) : null}
								<Text
									style={{
										color: themeValue.text
									}}
								>
									{user?.user?.username}
								</Text>
							</View>
						</View>
					</View>

					<View style={styles.rolesSection}>
						<Text
							style={{
								fontSize: verticalScale(13),
								color: themeValue.text
							}}
						>
							{t('manage.roles')}
						</Text>
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
												<View style={{ flexDirection: 'row', alignItems: 'center', gap: size.s_6 }}>
													<View style={[styles.roleCircle, role?.color && { backgroundColor: role?.color }]}></View>
													<Text
														style={{
															maxWidth: '80%',
															fontSize: verticalScale(16),
															color: isDisable ? themeValue.textDisabled : themeValue.white
														}}
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
										<Text
											style={{
												maxWidth: '80%',
												fontSize: verticalScale(16),
												color: themeValue.white
											}}
										>
											{role?.title}
										</Text>
									</View>
								);
							})}

							<TouchableOpacity onPress={handleToggleEditMode} disabled={isLoading}>
								<View style={styles.editButtonContainer}>
									<Text
										style={{
											fontSize: editMode ? verticalScale(16) : verticalScale(13),
											color: isLoading ? '#c7c7c7' : baseColor.blurple
										}}
									>
										{editMode ? t('manage.cancel') : t('manage.editRoles')}
									</Text>
								</View>
							</TouchableOpacity>
						</View>
					</View>

					{hasActionableSettings && (
						<View style={styles.actionsSection}>
							<Text
								style={{
									fontSize: verticalScale(13),
									color: themeValue.text
								}}
							>
								Actions
							</Text>

							<View style={styles.roleListContainer}>
								{actionableProfileSettings.map((item, index) => (
									<Pressable
										key={`${item.value}_${index}`}
										onPress={() => item?.action?.(item?.value)}
										style={styles.actionItemContainer}
									>
										{item.icon}
										<Text
											style={{
												fontSize: verticalScale(14),
												color: baseColor.red
											}}
										>
											{item.label} {user?.user?.username}
										</Text>
									</Pressable>
								))}
							</View>
						</View>
					)}
				</ScrollView>
			</View>
			<Toast config={toastConfig} />
		</Modal>
	);
});

ManageUserModal.displayName = 'ManageUserModal';
