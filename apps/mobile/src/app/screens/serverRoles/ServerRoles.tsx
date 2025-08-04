import { usePermissionChecker } from '@mezon/core';
import { size, useTheme } from '@mezon/mobile-ui';
import { RolesClanEntity, selectAllRolesClan } from '@mezon/store-mobile';
import { EPermission, EVERYONE_ROLE_ID } from '@mezon/utils';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Platform, Pressable, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../componentUI/MezonIconCDN';
import { SeparatorWithLine } from '../../components/Common';
import ImageNative from '../../components/ImageNative';
import { IconCDN } from '../../constants/icon_cdn';
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
	const allClanRoles = useMemo(() => {
		if (!rolesClan || rolesClan?.length === 0) return [];
		return (rolesClan || []).map((role) => ({ ...role, isView: !(hasAdminPermission || hasManageClanPermission || isClanOwner) }));
	}, [rolesClan, hasAdminPermission, hasManageClanPermission, isClanOwner]);

	useEffect(() => {
		navigation.setOptions({
			headerStatusBarHeight: Platform.OS === 'android' ? 0 : undefined,
			headerRight: () => (
				<Pressable style={{ padding: 20 }} onPress={() => navigation.navigate(APP_SCREEN.MENU_CLAN.CREATE_NEW_ROLE)}>
					<MezonIconCDN icon={IconCDN.plusLargeIcon} height={20} width={20} color={themeValue.textStrong} />
				</Pressable>
			)
		});
	}, [navigation, t, themeValue.textStrong]);

	const navigateToRoleEveryone = () => {
		navigation.navigate(APP_SCREEN.MENU_CLAN.SETUP_PERMISSIONS, { roleId: EVERYONE_ROLE_ID });
	};

	const navigateToRoleDetail = (clanRole: RolesClanEntity) => {
		navigation.navigate(APP_SCREEN.MENU_CLAN.ROLE_DETAIL, { role: clanRole });
	};
	return (
		<View style={{ backgroundColor: themeValue.primary, flex: 1, paddingHorizontal: size.s_14 }}>
			<View style={{ paddingVertical: size.s_14 }}>
				<Text
					style={{
						textAlign: 'center',
						color: themeValue.text
					}}
				>
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
							<MezonIconCDN icon={IconCDN.groupIcon} color={themeValue.text} />
						</View>
						<View style={{ flex: 1 }}>
							<Text
								style={{
									color: themeValue.white
								}}
							>
								@everyone
							</Text>
							<Text
								style={{
									color: themeValue.text
								}}
								numberOfLines={1}
							>
								{t('defaultRole')}
							</Text>
						</View>
					</View>
					<MezonIconCDN icon={IconCDN.chevronSmallRightIcon} color={themeValue.text} />
				</View>
			</TouchableOpacity>

			<View style={{ marginTop: size.s_10, flex: 1 }}>
				<Text
					style={{
						color: themeValue.text
					}}
				>
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
								initialNumToRender={1}
								maxToRenderPerBatch={1}
								windowSize={2}
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
												<MezonIconCDN icon={IconCDN.shieldUserIcon} color={'gray'} height={size.s_32} width={size.s_32} />
												{!!item?.role_icon && (
													<ImageNative url={item?.role_icon} style={{ height: size.s_32, width: size.s_32 }} />
												)}
												<View style={{ flex: 1 }}>
													<View style={{ flexDirection: 'row', gap: size.s_6 }}>
														<Text
															style={{
																color: themeValue.white
															}}
														>
															{item.title}
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
													<Text
														style={{
															color: themeValue.text
														}}
													>
														{item?.role_user_list?.role_users?.length || '0'} - {t('members')}
													</Text>
												</View>
												<View>
													<MezonIconCDN icon={IconCDN.chevronSmallRightIcon} color={themeValue.text} />
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
						<Text
							style={{
								textAlign: 'center',
								color: themeValue.text
							}}
						>
							{t('noRole')}
						</Text>
					</View>
				)}
			</View>
		</View>
	);
};
