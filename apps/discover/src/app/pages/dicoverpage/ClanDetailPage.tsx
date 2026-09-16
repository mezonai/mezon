import { format } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import ImageWithSkeleton from '../../components/common/ImageWithSkeleton';
import { useDiscover } from '../../context/DiscoverContext';
import { JoinClanModal, ShareClanModal } from './ClanInviteModals';
import ClanLiveStats from './ClanLiveStats';
import ClanOrbit from './ClanOrbit';
import ClanProfileBody from './ClanProfileBody';
import { ClanStageBackdrop, ClanStagePoster } from './ClanStageArt';
import CoverScrim from './CoverScrim';
import Footer from './Footer';
import HeaderMezon from './HeaderMezon';
import {
	clanMatchesId,
	getClanHashtags,
	getClanInitials,
	getCreatedAtMs,
	getInviteUrl,
	isSameClan,
	pickFeaturedClans,
	trackDiscoverEvent,
	type DiscoverClan
} from './communityUtils';

const VerifiedBadge = ({ className = 'w-6 h-6 text-white' }: { className?: string }) => (
	<svg className={className} fill="currentColor" viewBox="0 0 20 20" aria-hidden>
		<path
			fillRule="evenodd"
			d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
			clipRule="evenodd"
		/>
	</svg>
);

const CoverFallback = ({ name }: { name: string }) => (
	<div className="absolute inset-0 bg-[image:var(--gradient-brand-hero)] flex items-center justify-center">
		<span className="text-white/90 text-[18vw] font-extrabold tracking-[-0.07em]">{getClanInitials(name)}</span>
	</div>
);

export default function ClanDetailPage() {
	const { id } = useParams();
	const { t } = useTranslation(['discover', 'onBoardingClan']);
	const { fetchSingleClan, clans, featuredClan } = useDiscover();
	const [clan, setClan] = useState<DiscoverClan | null>(null);
	const [loading, setLoading] = useState(true);
	const [sideBarIsOpen, setSideBarIsOpen] = useState(false);
	const [bannerError, setBannerError] = useState(false);
	const [logoError, setLogoError] = useState(false);
	const [joinOpen, setJoinOpen] = useState(false);
	const [shareOpen, setShareOpen] = useState(false);

	const cachedClan = useMemo(() => {
		if (!id) return null;
		if (featuredClan && clanMatchesId(featuredClan, id)) return featuredClan;
		return clans.find((item) => clanMatchesId(item, id)) || null;
	}, [clans, featuredClan, id]);

	useEffect(() => {
		setBannerError(false);
		setLogoError(false);
		setJoinOpen(false);
		setShareOpen(false);
	}, [id]);

	useEffect(() => {
		let cancelled = false;
		if (!id) {
			setClan(null);
			setLoading(false);
			return;
		}
		if (cachedClan) {
			setClan(cachedClan);
			setLoading(false);
			return;
		}
		setLoading(true);
		fetchSingleClan(id).then((clanData) => {
			if (cancelled) return;
			setClan((clanData as DiscoverClan) || null);
			setLoading(false);
		});
		return () => {
			cancelled = true;
		};
	}, [cachedClan, fetchSingleClan, id]);

	useEffect(() => {
		if (!clan) return;
		document.title = `${clan.clan_name || t('detail.unnamed')} | Mezon`;
		trackDiscoverEvent('clan_detail_view', { clan_id: clan.clan_id });
		const description = clan.description || clan.about || t('detail.noDescription');
		const setMeta = (property: string, content: string, attr: 'property' | 'name' = 'property') => {
			let tag = document.querySelector(`meta[${attr}="${property}"]`);
			if (!tag) {
				tag = document.createElement('meta');
				tag.setAttribute(attr, property);
				document.head.appendChild(tag);
			}
			tag.setAttribute('content', content);
		};
		setMeta('og:title', `${clan.clan_name || t('detail.unnamed')} | Mezon`);
		setMeta('og:description', description);
		if (clan.banner) setMeta('og:image', clan.banner);
		setMeta('description', description, 'name');
	}, [clan, t]);

	const similarClans = useMemo(() => {
		if (!clan) return [];
		return pickFeaturedClans(
			clans.filter((item) => !isSameClan(item, clan)),
			8
		);
	}, [clan, clans]);

	const hashtags = useMemo(() => (clan ? getClanHashtags(clan) : []), [clan]);

	const handleJoin = () => {
		if (!clan) return;
		trackDiscoverEvent('clan_join_click', { clan_id: clan.clan_id });
		if (!getInviteUrl(clan)) {
			toast.error(t('detail.noInvite'));
			trackDiscoverEvent('clan_join_failure', { clan_id: clan.clan_id, reason: 'no_invite' });
			return;
		}
		setJoinOpen(true);
	};

	const handleShare = () => {
		if (!clan) return;
		trackDiscoverEvent('clan_share_click', { clan_id: clan.clan_id, method: 'open' });
		setShareOpen(true);
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-[var(--surface-ink)]">
				<HeaderMezon overlay sideBarIsOpen={false} toggleSideBar={() => undefined} />
				<div className="min-h-[100svh] skeleton opacity-30" />
			</div>
		);
	}

	if (!clan) {
		return (
			<div className="min-h-screen bg-[var(--surface-page)] pt-[var(--navbar-height)] text-center py-20">
				<h1 className="text-xl font-semibold mb-4">{t('error.clanNotFound')}</h1>
				<Link to="/clans" className="text-[var(--color-brand-primary)] font-medium">
					{t('error.backToDiscover')}
				</Link>
			</div>
		);
	}

	const clanName = clan.clan_name || t('detail.unnamed');
	const createdAtMs = getCreatedAtMs(clan);
	const createdAt = createdAtMs ? format(createdAtMs, 'MMMM d, yyyy') : null;
	const inviteUrl = getInviteUrl(clan);
	const canJoin = Boolean(inviteUrl);

	const joinButton = (
		<button
			type="button"
			onClick={handleJoin}
			disabled={!canJoin}
			className="w-full lg:w-auto min-h-[56px] px-8 rounded-full bg-white text-[#6E4A9E] font-semibold hover:bg-[#f4f7f9] disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center"
		>
			{t('joinClan')}
		</button>
	);

	const shareButton = (
		<button
			type="button"
			onClick={handleShare}
			className="w-full lg:w-auto min-h-[56px] px-8 rounded-full bg-[#8960e0] text-white font-semibold hover:bg-[#7a52d4] inline-flex items-center justify-center"
		>
			{t('shareClan')}
		</button>
	);

	return (
		<div className="min-h-screen bg-[var(--surface-page)]">
			<HeaderMezon overlay sideBarIsOpen={sideBarIsOpen} toggleSideBar={() => setSideBarIsOpen((open) => !open)} />

			<main className="pb-28 lg:pb-0">
				<section className="discover-detail-stage relative min-h-[100svh] overflow-hidden bg-[var(--surface-ink)] text-white max-lg:flex max-lg:h-[100svh] max-lg:flex-col">
					{clan.banner && !bannerError ? (
						<>
							<ClanStageBackdrop src={clan.banner} />
							<ClanStagePoster
								src={clan.banner}
								onError={() => setBannerError(true)}
								className="pointer-events-none absolute inset-0 max-lg:hidden"
							/>
						</>
					) : (
						<CoverFallback name={clanName} />
					)}
					<CoverScrim />
					<p className="pointer-events-none absolute -right-8 top-[20%] z-[1] select-none text-[18vw] leading-none font-extrabold tracking-[-0.08em] text-white/[0.07] rotate-90 origin-center">
						MEZON
					</p>

					<nav className="relative z-20 shrink-0 px-4 pt-[calc(var(--navbar-height)+0.15rem)] text-sm discover-copy-on-art md:px-8 lg:absolute lg:top-24 lg:left-8 lg:px-0 lg:pt-0">
						<Link to="/clans" className="hover:text-white min-h-[44px] inline-flex items-center">
							{t('detail.breadcrumbDiscover')}
						</Link>
						<span className="mx-2 text-white/50">/</span>
						<span className="text-white">{clanName}</span>
					</nav>

					{clan.banner && !bannerError ? (
						<div className="relative flex-1 min-h-0 px-3 lg:hidden">
							<ClanStagePoster src={clan.banner} onError={() => setBannerError(true)} className="absolute inset-0" />
						</div>
					) : (
						<div className="flex-1 min-h-0 lg:hidden" />
					)}

					<div className="discover-title-plate relative z-10 shrink-0 px-4 pt-2 pb-[calc(5.75rem+env(safe-area-inset-bottom,0px))] md:px-8 lg:pointer-events-none lg:flex lg:min-h-[100svh] lg:flex-col lg:justify-end lg:px-12 lg:pb-10 lg:pt-28">
						<div className="flex flex-row items-end gap-3 md:gap-6 lg:pointer-events-auto lg:gap-10">
							<div className="w-16 h-16 shrink-0 overflow-hidden rounded-full bg-[#404eed] shadow-2xl ring-[5px] ring-[#5865f2] sm:h-20 sm:w-20 md:h-36 md:w-36 md:ring-[6px]">
								{clan.clan_logo && !logoError ? (
									<ImageWithSkeleton
										src={clan.clan_logo}
										alt=""
										className="w-full h-full object-cover"
										onError={() => setLogoError(true)}
									/>
								) : (
									<div className="w-full h-full flex items-center justify-center bg-[image:var(--gradient-brand-hero)] text-white text-2xl font-semibold">
										{getClanInitials(clanName)}
									</div>
								)}
							</div>
							<div className="min-w-0 flex-1">
								<div className="flex flex-wrap items-center gap-2 md:gap-3">
									<h1 className="discover-title-on-art text-[clamp(1.75rem,8.5vw,3.25rem)] leading-[0.9] font-extrabold tracking-[-0.06em] break-words lg:text-[clamp(2.1rem,11vw,7vw)] lg:leading-[0.82]">
										{clanName}
									</h1>
									{clan.verified ? (
										<>
											<VerifiedBadge className="w-6 h-6 lg:w-7 lg:h-7 text-[#de82e6] drop-shadow-[0_1px_6px_rgba(19,18,33,0.9)]" />
											<span className="sr-only">{t('verified')}</span>
										</>
									) : null}
								</div>
								<ClanLiveStats
									clan={clan}
									className="discover-copy-on-art mt-2 text-xs tracking-[0.12em] uppercase sm:text-sm md:mt-4 md:text-base lg:mt-6"
									extra={
										createdAt ? (
											<>
												<span className="text-white/50" aria-hidden>
													·
												</span>
												<span>
													{t('detail.created')} {createdAt}
												</span>
											</>
										) : null
									}
								/>
								{hashtags.length > 0 ? (
									<div className="mt-3 flex flex-wrap items-center gap-1.5 sm:gap-2 md:mt-4">
										{hashtags.map((tag) => (
											<span
												key={tag}
												className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium backdrop-blur-md bg-black/40 text-white/95 border border-white/20 shadow-md transition-all hover:bg-black/60 hover:border-white/35 sm:px-3 sm:py-1 sm:text-sm select-none"
											>
												<span className="text-[#a78bfa] font-bold">#</span>
												<span>
													{t(`communitySettings.hashtags.items.${tag}`, { ns: 'onBoardingClan', defaultValue: tag })}
												</span>
											</span>
										))}
									</div>
								) : null}
							</div>
							<div className="hidden lg:flex flex-col items-stretch gap-3 shrink-0 pb-2 min-w-[220px]">
								{joinButton}
								{shareButton}
								{!canJoin ? <p className="text-xs text-white/70 max-w-[220px]">{t('detail.noInvite')}</p> : null}
							</div>
						</div>
					</div>
				</section>

				<ClanProfileBody key={clan.clan_id || clan.short_url || clanName} clan={clan} />

				{similarClans.length > 0 ? (
					<ClanOrbit
						title={t('detail.similar')}
						clans={similarClans}
						onSelect={(item, meta) => trackDiscoverEvent('clan_similar_click', { clan_id: item.clan_id, position: meta.position })}
					/>
				) : null}
			</main>

			<div className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-[#131221] px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))]">
				<div className="flex items-center gap-3">
					<div className="flex-1">{joinButton}</div>
					<div className="flex-1">{shareButton}</div>
				</div>
			</div>
			<JoinClanModal open={joinOpen} inviteUrl={inviteUrl} clanId={clan.clan_id} onClose={() => setJoinOpen(false)} />
			<ShareClanModal
				open={shareOpen}
				inviteUrl={inviteUrl || window.location.href}
				clanName={clanName}
				clanId={clan.clan_id}
				onClose={() => setShareOpen(false)}
			/>
			<Footer />
			<div className="lg:hidden h-[72px] bg-[#131221]" aria-hidden />
		</div>
	);
}
