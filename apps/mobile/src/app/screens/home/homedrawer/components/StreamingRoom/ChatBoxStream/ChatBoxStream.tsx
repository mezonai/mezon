import { useTheme } from '@mezon/mobile-ui';
import { selectBanMemberCurrentClanById, selectCurrentChannel, selectCurrentUserId } from '@mezon/store-mobile';
import { checkIsThread, isPublicChannel } from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import LinearGradient from 'react-native-linear-gradient';
import Animated from 'react-native-reanimated';
import { useSelector } from 'react-redux';
import type { APP_SCREEN, AppStackScreenProps } from '../../../../../../navigation/ScreenTypes';
import ChannelMessages from '../../../ChannelMessages';
import { ChatBox } from '../../../ChatBox';
import PanelKeyboard from '../../../PanelKeyboard';
import { style } from './styles';

type ChatBoxStreamScreen = typeof APP_SCREEN.MESSAGES.STACK;

const ChatBoxStream = ({ navigation }: AppStackScreenProps<ChatBoxStreamScreen>) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const currentChannel = useSelector(selectCurrentChannel);
	const currentUserId = useSelector(selectCurrentUserId);
	const isBanned = useSelector((state) => selectBanMemberCurrentClanById(state, currentChannel?.channelId, currentUserId));

	const onHandlerStateChange = useCallback((event: { nativeEvent: { translationX: any; velocityX: any } }) => {
		const { translationX, velocityX } = event.nativeEvent;
		if (translationX > 50 && velocityX > 300) {
			navigation?.goBack();
		}
	}, []);

	return (
		<View style={styles.channelView}>
			<LinearGradient
				start={{ x: 1, y: 0 }}
				end={{ x: 0, y: 0 }}
				colors={[themeValue.primary, themeValue?.primaryGradiant || themeValue.primary]}
				style={[StyleSheet.absoluteFillObject]}
			/>
			<PanGestureHandler failOffsetY={[-5, 5]} onHandlerStateChange={onHandlerStateChange}>
				<Animated.View style={styles.messageContainer}>
					<ChannelMessages
						channelId={currentChannel?.channelId}
						clanId={currentChannel?.clanId}
						isPublic={isPublicChannel(currentChannel)}
						mode={checkIsThread(currentChannel) ? ChannelStreamMode.STREAM_MODE_THREAD : ChannelStreamMode.STREAM_MODE_CHANNEL}
						isBanned={!!isBanned}
					/>
				</Animated.View>
			</PanGestureHandler>

			<ChatBox
				channelId={currentChannel?.channelId}
				mode={checkIsThread(currentChannel) ? ChannelStreamMode.STREAM_MODE_THREAD : ChannelStreamMode.STREAM_MODE_CHANNEL}
				isPublic={isPublicChannel(currentChannel)}
				topicChannelId={''}
				isBanned={!!isBanned}
			/>
			<PanelKeyboard currentChannelId={currentChannel?.channelId} currentClanId={currentChannel?.clanId} />
		</View>
	);
};

export const ChatBoxStreamComponent = React.memo(ChatBoxStream);
