import { optionNotification } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { defaultNotificationActions, selectCurrentClanId, selectDefaultNotificationClan, useAppDispatch } from '@mezon/store-mobile';
import { useLayoutEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, ScrollView } from 'react-native';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../componentUI/MezonIconCDN';
import MezonMenu, { IMezonMenuItemProps, IMezonMenuSectionProps, reserve } from '../../componentUI/MezonMenu';
import MezonOption from '../../componentUI/MezonOption';
import MezonSwitch from '../../componentUI/MezonSwitch';
import { IconCDN } from '../../constants/icon_cdn';
import { APP_SCREEN, MenuClanScreenProps } from '../../navigation/ScreenTypes';
import { CategoryChannel } from './CategoryChannel';
import { style } from './ClanNotificationSetting.styles';

type ClanNotificationSettingScreen = typeof APP_SCREEN.MENU_CLAN.NOTIFICATION_SETTING;
const ClanNotificationSetting = ({ navigation }: MenuClanScreenProps<ClanNotificationSettingScreen>) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const defaultNotificationClan = useSelector(selectDefaultNotificationClan);
	const dispatch = useAppDispatch();
	const currentClanId = useSelector(selectCurrentClanId);
	const { t } = useTranslation(['clanNotificationsSetting']);
	useLayoutEffect(() => {
		navigation.setOptions({
			headerStatusBarHeight: Platform.OS === 'android' ? 0 : undefined,
			headerLeft: () => (
				<Pressable style={{ padding: 20 }} onPress={() => navigation.goBack()}>
					<MezonIconCDN icon={IconCDN.closeSmallBold} height={20} width={20} color={themeValue.textStrong} />
				</Pressable>
			)
		});
	}, [navigation, themeValue.textStrong]);

	const suppressMenu: IMezonMenuItemProps[] = [
		{
			title: t('suppressOption.suppressEveryone'),
			component: <MezonSwitch />,
			onPress: () => reserve()
		},
		{
			title: t('suppressOption.suppressAllRole'),
			component: <MezonSwitch />,
			onPress: () => reserve()
		},
		{
			title: t('suppressOption.suppressHighlights'),
			component: <MezonSwitch />,
			onPress: () => reserve()
		}
	];

	const muteEventMenu: IMezonMenuItemProps[] = [
		{
			title: t('muteEventOptions.muteNewEvents'),
			component: <MezonSwitch />,
			onPress: () => reserve()
		},
		{
			title: t('muteEventOptions.mobilePushNotifications'),
			component: <MezonSwitch />,
			onPress: () => reserve()
		}
	];

	const generalMenu: IMezonMenuSectionProps[] = [
		{
			items: suppressMenu,
			bottomDescription: t('suppressOption.subText')
		},
		{
			items: muteEventMenu
		}
	];

	const notificationOverridesMenu: IMezonMenuSectionProps[] = [
		{
			items: [
				{
					title: t('notificationOverrides.addChannelsAllCategory'),
					onPress: () => handleOverridesNotification(),
					icon: <MezonIconCDN icon={IconCDN.plusLargeIcon} height={16} width={16} color={themeValue.text} />
				}
			],
			title: t('notificationOverrides.title')
		}
	];

	const handleNotificationClanChange = (value: number) => {
		if (value) dispatch(defaultNotificationActions.setDefaultNotificationClan({ clan_id: currentClanId, notification_type: value }));
	};

	const handleOverridesNotification = () => {
		navigation.navigate(APP_SCREEN.MENU_CLAN.STACK, { screen: APP_SCREEN.MENU_CLAN.NOTIFICATION_OVERRIDES });
	};

	return (
		<ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: size.s_50 }}>
			<MezonOption
				value={defaultNotificationClan?.notification_setting_type}
				onChange={handleNotificationClanChange}
				title={t('notifySettingOption.title')}
				data={optionNotification(t)}
			/>
			<MezonMenu menu={generalMenu} />
			<MezonMenu menu={notificationOverridesMenu} />
			<CategoryChannel />
		</ScrollView>
	);
};
export default ClanNotificationSetting;
