import { useChatReaction } from '@mezon/core';
import { ActionEmitEvent } from '@mezon/mobile-components';
import { selectCurrentChannel } from '@mezon/store-mobile';
import { isPublicChannel } from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import React, { useCallback, useEffect } from 'react';
import { DeviceEventEmitter, View } from 'react-native';
import { useSelector } from 'react-redux';
import { IReactionMessageProps } from './components';

const ChannelMessageReactionListener = React.memo(() => {
	const { reactionMessageDispatch } = useChatReaction({ isMobile: true });
	const currentChannel = useSelector(selectCurrentChannel);

	const onReactionMessage = useCallback(
		async (data: IReactionMessageProps) => {
			await reactionMessageDispatch(
				data?.id ?? '',
				data.mode ?? ChannelStreamMode.STREAM_MODE_CHANNEL,
				(data?.clanId ?? (data.mode === ChannelStreamMode.STREAM_MODE_CHANNEL || data.mode === ChannelStreamMode.STREAM_MODE_THREAD))
					? (currentChannel?.clan_id ?? '')
					: '',
				data?.channelId ?? '',
				data?.messageId ?? '',
				data?.emojiId ?? '',
				data?.emoji?.trim() ?? '',
				data?.countToRemove ?? 0,
				data?.senderId ?? '',
				data?.actionDelete ?? false,
				isPublicChannel(currentChannel)
			);
		},
		[currentChannel, reactionMessageDispatch]
	);

	useEffect(() => {
		const eventOnReaction = DeviceEventEmitter.addListener(ActionEmitEvent.ON_REACTION_MESSAGE_ITEM, onReactionMessage);

		return () => {
			eventOnReaction.remove();
		};
	}, [onReactionMessage]);

	return <View />;
});

export default ChannelMessageReactionListener;
