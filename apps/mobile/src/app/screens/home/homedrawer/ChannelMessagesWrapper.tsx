import {messagesActions, useAppDispatch} from '@mezon/store-mobile';
import { ChannelStreamMode } from 'mezon-js';
import React, {useEffect} from 'react';
import {View} from 'react-native';
import ChannelMessageActionListener from './ChannelMessageActionListener';
import ChannelMessageListener from './ChannelMessageListener';
import ChannelMessageReactionListener from './ChannelMessageReactionListener';
import ChannelMessages from './ChannelMessages';

type ChannelMessagesProps = {
	channelId: string;
	clanId: string;
	avatarDM?: string;
	mode: ChannelStreamMode;
	isPublic?: boolean;
	isDM?: boolean;
};

const ChannelMessagesWrapper = React.memo(({ channelId, clanId, mode, isPublic, isDM }: ChannelMessagesProps) => {
	const dispatch = useAppDispatch();
	useEffect(() => {
		return () => {
			dispatch(
				messagesActions.UpdateChannelLastMessage({
					channelId
				})
			);
		};
	}, [channelId, dispatch]);

	return (
		<View style={{ flex: 1 }}>
			<ChannelMessages channelId={channelId} clanId={clanId} mode={mode} isDM={isDM} isPublic={isPublic}/>
			
			<ChannelMessageListener/>
			<ChannelMessageReactionListener />
			<ChannelMessageActionListener mode={mode} isPublic={isPublic} clanId={clanId} channelId={channelId}/>
		</View>
	);
});

export default ChannelMessagesWrapper;
