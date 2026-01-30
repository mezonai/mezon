import { ActionEmitEvent } from '@mezon/mobile-components';
import { selectCurrentChannel, selectCurrentUserId, selectDmGroupCurrentId } from '@mezon/store-mobile';
import type { MentionDataProps } from '@mezon/utils';
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
	const currentUserId = useSelector(selectCurrentUserId);

	const listMentions = UseMentionList({
		channelDetail: currentChannel,
		channelID: currentDirectId
			? currentDirectId
			: mode === ChannelStreamMode.STREAM_MODE_THREAD && currentChannel?.parent_id
				? currentChannel?.parent_id
				: currentChannel?.channel_id || '0',
		channelMode: mode
	});

	const previousListMentions = useRef(null);

	useEffect(() => {
		const timeoout = setTimeout(() => {
			let filterListMentions: MentionDataProps[] = listMentions;
			const isSelfDM = listMentions?.length === 2 && listMentions[0]?.id === currentUserId && listMentions[1]?.id === currentUserId;
			if (isSelfDM) {
				filterListMentions = [listMentions[0]];
			}

			if (previousListMentions?.current !== filterListMentions && !!filterListMentions) {
				DeviceEventEmitter.emit(ActionEmitEvent.ON_SET_LIST_MENTION_DATA, { data: filterListMentions });
				previousListMentions.current = filterListMentions;
			}
		}, 300);

		return () => {
			if (timeoout) clearTimeout(timeoout);
		};
	}, [listMentions, currentChannel?.channel_id, currentUserId]);

	return null;
});

export const ChatBoxListener = memo(({ mode }: IChatMessageLeftAreaProps) => {
	return <ChatBoxListenerComponent mode={mode} />;
});
