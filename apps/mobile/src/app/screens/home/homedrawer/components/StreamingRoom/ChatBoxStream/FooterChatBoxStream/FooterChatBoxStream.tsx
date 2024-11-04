import { selectCurrentStreamInfo } from '@mezon/store-mobile';
import { ChannelStreamMode } from 'mezon-js';
import React from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { useSelector } from 'react-redux';
import { ChatBox } from '../../../../ChatBox';
import { IModeKeyboardPicker } from '../../../BottomKeyboardPicker';

const FooterChatBoxStream = ({
	onShowKeyboardBottomSheet
}: {
	onShowKeyboardBottomSheet: (isShow: boolean, height: number, type?: IModeKeyboardPicker) => void;
}) => {
	const currentStreamInfo = useSelector(selectCurrentStreamInfo);

	return (
		<KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
			<ChatBox
				channelId={currentStreamInfo?.streamId}
				mode={ChannelStreamMode.STREAM_MODE_CHANNEL}
				onShowKeyboardBottomSheet={onShowKeyboardBottomSheet}
				hiddenIcon={{ threadIcon: true }}
			/>
		</KeyboardAvoidingView>
	);
};

export default React.memo(FooterChatBoxStream);
