import { ActionEmitEvent } from '@mezon/mobile-components';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import type { ApiClanDiscover } from 'mezon-js/api.gen';
import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, DeviceEventEmitter, FlatList, Text, TouchableOpacity, View } from 'react-native';
import MezonIconCDN from '../../../../componentUI/MezonIconCDN';
import ImageNative from '../../../../components/ImageNative';
import { IconCDN } from '../../../../constants/icon_cdn';
import DiscoverDetailScreen from './DiscoverDetailScreen';
import { useDiscoverMobile } from './DiscoverMobileContext';
import { style } from './styles';

const ClanDiscoverItem = ({ item }: { item: ApiClanDiscover }) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { t } = useTranslation('discover');

	const onPress = () => {
		const data = {
			children: <DiscoverDetailScreen clanDetail={item} />
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
	};

	return (
		<TouchableOpacity style={styles.itemContainer} activeOpacity={0.7} onPress={onPress}>
			<ImageNative url={item.banner} style={styles.clanBanner} resizeMode="cover" />
			<View style={styles.contentContainer}>
				<View style={styles.headerRow}>
					<ImageNative url={item.clan_logo} style={styles.smallAvatar} resizeMode="cover" />
					<Text style={styles.clanName} numberOfLines={1}>
						{item.clan_name}
					</Text>
				</View>

				<Text style={styles.description} numberOfLines={2}>
					{item.description}
				</Text>

				<View style={styles.footer}>
					<View style={styles.membersContainer}>
						<View style={styles.memberDot} />
						<Text style={styles.memberText}>
							{item.total_members} {t('members')}
						</Text>
					</View>
					<View style={styles.verifiedBadge}>
						<MezonIconCDN icon={IconCDN.verifyIcon} color={baseColor.white} width={size.s_14} height={size.s_14} />
						<Text style={styles.verifiedText}>{t('verified')}</Text>
					</View>
				</View>
			</View>
		</TouchableOpacity>
	);
};

const DiscoverScreen = () => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { clans, loading, loadingMore, hasMore, loadMoreClans, refreshClans } = useDiscoverMobile();

	const renderItem = ({ item }: { item: ApiClanDiscover }) => <ClanDiscoverItem item={item} />;

	const renderEmpty = () => {
		if (loading) {
			return null;
		}
		return <View style={styles.emptyContainer}></View>;
	};

	const renderFooter = () => {
		if (!loadingMore) {
			return null;
		}

		return (
			<View style={styles.footerLoading}>
				<ActivityIndicator size="small" color={baseColor.blurple} />
			</View>
		);
	};

	const handleEndReached = () => {
		if (hasMore && !loadingMore && !loading) {
			loadMoreClans();
		}
	};

	const handleRefresh = () => {
		refreshClans();
	};

	return (
		<FlatList
			data={clans}
			renderItem={renderItem}
			keyboardShouldPersistTaps={'handled'}
			keyExtractor={(item, index) => `${item.clan_id}-${index}`}
			contentContainerStyle={styles.listContainer}
			showsVerticalScrollIndicator={false}
			ListEmptyComponent={renderEmpty}
			ListFooterComponent={renderFooter}
			onEndReached={handleEndReached}
			onEndReachedThreshold={0.5}
			refreshing={loading && clans.length === 0}
			onRefresh={handleRefresh}
			removeClippedSubviews={true}
			maxToRenderPerBatch={10}
			updateCellsBatchingPeriod={50}
			initialNumToRender={10}
			windowSize={10}
		/>
	);
};

export default memo(DiscoverScreen);
