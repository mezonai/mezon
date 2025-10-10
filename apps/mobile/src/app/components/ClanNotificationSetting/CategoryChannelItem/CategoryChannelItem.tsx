import { CategoryChannelItemProps, EOptionOverridesType, optionNotification } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import { selectAllchannelCategorySetting } from '@mezon/store-mobile';
import { useNavigation } from '@react-navigation/native';
import { TFunction } from 'i18next';
import { ChannelType, NotificationType } from 'mezon-js';
import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../constants/icon_cdn';
import { APP_SCREEN } from '../../../navigation/ScreenTypes';
import { style } from './CategoryChannelItem.styles';

const getTitleFromValue = (value: NotificationType, t: TFunction) => {
	const options = optionNotification(t);
	const found = options?.find((option) => option.value === value);
	return found ? found.title : '';
};

export const CategoryChannelItem = React.memo(
	({
		typePreviousIcon,
		notificationStatus,
		categorySubtext,
		categoryLabel,
		expandable,
		stylesItem = {},
		data,
		categoryChannelId
	}: CategoryChannelItemProps) => {
		const { themeValue } = useTheme();
		const navigation = useNavigation<any>();
		const styles = style(themeValue);
		const channelCategorySettings = useSelector(selectAllchannelCategorySetting);
		const { t } = useTranslation(['clanNotificationsSetting']);

		const dataNotificationsSetting = useMemo(() => {
			return channelCategorySettings?.find((item) => item?.id === categoryChannelId);
		}, [categoryChannelId, channelCategorySettings]);

		const navigateToNotificationDetail = useCallback(() => {
			navigation.navigate(APP_SCREEN.MENU_CLAN.STACK, {
				screen: APP_SCREEN.MENU_CLAN.NOTIFICATION_SETTING_DETAIL,
				params: {
					notifyChannelCategorySetting: dataNotificationsSetting || data
				}
			});
		}, []);

		return (
			<TouchableOpacity onPress={navigateToNotificationDetail} style={{ ...styles.categoryItem, ...stylesItem }}>
				<View style={styles.channelTitle}>
					{typePreviousIcon === ChannelType.CHANNEL_TYPE_CHANNEL && (
						<MezonIconCDN icon={IconCDN.channelText} width={16} height={16} color={themeValue.channelNormal} />
					)}
					{typePreviousIcon === EOptionOverridesType.Category && (
						<MezonIconCDN icon={IconCDN.forderIcon} width={16} height={16} color={themeValue.channelNormal} />
					)}
					<View style={{ flexShrink: 1, minWidth: 0 }}>
						{categoryLabel && (
							<Text style={styles.categoryLabel} numberOfLines={1}>
								{categoryLabel}
							</Text>
						)}
						{categorySubtext && <Text style={styles.categorySubtext}>{categorySubtext}</Text>}
					</View>
				</View>

				<View style={styles.notificationType}>
					{notificationStatus && <Text style={styles.customStatus}>{getTitleFromValue(notificationStatus, t)}</Text>}
					{expandable && <MezonIconCDN icon={IconCDN.chevronSmallRightIcon} height={18} width={18} color={themeValue.text} />}
				</View>
			</TouchableOpacity>
		);
	}
);
