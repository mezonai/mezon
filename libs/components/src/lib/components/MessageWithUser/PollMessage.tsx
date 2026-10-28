import type { RootState } from '@mezon/store';
import {
	getPoll,
	getStore,
	selectCurrentUserId,
	selectEmojiSrcById,
	selectEntitesUserClans,
	selectGroupMembersEntities,
	selectMemberDMByUserId,
	selectMessageByMessageId,
	selectMyVote,
	useAppDispatch,
	useAppSelector,
	votePoll
} from '@mezon/store';
import { generateE2eId, getSrcEmoji } from '@mezon/utils';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PollDetailModal } from './PollDetailModal';
import './PollMessage.scss';

const POLL_EMOJI_REGEX = /\[e:([^\]]+)\]/g;

function PollEmoji({ emojiId }: { emojiId: string }) {
	const emojiSrc = useAppSelector((state) => selectEmojiSrcById(state, emojiId));
	return (
		<img
			src={getSrcEmoji(emojiId, emojiSrc)}
			alt=""
			className="w-5 h-5 object-contain inline-block align-middle flex-shrink-0"
			draggable={false}
		/>
	);
}

export type RenderPollTextWithEmojiOptions = {
	className?: string;

	textPartClassName?: string;

	emojiPartClassName?: string;
};

function renderPollTextWithEmoji(text: string, classNameOrOptions?: string | RenderPollTextWithEmojiOptions): ReactNode {
	if (!text) return null;
	const options: RenderPollTextWithEmojiOptions =
		typeof classNameOrOptions === 'string' ? { className: classNameOrOptions } : (classNameOrOptions ?? {});
	const { className, textPartClassName, emojiPartClassName } = options;

	const parts: ReactNode[] = [];
	let lastIndex = 0;
	let match: RegExpExecArray | null;
	const re = new RegExp(POLL_EMOJI_REGEX.source, 'g');
	while ((match = re.exec(text)) !== null) {
		if (match.index > lastIndex) {
			const segment = text.slice(lastIndex, match.index);
			parts.push(
				textPartClassName ? (
					<span key={`t-${match.index}`} className={textPartClassName}>
						{segment}
					</span>
				) : (
					segment
				)
			);
		}
		const emoji = <PollEmoji key={`e-${match.index}`} emojiId={match[1]} />;
		parts.push(
			emojiPartClassName ? (
				<span key={`w-${match.index}`} className={emojiPartClassName}>
					{emoji}
				</span>
			) : (
				emoji
			)
		);
		lastIndex = match.index + match[0].length;
	}
	if (lastIndex < text.length) {
		const segment = text.slice(lastIndex);
		parts.push(
			textPartClassName ? (
				<span key="t-end" className={textPartClassName}>
					{segment}
				</span>
			) : (
				segment
			)
		);
	}
	return <span className={className}>{parts}</span>;
}

export { renderPollTextWithEmoji };

export type PollVoter = {
	displayName: string;
	username: string;
	avatar?: string;
};

type PollVoterMembers = ReturnType<typeof selectGroupMembersEntities> | ReturnType<typeof selectEntitesUserClans>;

const resolvePollVoter = (state: RootState, members: PollVoterMembers, userId: string): PollVoter => {
	const entry = members[userId];
	const member = entry?.user?.username || entry?.user?.display_name ? entry : undefined;
	if (member) {
		return {
			displayName: member.clan_nick || member.user?.display_name || member.user?.username || userId,
			username: member.user?.username || userId,
			avatar: member.clan_avatar || member.user?.avatar_url
		};
	}
	const dmProfile = selectMemberDMByUserId(state, userId);
	if (dmProfile) {
		return {
			displayName: dmProfile.display_name || dmProfile.username || userId,
			username: dmProfile.username || userId,
			avatar: dmProfile.avatar_url
		};
	}
	return { displayName: userId, username: userId };
};

export type PollMessageProps = {
	question: string;
	answers: string[];
	duration: string;
	allowMultipleAnswers: boolean;
	messageId?: string;
	channelId?: string;
	votersByOption?: PollVoter[][];
	interactionDisabled?: boolean;
	isDirect?: boolean;
};

export const PollMessage = ({
	question,
	answers,
	duration,
	allowMultipleAnswers,
	messageId,
	channelId,
	votersByOption,
	interactionDisabled = false,
	isDirect = false
}: PollMessageProps) => {
	const { t } = useTranslation('message');
	const dispatch = useAppDispatch();
	const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
	const [showResults, setShowResults] = useState(false);
	const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
	const [detailModalSelectedIndex, setDetailModalSelectedIndex] = useState(0);
	const [uiVotedIndices, setUiVotedIndices] = useState<number[] | null>(null);

	const pollData = useAppSelector((state) => {
		if (!messageId || !channelId) return undefined;
		const msg = selectMessageByMessageId(state, channelId, messageId);
		return msg?.content as unknown as Record<string, unknown> | undefined;
	});
	const [isVoting, setIsVoting] = useState(false);
	const [isClosing, setIsClosing] = useState(false);
	const [isLoadingPollDetail, setIsLoadingPollDetail] = useState(false);
	const [detailVotersByOption, setDetailVotersByOption] = useState<PollVoter[][] | undefined>(undefined);
	const currentUserId = useAppSelector(selectCurrentUserId);

	useEffect(() => {
		if (!messageId || !pollData || !currentUserId) return;
		const pd = pollData as Record<string, unknown>;
		const details = pd.voter_details;
		if (!Array.isArray(details)) return;
		setUiVotedIndices(null);
	}, [messageId, pollData, currentUserId]);

	const isClosed = useMemo(() => {
		const pollDataAny = pollData as Record<string, unknown>;
		return pollDataAny?.is_closed === true;
	}, [pollData]);

	const isExpired = useMemo(() => {
		const pollDataAny = pollData as Record<string, unknown>;
		if (!pollDataAny?.expire_at) return false;
		const now = Math.floor(Date.now() / 1000);
		const expiration = Number(pollDataAny.expire_at);
		return expiration < now;
	}, [pollData]);

	const voteCounts = useMemo(() => {
		const pollDataAny = pollData as Record<string, unknown>;
		if (pollDataAny?.answer_counts && Array.isArray(pollDataAny.answer_counts)) {
			return pollDataAny.answer_counts as number[];
		}
		return new Array(answers.length).fill(0);
	}, [pollData, answers.length]);

	const reduxMyVote = useAppSelector(selectMyVote);

	const votedAnswers = useMemo(() => {
		if (uiVotedIndices !== null) return uiVotedIndices;
		const pollDataAny = pollData as Record<string, unknown>;
		if (currentUserId && pollDataAny?.voter_details && Array.isArray(pollDataAny.voter_details)) {
			const userVotes: number[] = [];
			pollDataAny.voter_details.forEach((detail: unknown, index: number) => {
				const detailObj = detail as Record<string, unknown>;
				if (detailObj.user_ids && Array.isArray(detailObj.user_ids) && detailObj.user_ids.includes(currentUserId)) {
					userVotes.push((detailObj.answer_index as number) ?? index);
				}
			});
			if (userVotes.length > 0) return userVotes;
		}

		return messageId ? (reduxMyVote?.[messageId] ?? []) : [];
	}, [pollData, currentUserId, uiVotedIndices, messageId, reduxMyVote]);

	const voterMembers = useAppSelector((state) => (isDirect ? selectGroupMembersEntities(state, channelId ?? '') : selectEntitesUserClans(state)));

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
				result[answerIndex] = userIds.map((userId) => resolvePollVoter(state, voterMembers, userId));
			}
		});

		return result;
	}, [pollData, answers.length, voterMembers]);

	const hasVoted = useMemo(() => {
		return votedAnswers.length > 0;
	}, [votedAnswers]);

	const canSelectAnswers = !interactionDisabled && !hasVoted && !showResults && !isClosed && !isExpired;
	const shouldShowResults = interactionDisabled || hasVoted || showResults || isClosed || isExpired;

	const totalVotes = useMemo(() => voteCounts.reduce((sum, count) => sum + count, 0), [voteCounts]);

	const timeRemainingLabel = useMemo(() => {
		const pollDataAny = pollData as Record<string, unknown> | undefined;
		const expireRaw = pollDataAny?.expire_at;
		if (expireRaw === undefined || expireRaw === null) {
			return duration.trim();
		}
		const ts = Number(expireRaw);
		if (!Number.isFinite(ts)) {
			return duration.trim();
		}
		const now = Math.floor(Date.now() / 1000);
		const diff = ts - now;
		if (diff <= 0) {
			return '';
		}
		const days = Math.floor(diff / (60 * 60 * 24));
		const hours = Math.floor((diff % (60 * 60 * 24)) / (60 * 60));
		const minutes = Math.floor((diff % (60 * 60)) / 60);
		if (days > 0) return t('poll.durationDays', { count: days });
		if (hours > 0) return t('poll.durationHours', { count: hours });
		if (minutes > 0) return t('poll.durationMinutes', { count: minutes });
		return t('poll.durationLessThanMinute');
	}, [pollData, duration, t]);

	const handleAnswerToggle = (index: number) => {
		if (!canSelectAnswers) return;

		if (allowMultipleAnswers) {
			setSelectedAnswers((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]));
		} else {
			setSelectedAnswers((prev) => (prev.length === 1 && prev[0] === index ? [] : [index]));
		}
	};

	const handleVote = async () => {
		if (interactionDisabled || selectedAnswers.length === 0 || !messageId || !channelId) {
			return;
		}

		try {
			setIsVoting(true);
			await dispatch(
				votePoll({
					message_id: messageId,
					channel_id: channelId,
					answer_indices: selectedAnswers
				})
			).unwrap();

			setUiVotedIndices(selectedAnswers);
			setSelectedAnswers([]);
			setShowResults(false);
		} catch (error) {
			console.error('Failed to vote:', error);
		} finally {
			setIsVoting(false);
		}
	};

	const handleRemoveVote = async () => {
		if (interactionDisabled || !messageId || !channelId) return;

		try {
			setIsClosing(true);
			await dispatch(
				votePoll({
					message_id: messageId,
					channel_id: channelId,
					answer_indices: []
				})
			).unwrap();

			setUiVotedIndices([]);
			setSelectedAnswers([]);
			setShowResults(false);
		} catch (error) {
			console.error('Failed to remove vote:', error);
		} finally {
			setIsClosing(false);
		}
	};

	const getPercentage = (count: number) => {
		if (totalVotes === 0) return 0;
		return Math.round((count / totalVotes) * 100);
	};

	const openDetailModal = (optionIndex: number) => {
		if (interactionDisabled) return;
		setDetailModalSelectedIndex(optionIndex);
		setIsDetailModalOpen(true);
		if (messageId && channelId) {
			setIsLoadingPollDetail(true);
			dispatch(getPoll({ message_id: messageId, channel_id: channelId }))
				.unwrap()
				.then((response) => {
					const pollDataRaw = response as unknown as Record<string, unknown>;
					const voterDetails = pollDataRaw?.voter_details;
					if (!Array.isArray(voterDetails)) {
						setDetailVotersByOption(undefined);
						return;
					}
					const result: PollVoter[][] = Array.from({ length: answers.length }, () => []);
					const state = getStore().getState();
					voterDetails.forEach((detail: unknown) => {
						const detailObj = detail as Record<string, unknown>;
						const answerIndex = (detailObj.answer_index as number) ?? 0;
						const userIds = (detailObj.user_ids as string[]) ?? [];
						if (answerIndex >= 0 && answerIndex < answers.length) {
							result[answerIndex] = userIds.map((userId) => resolvePollVoter(state, voterMembers, userId));
						}
					});
					setDetailVotersByOption(result);
				})
				.catch(() => setDetailVotersByOption(undefined))
				.finally(() => setIsLoadingPollDetail(false));
		}
	};

	return (
		<div className="block w-full">
			<div className="max-w-[420px] rounded bg-item-theme p-3 border-theme-primary">
				<div className="flex items-center gap-2 mb-1">
					<h3
						className="text-[15px] font-semibold text-theme-primary-active break-all flex-1 min-w-0"
						data-e2e={generateE2eId('poll.card.question')}
					>
						{question}
					</h3>
					{(isClosed || isExpired) && (
						<span
							className="px-2 py-0.5 text-xs font-semibold rounded bg-red-500/10 text-red-500 flex-shrink-0"
							data-e2e={generateE2eId('poll.card.ended')}
						>
							{t('poll.ended', { defaultValue: 'Poll Ended' })}
						</span>
					)}
				</div>

				{/* Subtitle */}
				{!interactionDisabled && (
					<p className="text-xs text-theme-primary mb-3" data-e2e={generateE2eId('poll.card.answer_description')}>
						{isClosed || isExpired
							? t('poll.finalResults', { defaultValue: 'Final results' })
							: allowMultipleAnswers
								? t('poll.selectOneOrMore')
								: t('poll.selectOne')}
					</p>
				)}

				{/* Answers */}
				<div className="space-y-2 mb-3 max-h-[280px] overflow-y-auto overflow-x-hidden pr-1 thread-scroll">
					{answers.map((answer, index) => {
						const voteCount = voteCounts[index];
						const percentage = getPercentage(voteCount);
						const isVoted = votedAnswers.includes(index);

						const canToggleAnswer = !shouldShowResults && !interactionDisabled;
						return (
							<div
								key={index}
								onClick={canToggleAnswer ? () => handleAnswerToggle(index) : undefined}
								className={`relative flex items-center justify-between px-3 py-2.5 rounded border overflow-hidden transition-colors ${
									shouldShowResults
										? 'border-theme-primary cursor-default pointer-events-none'
										: interactionDisabled
											? '[background:var(--bg-item-hover)] border-transparent cursor-default pointer-events-none'
											: selectedAnswers.includes(index)
												? '[background:var(--bg-item-hover)] border-[var(--text-theme-primary)] hover:[background:var(--bg-active-member-channel)] hover:brightness-105 cursor-pointer'
												: '[background:var(--bg-item-hover)] border-transparent cursor-pointer'
								}`}
								data-e2e={generateE2eId('poll.card.answer')}
							>
								{shouldShowResults && (
									<div className="absolute inset-y-0 left-0 rounded-l min-w-0 overflow-hidden " style={{ width: `${percentage}%` }}>
										<div
											className="poll-bar-inner absolute inset-0 origin-left scale-x-0 rounded-l bg-blue-600"
											style={{ animationDelay: `${index * 0.2}s` }}
										/>
									</div>
								)}
								<div className="relative z-10 flex items-center gap-2 min-w-0 flex-1 justify-center">
									<span className={`text-sm font-medium text-theme-primary-active break-words min-w-0 flex-1 line-clamp-3`}>
										{renderPollTextWithEmoji(answer, {
											textPartClassName: 'poll-option-text ml-1',
											emojiPartClassName: 'poll-option-emoji '
										})}
									</span>
								</div>
								<div className="relative z-10 flex items-center gap-3 flex-shrink-0 pl-2">
									{shouldShowResults && (
										<span
											className={`poll-percent-text text-xs font-semibold ${isVoted ? 'text-theme-primary-active' : 'text-theme-primary-active'}`}
											style={{ animationDelay: `${index * 0.1 + 0.25}s` }}
										>
											{percentage}% {voteCount} {voteCount < 2 ? t('poll.vote') : t('poll.votes')}
										</span>
									)}
									{canSelectAnswers && (
										<div
											className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 border-[var(--text-theme-primary)]`}
										>
											{selectedAnswers.includes(index) && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
										</div>
									)}
									{hasVoted && isVoted && (
										<div
											className="w-5 h-5 rounded-full bg-theme-primary flex items-center justify-center flex-shrink-0"
											data-e2e={generateE2eId('poll.card.voted')}
										>
											<svg className="w-3 h-3 text-theme-primary-active" viewBox="0 0 12 12" fill="none">
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
				<div className="flex items-start justify-between gap-2 pt-1 min-w-0">
					<span className="text-xs text-theme-primary min-w-0 flex-1 break-words">
						{interactionDisabled ? (
							<span data-e2e={generateE2eId('poll.card.total_votes')}>
								{totalVotes} {totalVotes < 2 ? t('poll.vote') : t('poll.votes')}
							</span>
						) : (
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
								data-e2e={generateE2eId('poll.card.total_votes')}
							>
								{totalVotes} {totalVotes < 2 ? t('poll.vote') : t('poll.votes')}
							</span>
						)}
						{!isClosed && !isExpired && (timeRemainingLabel || duration) && (
							<>
								{' '}
								• {timeRemainingLabel || duration} {t('poll.left')}
							</>
						)}
					</span>
					{!interactionDisabled && (
						<div className="flex flex-shrink-0 gap-2">
							{!hasVoted && !isClosed && !isExpired && (
								<button
									type="button"
									onClick={() => setShowResults((prev) => !prev)}
									className="px-1 py-1.5 text-sm font-medium border-theme-primary text-theme-primary hover:text-theme-primary-active rounded transition-colors"
									data-e2e={generateE2eId('poll.card.button.show_result')}
								>
									{showResults ? t('poll.backToVote') : t('poll.showResults')}
								</button>
							)}
							{!hasVoted && !showResults && !isClosed && !isExpired && (
								<button
									type="button"
									onClick={handleVote}
									disabled={selectedAnswers.length === 0 || isVoting || isClosing}
									className="px-4 py-1.5 text-sm font-medium rounded transition-colors bg-buttonPrimary hover:bg-buttonPrimaryHover text-theme-primary-active disabled:opacity-50 disabled:cursor-not-allowed"
									data-e2e={generateE2eId('poll.card.button.vote')}
								>
									{t('poll.voteButton')}
								</button>
							)}
							{hasVoted && !isClosed && !isExpired && (
								<button
									type="button"
									onClick={handleRemoveVote}
									disabled={isVoting || isClosing}
									className="px-4 py-1.5 text-sm font-medium text-theme-primary rounded transition-colors border-theme-primary bg-button-secondary bg-secondary-button-hover disabled:opacity-50"
									data-e2e={generateE2eId('poll.card.button.remove_vote')}
								>
									{t('poll.removeVote')}
								</button>
							)}
						</div>
					)}
				</div>
			</div>

			<PollDetailModal
				open={!interactionDisabled && isDetailModalOpen}
				onClose={() => setIsDetailModalOpen(false)}
				question={question}
				answers={answers}
				voteCounts={voteCounts}
				totalVotes={totalVotes}
				votersByOption={detailVotersByOption ?? votersByOptionFromApi ?? votersByOption}
				initialSelectedIndex={detailModalSelectedIndex}
				votedAnswers={votedAnswers}
				loading={isLoadingPollDetail}
			/>
		</div>
	);
};
