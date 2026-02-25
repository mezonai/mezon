import { useTheme } from '@mezon/mobile-ui';
import { directActions, EStateFriend, selectDirectById, selectFriendById, topicsActions, useAppDispatch, useAppSelector } from '@mezon/store-mobile';
import { ChannelType } from 'mezon-js';
import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSelector } from 'react-redux';
import StatusBarHeight from '../../../components/StatusBarHeight/StatusBarHeight';
import { ChatMessageWrapper } from '../ChatMessageWrapper';
import { DirectMessageDetailListener } from './DirectMessageDetailListener';
import HeaderDirectMessage from './HeaderDirectMessage';
import { style } from './styles';

export const DirectMessageDetailScreen = ({ route }: { route: any }) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const directMessageId = route.params?.directMessageId as string;
	const dispatch = useAppDispatch();

	const from = route.params?.from;
	const currentDmGroup = useAppSelector((state) => selectDirectById(state, directMessageId));
	const infoFriend = useSelector((state) => selectFriendById(state, currentDmGroup?.user_ids?.[0] || ''));

	const isBlocked = useMemo(() => {
		if (currentDmGroup?.type !== ChannelType.CHANNEL_TYPE_DM) return false;
		return infoFriend?.state === EStateFriend.BLOCK;
	}, [currentDmGroup?.type, infoFriend?.state]);

	useEffect(() => {
		dispatch(topicsActions.setCurrentTopicId(''));
		// When the screen is focused, socket disconnect or some case, we want to fetch the DM group if it is not already available
		if (!currentDmGroup?.channel_id) {
			dispatch(directActions.fetchDirectMessage({ noCache: true }));
		}
	}, [currentDmGroup?.channel_id, dispatch]);

	const dmType = useMemo(() => {
		return currentDmGroup?.type;
	}, [currentDmGroup?.type]);

	return (
		<View style={{ flex: 1 }}>
			<StatusBarHeight />
			<LinearGradient
				start={{ x: 1, y: 0 }}
				end={{ x: 0, y: 0 }}
				colors={[themeValue.primary, themeValue?.primaryGradiant || themeValue.primary]}
				style={[StyleSheet.absoluteFillObject]}
			/>
			<DirectMessageDetailListener dmType={dmType} directMessageId={directMessageId} />
			<HeaderDirectMessage from={from} styles={styles} themeValue={themeValue} directMessageId={directMessageId} isBlocked={isBlocked} />
			{directMessageId && (
				<ChatMessageWrapper
					directMessageId={directMessageId}
					lastSeenMessageId={currentDmGroup?.last_seen_message?.id}
					lastSentMessageId={currentDmGroup?.last_sent_message?.id}
					isModeDM={Number(dmType) === ChannelType.CHANNEL_TYPE_DM}
					isBlocked={isBlocked}
					dmType={dmType}
				/>
			)}
		</View>
	);
};
