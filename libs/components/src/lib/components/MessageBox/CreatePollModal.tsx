import { EmojiSuggestionProvider, useEscapeKeyClose } from '@mezon/core';
import { Icons } from '@mezon/ui';
import { getSrcEmoji } from '@mezon/utils';
import { useEffect, useRef, useState } from 'react';
import { EmojiRolePanel } from '../EmojiPicker/EmojiRolePanel';

export type CreatePollModalProps = {
	isOpen: boolean;
	onClose: () => void;
	onSubmit?: (pollData: PollData) => void;
};

export type PollData = {
	question: string;
	answers: string[];
	duration: string;
	allowMultipleAnswers: boolean;
};

const DURATION_OPTIONS = [
	{ label: '1 hour', value: '1' },
	{ label: '4 hours', value: '4' },
	{ label: '8 hours', value: '8' },
	{ label: '24 hours', value: '24' },
	{ label: '3 days', value: '72' },
	{ label: '1 week', value: '168' }
];

function CreatePollModal({ isOpen, onClose, onSubmit }: CreatePollModalProps) {
	const modalRef = useRef<HTMLDivElement>(null);
	const durationDropdownRef = useRef<HTMLDivElement>(null);
	const [question, setQuestion] = useState('');
	const [answers, setAnswers] = useState(['', '']);
	const [answerEmojiIds, setAnswerEmojiIds] = useState(['', '']);
	const [emojiPickerIndex, setEmojiPickerIndex] = useState<number | null>(null);
	const [duration, setDuration] = useState('24');
	const [isDurationDropdownOpen, setIsDurationDropdownOpen] = useState(false);
	const [allowMultipleAnswers, setAllowMultipleAnswers] = useState(false);

	useEscapeKeyClose(modalRef, onClose);

	useEffect(() => {
		if (!isDurationDropdownOpen) return;

		const handleClickOutside = (event: MouseEvent) => {
			const target = event.target as Node;
			if (durationDropdownRef.current && !durationDropdownRef.current.contains(target)) {
				setIsDurationDropdownOpen(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, [isDurationDropdownOpen]);

	if (!isOpen) return null;

	const handleAddAnswer = () => {
		if (answers.length < 10) {
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

	const handleToggleEmojiPicker = (index: number) => {
		setEmojiPickerIndex((current) => (current === index ? null : index));
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
			onSubmit?.({
				question,
				answers: answers.filter((a) => a.trim()),
				duration,
				allowMultipleAnswers
			});
			onClose();
		}
	};

	const selectedDurationLabel = DURATION_OPTIONS.find((option) => option.value === duration)?.label || DURATION_OPTIONS[0].label;

	return (
		<>
			{/* Backdrop */}
			<div className="fixed inset-0 z-50 bg-black bg-opacity-80" onClick={onClose} />

			{/* Modal */}
			<div ref={modalRef} tabIndex={-1} className="fixed inset-0 z-50 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
				<div className="bg-theme-primary rounded-lg w-full max-w-[480px] mx-4 shadow-xl">
					{/* Header */}
					<div className="flex items-center justify-between p-4 ">
						<h2 className="text-xl font-semibold text-textLightTheme dark:text-textDarkTheme">Create a Poll</h2>
						<button
							type="button"
							onClick={onClose}
							className="p-2 rounded-md border border-transparent text-textSecondary dark:text-textDarkTheme hover:text-textLightTheme dark:hover:text-white hover:border-theme-primary hover:bg-bgLightModeButton dark:hover:bg-bgTertiary transition-colors"
						>
							<Icons.Close className="w-5 h-5" />
						</button>
					</div>

					{/* Content */}
					<div className="p-4 space-y-4">
						{/* Question */}
						<div>
							<label className="block text-sm font-semibold mb-2 text-textLightTheme dark:text-textDarkTheme">Question</label>
							<div className="relative">
								<input
									type="text"
									value={question}
									onChange={(e) => setQuestion(e.target.value.slice(0, 300))}
									placeholder="What question do you want to ask?"
									className="w-full px-3 py-2 bg-bgLightMode dark:bg-bgPrimary text-textLightTheme dark:text-textDarkTheme rounded border-none outline-none focus:ring-2 focus:ring-blue-500"
									maxLength={300}
								/>
							</div>
							<div className=" mt-1 text-right text-xs text-textSecondary dark:text-gray-500">{question.length} / 300</div>
						</div>

						{/* Answers */}
						<div>
							<label className="block text-sm font-semibold mb-2 text-textLightTheme dark:text-textDarkTheme">Answers</label>
							<div className="space-y-2">
								{answers.map((answer, index) => (
									<div key={index} className="relative">
										<button
											type="button"
											onClick={() => handleToggleEmojiPicker(index)}
											className="absolute left-3 top-1/2 -translate-y-1/2 text-textSecondary dark:text-gray-500 hover:text-textLightTheme dark:hover:text-white transition-colors"
											aria-label="Select emoji"
										>
											{answerEmojiIds[index] ? (
												<img
													src={getSrcEmoji(answerEmojiIds[index])}
													alt="Selected emoji"
													className="w-5 h-5 object-contain"
												/>
											) : (
												<Icons.SmilingFace className="w-5 h-5" />
											)}
										</button>
										<input
											type="text"
											value={answer}
											onChange={(e) => handleAnswerChange(index, e.target.value)}
											placeholder="Type your answer"
											className="w-full pl-11 pr-11 py-2 bg-bgLightMode dark:bg-bgPrimary text-textLightTheme dark:text-textDarkTheme rounded border-none outline-none focus:ring-2 focus:ring-blue-500"
										/>
										{answers.length > 2 && (
											<button
												type="button"
												onClick={() => handleRemoveAnswer(index)}
												className="absolute right-3 top-1/2 -translate-y-1/2 text-textSecondary hover:text-red-500 transition-colors"
											>
												<Icons.TrashIcon className="w-5 h-5" />
											</button>
										)}
										{emojiPickerIndex === index && (
											<div className="absolute left-0 top-full mt-2 z-[60] w-[420px] max-w-[calc(100vw-3rem)] rounded-lg border border-theme-primary bg-theme-setting-primary shadow-xl">
												<EmojiSuggestionProvider>
													<EmojiRolePanel
														onEmojiSelect={(emojiId) => handleSelectAnswerEmoji(emojiId)}
														onClose={() => setEmojiPickerIndex(null)}
													/>
												</EmojiSuggestionProvider>
											</div>
										)}
									</div>
								))}
							</div>
							{answers.length < 10 && (
								<button
									onClick={handleAddAnswer}
									className="mt-2 flex items-center gap-2 text-sm text-textSecondary dark:text-gray-400 hover:text-textLightTheme dark:hover:text-white transition-colors"
								>
									<Icons.AddIcon className="w-4 h-4" />
									Add another answer
								</button>
							)}
						</div>

						{/* Duration */}
						<div>
							<label className="block text-sm font-semibold mb-2 text-textLightTheme dark:text-textDarkTheme">Duration</label>
							<div ref={durationDropdownRef} className="relative">
								<button
									type="button"
									onClick={() => setIsDurationDropdownOpen((current) => !current)}
									className="w-full pl-3 pr-10 py-2 bg-bgLightMode dark:bg-bgPrimary text-textLightTheme dark:text-textDarkTheme rounded border-none outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer text-left"
								>
									{selectedDurationLabel}
								</button>
								<span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-textSecondary dark:text-gray-500">
									<Icons.ArrowDown
										defaultSize="w-6 h-6 transition-transform duration-200"
										size={isDurationDropdownOpen ? 'rotate-180' : ''}
									/>
								</span>
								{isDurationDropdownOpen && (
									<div className="absolute left-0 right-0 mt-1 z-[60] overflow-hidden rounded bg-bgLightMode dark:bg-bgPrimary shadow-lg border border-theme-primary">
										{DURATION_OPTIONS.map((option) => (
											<button
												key={option.value}
												type="button"
												onClick={() => {
													setDuration(option.value);
													setIsDurationDropdownOpen(false);
												}}
												className={`w-full px-3 py-2 text-left text-textLightTheme dark:text-textDarkTheme transition-colors ${
													duration === option.value
														? 'bg-bgLightModeButton dark:bg-bgTertiary'
														: 'hover:bg-bgLightModeButton dark:hover:bg-bgTertiary'
												}`}
											>
												{option.label}
											</button>
										))}
									</div>
								)}
							</div>
						</div>
					</div>

					{/* Footer */}
					<div className="flex items-center justify-between p-4 ">
						<label className="flex items-center gap-2 cursor-pointer">
							<input
								type="checkbox"
								checked={allowMultipleAnswers}
								onChange={(e) => setAllowMultipleAnswers(e.target.checked)}
								className="w-5 h-5 rounded border-gray-300 text-blue-500 focus:ring-blue-500 cursor-pointer"
							/>
							<span className="text-sm text-textLightTheme dark:text-textDarkTheme">Allow Multiple Answers</span>
						</label>
						<button
							onClick={handlePost}
							disabled={!question.trim() || !answers.some((a) => a.trim())}
							className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded font-semibold transition-colors"
						>
							Post
						</button>
					</div>
				</div>
			</div>
		</>
	);
}

export default CreatePollModal;
