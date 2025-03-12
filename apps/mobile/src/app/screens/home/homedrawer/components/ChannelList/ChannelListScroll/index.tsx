import { ActionEmitEvent } from '@mezon/mobile-components';
import React, { memo, useCallback, useEffect } from 'react';
import { DeviceEventEmitter, View } from 'react-native';

interface IProps {
	flashListRef: any;
	data: any;
}

const ChannelListScroll = ({ flashListRef, data }: IProps) => {
	const handleScrollToChannel = useCallback(
		(channelId) => {
			if (!flashListRef.current || !data) return;

			const targetIndex = data.findIndex((item) => item.id === channelId);
			if (targetIndex !== -1) {
				const countToScroll = Math.floor(targetIndex / 20);
				flashListRef.current.scrollToIndex({
					index: targetIndex,
					animated: true
				});
				if (countToScroll > 0) {
					for (let i = 0; i < countToScroll; i++) {
						setTimeout(() => {
							flashListRef.current.scrollToIndex({
								index: targetIndex,
								animated: true
							});
						}, 300 * i);
					}
				}
			} else {
				console.warn('Channel ID not found in list:', channelId);
			}
		},
		[flashListRef, data]
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
