/* eslint-disable no-console */
import {
	ActionEmitEvent,
	STORAGE_KEY_TEMPORARY_INPUT_MESSAGES,
	convertMentionsToText,
	formatContentEditMessage,
	getChannelHashtag,
	load,
	mentionRegexSplit,
	save
} from '@mezon/mobile-components';
import { Colors, size } from '@mezon/mobile-ui';
import {
	RootState,
	appActions,
	emojiSuggestionActions,
	getStore,
	referencesActions,
	selectAllChannels,
	selectAllHashtagDm,
	selectCurrentChannelId,
	selectCurrentDM,
	threadsActions,
	useAppDispatch
} from '@mezon/store-mobile';
import { IHashtagOnMessage, IMentionOnMessage, MIN_THRESHOLD_CHARS, MentionDataProps } from '@mezon/utils';
import { useNavigation } from '@react-navigation/native';
// eslint-disable-next-line
import { useMezon } from '@mezon/transport';
import { ChannelStreamMode } from 'mezon-js';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DeviceEventEmitter, TextInput, View } from 'react-native';
import { TriggersConfig, useMentions } from 'react-native-controlled-mentions';
import RNFS from 'react-native-fs';
import { EmojiSuggestion, HashtagSuggestions, Suggestions } from '../../../../../../components/Suggestions';
import { APP_SCREEN } from '../../../../../../navigation/ScreenTypes';
import { resetCachedMessageActionNeedToResolve } from '../../../../../../utils/helpers';
import { EMessageActionType } from '../../../enums';
import { IMessageActionNeedToResolve } from '../../../types';
import AttachmentPreview from '../../AttachmentPreview';
import { IModeKeyboardPicker } from '../../BottomKeyboardPicker';
import { ChatBoxListener } from '../ChatBoxListener';
import { ChatMessageInput } from '../ChatMessageInput';
import { ChatMessageLeftArea } from '../ChatMessageLeftArea';
import useProcessedContent from './useProcessedContent';

export const triggersConfig: TriggersConfig<'mention' | 'hashtag' | 'emoji'> = {
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
			color: Colors.white
		}
	},
	emoji: {
		trigger: ':',
		allowedSpacesCount: 0,
		isInsertSpaceAfterMention: true
	}
};

interface IChatInputProps {
	mode: ChannelStreamMode;
	channelId: string;
	hiddenIcon?: {
		threadIcon?: boolean;
	};
	messageActionNeedToResolve: IMessageActionNeedToResolve | null;
	messageAction?: EMessageActionType;
	onDeleteMessageActionNeedToResolve?: () => void;
	onShowKeyboardBottomSheet?: (isShow: boolean, type?: string) => void;
	isPublic: boolean;
}

// function useIdleRender() {
// 	const [shouldRender, setShouldRender] = useState(false);
//
// 	useEffect(() => {
// 		const handle = requestIdleCallback(() => {
// 			setShouldRender(true);
// 		});
//
// 		return () => cancelIdleCallback(handle);
// 	}, []);
//
// 	return shouldRender;
// }

export const ChatBoxBottomBar = memo(
	({
		mode = 2,
		channelId = '',
		hiddenIcon,
		messageActionNeedToResolve,
		messageAction,
		onDeleteMessageActionNeedToResolve,
		onShowKeyboardBottomSheet,
		isPublic = false
	}: IChatInputProps) => {
		const dispatch = useAppDispatch();
		const [text, setText] = useState<string>('');
		const [mentionTextValue, setMentionTextValue] = useState('');
		const [listMentions, setListMentions] = useState<MentionDataProps[]>([]);
		const [isShowAttachControl, setIsShowAttachControl] = useState<boolean>(false);
		const [isFocus, setIsFocus] = useState<boolean>(false);
		const [modeKeyBoardBottomSheet, setModeKeyBoardBottomSheet] = useState<IModeKeyboardPicker>('text');

		const navigation = useNavigation<any>();
		const inputRef = useRef<TextInput>();
		const cursorPositionRef = useRef(0);
		const currentTextInput = useRef('');
		const convertRef = useRef(false);
		const { sessionRef, clientRef } = useMezon();
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

		const [textChange, setTextChange] = useState<string>('');

		const isAvailableSending = useMemo(() => {
			return text?.length > 0 && text?.trim()?.length > 0;
		}, [text]);

		const inputTriggersConfig = useMemo(() => {
			const isDM = [ChannelStreamMode.STREAM_MODE_GROUP].includes(mode);

			if (isDM) {
				const newTriggersConfig = { ...triggersConfig };
				delete newTriggersConfig.hashtag;
				return newTriggersConfig;
			}
			return triggersConfig;
		}, [mode]);

		const { textInputProps, triggers } = useMentions({
			value: mentionTextValue,
			onChange: (newValue) => handleTextInputChange(newValue),
			onSelectionChange: (position) => {
				handleSelectionChange(position);
			},
			triggersConfig: inputTriggersConfig
		});
		const { emojiList, linkList, markdownList, voiceLinkRoomList, boldList } = useProcessedContent(text);

		const timeoutRef = useRef<NodeJS.Timeout | null>(null);
		const mentionsOnMessage = useRef<IMentionOnMessage[]>([]);
		const hashtagsOnMessage = useRef<IHashtagOnMessage[]>([]);

		const saveMessageToCache = (text: string) => {
			const allCachedMessage = load(STORAGE_KEY_TEMPORARY_INPUT_MESSAGES) || {};
			save(STORAGE_KEY_TEMPORARY_INPUT_MESSAGES, {
				...allCachedMessage,
				[channelId]: text
			});
		};

		const setMessageFromCache = async () => {
			const allCachedMessage = load(STORAGE_KEY_TEMPORARY_INPUT_MESSAGES) || {};
			handleTextInputChange(allCachedMessage?.[channelId] || '');
			setText(convertMentionsToText(allCachedMessage?.[channelId] || ''));
		};

		const resetCachedText = useCallback(async () => {
			const allCachedMessage = load(STORAGE_KEY_TEMPORARY_INPUT_MESSAGES) || {};
			if (allCachedMessage?.[channelId]) allCachedMessage[channelId] = '';

			save(STORAGE_KEY_TEMPORARY_INPUT_MESSAGES, allCachedMessage);
		}, [channelId]);

		useEffect(() => {
			if (channelId) {
				setMessageFromCache();
			}
		}, [channelId]);

		const handleEventAfterEmojiPicked = useCallback(
			async (shortName: string) => {
				let textFormat;
				if (!text.length && !textChange.length) {
					textFormat = shortName?.toString();
				} else {
					textFormat = `${textChange?.endsWith(' ') ? textChange : textChange + ' '}${shortName?.toString()}`;
				}
				setTextChange(textFormat);
				await handleTextInputChange(textFormat);
			},
			[textChange]
		);

		const onSendSuccess = useCallback(() => {
			setText('');
			setTextChange('');
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
		const handleTextInputChange = async (text: string) => {
			const store = getStore();
			setTextChange(text);
			setText(text);
			if (!text || text === '') {
				setMentionTextValue('');
			}

			if (messageAction !== EMessageActionType.CreateThread) {
				saveMessageToCache(text);
			}
			if (!text) return;

			if (text?.length > MIN_THRESHOLD_CHARS) {
				if (convertRef.current) {
					return;
				}
				dispatch(appActions.setLoadingMainMobile(true));
				convertRef.current = true;
				currentTextInput.current = '';
				await onConvertToFiles(text);
				setText('converted');
				dispatch(appActions.setLoadingMainMobile(false));
				return;
			}

			const convertedHashtag = convertMentionsToText(text);
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
					const listHashtagDm = selectAllHashtagDm(store.getState() as RootState);
					const channelLabel = channelName?.slice?.(2, -1);
					const channelInfo = getChannelHashtag(listHashtagDm, listChannel, mode, channelLabel);

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
			setText(convertedHashtag);
			setIsShowAttachControl(false);
		};

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

		const handleInsertMentionTextInput = async (mentionMessage) => {
			const cursorPosition = cursorPositionRef?.current;
			const inputValue = currentTextInput?.current;
			if (!mentionMessage?.display) return;
			const textMentions = `@${mentionMessage?.display} `;
			const textArray = inputValue?.split?.('');
			textArray.splice(cursorPosition, 0, textMentions);
			const textConverted = textArray.join('');
			setText(textConverted);
			setMentionTextValue(textConverted);
		};

		const onAddMentionMessageAction = useCallback(
			async (data: MentionDataProps[]) => {
				const mention = data?.find((mention) => {
					return mention.id === messageActionNeedToResolve?.targetMessage?.sender_id;
				});
				await handleInsertMentionTextInput(mention);
				onDeleteMessageActionNeedToResolve();
				openKeyBoard();
			},
			[messageActionNeedToResolve?.targetMessage?.sender_id, onDeleteMessageActionNeedToResolve]
		);

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
				const filename = now + '.txt';
				const path = RNFS.DocumentDirectoryPath + `/${filename}`;

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
					fileData: fileData
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
				setText('');
			});
			const addEmojiPickedListener = DeviceEventEmitter.addListener(ActionEmitEvent.ADD_EMOJI_PICKED, (emoji) => {
				handleEventAfterEmojiPicked(emoji.shortName);
			});
			return () => {
				clearTextInputListener.remove();
				addEmojiPickedListener.remove();
			};
		}, [handleEventAfterEmojiPicked]);

		return (
			<View
				style={{
					paddingHorizontal: size.s_2
				}}
			>
				{triggers?.mention?.keyword !== undefined && (
					<Suggestions
						{...triggers.mention}
						messageActionNeedToResolve={messageActionNeedToResolve}
						onAddMentionMessageAction={onAddMentionMessageAction}
						listMentions={listMentions}
					/>
				)}
				{triggers?.hashtag?.keyword !== undefined && <HashtagSuggestions directMessageId={channelId} mode={mode} {...triggers.hashtag} />}
				{triggers?.emoji?.keyword !== undefined && <EmojiSuggestion {...triggers.emoji} />}
				<AttachmentPreview channelId={channelId} />
				<ChatBoxListener mode={mode} />
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
						isShowAttachControl={isShowAttachControl}
						setIsShowAttachControl={setIsShowAttachControl}
						isAvailableSending={isAvailableSending}
						isShowCreateThread={!hiddenIcon?.threadIcon}
						modeKeyBoardBottomSheet={modeKeyBoardBottomSheet}
						handleKeyboardBottomSheetMode={handleKeyboardBottomSheetMode}
					/>

					<ChatMessageInput
						channelId={channelId}
						mode={mode}
						isFocus={isFocus}
						isShowAttachControl={isShowAttachControl}
						text={text}
						textInputProps={textInputProps}
						ref={inputRef}
						messageAction={messageAction}
						messageActionNeedToResolve={messageActionNeedToResolve}
						modeKeyBoardBottomSheet={modeKeyBoardBottomSheet}
						onSendSuccess={onSendSuccess}
						handleKeyboardBottomSheetMode={handleKeyboardBottomSheetMode}
						setIsShowAttachControl={setIsShowAttachControl}
						onShowKeyboardBottomSheet={onShowKeyboardBottomSheet}
						setModeKeyBoardBottomSheet={setModeKeyBoardBottomSheet}
						mentionsOnMessage={mentionsOnMessage}
						hashtagsOnMessage={hashtagsOnMessage}
						emojisOnMessage={emojiList}
						linksOnMessage={linkList}
						boldsOnMessage={boldList}
						markdownsOnMessage={markdownList}
						voiceLinkRoomOnMessage={voiceLinkRoomList}
						isShowCreateThread={!hiddenIcon?.threadIcon}
						isPublic={isPublic}
					/>
				</View>
			</View>
		);
	}
);
