import { useTheme } from '@mezon/mobile-ui';
import { selectIsShowEmptyCategory, selectListChannelRenderByClanId } from '@mezon/store';
import { channelsActions, selectCurrentClan, useAppDispatch, useAppSelector, voiceActions } from '@mezon/store-mobile';
import { ICategoryChannel } from '@mezon/utils';
import { useNavigation } from '@react-navigation/native';
import { ChannelType } from 'mezon-js';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { useSelector } from 'react-redux';
import useTabletLandscape from '../../../../hooks/useTabletLandscape';
import { AppStackScreenProps } from '../../../../navigation/ScreenTypes';
import ChannelListBackground from '../components/ChannelList/ChannelListBackground';
import ChannelListBottomSheet from '../components/ChannelList/ChannelListBottomSheet';
import ChannelListHeader from '../components/ChannelList/ChannelListHeader';
import { ChannelListItem } from '../components/ChannelList/ChannelListItem';
import ChannelListLoading from '../components/ChannelList/ChannelListLoading';
import ChannelListScroll from '../components/ChannelList/ChannelListScroll';
import ChannelListSection from '../components/ChannelList/ChannelListSection';
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
	const isShowEmptyCategory = useSelector(selectIsShowEmptyCategory);
	const listChannelRender = useAppSelector((state) => selectListChannelRenderByClanId(state, currentClan?.clan_id));
	const [refreshing, setRefreshing] = useState(false);
	const dispatch = useAppDispatch();
	const itemRefs = useRef({});
	// const [parentIdList, setParentIdList] = useState<Set<string>>(new Set());

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
			{ id: 'bannerAndEvents' },
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

	// useEffect(() => {
	// 	const newParentIds = new Set(
	// 		data
	// 			.filter(
	// 				(item) =>
	// 					(item as IChannel)?.type === ChannelType.CHANNEL_TYPE_THREAD &&
	// 					(item as IChannel)?.last_sent_message.timestamp_seconds > (item as IChannel)?.last_seen_message.timestamp_seconds &&
	// 					(item as IChannel)?.parrent_id
	// 			)
	// 			.map((item) => (item as IChannel).parrent_id)
	// 	);

	// 	setParentIdList((prev) => {
	// 		if ([...prev].sort().toString() !== [...newParentIds].sort().toString()) {
	// 			return newParentIds;
	// 		}
	// 		return prev;
	// 	});
	// }, [data]);

	const styles = style(themeValue, isTabletLandscape);

	const navigation = useNavigation<AppStackScreenProps['navigation']>();
	const flashListRef = useRef(null);
	const channelsPositionRef = useRef<ChannelsPositionRef>();

	const handleLayout = useCallback(() => {
		// 	empty
	}, []);

	const renderItem = useCallback(
		({ item, index }) => {
			if (index === 0) {
				return <ChannelListBackground />;
			} else if (index === 1) {
				return <ChannelListHeader />;
			} else if (item.channels) {
				return (
					<ChannelListSection
						channelsPositionRef={channelsPositionRef}
						data={item}
						key={`${item?.category_id}_${index}_ItemChannelList}`}
					/>
				);
			} else {
				return (
					<View
						ref={(ref) => (itemRefs.current[item?.channel_id?.toString()] = ref)}
						onLayout={() => handleLayout()}
						key={`${item?.id}_${item?.isFavor}_${index}_ItemChannel}`}
					>
						<ChannelListItem
							data={item}
							isFirstThread={
								item?.type === ChannelType.CHANNEL_TYPE_THREAD && data[index - 1]?.type !== ChannelType.CHANNEL_TYPE_THREAD
							}
							// parentIdList={parentIdList}
						/>
					</View>
				);
			}
		},
		[data, handleLayout]
	);

	const keyExtractor = useCallback((item, index) => item.id + item.isFavor?.toString() + index, []);

	return (
		<>
			<View style={styles.mainList}>
				<ChannelListScroll data={data} flashListRef={flashListRef} />
				<FlatList
					ref={flashListRef}
					data={data}
					renderItem={renderItem}
					keyExtractor={keyExtractor}
					removeClippedSubviews={true}
					refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
					stickyHeaderIndices={[1]}
					maxToRenderPerBatch={10}
					updateCellsBatchingPeriod={50}
					initialNumToRender={20}
					windowSize={5}
				/>
				<ChannelListLoading isNonChannel={!!listChannelRender?.length} />
				<View style={{ height: 80 }} />
				<ButtonNewUnread />
			</View>

			<ChannelListBottomSheet />
		</>
	);
};

export default ChannelList;
