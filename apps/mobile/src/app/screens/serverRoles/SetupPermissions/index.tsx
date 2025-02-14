import { usePermissionChecker, useRoles } from '@mezon/core';
import { CheckIcon, CloseIcon, Icons, isEqual } from '@mezon/mobile-components';
import { Colors, Text, size, useTheme } from '@mezon/mobile-ui';
import { selectAllPermissionsDefault, selectAllRolesClan, selectEveryoneRole, selectRoleByRoleId } from '@mezon/store-mobile';
import { EPermission } from '@mezon/utils';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Keyboard, Pressable, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import { MezonInput, MezonSwitch } from '../../../componentUI';
import { SeparatorWithLine } from '../../../components/Common';
import { APP_SCREEN, MenuClanScreenProps } from '../../../navigation/ScreenTypes';
import { normalizeString } from '../../../utils/helpers';

type SetupPermissionsScreen = typeof APP_SCREEN.MENU_CLAN.SETUP_PERMISSIONS;
export const SetupPermissions = ({ navigation, route }: MenuClanScreenProps<SetupPermissionsScreen>) => {
	const roleId = route.params?.roleId;
	const { t } = useTranslation('clanRoles');
	const rolesClan = useSelector(selectAllRolesClan);
	const [originSelectedPermissions, setOriginSelectedPermissions] = useState<string[]>([]);
	const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
	const [searchPermissionText, setSearchPermissionText] = useState('');
	const { themeValue } = useTheme();
	const { updateRole } = useRoles();
	const everyoneRole = useSelector(selectEveryoneRole);
	const [hasAdminPermission, hasManageClanPermission, isClanOwner] = usePermissionChecker([
		EPermission.administrator,
		EPermission.manageClan,
		EPermission.clanOwner
	]);

	const clanRole = useSelector(selectRoleByRoleId(roleId)); //Note: edit role
	const defaultPermissionList = useSelector(selectAllPermissionsDefault);

	const isEditRoleMode = useMemo(() => {
		return Boolean(roleId);
	}, [roleId]);

	const isEveryoneRole = useMemo(() => {
		return everyoneRole?.id === clanRole?.id;
	}, [everyoneRole?.id, clanRole?.id]);

	//Note: create new role
	const newRole = useMemo(() => {
		return rolesClan?.[rolesClan.length - 1];
	}, [rolesClan]);

	const isCanEditRole = useMemo(() => {
		if (isEveryoneRole) return false;
		return hasAdminPermission || isClanOwner || hasManageClanPermission;
	}, [hasAdminPermission, hasManageClanPermission, isClanOwner, isEveryoneRole]);

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
		return isEqual(originSelectedPermissions, selectedPermissions);
	}, [originSelectedPermissions, selectedPermissions]);

	const handleEditPermissions = async () => {
		const selectedMembers = clanRole?.role_user_list?.role_users?.map((it) => it?.id);
		const removePermissionList = permissionList?.filter((permission) => !selectedPermissions.includes(permission?.id)).map((it) => it?.id);
		const response = await updateRole(
			clanRole?.clan_id,
			clanRole?.id,
			clanRole?.title,
			clanRole?.color || '',
			selectedMembers,
			selectedPermissions,
			[],
			removePermissionList
		);
		if (response) {
			Toast.show({
				type: 'success',
				props: {
					text2: t('roleDetail.changesSaved'),
					leadingIcon: <CheckIcon color={Colors.green} width={20} height={20} />
				}
			});
			navigation.goBack();
		} else {
			Toast.show({
				type: 'success',
				props: {
					text2: t('failed'),
					leadingIcon: <CloseIcon color={Colors.red} width={20} height={20} />
				}
			});
		}
	};

	navigation.setOptions({
		headerTitle: !isEditRoleMode
			? t('setupPermission.title')
			: () => {
					return (
						<View>
							<Text center bold h3 color={themeValue?.white}>
								{clanRole?.title}
							</Text>
							<Text center color={themeValue?.text}>
								{t('roleDetail.role')}
							</Text>
						</View>
					);
				},
		headerLeft: () => {
			if (isEditRoleMode) {
				return (
					<Pressable style={{ padding: 20 }} onPress={() => navigation.goBack()}>
						<Icons.ArrowLargeLeftIcon height={20} width={20} color={themeValue.textStrong} />
					</Pressable>
				);
			}
			return (
				<Pressable style={{ padding: 20 }} onPress={() => navigation.navigate(APP_SCREEN.MENU_CLAN.ROLE_SETTING)}>
					<Icons.CloseSmallBoldIcon height={20} width={20} color={themeValue.textStrong} />
				</Pressable>
			);
		},
		headerRight: () => {
			if (!isEditRoleMode || (isEditRoleMode && isNotChange)) return null;
			return (
				<TouchableOpacity onPress={() => handleEditPermissions()}>
					<View
						style={{
							marginRight: size.s_14
						}}
					>
						<Text h4 color={Colors.textViolet}>
							{t('roleDetail.save')}
						</Text>
					</View>
				</TouchableOpacity>
			);
		}
	});

	const onSelectPermissionChange = (value: boolean, permissionId: string) => {
		const uniqueSelectedPermission = new Set(selectedPermissions);
		if (value) {
			uniqueSelectedPermission.add(permissionId);
			setSelectedPermissions([...uniqueSelectedPermission]);
			return;
		}
		uniqueSelectedPermission.delete(permissionId);
		setSelectedPermissions([...uniqueSelectedPermission]);
	};

	const handleNextStep = async () => {
		const response = updateRole(newRole?.clan_id, newRole?.id, newRole?.title, newRole?.color || '', [], selectedPermissions, [], []);
		if (response) {
			navigation.navigate(APP_SCREEN.MENU_CLAN.SETUP_ROLE_MEMBERS);
			// Toast.show({
			// 	type: 'success',
			// 	props: {
			// 		text2: t('setupPermission.setupPermissionSuccessfully'),
			// 		leadingIcon: <CheckIcon color={Colors.green} width={20} height={20} />,
			// 	},
			// });
		} else {
			Toast.show({
				type: 'success',
				props: {
					text2: t('failed'),
					leadingIcon: <CloseIcon color={Colors.red} width={20} height={20} />
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

	const filteredPermissionList = useMemo(() => {
		return permissionList.filter((it) => normalizeString(it?.title).includes(normalizeString(searchPermissionText)));
	}, [searchPermissionText, permissionList]);

	return (
		<TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
			<View style={{ backgroundColor: themeValue.primary, flex: 1, paddingHorizontal: size.s_14, justifyContent: 'space-between' }}>
				<View style={{ flex: 1 }}>
					<View
						style={{ paddingVertical: size.s_10, borderBottomWidth: 1, borderBottomColor: themeValue.borderDim, marginBottom: size.s_20 }}
					>
						<Text color={themeValue.white} h2 center bold>
							{t('setupPermission.setupPermissionTitle')}
						</Text>
					</View>

					<MezonInput
						value={searchPermissionText}
						onTextChange={setSearchPermissionText}
						placeHolder={t('setupPermission.searchPermission')}
					/>

					<View style={{ marginVertical: size.s_10, flex: 1 }}>
						<View style={{ borderRadius: size.s_10, overflow: 'hidden' }}>
							<FlatList
								data={filteredPermissionList}
								keyExtractor={(item) => item.id}
								ItemSeparatorComponent={SeparatorWithLine}
								renderItem={({ item }) => {
									return (
										<TouchableOpacity
											onPress={() => onSelectPermissionChange(!selectedPermissions?.includes(item?.id), item?.id)}
											disabled={item?.disabled}
										>
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
												<View style={{ flex: 1 }}>
													<Text color={item?.disabled ? themeValue.textDisabled : themeValue.white}>{item.title}</Text>
												</View>

												<MezonSwitch
													value={selectedPermissions?.includes(item?.id)}
													onValueChange={(isSelect) => onSelectPermissionChange(isSelect, item?.id)}
													disabled={item?.disabled}
												/>
											</View>
										</TouchableOpacity>
									);
								}}
							/>
						</View>
					</View>
				</View>

				{!isEditRoleMode ? (
					<View style={{ marginBottom: size.s_16, gap: size.s_10 }}>
						<TouchableOpacity onPress={() => handleNextStep()}>
							<View style={{ backgroundColor: Colors.bgViolet, paddingVertical: size.s_14, borderRadius: size.s_8 }}>
								<Text center color={Colors.white}>
									{t('setupPermission.next')}
								</Text>
							</View>
						</TouchableOpacity>

						<TouchableOpacity onPress={() => navigation.navigate(APP_SCREEN.MENU_CLAN.SETUP_ROLE_MEMBERS)}>
							<View style={{ paddingVertical: size.s_14, borderRadius: size.s_8 }}>
								<Text center color={themeValue.textStrong}>
									{t('skipStep')}
								</Text>
							</View>
						</TouchableOpacity>
					</View>
				) : null}
			</View>
		</TouchableWithoutFeedback>
	);
};
