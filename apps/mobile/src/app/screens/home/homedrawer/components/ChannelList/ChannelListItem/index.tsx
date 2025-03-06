import { BottomSheetModal } from '@gorhom/bottom-sheet';
import {
	ActionEmitEvent,
	STORAGE_CHANNEL_CURRENT_CACHE,
	STORAGE_DATA_CLAN_CHANNEL_CACHE,
	getUpdateOrAddClanChannelCache,
	load,
	save
} from '@mezon/mobile-components';
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
import useTabletLandscape from '../../../../../../hooks/useTabletLandscape';
import { APP_SCREEN } from '../../../../../../navigation/ScreenTypes';
import { linkGoogleMeet } from '../../../../../../utils/helpers';
import ChannelMenu from '../../ChannelMenu';
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

	const openBottomSheetJoinVoice = useCallback(() => {
		const data = {
			snapPoints: ['45%'],
			children:
				props?.data?.type === ChannelType.CHANNEL_TYPE_STREAMING ? (
					<JoinStreamingRoomBS channel={props?.data} ref={bottomSheetChannelStreamingRef} />
				) : (
					<JoinChannelVoiceBS channel={props?.data} ref={bottomSheetChannelStreamingRef} />
				)
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: false, data });
	}, [props?.data]);

	const openBottomSheetChannelMenu = useCallback((channel, isThread = false) => {
		const data = {
			heightFitContent: true,
			children: <ChannelMenu channel={channel} />
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: false, data });
	}, []);

	const handleRouteData = useCallback(
		async (thread?: IChannel) => {
			if (props?.data?.type === ChannelType.CHANNEL_TYPE_STREAMING || props?.data?.type === ChannelType.CHANNEL_TYPE_MEZON_VOICE) {
				openBottomSheetJoinVoice();
				return;
			}

			if (props?.data?.type === ChannelType.CHANNEL_TYPE_GMEET_VOICE) {
				if (props?.data?.status === StatusVoiceChannel.Active && props?.data?.meeting_code) {
					const urlVoice = `${linkGoogleMeet}${props?.data?.meeting_code}`;
					await Linking.openURL(urlVoice);
				}
			} else {
				if (!isTabletLandscape) navigation.navigate(APP_SCREEN.HOME_DEFAULT);
				const channelId = thread ? thread?.channel_id : props?.data?.channel_id;
				const clanId = thread ? thread?.clan_id : props?.data?.clan_id;
				const channelsCache = load(STORAGE_CHANNEL_CURRENT_CACHE) || [];
				const isCached = channelsCache?.includes(channelId);
				const store = await getStoreAsync();
				store.dispatch(directActions.setDmGroupCurrentId(''));
				store.dispatch(channelsActions.setCurrentChannelId({ clanId, channelId }));
				timeoutRef.current = setTimeout(async () => {
					if (isCached) {
						DeviceEventEmitter.emit(ActionEmitEvent.ON_SWITCH_CHANEL, 0);
					}
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
				}, 0);
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
		openBottomSheetChannelMenu(props?.data, props?.data?.type === ChannelType.CHANNEL_TYPE_THREAD);
	}, [openBottomSheetChannelMenu, props?.data]);

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
		</>
	);
});
