import { useTheme } from '@mezon/mobile-ui';
import {
	channelsActions,
	clansActions,
	selectCurrentChannelId,
	selectCurrentClanId,
	selectIsShowEmptyCategory,
	selectListChannelRenderByClanId,
	useAppDispatch,
	useAppSelector,
	voiceActions
} from '@mezon/store-mobile';
import type { ICategoryChannel } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Platform, RefreshControl, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSelector } from 'react-redux';
import useTabletLandscape from '../../../../hooks/useTabletLandscape';
import ChannelListBackground from '../components/ChannelList/ChannelListBackground';
import ChannelListHeader from '../components/ChannelList/ChannelListHeader';
import { ChannelListItem } from '../components/ChannelList/ChannelListItem';
import ChannelListScroll from '../components/ChannelList/ChannelListScroll';
import ChannelListSection from '../components/ChannelList/ChannelListSection';
import { ChannelOnboarding } from '../components/ChannelList/ChannelOnboarding';
import ButtonNewUnread from './ButtonNewUnread';
import { style } from './styles';

const ChannelList = () => {
	const { themeValue } = useTheme();
	const isTabletLandscape = useTabletLandscape();
	const currentClanId = useSelector(selectCurrentClanId);
	const currentChannelId = useSelector(selectCurrentChannelId);
	const isShowEmptyCategory = useSelector(selectIsShowEmptyCategory);
	const listChannelRender = useAppSelector((state) => selectListChannelRenderByClanId(state, currentClanId));
	const [refreshing, setRefreshing] = useState(false);
	const dispatch = useAppDispatch();
	const flashListRef = useRef(null);

	useEffect(() => {
		if (currentClanId) {
			flashListRef?.current?.scrollToOffset?.({ animated: true, offset: 0 });
		}
	}, [currentClanId]);
	const handleRefresh = async () => {
		setRefreshing(true);

		const promise = [
			dispatch(channelsActions.fetchChannels({ clanId: currentClanId, noCache: true, isMobile: true })),
			dispatch(clansActions.fetchClans({ noCache: true, isMobile: true })),
			dispatch(
				voiceActions.fetchVoiceChannelMembers({
					clanId: currentClanId ?? '',
					channelId: '',
					channelType: ChannelType.CHANNEL_TYPE_MEZON_VOICE
				})
			)
		];
		await Promise.all(promise);
		setRefreshing(false);
	};

	const data = useMemo(
		() => [
			{ id: 'backgroundHeader' },
			{ id: 'listHeader' },
			{ id: 'onBoarding' },
			...(listChannelRender
				? isShowEmptyCategory
					? listChannelRender
					: listChannelRender.filter(
							(item) =>
								((item as ICategoryChannel).channels && (item as ICategoryChannel).channels.length > 0) ||
								(item as ICategoryChannel).channels === undefined
						)
				: [])
		],
		[listChannelRender, isShowEmptyCategory]
	) as ICategoryChannel[];

	const styles = useMemo(() => style(themeValue, isTabletLandscape), [themeValue, isTabletLandscape]);

	const renderItem = useCallback(
		({ item, index }) => {
			if (index === 0) {
				return <ChannelListBackground />;
			} else if (index === 1) {
				return <ChannelListHeader key={`header-${index}`} />;
			} else if (index === 2) {
				return <ChannelOnboarding key={`onBoarding-${index}`} />;
			} else if (item.channels) {
				return <ChannelListSection data={item} />;
			} else {
				const isActive = item?.id === currentChannelId;
				const isHaveParentActive = item?.threadIds?.includes(currentChannelId);
				return (
					<View key={`${item?.id}_${item?.isFavor}_${index}_ItemChannel}`} style={[item?.threadIds && styles.channelItemWrapper]}>
						<ChannelListItem data={item} isChannelActive={isActive} isHaveParentActive={isHaveParentActive} />
					</View>
				);
			}
		},
		[currentChannelId]
	);

	const keyExtractor = useCallback((item, index) => {
		if (index === 0) return 'backgroundHeader';
		if (index === 1) return 'listHeader';
		if (index === 2) return 'onBoarding';
		return `${item?.id || 'item'}_${item?.isFavor ? 'fav' : 'unfav'}_${index}`;
	}, []);

	const refreshControl = useMemo(() => <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />, [refreshing, handleRefresh]);

	const viewabilityConfig = useMemo(
		() => ({
			itemVisiblePercentThreshold: 50,
			minimumViewTime: 300
		}),
		[]
	);

	const onScrollToIndexFailed = useCallback((info) => {
		if (info?.highestMeasuredFrameIndex) {
			const wait = new Promise((resolve) => setTimeout(resolve, 200));
			if (info.highestMeasuredFrameIndex < info.index) {
				flashListRef.current?.scrollToIndex({ index: info.highestMeasuredFrameIndex, animated: true });
				wait.then(() => {
					flashListRef.current?.scrollToIndex({ index: info.index, animated: true });
				});
			}
		}
	}, []);

	return (
		<View style={styles.mainList}>
			<LinearGradient
				start={{ x: 1, y: 0 }}
				end={{ x: 0, y: 0 }}
				colors={[themeValue.secondary, themeValue?.primaryGradiant || themeValue.secondary]}
				style={styles.absoluteFillGradient}
			/>
			<ChannelListScroll data={data} flashListRef={flashListRef} />
			<FlatList
				ref={flashListRef}
				data={data}
				renderItem={renderItem}
				keyExtractor={keyExtractor}
				refreshControl={refreshControl}
				stickyHeaderIndices={[1]}
				showsVerticalScrollIndicator={true}
				initialNumToRender={15}
				maxToRenderPerBatch={15}
				windowSize={20}
				updateCellsBatchingPeriod={50}
				scrollEventThrottle={16}
				removeClippedSubviews={Platform.OS === 'android'}
				keyboardShouldPersistTaps={'handled'}
				viewabilityConfig={viewabilityConfig}
				contentOffset={{ x: 0, y: 0 }}
				onScrollToIndexFailed={onScrollToIndexFailed}
				disableVirtualization={false}
				contentContainerStyle={styles.flatListContent}
			/>
			{!isTabletLandscape && <View style={styles.bottomSpacer} />}
			<ButtonNewUnread />
		</View>
	);
};

export default memo(ChannelList);
