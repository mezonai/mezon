import { selectCurrentChannel, selectDmGroupCurrentId } from '@mezon/store-mobile';
import { checkIsThread, isPublicChannel } from '@mezon/utils';
import React from 'react';
import { useSelector } from 'react-redux';
import HomeDefault from './HomeDefault';
import NoChannelSelected from './NoChannelSelected';

const HomeScreen = React.memo((props: any) => {
	const currentChannel = useSelector(selectCurrentChannel);
	const currentDirectId = useSelector(selectDmGroupCurrentId);
	if (!currentChannel && !currentDirectId) {
		return <NoChannelSelected />;
	}

	const isPublic = isPublicChannel(currentChannel);
	const isThread = checkIsThread(currentChannel);
	return (
		<HomeDefault
			{...props}
			channelId={currentChannel?.channel_id}
			lastSeenMessageId={currentChannel?.last_seen_message?.id}
			lastSentMessageId={currentChannel?.last_sent_message?.id}
			clanId={currentChannel?.clan_id}
			isPublicChannel={isPublic}
			isThread={isThread}
			channelType={currentChannel?.type}
		/>
	);
});

HomeScreen.displayName = 'HomeScreen';

export default HomeScreen;
