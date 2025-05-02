import { size, useTheme } from '@mezon/mobile-ui';
import { channelsActions, selectCurrentChannelId, selectIsShowEmptyCategory, selectListChannelRenderByClanId, voiceActions } from '@mezon/store';
import { selectCurrentClan, useAppDispatch, useAppSelector } from '@mezon/store-mobile';
import { ICategoryChannel } from '@mezon/utils';
import { useFocusEffect } from '@react-navigation/native';
import { ChannelType } from 'mezon-js';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, InteractionManager, Platform, RefreshControl, View } from 'react-native';
import { useSelector } from 'react-redux';
import useTabletLandscape from '../../../../hooks/useTabletLandscape';
import ChannelListBackground from '../components/ChannelList/ChannelListBackground';
import ChannelListHeader from '../components/ChannelList/ChannelListHeader';
import { ChannelListItem } from '../components/ChannelList/ChannelListItem';
import ChannelListScroll from '../components/ChannelList/ChannelListScroll';
import ChannelListSection from '../components/ChannelList/ChannelListSection';
import ChannelRouterListener from '../components/ChannelList/ChannelRouterListener';
import ButtonNewUnread from './ButtonNewUnread';
import { style } from './styles';
export type ChannelsPositionRef = {
	current: {
		[key: number]: {
			height: number;
			cateId?: string | number;
		};
	};
};

const ChannelList = () => {
	const { themeValue } = useTheme();
	const isTabletLandscape = useTabletLandscape();
	const currentClan = useSelector(selectCurrentClan);
	const currentChannelId = useSelector(selectCurrentChannelId);
	const isShowEmptyCategory = useSelector(selectIsShowEmptyCategory);
	const listChannelRender = useAppSelector((state) => selectListChannelRenderByClanId(state, currentClan?.clan_id));
	const [refreshing, setRefreshing] = useState(false);
	const dispatch = useAppDispatch();
	const [headerVersion, setHeaderVersion] = useState(0);
	const handleRefresh = async () => {
		setRefreshing(true);

		const promise = [
			dispatch(channelsActions.fetchChannels({ clanId: currentClan?.clan_id, noCache: true, isMobile: true })),
			dispatch(
				voiceActions.fetchVoiceChannelMembers({
					clanId: currentClan?.clan_id ?? '',
					channelId: '',
					channelType: ChannelType.CHANNEL_TYPE_GMEET_VOICE || ChannelType.CHANNEL_TYPE_MEZON_VOICE
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

	const styles = style(themeValue, isTabletLandscape);

	const flashListRef = useRef(null);

	useFocusEffect(
		useCallback(() => {
			const task = InteractionManager.runAfterInteractions(() => {
				setHeaderVersion((prev) => prev + 1);
			});
			return () => task.cancel();
		}, [])
	);

	const renderItem = useCallback(
		({ item, index }) => {
			if (index === 0) {
				return <ChannelListBackground />;
			} else if (index === 1) {
				return <ChannelListHeader key={`header-${headerVersion}`} />;
			} else if (item.channels) {
				return <ChannelListSection data={item} />;
			} else {
				const isActive = item?.id === currentChannelId;
				const isHaveParentActive = item?.threadIds?.includes(currentChannelId);
				return (
					<View
						key={`${item?.id}_${item?.isFavor}_${index}_ItemChannel}`}
						style={[{ backgroundColor: themeValue.secondary }, item?.threadIds && { zIndex: 1 }]}
					>
						<ChannelListItem data={item} isChannelActive={isActive} isHaveParentActive={isHaveParentActive} />
					</View>
				);
			}
		},
		[currentChannelId, headerVersion, themeValue.secondary]
	);

	const keyExtractor = useCallback((item, index) => item.id + item.isFavor?.toString() + index, []);
	return (
		<View style={styles.mainList}>
			<ChannelListScroll data={data} flashListRef={flashListRef} />
			<ChannelRouterListener />
			<FlatList
				ref={flashListRef}
				data={data}
				renderItem={renderItem}
				keyExtractor={keyExtractor}
				refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
				stickyHeaderIndices={[1]}
				showsVerticalScrollIndicator={true}
				initialNumToRender={10}
				maxToRenderPerBatch={10}
				updateCellsBatchingPeriod={50}
				windowSize={10}
				scrollEventThrottle={16}
				removeClippedSubviews={Platform.OS === 'android'}
				keyboardShouldPersistTaps={'handled'}
				viewabilityConfig={{
					itemVisiblePercentThreshold: 50,
					minimumViewTime: 300
				}}
				contentOffset={{ x: 0, y: 0 }}
				onScrollToIndexFailed={(info) => {
					if (info?.highestMeasuredFrameIndex) {
						const wait = new Promise((resolve) => setTimeout(resolve, 200));
						if (info.highestMeasuredFrameIndex < info.index) {
							flashListRef.current?.scrollToIndex({ index: info.highestMeasuredFrameIndex, animated: true });
							wait.then(() => {
								flashListRef.current?.scrollToIndex({ index: info.index, animated: true });
							});
						}
					}
				}}
				disableVirtualization
				contentContainerStyle={{
					backgroundColor: themeValue.secondary,
					paddingBottom: size.s_6
				}}
				style={{
					backgroundColor: themeValue.secondary
				}}
			/>
			{!isTabletLandscape && <View style={{ height: 80 }} />}
			<ButtonNewUnread />
		</View>
	);
};

export default ChannelList;
