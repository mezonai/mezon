import { useTheme } from '@mezon/mobile-ui';
import { selectCurrentChannel } from '@mezon/store-mobile';
import { checkIsThread, isPublicChannel } from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import React, { useCallback, useRef } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import { useSelector } from 'react-redux';
import { APP_SCREEN, AppStackScreenProps } from '../../../../../../navigation/ScreenTypes';
import ChannelMessagesWrapper from '../../../ChannelMessagesWrapper';
import { ChatBox } from '../../../ChatBox';
import PanelKeyboard from '../../../PanelKeyboard';
import { IModeKeyboardPicker } from '../../BottomKeyboardPicker';
import { style } from './styles';
type ChatBoxStreamScreen = typeof APP_SCREEN.MESSAGES.STACK;

const ChatBoxStream = ({ navigation }: AppStackScreenProps<ChatBoxStreamScreen>) => {
	const panelKeyboardRef = useRef(null);
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const currentChannel = useSelector(selectCurrentChannel);
	const onShowKeyboardBottomSheet = useCallback((isShow: boolean, type?: IModeKeyboardPicker) => {
		if (panelKeyboardRef?.current) {
			panelKeyboardRef.current?.onShowKeyboardBottomSheet(isShow, type);
		}
	}, []);

	const onHandlerStateChange = useCallback((event: { nativeEvent: { translationX: any; velocityX: any } }) => {
		const { translationX, velocityX } = event.nativeEvent;
		if (translationX > 50 && velocityX > 300) {
			navigation?.goBack();
		}
	}, []);

	return (
		<KeyboardAvoidingView style={styles.channelView} behavior={'padding'} keyboardVerticalOffset={Platform.OS === 'ios' ? 85 : 0}>
			<PanGestureHandler failOffsetY={[-5, 5]} onHandlerStateChange={onHandlerStateChange}>
				<View style={{ flex: 1 }}>
					<ChannelMessagesWrapper
						channelId={currentChannel?.channel_id}
						clanId={currentChannel?.clan_id}
						isPublic={isPublicChannel(currentChannel)}
						mode={checkIsThread(currentChannel) ? ChannelStreamMode.STREAM_MODE_THREAD : ChannelStreamMode.STREAM_MODE_CHANNEL}
					/>
				</View>
			</PanGestureHandler>

			<ChatBox
				hiddenIcon={{
					threadIcon: true
				}}
				channelId={currentChannel?.channel_id}
				mode={checkIsThread(currentChannel) ? ChannelStreamMode.STREAM_MODE_THREAD : ChannelStreamMode.STREAM_MODE_CHANNEL}
				onShowKeyboardBottomSheet={onShowKeyboardBottomSheet}
				isPublic={isPublicChannel(currentChannel)}
			/>
			<PanelKeyboard ref={panelKeyboardRef} currentChannelId={currentChannel?.channel_id} currentClanId={currentChannel?.clan_id} />
		</KeyboardAvoidingView>
	);
};

export const ChatBoxStreamComponent = React.memo(ChatBoxStream);
