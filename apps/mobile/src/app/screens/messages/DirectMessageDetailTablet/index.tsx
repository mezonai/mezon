import { useTheme } from '@mezon/mobile-ui';
import { EStateFriend, selectDmGroupCurrent, selectFriendById } from '@mezon/store-mobile';
import { ChannelType } from 'mezon-js';
import React, { useMemo } from 'react';
import { View } from 'react-native';
import { useSelector } from 'react-redux';
import { ChatMessageWrapper } from '../ChatMessageWrapper';
import { DirectMessageDetailListener } from '../DirectMessageDetail/DirectMessageDetailListener';
import HeaderDirectMessage from '../DirectMessageDetail/HeaderDirectMessage';
import { style } from './styles';

export const DirectMessageDetailTablet = ({ directMessageId }: { directMessageId?: string }) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const currentDmGroup = useSelector(selectDmGroupCurrent(directMessageId ?? ''));
	const infoFriend = useSelector((state) => selectFriendById(state, currentDmGroup?.userIds?.[0] || ''));

	const isBlocked = useMemo(() => {
		if (currentDmGroup?.type !== ChannelType.CHANNEL_TYPE_DM) return false;
		return infoFriend?.state === EStateFriend.BLOCK;
	}, [currentDmGroup?.type, infoFriend?.state]);

	const isModeDM = useMemo(() => {
		return Number(currentDmGroup?.type) === ChannelType.CHANNEL_TYPE_DM;
	}, [currentDmGroup?.type]);

	const dmType = useMemo(() => {
		return currentDmGroup?.type;
	}, [currentDmGroup?.type]);

	return (
		<View style={styles.dmMessageContainer}>
			<DirectMessageDetailListener directMessageId={directMessageId} dmType={dmType} />
			<HeaderDirectMessage directMessageId={directMessageId} styles={styles} themeValue={themeValue} isBlocked={isBlocked} />
			{directMessageId && (
				<ChatMessageWrapper
					directMessageId={directMessageId}
					lastSeenMessageId={currentDmGroup?.lastSeenMessage?.id}
					lastSentMessageId={currentDmGroup?.lastSentMessage?.id}
					isModeDM={isModeDM}
					isBlocked={isBlocked}
					dmType={dmType}
				/>
			)}
		</View>
	);
};
