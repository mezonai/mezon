import {
	messagesActions,
	selectAllAccount,
	selectCurrentClanId,
	selectMemberClanByUserId,
	useAppDispatch,
	useAppSelector
} from '@mezon/store-mobile';
import { ChannelStreamMode } from 'mezon-js';
import { memo, useEffect } from 'react';
import { View } from 'react-native';
import { useSelector } from 'react-redux';
import { useThrottledCallback } from 'use-debounce';

interface IChatInputProps {
	textChange: string;
	mode: ChannelStreamMode;
	channelId: string;
	isPublic: boolean;
	anonymousMode: boolean;
	topicChannelId?: string;
}

export const ChatBoxTyping = memo(
	({ textChange, mode = 2, channelId = '', isPublic = false, anonymousMode = false, topicChannelId = '' }: IChatInputProps) => {
		const dispatch = useAppDispatch();
		const currentClanId = useSelector(selectCurrentClanId);
		const userProfile = useSelector(selectAllAccount);
		const userClanProfile = useAppSelector((state) => selectMemberClanByUserId(state, userProfile?.user?.id));

		const handleTyping = async () => {
			if (anonymousMode) return;
			dispatch(
				messagesActions.sendTypingUser({
					clanId: currentClanId || '',
					channelId,
					mode,
					isPublic,
					username: userClanProfile?.clanNick || userProfile?.user?.displayName || userProfile?.user?.username,
					topicId: topicChannelId || ''
				})
			);
		};

		const handleDirectMessageTyping = async () => {
			await Promise.all([
				dispatch(
					messagesActions.sendTypingUser({
						clanId: '0',
						channelId,
						mode,
						isPublic: false,
						username: userProfile?.user?.displayName || userProfile?.user?.username
					})
				)
			]);
		};

		const handleTypingDebounced = useThrottledCallback(handleTyping, 1000);
		const handleDirectMessageTypingDebounced = useThrottledCallback(handleDirectMessageTyping, 1000);

		const handleTypingMessage = async () => {
			switch (mode) {
				case ChannelStreamMode.STREAM_MODE_CHANNEL:
				case ChannelStreamMode.STREAM_MODE_THREAD:
					await handleTypingDebounced();
					break;
				case ChannelStreamMode.STREAM_MODE_DM:
				case ChannelStreamMode.STREAM_MODE_GROUP:
					await handleDirectMessageTypingDebounced();
					break;
				default:
					break;
			}
		};

		useEffect(() => {
			if (textChange) {
				handleTypingMessage();
			}
		}, [textChange]);

		return <View />;
	}
);
