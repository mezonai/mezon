import {
	VOICE_JOIN_WAITING_TIMEOUT_MS,
	isVoiceJoinNotFoundError,
	selectVoiceWaitingUsersByChannelId,
	toastActions,
	useAppDispatch,
	useAppSelector,
	voiceActions
} from '@mezon/store';
import { createImgproxyUrl } from '@mezon/utils';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AvatarImage } from '../../AvatarImage/AvatarImage';

interface VoiceWaitingBannerProps {
	channelId: string;
	enabled: boolean;
}

export const VoiceWaitingBanner = ({ channelId, enabled }: VoiceWaitingBannerProps) => {
	const dispatch = useAppDispatch();
	const { t } = useTranslation('common');
	const waitingUsers = useAppSelector((state) => selectVoiceWaitingUsersByChannelId(state, channelId));
	const [busyUserId, setBusyUserId] = useState<string | null>(null);

	useEffect(() => {
		if (!enabled || waitingUsers.length === 0) return;
		const now = Date.now();
		let earliestDelay = Number.POSITIVE_INFINITY;
		for (const user of waitingUsers) {
			if (!user.receivedAt) continue;
			const remaining = user.receivedAt + VOICE_JOIN_WAITING_TIMEOUT_MS - now;
			if (remaining < earliestDelay) {
				earliestDelay = remaining;
			}
		}
		if (!Number.isFinite(earliestDelay)) return;
		const timer = window.setTimeout(
			() => {
				dispatch(voiceActions.pruneExpiredVoiceWaitingUsers({ channelId, now: Date.now() }));
			},
			Math.max(0, earliestDelay)
		);
		return () => window.clearTimeout(timer);
	}, [channelId, dispatch, enabled, waitingUsers]);

	if (!enabled || waitingUsers.length === 0) {
		return null;
	}

	const handleReview = async (userId: string, approve: boolean) => {
		if (busyUserId) return;
		setBusyUserId(userId);
		try {
			await dispatch(voiceActions.reviewVoiceJoin({ channelId, userId, approve })).unwrap();
		} catch (error) {
			if (isVoiceJoinNotFoundError(error)) {
				dispatch(
					toastActions.addToast({
						message: t('voiceWaiting.requestExpired', 'This join request has expired or was already handled.'),
						type: 'info',
						autoClose: 3000
					})
				);
				return;
			}
			console.error('Failed to review voice join request:', error);
			dispatch(
				toastActions.addToast({
					message: t('voiceWaiting.reviewError', 'Failed to review voice join request.'),
					type: 'error',
					autoClose: 3000
				})
			);
		} finally {
			setBusyUserId(null);
		}
	};

	return (
		<div className="pointer-events-auto absolute left-1/2 top-3 z-30 flex w-full max-w-md -translate-x-1/2 flex-col gap-2 px-3">
			{waitingUsers.map((user) => {
				const label = user.display_name?.trim() || user.username?.trim() || user.user_id;
				const isBusy = busyUserId === user.user_id;
				return (
					<div
						key={user.user_id}
						className="flex items-center justify-between gap-3 rounded-xl border border-white/15 bg-zinc-900/95 px-3.5 py-2.5 text-white shadow-xl backdrop-blur-md"
					>
						<div className="flex min-w-0 flex-1 items-center gap-2.5">
							<AvatarImage
								alt={label}
								username={user.username || label}
								className="h-8 w-8 shrink-0 rounded-full"
								srcImgProxy={createImgproxyUrl(user.avatar ?? '', {
									width: 80,
									height: 80,
									resizeType: 'fill-down'
								})}
								src={user.avatar ?? ''}
							/>
							<div className="min-w-0 flex-1">
								<div className="truncate text-sm font-semibold">{label}</div>
								<div className="truncate text-xs text-zinc-300">
									{t('voiceWaiting.wantsToJoin', 'Wants to join this voice channel')}
								</div>
							</div>
						</div>
						<div className="flex shrink-0 items-center gap-1.5">
							<button
								type="button"
								disabled={Boolean(busyUserId)}
								onClick={() => void handleReview(user.user_id, false)}
								className="rounded-lg border border-red-400/50 px-2.5 py-1 text-xs font-semibold text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
							>
								{t('voiceWaiting.decline', 'Decline')}
							</button>
							<button
								type="button"
								disabled={Boolean(busyUserId)}
								onClick={() => void handleReview(user.user_id, true)}
								className="rounded-lg bg-green-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-green-500 disabled:opacity-50"
							>
								{isBusy ? '...' : t('voiceWaiting.admit', 'Admit')}
							</button>
						</div>
					</div>
				);
			})}
		</div>
	);
};
