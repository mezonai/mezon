import { useChatSending, useEmojiSuggestionContext, useOnClickOutside } from '@mezon/core';
import type { DirectEntity } from '@mezon/store';
import { selectTheme } from '@mezon/store';
import { Icons } from '@mezon/ui';
import type { IEmojiOnMessage, RequestInput } from '@mezon/utils';
import { EmojiPlaces, MAX_LENGTH_MESSAGE_BUZZ, ThemeApp, TypeMessage, generateE2eId } from '@mezon/utils';
import type { ApiChannelDescription } from 'mezon-js/api.gen';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { OnChangeHandlerFunc } from 'react-mentions';
import { Mention, MentionsInput } from 'react-mentions';
import { useSelector } from 'react-redux';
import { CustomModalMentions, GifStickerEmojiPopup, SuggestItem } from '../../components';
import lightMentionsInputStyle from './LightRmentionInputStyle';
import darkMentionsInputStyle from './RmentionInputStyle';

type ModalInputMessageBuzzProps = {
	currentChannel: DirectEntity | null;
	mode: number;
	closeBuzzModal: () => void;
};

const ModalInputMessageBuzz: React.FC<ModalInputMessageBuzzProps> = ({ currentChannel, mode, closeBuzzModal }) => {
	const { sendMessage } = useChatSending({ channelOrDirect: currentChannel || undefined, mode });
	const [inputRequest, setInputRequest] = useState<RequestInput>({ content: '', mentionRaw: [], valueTextInput: '' });
	const panelRef = useRef(null);
	const textareaRef = useRef<HTMLTextAreaElement | null>(null);
	const emojiRef = useRef<HTMLDivElement | null>(null);
	const appearanceTheme = useSelector(selectTheme);
	const [isShowEmojiPanel, setIsShowEmojiPanel] = useState(false);

	const [mentionPosition, setMentionPosition] = useState<{ top: number; left: number }>({
		top: 0,
		left: 0
	});

	useEffect(() => {
		if (textareaRef.current) {
			const rect = textareaRef.current.getBoundingClientRect();
			setMentionPosition({ top: rect.top + window.scrollY, left: rect.left + window.scrollX });
		}
	}, [textareaRef.current]);

	const toggleEmojiPanel = () => {
		setIsShowEmojiPanel(!isShowEmojiPanel);
	};

	useEffect(() => {
		if (textareaRef.current) {
			textareaRef.current.focus();
		}
	}, []);

	const handleClosePopup = useCallback(() => {
		closeBuzzModal();
		setInputRequest({ content: '', mentionRaw: [], valueTextInput: '' });
	}, [setInputRequest, closeBuzzModal]);

	const { emojis } = useEmojiSuggestionContext();
	const queryEmojis = (query: string, callback: (data: any[]) => void) => {
		if (query.length === 0) return;
		const matches = emojis
			.filter((emoji) => emoji.shortname && emoji.shortname.indexOf(query.toLowerCase()) > -1)
			.slice(0, 20)
			.map((emojiDisplay) => ({ id: emojiDisplay?.id, display: emojiDisplay?.shortname }));
		callback(matches);
	};

	const handleChange: OnChangeHandlerFunc = (event, newValue, newPlainTextValue, mentions) => {
		const newRequest: RequestInput = { content: newPlainTextValue, mentionRaw: mentions, valueTextInput: newValue };
		setInputRequest({ ...newRequest });
	};

	const handleSendBuzzMsg = useCallback(() => {
		const emojiArr: IEmojiOnMessage[] = [];
		inputRequest.mentionRaw?.forEach((item) => {
			const emoji: IEmojiOnMessage = {
				emojiid: item.id,
				s: item.plainTextIndex,
				e: item.plainTextIndex + item.display.length
			};
			emojiArr.push(emoji);
		});
		if (inputRequest.content.trim()) {
			sendMessage({ t: inputRequest.content.trim(), ej: emojiArr }, [], [], [], undefined, undefined, undefined, TypeMessage.MessageBuzz);
			handleClosePopup();
		}
	}, [handleClosePopup, inputRequest.content, inputRequest.mentionRaw, sendMessage]);

	useOnClickOutside(panelRef, handleClosePopup);
	useOnClickOutside(emojiRef, toggleEmojiPanel);

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter') {
			handleSendBuzzMsg();
		} else if (e.key === 'Escape') {
			handleClosePopup();
		}
	};

	return (
		<div
			tabIndex={-1}
			onKeyDown={handleKeyDown}
			className="w-[100vw] h-[100dvh] fixed top-0 left-0 z-50 bg-black bg-opacity-80 flex justify-center items-center text-theme-primary"
		>
			{isShowEmojiPanel && (
				<div
					onClick={(e) => {
						e.stopPropagation();
					}}
					className={`right-[2px] absolute z-10`}
					style={{
						top: `calc(${mentionPosition.top}px - 250px)`,
						left: `calc(${mentionPosition.left}px + 290px)`
					}}
					onMouseDown={(e) => {
						e.stopPropagation();
					}}
				>
					<GifStickerEmojiPopup
						channelOrDirect={currentChannel as ApiChannelDescription}
						emojiAction={EmojiPlaces.EMOJI_EDITOR_BUZZ}
						mode={mode}
						buzzInputRequest={inputRequest}
						setBuzzInputRequest={setInputRequest}
						toggleEmojiPanel={toggleEmojiPanel}
					/>
				</div>
			)}

			<div ref={panelRef} className="bg-theme-setting-primary p-4 rounded-lg w-[400px]">
				<div className="flex justify-between mb-4">
					<h3 className="text-lg font-bold " data-e2e={generateE2eId('chat.direct_message.message_buzz.header')}>
						Enter your message buzz
					</h3>
					<button
						onClick={handleClosePopup}
						className=" hover:text-red-500"
						data-e2e={generateE2eId('chat.direct_message.message_buzz.button.close')}
					>
						✕
					</button>
				</div>
				<div className="flex items-center gap-2 relative">
					<div onClick={toggleEmojiPanel} className="w-fit absolute z-[1] right-[90px] top-[14px] cursor-pointer">
						<Icons.Smile defaultSize="w-5 h-5" />
					</div>
					<MentionsInput
						inputRef={textareaRef}
						value={inputRequest.valueTextInput ?? '{}'}
						className={`w-[calc(100%_-_70px)] bg-theme-input border-theme-primary rounded-lg p-[10px]  customScrollLightMode ${appearanceTheme === ThemeApp.Light && 'lightModeScrollBarMention'}`}
						onChange={handleChange}
						forceSuggestionsAboveCursor={true}
						style={appearanceTheme === ThemeApp.Light ? lightMentionsInputStyle : darkMentionsInputStyle}
						customSuggestionsContainer={(children: React.ReactNode) => {
							return <CustomModalMentions children={children} titleModalMention={'Emoji matching'} />;
						}}
						maxLength={MAX_LENGTH_MESSAGE_BUZZ}
						data-e2e={generateE2eId('chat.direct_message.message_buzz.input.message')}
					>
						<Mention
							trigger=":"
							markup="::[__display__](__id__)"
							data={queryEmojis}
							displayTransform={(id: any, display: any) => {
								return `${display}`;
							}}
							renderSuggestion={(suggestion) => {
								return (
									<SuggestItem
										display={suggestion.display ?? ''}
										symbol={(suggestion as any).emoji}
										emojiId={suggestion.id as string}
									/>
								);
							}}
							className=""
							appendSpaceOnAdd={true}
						/>
					</MentionsInput>
					<button
						onClick={handleSendBuzzMsg}
						className="w-[70px] flex justify-center items-center px-4 py-2 btn-primary btn-primary-hover rounded-lg "
						data-e2e={generateE2eId('chat.direct_message.message_buzz.button.send')}
					>
						Send
					</button>
				</div>
			</div>
		</div>
	);
};

export default ModalInputMessageBuzz;
