import type { JoinPendingItem } from '@mezon/store';
import { CLAN_JOIN_MODE_INSTANT, CLAN_JOIN_MODE_REQUEST_APPROVAL, clansActions, selectCurrentClan, toastActions, useAppDispatch } from '@mezon/store';
import { MezonIcon, MzIcons48 } from '@mezon/ui';
import { createImgproxyUrl, generateE2eId, getDateLocale } from '@mezon/utils';
import { formatDistanceToNow } from 'date-fns';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { AvatarImage } from '../../AvatarImage/AvatarImage';

type JoinRequestsProps = {
	currentClanId: string;
};

const PAGE_LIMIT = 50;

const JoinRequests = ({ currentClanId }: JoinRequestsProps) => {
	const dispatch = useAppDispatch();
	const { t, i18n } = useTranslation('clanSettings');
	const currentClan = useSelector(selectCurrentClan);

	const [joinMode, setJoinMode] = useState<number>(currentClan?.join_mode ?? CLAN_JOIN_MODE_INSTANT);
	const [savingJoinMode, setSavingJoinMode] = useState<boolean>(false);
	const isCommunity = Boolean(currentClan?.is_community);
	const [items, setItems] = useState<JoinPendingItem[]>([]);
	const [cursor, setCursor] = useState<string>('');
	const [loading, setLoading] = useState<boolean>(true);
	const [loadingMore, setLoadingMore] = useState<boolean>(false);
	const [fetchError, setFetchError] = useState<boolean>(false);
	const [reviewingUserId, setReviewingUserId] = useState<string | null>(null);

	useEffect(() => {
		setJoinMode(currentClan?.join_mode ?? CLAN_JOIN_MODE_INSTANT);
	}, [currentClan?.clan_id, currentClan?.join_mode]);

	const handleChangeJoinMode = async (nextMode: number) => {
		if (!currentClanId || !currentClan || savingJoinMode || nextMode === joinMode) return;
		const prevMode = joinMode;
		setJoinMode(nextMode);
		setSavingJoinMode(true);
		try {
			await dispatch(
				clansActions.updateClan({
					clan_id: currentClanId,
					request: {
						banner: currentClan.banner ?? '',
						clan_name: currentClan.clan_name ?? '',
						creator_id: currentClan.creator_id ?? '',
						logo: currentClan.logo ?? '',
						welcome_channel_id: currentClan.welcome_channel_id ?? '',
						prevent_anonymous: !!currentClan.prevent_anonymous,
						join_mode: nextMode
					}
				})
			).unwrap();
		} catch (error) {
			console.error('Failed to update join mode:', error);
			setJoinMode(prevMode);
			dispatch(
				toastActions.addToast({
					message: t('joinRequests.reviewError'),
					type: 'error',
					autoClose: 3000
				})
			);
		} finally {
			setSavingJoinMode(false);
		}
	};

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
							message: t('joinRequests.fetchError'),
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
					message: approve ? t('joinRequests.approveSuccess') : t('joinRequests.rejectSuccess'),
					type: 'success',
					autoClose: 3000
				})
			);
		} catch (error) {
			console.error('Failed to review join request:', error);
			dispatch(
				toastActions.addToast({
					message: t('joinRequests.reviewError'),
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
			<div className="flex flex-col gap-3 mb-8" data-e2e={generateE2eId('clan_page.settings.overview.join_mode')}>
				<h3 className="text-sm font-bold uppercase">{t('joinMode.title')}</h3>
				<div className="flex flex-col gap-2">
					<label
						className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
							joinMode === CLAN_JOIN_MODE_INSTANT
								? 'border-indigo-500 bg-item-theme'
								: 'border-theme-primary bg-theme-setting-nav hover:bg-item-theme'
						} ${savingJoinMode ? 'opacity-60 pointer-events-none' : ''}`}
					>
						<input
							type="radio"
							name="clan-join-mode"
							disabled={savingJoinMode}
							checked={joinMode === CLAN_JOIN_MODE_INSTANT}
							onChange={() => handleChangeJoinMode(CLAN_JOIN_MODE_INSTANT)}
							className="mt-1 accent-indigo-500 cursor-pointer"
						/>
						<div className="flex flex-col">
							<span className="text-sm font-medium text-theme-primary-active">{t('joinMode.instantTitle')}</span>
							<span className="text-xs text-theme-primary">{t('joinMode.instantDesc')}</span>
						</div>
					</label>
					<label
						className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
							joinMode === CLAN_JOIN_MODE_REQUEST_APPROVAL
								? 'border-indigo-500 bg-item-theme'
								: 'border-theme-primary bg-theme-setting-nav hover:bg-item-theme'
						} ${savingJoinMode ? 'opacity-60 pointer-events-none' : ''}`}
					>
						<input
							type="radio"
							name="clan-join-mode"
							disabled={savingJoinMode}
							checked={joinMode === CLAN_JOIN_MODE_REQUEST_APPROVAL}
							onChange={() => handleChangeJoinMode(CLAN_JOIN_MODE_REQUEST_APPROVAL)}
							className="mt-1 accent-indigo-500 cursor-pointer"
						/>
						<div className="flex flex-col">
							<span className="text-sm font-medium text-theme-primary-active">{t('joinMode.requestTitle')}</span>
							<span className="text-xs text-theme-primary">{t('joinMode.requestDesc')}</span>
						</div>
					</label>
				</div>
				<p
					className={
						isCommunity
							? 'text-xs rounded-md px-3 py-2 border border-amber-500/40 bg-amber-500/10 text-amber-500'
							: 'text-xs text-theme-primary opacity-75'
					}
				>
					{t('joinMode.communityNote')}
				</p>
			</div>

			<div className="border-t-theme-primary pt-8">
				<div className="flex items-start justify-between gap-4 mb-6">
					<p className="text-base text-theme-primary max-w-2xl">{t('joinRequests.description')}</p>
					<button
						type="button"
						onClick={() => fetchRequests('', false)}
						disabled={loading}
						className="flex-shrink-0 px-3 py-1.5 rounded text-sm font-medium border-theme-primary bg-item-theme hover:bg-item-theme-hover text-theme-primary-active transition disabled:opacity-50"
					>
						{t('joinRequests.refresh')}
					</button>
				</div>

				{loading ? (
					<div className="flex items-center justify-center py-12 text-theme-primary opacity-70">
						<p className="text-base font-medium">{t('joinRequests.loading')}</p>
					</div>
				) : fetchError ? (
					<div className="flex flex-col items-center justify-center gap-3 py-12 text-theme-primary">
						<p className="text-base font-medium opacity-80">{t('joinRequests.fetchError')}</p>
						<button
							type="button"
							onClick={() => fetchRequests('', false)}
							className="px-4 py-1.5 rounded bg-[#5865f2] hover:bg-[#4752c4] text-white font-semibold text-sm transition"
						>
							{t('joinRequests.retry')}
						</button>
					</div>
				) : items.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-12 text-theme-primary opacity-60">
						<MezonIcon icon={MzIcons48.mzChannel} className="mb-3 text-[var(--mz-icon)]" />
						<p className="text-base font-medium">{t('joinRequests.emptyState')}</p>
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
													{t('joinRequests.requested')} {requestedAgo}
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
											{t('joinRequests.reject')}
										</button>
										<button
											type="button"
											disabled={Boolean(reviewingUserId)}
											onClick={() => handleReview(item.user_id, true)}
											className="px-4 py-1.5 rounded bg-[#5865f2] hover:bg-[#4752c4] text-white font-semibold text-sm transition disabled:opacity-50"
										>
											{isBusy ? t('joinRequests.loading') : t('joinRequests.approve')}
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
									{loadingMore ? t('joinRequests.loading') : t('joinRequests.loadMore')}
								</button>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
};

export default JoinRequests;
