import { useInvite } from '@mezon/core';
import {
	clansActions,
	inviteActions,
	referencesActions,
	selectCurrentChannelId,
	selectCurrentDmId,
	selectOgpPreview,
	useAppDispatch
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import type { IInvite } from '@mezon/utils';
import { INVITE_URL_REGEX, isFacebookLink, isTikTokLink, isYouTubeLink } from '@mezon/utils';
import { memo, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useFetchClanBanner } from '../../hooks';
import type { InviteBannerData, PreviewData } from './types';

type PreviewOgpProps = {
	contextId?: string;
};

function PreviewOgp({ contextId }: PreviewOgpProps) {
	const { t } = useTranslation('linkMessageInvite');
	const ogpLink = useSelector(selectOgpPreview);
	const currentChannelId = useSelector(selectCurrentChannelId);
	const currentDmId = useSelector(selectCurrentDmId);
	const dispatch = useAppDispatch();
	const navigate = useNavigate();
	const { inviteUser } = useInvite();
	const [loading, setLoading] = useState(false);
	const [joiningInvite, setJoiningInvite] = useState(false);

	const [data, setData] = useState<PreviewData | null>(null);
	const { fetchClanBannerById } = useFetchClanBanner();

	const resolveInviteBanner = useCallback((invite: InviteBannerData): string => {
		return invite?.banner || invite?.clan_banner || '';
	}, []);

	useEffect(() => {
		if (!ogpLink || !ogpLink.url) {
			setData(null);
			dispatch(referencesActions.clearOgpData());
			setLoading(false);
			return;
		}

		const isSocialMediaLink = isYouTubeLink(ogpLink.url) || isFacebookLink(ogpLink.url) || isTikTokLink(ogpLink.url);
		if (isSocialMediaLink) {
			setData(null);
			dispatch(referencesActions.clearOgpData());
			setLoading(false);
			return;
		}

		const controller = new AbortController();
		const { signal } = controller;

		const timeoutId = setTimeout(async () => {
			try {
				setLoading(true);
				const inviteMatch = ogpLink.url.match(INVITE_URL_REGEX);
				let previewData: PreviewData;

				if (inviteMatch?.[1]) {
					const resultAction = await dispatch(inviteActions.getLinkInvite({ inviteId: inviteMatch[1] }));
					if (!resultAction?.payload) {
						setLoading(false);
						return;
					}
					const invite = resultAction.payload as IInvite;
					let resolvedBanner = resolveInviteBanner(invite);
					if (!resolvedBanner && invite?.clan_id) {
						resolvedBanner = await fetchClanBannerById(invite.clan_id);
					}
					previewData = {
						title: invite?.clan_name || t('unknownClan'),
						description: t('memberCount', { count: Number(invite?.member_count || 0) }),
						image: invite?.clan_logo || '',
						banner: resolvedBanner,
						is_community: Boolean(invite?.is_community),
						type: 'invite'
					};
				} else {
					const res = await fetch(`${process.env.NX_OGP_URL}`, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json'
						},
						body: JSON.stringify({
							url: ogpLink.url
						}),
						signal
					});

					if (!res.ok) {
						setLoading(false);
						return;
					}
					previewData = await res.json();
				}
				setData(previewData);
				setLoading(false);
				dispatch(
					referencesActions.setOgpData({
						...ogpLink,
						image: previewData?.image || '',
						title: previewData?.title || '',
						description: previewData?.description || '',
						type: previewData?.type || ''
					})
				);
			} catch (error: unknown) {
				if (error instanceof Error && error.name === 'AbortError') {
					console.warn('Fetch OGP aborted');
					return;
				}
				console.error('Fetch OGP failed:', error);
				setLoading(false);
			}
		}, 750);

		return () => {
			clearTimeout(timeoutId);
			controller.abort();
		};
	}, [ogpLink?.url]);

	const clearOgpData = useCallback(() => {
		dispatch(referencesActions.clearOgpData());
	}, [dispatch]);

	const handleJoinInvite = useCallback(async () => {
		if (joiningInvite) return;

		const inviteMatch = ogpLink?.url?.match(INVITE_URL_REGEX);
		const inviteId = inviteMatch?.[1];

		if (!inviteId) {
			toast.error(t('invalidInviteLink'));
			return;
		}

		setJoiningInvite(true);
		try {
			const result = await inviteUser(inviteId);
			if (result?.channel_id && result?.clan_id) {
				dispatch(clansActions.fetchClans({ noCache: true }));
				navigate(`/chat/clans/${result.clan_id}/channels/${result.channel_id}`);
				clearOgpData();
				toast.success(t('joinedSuccessfully'));
			}
		} catch (error) {
			console.error('Failed to join invite:', error);
			toast.error(t('failedToJoin'));
		} finally {
			setJoiningInvite(false);
		}
	}, [clearOgpData, dispatch, inviteUser, joiningInvite, navigate, ogpLink?.url, t]);

	if (loading) {
		return (
			<div className="space-y-4 animate-pulse pb-2 pt-2 flex bg-theme-input text-theme-primary h-20 items-center gap-2">
				<div className="bg-item-theme rounded-lg border-theme-primary p-4 h-[84px] w-full">
					<div className="flex items-center gap-4 h-full">
						<div className="w-8 h-8 rounded-full bg-bgLightTertiary dark:bg-bgTertiary"></div>
						<div className="flex-1 space-y-2">
							<div className="h-4 bg-bgLightTertiary dark:bg-bgTertiary rounded w-3/4"></div>
							<div className="h-3 bg-bgLightTertiary dark:bg-bgTertiary rounded w-1/2"></div>
						</div>
					</div>
				</div>
			</div>
		);
	}

	const matchIds = contextId ? [contextId] : [currentChannelId, currentDmId].filter(Boolean);
	if (!ogpLink || !data || !matchIds.includes(ogpLink?.channel_id)) return null;
	const memberCount = Number((data.description || '').match(/\d+/)?.[0] || 0);
	const memberLabel = t('memberCount', { count: memberCount });
	const isCommunityEnabled = Boolean(data?.is_community);
	const isInvitePreview = INVITE_URL_REGEX.test(ogpLink?.url || '');

	if (isInvitePreview) {
		return (
			<div className="px-3 pb-2 pt-2 bg-theme-input text-theme-primary relative">
				<div className="relative w-full max-w-[320px] rounded-2xl overflow-hidden border dark:border-borderDivider border-borderDividerLight bg-bgLightSecondary dark:bg-bgTertiary">
					<div className="h-[72px] bg-gradient-to-b from-violet-300 to-violet-200 dark:from-violet-400 dark:to-violet-300 relative overflow-hidden">
						{data.banner ? (
							<img
								src={data.banner}
								className="absolute inset-0 w-full h-full object-cover"
								alt=""
								onError={(e) => {
									e.currentTarget.style.display = 'none';
								}}
							/>
						) : null}
					</div>
					<div className="absolute top-[40px] left-4 w-[72px] h-[72px] rounded-[22px] overflow-hidden border-4 dark:border-bgPrimary border-bgLightTertiary bg-bgLightMode dark:bg-bgSecondary shadow-lg">
						<div className="w-full h-full">
							{data.image ? <img src={data.image} className="w-full h-full object-cover" alt="Clan logo" /> : null}
						</div>
					</div>
					<div className="px-4 pb-4 pt-10">
						<div className="flex items-center gap-2 min-w-0">
							<p className="text-textPrimaryLight dark:text-contentPrimary text-[29px] font-extrabold leading-none uppercase tracking-tight truncate">
								{data.title}
							</p>
							{isCommunityEnabled ? (
								<span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500 text-white">
									<Icons.CheckIcon className="w-3 h-3" />
								</span>
							) : null}
						</div>
						<div className="mt-2 flex items-center gap-2 dark:text-textSecondary text-textSecondary800 text-sm">
							<span className="inline-flex items-center gap-1">
								<span className="w-2 h-2 rounded-full dark:bg-bgIconDark bg-bgIconLight" />
								{memberLabel}
							</span>
						</div>
						<button
							onClick={handleJoinInvite}
							disabled={joiningInvite}
							className={`mt-4 w-full h-10 rounded-lg text-white font-semibold text-base transition-colors ${
								joiningInvite ? 'bg-gray-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-500'
							}`}
						>
							{joiningInvite ? t('joining') : t('join')}
						</button>
					</div>
					<div className="absolute top-2 right-2 p-1 cursor-pointer rounded-full hover:bg-red-400" onClick={clearOgpData}>
						<Icons.Close defaultSize="w-3 h-3 text-theme-primary" />
					</div>
				</div>
			</div>
		);
	}
	return (
		<div className="px-3 pb-2 pt-2 flex bg-theme-input text-theme-primary h-20 items-center gap-2 relative">
			<div className="absolute top-2 right-2 p-1 cursor-pointer rounded-full hover:bg-red-400" onClick={clearOgpData}>
				<Icons.Close defaultSize="w-3 h-3 text-theme-primary" />
			</div>
			<div className="aspect-square rounded-md h-full flex items-center">
				<img
					src={data.image}
					className="h-full aspect-square object-cover rounded-md"
					alt="Preview"
					onError={(e) => {
						e.currentTarget.src = '/assets/images/warning.svg';
						e.currentTarget.classList.add('opacity-30');
					}}
				/>
			</div>
			<div className="flex flex-col justify-center gap-2 flex-1 overflow-hidden">
				<h5 className="text-sm truncate font-semibold">{data.title}</h5>
				<p className="text-xs truncate">{data.description}</p>
			</div>
		</div>
	);
}

export default memo(PreviewOgp);
