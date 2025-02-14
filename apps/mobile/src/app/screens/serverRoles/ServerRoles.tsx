import { usePermissionChecker } from '@mezon/core';
import { Icons } from '@mezon/mobile-components';
import { Text, size, useTheme } from '@mezon/mobile-ui';
import { RolesClanEntity, selectAllRolesClan, selectEveryoneRole } from '@mezon/store-mobile';
import { EPermission } from '@mezon/utils';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import { SeparatorWithLine } from '../../components/Common';
import { APP_SCREEN, MenuClanScreenProps } from '../../navigation/ScreenTypes';

type ClanSettingsScreen = typeof APP_SCREEN.MENU_CLAN.ROLE_SETTING;
export const ServerRoles = ({ navigation }: MenuClanScreenProps<ClanSettingsScreen>) => {
	const { t } = useTranslation('clanRoles');
	const rolesClan = useSelector(selectAllRolesClan);
	const { themeValue } = useTheme();
	const [hasAdminPermission, hasManageClanPermission, isClanOwner] = usePermissionChecker([
		EPermission.administrator,
		EPermission.manageClan,
		EPermission.clanOwner
	]);
	const everyoneRole = useSelector(selectEveryoneRole);

	const allClanRoles = useMemo(() => {
		if (!rolesClan || rolesClan?.length === 0) return [];
		return (rolesClan || []).map((role) => ({ ...role, isView: !(hasAdminPermission || hasManageClanPermission || isClanOwner) }));
	}, [rolesClan, hasAdminPermission, hasManageClanPermission, isClanOwner]);

	navigation.setOptions({
		headerRight: () => (
			<Pressable style={{ padding: 20 }} onPress={() => navigation.navigate(APP_SCREEN.MENU_CLAN.CREATE_NEW_ROLE)}>
				<Icons.PlusLargeIcon height={20} width={20} color={themeValue.textStrong} />
			</Pressable>
		)
	});

	const navigateToRoleEveryone = () => {
		navigation.navigate(APP_SCREEN.MENU_CLAN.SETUP_PERMISSIONS, { roleId: everyoneRole?.id });
	};

	const navigateToRoleDetail = (clanRole: RolesClanEntity) => {
		navigation.navigate(APP_SCREEN.MENU_CLAN.ROLE_DETAIL, { roleId: clanRole?.id });
	};
	return (
		<View style={{ backgroundColor: themeValue.primary, flex: 1, paddingHorizontal: size.s_14 }}>
			<View style={{ paddingVertical: size.s_14 }}>
				<Text center color={themeValue.text}>
					{t('roleDescription')}
				</Text>
			</View>

			<TouchableOpacity onPress={navigateToRoleEveryone}>
				<View
					style={{
						flexDirection: 'row',
						alignItems: 'center',
						justifyContent: 'space-between',
						backgroundColor: themeValue.secondary,
						padding: size.s_12,
						borderRadius: size.s_12
					}}
				>
					<View style={{ flexDirection: 'row', flex: 1, gap: 10 }}>
						<View style={{ backgroundColor: themeValue.tertiary, borderRadius: 50, padding: size.s_8 }}>
							<Icons.GroupIcon color={themeValue.text} />
						</View>
						<View style={{ flex: 1 }}>
							<Text color={themeValue.white}>@everyone</Text>
							<Text color={themeValue.text} numberOfLines={1}>
								{t('defaultRole')}
							</Text>
						</View>
					</View>
					<Icons.ChevronSmallRightIcon color={themeValue.text} />
				</View>
			</TouchableOpacity>

			<View style={{ marginTop: size.s_10, flex: 1 }}>
				<Text color={themeValue.text}>
					{t('roles')} - {allClanRoles?.length - 1 || '0'}
				</Text>
				{allClanRoles.length ? (
					<View style={{ marginVertical: size.s_10, flex: 1 }}>
						<View style={{ borderRadius: size.s_10, overflow: 'hidden' }}>
							<FlatList
								data={allClanRoles}
								scrollEnabled
								showsVerticalScrollIndicator={false}
								keyExtractor={(item) => item.id}
								renderItem={({ item, index }) => {
									if (item.slug === 'everyone') return null;
									return (
										<TouchableOpacity onPress={() => navigateToRoleDetail(item)}>
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
												<Icons.ShieldUserIcon color={'gray'} height={size.s_32} width={size.s_32} />
												<View style={{ flex: 1 }}>
													<View style={{ flexDirection: 'row', gap: size.s_6 }}>
														<Text color={themeValue.white}>{item.title}</Text>
														{item?.isView && (
															<Icons.LockIcon color={themeValue.textDisabled} height={size.s_16} width={size.s_16} />
														)}
													</View>
													<Text color={themeValue.text}>
														{item?.role_user_list?.role_users?.length || '0'} - {t('members')}
													</Text>
												</View>
												<View>
													<Icons.ChevronSmallRightIcon color={themeValue.text} />
												</View>
											</View>
											{index !== allClanRoles.length - 1 && <SeparatorWithLine />}
										</TouchableOpacity>
									);
								}}
							/>
						</View>
					</View>
				) : (
					<View style={{ marginTop: size.s_20 }}>
						<Text color={themeValue.text} center>
							{t('noRole')}
						</Text>
					</View>
				)}
			</View>
		</View>
	);
};
