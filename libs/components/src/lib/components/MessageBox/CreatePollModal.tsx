import { EmojiSuggestionProvider, useEscapeKeyClose } from '@mezon/core';
import { Icons } from '@mezon/ui';
import { getSrcEmoji } from '@mezon/utils';
import { useRef, useState } from 'react';
import { EmojiRolePanel } from '../EmojiPicker/EmojiRolePanel';

export type CreatePollModalProps = {
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

function CreatePollModal({ onClose, onSubmit }: CreatePollModalProps) {
	const modalRef = useRef<HTMLDivElement>(null);

	const [question, setQuestion] = useState('');
	const [answers, setAnswers] = useState(['', '']);
	const [answerEmojiIds, setAnswerEmojiIds] = useState(['', '']);
	const [emojiPickerIndex, setEmojiPickerIndex] = useState<number | null>(null);
	const [duration, setDuration] = useState('24');
	const [allowMultipleAnswers, setAllowMultipleAnswers] = useState(false);

	useEscapeKeyClose(modalRef, onClose);

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

	return (
		<>
			{/* Backdrop */}
			<div className="fixed inset-0 z-50 bg-modal-overlay" onClick={onClose} />

			{/* Modal */}
			<div ref={modalRef} tabIndex={-1} className="fixed inset-0 z-50 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
				<div className="bg-theme-primary rounded-lg w-full max-w-[480px] mx-4 shadow-xl">
					{/* Header */}
					<div className="flex items-center justify-between p-4">
						<h2 className="text-xl font-semibold text-theme-primary-active">Create a Poll</h2>
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
							<label className="block text-sm font-semibold mb-2 text-theme-primary">Question</label>
							<input
								type="text"
								value={question}
								onChange={(e) => setQuestion(e.target.value.slice(0, 300))}
								placeholder="What question do you want to ask?"
								className="w-full px-3 py-2 bg-theme-input text-theme-primary-active rounded border-theme-primary focus-input"
								maxLength={300}
							/>
							<div className="mt-1 text-right text-xs text-theme-primary">{question.length} / 300</div>
						</div>

						{/* Answers */}
						<div>
							<label className="block text-sm font-semibold mb-2 text-theme-primary">Answers</label>

							<div className="space-y-2">
								{answers.map((answer, index) => (
									<div key={index} className="relative">
										<button
											type="button"
											onClick={() => handleToggleEmojiPicker(index)}
											className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-primary hover:text-theme-primary-active hover:brightness-200 transition-all"
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
									className="mt-2 flex items-center gap-2 text-sm text-theme-primary hover:text-theme-primary-active transition-colors"
								>
									<Icons.AddIcon className="w-4 h-4" />
									Add another answer
								</button>
							)}
						</div>

						{/* Duration (Select) */}
						<div>
							<label className="block text-sm font-semibold mb-2 text-theme-primary-active">Duration</label>

							<div className="relative">
								<select
									value={duration}
									onChange={(e) => setDuration(e.target.value)}
									className="w-full pl-3 pr-10 py-2 bg-theme-input text-theme-primary-active rounded border-theme-primary focus-input bg-item-hover appearance-none cursor-pointer"
								>
									{DURATION_OPTIONS.map((option) => (
										<option
											key={option.value}
											value={option.value}
											className="bg-theme-setting-primary text-theme-primary-active"
										>
											{option.label}
										</option>
									))}
								</select>

								<span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-theme-primary">
									<Icons.ArrowDown className="w-5 h-5" />
								</span>
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
							<span className="mb-1 text-sm text-theme-primary-active">Allow Multiple Answers</span>
						</div>

						<button
							onClick={handlePost}
							disabled={!question.trim() || !answers.some((a) => a.trim())}
							className="px-6 py-2 rounded font-semibold transition-colors btn-primary btn-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
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
