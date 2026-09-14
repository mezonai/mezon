import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import ImageWithSkeleton from '../../components/common/ImageWithSkeleton';
import CoverScrim from './CoverScrim';
import { getClanHref, getMemberCount, getOnlineCount, type DiscoverClan } from './communityUtils';

interface StageHeroProps {
	clan?: DiscoverClan | null;
	loading?: boolean;
	searchTerm: string;
	onSearch: (term: string) => void;
	onSelect?: (clan: DiscoverClan) => void;
	children?: React.ReactNode;
}

const StageHero: React.FC<StageHeroProps> = ({ clan, loading, searchTerm, onSearch, onSelect, children }) => {
	const { t } = useTranslation('discover');
	const searchInputRef = useRef<HTMLInputElement>(null);
	const [bannerError, setBannerError] = useState(false);
	const clanName = clan?.clan_name || t('title');
	const href = clan ? getClanHref(clan) : '/clans';

	useEffect(() => {
		setBannerError(false);
	}, [clan?.clan_id, clan?.banner]);

	return (
		<section className="relative min-h-[100svh] bg-[var(--surface-ink)] text-white overflow-hidden">
			<div className="absolute inset-0">
				{clan?.banner && !bannerError ? (
					<ImageWithSkeleton
						src={clan.banner}
						alt=""
						className="discover-art-media w-full h-full object-cover"
						onError={() => setBannerError(true)}
						loading="eager"
						fetchPriority="high"
					/>
				) : (
					<div className="absolute inset-0 bg-[image:var(--gradient-brand-hero)]" />
				)}
			</div>
			<CoverScrim />
			<p className="pointer-events-none absolute -left-4 bottom-[-8vw] select-none text-[22vw] leading-none font-extrabold tracking-[-0.07em] text-white/[0.07]">
				MEZON
			</p>

			<div className="relative min-h-[100svh] flex flex-col justify-end px-4 md:px-8 lg:px-12 pb-8 md:pb-10 pt-28">
				<div className="discover-title-plate">
					<p className="discover-kicker-on-art text-base sm:text-lg md:text-2xl font-bold tracking-[0.18em] uppercase mb-3 md:mb-4">
						{t('overline')}
					</p>
					{clan ? (
						<Link
							to={href}
							onClick={() => onSelect?.(clan)}
							className="block max-w-[92vw] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
						>
							<h1 className="discover-title-on-art text-[clamp(2.35rem,12vw,8.5vw)] md:text-[clamp(3.5rem,8.5vw,7.5rem)] leading-[0.82] font-extrabold tracking-[-0.06em] break-words">
								{clanName}
							</h1>
							{clan.description ? (
								<p className="discover-copy-on-art mt-4 md:mt-5 max-w-xl text-sm sm:text-base md:text-xl line-clamp-2">
									{clan.description}
								</p>
							) : null}
							<p className="discover-copy-on-art mt-3 md:mt-4 text-xs sm:text-sm tracking-wide">
								{t('memberCount', { count: getMemberCount(clan) })} · {t('onlineCount', { count: getOnlineCount(clan) })} ·{' '}
								{t('enterClan')} →
							</p>
						</Link>
					) : (
						<div>
							<h1 className="discover-title-on-art text-[clamp(2.35rem,12vw,8vw)] leading-[0.82] font-extrabold tracking-[-0.06em]">
								{t('title')}
							</h1>
							<p className="discover-copy-on-art mt-4 md:mt-5 max-w-xl text-sm sm:text-base md:text-xl">{t('subtitle')}</p>
						</div>
					)}
				</div>

				<form
					className="mt-6 md:mt-8 max-w-2xl"
					onSubmit={(event) => {
						event.preventDefault();
						searchInputRef.current?.blur();
					}}
				>
					<label htmlFor="discover-search" className="sr-only">
						{t('searchLabel')}
					</label>
					<div className="relative">
						<div className="absolute inset-y-0 left-0 pl-0 flex items-center pointer-events-none">
							<svg className="h-5 w-5 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
							</svg>
						</div>
						<input
							id="discover-search"
							ref={searchInputRef}
							type="search"
							value={searchTerm}
							onChange={(event) => onSearch(event.target.value)}
							placeholder={t('searchPlaceholder')}
							autoComplete="off"
							className="block w-full h-12 md:h-14 pl-8 pr-4 rounded-none border-0 border-b border-white/40 bg-transparent text-white placeholder:text-white/55 focus:outline-none focus:border-[#de82e6]"
						/>
					</div>
				</form>
				<div className="mt-5">{children}</div>
				{loading ? <span className="sr-only">{t('loadingMore')}</span> : null}
			</div>
		</section>
	);
};

export default StageHero;
