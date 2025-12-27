/* eslint-disable no-console */
import {
	ActionEmitEvent,
	convertMentionsToText,
	formatContentEditMessage,
	getChannelHashtag,
	KEY_SLASH_COMMAND_EPHEMERAL,
	load,
	mentionRegexSplit,
	save,
	STORAGE_KEY_TEMPORARY_INPUT_MESSAGES
} from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import type { RootState } from '@mezon/store-mobile';
import {
	emojiSuggestionActions,
	getStore,
	referencesActions,
	selectAllChannels,
	selectAllChannelsByUser,
	selectAnonymousMode,
	selectCurrentChannelId,
	selectCurrentClanId,
	selectCurrentClanPreventAnonymous,
	selectCurrentDM,
	threadsActions,
	useAppDispatch
} from '@mezon/store-mobile';
import type { IHashtagOnMessage, IMentionOnMessage, MentionDataProps } from '@mezon/utils';
import { MIN_THRESHOLD_CHARS } from '@mezon/utils';
import { useNavigation } from '@react-navigation/native';
// eslint-disable-next-line
import { useMezon } from '@mezon/transport';
import Clipboard from '@react-native-clipboard/clipboard';
import { ChannelStreamMode } from 'mezon-js';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Platform, StyleSheet, TextInput, View } from 'react-native';
import type { TriggersConfig } from 'react-native-controlled-mentions';
import { useMentions } from 'react-native-controlled-mentions';
import RNFS from 'react-native-fs';
import LinearGradient from 'react-native-linear-gradient';
import { useSelector } from 'react-redux';
import { EmojiSuggestion, HashtagSuggestions, Suggestions } from '../../../../../../components/Suggestions';
import { SlashCommandSuggestions } from '../../../../../../components/Suggestions/SlashCommandSuggestions';
import { SlashCommandMessage } from '../../../../../../components/Suggestions/SlashCommandSuggestions/SlashCommandMessage';
import MezonIconCDN from '../../../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../../constants/icon_cdn';
import { APP_SCREEN } from '../../../../../../navigation/ScreenTypes';
import { removeBackticks, resetCachedChatbox, resetCachedMessageActionNeedToResolve } from '../../../../../../utils/helpers';
import { EMessageActionType } from '../../../enums';
import type { IMessageActionNeedToResolve } from '../../../types';
import AttachmentPreview from '../../AttachmentPreview';
import EmojiSwitcher from '../../EmojiPicker/EmojiSwitcher';
import { RenderTextContent } from '../../RenderTextContent';
import { ChatBoxListener } from '../ChatBoxListener';
import type { IChatMessageLeftAreaRef } from '../ChatMessageLeftArea';
import { ChatMessageLeftArea } from '../ChatMessageLeftArea';
import { ChatMessageSending } from '../ChatMessageSending';
import { RecordMessageProcessing } from '../ChatMessageSending/RecordMessageProcessing';
import { ChatBoxTyping } from './ChatBoxTyping';
import { OptionPasteTooltip } from './OptionPasteTooltip';
import { style } from './style';
import useProcessedContent from './useProcessedContent';

export const triggersConfig: TriggersConfig<'mention' | 'hashtag' | 'emoji' | 'slash'> = {
	mention: {
		trigger: '@',
		allowedSpacesCount: Infinity,
		isInsertSpaceAfterMention: true
	},
	hashtag: {
		trigger: '#',
		allowedSpacesCount: 0,
		isInsertSpaceAfterMention: true,
		textStyle: {
			fontWeight: 'bold',
			color: 'white'
		}
	},
	emoji: {
		trigger: ':',
		allowedSpacesCount: 0,
		isInsertSpaceAfterMention: true
	},
	slash: {
		trigger: '/',
		allowedSpacesCount: 0,
		isInsertSpaceAfterMention: true
	}
};

interface IChatInputProps {
	mode: ChannelStreamMode;
	channelId: string;
	messageActionNeedToResolve: IMessageActionNeedToResolve | null;
	messageAction?: EMessageActionType;
	onDeleteMessageActionNeedToResolve?: () => void;
	isPublic: boolean;
	topicChannelId?: string;
	hiddenAdvanceFunc?: boolean;
}

interface IEphemeralTargetUserInfo {
	id: string;
	display: string;
}

interface IFile {
	uri: string;
	name: string;
	type: string;
	size: number | string;
	fileData: any;
}
const DOUBLE_TAP_DELAY = 1000;
const LONG_PRESS_DELAY = 300;
const MemoizedGradient = memo(({ themeValue }: { themeValue: any }) => (
	<LinearGradient
		start={{ x: 1, y: 0 }}
		end={{ x: 0, y: 0 }}
		colors={[themeValue.primary, themeValue?.primaryGradiant || themeValue.primary]}
		style={[StyleSheet.absoluteFillObject]}
	/>
));
MemoizedGradient.displayName = 'MemoizedGradient';

const SuggestionsPanel = memo(
	({
		triggers,
		listMentions,
		isEphemeralMode,
		channelId,
		mode,
		onSelectCommand
	}: {
		triggers: any;
		listMentions: MentionDataProps[];
		isEphemeralMode: boolean;
		channelId: string;
		mode: ChannelStreamMode;
		onSelectCommand: (command: any) => void;
	}) => {
		return (
			<>
				{triggers?.mention?.keyword !== undefined && (
					<Suggestions {...triggers.mention} listMentions={listMentions} isEphemeralMode={isEphemeralMode} />
				)}
				{triggers?.hashtag?.keyword !== undefined && <HashtagSuggestions directMessageId={channelId} mode={mode} {...triggers.hashtag} />}
				{triggers?.emoji?.keyword !== undefined && <EmojiSuggestion {...triggers.emoji} />}
				{triggers?.slash?.keyword !== undefined && (
					<SlashCommandSuggestions keyword={triggers?.slash?.keyword} channelId={channelId} onSelectCommand={onSelectCommand} />
				)}
			</>
		);
	}
);
SuggestionsPanel.displayName = 'SuggestionsPanel';

export const ChatBoxBottomBar = memo(
	({
		mode = 2,
		channelId = '',
		messageActionNeedToResolve,
		messageAction,
		onDeleteMessageActionNeedToResolve,
		isPublic = false,
		topicChannelId = '',
		hiddenAdvanceFunc = false
	}: IChatInputProps) => {
		const { themeValue } = useTheme();
		const dispatch = useAppDispatch();
		const { t } = useTranslation('message');
		const navigation = useNavigation<any>();
		const { sessionRef, clientRef } = useMezon();
		const styles = style(themeValue);

		const [mentionTextValue, setMentionTextValue] = useState('');
		const [listMentions, setListMentions] = useState<MentionDataProps[]>([]);
		const [isFocus, setIsFocus] = useState<boolean>(false);
		const [modeKeyBoardBottomSheet, setModeKeyBoardBottomSheet] = useState<string>('text');
		const [textChange, setTextChange] = useState<string>('');
		const [isEphemeralMode, setIsEphemeralMode] = useState<boolean>(false);
		const [ephemeralTargetUserInfo, setEphemeralTargetUserInfo] = useState<IEphemeralTargetUserInfo>({
			id: '',
			display: ''
		});
		const [isShowOptionPaste, setIsShowOptionPaste] = useState(false);
		const currentClanId = useSelector(selectCurrentClanId);
		const anonymousMode = useSelector((state) => selectAnonymousMode(state, currentClanId));
		const currentClanPreventAnonymous = useSelector(selectCurrentClanPreventAnonymous);

		const inputRef = useRef<TextInput>(null);
		const cursorPositionRef = useRef(0);
		const convertRef = useRef(false);
		const textValueInputRef = useRef<string>('');
		const timeoutRef = useRef<NodeJS.Timeout | null>(null);
		const mentionsOnMessage = useRef<IMentionOnMessage[]>([]);
		const hashtagsOnMessage = useRef<IHashtagOnMessage[]>([]);
		const chatMessageLeftAreaRef = useRef<IChatMessageLeftAreaRef>(null);
		const longPressTimer = useRef<NodeJS.Timeout | null>(null);
		const isLongPressed = useRef(false);
		const isDoublePressed = useRef(false);
		const lastTap = useRef<number>(0);
		const currentChannelKey = useMemo(() => topicChannelId || channelId, [topicChannelId, channelId]);
		const showAnonymousIcon = useMemo(
			() =>
				mode !== ChannelStreamMode.STREAM_MODE_DM &&
				mode !== ChannelStreamMode.STREAM_MODE_GROUP &&
				anonymousMode &&
				!currentClanPreventAnonymous,
			[mode, anonymousMode, currentClanPreventAnonymous]
		);
		const inputTriggersConfig = useMemo(() => {
			const isDM = [ChannelStreamMode.STREAM_MODE_GROUP].includes(mode);
			const newTriggersConfig = { ...triggersConfig };

			if (isDM) {
				delete newTriggersConfig.hashtag;
			}

			if (isEphemeralMode) {
				delete newTriggersConfig.slash;
			}

			return newTriggersConfig;
		}, [mode, isEphemeralMode]);

		const { textInputProps, triggers } = useMentions({
			value: mentionTextValue,
			onChange: (newValue) => {
				handleTextInputChange(newValue);
				if (isEphemeralMode && !ephemeralTargetUserInfo?.id) {
					handleMentionSelectForEphemeral(newValue);
				}
			},
			onSelectionChange: (position) => {
				handleSelectionChange(position);
			},
			triggersConfig: inputTriggersConfig
		});
		const { emojiList, linkList, markdownList, voiceLinkRoomList, boldList } = useProcessedContent(textValueInputRef?.current);

		const saveMessageToCache = (text: string) => {
			const allCachedMessage = load(STORAGE_KEY_TEMPORARY_INPUT_MESSAGES) || {};
			save(STORAGE_KEY_TEMPORARY_INPUT_MESSAGES, {
				...allCachedMessage,
				[topicChannelId || channelId]: text
			});
		};

		const setMessageFromCache = async () => {
			const allCachedMessage = load(STORAGE_KEY_TEMPORARY_INPUT_MESSAGES) || {};
			handleTextInputChange(allCachedMessage?.[topicChannelId || channelId] || '');
			textValueInputRef.current = convertMentionsToText(allCachedMessage?.[topicChannelId || channelId] || '');
		};

		const handleEventAfterEmojiPicked = useCallback(
			async (shortName: string) => {
				let textFormat;
				if (!textValueInputRef?.current?.length && !textChange.length) {
					textFormat = shortName?.toString();
				} else {
					textFormat = `${textChange?.endsWith(' ') ? textChange : `${textChange} `}${shortName?.toString()}`;
				}
				await handleTextInputChange(`${textFormat} `);
			},
			[textChange]
		);

		const handleActionFromAdvanced = useCallback(async (action: string) => {
			if (action === 'ephemeral') {
				setIsEphemeralMode(true);
				setTextChange('@');
				setMentionTextValue('@');
				textValueInputRef.current = '@';
				mentionsOnMessage.current = [];
			}
		}, []);

		const removeMarkdownTags = useCallback((t: string) => {
			try {
				if (!t) return '';
				const processed = t?.replace(/\*\*([\s\S]*?)\*\*/g, '$1');
				return removeBackticks(processed);
			} catch (error) {
				console.error('Error removing markdown tags:', error);
				return t;
			}
		}, []);

		const onSendSuccess = useCallback(() => {
			textValueInputRef.current = '';
			setTextChange('');
			setMentionTextValue('');
			setIsEphemeralMode(false);
			setEphemeralTargetUserInfo({
				id: '',
				display: ''
			});
			mentionsOnMessage.current = [];
			hashtagsOnMessage.current = [];
			onDeleteMessageActionNeedToResolve();
			resetCachedChatbox(topicChannelId || channelId);
			resetCachedMessageActionNeedToResolve(topicChannelId || channelId);
			dispatch(
				emojiSuggestionActions.setSuggestionEmojiObjPicked({
					shortName: '',
					id: '',
					isReset: true
				})
			);
			DeviceEventEmitter.emit(ActionEmitEvent.SHOW_KEYBOARD, null);
		}, [onDeleteMessageActionNeedToResolve, topicChannelId, channelId, dispatch]);

		const handleKeyboardBottomSheetMode = useCallback((mode: string) => {
			setModeKeyBoardBottomSheet(mode);
			if (mode === 'emoji' || mode === 'attachment' || mode === 'advanced') {
				DeviceEventEmitter.emit(ActionEmitEvent.ON_PANEL_KEYBOARD_BOTTOM_SHEET, {
					isShow: true,
					mode
				});
			} else {
				inputRef && inputRef.current && inputRef.current.focus();
				DeviceEventEmitter.emit(ActionEmitEvent.ON_PANEL_KEYBOARD_BOTTOM_SHEET, {
					isShow: false,
					mode: mode || ''
				});
			}
		}, []);

		const handleTextInputChange = async (text: string) => {
			try {
				if (isShowOptionPaste) setIsShowOptionPaste(false);

				const store = getStore();
				if (text?.length > MIN_THRESHOLD_CHARS) {
					if (convertRef.current) {
						return;
					}
					convertRef.current = true;
					await onConvertToFiles(text);
					textValueInputRef.current = '';
					setTextChange('');
					return;
				}
				setTextChange(text);
				textValueInputRef.current = text;
				if (!text || text === '') {
					setMentionTextValue('');
				}

				if (messageAction !== EMessageActionType.CreateThread) {
					saveMessageToCache(text);
				}

				if (!text) return;

				const rawConvertedHashtag = convertMentionsToText(text);
				const convertedHashtag = convertMentionsToText(removeMarkdownTags(text));

				const words = convertedHashtag?.split?.(mentionRegexSplit);

				const mentionList: Array<{ user_id: string; s: number; e: number }> = [];
				const hashtagList: Array<{ channelid: string; s: number; e: number }> = [];

				let mentionBeforeCount = 0;
				let mentionBeforeHashtagCount = 0;
				let indexOfLastHashtag = 0;
				let indexOfLastMention = 0;
				words?.reduce?.((offset, word) => {
					if (word?.startsWith?.('@[') && word?.endsWith?.(']')) {
						mentionBeforeCount++;
						const mentionUserName = word?.slice?.(2, -1);
						const mention = listMentions?.find?.((item) => `${item?.display}` === mentionUserName);

						if (mention) {
							const startindex = convertedHashtag?.indexOf?.(word, indexOfLastMention);
							indexOfLastMention = startindex + 1;

							mentionList.push({
								user_id: mention.id?.toString() ?? '',
								s: startindex - (mentionBeforeHashtagCount * 2 + (mentionBeforeCount - 1) * 2),
								e: startindex + word.length - (mentionBeforeHashtagCount * 2 + mentionBeforeCount * 2)
							});
						}
						return offset;
					}

					if (word?.trim()?.startsWith('<#') && word?.trim()?.endsWith('>')) {
						const channelName = word?.trim();
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-expect-error
						const listChannel = selectAllChannels(store.getState() as RootState);
						const listChannelHashtagDm = selectAllChannelsByUser(store.getState() as RootState);
						const channelLabel = channelName?.slice?.(2, -1);
						const channelInfo = getChannelHashtag(listChannelHashtagDm, listChannel, mode, channelLabel);

						mentionBeforeHashtagCount++;

						if (channelInfo) {
							const startindex = convertedHashtag?.indexOf?.(channelName, indexOfLastHashtag);
							indexOfLastHashtag = startindex + 1;

							hashtagList?.push?.({
								channelid: channelInfo?.channel_id?.toString() ?? '',
								s: startindex - (mentionBeforeCount * 2 + (mentionBeforeHashtagCount - 1) * 2),
								e: startindex + channelName.length - (mentionBeforeHashtagCount * 2 + mentionBeforeCount * 2)
							});
						}
					}

					return offset;
				}, 0);

				hashtagsOnMessage.current = hashtagList;
				mentionsOnMessage.current = mentionList;
				setMentionTextValue(text);
				textValueInputRef.current = rawConvertedHashtag;
				chatMessageLeftAreaRef?.current?.setAttachControlVisibility(false);
			} catch (e) {
				/* empty */
			}
		};

		const handleMentionSelectForEphemeral = useCallback((text: string) => {
			if (text?.includes('{@}[') && text?.includes('](') && text?.includes(')')) {
				const startDisplayName = text.indexOf('{@}[') + 4;
				const endDisplayName = text.indexOf('](', startDisplayName);
				const startUserId = endDisplayName + 2;
				const endUserId = text.indexOf(')', startUserId);

				setEphemeralTargetUserInfo({
					id: text.substring(startUserId, endUserId),
					display: text.substring(startDisplayName, endDisplayName)
				});

				setTextChange('');
				setMentionTextValue('');
				textValueInputRef.current = '';
				mentionsOnMessage.current = [];
			}
		}, []);

		const handleSelectionChange = (selection: { start: number; end: number }) => {
			cursorPositionRef.current = selection.start;
		};

		const handleMessageAction = (messageAction: IMessageActionNeedToResolve) => {
			const { type, targetMessage } = messageAction;
			let dataEditMessageFormatted;
			switch (type) {
				case EMessageActionType.EditMessage:
					dataEditMessageFormatted = formatContentEditMessage(targetMessage);
					if (dataEditMessageFormatted?.emojiPicked?.length) {
						dataEditMessageFormatted?.emojiPicked?.forEach((emoji) => {
							dispatch(
								emojiSuggestionActions.setSuggestionEmojiObjPicked({
									shortName: emoji?.shortName,
									id: emoji?.emojiid
								})
							);
						});
					}
					handleTextInputChange(dataEditMessageFormatted?.formatContentDraft);
					break;
				case EMessageActionType.CreateThread:
					DeviceEventEmitter.emit(ActionEmitEvent.ON_PANEL_KEYBOARD_BOTTOM_SHEET, {
						isShow: false
					});
					dispatch(threadsActions.setOpenThreadMessageState(true));
					dispatch(threadsActions.setValueThread(targetMessage));
					timeoutRef.current = setTimeout(() => {
						navigation.navigate(APP_SCREEN.MENU_THREAD.STACK, { screen: APP_SCREEN.MENU_THREAD.CREATE_THREAD_FORM_MODAL });
					}, 500);
					break;
				default:
					break;
			}
		};

		const onConvertToFiles = useCallback(
			async (content: string) => {
				try {
					if (content?.length > MIN_THRESHOLD_CHARS) {
						const fileTxtSaved = await writeTextToFile(content);
						const session = sessionRef.current;
						const client = clientRef.current;
						const store = getStore();
						const currentDirect = selectCurrentDM(store.getState());
						const directId = currentDirect?.id;
						const channelId = directId ? directId : selectCurrentChannelId(store.getState() as any);
						if (!client || !session || !channelId) {
							return;
						}

						dispatch(
							referencesActions.setAtachmentAfterUpload({
								channelId: topicChannelId || channelId,
								files: [
									{
										filename: fileTxtSaved.name,
										url: fileTxtSaved.uri,
										filetype: fileTxtSaved.type,
										size: fileTxtSaved.size as number
									}
								]
							})
						);
					}
				} catch (e) {
					console.log('err', e);
				} finally {
					convertRef.current = false;
				}
			},
			[clientRef, dispatch, sessionRef]
		);

		const writeTextToFile = useCallback(
			async (text: string) => {
				// Define the path to the file
				const now = Date.now();
				const filename = `${now}.txt`;
				const path = `${RNFS.DocumentDirectoryPath}/${filename}`;

				// Write the text to the file
				await RNFS.writeFile(path, text, 'utf8')
					.then((success) => {
						//console.log('FILE WRITTEN!');
					})
					.catch((err) => {
						console.log(err.message);
					});

				// Read the file to get its base64 representation
				const fileData = await RNFS.readFile(path, 'base64');

				// Create the file object
				const fileFormat: IFile = {
					uri: path,
					name: filename,
					type: 'text/plain',
					size: (await RNFS.stat(path)).size.toString(),
					fileData
				};

				return fileFormat;
			},
			[dispatch]
		);

		const resetInput = () => {
			setIsFocus(false);
			inputRef.current?.blur();
			if (timeoutRef) {
				clearTimeout(timeoutRef.current);
			}
		};

		const openKeyBoard = () => {
			timeoutRef.current = setTimeout(() => {
				inputRef.current?.focus();
				setIsFocus(true);
			}, 300);
		};

		const handleInputFocus = useCallback(async () => {
			setModeKeyBoardBottomSheet('text');
			DeviceEventEmitter.emit(ActionEmitEvent.ON_PANEL_KEYBOARD_BOTTOM_SHEET, {
				isShow: false,
				mode: 'text'
			});
		}, []);

		const handleInputBlur = useCallback(() => {
			chatMessageLeftAreaRef.current?.setAttachControlVisibility(false);
			setIsShowOptionPaste(false);
			if (modeKeyBoardBottomSheet === 'text') {
				DeviceEventEmitter.emit(ActionEmitEvent.ON_PANEL_KEYBOARD_BOTTOM_SHEET, {
					isShow: false,
					mode: ''
				});
			}
		}, [modeKeyBoardBottomSheet]);

		const cancelEphemeralMode = useCallback(() => {
			setIsEphemeralMode(false);
			setEphemeralTargetUserInfo({
				id: '',
				display: ''
			});
		}, []);

		useEffect(() => {
			if (channelId) {
				setMessageFromCache();
			}
			DeviceEventEmitter.addListener(ActionEmitEvent.ON_SET_LIST_MENTION_DATA, ({ data }: { data: MentionDataProps[] }) => {
				setListMentions(data);
			});
		}, [channelId]);

		useEffect(() => {
			if (messageActionNeedToResolve !== null) {
				const { isStillShowKeyboard } = messageActionNeedToResolve;
				if (!isStillShowKeyboard) {
					resetInput();
				}
				handleMessageAction(messageActionNeedToResolve);
				openKeyBoard();
			}
		}, [messageActionNeedToResolve]);

		useEffect(() => {
			const clearTextInputListener = DeviceEventEmitter.addListener(ActionEmitEvent.CLEAR_TEXT_INPUT, () => {
				textValueInputRef.current = '';
			});
			const addEmojiPickedListener = DeviceEventEmitter.addListener(ActionEmitEvent.ADD_EMOJI_PICKED, (emoji) => {
				if (emoji?.channelId === channelId || emoji?.channelId === topicChannelId) {
					handleEventAfterEmojiPicked(emoji.shortName);
				}
			});
			return () => {
				clearTextInputListener.remove();
				addEmojiPickedListener.remove();
			};
		}, [channelId, handleEventAfterEmojiPicked, topicChannelId]);

		useEffect(() => {
			const sendActionFromAdvancedListener = DeviceEventEmitter.addListener(
				ActionEmitEvent.ON_SEND_ACTION_FROM_ADVANCED_MENU,
				(action: string) => {
					handleActionFromAdvanced(action);
				}
			);
			return () => {
				sendActionFromAdvancedListener.remove();
			};
		}, [handleActionFromAdvanced]);

		const checkClipboardForImage = useCallback(async (): Promise<boolean> => {
			try {
				if (Platform.OS === 'ios') {
					const isHasImage = await Clipboard.hasImage();
					if (!isHasImage) return false;
				}
				const imageUri = await Clipboard.getImage();
				if (imageUri?.startsWith('data:image/')) {
					const base64Data = imageUri.split(',')?.[1];
					if (base64Data?.length > 10) {
						return true;
					}
				}

				// Check if clipboard contains content:// path for images (Android)
				const clipboardText = await Clipboard.getString();
				if (
					clipboardText?.startsWith('content://') &&
					(clipboardText.includes('image') || clipboardText.includes('photo') || clipboardText.includes('media'))
				)
					return true;
			} catch (error) {
				console.error('Error checking clipboard for images:', error);
				return false;
			}
		}, []);

		const onLongPress = useCallback(async () => {
			const isHasImage = await checkClipboardForImage();
			setIsShowOptionPaste(isHasImage);
		}, [checkClipboardForImage]);

		const handlePressIn = useCallback(() => {
			isLongPressed.current = false;
			const now = Date.now();

			if (now - lastTap.current < DOUBLE_TAP_DELAY && Platform.OS === 'ios') {
				isDoublePressed.current = true;
				lastTap.current = 0;
			}

			longPressTimer.current = setTimeout(() => {
				isLongPressed.current = true;
				onLongPress();
			}, LONG_PRESS_DELAY);
		}, [onLongPress]);

		const handleDoubleTap = useCallback(async () => {
			try {
				const hasImage = await checkClipboardForImage();
				if (hasImage && Platform.OS === 'ios') {
					setIsShowOptionPaste(true);
				}
			} catch (error) {
				console.error('Error handling double tap:', error);
			}
		}, [checkClipboardForImage]);

		const onRegularPress = useCallback(() => {
			setIsShowOptionPaste(false);
		}, []);

		const handlePressOut = useCallback(() => {
			if (longPressTimer.current) {
				clearTimeout(longPressTimer.current);
				longPressTimer.current = null;
			}

			if (!isLongPressed.current) {
				onRegularPress();
			}

			if (isDoublePressed.current) {
				handleDoubleTap();
				isDoublePressed.current = false;
				lastTap.current = 0;
			} else {
				lastTap.current = Date.now();
			}

			isLongPressed.current = false;
		}, [handleDoubleTap, onRegularPress]);

		const handleSlashCommandSelect = useCallback((command: any) => {
			if (command.id === KEY_SLASH_COMMAND_EPHEMERAL) {
				setIsEphemeralMode(true);
				setTextChange('@');
				setMentionTextValue('@');
				textValueInputRef.current = '@';
				mentionsOnMessage.current = [];
			} else {
				if (command.display && command.description) {
					setTextChange(`${command.display} `);
					setMentionTextValue('');
					textValueInputRef.current = `${command.description}`;
				}
			}
		}, []);

		const onSetShowOptionPaste = useCallback((status: boolean) => {
			setIsShowOptionPaste(status);
		}, []);

		return (
			<View style={styles.container}>
				<MemoizedGradient themeValue={themeValue} />
				<View style={[styles.suggestions]}>
					<MemoizedGradient themeValue={themeValue} />
					<SuggestionsPanel
						triggers={triggers}
						listMentions={listMentions}
						isEphemeralMode={isEphemeralMode}
						channelId={channelId}
						mode={mode}
						onSelectCommand={handleSlashCommandSelect}
					/>
				</View>
				<AttachmentPreview channelId={currentChannelKey} />
				<ChatBoxListener mode={mode} />
				<View style={styles.containerInput}>
					<ChatMessageLeftArea
						ref={chatMessageLeftAreaRef}
						isAvailableSending={textChange?.length > 0}
						modeKeyBoardBottomSheet={modeKeyBoardBottomSheet}
						handleKeyboardBottomSheetMode={handleKeyboardBottomSheetMode}
						hiddenAdvanceFunc={hiddenAdvanceFunc}
					/>
					<RecordMessageProcessing />
					<View style={styles.inputWrapper}>
						{isEphemeralMode && (
							<SlashCommandMessage
								message={
									ephemeralTargetUserInfo?.display
										? t('ephemeral.headerText', { username: ephemeralTargetUserInfo?.display })
										: t('ephemeral.selectUser')
								}
								onCancel={cancelEphemeralMode}
							/>
						)}

						<View style={styles.input}>
							{isShowOptionPaste && (
								<OptionPasteTooltip
									channelId={channelId}
									topicChannelId={topicChannelId}
									onSetShowOptionPaste={onSetShowOptionPaste}
								/>
							)}

							<TextInput
								ref={inputRef}
								multiline
								onChangeText={
									mentionsOnMessage?.current?.length || hashtagsOnMessage?.current?.length
										? textInputProps?.onChangeText
										: handleTextInputChange
								}
								autoFocus={isFocus}
								placeholder={t('messageInputPlaceHolder')}
								placeholderTextColor={themeValue.textDisabled}
								onFocus={handleInputFocus}
								onBlur={handleInputBlur}
								spellCheck={false}
								numberOfLines={4}
								textBreakStrategy="simple"
								style={[styles.inputStyle, !textValueInputRef?.current && styles.inputStyleEmpty]}
								children={RenderTextContent({ text: textValueInputRef?.current })}
								onSelectionChange={textInputProps?.onSelectionChange}
								onPressIn={handlePressIn}
								onPressOut={handlePressOut}
								contextMenuHidden={isShowOptionPaste}
							/>
							<View style={styles.iconEmoji}>
								<EmojiSwitcher onChange={handleKeyboardBottomSheetMode} mode={modeKeyBoardBottomSheet} />
							</View>
							{showAnonymousIcon && (
								<View style={styles.iconAnonymous}>
									<MezonIconCDN icon={IconCDN.anonymous} color={themeValue.text} />
								</View>
							)}
						</View>
						<ChatMessageSending
							isAvailableSending={textValueInputRef?.current?.trim()?.length > 0}
							valueInputRef={textValueInputRef}
							mode={mode}
							channelId={channelId}
							messageActionNeedToResolve={messageActionNeedToResolve}
							mentionsOnMessage={mentionsOnMessage}
							hashtagsOnMessage={hashtagsOnMessage}
							emojisOnMessage={emojiList}
							linksOnMessage={linkList}
							boldsOnMessage={boldList}
							markdownsOnMessage={markdownList}
							voiceLinkRoomOnMessage={voiceLinkRoomList}
							messageAction={messageAction}
							clearInputAfterSendMessage={onSendSuccess}
							anonymousMode={anonymousMode && !currentClanPreventAnonymous}
							ephemeralTargetUserId={ephemeralTargetUserInfo?.id}
							currentTopicId={topicChannelId}
						/>
					</View>
				</View>
				<ChatBoxTyping
					textChange={textChange}
					mode={mode}
					channelId={channelId}
					anonymousMode={anonymousMode && !currentClanPreventAnonymous}
					isPublic={isPublic}
					topicChannelId={topicChannelId || ''}
				/>
			</View>
		);
	}
);
