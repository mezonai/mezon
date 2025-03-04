import { useIdleRender } from '@mezon/core';
import { ActionEmitEvent } from '@mezon/mobile-components';
import { selectCurrentChannel, selectDmGroupCurrentId } from '@mezon/store';
import { ChannelStreamMode } from 'mezon-js';
import { memo, useEffect, useRef } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { useSelector } from 'react-redux';
import UseMentionList from '../../../../../../hooks/useUserMentionList';

interface IChatMessageLeftAreaProps {
	mode: ChannelStreamMode;
}

export const ChatBoxListenerComponent = memo(({ mode }: IChatMessageLeftAreaProps) => {
	const currentChannel = useSelector(selectCurrentChannel);
	const currentDirectId = useSelector(selectDmGroupCurrentId);

	const listMentions = UseMentionList({
		channelID: currentDirectId
			? currentDirectId
			: mode === ChannelStreamMode.STREAM_MODE_THREAD && currentChannel?.parent_id
				? currentChannel?.parent_id
				: currentChannel?.channel_id || '',
		channelMode: mode
	});
	const previousListMentions = useRef(null);

	useEffect(() => {
		const timeoout = setTimeout(() => {
			if (previousListMentions?.current !== listMentions && !!listMentions) {
				DeviceEventEmitter.emit(ActionEmitEvent.ON_SET_LIST_MENTION_DATA, { data: listMentions });
				previousListMentions.current = listMentions;
			}
		}, 300);

		return () => {
			if (timeoout) clearTimeout(timeoout);
		};
	}, [listMentions]);

	return null;
});

export const ChatBoxListener = memo(({ mode }: IChatMessageLeftAreaProps) => {
	const shouldRender = useIdleRender();
	if (!shouldRender) return null;
	return <ChatBoxListenerComponent mode={mode} />;
});
