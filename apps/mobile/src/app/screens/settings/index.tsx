import { useAuth } from '@mezon/core';
import {
	debounce,
	remove,
	STORAGE_CHANNEL_CURRENT_CACHE,
	STORAGE_DATA_CLAN_CHANNEL_CACHE,
	STORAGE_KEY_TEMPORARY_ATTACHMENT,
	STORAGE_KEY_TEMPORARY_INPUT_MESSAGES
} from '@mezon/mobile-components';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import {
	appActions,
	authActions,
	channelsActions,
	clansActions,
	getAuthState,
	getStoreAsync,
	listChannelsByUserActions,
	messagesActions
} from '@mezon/store-mobile';
import { sleep } from '@mezon/utils';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Platform, ScrollView, View } from 'react-native';
import WebView from 'react-native-webview';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../componentUI/MezonIconCDN';
import MezonMenu, { IMezonMenuItemProps, IMezonMenuSectionProps } from '../../componentUI/MezonMenu';
import MezonSearch from '../../componentUI/MezonSearch';
import { IconCDN } from '../../constants/icon_cdn';
import { APP_SCREEN } from '../../navigation/ScreenTypes';
import { style } from './styles';

export const Settings = ({ navigation }: { navigation: any }) => {
	const { t, i18n } = useTranslation(['setting']);
	const { themeValue } = useTheme();
	const styles = style(themeValue);

	const [filteredMenu, setFilteredMenu] = useState<IMezonMenuSectionProps[]>([]);
	const [searchText, setSearchText] = useState<string>('');
	const [isShowCancel, setIsShowCancel] = useState<boolean>(false);
	const [linkRedirectLogout, setLinkRedirectLogout] = useState<string>('');
	const authState = useSelector(getAuthState);
	const session = JSON.stringify(authState.session);
	const { userProfile } = useAuth();
	const logout = async () => {
		const store = await getStoreAsync();
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
		setLinkRedirectLogout('');
	};

	const logoutRedirect = async () => {
		const store = await getStoreAsync();
		store.dispatch(appActions.setLoadingMainMobile(true));
		setLinkRedirectLogout(process.env.NX_CHAT_APP_OAUTH2_LOG_OUT);
	};

	const confirmLogout = () => {
		Alert.alert(
			t('logOut'),
			t('logOutPopup.description'),
			[
				{
					text: t('logOutPopup.noConfirm'),
					onPress: () => {},
					style: 'cancel'
				},
				{ text: t('logOutPopup.yesConfirm'), onPress: () => logoutRedirect() }
			],
			{ cancelable: false }
		);
	};

	const AccountMenu = useMemo(
		() =>
			[
				{
					onPress: () => {
						navigation.navigate(APP_SCREEN.SETTINGS.STACK, {
							screen: APP_SCREEN.SETTINGS.ACCOUNT
						});
					},
					expandable: true,
					title: t('accountSettings.account'),
					icon: <MezonIconCDN icon={IconCDN.userCircleIcon} color={themeValue.textStrong} width={size.s_24} height={size.s_24} />
				},
				{
					onPress: () => {
						navigation.navigate(APP_SCREEN.FRIENDS.STACK, {
							screen: APP_SCREEN.FRIENDS.REQUEST_FRIEND
						});
					},
					expandable: true,
					title: t('accountSettings.friendRequests'),
					icon: <MezonIconCDN icon={IconCDN.friendIcon} color={themeValue.textStrong} width={size.s_24} height={size.s_24} />
				},
				{
					onPress: () => {
						navigation.navigate(APP_SCREEN.SETTINGS.STACK, {
							screen: APP_SCREEN.SETTINGS.MY_QR_CODE
						});
					},
					expandable: true,
					title: t('accountSettings.MyQRCode'),
					icon: <MezonIconCDN icon={IconCDN.myQRcodeIcon} color={themeValue.textStrong} width={size.s_24} height={size.s_24} />
				},
				{
					onPress: () => {
						navigation.navigate(APP_SCREEN.SETTINGS.STACK, {
							screen: APP_SCREEN.SETTINGS.QR_SCANNER
						});
					},
					expandable: true,
					title: t('accountSettings.QRScan'),
					icon: <MezonIconCDN icon={IconCDN.scanQR} color={themeValue.textStrong} width={size.s_24} height={size.s_20} />
				}
			] satisfies IMezonMenuItemProps[],
		[navigation, t, themeValue.textStrong, i18n.language]
	);

	const AppMenu = useMemo(
		() =>
			[
				{
					onPress: () => {
						navigation.navigate(APP_SCREEN.SETTINGS.STACK, {
							screen: APP_SCREEN.SETTINGS.APPEARANCE
						});
					},
					expandable: true,
					title: t('appSettings.appearance'),
					icon: <MezonIconCDN icon={IconCDN.paintPaletteIcon} color={themeValue.textStrong} width={size.s_24} height={size.s_24} />
				},
				{
					onPress: () => {
						navigation.navigate(APP_SCREEN.SETTINGS.STACK, {
							screen: APP_SCREEN.SETTINGS.LANGUAGE
						});
					},
					title: t('appSettings.language'),
					expandable: true,
					previewValue: i18n.language,
					icon: <MezonIconCDN icon={IconCDN.languageIcon} color={themeValue.textStrong} width={size.s_24} height={size.s_24} />
				}
			] satisfies IMezonMenuItemProps[],
		[themeValue.textStrong, i18n.language]
	);

	const LogOut = useMemo(
		() =>
			[
				{
					onPress: () => confirmLogout(),
					title: t('logOut'),
					textStyle: { color: baseColor.redStrong },
					icon: <MezonIconCDN icon={IconCDN.doorExitIcon} color={baseColor.redStrong} width={size.s_24} height={size.s_24} />
				}
			] satisfies IMezonMenuItemProps[],
		[i18n.language]
	);

	const menu: IMezonMenuSectionProps[] = [
		{
			title: t('accountSettings.title'),
			items: AccountMenu
		},
		{
			title: t('appSettings.title'),
			items: AppMenu
		},
		{
			items: LogOut
		}
	];

	const renderedMenu = useMemo(() => {
		if (searchText.trim() === '') {
			return menu;
		}
		return filteredMenu;
	}, [filteredMenu, themeValue.textStrong, i18n.language]);

	const debouncedHandleSearchChange = useCallback(
		debounce((text) => {
			const results: IMezonMenuItemProps[] = [];
			menu.forEach((section) => {
				if (section.title) {
					const matchedItems = section.items.filter((item) => item.title.toLowerCase().includes(text.toLowerCase()));
					results.push(...matchedItems);
				}
			});

			setFilteredMenu([
				{
					title: '',
					items: results
				}
			]);
		}, 300),
		[]
	);

	const handleSearchChange = (text: string) => {
		setSearchText(text);
		debouncedHandleSearchChange(text);
	};

	const handleSearchFocus = useCallback(() => {
		setIsShowCancel(true);
	}, []);

	const handleCancelButton = useCallback(() => {
		setIsShowCancel(false);
	}, []);

	const injectedJS = `
    (function() {
	const authData = {
		"loadingStatus":JSON.stringify("loaded"),
		"session": JSON.stringify(${session}),
		"isLogin": "true",
		"_persist": JSON.stringify({"version":-1,"rehydrated":true})
	};
    localStorage.setItem('persist:auth', JSON.stringify(authData));
    })();
	true;
	true;
  `;

	return (
		<View style={styles.settingContainer}>
			<ScrollView contentContainerStyle={styles.settingScroll} keyboardShouldPersistTaps={'handled'}>
				<MezonSearch
					value={searchText}
					isShowCancel={isShowCancel}
					onChangeText={handleSearchChange}
					onFocusText={handleSearchFocus}
					onCancelButton={handleCancelButton}
				/>

				<MezonMenu menu={renderedMenu} />
			</ScrollView>
			{!!linkRedirectLogout && (
				<WebView
					source={{
						uri: linkRedirectLogout
					}}
					style={{ height: 0, position: 'absolute', zIndex: -1 }}
					originWhitelist={['*']}
					injectedJavaScriptBeforeContentLoaded={injectedJS}
					javaScriptEnabled={true}
					nestedScrollEnabled={true}
					onLoadEnd={async () => {
						await sleep(1000);
						await logout();
					}}
				/>
			)}
		</View>
	);
};
