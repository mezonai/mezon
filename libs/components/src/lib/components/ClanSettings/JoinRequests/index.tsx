import type { JoinPendingItem } from '@mezon/store';
import { clansActions, toastActions, useAppDispatch } from '@mezon/store';
import { MezonIcon, MzIcons48 } from '@mezon/ui';
import { createImgproxyUrl, getDateLocale } from '@mezon/utils';
import { formatDistanceToNow } from 'date-fns';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AvatarImage } from '../../AvatarImage/AvatarImage';

type JoinRequestsProps = {
	currentClanId: string;
};

const PAGE_LIMIT = 50;

const JoinRequests = ({ currentClanId }: JoinRequestsProps) => {
	const dispatch = useAppDispatch();
	const { t, i18n } = useTranslation('clanSettings', { keyPrefix: 'joinRequests' });

	const [items, setItems] = useState<JoinPendingItem[]>([]);
	const [cursor, setCursor] = useState<string>('');
	const [loading, setLoading] = useState<boolean>(true);
	const [loadingMore, setLoadingMore] = useState<boolean>(false);
	const [fetchError, setFetchError] = useState<boolean>(false);
	const [reviewingUserId, setReviewingUserId] = useState<string | null>(null);

	const fetchRequests = useCallback(
		async (nextCursor = '', append = false) => {
			if (!currentClanId) return;
			if (append) {
				setLoadingMore(true);
			} else {
				setLoading(true);
				setFetchError(false);
			}
			try {
				const res = await dispatch(
					clansActions.listJoinPending({
						clan_id: currentClanId,
						limit: PAGE_LIMIT,
						cursor: nextCursor
					})
				).unwrap();
				const fetchedItems = res.items ?? [];
				setItems((prev) => (append ? [...prev, ...fetchedItems] : fetchedItems));
				setCursor(res.cursor ?? '');
			} catch (error) {
				console.error('Failed to load pending join requests:', error);
				if (!append) {
					setFetchError(true);
					setItems([]);
					setCursor('');
				} else {
					dispatch(
						toastActions.addToast({
							message: t('fetchError'),
							type: 'error',
							autoClose: 3000
						})
					);
				}
			} finally {
				if (append) {
					setLoadingMore(false);
				} else {
					setLoading(false);
				}
			}
		},
		[currentClanId, dispatch, t]
	);

	useEffect(() => {
		fetchRequests('', false);
	}, [fetchRequests]);

	const handleReview = async (userId: string, approve: boolean) => {
		if (!currentClanId || !userId || reviewingUserId) return;
		setReviewingUserId(userId);
		try {
			await dispatch(
				clansActions.reviewJoinPending({
					clan_id: currentClanId,
					user_id: userId,
					approve
				})
			).unwrap();
			setItems((prev) => prev.filter((item) => item.user_id !== userId));
			dispatch(
				toastActions.addToast({
					message: approve ? t('approveSuccess') : t('rejectSuccess'),
					type: 'success',
					autoClose: 3000
				})
			);
		} catch (error) {
			console.error('Failed to review join request:', error);
			dispatch(
				toastActions.addToast({
					message: t('reviewError'),
					type: 'error',
					autoClose: 3000
				})
			);
		} finally {
			setReviewingUserId(null);
		}
	};

	return (
		<div className="pt-2 pb-10">
			<div className="flex items-start justify-between gap-4 mb-6">
				<p className="text-base text-theme-primary max-w-2xl">{t('description')}</p>
				<button
					type="button"
					onClick={() => fetchRequests('', false)}
					disabled={loading}
					className="flex-shrink-0 px-3 py-1.5 rounded text-sm font-medium border-theme-primary bg-item-theme hover:bg-item-theme-hover text-theme-primary-active transition disabled:opacity-50"
				>
					{t('refresh')}
				</button>
			</div>

			{loading ? (
				<div className="flex items-center justify-center py-12 text-theme-primary opacity-70">
					<p className="text-base font-medium">{t('loading')}</p>
				</div>
			) : fetchError ? (
				<div className="flex flex-col items-center justify-center gap-3 py-12 text-theme-primary">
					<p className="text-base font-medium opacity-80">{t('fetchError')}</p>
					<button
						type="button"
						onClick={() => fetchRequests('', false)}
						className="px-4 py-1.5 rounded bg-[#5865f2] hover:bg-[#4752c4] text-white font-semibold text-sm transition"
					>
						{t('retry')}
					</button>
				</div>
			) : items.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-12 text-theme-primary opacity-60">
					<MezonIcon icon={MzIcons48.mzChannel} className="mb-3 text-[var(--mz-icon)]" />
					<p className="text-base font-medium">{t('emptyState')}</p>
				</div>
			) : (
				<div className="flex flex-col gap-3">
					{items.map((item) => {
						const primaryName = item.display_name?.trim() || item.username?.trim() || item.user_id;
						const secondaryUsername =
							item.username?.trim() && item.display_name?.trim() && item.username.trim() !== item.display_name.trim()
								? `@${item.username.trim()}`
								: '';
						const requestedAgo =
							item.create_time_seconds && item.create_time_seconds > 0
								? formatDistanceToNow(Number(item.create_time_seconds) * 1000, {
										addSuffix: true,
										locale: getDateLocale(i18n.language)
									})
								: '';
						const isBusy = reviewingUserId === item.user_id;

						return (
							<div
								key={item.id || item.user_id}
								className="flex items-center justify-between gap-4 bg-item-theme rounded-lg px-4 py-3 shadow"
							>
								<div className="flex items-center gap-3 min-w-0 flex-1">
									<AvatarImage
										alt={primaryName}
										username={item.username || primaryName}
										className="w-10 h-10 rounded-full flex-shrink-0"
										srcImgProxy={createImgproxyUrl(item.avatar_url ?? '', {
											width: 100,
											height: 100,
											resizeType: 'fill-down'
										})}
										src={item.avatar_url ?? ''}
									/>
									<div className="min-w-0 flex-1">
										<div className="flex items-center gap-2 min-w-0">
											<span className="font-semibold text-theme-primary-active text-base truncate">{primaryName}</span>
											{secondaryUsername && (
												<span className="text-xs text-theme-primary opacity-70 truncate">{secondaryUsername}</span>
											)}
										</div>
										{requestedAgo && (
											<div className="text-xs text-theme-primary opacity-75 mt-0.5">
												{t('requested')} {requestedAgo}
											</div>
										)}
									</div>
								</div>

								<div className="flex items-center gap-2 flex-shrink-0">
									<button
										type="button"
										disabled={Boolean(reviewingUserId)}
										onClick={() => handleReview(item.user_id, false)}
										className="px-3.5 py-1.5 rounded border border-red-500/60 text-red-500 hover:bg-red-500/10 font-semibold text-sm transition disabled:opacity-50"
									>
										{t('reject')}
									</button>
									<button
										type="button"
										disabled={Boolean(reviewingUserId)}
										onClick={() => handleReview(item.user_id, true)}
										className="px-4 py-1.5 rounded bg-[#5865f2] hover:bg-[#4752c4] text-white font-semibold text-sm transition disabled:opacity-50"
									>
										{isBusy ? t('loading') : t('approve')}
									</button>
								</div>
							</div>
						);
					})}

					{cursor && (
						<div className="flex justify-center pt-2">
							<button
								type="button"
								disabled={loadingMore}
								onClick={() => fetchRequests(cursor, true)}
								className="px-4 py-2 rounded border-theme-primary bg-item-theme hover:bg-item-theme-hover text-theme-primary-active font-medium text-sm transition disabled:opacity-50"
							>
								{loadingMore ? t('loading') : t('loadMore')}
							</button>
						</div>
					)}
				</div>
			)}
		</div>
	);
};

export default JoinRequests;
