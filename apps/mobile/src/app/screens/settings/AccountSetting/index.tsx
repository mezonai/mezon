// eslint-disable-next-line @nx/enforce-module-boundaries
import {
	ActionEmitEvent,
	remove,
	STORAGE_CHANNEL_CURRENT_CACHE,
	STORAGE_DATA_CLAN_CHANNEL_CACHE,
	STORAGE_KEY_TEMPORARY_ATTACHMENT,
	STORAGE_KEY_TEMPORARY_INPUT_MESSAGES
} from '@mezon/mobile-components';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import {
	accountActions,
	appActions,
	authActions,
	channelsActions,
	clansActions,
	directActions,
	getStoreAsync,
	listChannelsByUserActions,
	messagesActions,
	notificationActions,
	selectAllAccount,
	selectBlockedUsers,
	useAppDispatch
} from '@mezon/store-mobile';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Platform, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import MezonConfirm from '../../../componentUI/MezonConfirm';
import MezonIconCDN from '../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../constants/icon_cdn';
import type { SettingScreenProps } from '../../../navigation/ScreenTypes';
import { APP_SCREEN } from '../../../navigation/ScreenTypes';
import { maskEmail, maskPhoneNumber } from '../../../utils/helpers';
import { style } from './styles';

enum EAccountSettingType {
	UserName,
	DisplayName,
	Email,
	PhoneNumber,
	BlockedUsers,
	DisableAccount,
	DeleteAccount,
	SetPassword
}

interface IAccountOption {
	title: string;
	description?: string;
	type: EAccountSettingType;
}

type AccountSettingScreen = typeof APP_SCREEN.SETTINGS.ACCOUNT;
export const AccountSetting = ({ navigation }: SettingScreenProps<AccountSettingScreen>) => {
	const { themeValue } = useTheme();
	const userProfile = useSelector(selectAllAccount);
	const styles = style(themeValue);
	const dispatch = useAppDispatch();
	const { t } = useTranslation('accountSetting');
	const blockedUsers = useSelector(selectBlockedUsers);
	const blockedUsersCount = useMemo(() => {
		if (!blockedUsers?.length) {
			return '';
		}
		return blockedUsers.length?.toString() || '';
	}, [blockedUsers]);

	const logout = async () => {
		const store = await getStoreAsync();
		store.dispatch(directActions.removeAll());
		store.dispatch(notificationActions.removeAll());
		store.dispatch(channelsActions.removeAll());
		store.dispatch(messagesActions.removeAll());
		store.dispatch(listChannelsByUserActions.removeAll());
		store.dispatch(clansActions.setCurrentClanId(''));
		store.dispatch(clansActions.removeAll());
		store.dispatch(clansActions.collapseAllGroups());
		store.dispatch(clansActions.clearClanGroups());
		store.dispatch(clansActions.refreshStatus());

		await remove(STORAGE_DATA_CLAN_CHANNEL_CACHE);
		await remove(STORAGE_CHANNEL_CURRENT_CACHE);
		await remove(STORAGE_KEY_TEMPORARY_INPUT_MESSAGES);
		await remove(STORAGE_KEY_TEMPORARY_ATTACHMENT);
		store.dispatch(appActions.setIsShowWelcomeMobile(false));
		store.dispatch(authActions.logOut({ device_id: userProfile.user.username, platform: Platform.OS }));
		store.dispatch(appActions.setLoadingMainMobile(false));
	};

	const handleDeleteAccount = async () => {
		try {
			const response = await dispatch(accountActions.deleteAccount());

			if (response?.meta?.requestStatus === 'fulfilled') {
				await logout();
				Toast.show({
					type: 'success',
					props: {
						text2: t('toast.deleteAccount.success'),
						leadingIcon: <MezonIconCDN icon={IconCDN.checkmarkSmallIcon} color={baseColor.green} width={size.s_20} height={size.s_20} />
					}
				});
			} else if (response?.meta?.requestStatus === 'rejected') {
				Toast.show({
					type: 'error',
					text1: t('toast.deleteAccount.error')
				});
			}
		} catch (error) {
			console.error('Delete account failed:', error);
		}
	};

	const handleSettingOption = (type: EAccountSettingType) => {
		switch (type) {
			case EAccountSettingType.UserName:
			case EAccountSettingType.DisplayName:
				navigation.navigate(APP_SCREEN.SETTINGS.STACK, { screen: APP_SCREEN.SETTINGS.PROFILE });
				break;
			case EAccountSettingType.Email:
				navigation.navigate(APP_SCREEN.SETTINGS.STACK, {
					screen: APP_SCREEN.SETTINGS.UPDATE_EMAIL,
					params: { currentEmail: userProfile?.email || '' }
				});
				break;
			case EAccountSettingType.PhoneNumber:
				navigation.navigate(APP_SCREEN.SETTINGS.STACK, {
					screen: APP_SCREEN.SETTINGS.UPDATE_PHONE_NUMBER,
					params: { currentPhone: userProfile?.user?.phone_number }
				});
				break;
			case EAccountSettingType.BlockedUsers:
				navigation.navigate(APP_SCREEN.SETTINGS.STACK, { screen: APP_SCREEN.SETTINGS.BLOCKED_USERS });
				break;
			case EAccountSettingType.DeleteAccount: {
				const data = {
					children: (
						<MezonConfirm
							title={t('deleteAccountAlert.title')}
							content={t('deleteAccountAlert.description')}
							confirmText={t('deleteAccountAlert.yesConfirm')}
							isDanger
							onConfirm={() => handleDeleteAccount()}
						/>
					)
				};
				DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
				break;
			}
			case EAccountSettingType.DisableAccount: {
				const disableData = {
					children: (
						<MezonConfirm
							title={t('disableAccountAlert.title')}
							content={t('disableAccountAlert.description')}
							confirmText={t('deleteAccountAlert.yesConfirm')}
							onConfirm={() => logout()}
						/>
					)
				};
				DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data: disableData });
				break;
			}
			case EAccountSettingType.SetPassword:
				if (!userProfile?.email) {
					const linkEmailRequiredData = {
						children: (
							<MezonConfirm
								title={t('setPasswordAccount.linkEmailRequiredTitle')}
								content={t('setPasswordAccount.linkEmailRequiredDescription')}
								confirmText={t('setPasswordAccount.goTo')}
								onConfirm={() => {
									navigation.navigate(APP_SCREEN.SETTINGS.STACK, {
										screen: APP_SCREEN.SETTINGS.UPDATE_EMAIL
									});
									DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: true });
								}}
							/>
						)
					};
					DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data: linkEmailRequiredData });
				} else {
					navigation.navigate(APP_SCREEN.SETTINGS.STACK, { screen: APP_SCREEN.SETTINGS.SET_PASSWORD });
				}
				break;
			default:
				break;
		}
	};

	const settingOptions = useMemo(() => {
		const accountInformationOptions: IAccountOption[] = [
			{
				title: t('username'),
				description: userProfile?.user?.username,
				type: EAccountSettingType.UserName
			},
			{
				title: t('displayName'),
				description: userProfile?.user?.display_name || '',
				type: EAccountSettingType.DisplayName
			},
			{
				title: 'Email',
				description: maskEmail(userProfile?.email),
				type: EAccountSettingType.Email
			},
			{
				title: t('phoneNumberSetting.title'),
				description: maskPhoneNumber(userProfile?.user?.phone_number),
				type: EAccountSettingType.PhoneNumber
			}
		];

		const usersOptions: IAccountOption[] = [
			{
				title: t('blockedUsers'),
				description: blockedUsersCount,
				type: EAccountSettingType.BlockedUsers
			}
		];

		const accountManagementOptions: IAccountOption[] = [
			{
				title: t('setPassword'),
				type: EAccountSettingType.SetPassword
			},
			{
				title: t('disableAccount'),
				type: EAccountSettingType.DisableAccount
			},
			{
				title: t('deleteAccount'),
				type: EAccountSettingType.DeleteAccount
			}
		];
		return {
			accountInformationOptions,
			usersOptions,
			accountManagementOptions
		};
	}, [t, userProfile?.user?.username, userProfile?.user?.display_name, userProfile?.user?.phone_number, userProfile?.email, blockedUsersCount]);

	return (
		<View style={styles.container}>
			<View style={styles.settingGroup}>
				<Text style={styles.settingGroupTitle}>{t('accountInformation')}</Text>
				<View style={styles.optionListWrapper}>
					{settingOptions.accountInformationOptions?.map((item) => {
						return (
							<TouchableOpacity key={item.type.toString()} onPress={() => handleSettingOption(item.type)} style={styles.optionItem}>
								<Text style={styles.optionTitle}>{item.title}</Text>
								<View style={styles.optionRightSide}>
									{item?.description ? (
										<Text numberOfLines={1} style={styles.optionDescription}>
											{item.description}
										</Text>
									) : null}
									<MezonIconCDN
										icon={IconCDN.chevronSmallRightIcon}
										height={size.s_16}
										width={size.s_16}
										color={themeValue?.text}
									/>
								</View>
							</TouchableOpacity>
						);
					})}
				</View>
			</View>

			<View style={styles.settingGroup}>
				<Text style={styles.settingGroupTitle}>{t('users')}</Text>
				<View style={styles.optionListWrapper}>
					{settingOptions.usersOptions?.map((item) => {
						return (
							<TouchableOpacity key={item.type.toString()} onPress={() => handleSettingOption(item.type)} style={styles.optionItem}>
								<Text style={styles.optionTitle}>{item.title}</Text>
								<View style={styles.optionRightSide}>
									{item?.description ? (
										<Text numberOfLines={1} style={styles.optionDescription}>
											{item.description}
										</Text>
									) : null}
									<MezonIconCDN
										icon={IconCDN.chevronSmallRightIcon}
										height={size.s_16}
										width={size.s_16}
										color={themeValue?.text}
									/>
								</View>
							</TouchableOpacity>
						);
					})}
				</View>
			</View>

			<View style={styles.settingGroup}>
				<Text style={styles.settingGroupTitle}>{t('accountManagement')}</Text>
				<View style={styles.optionListWrapper}>
					{settingOptions.accountManagementOptions?.map((item) => {
						return (
							<TouchableOpacity key={item.type.toString()} onPress={() => handleSettingOption(item.type)} style={styles.optionItem}>
								<Text style={[styles.optionTitle, [EAccountSettingType.DeleteAccount].includes(item.type) && styles.textRed]}>
									{item.title}
								</Text>
								<View style={styles.optionRightSide}>
									{item?.description ? (
										<Text numberOfLines={1} style={styles.optionDescription}>
											{item.description}
										</Text>
									) : null}
									<MezonIconCDN
										icon={IconCDN.chevronSmallRightIcon}
										height={size.s_16}
										width={size.s_16}
										color={themeValue?.text}
									/>
								</View>
							</TouchableOpacity>
						);
					})}
				</View>
			</View>
		</View>
	);
};
