import { selectBanMemberCurrentClanById, selectCurrentChannel, selectCurrentUserId, selectDmGroupCurrentId } from '@mezon/store-mobile';
import { checkIsThread, isPublicChannel } from '@mezon/utils';
import React from 'react';
import { useSelector } from 'react-redux';
import HomeDefault from './HomeDefault';
import NoChannelSelected from './NoChannelSelected';

const HomeScreen = React.memo((props: any) => {
	const currentChannel = useSelector(selectCurrentChannel);
	const currentDirectId = useSelector(selectDmGroupCurrentId);
	const currentUserId = useSelector(selectCurrentUserId);
	const isBanned = useSelector((state) => selectBanMemberCurrentClanById(state, currentChannel?.channelId, currentUserId));
	if (!currentChannel && !currentDirectId) {
		return <NoChannelSelected />;
	}

	const isPublic = isPublicChannel(currentChannel);
	const isThread = checkIsThread(currentChannel);
	return (
		<HomeDefault
			{...props}
			channelId={currentChannel?.channelId}
			lastSeenMessageId={currentChannel?.lastSeenMessage?.id}
			lastSentMessageId={currentChannel?.lastSentMessage?.id}
			clanId={currentChannel?.clanId}
			isPublicChannel={isPublic}
			isThread={isThread}
			channelType={currentChannel?.type}
			isBanned={!!isBanned}
		/>
	);
});

HomeScreen.displayName = 'HomeScreen';

export default HomeScreen;
