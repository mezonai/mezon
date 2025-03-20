import { useAuth } from '@mezon/core';
import {
	ChevronIcon,
	getAppInfo,
	remove,
	STORAGE_CHANNEL_CURRENT_CACHE,
	STORAGE_DATA_CLAN_CHANNEL_CACHE,
	STORAGE_KEY_TEMPORARY_ATTACHMENT,
	STORAGE_KEY_TEMPORARY_INPUT_MESSAGES
} from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import { authActions, channelsActions, clansActions, getStoreAsync, messagesActions } from '@mezon/store-mobile';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, FlatList, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { SeparatorWithLine } from '../../../components/Common';
import { APP_SCREEN, SettingScreenProps } from '../../../navigation/ScreenTypes';
import { style } from './styles';

enum EAccountSettingType {
	UserName,
	DisplayName,
	BlockedUsers,
	DisableAccount,
	DeleteAccount
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
	const { t } = useTranslation('accountSetting');

	const logout = async () => {
		const store = await getStoreAsync();
		store.dispatch(channelsActions.removeAll());
		store.dispatch(messagesActions.removeAll());
		store.dispatch(clansActions.setCurrentClanId(''));
		store.dispatch(clansActions.removeAll());
		await remove(STORAGE_DATA_CLAN_CHANNEL_CACHE);
		await remove(STORAGE_CHANNEL_CURRENT_CACHE);
		await remove(STORAGE_KEY_TEMPORARY_INPUT_MESSAGES);
		await remove(STORAGE_KEY_TEMPORARY_ATTACHMENT);
		const [appInfo] = await Promise.all([getAppInfo()]);
		const { app_platform: platform } = appInfo;
		store.dispatch(authActions.logOut({ device_id: userProfile.user.username, platform: platform }));
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
					'Delete Account',
					'Are you sure you want to delete this account?',
					[
						{
							text: 'No',
							style: 'cancel'
						},
						{
							text: 'Yes',
							onPress: () => logout()
						}
					],
					{ cancelable: false }
				);
				break;
			case EAccountSettingType.DisableAccount:
				Alert.alert(
					'Disable Account',
					'Are you sure you want to disable this account?',
					[
						{
							text: 'No',
							style: 'cancel'
						},
						{
							text: 'Yes',
							onPress: () => logout()
						}
					],
					{ cancelable: false }
				);
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
				type: EAccountSettingType.DisplayName
			}
		];

		const usersOptions: IAccountOption[] = [
			{
				title: t('blockedUsers'),
				description: '0', //TODO: get blocked count
				type: EAccountSettingType.BlockedUsers
			}
		];

		const accountManagementOptions: IAccountOption[] = [
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
	}, [t, userProfile?.user?.username]);

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
										<ChevronIcon height={15} width={15} color={themeValue?.text} />
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
										<ChevronIcon height={15} width={15} color={themeValue?.text} />
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
										<ChevronIcon height={15} width={15} color={themeValue?.text} />
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
