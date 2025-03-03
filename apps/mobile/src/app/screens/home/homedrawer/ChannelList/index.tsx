import { useTheme } from '@mezon/mobile-ui';
import { selectIsShowEmptyCategory, selectListChannelRenderByClanId } from '@mezon/store';
import { selectCurrentClan, useAppDispatch, useAppSelector } from '@mezon/store-mobile';
import { ICategoryChannel } from '@mezon/utils';
import { useNavigation } from '@react-navigation/native';
import { ChannelType } from 'mezon-js';
import React, { useCallback, useMemo, useRef } from 'react';
import { FlatList, View } from 'react-native';
import { useSelector } from 'react-redux';
import useTabletLandscape from '../../../../hooks/useTabletLandscape';
import { AppStackScreenProps } from '../../../../navigation/ScreenTypes';
import ChannelListBackground from '../components/ChannelList/ChannelListBackground';
import ChannelListBottomSheet from '../components/ChannelList/ChannelListBottomSheet';
import ChannelListHeader from '../components/ChannelList/ChannelListHeader';
import { ChannelListItem } from '../components/ChannelList/ChannelListItem';
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

	const styles = style(themeValue, isTabletLandscape);

	const navigation = useNavigation<AppStackScreenProps['navigation']>();
	const flashListRef = useRef(null);
	const channelsPositionRef = useRef<ChannelsPositionRef>();
	const dispatch = useAppDispatch();

	const renderItem = useCallback(({ item, index }) => {
		if (index === 0) {
			return <ChannelListBackground />;
		} else if (index === 1) {
			return <ChannelListHeader />;
		} else if (item.channels) {
			return <ChannelListSection channelsPositionRef={channelsPositionRef} data={item} />;
		} else {
			return (
				<ChannelListItem
					data={item}
					isFirstThread={item?.type === ChannelType.CHANNEL_TYPE_THREAD && data[index - 1]?.type !== ChannelType.CHANNEL_TYPE_THREAD}
				/>
			);
		}
	}, []);

	const keyExtractor = useCallback((item, index) => item.id + item.isFavor?.toString() + index, []);

	return (
		<>
			<View style={styles.mainList}>
				<ChannelListScroll data={data} flashListRef={flashListRef} />
				<FlatList
					data={data}
					renderItem={renderItem}
					keyExtractor={keyExtractor}
					maxToRenderPerBatch={10}
					updateCellsBatchingPeriod={50}
					decelerationRate={'fast'}
					disableVirtualization={true}
					initialNumToRender={20}
					windowSize={10}
					onScrollToIndexFailed={(info) => {
						const wait = new Promise((resolve) => setTimeout(resolve, 500));
						wait.then(() => {
							flashListRef.current?.scrollToIndex({ index: info.index, animated: true });
						});
					}}
				/>
				<View style={{ height: 80 }} />
				<ButtonNewUnread />
			</View>

			{/* add use idle */}
			<ChannelListBottomSheet />
		</>
	);
};

export default ChannelList;
