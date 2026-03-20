import { EmojiSuggestionProvider, useEscapeKeyClose } from '@mezon/core';
import { Icons } from '@mezon/ui';
import { getSrcEmoji } from '@mezon/utils';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EmojiRolePanel } from '../EmojiPicker/EmojiRolePanel';

export type CreatePollModalProps = {
	onClose: () => void;
	onSubmit?: (pollData: PollData) => void;
};

export type PollData = {
	question: string;
	questionEmojiId?: string;
	answers: string[];
	answerEmojiIds?: string[];
	duration: string;
	allowMultipleAnswers: boolean;
};

const DURATION_OPTIONS = [
	{ labelKey: 'poll.duration1Hour', value: '1' },
	{ labelKey: 'poll.duration4Hours', value: '4' },
	{ labelKey: 'poll.duration8Hours', value: '8' },
	{ labelKey: 'poll.duration24Hours', value: '24' },
	{ labelKey: 'poll.duration3Days', value: '72' },
	{ labelKey: 'poll.duration1Week', value: '168' }
];

function CreatePollModal({ onClose, onSubmit }: CreatePollModalProps) {
	const { t } = useTranslation('message');
	const modalRef = useRef<HTMLDivElement>(null);

	const [question, setQuestion] = useState('');
	const [answers, setAnswers] = useState(['', '']);
	const [answerEmojiIds, setAnswerEmojiIds] = useState(['', '']);
	const [emojiPickerIndex, setEmojiPickerIndex] = useState<number | null>(null);
	const [emojiPickerPosition, setEmojiPickerPosition] = useState({ top: 0, left: 0 });
	const [duration, setDuration] = useState('24');
	const [allowMultipleAnswers, setAllowMultipleAnswers] = useState(false);
	const [durationDropdownOpen, setDurationDropdownOpen] = useState(false);
	const durationDropdownRef = useRef<HTMLDivElement>(null);

	useEscapeKeyClose(modalRef, onClose);

	useEffect(() => {
		if (!durationDropdownOpen) return;
		const handleClickOutside = (e: MouseEvent) => {
			if (durationDropdownRef.current && !durationDropdownRef.current.contains(e.target as Node)) {
				setDurationDropdownOpen(false);
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, [durationDropdownOpen]);

	const handleAddAnswer = () => {
		if (answers.length < 20) {
			setAnswers([...answers, '']);
			setAnswerEmojiIds([...answerEmojiIds, '']);
		}
	};

	const handleRemoveAnswer = (index: number) => {
		if (answers.length > 2) {
			setAnswers(answers.filter((_, i) => i !== index));
			setAnswerEmojiIds(answerEmojiIds.filter((_, i) => i !== index));
			setEmojiPickerIndex((current) => {
				if (current === null) return current;
				if (current === index) return null;
				return current > index ? current - 1 : current;
			});
		}
	};

	const handleAnswerChange = (index: number, value: string) => {
		const newAnswers = [...answers];
		newAnswers[index] = value;
		setAnswers(newAnswers);
	};

	const handleToggleEmojiPicker = (index: number, event: React.MouseEvent<HTMLButtonElement>) => {
		if (emojiPickerIndex === index) {
			setEmojiPickerIndex(null);
		} else {
			const rect = event.currentTarget.getBoundingClientRect();
			setEmojiPickerPosition({
				top: rect.bottom + window.scrollY + 8,
				left: rect.left + window.scrollX
			});
			setEmojiPickerIndex(index);
		}
	};

	const handleSelectAnswerEmoji = (emojiId: string) => {
		if (emojiPickerIndex === null) return;
		const newEmojiIds = [...answerEmojiIds];
		newEmojiIds[emojiPickerIndex] = emojiId;
		setAnswerEmojiIds(newEmojiIds);
		setEmojiPickerIndex(null);
	};

	const handlePost = () => {
		if (question.trim() && answers.some((a) => a.trim())) {
			const filteredAnswers = answers.filter((a) => a.trim());
			const filteredEmojiIds = answerEmojiIds.filter((_, i) => answers[i].trim());
			const questionStr = question.trim();
			const answersStr = filteredAnswers.map((a, i) => (filteredEmojiIds[i] ? `[e:${filteredEmojiIds[i]}] ${a.trim()}` : a.trim()));
			onSubmit?.({
				question: questionStr,
				answers: answersStr,
				duration,
				allowMultipleAnswers
			});
			onClose();
		}
	};

	return (
		<>
			{/* Backdrop */}
			<div className="fixed inset-0 z-50 bg-modal-overlay" onClick={onClose} />

			{/* Modal */}
			<div ref={modalRef} tabIndex={-1} className="fixed inset-0 z-50 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
				<div className="bg-theme-primary rounded-lg w-full max-w-[480px] mx-4 shadow-xl">
					{/* Header */}
					<div className="flex items-center justify-between p-4">
						<h2 className="text-xl font-semibold text-theme-primary-active">{t('poll.createTitle')}</h2>
						<button
							type="button"
							onClick={onClose}
							className="p-2 rounded-md border border-transparent text-theme-primary hover:text-theme-primary-active hover:border-theme-primary bg-item-theme-hover transition-colors"
						>
							<Icons.Close className="w-5 h-5" />
						</button>
					</div>

					{/* Content */}
					<div className="p-4 space-y-4">
						{/* Question */}
						<div>
							<label className="block text-sm font-semibold mb-2 text-theme-primary">{t('poll.question')}</label>
							<input
								type="text"
								value={question}
								onChange={(e) => setQuestion(e.target.value.slice(0, 300))}
								placeholder={t('poll.questionPlaceholder')}
								className="w-full px-3 py-2 bg-theme-input text-theme-primary-active rounded border-theme-primary focus-input"
								maxLength={300}
							/>
							<div className="mt-1 text-right text-xs text-theme-primary">{question.length} / 300</div>
						</div>

						{/* Answers */}
						<div className="relative">
							<label className="block text-sm font-semibold mb-2 text-theme-primary">{t('poll.answers')}</label>

							<div className="max-h-[280px] overflow-y-auto overflow-x-hidden space-y-2 pr-2 thread-scroll">
								{answers.map((answer, index) => (
									<div key={index} className="relative">
										<button
											type="button"
											onClick={(e) => handleToggleEmojiPicker(index, e)}
											className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-primary hover:text-theme-primary-active hover:brightness-200 transition-all"
										>
											{answerEmojiIds[index] ? (
												<img
													src={getSrcEmoji(answerEmojiIds[index])}
													alt={t('poll.selectedEmoji')}
													className="w-5 h-5 object-contain"
												/>
											) : (
												<Icons.Smile className="w-5 h-5" />
											)}
										</button>

										<input
											type="text"
											value={answer}
											onChange={(e) => handleAnswerChange(index, e.target.value)}
											placeholder={t('poll.answerPlaceholder')}
											className="w-full pl-11 pr-11 py-2 bg-theme-input text-theme-primary-active rounded border-theme-primary focus-input"
										/>

										{answers.length > 2 && (
											<button
												type="button"
												onClick={() => handleRemoveAnswer(index)}
												className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-primary hover:text-colorDangerHover transition-colors"
											>
												<Icons.TrashIcon className="w-5 h-5" />
											</button>
										)}
									</div>
								))}
							</div>

							{answers.length < 20 && (
								<button
									onClick={handleAddAnswer}
									className="mt-2 flex items-center gap-2 text-sm text-theme-primary hover:text-theme-primary-active transition-colors"
								>
									<Icons.AddIcon className="w-4 h-4" />
									{t('poll.addAnotherAnswer')}
								</button>
							)}
						</div>

						<div>
							<label className="block text-sm font-semibold mb-2 text-theme-primary-active">{t('poll.duration')}</label>

							<div ref={durationDropdownRef} className="relative">
								<button
									type="button"
									onClick={() => setDurationDropdownOpen((open) => !open)}
									className="w-full pl-3 pr-10 py-2 bg-theme-input text-theme-primary-active rounded border-theme-primary focus-input bg-item-hover cursor-pointer text-left flex items-center"
								>
									{t(DURATION_OPTIONS.find((o) => o.value === duration)?.labelKey ?? 'poll.duration24Hours')}
								</button>

								<span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-theme-primary">
									<Icons.ArrowDown className="w-5 h-5" />
								</span>

								{durationDropdownOpen && (
									<div className="absolute left-0 right-0 top-full mt-1 z-50 rounded border border-theme-primary bg-theme-setting-primary shadow-xl overflow-hidden">
										{DURATION_OPTIONS.map((option) => (
											<button
												key={option.value}
												type="button"
												onClick={() => {
													setDuration(option.value);
													setDurationDropdownOpen(false);
												}}
												className="w-full px-3 py-2 text-left text-theme-primary-active bg-item-theme-hover hover:border-l-2 hover:border-l-buttonPrimary cursor-pointer transition-colors duration-150 border-l-2 border-l-transparent"
											>
												{t(option.labelKey)}
											</button>
										))}
									</div>
								)}
							</div>
						</div>
					</div>

					{/* Footer */}
					<div className="flex items-center justify-between p-4">
						<div className="flex items-center gap-2">
							<label className="flex items-center gap-2 cursor-pointer">
								<input
									type="checkbox"
									checked={allowMultipleAnswers}
									onChange={(e) => setAllowMultipleAnswers(e.target.checked)}
									className="w-5 h-5 rounded border-theme-primary accent-buttonPrimary cursor-pointer"
								/>
							</label>
							<span className="mb-1 text-sm text-theme-primary-active">{t('poll.allowMultipleAnswers')}</span>
						</div>

						<button
							onClick={handlePost}
							disabled={!question.trim() || !answers.some((a) => a.trim())}
							className="px-6 py-2 rounded font-semibold transition-colors btn-primary btn-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{t('poll.post')}
						</button>
					</div>
				</div>
			</div>

			{emojiPickerIndex !== null && (
				<div
					className="fixed z-[70] w-[420px] max-w-[calc(100vw-3rem)] rounded-lg border border-theme-primary bg-theme-setting-primary shadow-xl"
					style={{ top: `${emojiPickerPosition.top}px`, left: `${emojiPickerPosition.left}px` }}
				>
					<EmojiSuggestionProvider>
						<EmojiRolePanel onEmojiSelect={(emojiId) => handleSelectAnswerEmoji(emojiId)} onClose={() => setEmojiPickerIndex(null)} />
					</EmojiSuggestionProvider>
				</div>
			)}
		</>
	);
}

export default CreatePollModal;
