import {
	appActions,
	selectComposeInputByChannelId,
	selectIsRecommand,
	selectLastMessageByChannelId,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import type { RequestInput } from '@mezon/utils';
import * as ort from 'onnxruntime-web';
import { useEffect, useRef, useState } from 'react';
import { MezonGrammarClient } from './mezon_grammar.js';

ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.20.1/dist/';
ort.env.wasm.numThreads = 1;
ort.env.wasm.proxy = false;

type GrammarClient = MezonGrammarClient;

const MODEL_URL = process.env.NX_MODEL_ONNX;
const ACCENT_MODEL_URL = process.env.NX_MODEL_ACCENT_ONNX;
const DEBOUNCE_DELAY = 120; //120ms

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

	const clientRef = useRef<GrammarClient | null>(null);
	const initPromiseRef = useRef<Promise<GrammarClient> | null>(null);
	const requestIdRef = useRef(0);
	const dispatch = useAppDispatch();

	const [corrected, setCorrected] = useState('');
	const [holdCorrect, setHoldCorrect] = useState('');
	const [replies, setQuickReplies] = useState<string[]>([]);

	const [pendingCorrection, setPendingCorrection] = useState('');

	const isOpenRecommand = useAppSelector(selectIsRecommand);
	const lastMessage = useAppSelector((state) => selectLastMessageByChannelId(state, channelId));

	// Khởi tạo grammar client và tải model.
	useEffect(() => {
		let cancelled = false;

		const initialize = async (): Promise<GrammarClient> => {
			if (!MODEL_URL || !ACCENT_MODEL_URL) {
				throw new Error('NOT FOUND CDN MODEL URL');
			}

			const client = new MezonGrammarClient() as GrammarClient;

			const results = await Promise.allSettled([client.loadModel(MODEL_URL, ort as any), client.loadAccentModel(ACCENT_MODEL_URL, ort as any)]);

			results.forEach((result, index) => {
				if (result.status === 'rejected') {
					console.error(index === 0 ? '[Spelling] Intent model load failed:' : '[Spelling] Accent model load failed:', result.reason);
				}
			});

			if (!client.isModelLoaded() && !client.isAccentModelLoaded()) {
				throw new Error('Không thể tải cả intent model và accent model');
			}

			if (!cancelled) {
				clientRef.current = client;
			}

			return client;
		};

		const promise = initialize();
		initPromiseRef.current = promise;

		void promise.catch((error: unknown) => {
			console.error('[Spelling] Initialization failed:', error);

			if (initPromiseRef.current === promise) {
				initPromiseRef.current = null;
			}
		});

		return () => {
			cancelled = true;
		};
	}, []);

	// Chỉ cập nhật corrected khi pendingCorrection không đổi trong 500ms.
	useEffect(() => {
		const timeoutId = setTimeout(() => {
			setCorrected(pendingCorrection);
		}, DEBOUNCE_DELAY);

		return () => {
			clearTimeout(timeoutId);
		};
	}, [pendingCorrection]);

	// Debounce nội dung đầu vào trước khi chạy model.
	useEffect(() => {
		const requestId = ++requestIdRef.current;
		const text = draftRequest?.content;
		const valueTextInput = draftRequest?.valueTextInput ?? '';

		const timeoutId = setTimeout(() => {
			const process = async () => {
				try {
					const initPromise = initPromiseRef.current;

					if (!clientRef.current && !initPromise) {
						return;
					}

					const client = clientRef.current ?? (await initPromise!);

					if (requestId !== requestIdRef.current) {
						return;
					}

					if (client.isModelLoaded() || client.isAccentModelLoaded()) {
						const result = await client.onKeystrokeAsync(text, 6, (lastMessage?.content?.t as any) || null);

						if (requestId !== requestIdRef.current) {
							return;
						}

						const correction = result.correction.corrected;
						const quickReplies = (result as { quickReplies?: string[] })?.quickReplies;
						setQuickReplies(quickReplies && quickReplies?.length ? quickReplies : []);
						if (correction && isSpelling) {
							if (typeof text !== 'string' || !text.trim() || text.length > 256) {
								setCorrected('');
								setPendingCorrection('');
								return;
							}
							setPendingCorrection(correction?.trim() !== valueTextInput?.trim() ? correction : '');
						} else if (!correction) {
							setCorrected('');
							setPendingCorrection('');
							return;
						}
					}
				} catch (error) {
					if (requestId === requestIdRef.current) {
						console.error('[Spelling] Processing failed:', error);
					}
				}
			};

			void process();
		}, DEBOUNCE_DELAY);

		return () => {
			clearTimeout(timeoutId);
		};
	}, [draftRequest?.content, draftRequest?.valueTextInput, isSpelling]);

	useEffect(() => {
		if (!isSpelling) {
			return;
		}
		if (isOpenRecommand) {
			if (!corrected) {
				dispatch(appActions.toggleRecommand());
			}
			setHoldCorrect(corrected);
			return;
		}
		if (!isOpenRecommand && holdCorrect) {
			updateDraft?.current?.({
				...draftRequest,
				content: holdCorrect,
				valueTextInput: holdCorrect
			});

			setCorrected('');
			setHoldCorrect('');
			setPendingCorrection('');
		}
	}, [isOpenRecommand, updateDraft, holdCorrect, corrected, isSpelling, channelId, updateDraft]);

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

	if (corrected && isOpenRecommand) {
		return <div className="w-full h-8 px-4 pt-2 text-theme-primary bg-theme-setting-nav text-sm pb-1">{corrected}</div>;
	}

	if (replies?.length && !isOpenRecommand) {
		return (
			<div className="w-full h-10 px-4 pb-2 flex items-center justify-end gap-2 overflow-x-auto scrollbar-none">
				{replies.map((reply, index) => (
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
