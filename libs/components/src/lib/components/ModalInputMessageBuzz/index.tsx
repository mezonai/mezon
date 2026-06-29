import { useChatSending, useOnClickOutside } from '@mezon/core';
import type { DirectEntity } from '@mezon/store';
import { selectTheme } from '@mezon/store';
import { CHANNEL_INPUT_ID, GENERAL_INPUT_ID, MAX_LENGTH_MESSAGE_BUZZ, ThemeApp, TypeMessage, generateE2eId } from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

type ModalInputMessageBuzzProps = {
	currentChannel: DirectEntity | null;
	mode: number;
	closeBuzzModal: () => void;
};

const ModalInputMessageBuzz = ({ currentChannel, mode, closeBuzzModal }: ModalInputMessageBuzzProps) => {
	const { t } = useTranslation('messageBuzz');
	const { sendMessage } = useChatSending({ channelOrDirect: currentChannel || undefined, mode });
	const [message, setMessage] = useState('');
	const panelRef = useRef<HTMLDivElement | null>(null);
	const inputRef = useRef<HTMLInputElement | null>(null);
	const appearanceTheme = useSelector(selectTheme);

	useEffect(() => {
		inputRef.current?.focus();
	}, []);

	const handleClosePopup = useCallback(() => {
		setMessage('');
		closeBuzzModal();
	}, [closeBuzzModal]);

	const focusChatInput = useCallback(() => {
		const editor =
			mode === ChannelStreamMode.STREAM_MODE_THREAD
				? document.querySelector(`[data-e2e="${generateE2eId('discussion.box.thread')}"]`)?.querySelector<HTMLElement>(`#${CHANNEL_INPUT_ID}`)
				: document.getElementById(CHANNEL_INPUT_ID) || document.getElementById(GENERAL_INPUT_ID);
		if (!editor) return;

		editor.focus();
		if (typeof window.getSelection !== 'undefined' && typeof document.createRange !== 'undefined') {
			try {
				const range = document.createRange();
				range.selectNodeContents(editor);
				range.collapse(false);
				const sel = window.getSelection();
				sel?.removeAllRanges();
				sel?.addRange(range);
			} catch {
				// ignore
			}
		}
	}, [mode]);

	const handleSendBuzzMsg = useCallback(() => {
		const trimmedMessage = message.trim();
		if (!trimmedMessage) return;

		sendMessage({ t: trimmedMessage, ej: [] }, [], [], [], undefined, undefined, undefined, TypeMessage.MessageBuzz);
		handleClosePopup();
		requestAnimationFrame(() => {
			focusChatInput();
		});
	}, [focusChatInput, handleClosePopup, message, sendMessage]);

	const handleMessageChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
		setMessage(event.target.value);
	}, []);

	const handleMessageKeyDown = useCallback(
		(event: React.KeyboardEvent<HTMLInputElement>) => {
			if (event.key === 'Enter') {
				event.preventDefault();
				handleSendBuzzMsg();
			}
			if (event.key === 'Escape') {
				handleClosePopup();
			}
		},
		[handleClosePopup, handleSendBuzzMsg]
	);

	useOnClickOutside(panelRef, handleClosePopup);

	return (
		<div className="w-[100vw] h-[100dvh] fixed top-0 left-0 z-50 bg-black bg-opacity-80 flex justify-center items-center text-theme-primary">
			<div ref={panelRef} className="bg-theme-setting-primary p-4 rounded-lg w-[400px]">
				<div className="flex justify-between mb-4">
					<h3 className="text-lg font-bold" data-e2e={generateE2eId('chat.direct_message.message_buzz.header')}>
						{t('enterMessage')}
					</h3>
					<button
						onClick={handleClosePopup}
						className="hover:text-red-500"
						data-e2e={generateE2eId('chat.direct_message.message_buzz.button.close')}
					>
						✕
					</button>
				</div>
				<div className="flex items-start gap-2">
					<input
						type="text"
						ref={inputRef}
						value={message}
						onChange={handleMessageChange}
						onKeyDown={handleMessageKeyDown}
						maxLength={MAX_LENGTH_MESSAGE_BUZZ}
						placeholder={t('enterMessage')}
						className={`h-[42px] flex-1 min-w-0 bg-theme-input border border-theme-primary rounded-lg px-[10px] py-[8px] whitespace-nowrap overflow-x-auto overflow-y-hidden outline-none customScrollLightMode ${appearanceTheme === ThemeApp.Light ? 'lightModeScrollBarMention' : ''}`}
						data-e2e={generateE2eId('chat.direct_message.message_buzz.input.message')}
					/>
					<button
						onClick={handleSendBuzzMsg}
						className="w-[70px] flex justify-center items-center px-4 py-2 btn-primary btn-primary-hover rounded-lg"
						data-e2e={generateE2eId('chat.direct_message.message_buzz.button.send')}
					>
						{t('send')}
					</button>
				</div>
			</div>
		</div>
	);
};

export default ModalInputMessageBuzz;
