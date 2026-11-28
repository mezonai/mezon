import { selectComposeInputByChannelId, selectLastMessageByChannelId, useAppSelector } from '@mezon/store';
import { CHANNEL_INPUT_ID, type RequestInput } from '@mezon/utils';
import { useEffect, useState } from 'react';
import { getGrammarClient } from './grammar_client';

const DEBOUNCE_DELAY = 120;

const Spelling = ({
	channelId,
	updateDraft,
	isQuickReply,
	wrap = false
}: {
	channelId: string;
	isQuickReply?: boolean;
	updateDraft: React.MutableRefObject<((input: RequestInput) => void) | null>;
	wrap?: boolean;
}) => {
	const draftRequest = useAppSelector((state) => selectComposeInputByChannelId(state, channelId));
	const lastMessage = useAppSelector((state) => selectLastMessageByChannelId(state, channelId));

	const [replies, setQuickReplies] = useState<string[]>([]);

	useEffect(() => {
		if (!isQuickReply) {
			setQuickReplies([]);
			return;
		}

		const timeoutId = setTimeout(() => {
			const process = async () => {
				try {
					const client = await getGrammarClient();
					const previousMessage = (lastMessage?.content?.t as any) || null;
					if (!previousMessage) {
						setQuickReplies([]);
						return;
					}
					const quickReplies = await client.suggestQuickRepliesAsync(previousMessage, 6);
					setQuickReplies(quickReplies?.length ? quickReplies : []);
				} catch (error) {
					console.error('[QuickReply] Processing failed:', error);
				}
			};

			void process();
		}, DEBOUNCE_DELAY);

		return () => {
			clearTimeout(timeoutId);
		};
	}, [draftRequest?.valueTextInput, isQuickReply, lastMessage]);

	const handleQuickReply = (reply: string) => {
		updateDraft?.current?.({
			...draftRequest,
			content: reply,
			valueTextInput: reply
		});
		requestAnimationFrame(() => {
			const input = document.getElementById(CHANNEL_INPUT_ID);

			if (!input) return;

			input.focus();
			const selection = window.getSelection();
			selection?.selectAllChildren(input);
			selection?.collapseToEnd();
		});
	};

	if (replies?.length && isQuickReply) {
		return (
			<div
				className={
					wrap
						? 'w-full min-h-10 px-4 pb-2 flex flex-wrap items-center justify-end gap-2'
						: 'w-full h-10 px-4 pb-2 flex items-center justify-end gap-2 overflow-x-auto scrollbar-none'
				}
			>
				{replies.map((reply) => (
					<button
						onClick={() => handleQuickReply(reply)}
						key={reply}
						type="button"
						className="shrink-0 h-7 px-3 rounded-full text-sm whitespace-nowrap border border-blue-500 bg-blue-400 bg-opacity-25 text-blue-400 hover:bg-blue-500 hover:text-white"
					>
						{reply}
					</button>
				))}
			</div>
		);
	}

	return null;
};

export default Spelling;
