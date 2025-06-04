import { useTheme } from '@mezon/mobile-ui';
import { EStateFriend, selectDirectById, selectFriendStatus, useAppSelector } from '@mezon/store-mobile';
import { ChannelStreamMode } from 'mezon-js';
import React, { memo, useCallback, useMemo, useRef } from 'react';
import { Platform, StatusBar } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import ChannelMessages from '../../home/homedrawer/ChannelMessages';
import { ChatBox } from '../../home/homedrawer/ChatBox';
import PanelKeyboard from '../../home/homedrawer/PanelKeyboard';
import { IModeKeyboardPicker } from '../../home/homedrawer/components/BottomKeyboardPicker';
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

	const directMessage = useAppSelector((state) => selectDirectById(state, directMessageId));

	const targetUserId = useMemo(() => {
		return isModeDM ? directMessage?.user_id?.[0] : '';
	}, [directMessage?.user_id, isModeDM]);

	const friendStatus = useAppSelector(selectFriendStatus(targetUserId));

	const isFriendBlocked = useMemo(() => {
		return friendStatus === EStateFriend?.BLOCK;
	}, [friendStatus]);

	return (
		<KeyboardAvoidingView
			style={styles.content}
			behavior={'padding'}
			keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : StatusBar.currentHeight}
		>
			<ChannelMessages
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
				isFriendTargetBlocked={isFriendBlocked}
			/>
			<PanelKeyboard
				ref={panelKeyboardRef}
				directMessageId={directMessageId || ''}
				currentChannelId={directMessageId}
				currentClanId={currentClanId}
			/>
		</KeyboardAvoidingView>
	);
});
