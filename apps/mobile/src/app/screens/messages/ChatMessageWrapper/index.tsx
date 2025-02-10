import { useTheme } from '@mezon/mobile-ui';
import { ChannelStreamMode } from 'mezon-js';
import React, { memo, useCallback, useRef } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import ShareLocationConfirmModal from '../../../components/ShareLocationConfirmModal';
import ChannelMessagesWrapper from '../../home/homedrawer/ChannelMessagesWrapper';
import { ChatBox } from '../../home/homedrawer/ChatBox';
import PanelKeyboard from '../../home/homedrawer/PanelKeyboard';
import { IModeKeyboardPicker } from '../../home/homedrawer/components';
import { style } from './styles';

interface IChatMessageWrapperProps {
	directMessageId: string;
	isModeDM: boolean;
	currentClanId: string;
}
export const ChatMessageWrapper = memo(({ directMessageId, isModeDM, currentClanId }: IChatMessageWrapperProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const panelKeyboardRef = useRef(null);

	const onShowKeyboardBottomSheet = useCallback((isShow: boolean, type?: IModeKeyboardPicker) => {
		if (panelKeyboardRef?.current) {
			panelKeyboardRef.current?.onShowKeyboardBottomSheet(isShow, type);
		}
	}, []);

	return (
		<KeyboardAvoidingView style={styles.content} behavior={'padding'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
			<ChannelMessagesWrapper
				channelId={directMessageId}
				clanId={'0'}
				mode={Number(isModeDM ? ChannelStreamMode.STREAM_MODE_DM : ChannelStreamMode.STREAM_MODE_GROUP)}
				isPublic={false}
				isDM={true}
			/>
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
