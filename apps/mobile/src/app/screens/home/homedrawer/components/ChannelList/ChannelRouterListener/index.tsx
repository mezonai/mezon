import { ActionEmitEvent, STORAGE_DATA_CLAN_CHANNEL_CACHE, getUpdateOrAddClanChannelCache, save } from '@mezon/mobile-components';
import { channelsActions, directActions, getStoreAsync } from '@mezon/store-mobile';
import { IChannel } from '@mezon/utils';
import { useNavigation } from '@react-navigation/native';
import { ChannelType } from 'mezon-js';
import React, { memo, useEffect } from 'react';
import { DeviceEventEmitter, Linking } from 'react-native';
import useTabletLandscape from '../../../../../../hooks/useTabletLandscape';
import { APP_SCREEN } from '../../../../../../navigation/ScreenTypes';
import { linkGoogleMeet } from '../../../../../../utils/helpers';
import JoinChannelVoiceBS from '../../ChannelVoice/JoinChannelVoiceBS';
import JoinStreamingRoomBS from '../../StreamingRoom/JoinStreamingRoomBS';
import { StatusVoiceChannel } from '../ChannelListItem';

const ChannelRouterListener = () => {
	const navigation = useNavigation<any>();
	const isTabletLandscape = useTabletLandscape();
	const openBottomSheetJoinVoice = (channel: IChannel) => {
		const data = {
			snapPoints: ['45%'],
			children:
				channel?.type === ChannelType.CHANNEL_TYPE_STREAMING ? (
					<JoinStreamingRoomBS channel={channel} />
				) : (
					<JoinChannelVoiceBS channel={channel} />
				)
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: false, data });
	};

	useEffect(() => {
		const onChannelRouter = DeviceEventEmitter.addListener(ActionEmitEvent.ON_CHANNEL_ROUTER, ({ channel }) => {
			handleRouteData(channel);
		});
		return () => {
			onChannelRouter.remove();
		};
	}, []);

	const handleRouteData = async (channel?: IChannel) => {
		requestAnimationFrame(async () => {
			if (channel?.type === ChannelType.CHANNEL_TYPE_STREAMING || channel?.type === ChannelType.CHANNEL_TYPE_MEZON_VOICE) {
				openBottomSheetJoinVoice(channel);
				return;
			}

			if (channel?.type === ChannelType.CHANNEL_TYPE_GMEET_VOICE) {
				if (channel?.status === StatusVoiceChannel.Active && channel?.meeting_code) {
					const urlVoice = `${linkGoogleMeet}${channel?.meeting_code}`;
					await Linking.openURL(urlVoice);
				}
			} else {
				if (!isTabletLandscape) navigation.navigate(APP_SCREEN.HOME_DEFAULT);
				const channelId = channel?.channel_id;
				const clanId = channel?.clan_id;
				const store = await getStoreAsync();
				store.dispatch(directActions.setDmGroupCurrentId(''));
				store.dispatch(channelsActions.setCurrentChannelId({ clanId, channelId }));
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
				const dataSave = getUpdateOrAddClanChannelCache(clanId, channelId);
				save(STORAGE_DATA_CLAN_CHANNEL_CACHE, dataSave);
			}
		});
	};

	return null;
};

export default memo(ChannelRouterListener);
