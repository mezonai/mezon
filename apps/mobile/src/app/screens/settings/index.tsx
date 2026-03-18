import { ActionEmitEvent, debounce } from '@mezon/mobile-components';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import { appActions, getAuthState, getStoreAsync } from '@mezon/store-mobile';
import { sleep } from '@mezon/utils';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Pressable, ScrollView, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import VersionInfo from 'react-native-version-info';
import WebView from 'react-native-webview';
import { useSelector } from 'react-redux';
import MezonConfirm from '../../componentUI/MezonConfirm';
import type { IMezonMenuItemProps, IMezonMenuSectionProps } from '../../componentUI/MezonMenu';
import MezonMenu from '../../componentUI/MezonMenu';
import MezonSearch from '../../componentUI/MezonSearch';
import { Icons } from '../../componentUI/MobileIcons';
import StatusBarHeight from '../../components/StatusBarHeight/StatusBarHeight';
import { APP_SCREEN } from '../../navigation/ScreenTypes';
import { logoutGlobal } from '../../utils/helpers';
import { style } from './styles';

export const Settings = ({ navigation }: { navigation: any }) => {
	const { t, i18n } = useTranslation(['setting']);
	const { themeValue } = useTheme();
	const styles = style(themeValue);

	const [filteredMenu, setFilteredMenu] = useState<IMezonMenuSectionProps[]>([]);
	const [searchText, setSearchText] = useState<string>('');
	const [linkRedirectLogout, setLinkRedirectLogout] = useState<string>('');
	const authState = useSelector(getAuthState);
	const session = JSON.stringify(authState.session);
	const logout = async () => {
		await logoutGlobal();
		setLinkRedirectLogout('');
	};

	const logoutRedirect = async () => {
		const store = await getStoreAsync();
		store.dispatch(appActions.setLoadingMainMobile(true));
		setLinkRedirectLogout(process.env.NX_CHAT_APP_OAUTH2_LOG_OUT);
	};

	const confirmLogout = () => {
		const data = {
			children: (
				<MezonConfirm
					title={t('logOut')}
					content={t('logOutPopup.description')}
					confirmText={t('logOutPopup.yesConfirm')}
					isDanger
					onConfirm={() => {
						DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: true });
						logoutRedirect();
					}}
				/>
			)
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
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
					icon: <Icons.AccountIcon color={themeValue.textStrong} primary={themeValue.textDisabled} width={size.s_24} height={size.s_24} />
				},
				{
					onPress: () => {
						navigation.navigate(APP_SCREEN.FRIENDS.STACK, {
							screen: APP_SCREEN.FRIENDS.REQUEST_FRIEND
						});
					},
					expandable: true,
					title: t('accountSettings.friendRequests'),
					icon: (
						<Icons.FriendRequestIcon
							color={themeValue.textStrong}
							primary={themeValue.textDisabled}
							width={size.s_24}
							height={size.s_24}
						/>
					)
				},
				{
					onPress: () => {
						navigation.navigate(APP_SCREEN.SETTINGS.STACK, {
							screen: APP_SCREEN.SETTINGS.QR_SCANNER
						});
					},
					expandable: true,
					title: t('accountSettings.QRScan'),
					icon: <Icons.QrIcon color={themeValue.textStrong} primary={themeValue.textDisabled} width={size.s_24} height={size.s_24} />
				},
				{
					onPress: () => {
						navigation.navigate(APP_SCREEN.SETTINGS.STACK, {
							screen: APP_SCREEN.SETTINGS.DEVICES_MANAGEMENT
						});
					},
					expandable: true,
					title: t('accountSettings.devices'),
					icon: <Icons.DevideIcon color={themeValue.textStrong} primary={themeValue.textDisabled} width={size.s_24} height={size.s_24} />
				}
			] satisfies IMezonMenuItemProps[],
		[navigation, t, themeValue.textStrong]
	);

	const AppMenu = useMemo(
		() =>
			[
				{
					title: t('appSettings.appVersion'),
					previewValue: `${VersionInfo.appVersion}`,
					icon: <Icons.AppIcon color={themeValue.textStrong} primary={themeValue.textDisabled} width={size.s_24} height={size.s_24} />
				},
				{
					onPress: () => {
						navigation.navigate(APP_SCREEN.SETTINGS.STACK, {
							screen: APP_SCREEN.SETTINGS.APPEARANCE
						});
					},
					expandable: true,
					title: t('appSettings.appearance'),
					icon: <Icons.ThemeIcon color={themeValue.textStrong} primary={themeValue.textDisabled} width={size.s_24} height={size.s_24} />
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
					icon: <Icons.LanguageIcon color={themeValue.textStrong} primary={themeValue.textDisabled} width={size.s_24} height={size.s_24} />
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
					icon: <Icons.LogOutIcon color={baseColor.redStrong} width={size.s_24} height={size.s_24} />
				}
			] satisfies IMezonMenuItemProps[],
		[t]
	);

	const menu: IMezonMenuSectionProps[] = useMemo(
		() => [
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
		],
		[AccountMenu, AppMenu, LogOut, t]
	);

	const renderedMenu = useMemo(() => {
		if (searchText.trim() === '') {
			return menu;
		}
		return filteredMenu;
	}, [filteredMenu, menu]);

	const debouncedHandleSearchChange = useCallback(
		debounce((text) => {
			const results: IMezonMenuItemProps[] = [];
			menu.forEach((section) => {
				const matchedItems = section.items.filter((item) => {
					const lowerTitle = item.title.toLowerCase();
					const lowerText = text.toLowerCase();
					return lowerTitle.startsWith(lowerText) || lowerTitle.includes(` ${lowerText}`);
				});
				results.push(...matchedItems);
			});

			setFilteredMenu([
				{
					title: '',
					items: results
				}
			]);
		}, 300),
		[menu]
	);

	const handleSearchChange = (text: string) => {
		setSearchText(text);
		debouncedHandleSearchChange(text);
	};

	useEffect(() => {
		handleSearchChange('');
	}, [t, themeValue]);

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
			<StatusBarHeight isPrimary />
			<LinearGradient
				start={{ x: 1, y: 1 }}
				end={{ x: 0, y: 0 }}
				colors={[
					themeValue.secondary,
					themeValue?.primaryGradiant || themeValue.secondary,
					themeValue.secondary,
					themeValue?.primaryGradiant || themeValue.secondary
				]}
				locations={[0.2, 0.4, 0.8, 0.9]}
				style={styles.absoluteFill}
			/>
			<View style={styles.row}>
				<Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
					<Icons.ArrowLeftIcon color={themeValue.textStrong} width={size.s_24} height={size.s_24} />
				</Pressable>
				<Text style={styles.title}>{t('settingStack.settings', { ns: 'screenStack' })}</Text>
			</View>
			<ScrollView contentContainerStyle={styles.settingScroll} keyboardShouldPersistTaps={'handled'}>
				<MezonSearch value={searchText} onChangeText={handleSearchChange} />

				<MezonMenu menu={renderedMenu} />
			</ScrollView>
			{!!linkRedirectLogout && (
				<WebView
					source={{
						uri: linkRedirectLogout
					}}
					style={styles.webViewHidden}
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
