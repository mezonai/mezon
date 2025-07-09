import { useTheme } from '@mezon/mobile-ui';
import { selectDmGroupCurrent } from '@mezon/store-mobile';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import React, { useMemo } from 'react';
import { View } from 'react-native';
import { useSelector } from 'react-redux';
import { ChatMessageWrapper } from '../ChatMessageWrapper';
import { DirectMessageDetailListener } from '../DirectMessageDetail/DirectMessageDetailListener';
import HeaderDirectMessage, { ChannelSeen } from '../DirectMessageDetail/HeaderDirectMessage';
import { style } from './styles';

export const DirectMessageDetailTablet = ({ directMessageId }: { directMessageId?: string }) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const currentDmGroup = useSelector(selectDmGroupCurrent(directMessageId ?? ''));
	const isModeDM = useMemo(() => {
		return Number(currentDmGroup?.type) === ChannelType.CHANNEL_TYPE_DM;
	}, [currentDmGroup?.type]);

	const streamMode = useMemo(() => {
		return currentDmGroup?.type === ChannelType.CHANNEL_TYPE_DM ? ChannelStreamMode.STREAM_MODE_DM : ChannelStreamMode.STREAM_MODE_GROUP;
	}, [currentDmGroup?.type]);

	const dmType = useMemo(() => {
		return currentDmGroup?.type;
	}, [currentDmGroup?.type]);

	return (
		<View style={styles.dmMessageContainer}>
			<ChannelSeen channelId={directMessageId || ''} streamMode={streamMode} />
			<DirectMessageDetailListener directMessageId={directMessageId} dmType={dmType} />
			<HeaderDirectMessage directMessageId={directMessageId} styles={styles} themeValue={themeValue} />
			{directMessageId && <ChatMessageWrapper directMessageId={directMessageId} isModeDM={isModeDM} currentClanId={'0'} />}
		</View>
	);
};
