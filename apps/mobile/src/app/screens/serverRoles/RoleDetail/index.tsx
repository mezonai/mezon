import { usePermissionChecker, useRoles } from '@mezon/core';
import { ActionEmitEvent, CheckIcon, isEqual } from '@mezon/mobile-components';
import { Colors, size, useTheme, verticalScale } from '@mezon/mobile-ui';
import { rolesClanActions, selectUserMaxPermissionLevel, useAppDispatch } from '@mezon/store-mobile';
import { EPermission } from '@mezon/utils';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, DeviceEventEmitter, FlatList, Keyboard, Platform, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import MezonConfirm from '../../../componentUI/MezonConfirm';
import MezonIconCDN from '../../../componentUI/MezonIconCDN';
import MezonInput from '../../../componentUI/MezonInput';
import { SeparatorWithLine } from '../../../components/Common';
import { IconCDN } from '../../../constants/icon_cdn';
import { APP_SCREEN, MenuClanScreenProps } from '../../../navigation/ScreenTypes';
import RoleCoLourComponent from '../RoleCoLourComponent/RoleCoLourComponent';
import RoleImagePicker from '../RoleImagePicker';

enum EActionType {
	permissions,
	members
}

type RoleDetailScreen = typeof APP_SCREEN.MENU_CLAN.ROLE_DETAIL;
export const RoleDetail = ({ navigation, route }: MenuClanScreenProps<RoleDetailScreen>) => {
	const clanRole = route.params?.role;
	const roleId = clanRole?.id;
	const { t } = useTranslation('clanRoles');
	const [originRoleName, setOriginRoleName] = useState('');
	const [currentRoleName, setCurrentRoleName] = useState('');
	const { themeValue } = useTheme();
	const dispatch = useAppDispatch();
	const { updateRole } = useRoles();
	const userMaxPermissionLevel = useSelector(selectUserMaxPermissionLevel);
	const [isClanOwner] = usePermissionChecker([EPermission.clanOwner]);

	const isNotChange = useMemo(() => {
		return isEqual(originRoleName, currentRoleName);
	}, [originRoleName, currentRoleName]);

	const isCanEditRole = useMemo(() => {
		if (!clanRole) return false;
		return isClanOwner || Number(userMaxPermissionLevel) > Number(clanRole.max_level_permission);
	}, [clanRole, isClanOwner, userMaxPermissionLevel]);

	const handleBack = useCallback(() => {
		if (isNotChange) {
			navigation?.goBack();
			return;
		}
		const data = {
			children: (
				<MezonConfirm
					onConfirm={() => handleSave()}
					title={t('roleDetail.confirmSaveTitle')}
					confirmText={t('roleDetail.yes')}
					content={t('roleDetail.confirmSaveContent')}
				/>
			)
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
	}, [isNotChange, navigation]);

	useEffect(() => {
		navigation.setOptions({
			headerStatusBarHeight: Platform.OS === 'android' ? 0 : undefined,
			headerTitle: () => (
				<View>
					<Text
						style={{
							fontSize: verticalScale(18),
							textAlign: 'center',
							fontWeight: 'bold',
							color: themeValue.white
						}}
					>
						{clanRole?.title}
					</Text>
					<Text
						style={{
							textAlign: 'center',
							color: themeValue.white
						}}
					>
						{t('roleDetail.role')}
					</Text>
				</View>
			),
			headerRight: () => {
				if (isNotChange) return null;
				return (
					<TouchableOpacity onPress={async () => handleSave()}>
						<View style={{ marginRight: size.s_20 }}>
							<Text
								style={{
									fontSize: verticalScale(18),
									textAlign: 'center',
									color: Colors.textViolet
								}}
							>
								{t('roleDetail.save')}
							</Text>
						</View>
					</TouchableOpacity>
				);
			},
			headerLeft: () => {
				return (
					<TouchableOpacity onPress={handleBack}>
						<View style={{ marginLeft: size.s_16 }}>
							<MezonIconCDN icon={IconCDN.arrowLargeLeftIcon} color={themeValue.white} height={size.s_22} width={size.s_22} />
						</View>
					</TouchableOpacity>
				);
			}
		});
	}, [clanRole?.title, isNotChange, navigation, t, themeValue?.text, themeValue.white]);

	const handleSave = async () => {
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: true });
		const selectedPermissions = clanRole?.permission_list?.permissions.filter((it) => it?.active).map((it) => it?.id);
		const selectedMembers = clanRole?.role_user_list?.role_users?.map((it) => it?.id);
		const response = await updateRole(
			clanRole.clan_id,
			clanRole.id,
			currentRoleName,
			clanRole?.color || '',
			selectedMembers,
			selectedPermissions,
			[],
			[]
		);
		if (response) {
			Toast.show({
				type: 'success',
				props: {
					text2: t('roleDetail.changesSaved'),
					leadingIcon: <CheckIcon color={Colors.green} width={20} height={20} />
				}
			});
			navigation.navigate(APP_SCREEN.MENU_CLAN.ROLE_SETTING);
		} else {
			Toast.show({
				type: 'success',
				props: {
					text2: t('failed'),
					leadingIcon: <MezonIconCDN icon={IconCDN.closeIcon} color={Colors.red} width={20} height={20} />
				}
			});
		}
	};

	const deleteRole = async () => {
		Alert.alert('Delete Role', 'Are you sure you want to delete this role?', [
			{
				text: 'No',
				style: 'cancel'
			},
			{
				text: 'Yes',
				onPress: async () => {
					const response = await dispatch(rolesClanActions.fetchDeleteRole({ roleId: clanRole?.id, clanId: clanRole?.clan_id }));
					if (response?.payload) {
						// Toast.show({
						// 	type: 'success',
						// 	props: {
						// 		text2: t('roleDetail.deleteRoleSuccessfully', { roleName: clanRole?.title }),
						// 		leadingIcon: <CheckIcon color={Colors.green} width={20} height={20} />,
						// 	},
						// });
						navigation.navigate(APP_SCREEN.MENU_CLAN.ROLE_SETTING);
					} else {
						Toast.show({
							type: 'success',
							props: {
								text2: t('failed'),
								leadingIcon: <MezonIconCDN icon={IconCDN.closeIcon} color={Colors.red} width={20} height={20} />
							}
						});
					}
				}
			}
		]);
	};

	useEffect(() => {
		if (clanRole?.title) {
			setOriginRoleName(clanRole.title);
			setCurrentRoleName(clanRole.title);
		}
	}, [clanRole?.title]);

	const handleAction = (type: EActionType) => {
		switch (type) {
			case EActionType.permissions:
				navigation.navigate(APP_SCREEN.MENU_CLAN.SETUP_PERMISSIONS, { roleId });
				break;
			case EActionType.members:
				navigation.navigate(APP_SCREEN.MENU_CLAN.SETUP_ROLE_MEMBERS, { roleId });
				break;
			default:
				break;
		}
	};

	const onConfirmModalChange = (value: boolean) => {
		Keyboard.dismiss();
		if (!value && !isNotChange) {
			navigation?.goBack();
		}
	};

	const actionList = useMemo(() => {
		return [
			{
				id: 1,
				actionTitle: t('roleDetail.permissions'),
				type: EActionType.permissions,
				isView: !isCanEditRole
			},
			{
				id: 2,
				actionTitle: t('roleDetail.members'),
				type: EActionType.members,
				isView: !isCanEditRole
			}
		];
	}, [t, isCanEditRole]);

	return (
		<TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
			<View style={{ backgroundColor: themeValue.primary, flex: 1, paddingHorizontal: size.s_14 }}>
				<View style={{ marginTop: size.s_14 }}>
					<MezonInput
						value={currentRoleName}
						onTextChange={setCurrentRoleName}
						placeHolder={t('roleDetail.roleName')}
						label={t('roleDetail.roleName')}
						disabled={!isCanEditRole}
					/>
				</View>

				<View style={{ marginVertical: size.s_10, flex: 1 }}>
					<RoleCoLourComponent roleId={roleId} disable={!isCanEditRole} />
					<RoleImagePicker roleId={roleId} disable={!isCanEditRole} />
					<View style={{ borderRadius: size.s_10, overflow: 'hidden' }}>
						<FlatList
							data={actionList}
							scrollEnabled
							showsVerticalScrollIndicator={false}
							keyExtractor={(item) => item.id.toString()}
							ItemSeparatorComponent={SeparatorWithLine}
							initialNumToRender={1}
							maxToRenderPerBatch={1}
							windowSize={2}
							renderItem={({ item }) => {
								return (
									<TouchableOpacity onPress={() => handleAction(item.type)} disabled={!isCanEditRole}>
										<View
											style={{
												flexDirection: 'row',
												alignItems: 'center',
												justifyContent: 'space-between',
												backgroundColor: themeValue.secondary,
												padding: size.s_12,
												gap: size.s_10
											}}
										>
											<View style={{ flex: 1, flexDirection: 'row', gap: size.s_6 }}>
												<Text
													style={{
														color: themeValue.white
													}}
												>
													{item.actionTitle}
												</Text>
												{item?.isView && (
													<MezonIconCDN
														icon={IconCDN.lockIcon}
														color={themeValue.textDisabled}
														height={size.s_16}
														width={size.s_16}
													/>
												)}
											</View>
											<View>
												{!item?.isView && <MezonIconCDN icon={IconCDN.chevronSmallRightIcon} color={themeValue.text} />}
											</View>
										</View>
									</TouchableOpacity>
								);
							}}
						/>
					</View>

					{isCanEditRole && (
						<View style={{ marginVertical: size.s_10 }}>
							<TouchableOpacity onPress={() => deleteRole()}>
								<View
									style={{
										flexDirection: 'row',
										alignItems: 'center',
										justifyContent: 'space-between',
										backgroundColor: themeValue.secondary,
										paddingVertical: size.s_14,
										paddingHorizontal: size.s_12,
										borderRadius: size.s_10
									}}
								>
									<View style={{ flex: 1 }}>
										<Text
											style={{
												color: Colors.textRed
											}}
										>
											{t('roleDetail.deleteRole')}
										</Text>
									</View>
								</View>
							</TouchableOpacity>
						</View>
					)}
				</View>
			</View>
		</TouchableWithoutFeedback>
	);
};
