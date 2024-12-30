import { BottomSheetModal } from '@gorhom/bottom-sheet';
import {
	ActionEmitEvent,
	getUpdateOrAddClanChannelCache,
	hasNonEmptyChannels,
	save,
	STORAGE_DATA_CLAN_CHANNEL_CACHE
} from '@mezon/mobile-components';
import { Block, useTheme } from '@mezon/mobile-ui';
import { appActions, channelsActions, ChannelsEntity, getStoreAsync, useAppDispatch } from '@mezon/store-mobile';
import { ChannelThreads, ICategoryChannel } from '@mezon/utils';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { ChannelType } from 'mezon-js';
import React, { useCallback, useRef } from 'react';
import { DeviceEventEmitter, InteractionManager, Linking, ScrollView, View } from 'react-native';
import useTabletLandscape from '../../../../hooks/useTabletLandscape';
import { AppStackScreenProps } from '../../../../navigation/ScreenTypes';
import { linkGoogleMeet } from '../../../../utils/helpers';
import ChannelListBackground from '../components/ChannelList/ChannelListBackground';
import ChannelListBottomSheet from '../components/ChannelList/ChannelListBottomSheet';
import { ChannelListFavorite } from '../components/ChannelList/ChannelListFavorite';
import ChannelListHeader from '../components/ChannelList/ChannelListHeader';
import { StatusVoiceChannel } from '../components/ChannelList/ChannelListItem';
import ChannelListLoading from '../components/ChannelList/ChannelListLoading';
import ChannelListScroll from '../components/ChannelList/ChannelListScroll';
import ChannelListSection from '../components/ChannelList/ChannelListSection';
import { ChannelListContext } from '../Reusables';
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

const ChannelList = React.memo(({ categorizedChannels }: { categorizedChannels: any }) => {
	const { themeValue } = useTheme();
	const isTabletLandscape = useTabletLandscape();
	const styles = style(themeValue, isTabletLandscape);
	const bottomSheetMenuRef = useRef<BottomSheetModal>(null);
	const bottomSheetEventRef = useRef<BottomSheetModal>(null);

	const navigation = useNavigation<AppStackScreenProps['navigation']>();
	const flashListRef = useRef(null);
	const channelsPositionRef = useRef<ChannelsPositionRef>();
	const dispatch = useAppDispatch();
	const handlePress = useCallback(() => {
		bottomSheetMenuRef.current?.present();
	}, []);

	const onOpenEvent = useCallback(() => {
		bottomSheetEventRef?.current?.present();
	}, []);

	const handleLongPressCategory = useCallback((category: ICategoryChannel) => {
		DeviceEventEmitter.emit(ActionEmitEvent.ON_LONG_PRESS_CATEGORY, category);
	}, []);

	const handleLongPressChannel = useCallback((channel: ChannelThreads) => {
		DeviceEventEmitter.emit(ActionEmitEvent.ON_LONG_PRESS_CHANNEL, { channel });
	}, []);

	const handleLongPressThread = useCallback((channel: ChannelThreads) => {
		DeviceEventEmitter.emit(ActionEmitEvent.ON_LONG_PRESS_CHANNEL, { channel, isThread: true });
	}, []);

	const handleLayout = useCallback(
		(event, item) => {
			if (item) {
				const { y } = event?.nativeEvent?.layout || {};
				InteractionManager.runAfterInteractions(() => {
					dispatch(appActions.setCategoryChannelOffsets({ [item?.category_id]: Math.round(y) }));
				});
			}
		},
		[dispatch]
	);

	const renderItemChannelList = useCallback(
		({ item }) => {
			return (
				<View onLayout={(e) => handleLayout(e, item)} key={item?.category_id}>
					<ChannelListSection
						channelsPositionRef={channelsPositionRef}
						data={item}
						onLongPressCategory={handleLongPressCategory}
						onLongPressChannel={handleLongPressChannel}
						onLongPressThread={handleLongPressThread}
					/>
				</View>
			);
		},
		[handleLongPressCategory, handleLongPressChannel, handleLongPressThread, handleLayout]
	);

	const handleScrollToChannelFavorite = useCallback(
		async (channel?: ChannelsEntity) => {
			if (channel?.type === ChannelType.CHANNEL_TYPE_VOICE) {
				if (channel?.status === StatusVoiceChannel.Active && channel?.meeting_code) {
					const urlVoice = `${linkGoogleMeet}${channel?.meeting_code}`;
					await Linking.openURL(urlVoice);
				}
			} else {
				if (!isTabletLandscape) {
					navigation.dispatch(DrawerActions.closeDrawer());
				}
				const channelId = channel?.channel_id || '';
				const clanId = channel?.clan_id || '';
				const dataSave = getUpdateOrAddClanChannelCache(clanId, channelId);
				const store = await getStoreAsync();
				requestAnimationFrame(async () => {
					store.dispatch(channelsActions.joinChannel({ clanId: clanId ?? '', channelId: channelId, noFetchMembers: false, noCache: true }));
				});
				save(STORAGE_DATA_CLAN_CHANNEL_CACHE, dataSave);
			}
		},
		[isTabletLandscape, navigation]
	);

	return (
		<ChannelListContext.Provider value={{ navigation: navigation }}>
			<View style={styles.mainList}>
				<ScrollView
					stickyHeaderIndices={[1]}
					showsVerticalScrollIndicator={false}
					ref={flashListRef}
					scrollEventThrottle={16}
					removeClippedSubviews={false}
					nestedScrollEnabled={true}
					bounces={false}
				>
					<ChannelListBackground onPress={handlePress} />
					<ChannelListHeader onPress={handlePress} onOpenEvent={onOpenEvent} />
					<ChannelListFavorite onPress={handleScrollToChannelFavorite} />
					<ChannelListLoading isNonChannel={hasNonEmptyChannels(categorizedChannels || [])} />
					<ChannelListScroll channelsPositionRef={channelsPositionRef} flashListRef={flashListRef} />
					{!!categorizedChannels?.length &&
						categorizedChannels?.map((item) => {
							return renderItemChannelList({ item });
						})}
					<Block height={80} />
				</ScrollView>

				<ButtonNewUnread />
			</View>

			<ChannelListBottomSheet />
		</ChannelListContext.Provider>
	);
});

export default ChannelList;
