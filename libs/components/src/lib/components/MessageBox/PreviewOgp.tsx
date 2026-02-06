import { inviteActions, referencesActions, selectCurrentChannelId, selectCurrentDmId, selectOgpPreview } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { isFacebookLink, isTikTokLink, isYouTubeLink } from '@mezon/utils';
import { memo, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

type PreviewOgpProps = {
	contextId?: string;
};

function PreviewOgp({ contextId }: PreviewOgpProps) {
	const { t } = useTranslation('linkMessageInvite');
	const ogpLink = useSelector(selectOgpPreview);
	const currentChannelId = useSelector(selectCurrentChannelId);
	const currentDmId = useSelector(selectCurrentDmId);
	const dispatch = useDispatch();
	const [loading, setLoading] = useState(false);
	const [data, setData] = useState<{
		title?: string;
		description?: string;
		image?: string;
		banner?: string;
		is_community?: boolean;
		type?: string;
	} | null>(null);
	const resolveInviteBanner = (invite: any): string => {
		return invite?.banner || invite?.clan_banner || '';
	};

	const fetchClanBannerById = async (clanId: string): Promise<string> => {
		const host = process.env.NX_CHAT_APP_API_GW_HOST;
		const port = process.env.NX_CHAT_APP_API_GW_PORT;
		const candidates = [`https://${host}/clans/${clanId}`, `https://${host}:${port}/clans/${clanId}`];

		for (const url of candidates) {
			try {
				const res = await fetch(url, {
					method: 'GET',
					headers: {
						'Content-Type': 'application/json'
					}
				});
				if (!res.ok) continue;
				const body = await res.json();
				const banner = body?.banner || body?.clan_banner || body?.data?.banner || body?.data?.clan_banner || '';
				if (banner) {
					return banner;
				}
			} catch (err) {
				console.warn('Fetch clan detail failed:', err);
			}
		}

		return '';
	};

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
				const inviteMatch = ogpLink.url.match(/\/invite\/([A-Za-z0-9_-]+)/i);
				let previewData: any;

				if (inviteMatch?.[1]) {
					const invite = await dispatch(inviteActions.getLinkInvite({ inviteId: inviteMatch[1] }) as any).unwrap();
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
						throw new Error(`HTTP error ${res.status}`);
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
			} catch (error: any) {
				if (error.name === 'AbortError') {
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
	}, [ogpLink?.url, ogpLink?.channel_id]);
	const clearOgpData = () => {
		dispatch(referencesActions.clearOgpData());
	};

	const isInvitePreview = /\/invite\/([A-Za-z0-9_-]+)/i.test(ogpLink?.url || '');
	if (isInvitePreview) return null;

	if (loading) {
		return (
			<div className="space-y-4 animate-pulse pb-2 pt-2 flex bg-theme-input text-theme-primary h-20 items-center gap-2">
				<div className="bg-item-theme rounded-lg border-theme-primary p-4 h-[84px] w-full">
					<div className="flex items-center gap-4 h-full">
						<div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700"></div>
						<div className="flex-1 space-y-2">
							<div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
							<div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
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

	if (isInvitePreview) {
		return (
			<div className="px-3 pb-2 pt-2 bg-theme-input text-theme-primary relative">
				<div className="relative w-full max-w-[320px] rounded-2xl overflow-hidden border border-white/10 bg-[#1f2129]">
					<div className="h-[72px] bg-gradient-to-b from-[#b89ee7] to-[#d7c9ef] relative overflow-hidden">
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
					<div className="absolute top-[40px] left-4 w-[72px] h-[72px] rounded-[22px] overflow-hidden border-4 border-[#2f3340] bg-[#2a2d36] shadow-lg">
						<div className="w-full h-full">{data.image ? <img src={data.image} className="w-full h-full object-cover" /> : null}</div>
					</div>
					<div className="px-4 pb-4 pt-10">
						<div className="flex items-center gap-2 min-w-0">
							<p className="text-white text-[29px] font-extrabold leading-none uppercase tracking-tight truncate">{data.title}</p>
							{isCommunityEnabled ? (
								<span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#22c55e] text-white">
									<Icons.CheckIcon className="w-3 h-3" />
								</span>
							) : null}
						</div>
						<div className="mt-2 flex items-center gap-2 text-[#c6c9d2] text-sm">
							<span className="inline-flex items-center gap-1">
								<span className="w-2 h-2 rounded-full bg-[#8a8f9b]" />
								{memberLabel}
							</span>
						</div>
						<button className="mt-4 w-full h-10 rounded-lg bg-[#0a9f59] text-white font-semibold text-base hover:bg-[#0b8a4f]">
							{t('join')}
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
				<img src={data.image} className="h-full aspect-square object-cover rounded-md" />
			</div>
			<div className="flex flex-col justify-center gap-2 flex-1 overflow-hidden">
				<h5 className="text-sm truncate font-semibold">{data.title}</h5>
				<p className="text-xs truncate">{data.description}</p>
			</div>
		</div>
	);
}

export default memo(PreviewOgp);
