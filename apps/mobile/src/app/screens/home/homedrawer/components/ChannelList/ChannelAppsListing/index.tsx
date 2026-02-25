import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import { selectAppChannelsList } from '@mezon/store-mobile';
import { useNavigation } from '@react-navigation/native';
import type { ApiChannelAppResponse } from 'mezon-js/api.gen';
import { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../../constants/icon_cdn';
import { APP_SCREEN } from '../../../../../../navigation/ScreenTypes';
import ItemChannelAppListing from './ItemChannelAppListing';
import { style } from './styles';

const LIMIT_CHANNEL_APP_DISPLAY = 10;
const ChannelAppsListing = () => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { t } = useTranslation('textchannel');
	const allChannelApp = useSelector(selectAppChannelsList);
	const navigation = useNavigation<any>();

	const openChannelApp = useCallback(
		async (channel: ApiChannelAppResponse) => {
			navigation.navigate(APP_SCREEN.CHANNEL_APP, {
				channelId: channel.channel_id,
				clanId: channel.clan_id
			});
		},
		[navigation]
	);

	const handleOpenAll = useCallback(() => {
		navigation.navigate(APP_SCREEN.CHANNEL_APP_SHOW_ALL);
	}, [navigation]);

	const renderShowAllButton = useCallback(() => {
		return (
			<TouchableOpacity style={styles.itemContainer} onPress={handleOpenAll}>
				<View style={[styles.itemLogo, { borderColor: baseColor.blurple }]}>
					<MezonIconCDN icon={IconCDN.chevronSmallRightIcon} width={size.s_30} height={size.s_30} color={baseColor.blurple} />
				</View>
				<Text style={[styles.itemName, { color: baseColor.blurple }]} numberOfLines={1}>
					{t('discover.viewAll')}
				</Text>
			</TouchableOpacity>
		);
	}, [handleOpenAll, styles, t]);

	const renderItem = useCallback(
		({ item, index }: { item: ApiChannelAppResponse; index: number }) => {
			if (allChannelApp && allChannelApp.length >= LIMIT_CHANNEL_APP_DISPLAY && index === LIMIT_CHANNEL_APP_DISPLAY - 1) {
				return renderShowAllButton();
			}
			return <ItemChannelAppListing item={item} openChannelApp={openChannelApp} />;
		},
		[openChannelApp, allChannelApp, renderShowAllButton]
	);

	if (!allChannelApp || allChannelApp.length === 0) {
		return null;
	}

	const displayData = allChannelApp?.length >= LIMIT_CHANNEL_APP_DISPLAY ? allChannelApp?.slice(0, LIMIT_CHANNEL_APP_DISPLAY) : allChannelApp;
	return (
		<View style={styles.container}>
			<LinearGradient
				start={{ x: 1, y: 0 }}
				end={{ x: 0, y: 0 }}
				colors={[themeValue.secondary, themeValue?.primaryGradiant || themeValue.secondary]}
				style={[StyleSheet.absoluteFillObject]}
			/>
			<FlatList
				data={displayData}
				renderItem={renderItem}
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerStyle={styles.listContent}
				keyExtractor={(item, index) => item?.channel_id || `show-all-${index}`}
			/>
		</View>
	);
};

export default memo(ChannelAppsListing);
