import {
	getPoll,
	getStore,
	selectCurrentUserId,
	selectMemberClanByUserId,
	selectPollByMessageId,
	selectPollLoadingClose,
	selectPollLoadingVote,
	useAppDispatch,
	useAppSelector,
	votePoll
} from '@mezon/store';
import { getSrcEmoji } from '@mezon/utils';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PollDetailModal } from './PollDetailModal';
import './PollMessage.scss';

export type PollVoter = {
	displayName: string;
	username: string;
	avatar?: string;
};

export type PollMessageProps = {
	question: string;
	questionEmojiId?: string;
	answers: string[];
	answerEmojiIds?: string[];
	duration: string;
	allowMultipleAnswers: boolean;
	messageId?: string;
	channelId?: string;
	votersByOption?: PollVoter[][];
};

export const PollMessage = ({
	question,
	questionEmojiId,
	answers,
	answerEmojiIds,
	duration,
	allowMultipleAnswers,
	messageId,
	channelId,
	votersByOption
}: PollMessageProps) => {
	const { t, i18n } = useTranslation('message');
	const dispatch = useAppDispatch();
	const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
	const [showResults, setShowResults] = useState(false);
	const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
	const [detailModalSelectedIndex, setDetailModalSelectedIndex] = useState(0);

	const pollData = useAppSelector((state) => (messageId ? selectPollByMessageId(state, messageId) : undefined));
	const isVoting = useAppSelector((state) => selectPollLoadingVote(state, messageId));
	const isClosing = useAppSelector((state) => selectPollLoadingClose(state, messageId));
	const currentUserId = useAppSelector(selectCurrentUserId);

	const isClosed = useMemo(() => {
		const pollDataAny = pollData as Record<string, unknown>;
		return pollDataAny?.is_closed === true;
	}, [pollData]);

	const isExpired = useMemo(() => {
		const pollDataAny = pollData as Record<string, unknown>;
		if (!pollDataAny?.exp) return false;
		const now = Math.floor(Date.now() / 1000);
		const expiration = parseInt(pollDataAny.exp as string);
		return expiration < now;
	}, [pollData]);

	const voteCounts = useMemo(() => {
		const pollDataAny = pollData as Record<string, unknown>;
		if (pollDataAny?.answer_counts && Array.isArray(pollDataAny.answer_counts)) {
			return pollDataAny.answer_counts as number[];
		}
		return new Array(answers.length).fill(0);
	}, [pollData, answers.length]);

	const votedAnswers = useMemo(() => {
		const pollDataAny = pollData as Record<string, unknown>;
		if (!pollDataAny?.voter_details || !currentUserId) return [];

		const userVotes: number[] = [];
		const voterDetails = pollDataAny.voter_details;
		if (Array.isArray(voterDetails)) {
			voterDetails.forEach((detail: unknown, index: number) => {
				const detailObj = detail as Record<string, unknown>;
				if (detailObj.user_ids && Array.isArray(detailObj.user_ids) && detailObj.user_ids.includes(currentUserId)) {
					userVotes.push((detailObj.answer_index as number) ?? index);
				}
			});
		}
		return userVotes;
	}, [pollData, currentUserId]);

	const votersByOptionFromApi = useMemo(() => {
		const pollDataAny = pollData as Record<string, unknown>;
		if (!pollDataAny?.voter_details) return undefined;

		const voterDetails = pollDataAny.voter_details;
		if (!Array.isArray(voterDetails)) return undefined;

		const result: PollVoter[][] = Array.from({ length: answers.length }, () => []);

		const state = getStore().getState();

		voterDetails.forEach((detail: unknown) => {
			const detailObj = detail as Record<string, unknown>;
			const answerIndex = (detailObj.answer_index as number) ?? 0;
			const userIds = (detailObj.user_ids as string[]) ?? [];

			if (answerIndex >= 0 && answerIndex < answers.length) {
				const voters: PollVoter[] = [];

				userIds.forEach((userId) => {
					const member = selectMemberClanByUserId(state, userId);
					if (member) {
						voters.push({
							displayName: member.clan_nick || member.user?.display_name || member.user?.username || 'Unknown',
							username: member.user?.username || 'unknown',
							avatar: member.clan_avatar || member.user?.avatar_url
						});
					}
				});

				result[answerIndex] = voters;
			}
		});

		return result;
	}, [pollData, answers.length]);

	const hasVoted = useMemo(() => {
		return votedAnswers.length > 0;
	}, [votedAnswers]);

	const canSelectAnswers = !hasVoted && !showResults && !isClosed && !isExpired;
	const shouldShowResults = hasVoted || showResults || isClosed || isExpired;

	const totalVotes = useMemo(() => voteCounts.reduce((sum, count) => sum + count, 0), [voteCounts]);

	const formattedDuration = useMemo(() => {
		if (!duration) return '';
		const match = duration.match(/^(\d+)\s+(\w+)/);
		if (!match) return duration;
		const count = Number(match[1]);
		const unit = match[2].toLowerCase();
		if (unit.startsWith('day')) return t('poll.durationDays', { count });
		if (unit.startsWith('hour')) return t('poll.durationHours', { count });
		if (unit.startsWith('minute')) return t('poll.durationMinutes', { count });
		return duration;
	}, [duration, t, i18n.language]);

	const handleAnswerToggle = (index: number) => {
		if (!canSelectAnswers) return;

		if (allowMultipleAnswers) {
			setSelectedAnswers((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]));
		} else {
			setSelectedAnswers((prev) => (prev.length === 1 && prev[0] === index ? [] : [index]));
		}
	};

	const handleVote = async () => {
		if (selectedAnswers.length === 0 || !messageId || !channelId || !pollData?.poll_id) {
			return;
		}

		try {
			await dispatch(
				votePoll({
					poll_id: pollData.poll_id,
					message_id: messageId,
					channel_id: channelId,
					answer_indices: selectedAnswers
				})
			).unwrap();

			await dispatch(
				getPoll({
					message_id: messageId,
					channel_id: channelId
				})
			).unwrap();

			setSelectedAnswers([]);
			setShowResults(false);
		} catch (error) {
			console.error('Failed to vote:', error);
		}
	};

	const handleRemoveVote = async () => {
		if (!messageId || !channelId || !pollData?.poll_id) return;

		try {
			await dispatch(
				votePoll({
					poll_id: pollData.poll_id,
					message_id: messageId,
					channel_id: channelId,
					answer_indices: []
				})
			).unwrap();

			await dispatch(
				getPoll({
					message_id: messageId,
					channel_id: channelId
				})
			).unwrap();

			setSelectedAnswers([]);
			setShowResults(false);
		} catch (error) {
			console.error('Failed to remove vote:', error);
		}
	};

	const getPercentage = (count: number) => {
		if (totalVotes === 0) return 0;
		return Math.round((count / totalVotes) * 100);
	};

	const openDetailModal = (optionIndex: number) => {
		setDetailModalSelectedIndex(optionIndex);
		setIsDetailModalOpen(true);
	};

	return (
		<div className="block w-full">
			<div className="max-w-[420px] rounded bg-item-theme p-3 border-theme-primary">
				{/* Question */}
				<div className="flex items-center gap-2 mb-1">
					{questionEmojiId && (
						<img
							src={getSrcEmoji(questionEmojiId)}
							alt={t('poll.selectedEmoji')}
							className="w-5 h-5 object-contain flex-shrink-0 mt-0.5"
						/>
					)}
					<h3 className="text-[15px] font-semibold text-theme-primary break-all flex-1 min-w-0">{question}</h3>
					{(isClosed || isExpired) && (
						<span className="px-2 py-0.5 text-xs font-semibold rounded bg-red-500/10 text-red-500 flex-shrink-0">
							{t('poll.ended', { defaultValue: 'Poll Ended' })}
						</span>
					)}
				</div>

				{/* Subtitle */}
				<p className="text-xs text-theme-primary mb-3">
					{isClosed || isExpired
						? t('poll.finalResults', { defaultValue: 'Final results' })
						: allowMultipleAnswers
							? t('poll.selectOneOrMore')
							: t('poll.selectOne')}
				</p>

				{/* Answers */}
				<div className="space-y-2 mb-3">
					{answers.map((answer, index) => {
						const voteCount = voteCounts[index];
						const percentage = getPercentage(voteCount);
						const isVoted = votedAnswers.includes(index);
						const answerEmoji = answerEmojiIds?.[index];

						return (
							<div
								key={index}
								onClick={shouldShowResults ? undefined : () => handleAnswerToggle(index)}
								className={`relative flex items-center justify-between px-3 py-2.5 rounded border overflow-hidden transition-colors ${
									shouldShowResults
										? 'border-theme-primary cursor-default pointer-events-none'
										: selectedAnswers.includes(index)
											? '[background:var(--bg-item-hover)] border-[var(--text-theme-primary)] hover:[background:var(--bg-active-member-channel)] hover:brightness-105 cursor-pointer'
											: '[background:var(--bg-item-hover)] border-transparent cursor-pointer'
								}`}
							>
								{shouldShowResults && (
									<div className="absolute inset-y-0 left-0 rounded-l min-w-0 overflow-hidden" style={{ width: `${percentage}%` }}>
										<div
											className="poll-bar-inner absolute inset-0 origin-left scale-x-0 rounded-l bg-blue-700/80"
											style={{ animationDelay: `${index * 0.2}s` }}
										/>
									</div>
								)}
								<div className="relative z-10 flex items-center gap-2 min-w-0 flex-1">
									{answerEmoji && (
										<img
											src={getSrcEmoji(answerEmoji)}
											alt={t('poll.selectedEmoji')}
											className="w-5 h-5 object-contain flex-shrink-0 mt-0.5"
										/>
									)}
									<span
										className={`text-sm font-medium ${hasVoted && isVoted ? 'text-theme-primary' : 'text-theme-primary-active'} break-all min-w-0 flex-1 truncate`}
									>
										{answer}
									</span>
								</div>
								<div className="relative z-10 flex items-center gap-3 flex-shrink-0 pl-2">
									{shouldShowResults && (
										<span
											className={`poll-percent-text text-xs font-semibold ${isVoted ? 'text-theme-primary' : 'text-theme-primary-active'}`}
											style={{ animationDelay: `${index * 0.1 + 0.25}s` }}
										>
											{percentage}% {voteCount} {voteCount < 2 ? t('poll.vote') : t('poll.votes')}
										</span>
									)}
									{canSelectAnswers && (
										<div
											className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 border-[var(--text-theme-primary)]`}
										>
											{selectedAnswers.includes(index) && <div className="w-2.5 h-2.5 rounded-full bg-theme-primary" />}
										</div>
									)}
									{hasVoted && isVoted && (
										<div className="w-5 h-5 rounded-full bg-theme-primary flex items-center justify-center flex-shrink-0">
											<svg className="w-3 h-3 text-theme-primary" viewBox="0 0 12 12" fill="none">
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
					<span className="text-xs text-theme-primary">
						<span
							role="button"
							tabIndex={0}
							onClick={(e) => {
								e.preventDefault();
								e.stopPropagation();
								openDetailModal(0);
							}}
							onKeyDown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									e.preventDefault();
									openDetailModal(0);
								}
							}}
							className="cursor-pointer hover:underline"
						>
							{totalVotes} {totalVotes < 2 ? t('poll.vote') : t('poll.votes')}
						</span>
						{!isClosed && !isExpired && (
							<>
								{' '}
								• {formattedDuration || duration} {t('poll.left')}
							</>
						)}
					</span>
					<div className="flex gap-2">
						{!hasVoted && !isClosed && !isExpired && (
							<button
								onClick={() => setShowResults((prev) => !prev)}
								className="px-1 py-1.5 text-sm font-medium border-theme-primary text-theme-primary hover:text-theme-primary-active rounded transition-colors"
							>
								{showResults ? t('poll.backToVote') : t('poll.showResults')}
							</button>
						)}
						{!hasVoted && !showResults && !isClosed && !isExpired && (
							<button
								onClick={handleVote}
								disabled={selectedAnswers.length === 0 || isVoting || isClosing}
								className="px-4 py-1.5 text-sm font-medium rounded transition-colors btn-primary btn-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{t('poll.voteButton')}
							</button>
						)}
						{hasVoted && !isClosed && !isExpired && (
							<button
								onClick={handleRemoveVote}
								disabled={isVoting || isClosing}
								className="px-4 py-1.5 text-sm font-medium text-theme-primary rounded transition-colors border-theme-primary bg-button-secondary bg-secondary-button-hover disabled:opacity-50"
							>
								{t('poll.removeVote')}
							</button>
						)}
					</div>
				</div>
			</div>

			<PollDetailModal
				open={isDetailModalOpen}
				onClose={() => setIsDetailModalOpen(false)}
				question={question}
				answers={answers}
				answerEmojiIds={answerEmojiIds}
				voteCounts={voteCounts}
				totalVotes={totalVotes}
				votersByOption={votersByOptionFromApi ?? votersByOption}
				initialSelectedIndex={detailModalSelectedIndex}
				votedAnswers={votedAnswers}
			/>
		</div>
	);
};
