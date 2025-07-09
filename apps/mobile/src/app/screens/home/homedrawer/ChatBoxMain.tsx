import { ActionEmitEvent, load, save, STORAGE_MESSAGE_ACTION_NEED_TO_RESOLVE } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { ChannelStreamMode } from 'mezon-js';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Text, View } from 'react-native';
import { resetCachedMessageActionNeedToResolve } from '../../../utils/helpers';
import { ActionMessageSelected } from './components/ChatBox/ActionMessageSelected';
import { ChatBoxBottomBar } from './components/ChatBox/ChatBoxBottomBar';
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
	isPublic: boolean;
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
				if (!value?.targetMessage?.channel_id) return;
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
		DeviceEventEmitter.emit(ActionEmitEvent.SHOW_KEYBOARD, null);
	}, []);

	return (
		<View
			style={{
				backgroundColor: themeValue.primary,
				borderTopWidth: 1,
				borderTopColor: themeValue.border,
				flexDirection: 'column',
				justifyContent: 'space-between'
			}}
		>
			{messageActionNeedToResolve && (props?.canSendMessage || isDM) && (
				<ActionMessageSelected messageActionNeedToResolve={messageActionNeedToResolve} onClose={deleteMessageActionNeedToResolve} />
			)}
			{!props?.canSendMessage && !isDM ? (
				<View
					style={{
						zIndex: 10,
						width: '95%',
						marginVertical: size.s_6,
						alignSelf: 'center',
						marginBottom: size.s_20
					}}
				>
					<View
						style={{
							backgroundColor: themeValue.charcoal,
							padding: size.s_16,
							borderRadius: size.s_20,
							marginHorizontal: size.s_6
						}}
					>
						<Text
							style={{
								color: themeValue.textDisabled,
								textAlign: 'center'
							}}
						>
							{t('noSendMessagePermission')}
						</Text>
					</View>
				</View>
			) : (
				<ChatBoxBottomBar
					messageActionNeedToResolve={messageActionNeedToResolve}
					onDeleteMessageActionNeedToResolve={deleteMessageActionNeedToResolve}
					channelId={props?.channelId}
					mode={props?.mode}
					hiddenIcon={props?.hiddenIcon}
					messageAction={props?.messageAction}
					isPublic={props?.isPublic}
				/>
			)}
		</View>
	);
});
