import { Block, useTheme } from '@mezon/mobile-ui';
import { selectChannelById, selectCurrentStreamInfo, useAppSelector } from '@mezon/store-mobile';
import { checkIsThread, isPublicChannel } from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import React, { useCallback, useRef } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { useSelector } from 'react-redux';
import ChannelMessagesWrapper from '../../../ChannelMessagesWrapper';
import { ChatBox } from '../../../ChatBox';
import PanelKeyboard from '../../../PanelKeyboard';
import { IModeKeyboardPicker } from '../../BottomKeyboardPicker';
import { style } from './styles';

const ChatBoxStream = () => {
	const currentStreamInfo = useSelector(selectCurrentStreamInfo);
	const panelKeyboardRef = useRef(null);
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const currentChannel = useAppSelector((state) => selectChannelById(state, currentStreamInfo?.streamId || ''));
	const onShowKeyboardBottomSheet = useCallback((isShow: boolean, type?: IModeKeyboardPicker) => {
		if (panelKeyboardRef?.current) {
			panelKeyboardRef.current?.onShowKeyboardBottomSheet(isShow, type);
		}
	}, []);

	return (
		<Block height={'100%'} width={'100%'}>
			<KeyboardAvoidingView style={styles.channelView} behavior={'padding'} keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
				<ChannelMessagesWrapper
					channelId={currentChannel?.channel_id}
					clanId={currentChannel?.clan_id}
					isPublic={isPublicChannel(currentChannel)}
					mode={checkIsThread(currentChannel) ? ChannelStreamMode.STREAM_MODE_THREAD : ChannelStreamMode.STREAM_MODE_CHANNEL}
				/>
				<ChatBox
					hiddenIcon={{
						threadIcon: true
					}}
					channelId={currentChannel?.channel_id}
					mode={checkIsThread(currentChannel) ? ChannelStreamMode.STREAM_MODE_THREAD : ChannelStreamMode.STREAM_MODE_CHANNEL}
					onShowKeyboardBottomSheet={onShowKeyboardBottomSheet}
				/>
				<PanelKeyboard ref={panelKeyboardRef} currentChannelId={currentChannel?.channel_id} currentClanId={currentChannel?.clan_id} />
			</KeyboardAvoidingView>
		</Block>
	);
};

export const ChatBoxStreamComponent = React.memo(ChatBoxStream);
