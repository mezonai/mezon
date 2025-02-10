import { CategoryChannelItemProps, EOptionOverridesType, Icons, notificationType } from '@mezon/mobile-components';
import { Block, size, useTheme } from '@mezon/mobile-ui';
import { selectAllchannelCategorySetting } from '@mezon/store-mobile';
import { useNavigation } from '@react-navigation/native';
import { ChannelType } from 'mezon-js';
import React, { useCallback, useMemo } from 'react';
import { Text } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useSelector } from 'react-redux';
import { APP_SCREEN } from '../../../navigation/ScreenTypes';
import { style } from './CategoryChannelItem.styles';

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
				<Block flexDirection="row" gap={size.s_10} alignItems="center" maxWidth="80%">
					{typePreviousIcon === ChannelType.CHANNEL_TYPE_CHANNEL && (
						<Icons.TextIcon width={16} height={16} color={themeValue.channelNormal} />
					)}
					{typePreviousIcon === EOptionOverridesType.Category && (
						<Icons.FolderIcon width={16} height={16} color={themeValue.channelNormal} />
					)}
					<Block>
						{categoryLabel && <Text style={styles.categoryLabel}>{categoryLabel}</Text>}
						{categorySubtext && <Text style={styles.categorySubtext}>{categorySubtext}</Text>}
					</Block>
				</Block>

				<Block flexDirection="row" gap={size.s_10} alignItems="center">
					{notificationStatus && <Text style={styles.customStatus}>{notificationType[notificationStatus]}</Text>}
					{expandable && <Icons.ChevronSmallRightIcon height={18} width={18} color={themeValue.text} />}
				</Block>
			</TouchableOpacity>
		);
	}
);
