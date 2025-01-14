import { useTheme } from '@mezon/mobile-ui';
import { ChannelStreamMode } from 'mezon-js';
import React, { memo, useCallback, useRef } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import ShareLocationConfirmModal from '../../../components/ShareLocationConfirmModal';
import ChannelMessagesWrapper from '../../home/homedrawer/ChannelMessagesWrapper';
import { ChatBox } from '../../home/homedrawer/ChatBox';
import PanelKeyboard from '../../home/homedrawer/PanelKeyboard';
import { IModeKeyboardPicker } from '../../home/homedrawer/components';
import { style } from './styles';

interface IChatMessageWrapperProps {
	handleBack?: () => void;
	directMessageId: string;
	isModeDM: boolean;
	currentClanId: string;
}
export const ChatMessageWrapper = memo(({ handleBack, directMessageId, isModeDM, currentClanId }: IChatMessageWrapperProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const panelKeyboardRef = useRef(null);

	const onHandlerStateChange = useCallback(
		(event: { nativeEvent: { translationX: any; velocityX: any } }) => {
			const { translationX, velocityX } = event.nativeEvent;
			if (translationX > 50 && velocityX > 300) {
				handleBack?.();
			}
		},
		[handleBack]
	);

	const onShowKeyboardBottomSheet = useCallback((isShow: boolean, type?: IModeKeyboardPicker) => {
		if (panelKeyboardRef?.current) {
			panelKeyboardRef.current?.onShowKeyboardBottomSheet(isShow, type);
		}
	}, []);

	return (
		<KeyboardAvoidingView style={styles.content} behavior={'padding'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
			<PanGestureHandler failOffsetY={[-5, 5]} onHandlerStateChange={onHandlerStateChange}>
				<View style={{ flex: 1 }}>
					<ChannelMessagesWrapper
						channelId={directMessageId}
						clanId={'0'}
						mode={Number(isModeDM ? ChannelStreamMode.STREAM_MODE_DM : ChannelStreamMode.STREAM_MODE_GROUP)}
						isPublic={false}
						isDM={true}
					/>
				</View>
			</PanGestureHandler>
			<ChatBox
				channelId={directMessageId}
				mode={Number(isModeDM ? ChannelStreamMode.STREAM_MODE_DM : ChannelStreamMode.STREAM_MODE_GROUP)}
				onShowKeyboardBottomSheet={onShowKeyboardBottomSheet}
				hiddenIcon={{
					threadIcon: true
				}}
				isPublic={false}
			/>
			<PanelKeyboard
				ref={panelKeyboardRef}
				directMessageId={directMessageId || ''}
				currentChannelId={directMessageId}
				currentClanId={currentClanId}
			/>
			<ShareLocationConfirmModal
				channelId={directMessageId}
				mode={Number(isModeDM ? ChannelStreamMode.STREAM_MODE_DM : ChannelStreamMode.STREAM_MODE_GROUP)}
			/>
		</KeyboardAvoidingView>
	);
});
