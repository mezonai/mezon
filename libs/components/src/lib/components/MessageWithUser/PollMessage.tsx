import { useMemo, useState } from 'react';

export type PollMessageProps = {
	question: string;
	answers: string[];
	duration: string;
	allowMultipleAnswers: boolean;
	messageId?: string;
};

export const PollMessage = ({ question, answers, duration, allowMultipleAnswers }: PollMessageProps) => {
	const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
	const [hasVoted, setHasVoted] = useState(false);
	const [showResults, setShowResults] = useState(false);
	const [votedAnswers, setVotedAnswers] = useState<number[]>([]);
	const [voteCounts, setVoteCounts] = useState<number[]>(new Array(answers.length).fill(0));
	const canSelectAnswers = !hasVoted && !showResults;
	const shouldShowResults = hasVoted || showResults;

	const totalVotes = useMemo(() => voteCounts.reduce((sum, count) => sum + count, 0), [voteCounts]);

	const handleAnswerToggle = (index: number) => {
		if (!canSelectAnswers) return;

		if (allowMultipleAnswers) {
			setSelectedAnswers((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]));
		} else {
			setSelectedAnswers([index]);
		}
	};

	const handleVote = () => {
		if (selectedAnswers.length === 0) return;
		// TODO: Send vote to backend
		const newVoteCounts = [...voteCounts];
		selectedAnswers.forEach((index) => {
			newVoteCounts[index] += 1;
		});
		setVoteCounts(newVoteCounts);
		setVotedAnswers(selectedAnswers);
		setShowResults(false);
		setHasVoted(true);
	};

	const handleRemoveVote = () => {
		// TODO: Send remove vote to backend
		const newVoteCounts = [...voteCounts];
		votedAnswers.forEach((index) => {
			newVoteCounts[index] = Math.max(0, newVoteCounts[index] - 1);
		});
		setVoteCounts(newVoteCounts);
		setVotedAnswers([]);
		setSelectedAnswers([]);
		setHasVoted(false);
		setShowResults(false);
	};

	const getPercentage = (count: number) => {
		if (totalVotes === 0) return 0;
		return Math.round((count / totalVotes) * 100);
	};

	return (
		<div className="block w-full">
			<div className="max-w-[420px] rounded bg-item-theme p-3 border-theme-primary">
				{/* Question */}
				<h3 className="text-[15px] font-semibold text-theme-primary mb-1">{question}</h3>

				{/* Subtitle */}
				<p className="text-xs text-theme-primary mb-3">{allowMultipleAnswers ? 'Select one or more answers' : 'Select one answer'}</p>

				{/* Answers */}
				<div className="space-y-2 mb-3">
					{answers.map((answer, index) => {
						const voteCount = voteCounts[index];
						const percentage = getPercentage(voteCount);
						const isVoted = votedAnswers.includes(index);

						return (
							<div
								key={index}
								onClick={() => handleAnswerToggle(index)}
								className={`flex items-center justify-between px-3 py-2.5 rounded transition-colors ${
									shouldShowResults
										? isVoted
											? 'bg-[var(--button-theme-primary)] cursor-default'
											: 'bg-[var(--bg-item-hover)] cursor-default'
										: selectedAnswers.includes(index)
											? 'bg-[var(--bg-active-member-channel)] cursor-pointer'
											: 'bg-[var(--bg-item-hover)] hover:bg-[var(--bg-active-member-channel)] cursor-pointer'
								}`}
							>
								<span className={`text-sm font-medium ${hasVoted && isVoted ? 'text-theme-primary-active' : 'text-theme-primary'}`}>
									{answer}
								</span>
								<div className="flex items-center gap-3">
									{shouldShowResults && (
										<span className={`text-xs font-semibold ${isVoted ? 'text-theme-primary-active' : 'text-theme-primary'}`}>
											{voteCount} {voteCount === 1 ? 'vote' : 'votes'} {percentage}%
										</span>
									)}
									{canSelectAnswers && (
										<div
											className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
												selectedAnswers.includes(index)
													? 'border-[var(--button-theme-primary)] bg-[var(--button-theme-primary)]'
													: 'border-theme-primary'
											}`}
										>
											{selectedAnswers.includes(index) && (
												<svg className="w-3 h-3 text-theme-primary-active" viewBox="0 0 12 12" fill="none">
													<path
														d="M2 6L5 9L10 3"
														stroke="currentColor"
														strokeWidth="2"
														strokeLinecap="round"
														strokeLinejoin="round"
													/>
												</svg>
											)}
										</div>
									)}
									{hasVoted && isVoted && (
										<div className="w-5 h-5 rounded bg-[var(--text-secondary)] flex items-center justify-center flex-shrink-0">
											<svg className="w-3 h-3 text-[var(--button-theme-primary)]" viewBox="0 0 12 12" fill="none">
												<path
													d="M2 6L5 9L10 3"
													stroke="currentColor"
													strokeWidth="2"
													strokeLinecap="round"
													strokeLinejoin="round"
												/>
											</svg>
										</div>
									)}
								</div>
							</div>
						);
					})}
				</div>

				{/* Footer */}
				<div className="flex items-center justify-between pt-1">
					<span className="text-xs text-theme-muted">
						{totalVotes} {totalVotes === 1 ? 'vote' : 'votes'} • {duration} left
					</span>
					<div className="flex gap-2">
						{!hasVoted && (
							<button
								onClick={() => setShowResults((prev) => !prev)}
								className="px-1 py-1.5 text-sm font-medium text-theme-primary hover:text-theme-primary-active rounded transition-colors"
							>
								{showResults ? 'Back to vote' : 'Show results'}
							</button>
						)}
						{!hasVoted && !showResults && (
							<button
								onClick={handleVote}
								disabled={selectedAnswers.length === 0}
								className="px-4 py-1.5 text-sm font-medium rounded transition-colors btn-primary btn-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
							>
								Vote
							</button>
						)}
						{hasVoted && (
							<button
								onClick={handleRemoveVote}
								className="px-4 py-1.5 text-sm font-medium text-theme-primary rounded transition-colors border-theme-primary bg-button-secondary bg-secondary-button-hover"
							>
								Remove Vote
							</button>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};
