import { usePermissionChecker, useRoles } from '@mezon/core';
import { CheckIcon, CloseIcon, Icons, isEqual } from '@mezon/mobile-components';
import { Block, Colors, Text, size, useTheme } from '@mezon/mobile-ui';
import { rolesClanActions, selectRoleByRoleId, useAppDispatch } from '@mezon/store-mobile';
import { EPermission } from '@mezon/utils';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, FlatList, Keyboard, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import { MezonConfirm, MezonInput } from '../../../componentUI';
import { SeparatorWithLine } from '../../../components/Common';
import { APP_SCREEN, MenuClanScreenProps } from '../../../navigation/ScreenTypes';

enum EActionType {
	permissions,
	members
}

type RoleDetailScreen = typeof APP_SCREEN.MENU_CLAN.ROLE_DETAIL;
export const RoleDetail = ({ navigation, route }: MenuClanScreenProps<RoleDetailScreen>) => {
	const roleId = route.params?.roleId;
	const { t } = useTranslation('clanRoles');
	const [originRoleName, setOriginRoleName] = useState('');
	const [currentRoleName, setCurrentRoleName] = useState('');
	const [showModalConfirmSave, setShowModalConfirmSave] = useState(false);
	const { themeValue } = useTheme();
	const dispatch = useAppDispatch();
	const { updateRole } = useRoles();
	const clanRole = useSelector(selectRoleByRoleId(roleId));
	const [hasAdminPermission, hasManageClanPermission, isClanOwner] = usePermissionChecker([
		EPermission.administrator,
		EPermission.manageClan,
		EPermission.clanOwner
	]);
	const isNotChange = useMemo(() => {
		return isEqual(originRoleName, currentRoleName);
	}, [originRoleName, currentRoleName]);

	const isCanEditRole = useMemo(() => {
		if (!clanRole) return false;
		return hasAdminPermission || hasManageClanPermission || isClanOwner;
	}, [clanRole, hasAdminPermission, hasManageClanPermission, isClanOwner]);

	const handleBack = useCallback(() => {
		if (isNotChange) {
			navigation?.goBack();
			return;
		}
		setShowModalConfirmSave(true);
	}, [isNotChange, navigation]);

	navigation.setOptions({
		headerTitle: () => (
			<Block>
				<Text center bold h3 color={themeValue?.white}>
					{clanRole?.title}
				</Text>
				<Text center color={themeValue?.text}>
					{t('roleDetail.role')}
				</Text>
			</Block>
		),
		headerRight: () => {
			if (isNotChange) return null;
			return (
				<TouchableOpacity onPress={async () => handleSave()}>
					<Block marginRight={size.s_20}>
						<Text h4 color={Colors.textViolet}>
							{t('roleDetail.save')}
						</Text>
					</Block>
				</TouchableOpacity>
			);
		},
		headerLeft: () => {
			return (
				<TouchableOpacity onPress={handleBack}>
					<Block marginLeft={size.s_16}>
						<Icons.ArrowLargeLeftIcon color={themeValue.white} height={size.s_22} width={size.s_22} />
					</Block>
				</TouchableOpacity>
			);
		}
	});

	const handleSave = async () => {
		setShowModalConfirmSave(false);
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
					leadingIcon: <CloseIcon color={Colors.red} width={20} height={20} />
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
								leadingIcon: <CloseIcon color={Colors.red} width={20} height={20} />
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
			<Block backgroundColor={themeValue.primary} flex={1} paddingHorizontal={size.s_14}>
				<Block marginTop={size.s_14}>
					<MezonInput
						value={currentRoleName}
						onTextChange={setCurrentRoleName}
						placeHolder={t('roleDetail.roleName')}
						label={t('roleDetail.roleName')}
						disabled={!isCanEditRole}
					/>
				</Block>

				<Block marginVertical={size.s_10} flex={1}>
					<Block borderRadius={size.s_10} overflow="hidden">
						<FlatList
							data={actionList}
							scrollEnabled
							showsVerticalScrollIndicator={false}
							keyExtractor={(item) => item.id.toString()}
							ItemSeparatorComponent={SeparatorWithLine}
							renderItem={({ item }) => {
								return (
									<TouchableOpacity onPress={() => handleAction(item.type)}>
										<Block
											flexDirection="row"
											alignItems="center"
											justifyContent="space-between"
											backgroundColor={themeValue.secondary}
											padding={size.s_12}
											gap={size.s_10}
										>
											<Block flex={1} flexDirection="row" gap={size.s_6}>
												<Text color={themeValue.white}>{item.actionTitle}</Text>
												{item?.isView && (
													<Icons.LockIcon color={themeValue.textDisabled} height={size.s_16} width={size.s_16} />
												)}
											</Block>
											<Block>
												<Icons.ChevronSmallRightIcon color={themeValue.text} />
											</Block>
										</Block>
									</TouchableOpacity>
								);
							}}
						/>
					</Block>

					{isCanEditRole && (
						<Block marginVertical={size.s_10}>
							<TouchableOpacity onPress={() => deleteRole()}>
								<Block
									flexDirection="row"
									alignItems="center"
									justifyContent="space-between"
									backgroundColor={themeValue.secondary}
									paddingVertical={size.s_14}
									paddingHorizontal={size.s_12}
									borderRadius={size.s_10}
								>
									<Block flex={1}>
										<Text color={Colors.textRed}>{t('roleDetail.deleteRole')}</Text>
									</Block>
								</Block>
							</TouchableOpacity>
						</Block>
					)}
				</Block>

				<MezonConfirm
					visible={showModalConfirmSave}
					onVisibleChange={onConfirmModalChange}
					onConfirm={() => handleSave()}
					title={t('roleDetail.confirmSaveTitle')}
					confirmText={t('roleDetail.yes')}
					content={t('roleDetail.confirmSaveContent')}
				/>
			</Block>
		</TouchableWithoutFeedback>
	);
};
