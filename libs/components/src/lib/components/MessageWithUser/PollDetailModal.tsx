import { useEscapeKeyClose } from '@mezon/core';
import { Icons } from '@mezon/ui';
import { createImgproxyUrl } from '@mezon/utils';
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { AvatarImage } from '../AvatarImage/AvatarImage';
import type { PollVoter } from './PollMessage';
import { renderPollTextWithEmoji } from './PollMessage';

const POLL_DETAIL_OPTIONS_SCROLL_AFTER = 5;

export type PollDetailModalProps = {
	open: boolean;
	onClose: () => void;
	question: string;
	answers: string[];
	voteCounts: number[];
	totalVotes: number;
	votersByOption?: PollVoter[][];
	initialSelectedIndex?: number;
	votedAnswers?: number[];
	loading?: boolean;
};

export const PollDetailModal = ({
	open,
	onClose,
	question,
	answers,
	voteCounts,
	totalVotes,
	votersByOption,
	initialSelectedIndex = 0,
	votedAnswers = [],
	loading = false
}: PollDetailModalProps): ReactNode => {
	const { t } = useTranslation('message');
	const [selectedIndex, setSelectedIndex] = useState(initialSelectedIndex);
	const modalRef = useRef<HTMLDivElement>(null);

	useEscapeKeyClose(modalRef, onClose);

	useEffect(() => {
		if (open) setSelectedIndex(initialSelectedIndex);
	}, [open, initialSelectedIndex]);

	useEffect(() => {
		if (!open) return;
		const prev = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = prev;
		};
	}, [open]);

	if (!open) return null;

	const detailVoters = votersByOption?.[selectedIndex] ?? [];

	const modalContent = (
		<>
			<div className="fixed inset-0 z-50 bg-modal-overlay" onClick={onClose} />
			<div
				ref={modalRef}
				tabIndex={-1}
				className="fixed inset-0 z-50 flex items-center justify-center p-4"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="bg-theme-primary rounded-lg w-full min-w-[600px] min-h-[700px] max-w-[620px] shadow-xl flex flex-col max-h-[85vh] overflow-hidden">
					<div className="border-b border-theme-primary p-4">
						<div className="flex items-start justify-between gap-3 flex-shrink-0">
							<h3 className="text-xl font-bold text-theme-primary-active break-all min-w-0 flex-1">{question}</h3>
							<button
								type="button"
								onClick={onClose}
								className="p-2 rounded-md border border-transparent text-theme-primary hover:text-theme-primary-active hover:border-theme-primary bg-item-theme-hover transition-colors flex-shrink-0"
							>
								<Icons.Close className="w-6 h-6" />
							</button>
						</div>

						<div className="pt-2 flex-shrink-0">
							<p className="text-xm text-theme-primary">
								{totalVotes} {totalVotes < 2 ? t('poll.vote') : t('poll.votes')}
							</p>
						</div>
					</div>

					<div className="flex flex-1 min-h-0 py-4 border-theme-primary">
						<div className="w-[35%] min-h-0 border-r-theme-primary flex flex-col overflow-hidden">
							<div
								className={
									answers.length > POLL_DETAIL_OPTIONS_SCROLL_AFTER
										? 'max-h-[280px] overflow-y-auto overflow-x-hidden px-4 pr-2 thread-scroll'
										: 'overflow-y-auto overflow-x-hidden px-4 pr-2 thread-scroll'
								}
							>
								{answers.map((answer, index) => {
									const count = voteCounts[index];
									const isSelected = selectedIndex === index;
									const isVoted = votedAnswers.includes(index);
									return (
										<button
											key={index}
											type="button"
											onClick={() => setSelectedIndex(index)}
											className={`w-full text-left bg-theme-primary flex mb-1 items-center gap-2 px-3 py-2.5 rounded transition-colors border ${
												isSelected
													? 'text-theme-primary-active [background:var(--bg-active-member-channel)] border-theme-primary transition-colors'
													: isVoted
														? 'text-theme-primary border-theme-primary bg-item-theme-hover hover:text-theme-primary-active'
														: 'text-theme-primary hover:text-theme-primary-active hover:border-theme-primary bg-item-theme-hover border-transparent transition-colors'
											}`}
										>
											<span className="text-lg font-medium truncate flex-1 min-w-0">{renderPollTextWithEmoji(answer)}</span>
											<span className="text-xs text-theme-muted flex-shrink-0">({count})</span>
										</button>
									);
								})}
							</div>
						</div>

						<div className="flex-1 flex flex-col overflow-hidden">
							<div className="overflow-y-auto overflow-x-hidden p-3 pr-2 thread-scroll">
								{loading ? (
									<p className="text-lg text-theme-primary">{t('poll.loadingVoterDetails', { defaultValue: 'Loading...' })}</p>
								) : detailVoters.length === 0 ? (
									<p className="text-lg text-theme-primary">{t('poll.noVoterDetails')}</p>
								) : (
									<ul className="space-y-2">
										{detailVoters.map((voter, i) => (
											<li key={i} className="flex items-center gap-3">
												<AvatarImage
													alt={voter.displayName}
													username={voter.username}
													className="w-10 h-10 flex-shrink-0 rounded-full object-cover"
													src={voter.avatar}
													srcImgProxy={
														voter.avatar
															? createImgproxyUrl(voter.avatar, { width: 80, height: 80, resizeType: 'fit' })
															: undefined
													}
												/>
												<div className="min-w-0 flex-1">
													<p className="text-sm font-medium text-theme-primary truncate">{voter.displayName}</p>
													<p className="text-xs text-theme-primary truncate">{voter.username}</p>
												</div>
											</li>
										))}
									</ul>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	);

	return createPortal(modalContent, document.body) as ReactNode;
};
