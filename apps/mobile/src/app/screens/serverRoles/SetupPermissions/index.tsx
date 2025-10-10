import { usePermissionChecker, useRoles } from '@mezon/core';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import { appActions, selectAllPermissionsDefault, selectAllRolesClan, useAppDispatch } from '@mezon/store-mobile';
import { EPermission } from '@mezon/utils';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Platform, Pressable, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../../componentUI/MezonIconCDN';
import MezonInput from '../../../componentUI/MezonInput';
import MezonSwitch from '../../../componentUI/MezonSwitch';
import { SeparatorWithLine } from '../../../components/Common';
import StatusBarHeight from '../../../components/StatusBarHeight/StatusBarHeight';
import { IconCDN } from '../../../constants/icon_cdn';
import type { MenuClanScreenProps } from '../../../navigation/ScreenTypes';
import { APP_SCREEN } from '../../../navigation/ScreenTypes';
import { isEqualStringArrayUnordered, normalizeString } from '../../../utils/helpers';
import { style } from './styles';

type SetupPermissionsScreen = typeof APP_SCREEN.MENU_CLAN.SETUP_PERMISSIONS;
export const SetupPermissions = ({ navigation, route }: MenuClanScreenProps<SetupPermissionsScreen>) => {
	const roleId = route.params?.roleId;
	const { t } = useTranslation('clanRoles');
	const dispatch = useAppDispatch();
	const rolesClan = useSelector(selectAllRolesClan);
	const [originSelectedPermissions, setOriginSelectedPermissions] = useState<string[]>([]);
	const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
	const [searchPermissionText, setSearchPermissionText] = useState('');
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { updateRole } = useRoles();
	const [hasAdminPermission, hasManageClanPermission, isClanOwner] = usePermissionChecker([
		EPermission.administrator,
		EPermission.manageClan,
		EPermission.clanOwner
	]);

	const clanRole = useMemo(() => {
		return rolesClan?.find((r) => r?.id === roleId);
	}, [rolesClan, roleId]);

	const defaultPermissionList = useSelector(selectAllPermissionsDefault);

	const isEditRoleMode = useMemo(() => {
		return Boolean(roleId);
	}, [roleId]);

	//Note: create new role
	const newRole = useMemo(() => {
		return rolesClan?.[rolesClan.length - 1];
	}, [rolesClan]);

	const isCanEditRole = useMemo(() => {
		if (!newRole) return false;
		return hasAdminPermission || isClanOwner || hasManageClanPermission;
	}, [hasAdminPermission, hasManageClanPermission, isClanOwner, newRole]);

	const getDisablePermission = useCallback(
		(slug: string) => {
			switch (slug) {
				case EPermission.administrator:
					return !isClanOwner || !isCanEditRole;
				case EPermission.manageClan:
					return (!isClanOwner && !hasAdminPermission) || !isCanEditRole;
				default:
					return !isCanEditRole;
			}
		},
		[hasAdminPermission, isClanOwner, isCanEditRole]
	);

	const permissionList = useMemo(() => {
		return defaultPermissionList?.map((p) => ({ ...p, disabled: getDisablePermission(p?.slug) }));
	}, [defaultPermissionList, getDisablePermission]);

	const isNotChange = useMemo(() => {
		return isEqualStringArrayUnordered(originSelectedPermissions, selectedPermissions);
	}, [originSelectedPermissions, selectedPermissions]);

	const handleEditPermissions = useCallback(async () => {
		try {
			dispatch(appActions.setLoadingMainMobile(true));
			const listAddPermissions = selectedPermissions?.filter((permission) => !originSelectedPermissions?.includes(permission));
			const removePermissionList = originSelectedPermissions?.filter((id) => !selectedPermissions?.includes(id));
			const response = await updateRole(
				clanRole?.clan_id,
				clanRole?.id,
				clanRole?.title,
				clanRole?.color || '',
				[],
				listAddPermissions,
				[],
				removePermissionList
			);
			if ((response as any)?.ok !== undefined && (response as any)?.ok === false) {
				throw new Error('failed');
			} else {
				Toast.show({
					type: 'success',
					props: {
						text2: t('roleDetail.changesSaved'),
						leadingIcon: <MezonIconCDN icon={IconCDN.checkmarkSmallIcon} color={baseColor.green} width={20} height={20} />
					}
				});
				navigation.goBack();
			}
		} catch (error) {
			console.error(error);
			Toast.show({
				type: 'success',
				props: {
					text2: t('failed'),
					leadingIcon: <MezonIconCDN icon={IconCDN.closeIcon} color={baseColor.redStrong} width={20} height={20} />
				}
			});
		} finally {
			dispatch(appActions.setLoadingMainMobile(false));
		}
	}, [
		clanRole?.clan_id,
		clanRole?.color,
		clanRole?.id,
		clanRole?.title,
		dispatch,
		navigation,
		originSelectedPermissions,
		selectedPermissions,
		t,
		updateRole
	]);

	const handleClose = useCallback(() => {
		if (isEditRoleMode) {
			navigation.goBack();
		} else {
			navigation.navigate(APP_SCREEN.MENU_CLAN.ROLE_SETTING);
		}
	}, [isEditRoleMode, navigation]);

	const onSelectPermissionChange = useCallback((value: boolean, permissionId: string) => {
		setSelectedPermissions((prevSelected) => {
			const uniqueSelectedPermission = new Set(prevSelected);
			if (value) {
				uniqueSelectedPermission.add(permissionId);
			} else {
				uniqueSelectedPermission.delete(permissionId);
			}
			return Array.from(uniqueSelectedPermission);
		});
	}, []);

	const handleNextStep = async () => {
		const response = await updateRole(newRole?.clan_id, newRole?.id, newRole?.title, newRole?.color || '', [], selectedPermissions, [], []);
		if (response) {
			navigation.navigate(APP_SCREEN.MENU_CLAN.SETUP_ROLE_MEMBERS);
		} else {
			Toast.show({
				type: 'success',
				props: {
					text2: t('failed'),
					leadingIcon: <MezonIconCDN icon={IconCDN.closeIcon} color={baseColor.redStrong} width={20} height={20} />
				}
			});
		}
	};

	//Note: edit role case
	useEffect(() => {
		if (clanRole?.id) {
			const selectedPermissions = clanRole?.permission_list?.permissions?.filter((it) => it?.active).map((it) => it?.id);
			setOriginSelectedPermissions(selectedPermissions);
			setSelectedPermissions(selectedPermissions);
		}
	}, [clanRole]);

	const getPermissionTitle = useCallback(
		(slug: string) => {
			const titleKey = `permissionTitles.${slug}`;
			const title = t(titleKey);
			return title !== titleKey ? title : '';
		},
		[t]
	);

	const getPermissionDescription = useCallback(
		(slug: string) => {
			const descriptionKey = `permissionDescriptions.${slug}`;
			const description = t(descriptionKey);
			return description !== descriptionKey ? description : t('permissionDescriptions.notAvailable');
		},
		[t]
	);

	const filteredPermissionList = useMemo(() => {
		return permissionList.filter((it) => normalizeString(it?.title).includes(normalizeString(searchPermissionText)));
	}, [searchPermissionText, permissionList]);

	return (
		<KeyboardAvoidingView
			behavior={'padding'}
			keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : StatusBar.currentHeight + 5}
			style={styles.flex}
		>
			<StatusBarHeight />
			<View style={styles.header}>
				<Pressable style={styles.backButton} onPress={handleClose}>
					<MezonIconCDN
						icon={isEditRoleMode ? IconCDN.arrowLargeLeftIcon : IconCDN.closeSmallBold}
						height={size.s_20}
						width={size.s_20}
						color={themeValue.textStrong}
					/>
				</Pressable>
				{!isEditRoleMode ? (
					<Text style={styles.title}>{t('setupPermission.title')}</Text>
				) : (
					<View style={styles.roleName}>
						<Text style={styles.name} numberOfLines={1}>
							{clanRole?.title}
						</Text>
						<Text style={styles.emptyText}>{t('roleDetail.role')}</Text>
					</View>
				)}
				{!isEditRoleMode || (isEditRoleMode && isNotChange) ? null : (
					<TouchableOpacity onPress={handleEditPermissions}>
						<View style={styles.saveButton}>
							<Text style={styles.saveText}>{t('roleDetail.save')}</Text>
						</View>
					</TouchableOpacity>
				)}
			</View>
			<View style={styles.wrapper}>
				<View style={styles.flex}>
					<View style={styles.permissionTitle}>
						<Text style={styles.text}>{t('setupPermission.setupPermissionTitle')}</Text>
					</View>

					<MezonInput
						value={searchPermissionText}
						onTextChange={setSearchPermissionText}
						placeHolder={t('setupPermission.searchPermission')}
					/>

					<View style={styles.permissionPanel}>
						<View style={{ borderRadius: size.s_10, overflow: 'hidden' }}>
							<FlatList
								data={filteredPermissionList}
								keyExtractor={(item) => item.id}
								ItemSeparatorComponent={SeparatorWithLine}
								initialNumToRender={1}
								maxToRenderPerBatch={1}
								windowSize={2}
								renderItem={({ item }) => {
									return (
										<TouchableOpacity
											onPress={() => onSelectPermissionChange(!selectedPermissions?.includes(item?.id), item?.id)}
											disabled={item?.disabled}
										>
											<View style={styles.permissionItem}>
												<View style={styles.flex}>
													<Text
														style={{
															color: item?.disabled ? themeValue.textDisabled : themeValue.white
														}}
													>
														{item?.slug ? getPermissionTitle(item.slug) || item.title : item.title}
													</Text>
													<Text style={styles.permissionDescription}>{getPermissionDescription(item?.slug)}</Text>
												</View>

												<View style={styles.switchContainer}>
													<MezonSwitch
														value={selectedPermissions?.includes(item?.id)}
														onValueChange={(isSelect) => onSelectPermissionChange(isSelect, item?.id)}
														disabled={item?.disabled}
													/>
												</View>
											</View>
										</TouchableOpacity>
									);
								}}
							/>
						</View>
					</View>
				</View>

				{!isEditRoleMode ? (
					<View style={styles.bottomButton}>
						<TouchableOpacity onPress={() => handleNextStep()}>
							<View style={styles.finishButton}>
								<Text style={styles.buttonText}>{t('setupPermission.next')}</Text>
							</View>
						</TouchableOpacity>

						<TouchableOpacity onPress={() => navigation.navigate(APP_SCREEN.MENU_CLAN.SETUP_ROLE_MEMBERS)}>
							<View style={styles.cancelButton}>
								<Text style={styles.buttonText}>{t('skipStep')}</Text>
							</View>
						</TouchableOpacity>
					</View>
				) : null}
			</View>
		</KeyboardAvoidingView>
	);
};
