import { usePermissionChecker, useRoles } from '@mezon/core';
import { ActionEmitEvent, isEqual } from '@mezon/mobile-components';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
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
import type { MenuClanScreenProps } from '../../../navigation/ScreenTypes';
import { APP_SCREEN } from '../../../navigation/ScreenTypes';
import RoleCoLourComponent from '../RoleCoLourComponent/RoleCoLourComponent';
import RoleImagePicker from '../RoleImagePicker';
import { style } from './styles';

enum EActionType {
	permissions,
	members
}

const MAX_ROLE_NAME = 64;

type RoleDetailScreen = typeof APP_SCREEN.MENU_CLAN.ROLE_DETAIL;
export const RoleDetail = ({ navigation, route }: MenuClanScreenProps<RoleDetailScreen>) => {
	const clanRole = route.params?.role;
	const roleId = clanRole?.id;
	const { t } = useTranslation('clanRoles');
	const [originRoleName, setOriginRoleName] = useState('');
	const [currentRoleName, setCurrentRoleName] = useState('');
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const dispatch = useAppDispatch();
	const { updateRole } = useRoles();
	const userMaxPermissionLevel = useSelector(selectUserMaxPermissionLevel);
	const [isClanOwner] = usePermissionChecker([EPermission.clanOwner]);

	const isNotChange = useMemo(() => {
		if (!currentRoleName) return true;
		return isEqual(originRoleName, currentRoleName);
	}, [originRoleName, currentRoleName]);

	const isCanEditRole = useMemo(() => {
		if (!clanRole) return false;
		return isClanOwner || Number(userMaxPermissionLevel) > Number(clanRole?.max_level_permission || 0);
	}, [clanRole, isClanOwner, userMaxPermissionLevel]);

	const isEveryoneRole = useMemo(() => {
		return clanRole?.slug === `everyone-${clanRole?.clan_id}`;
	}, [clanRole?.clan_id, clanRole.slug]);

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
					onCancel={() => navigation?.goBack()}
				/>
			)
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
	}, [isNotChange, navigation, currentRoleName]);

	useEffect(() => {
		navigation.setOptions({
			headerStatusBarHeight: Platform.OS === 'android' ? 0 : undefined,
			headerTitle: () => (
				<View style={styles.center}>
					<Text style={styles.headerTitle} numberOfLines={1}>
						{clanRole?.title}
					</Text>
					<Text style={styles.headerText}>{t('roleDetail.role')}</Text>
				</View>
			),
			headerRight: () => {
				if (isNotChange) return null;
				return (
					<TouchableOpacity onPress={async () => handleSave()}>
						<View style={styles.saveButton}>
							<Text style={styles.saveText}>{t('roleDetail.save')}</Text>
						</View>
					</TouchableOpacity>
				);
			},
			headerLeft: () => {
				return (
					<TouchableOpacity style={styles.backButton} onPress={handleBack}>
						<MezonIconCDN icon={IconCDN.arrowLargeLeftIcon} color={themeValue.white} height={size.s_22} width={size.s_22} />
					</TouchableOpacity>
				);
			}
		});
	}, [clanRole?.title, isNotChange, navigation, t, themeValue?.text, themeValue.white, currentRoleName]);

	const handleSave = useCallback(async () => {
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: true });
		const response = await updateRole(clanRole.clan_id, clanRole.id, currentRoleName, clanRole?.color || '', [], [], [], []);
		if (response) {
			Toast.show({
				type: 'success',
				props: {
					text2: t('roleDetail.changesSaved'),
					leadingIcon: <MezonIconCDN icon={IconCDN.checkmarkSmallIcon} color={baseColor.green} width={20} height={20} />
				}
			});
			navigation.navigate(APP_SCREEN.MENU_CLAN.ROLE_SETTING);
		} else {
			Toast.show({
				type: 'success',
				props: {
					text2: t('failed'),
					leadingIcon: <MezonIconCDN icon={IconCDN.closeIcon} color={baseColor.redStrong} width={20} height={20} />
				}
			});
		}
	}, [clanRole.clan_id, clanRole?.color, clanRole.id, currentRoleName, navigation, t, updateRole]);

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
						navigation.navigate(APP_SCREEN.MENU_CLAN.ROLE_SETTING);
					} else {
						Toast.show({
							type: 'success',
							props: {
								text2: t('failed'),
								leadingIcon: <MezonIconCDN icon={IconCDN.closeIcon} color={baseColor.redStrong} width={20} height={20} />
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

	const actionList = useMemo(() => {
		return [
			{
				id: 1,
				actionTitle: t('roleDetail.permissions'),
				type: EActionType.permissions,
				isView: isCanEditRole
			},
			{
				id: 2,
				actionTitle: t('roleDetail.members'),
				type: EActionType.members,
				isView: isCanEditRole && !isEveryoneRole
			}
		];
	}, [t, isCanEditRole, isEveryoneRole]);

	return (
		<TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
			<View style={styles.container}>
				<View style={styles.nameInput}>
					<MezonInput
						value={currentRoleName}
						onTextChange={setCurrentRoleName}
						placeHolder={t('roleDetail.roleName')}
						label={t('roleDetail.roleName')}
						disabled={!isCanEditRole || isEveryoneRole}
						maxCharacter={MAX_ROLE_NAME}
					/>
				</View>

				<View style={styles.wrapper}>
					<RoleCoLourComponent roleId={roleId} disable={!isCanEditRole} />
					<RoleImagePicker roleId={roleId} disable={!isCanEditRole} />
					<View style={styles.actionList}>
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
									<TouchableOpacity onPress={() => handleAction(item.type)} disabled={!item?.isView}>
										<View style={styles.actionItem}>
											<View style={styles.actionTitleHeader}>
												<Text
													style={{
														color: themeValue.white
													}}
												>
													{item.actionTitle}
												</Text>
												{!item?.isView && (
													<MezonIconCDN
														icon={IconCDN.lockIcon}
														color={themeValue.textDisabled}
														height={size.s_16}
														width={size.s_16}
													/>
												)}
											</View>
											<View>
												{item?.isView && <MezonIconCDN icon={IconCDN.chevronSmallRightIcon} color={themeValue.text} />}
											</View>
										</View>
									</TouchableOpacity>
								);
							}}
						/>
					</View>

					{isCanEditRole && !isEveryoneRole && (
						<View style={{ marginVertical: size.s_10 }}>
							<TouchableOpacity onPress={() => deleteRole()}>
								<View style={styles.deleteButton}>
									<View style={styles.flex}>
										<Text style={styles.deleteText}>{t('roleDetail.deleteRole')}</Text>
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
