import { optionNotification } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { defaultNotificationActions, selectCurrentClanId, selectDefaultNotificationClan, useAppDispatch } from '@mezon/store-mobile';
import { useLayoutEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, ScrollView } from 'react-native';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../componentUI/MezonIconCDN';
import MezonMenu, { IMezonMenuSectionProps } from '../../componentUI/MezonMenu';
import MezonOption from '../../componentUI/MezonOption';
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
				<Pressable style={styles.headerLeftButton} onPress={() => navigation.goBack()}>
					<MezonIconCDN icon={IconCDN.closeSmallBold} height={20} width={20} color={themeValue.textStrong} />
				</Pressable>
			)
		});
	}, [navigation, styles.headerLeftButton, themeValue.textStrong]);

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
		if (value) dispatch(defaultNotificationActions.setDefaultNotificationClan({ clanId: currentClanId, notificationType: value }));
	};

	const handleOverridesNotification = () => {
		navigation.navigate(APP_SCREEN.MENU_CLAN.STACK, { screen: APP_SCREEN.MENU_CLAN.NOTIFICATION_OVERRIDES });
	};

	return (
		<ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
			<MezonOption
				value={defaultNotificationClan?.notificationSettingType}
				onChange={handleNotificationClanChange}
				title={t('notifySettingOption.title')}
				data={optionNotification(t)}
			/>
			<MezonMenu menu={notificationOverridesMenu} />
			<CategoryChannel />
		</ScrollView>
	);
};
export default ClanNotificationSetting;
