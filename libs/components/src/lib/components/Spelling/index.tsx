import {
	appActions,
	selectComposeInputByChannelId,
	selectIsRecommand,
	selectLastMessageByChannelId,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import type { RequestInput } from '@mezon/utils';
import { useEffect, useState } from 'react';
import { getGrammarClient } from './grammar_client';

const DEBOUNCE_DELAY = 120;

const Spelling = ({
	channelId,
	isSpelling,
	updateDraft,
	isQuickReply
}: {
	channelId: string;
	isSpelling?: boolean;
	isQuickReply?: boolean;
	updateDraft: React.MutableRefObject<((input: RequestInput) => void) | null>;
}) => {
	const draftRequest = useAppSelector((state) => selectComposeInputByChannelId(state, channelId));
	const isOpenRecommand = useAppSelector(selectIsRecommand);
	const lastMessage = useAppSelector((state) => selectLastMessageByChannelId(state, channelId));

	const dispatch = useAppDispatch();

	const [corrected, setCorrected] = useState('');
	const [holdCorrect, setHoldCorrect] = useState('');
	const [replies, setQuickReplies] = useState<string[]>([]);
	const [showText, setShowText] = useState('');

	const [pendingCorrection, setPendingCorrection] = useState('');

	useEffect(() => {
		const timeoutId = setTimeout(() => {
			setCorrected(pendingCorrection);
			setShowText(
				pendingCorrection
					.replace(/<[^>]*>/g, '')
					.replace(/&nbsp;/g, ' ')
					.trim()
			);
		}, DEBOUNCE_DELAY);

		return () => {
			clearTimeout(timeoutId);
		};
	}, [pendingCorrection]);

	useEffect(() => {
		const text = draftRequest?.content;
		const valueTextInput = draftRequest?.valueTextInput ?? '';

		const timeoutId = setTimeout(() => {
			const process = async () => {
				try {
					const client = await getGrammarClient();

					const result = await client.onKeystrokeAsync(valueTextInput, 6, (lastMessage?.content?.t as any) || null);

					const correction = result.correction.corrected;

					const quickReplies = (result as { quickReplies?: string[] })?.quickReplies;

					setQuickReplies(quickReplies?.length ? quickReplies : []);

					if (!isSpelling) {
						return;
					}

					if (typeof text !== 'string' || !text.trim() || text.length > 256) {
						setCorrected('');
						setPendingCorrection('');
						return;
					}

					if (!correction) {
						setCorrected('');
						setPendingCorrection('');
						return;
					}

					setPendingCorrection(correction.trim() !== text.trim() ? correction : '');
				} catch (error) {
					console.error('[Spelling] Processing failed:', error);
				}
			};

			void process();
		}, DEBOUNCE_DELAY);

		return () => {
			clearTimeout(timeoutId);
		};
	}, [draftRequest?.content, draftRequest?.valueTextInput, isSpelling, isQuickReply, lastMessage]);

	useEffect(() => {
		if (!isSpelling) {
			return;
		}

		if (isOpenRecommand) {
			if (!corrected) {
				dispatch(appActions.toggleRecommand());
				return;
			}

			setHoldCorrect(corrected);
			return;
		}

		if (holdCorrect) {
			updateDraft.current?.({
				...draftRequest,
				content: holdCorrect,
				valueTextInput: holdCorrect
			});

			setCorrected('');
			setHoldCorrect('');
			setPendingCorrection('');
		}
	}, [isOpenRecommand, updateDraft, holdCorrect, corrected, isSpelling, draftRequest, dispatch]);

	const handleQuickReply = (reply: string) => {
		updateDraft?.current?.({
			...draftRequest,
			content: reply,
			valueTextInput: reply
		});
		setCorrected('');
		setHoldCorrect('');
		setPendingCorrection('');
	};

	if (corrected && isOpenRecommand && isSpelling) {
		return <div className="w-full h-8 px-4 pt-2 text-theme-primary bg-theme-setting-nav text-sm pb-1">{showText}</div>;
	}

	if (replies?.length && !isOpenRecommand && isQuickReply) {
		return (
			<div className="w-full h-10 px-4 pb-2 flex items-center justify-end gap-2 overflow-x-auto scrollbar-none">
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
