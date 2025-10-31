import { useTheme } from '@mezon/mobile-ui';
import { ChannelStreamMode } from 'mezon-js';
import React, { memo } from 'react';
import { Platform, StatusBar, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import ChannelMessages from '../../home/homedrawer/ChannelMessages';
import { ChatBox } from '../../home/homedrawer/ChatBox';
import PanelKeyboard from '../../home/homedrawer/PanelKeyboard';
import { style } from './styles';

interface IChatMessageWrapperProps {
	directMessageId: string;
	lastSeenMessageId: string;
	isModeDM: boolean;
	currentClanId: string;
	isBlocked?: boolean;
}
export const ChatMessageWrapper = memo(({ directMessageId, lastSeenMessageId, isModeDM, currentClanId, isBlocked }: IChatMessageWrapperProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);

	return (
		<KeyboardAvoidingView
			style={styles.content}
			behavior={'padding'}
			keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : StatusBar.currentHeight}
		>
			<View style={{ flex: 1 }}>
				<ChannelMessages
					channelId={directMessageId}
					lastSeenMessageId={lastSeenMessageId}
					clanId={'0'}
					mode={Number(isModeDM ? ChannelStreamMode.STREAM_MODE_DM : ChannelStreamMode.STREAM_MODE_GROUP)}
					isPublic={false}
					isDM={true}
				/>
			</View>
			<ChatBox
				channelId={directMessageId}
				mode={Number(isModeDM ? ChannelStreamMode.STREAM_MODE_DM : ChannelStreamMode.STREAM_MODE_GROUP)}
				hiddenIcon={{
					threadIcon: true
				}}
				isPublic={false}
				topicChannelId={''}
				isBlocked={isBlocked}
			/>
			<PanelKeyboard directMessageId={directMessageId || ''} currentChannelId={directMessageId} currentClanId={currentClanId} />
		</KeyboardAvoidingView>
	);
});
