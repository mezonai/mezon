import { ActionEmitEvent } from '@mezon/mobile-components';
import React, { memo, useCallback, useEffect } from 'react';
import { DeviceEventEmitter, View } from 'react-native';

interface IProps {
	itemRefs: any;
	flashListRef: any;
}

const ChannelListScroll = ({ itemRefs, flashListRef }: IProps) => {
	const handleScrollToChannel = useCallback(
		(currentChannelId: string) => {
			if (itemRefs?.current?.[currentChannelId?.toString()] && currentChannelId) {
				itemRefs?.current?.[currentChannelId?.toString()]?.measure((x, y, width, height, pageX, pageY) => {
					flashListRef?.current?.scrollToOffset?.({ offset: Math.round(pageY), animated: true });
				});
			}
		},
		[flashListRef, itemRefs]
	);
	useEffect(() => {
		const scrollChannel = DeviceEventEmitter.addListener(ActionEmitEvent.SCROLL_TO_ACTIVE_CHANNEL, (channelId?: string) => {
			handleScrollToChannel(channelId);
		});
		return () => {
			scrollChannel.remove();
		};
	}, [handleScrollToChannel]);

	return <View />;
};

export default memo(ChannelListScroll);
