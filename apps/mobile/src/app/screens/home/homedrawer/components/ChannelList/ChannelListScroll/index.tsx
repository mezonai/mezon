import { ActionEmitEvent } from '@mezon/mobile-components';
import { size } from '@mezon/mobile-ui';
import { selectCategoryChannelOffsets, selectCurrentChannel } from '@mezon/store-mobile';
import React, { memo, useCallback, useEffect } from 'react';
import { DeviceEventEmitter, View } from 'react-native';
import { useSelector } from 'react-redux';
import { ChannelsPositionRef } from '../../../ChannelList';

interface IProps {
	channelsPositionRef: ChannelsPositionRef;
	flashListRef: any;
}

const ChannelListScroll = ({ channelsPositionRef, flashListRef }: IProps) => {
	const selectCategoryOffsets = useSelector(selectCategoryChannelOffsets);
	const currentChannel = useSelector(selectCurrentChannel);

	useEffect(() => {
		let timerToScrollChannelActive: string | number | NodeJS.Timeout;
		if (currentChannel?.channel_id) {
			timerToScrollChannelActive = setTimeout(() => {
				DeviceEventEmitter.emit(ActionEmitEvent.SCROLL_TO_ACTIVE_CHANNEL);
				DeviceEventEmitter.emit(ActionEmitEvent.CHANNEL_ID_ACTIVE, currentChannel?.channel_id);
			}, 1000);
		}
		return () => {
			timerToScrollChannelActive && clearTimeout(timerToScrollChannelActive);
		};
	}, [currentChannel?.channel_id]);

	const handleScrollToChannel = useCallback(
		(currentChannelId: string) => {
			const positionChannel = channelsPositionRef?.current?.[currentChannelId];
			const categoryOffset = selectCategoryOffsets?.[positionChannel?.cateId || ''];
			const position = (positionChannel?.height || 0) + (categoryOffset || 0);

			if (position) {
				flashListRef?.current?.scrollTo({
					x: 0,
					y: position - size.s_100 * 2,
					animated: true
				});
			}
		},
		[channelsPositionRef, flashListRef, selectCategoryOffsets]
	);
	useEffect(() => {
		const scrollChannel = DeviceEventEmitter.addListener(ActionEmitEvent.SCROLL_TO_ACTIVE_CHANNEL, (channelId?: string) => {
			handleScrollToChannel(channelId || currentChannel?.channel_id);
		});
		return () => {
			scrollChannel.remove();
		};
	}, [handleScrollToChannel, currentChannel?.channel_id]);

	return <View />;
};

export default memo(ChannelListScroll);
