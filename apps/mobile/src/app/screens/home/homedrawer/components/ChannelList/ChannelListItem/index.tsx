import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { ActionEmitEvent, STORAGE_DATA_CLAN_CHANNEL_CACHE, getUpdateOrAddClanChannelCache, save } from '@mezon/mobile-components';
import {
	channelsActions,
	directActions,
	getStoreAsync,
	selectCategoryExpandStateByCategoryId,
	selectIsUnreadChannelById,
	useAppSelector
} from '@mezon/store-mobile';
import { IChannel } from '@mezon/utils';
import { useNavigation } from '@react-navigation/native';
import { ChannelType } from 'mezon-js';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DeviceEventEmitter, Linking } from 'react-native';
import { MezonBottomSheet } from '../../../../../../componentUI';
import useTabletLandscape from '../../../../../../hooks/useTabletLandscape';
import { APP_SCREEN } from '../../../../../../navigation/ScreenTypes';
import { linkGoogleMeet } from '../../../../../../utils/helpers';
import JoinChannelVoiceBS from '../../ChannelVoice/JoinChannelVoiceBS';
import JoinStreamingRoomBS from '../../StreamingRoom/JoinStreamingRoomBS';
import ChannelItem from '../ChannelItem';
import UserListVoiceChannel from '../ChannelListUserVoice';

interface IChannelListItemProps {
	data: any;
	isFirstThread?: boolean;
	// parentIdList?: Set<string>;
}

export enum StatusVoiceChannel {
	Active = 1,
	No_Active = 0
}

export enum IThreadActiveType {
	Active = 1
}

export const ChannelListItem = React.memo((props: IChannelListItemProps) => {
	const bottomSheetChannelStreamingRef = useRef<BottomSheetModal>(null);
	const isUnRead = useAppSelector((state) => selectIsUnreadChannelById(state, props?.data?.id));
	const [isActive, setIsActive] = useState<boolean>(false);
	const isCategoryExpanded = useAppSelector((state) => selectCategoryExpandStateByCategoryId(state, props?.data?.category_id as string));
	const isChannelVoice = useMemo(() => {
		return (
			props?.data?.type === ChannelType.CHANNEL_TYPE_GMEET_VOICE ||
			props?.data?.type === ChannelType.CHANNEL_TYPE_STREAMING ||
			props?.data?.type === ChannelType.CHANNEL_TYPE_MEZON_VOICE
		);
	}, [props?.data?.type]);

	const timeoutRef = useRef<any>();
	const navigation = useNavigation<any>();
	const isTabletLandscape = useTabletLandscape();

	useEffect(() => {
		const event = DeviceEventEmitter.addListener(ActionEmitEvent.CHANNEL_ID_ACTIVE, (channelId: string) => {
			if (channelId === props?.data?.id) {
				setIsActive(true);
			} else {
				if (isActive) setIsActive(false);
			}
		});

		return () => {
			event.remove();
			timeoutRef.current && clearTimeout(timeoutRef.current);
		};
	}, [props?.data?.id, isActive]);

	const handleRouteData = useCallback(
		async (thread?: IChannel) => {
			if (props?.data?.type === ChannelType.CHANNEL_TYPE_STREAMING || props?.data?.type === ChannelType.CHANNEL_TYPE_MEZON_VOICE) {
				bottomSheetChannelStreamingRef.current?.present();
				return;
			}

			if (props?.data?.type === ChannelType.CHANNEL_TYPE_GMEET_VOICE) {
				if (props?.data?.status === StatusVoiceChannel.Active && props?.data?.meeting_code) {
					const urlVoice = `${linkGoogleMeet}${props?.data?.meeting_code}`;
					await Linking.openURL(urlVoice);
				}
			} else {
				DeviceEventEmitter.emit(ActionEmitEvent.ON_SWITCH_CHANEL, 200);
				if (!isTabletLandscape) navigation.navigate(APP_SCREEN.HOME_DEFAULT);
				const channelId = thread ? thread?.channel_id : props?.data?.channel_id;
				const clanId = thread ? thread?.clan_id : props?.data?.clan_id;
				// const channelsCache = load(STORAGE_CHANNEL_CURRENT_CACHE) || [];
				// const isCached = channelsCache?.includes(channelId);
				const store = await getStoreAsync();
				store.dispatch(directActions.setDmGroupCurrentId(''));
				store.dispatch(channelsActions.setCurrentChannelId({ clanId, channelId }));
				timeoutRef.current = setTimeout(async () => {
					DeviceEventEmitter.emit(ActionEmitEvent.CHANNEL_ID_ACTIVE, channelId);
					store.dispatch(
						channelsActions.joinChannel({
							clanId: clanId ?? '',
							channelId: channelId,
							noFetchMembers: false,
							isClearMessage: true,
							noCache: true
						})
					);
				}, 50);
				const dataSave = getUpdateOrAddClanChannelCache(clanId, channelId);
				save(STORAGE_DATA_CLAN_CHANNEL_CACHE, dataSave);
			}
		},
		[
			isTabletLandscape,
			navigation,
			props?.data?.channel_id,
			props?.data?.clan_id,
			props?.data?.meeting_code,
			props?.data?.status,
			props?.data?.type
		]
	);

	const handleLongPressChannel = useCallback(() => {
		if (props?.data?.type === ChannelType.CHANNEL_TYPE_THREAD) {
			DeviceEventEmitter.emit(ActionEmitEvent.ON_LONG_PRESS_CHANNEL, { channel: props?.data, isThread: true });
		} else {
			DeviceEventEmitter.emit(ActionEmitEvent.ON_LONG_PRESS_CHANNEL, { channel: props?.data });
		}
	}, [props?.data]);
	const shouldDisplay = isCategoryExpanded || isUnRead || isChannelVoice || isActive;
	// || props.parentIdList?.has(props.data.id);

	if (!shouldDisplay) return null;
	return (
		<>
			{!isChannelVoice && (
				<ChannelItem
					isFirstThread={props?.isFirstThread}
					onPress={handleRouteData}
					onLongPress={handleLongPressChannel}
					data={props?.data}
					isUnRead={isUnRead}
					isActive={isActive}
				/>
			)}
			{isChannelVoice && (
				<UserListVoiceChannel
					channelId={props?.data?.channel_id}
					isCategoryExpanded={isCategoryExpanded}
					onPress={handleRouteData}
					onLongPress={handleLongPressChannel}
					data={props?.data}
					isUnRead={false}
					isActive={isActive}
				/>
			)}
			<MezonBottomSheet ref={bottomSheetChannelStreamingRef} snapPoints={['45%']}>
				{props?.data?.type === ChannelType.CHANNEL_TYPE_STREAMING ? (
					<JoinStreamingRoomBS channel={props?.data} ref={bottomSheetChannelStreamingRef} />
				) : (
					<JoinChannelVoiceBS channel={props?.data} ref={bottomSheetChannelStreamingRef} />
				)}
			</MezonBottomSheet>
		</>
	);
});
