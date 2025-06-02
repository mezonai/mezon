import {
	ActionEmitEvent,
	convertMentionsToText,
	formatContentEditMessage,
	getChannelHashtag,
	load,
	mentionRegexSplit,
	save,
	STORAGE_KEY_TEMPORARY_INPUT_MESSAGES
} from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import {
	emojiSuggestionActions,
	messagesActions,
	referencesActions,
	selectAnonymousMode,
	selectCurrentChannelId,
	selectCurrentDM,
	selectMemberClanByUserId2
} from '@mezon/store';
import {
	getStore,
	RootState,
	selectAllAccount,
	selectAllChannels,
	selectAllHashtagDm,
	selectCurrentClanId,
	threadsActions,
	useAppDispatch,
	useAppSelector
} from '@mezon/store-mobile';
import { useMezon } from '@mezon/transport';
import { IHashtagOnMessage, IMentionOnMessage, MentionDataProps, MIN_THRESHOLD_CHARS, sleep } from '@mezon/utils';
import { useNavigation } from '@react-navigation/native';
import { ChannelStreamMode } from 'mezon-js';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, TextInput, View } from 'react-native';
import RNFS from 'react-native-fs';
import { useThrottledCallback } from 'use-debounce';
import { EmojiSuggestion, HashtagSuggestions, Suggestions } from '../../../../../../components/Suggestions';
import MezonIconCDN from '../../../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../../constants/icon_cdn';
import { APP_SCREEN } from '../../../../../../navigation/ScreenTypes';
import { resetCachedMessageActionNeedToResolve } from '../../../../../../utils/helpers';
import { EMessageActionType } from '../../../enums';
import { IMessageActionNeedToResolve } from '../../../types';
import AttachmentPreview from '../../AttachmentPreview';
import { IModeKeyboardPicker } from '../../BottomKeyboardPicker';
import EmojiSwitcher from '../../EmojiPicker/EmojiSwitcher';
import { renderTextContent } from '../../RenderTextContent';
import { ChatBoxListener } from '../ChatBoxListener';
import { ChatMessageLeftArea } from '../ChatMessageLeftArea';
import { ChatMessageSending } from '../ChatMessageSending';
import { style } from './style';
import useProcessedContent from './useProcessedContent';

interface IChatMessageInputProps {
	messageActionNeedToResolve: IMessageActionNeedToResolve | null;
	onDeleteMessageActionNeedToResolve?: () => void;
	channelId: string;
	mode: ChannelStreamMode;
	hiddenIcon?: {
		threadIcon?: boolean;
	};
	messageAction?: EMessageActionType;
	onShowKeyboardBottomSheet?: (isShow: boolean, type?: string) => void;
	isPublic?: boolean;
}

const MentionTextInput = ({
	channelId,
	mode,
	messageActionNeedToResolve,
	messageAction,
	onShowKeyboardBottomSheet,
	isPublic,
	onDeleteMessageActionNeedToResolve,
	hiddenIcon
}: IChatMessageInputProps) => {
	const { t } = useTranslation('message');
	const { sessionRef, clientRef } = useMezon();
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const dispatch = useAppDispatch();
	const navigation = useNavigation<any>();
	const anonymousMode = useAppSelector(selectAnonymousMode);
	const currentClanId = useAppSelector(selectCurrentClanId);
	const userProfile = useAppSelector(selectAllAccount);
	const userClanProfile = useAppSelector((state) => selectMemberClanByUserId2(state, userProfile?.user?.id));

	const [cursorPosition, setCursorPosition] = useState(0);
	const [suggestionType, setSuggestionType] = useState(null);
	const [suggestionKeyword, setSuggestionKeyword] = useState('');
	const [listMentions, setListMentions] = useState<MentionDataProps[]>([]);
	const [modeKeyBoardBottomSheet, setModeKeyBoardBottomSheet] = useState<IModeKeyboardPicker>('text');
	const [isShowAttachControl, setIsShowAttachControl] = useState<boolean>(false);
	const [isFocus, setIsFocus] = useState<boolean>(false);

	const inputRef = useRef<TextInput>(null);
	const textRef = useRef<string>('');
	const mentionsOnMessage = useRef<IMentionOnMessage[]>([]);
	const hashtagsOnMessage = useRef<IHashtagOnMessage[]>([]);
	const { emojiList, linkList, markdownList, voiceLinkRoomList, boldList } = useProcessedContent(textRef.current);

	const findTriggerInfo = (text: string, cursorPos: number) => {
		let triggerIndex = -1;
		let triggerChar = null;

		for (let i = cursorPos - 1; i >= 0; i--) {
			const char = text[i];
			if (char === '@' || char === ':' || char === '#') {
				const afterTrigger = text.substring(i + 1, cursorPos);
				if (!afterTrigger.includes(' ') && !afterTrigger.includes('\n')) {
					triggerIndex = i;
					triggerChar = char;
					break;
				}
			} else if (char === ' ' || char === '\n') {
				break;
			}
		}

		if (triggerIndex === -1) return null;

		const query = text.substring(triggerIndex + 1, cursorPos);
		return { triggerIndex, triggerChar, query };
	};

	const handleTyping = useCallback(async () => {
		if (anonymousMode) return;
		dispatch(
			messagesActions.sendTypingUser({
				clanId: currentClanId || '',
				channelId,
				mode,
				isPublic,
				username: userClanProfile?.clan_nick || userProfile?.user?.display_name || userProfile?.user?.username
			})
		);
	}, [
		anonymousMode,
		channelId,
		currentClanId,
		dispatch,
		isPublic,
		mode,
		userClanProfile?.clan_nick,
		userProfile?.user?.display_name,
		userProfile?.user?.username
	]);

	const handleTypingDebounced = useThrottledCallback(handleTyping, 1000);

	const handleDirectMessageTyping = useCallback(async () => {
		await Promise.all([
			dispatch(
				messagesActions.sendTypingUser({
					clanId: '0',
					channelId: channelId,
					mode: mode,
					isPublic: false,
					username: userProfile?.user?.display_name || userProfile?.user?.username
				})
			)
		]);
	}, [channelId, dispatch, mode, userProfile?.user?.display_name, userProfile?.user?.username]);

	const handleDirectMessageTypingDebounced = useThrottledCallback(handleDirectMessageTyping, 1000);

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

	const handleTriggerInfo = (text: string, cursorPos: number) => {
		const triggerInfo = findTriggerInfo(text, cursorPos);
		if (triggerInfo) {
			const { triggerChar, query } = triggerInfo;
			setSuggestionKeyword(query);
			setSuggestionType(triggerChar);
		} else {
			setSuggestionType(null);
			setSuggestionKeyword('');
		}
	};

	const saveMessageToCache = (text: string) => {
		const allCachedMessage = load(STORAGE_KEY_TEMPORARY_INPUT_MESSAGES) || {};
		save(STORAGE_KEY_TEMPORARY_INPUT_MESSAGES, {
			...allCachedMessage,
			[channelId]: text
		});
	};

	const handleTextChange = async (newText: string) => {
		textRef.current = newText;
		console.log('log  => newText', newText);
		handleTriggerInfo(newText, cursorPosition);

		if (messageAction !== EMessageActionType.CreateThread) {
			saveMessageToCache(newText);
		}
		if (!newText) return;

		if (newText?.length >= MIN_THRESHOLD_CHARS) {
			textRef.current = 'converting to file txt...';
			await onConvertToFiles(newText);
			textRef.current = 'converted';
			return;
		}
		const store = getStore();

		const convertedHashtag = convertMentionsToText(newText);
		console.log('log  => convertedHashtag', convertedHashtag);
		const words = newText?.split?.(mentionRegexSplit);

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
					const startindex = newText?.indexOf?.(word, indexOfLastMention);
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
				const listHashtagDm = selectAllHashtagDm(store.getState() as RootState);
				const channelLabel = channelName?.slice?.(2, -1);
				const channelInfo = getChannelHashtag(listHashtagDm, listChannel, mode, channelLabel);

				mentionBeforeHashtagCount++;

				if (channelInfo) {
					const startindex = newText?.indexOf?.(channelName, indexOfLastHashtag);
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
		textRef.current = convertedHashtag;
		setIsShowAttachControl(false);
		await handleTypingMessage();
	};

	const insertSuggestion = useCallback(
		(suggestion: any) => {
			const triggerInfo = findTriggerInfo(textRef?.current, cursorPosition);
			if (!triggerInfo) return;

			const { triggerIndex, triggerChar } = triggerInfo;
			let insertText = '';
			switch (triggerChar) {
				case '@':
					insertText = `@[${suggestion?.display || suggestion?.username}] `;
					break;
				case ':':
					insertText = `${suggestion.name} `;
					break;
				case '#':
					insertText = `<#${suggestion?.name || suggestion?.channel_label}> `;
					break;
			}

			const beforeTrigger = textRef?.current?.substring(0, triggerIndex);
			const afterCursor = textRef?.current?.substring(cursorPosition);
			const newText = beforeTrigger + insertText + afterCursor;
			handleTextChange(newText);

			setTimeout(() => {
				const newCursorPos = triggerIndex + insertText.length;
				inputRef.current?.focus();
				inputRef.current?.setNativeProps({
					selection: { start: newCursorPos, end: newCursorPos }
				});
				setCursorPosition(newCursorPos);
			}, 10);
		},
		[cursorPosition]
	);

	const handleInputFocus = () => {
		setModeKeyBoardBottomSheet('text');
		inputRef && inputRef?.current && inputRef.current?.focus();
		onShowKeyboardBottomSheet(false);
	};

	const handleInputBlur = () => {
		setIsShowAttachControl(false);
		if (modeKeyBoardBottomSheet === 'text') {
			onShowKeyboardBottomSheet(false);
		}
	};

	const resetCachedText = useCallback(async () => {
		const allCachedMessage = load(STORAGE_KEY_TEMPORARY_INPUT_MESSAGES) || {};
		if (allCachedMessage?.[channelId]) allCachedMessage[channelId] = '';

		save(STORAGE_KEY_TEMPORARY_INPUT_MESSAGES, allCachedMessage);
	}, [channelId]);

	const onSendSuccess = useCallback(() => {
		textRef.current = '';
		mentionsOnMessage.current = [];
		hashtagsOnMessage.current = [];
		onDeleteMessageActionNeedToResolve();
		resetCachedText();
		resetCachedMessageActionNeedToResolve(channelId);
		dispatch(
			emojiSuggestionActions.setSuggestionEmojiObjPicked({
				shortName: '',
				id: '',
				isReset: true
			})
		);
	}, [dispatch, onDeleteMessageActionNeedToResolve, resetCachedText, channelId]);

	const clearInputAfterSendMessage = useCallback(() => {
		onSendSuccess();
		textRef.current = '';
	}, [onSendSuccess, textRef]);

	const resetInput = () => {
		setIsFocus(false);
		inputRef.current?.blur();
	};

	const openKeyBoard = async () => {
		await sleep(300);
		inputRef.current?.focus();
		setIsFocus(true);
	};

	const handleMessageAction = async (messageAction: IMessageActionNeedToResolve) => {
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
				handleTextChange(dataEditMessageFormatted?.formatContentDraft);
				break;
			case EMessageActionType.CreateThread:
				dispatch(threadsActions.setOpenThreadMessageState(true));
				dispatch(threadsActions.setValueThread(targetMessage));
				await sleep(500);
				navigation.navigate(APP_SCREEN.MENU_THREAD.STACK, { screen: APP_SCREEN.MENU_THREAD.CREATE_THREAD_FORM_MODAL });
				break;
			default:
				break;
		}
	};

	const onConvertToFiles = useCallback(
		async (content: string) => {
			try {
				if (content?.length >= MIN_THRESHOLD_CHARS) {
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
							channelId,
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
				console.error('err', e);
			}
		},
		[clientRef, dispatch, sessionRef]
	);

	const writeTextToFile = async (text: string) => {
		// Define the path to the file
		const now = Date.now();
		const filename = now + '.txt';
		const path = RNFS.DocumentDirectoryPath + `/${filename}`;

		// Write the text to the file
		await RNFS.writeFile(path, text, 'utf8')
			.then((success) => {
				//console.log('FILE WRITTEN!');
			})
			.catch((err) => {
				console.error(err.message);
			});

		// Read the file to get its base64 representation
		const fileData = await RNFS.readFile(path, 'base64');

		// Create the file object
		const fileFormat: IFile = {
			uri: path,
			name: filename,
			type: 'text/plain',
			size: (await RNFS.stat(path)).size.toString(),
			fileData: fileData
		};

		return fileFormat;
	};

	const handleKeyboardBottomSheetMode = useCallback(
		(mode: IModeKeyboardPicker) => {
			setModeKeyBoardBottomSheet(mode);
			if (mode === 'emoji' || mode === 'attachment') {
				onShowKeyboardBottomSheet(true, mode);
			} else {
				inputRef && inputRef.current && inputRef.current.focus();
				onShowKeyboardBottomSheet(false);
			}
		},
		[onShowKeyboardBottomSheet]
	);
	const setMessageFromCache = async () => {
		const allCachedMessage = load(STORAGE_KEY_TEMPORARY_INPUT_MESSAGES) || {};
		textRef.current = convertMentionsToText(allCachedMessage?.[channelId] || '');
		await handleTextChange(allCachedMessage?.[channelId] || '');
	};

	const handleEventAfterEmojiPicked = async (shortName: string) => {
		let textFormat;
		if (!textRef?.current.length) {
			textFormat = shortName?.toString();
		} else {
			textFormat = `${textRef?.current?.endsWith(' ') ? textRef?.current : textRef?.current + ' '}${shortName?.toString()}`;
		}
		await handleTextChange(textFormat + ' ');
	};

	useEffect(() => {
		if (channelId) {
			setMessageFromCache();
		}
		const clearTextInputListener = DeviceEventEmitter.addListener(ActionEmitEvent.CLEAR_TEXT_INPUT, () => {
			textRef.current = '';
		});
		const addEmojiPickedListener = DeviceEventEmitter.addListener(ActionEmitEvent.ADD_EMOJI_PICKED, (emoji) => {
			if (emoji?.channelId === channelId) {
				handleEventAfterEmojiPicked(emoji.shortName);
			}
		});
		return () => {
			clearTextInputListener.remove();
			addEmojiPickedListener.remove();
		};
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
		const eventDataMention = DeviceEventEmitter.addListener(
			ActionEmitEvent.ON_SET_LIST_MENTION_DATA,
			({ data }: { data: MentionDataProps[] }) => {
				setListMentions(data);
			}
		);
		return () => {
			eventDataMention.remove();
		};
	}, []);

	return (
		<View
			style={{
				paddingHorizontal: size.s_2
			}}
		>
			<AttachmentPreview channelId={channelId} />
			<ChatBoxListener mode={mode} />
			<View style={[styles.suggestions, { borderTopWidth: ['#', '@', ':']?.includes?.(suggestionType) ? 1 : 0 }]}>
				{suggestionType === '@' && <Suggestions keyword={suggestionKeyword} onSelect={insertSuggestion} listMentions={listMentions} />}
				{suggestionType === '#' && <HashtagSuggestions keyword={suggestionKeyword} mode={mode} onSelect={insertSuggestion} />}
				{suggestionType === ':' && <EmojiSuggestion keyword={suggestionKeyword} onSelect={insertSuggestion} />}
			</View>
			<View
				style={{
					flexDirection: 'row',
					justifyContent: 'space-between',
					alignItems: 'center',
					paddingBottom: size.s_20,
					paddingTop: size.s_10,
					paddingLeft: size.s_4
				}}
			>
				<ChatMessageLeftArea
					setIsShowAttachControl={setIsShowAttachControl}
					isShowAttachControl={isShowAttachControl}
					isAvailableSending={textRef?.current?.length > 0 && textRef?.current?.trim()?.length > 0}
					isShowCreateThread={!hiddenIcon?.threadIcon}
					modeKeyBoardBottomSheet={modeKeyBoardBottomSheet}
					handleKeyboardBottomSheetMode={handleKeyboardBottomSheetMode}
				/>
				<View style={styles.inputWrapper}>
					<View style={styles.input}>
						<TextInput
							ref={inputRef}
							multiline
							onChangeText={handleTextChange}
							autoFocus={isFocus}
							placeholder={t('messageInputPlaceHolder')}
							placeholderTextColor={themeValue.textDisabled}
							onFocus={handleInputFocus}
							onBlur={handleInputBlur}
							spellCheck={false}
							numberOfLines={4}
							textBreakStrategy="simple"
							// value={textRef?.current}
							style={[styles.inputStyle]}
							children={renderTextContent(textRef?.current)}
							onSelectionChange={(e) => {
								const pos = e.nativeEvent.selection.start;
								setCursorPosition(pos);
								handleTriggerInfo(textRef?.current, pos);
							}}
						/>
						<View style={styles.iconEmoji}>
							<EmojiSwitcher onChange={handleKeyboardBottomSheetMode} mode={modeKeyBoardBottomSheet} />
						</View>
						{mode !== ChannelStreamMode.STREAM_MODE_DM && mode !== ChannelStreamMode.STREAM_MODE_GROUP && anonymousMode && (
							<View style={styles.iconAnonymous}>
								<MezonIconCDN icon={IconCDN.anonymous} color={themeValue.text} />
							</View>
						)}
					</View>
					<ChatMessageSending
						isAvailableSending={textRef?.current?.length > 0 && textRef?.current?.trim()?.length > 0}
						valueInputRef={textRef}
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
						clearInputAfterSendMessage={clearInputAfterSendMessage}
						anonymousMode={anonymousMode}
					/>
				</View>
			</View>
		</View>
	);
};

export default MentionTextInput;
