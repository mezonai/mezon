import { Block, size, useTheme } from '@mezon/mobile-ui';
import { messagesActions, selectCurrentClanId, useAppDispatch } from '@mezon/store-mobile';
import { IEmojiOnMessage, IHashtagOnMessage, ILinkOnMessage, ILinkVoiceRoomOnMessage, IMarkdownOnMessage, IMentionOnMessage } from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import { Dispatch, MutableRefObject, SetStateAction, forwardRef, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, TextInput, View } from 'react-native';
import { useSelector } from 'react-redux';
import { useThrottledCallback } from 'use-debounce';
import { EMessageActionType } from '../../../enums';
import { IMessageActionNeedToResolve } from '../../../types';
import { IModeKeyboardPicker } from '../../BottomKeyboardPicker';
import EmojiSwitcher from '../../EmojiPicker/EmojiSwitcher';
import { renderTextContent } from '../../RenderTextContent';
import { style } from '../ChatBoxBottomBar/style';
import { ChatMessageSending } from '../ChatMessageSending';

interface IChatMessageInputProps {
	textInputProps: any;
	text: string;
	isFocus: boolean;
	isShowAttachControl: boolean;
	mode: ChannelStreamMode;
	channelId: string;
	messageActionNeedToResolve: IMessageActionNeedToResolve | null;
	messageAction?: EMessageActionType;
	onSendSuccess?: () => void;
	modeKeyBoardBottomSheet: IModeKeyboardPicker;
	handleKeyboardBottomSheetMode: (mode: IModeKeyboardPicker) => void;
	setModeKeyBoardBottomSheet: Dispatch<SetStateAction<IModeKeyboardPicker>>;
	setIsShowAttachControl: Dispatch<SetStateAction<boolean>>;
	onShowKeyboardBottomSheet?: (isShow: boolean, type?: string) => void;
	keyboardHeight?: number;
	mentionsOnMessage?: MutableRefObject<IMentionOnMessage[]>;
	hashtagsOnMessage?: MutableRefObject<IHashtagOnMessage[]>;
	emojisOnMessage?: MutableRefObject<IEmojiOnMessage[]>;
	linksOnMessage?: MutableRefObject<ILinkOnMessage[]>;
	markdownsOnMessage?: MutableRefObject<IMarkdownOnMessage[]>;
	voiceLinkRoomOnMessage?: MutableRefObject<ILinkVoiceRoomOnMessage[]>;
	isShowCreateThread?: boolean;
	isPublic?: boolean;
}

export const ChatMessageInput = memo(
	forwardRef(
		(
			{
				textInputProps,
				text,
				isFocus,
				channelId,
				mode,
				messageActionNeedToResolve,
				messageAction,
				onSendSuccess,
				handleKeyboardBottomSheetMode,
				modeKeyBoardBottomSheet,
				setModeKeyBoardBottomSheet,
				setIsShowAttachControl,
				onShowKeyboardBottomSheet,
				mentionsOnMessage,
				hashtagsOnMessage,
				emojisOnMessage,
				linksOnMessage,
				markdownsOnMessage,
				voiceLinkRoomOnMessage,
				isPublic
			}: IChatMessageInputProps,
			ref: MutableRefObject<TextInput>
		) => {
			const [heightInput, setHeightInput] = useState(size.s_40);
			const { themeValue } = useTheme();
			const { t } = useTranslation('message');
			const dispatch = useAppDispatch();
			const styles = style(themeValue);
			const currentClanId = useSelector(selectCurrentClanId);
			const isAvailableSending = useMemo(() => {
				return text?.length > 0 && text?.trim()?.length > 0;
			}, [text]);
			const valueInputRef = useRef<string>('');

			useEffect(() => {
				valueInputRef.current = text;
			}, [text]);

			const clearInputAfterSendMessage = useCallback(() => {
				onSendSuccess();
				ref.current?.clear?.();
				setHeightInput(size.s_40);
			}, [onSendSuccess, ref]);

			const handleTyping = useCallback(async () => {
				dispatch(
					messagesActions.sendTypingUser({
						clanId: currentClanId || '',
						channelId,
						mode,
						isPublic
					})
				);
			}, [channelId, currentClanId, dispatch, isPublic, mode]);

			const handleTypingDebounced = useThrottledCallback(handleTyping, 1000);

			const handleDirectMessageTyping = useCallback(async () => {
				await Promise.all([
					dispatch(
						messagesActions.sendTypingUser({
							clanId: '0',
							channelId: channelId,
							mode: mode,
							isPublic: false
						})
					)
				]);
			}, [channelId, dispatch, mode]);

			const handleDirectMessageTypingDebounced = useThrottledCallback(handleDirectMessageTyping, 1000);
			//end: DM stuff

			const handleInputFocus = () => {
				setModeKeyBoardBottomSheet('text');
				ref && ref.current && ref.current?.focus();
				onShowKeyboardBottomSheet(false);
			};

			const handleInputBlur = () => {
				setIsShowAttachControl(false);
				if (modeKeyBoardBottomSheet === 'text') {
					onShowKeyboardBottomSheet(false);
				}
			};

			const handleTypingMessage = useCallback(async () => {
				switch (mode) {
					case ChannelStreamMode.STREAM_MODE_CHANNEL:
					case ChannelStreamMode.STREAM_MODE_THREAD:
						await handleTypingDebounced();
						break;
					case ChannelStreamMode.STREAM_MODE_DM:
					case ChannelStreamMode.STREAM_MODE_GROUP:
						await handleDirectMessageTypingDebounced();
						break;
					default:
						break;
				}
			}, [handleDirectMessageTypingDebounced, handleTypingDebounced, mode]);

			return (
				<Block flex={1} flexDirection="row" paddingHorizontal={size.s_6}>
					<Block alignItems="center" flex={1} justifyContent="center">
						<TextInput
							ref={ref}
							autoFocus={isFocus}
							placeholder={t('messageInputPlaceHolder')}
							placeholderTextColor={themeValue.textDisabled}
							blurOnSubmit={false}
							onFocus={handleInputFocus}
							onBlur={handleInputBlur}
							multiline={true}
							spellCheck={false}
							numberOfLines={4}
							onChange={() => handleTypingMessage()}
							{...textInputProps}
							style={[styles.inputStyle, { height: Platform.OS === 'ios' ? 'auto' : Math.max(size.s_40, heightInput) }]}
							children={renderTextContent(text)}
							onContentSizeChange={(e) => {
								if (Platform.OS === 'android') {
									if (e.nativeEvent.contentSize.height < size.s_40 * 2) {
										setHeightInput(e.nativeEvent.contentSize.height);
									} else {
										setHeightInput(size.s_40 * 3);
									}
								}
							}}
						/>
						<View style={styles.iconEmoji}>
							<EmojiSwitcher onChange={handleKeyboardBottomSheetMode} mode={modeKeyBoardBottomSheet} />
						</View>
					</Block>

					<ChatMessageSending
						isAvailableSending={isAvailableSending}
						valueInputRef={valueInputRef}
						mode={mode}
						channelId={channelId}
						messageActionNeedToResolve={messageActionNeedToResolve}
						mentionsOnMessage={mentionsOnMessage}
						hashtagsOnMessage={hashtagsOnMessage}
						emojisOnMessage={emojisOnMessage}
						linksOnMessage={linksOnMessage}
						markdownsOnMessage={markdownsOnMessage}
						voiceLinkRoomOnMessage={voiceLinkRoomOnMessage}
						messageAction={messageAction}
						clearInputAfterSendMessage={clearInputAfterSendMessage}
					/>
				</Block>
			);
		}
	)
);
