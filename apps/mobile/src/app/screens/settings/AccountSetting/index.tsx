import { useAuth } from '@mezon/core';
import {
	remove,
	STORAGE_CHANNEL_CURRENT_CACHE,
	STORAGE_DATA_CLAN_CHANNEL_CACHE,
	STORAGE_KEY_TEMPORARY_ATTACHMENT,
	STORAGE_KEY_TEMPORARY_INPUT_MESSAGES
} from '@mezon/mobile-components';
import { Colors, size, useTheme } from '@mezon/mobile-ui';
import {
	accountActions,
	authActions,
	channelsActions,
	clansActions,
	getStoreAsync,
	messagesActions,
	selectBlockedUsers,
	useAppDispatch
} from '@mezon/store-mobile';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, FlatList, Platform, Text, TouchableOpacity, View } from 'react-native';
// eslint-disable-next-line @nx/enforce-module-boundaries
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import { SeparatorWithLine } from '../../../components/Common';
import MezonIconCDN from '../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../constants/icon_cdn';
import { APP_SCREEN, SettingScreenProps } from '../../../navigation/ScreenTypes';
import { style } from './styles';

enum EAccountSettingType {
	UserName,
	DisplayName,
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
	const { userProfile } = useAuth();
	const styles = style(themeValue);
	const dispatch = useAppDispatch();
	const { t } = useTranslation('accountSetting');
	const blockedUsers = useSelector(selectBlockedUsers);
	const blockedUsersCount = blockedUsers?.length.toString();

	const logout = async () => {
		const store = await getStoreAsync();
		store.dispatch(channelsActions.removeAll());
		store.dispatch(messagesActions.removeAll());
		store.dispatch(clansActions.setCurrentClanId(''));
		store.dispatch(clansActions.removeAll());
		store.dispatch(clansActions.clearClanGroups());
		await remove(STORAGE_DATA_CLAN_CHANNEL_CACHE);
		await remove(STORAGE_CHANNEL_CURRENT_CACHE);
		await remove(STORAGE_KEY_TEMPORARY_INPUT_MESSAGES);
		await remove(STORAGE_KEY_TEMPORARY_ATTACHMENT);
		store.dispatch(authActions.logOut({ device_id: userProfile.user.username, platform: Platform.OS }));
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
						leadingIcon: <MezonIconCDN icon={IconCDN.checkmarkSmallIcon} color={Colors.green} width={size.s_20} height={size.s_20} />
					}
				});
			}
		} catch (error) {
			console.error('Delete account failed:', error);
			Toast.show({
				type: 'error',
				props: {
					text2: t('toast.deleteAccount.error'),
					leadingIcon: <MezonIconCDN icon={IconCDN.closeIcon} color={Colors.red} width={size.s_20} height={size.s_20} />
				}
			});
		}
	};

	//TODO: delete
	const showUpdating = () => {
		Toast.show({
			type: 'info',
			text1: 'Coming soon'
		});
	};

	const handleSettingOption = (type: EAccountSettingType) => {
		switch (type) {
			case EAccountSettingType.UserName:
			case EAccountSettingType.DisplayName:
				navigation.navigate(APP_SCREEN.SETTINGS.STACK, { screen: APP_SCREEN.SETTINGS.PROFILE });
				break;
			case EAccountSettingType.BlockedUsers:
				navigation.navigate(APP_SCREEN.SETTINGS.STACK, { screen: APP_SCREEN.SETTINGS.BLOCKED_USERS });
				break;
			case EAccountSettingType.DeleteAccount:
				Alert.alert(
					t('deleteAccountAlert.title'),
					t('deleteAccountAlert.description'),
					[
						{
							text: t('deleteAccountAlert.noConfirm'),
							style: 'cancel'
						},
						{
							text: t('deleteAccountAlert.yesConfirm'),
							onPress: () => handleDeleteAccount()
						}
					],
					{ cancelable: false }
				);
				break;
			case EAccountSettingType.DisableAccount:
				Alert.alert(
					t('disableAccountAlert.title'),
					t('disableAccountAlert.description'),
					[
						{
							text: t('deleteAccountAlert.noConfirm'),
							style: 'cancel'
						},
						{
							text: t('deleteAccountAlert.yesConfirm'),
							onPress: () => logout()
						}
					],
					{ cancelable: false }
				);
				break;
			case EAccountSettingType.SetPassword:
				navigation.navigate(APP_SCREEN.SETTINGS.STACK, { screen: APP_SCREEN.SETTINGS.SET_PASSWORD });
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
	}, [t, userProfile?.user?.username, userProfile?.user?.display_name, blockedUsersCount]);

	return (
		<View style={styles.container}>
			<View style={styles.settingGroup}>
				<Text style={styles.settingGroupTitle}>{t('accountInformation')}</Text>
				<View style={styles.optionListWrapper}>
					<FlatList
						data={settingOptions.accountInformationOptions}
						keyExtractor={(item) => item.type.toString()}
						ItemSeparatorComponent={SeparatorWithLine}
						renderItem={({ item }) => {
							return (
								<TouchableOpacity onPress={() => handleSettingOption(item.type)} style={styles.optionItem}>
									<Text style={styles.optionTitle}>{item.title}</Text>
									<View style={styles.optionRightSide}>
										{item?.description ? <Text style={styles.optionDescription}>{item.description}</Text> : null}
										<MezonIconCDN icon={IconCDN.chevronSmallRightIcon} height={15} width={15} color={themeValue?.text} />
									</View>
								</TouchableOpacity>
							);
						}}
					/>
				</View>
			</View>

			<View style={styles.settingGroup}>
				<Text style={styles.settingGroupTitle}>{t('users')}</Text>
				<View style={styles.optionListWrapper}>
					<FlatList
						data={settingOptions.usersOptions}
						keyExtractor={(item) => item.type.toString()}
						ItemSeparatorComponent={SeparatorWithLine}
						renderItem={({ item }) => {
							return (
								<TouchableOpacity onPress={() => handleSettingOption(item.type)} style={styles.optionItem}>
									<Text style={styles.optionTitle}>{item.title}</Text>
									<View style={styles.optionRightSide}>
										{item?.description ? <Text style={styles.optionDescription}>{item.description}</Text> : null}
										<MezonIconCDN icon={IconCDN.chevronSmallRightIcon} height={15} width={15} color={themeValue?.text} />
									</View>
								</TouchableOpacity>
							);
						}}
					/>
				</View>
			</View>

			<View style={styles.settingGroup}>
				<Text style={styles.settingGroupTitle}>{t('accountManagement')}</Text>
				<View style={styles.optionListWrapper}>
					<FlatList
						data={settingOptions.accountManagementOptions}
						keyExtractor={(item) => item.type.toString()}
						ItemSeparatorComponent={SeparatorWithLine}
						renderItem={({ item }) => {
							return (
								<TouchableOpacity onPress={() => handleSettingOption(item.type)} style={styles.optionItem}>
									<Text style={[styles.optionTitle, [EAccountSettingType.DeleteAccount].includes(item.type) && styles.textRed]}>
										{item.title}
									</Text>
									<View style={styles.optionRightSide}>
										{item?.description ? <Text style={styles.optionDescription}>{item.description}</Text> : null}
										<MezonIconCDN icon={IconCDN.chevronSmallRightIcon} height={15} width={15} color={themeValue?.text} />
									</View>
								</TouchableOpacity>
							);
						}}
					/>
				</View>
			</View>
		</View>
	);
};
