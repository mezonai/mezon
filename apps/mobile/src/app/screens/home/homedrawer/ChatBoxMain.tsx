import { ActionEmitEvent, load, save, STORAGE_MESSAGE_ACTION_NEED_TO_RESOLVE } from '@mezon/mobile-components';
import { Block, size, useTheme } from '@mezon/mobile-ui';
import { ChannelStreamMode } from 'mezon-js';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Text } from 'react-native';
import { resetCachedMessageActionNeedToResolve } from '../../../utils/helpers';
import { ActionMessageSelected } from './components/ChatBox/ActionMessageSelected';
import { ChatBoxBottomBar } from './components/ChatBox/ChatBoxBottomBar';
import { RecordAudioMessage } from './components/ChatBox/RecordAudioMessage';
import { EMessageActionType } from './enums';
import { IMessageActionNeedToResolve } from './types';

interface IChatBoxProps {
	channelId: string;
	mode: ChannelStreamMode;
	messageAction?: EMessageActionType;
	hiddenIcon?: {
		threadIcon: boolean;
	};
	directMessageId?: string;
	canSendMessage?: boolean;
	onShowKeyboardBottomSheet?: (isShow: boolean, type?: string) => void;
}

export const ChatBoxMain = memo((props: IChatBoxProps) => {
	const { themeValue } = useTheme();
	const { t } = useTranslation(['message']);
	const [messageActionNeedToResolve, setMessageActionNeedToResolve] = useState<IMessageActionNeedToResolve | null>(null);
	const isDM = useMemo(() => {
		return [ChannelStreamMode.STREAM_MODE_DM, ChannelStreamMode.STREAM_MODE_GROUP].includes(props?.mode);
	}, [props?.mode]);

	useEffect(() => {
		if (props?.channelId && messageActionNeedToResolve) {
			setMessageActionNeedToResolve(null);
		}
	}, [props?.channelId]);

	useEffect(() => {
		const showKeyboard = DeviceEventEmitter.addListener(ActionEmitEvent.SHOW_KEYBOARD, (value) => {
			//NOTE: trigger from message action 'MessageItemBS and MessageItem component'
			setMessageActionNeedToResolve(value);
			if (value?.type === EMessageActionType.EditMessage) {
				saveMessageActionNeedToResolve(value);
			} else {
				resetCachedMessageActionNeedToResolve(value?.targetMessage?.channel_id);
			}
		});
		return () => {
			showKeyboard.remove();
		};
	}, []);

	useEffect(() => {
		if (props?.channelId) {
			const allCachedMessage = load(STORAGE_MESSAGE_ACTION_NEED_TO_RESOLVE) || {};
			setMessageActionNeedToResolve(allCachedMessage[props?.channelId] || null);
		}
	}, [props?.channelId]);

	const saveMessageActionNeedToResolve = (messageAction: IMessageActionNeedToResolve | null) => {
		const allCachedMessage = load(STORAGE_MESSAGE_ACTION_NEED_TO_RESOLVE) || {};
		save(STORAGE_MESSAGE_ACTION_NEED_TO_RESOLVE, {
			...allCachedMessage,
			[messageAction?.targetMessage?.channel_id]: messageAction
		});
	};
	const deleteMessageActionNeedToResolve = useCallback(() => {
		setMessageActionNeedToResolve(null);
	}, []);

	return (
		<Block>
			<Block
				backgroundColor={themeValue.primary}
				borderTopWidth={1}
				borderTopColor={themeValue.border}
				flexDirection="column"
				justifyContent="space-between"
			>
				<RecordAudioMessage channelId={props?.channelId} mode={props?.mode} />
				{messageActionNeedToResolve && (props?.canSendMessage || isDM) && (
					<ActionMessageSelected
						messageActionNeedToResolve={messageActionNeedToResolve}
						onClose={() => setMessageActionNeedToResolve(null)}
					/>
				)}
				{!props?.canSendMessage && !isDM ? (
					<Block zIndex={10} width={'95%'} marginVertical={size.s_6} alignSelf={'center'} marginBottom={size.s_20}>
						<Block backgroundColor={themeValue.charcoal} padding={size.s_16} borderRadius={size.s_20} marginHorizontal={size.s_6}>
							<Text
								style={{
									color: themeValue.textDisabled
								}}
							>
								{t('noSendMessagePermission')}
							</Text>
						</Block>
					</Block>
				) : (
					<ChatBoxBottomBar
						messageActionNeedToResolve={messageActionNeedToResolve}
						onDeleteMessageActionNeedToResolve={deleteMessageActionNeedToResolve}
						channelId={props?.channelId}
						mode={props?.mode}
						hiddenIcon={props?.hiddenIcon}
						messageAction={props?.messageAction}
						onShowKeyboardBottomSheet={props?.onShowKeyboardBottomSheet}
					/>
				)}
			</Block>
		</Block>
	);
});
