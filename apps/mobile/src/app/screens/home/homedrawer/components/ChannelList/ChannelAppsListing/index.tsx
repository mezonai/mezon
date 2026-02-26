import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import { selectAppChannelsList } from '@mezon/store-mobile';
import { useNavigation } from '@react-navigation/native';
import type { ApiChannelAppResponse } from 'mezon-js/api.gen';
import { memo, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../../../../../componentUI/MezonIconCDN';
import ImageNative from '../../../../../../components/ImageNative';
import { IconCDN } from '../../../../../../constants/icon_cdn';
import { APP_SCREEN } from '../../../../../../navigation/ScreenTypes';
import ItemChannelAppListing from './ItemChannelAppListing';
import { style } from './styles';

const LIMIT_CHANNEL_APP_DISPLAY = 10;
const COMPACT_VIEW_THRESHOLD = 3;

const ChannelAppsListing = () => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { t } = useTranslation(['textchannel', 'channelList']);
	const allChannelApp = useSelector(selectAppChannelsList);
	const navigation = useNavigation<any>();
	const [isExpanded, setIsExpanded] = useState(true);

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

	const toggleExpand = useCallback(() => {
		setIsExpanded((prev) => !prev);
	}, []);

	const renderShowAllButton = useCallback(() => {
		return (
			<TouchableOpacity style={styles.itemContainer} onPress={handleOpenAll}>
				<View style={[styles.itemLogo, { borderColor: baseColor.blurple }]}>
					<MezonIconCDN icon={IconCDN.chevronSmallRightIcon} width={size.s_30} height={size.s_30} color={baseColor.blurple} />
				</View>
				<Text style={[styles.itemName, { color: baseColor.blurple }]} numberOfLines={1}>
					{t('textchannel:discover.viewAll')}
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

	const renderCompactCard = useCallback(
		({ item }: { item: ApiChannelAppResponse }) => (
			<TouchableOpacity style={styles.compactCardContainer} onPress={() => openChannelApp(item)} activeOpacity={0.7}>
				<View style={styles.compactCardContent}>
					<View style={styles.compactCardLogo}>
						{item?.app_logo ? (
							<ImageNative url={item.app_logo} style={styles.appItemIcon} resizeMode="contain" />
						) : (
							<View style={[styles.appItemIcon, styles.appItemIconPlaceholder]}>
								<MezonIconCDN icon={IconCDN.channelApp} width={size.s_28} height={size.s_28} color={themeValue.textDisabled} />
							</View>
						)}
					</View>
					<View style={styles.compactCardInfo}>
						<Text style={styles.compactCardName} numberOfLines={1}>
							{item?.app_name || ''}
						</Text>
						{(item as any)?.app_description ? (
							<Text style={styles.compactCardDescription} numberOfLines={2}>
								{(item as any).app_description}
							</Text>
						) : null}
					</View>
				</View>
				<View style={styles.appItemStatusDot} />
			</TouchableOpacity>
		),
		[openChannelApp, styles, themeValue]
	);

	if (!allChannelApp || allChannelApp.length === 0) {
		return null;
	}

	const isCompactView = allChannelApp.length <= COMPACT_VIEW_THRESHOLD;
	const displayData = allChannelApp.length >= LIMIT_CHANNEL_APP_DISPLAY ? allChannelApp.slice(0, LIMIT_CHANNEL_APP_DISPLAY) : allChannelApp;

	return (
		<View style={[styles.container, styles.channelListSection]}>
			{isCompactView && (
				<TouchableOpacity activeOpacity={0.8} onPress={toggleExpand} style={styles.channelListHeader}>
					<View style={styles.channelListHeaderItem}>
						<MezonIconCDN
							icon={IconCDN.chevronDownSmallIcon}
							height={size.s_18}
							width={size.s_18}
							color={themeValue.text}
							customStyle={[!isExpanded && { transform: [{ rotate: '-90deg' }] }]}
						/>
						<Text style={styles.channelListHeaderItemTitle} numberOfLines={1}>
							{t('channelList:channelApps')}
						</Text>
					</View>
				</TouchableOpacity>
			)}
			{isCompactView && isExpanded && (
				<View style={styles.sectionContent}>
					{allChannelApp.map((item) => (
						<View key={item.channel_id}>{renderCompactCard({ item })}</View>
					))}
				</View>
			)}
			{!isCompactView && (
				<FlatList
					data={displayData}
					renderItem={renderItem}
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={styles.listContent}
					keyExtractor={(item, index) => item?.channel_id || `show-all-${index}`}
				/>
			)}
		</View>
	);
};

export default memo(ChannelAppsListing);
