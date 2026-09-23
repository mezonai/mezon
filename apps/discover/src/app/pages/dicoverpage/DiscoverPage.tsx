import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FEATURED_CLAN_ID, PAGINATION } from '../../constants/constants';
import { useDiscover } from '../../context/DiscoverContext';
import CategoryChips from './CategoryChips';
import ClanIndex from './ClanIndex';
import ClanOrbit from './ClanOrbit';
import ClanPager from './ClanPager';
import EmptyDiscoverState from './EmptyDiscoverState';
import FilterSheet, { FilterBar } from './FilterBar';
import Footer from './Footer';
import HeaderMezon from './HeaderMezon';
import StageHero from './StageHero';
import { clanMatchesId, isSameClan, matchesQuery, pickFeaturedClans, sortClans, trackDiscoverEvent, type DiscoverClan } from './communityUtils';

export default function DiscoverPage() {
	const { t } = useTranslation(['discover', 'onBoardingClan']);
	const {
		clans,
		stageClans,
		featuredClan: pinnedClan,
		loading,
		error,
		searchTerm,
		committedQuery,
		selectedCategory,
		selectedHashtags,
		sort,
		verifiedOnly,
		currentPage,
		pageCount,
		handleSearch,
		handleToggleHashtag,
		handleSortChange,
		handleVerifiedOnly,
		goToPage,
		clearFilters,
		retry
	} = useDiscover();
	const [sideBarIsOpen, setSideBarIsOpen] = useState(false);
	const [filtersOpen, setFiltersOpen] = useState(false);
	const isBrowsing = committedQuery.trim().length < 2 && selectedHashtags.length === 0 && !verifiedOnly;

	const filteredClans = useMemo(() => {
		const next = clans.filter((clan) => {
			if (!clan) return false;
			if (verifiedOnly && !clan.verified) return false;
			if (!matchesQuery(clan, committedQuery)) return false;
			return true;
		});
		return sortClans(next, sort);
	}, [clans, committedQuery, sort, verifiedOnly]);

	const featuredClan = useMemo(() => {
		const pool = stageClans.length ? stageClans : clans;
		if (pinnedClan) return pinnedClan;
		if (FEATURED_CLAN_ID) {
			const configured = pool.find((clan) => clanMatchesId(clan, FEATURED_CLAN_ID));
			if (configured) return configured;
		}
		return pickFeaturedClans(pool, 1)[0];
	}, [clans, pinnedClan, stageClans]);
	const orbitClans = useMemo(() => {
		if (!isBrowsing) return [];
		const pool = (stageClans.length ? stageClans : clans).filter(Boolean);
		if (!featuredClan) return pool.slice(0, 12);
		const rest = pool.filter((clan) => !isSameClan(clan, featuredClan));
		return [featuredClan, ...rest].slice(0, 12);
	}, [clans, featuredClan, isBrowsing, stageClans]);

	const listedClans = useMemo(() => {
		if (!isBrowsing || currentPage !== 1 || !featuredClan) return filteredClans;
		const rest = filteredClans.filter((clan) => !isSameClan(clan, featuredClan));
		return [featuredClan, ...rest];
	}, [currentPage, featuredClan, filteredClans, isBrowsing]);

	const exploreHeading = useMemo(() => {
		if (committedQuery.trim().length >= 2) {
			return t('heading.search', { count: filteredClans.length, query: committedQuery.trim() });
		}
		if (selectedHashtags.length > 0) {
			const tagsLabel = selectedHashtags
				.map((tag) => `#${t(`communitySettings.hashtags.items.${tag}`, { ns: 'onBoardingClan', defaultValue: tag })}`)
				.join(', ');
			return t('heading.category', {
				count: filteredClans.length,
				category: tagsLabel
			});
		}
		return t('heading.default');
	}, [committedQuery, filteredClans.length, selectedHashtags, t]);

	const activeFilterCount = selectedHashtags.length + Number(verifiedOnly);

	useEffect(() => {
		document.title = `${t('title')} | Mezon`;
		trackDiscoverEvent('clan_discover_view');
	}, [t]);

	useEffect(() => {
		if (committedQuery.trim().length >= 2) {
			trackDiscoverEvent('clan_search_result_view', { query: committedQuery, count: filteredClans.length });
		}
	}, [committedQuery, filteredClans.length]);

	useEffect(() => {
		const shouldNoIndex = committedQuery.trim().length >= 2 || selectedHashtags.length > 0 || verifiedOnly;
		let robots = document.querySelector('meta[name="robots"]');
		if (!robots) {
			robots = document.createElement('meta');
			robots.setAttribute('name', 'robots');
			document.head.appendChild(robots);
		}
		robots.setAttribute('content', shouldNoIndex ? 'noindex,follow' : 'index,follow');
	}, [committedQuery, selectedHashtags, verifiedOnly]);

	useEffect(() => {
		if (isBrowsing) return;
		document.getElementById('explore-communities')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}, [committedQuery, selectedHashtags, isBrowsing]);

	const onHashtagSelect = (tag: string) => {
		handleToggleHashtag(tag);
		trackDiscoverEvent('clan_category_click', { hashtag: tag });
		trackDiscoverEvent('clan_filter_apply', { hashtags: selectedHashtags, verified: verifiedOnly });
	};

	const handlePageChange = (page: number) => {
		goToPage(page);
		trackDiscoverEvent('clan_page_change', { page });
		document.getElementById('explore-communities')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	};

	const handleCardSelect = (clan: DiscoverClan, meta: { section?: string; position?: number }) => {
		trackDiscoverEvent('clan_card_click', {
			section: meta.section,
			position: meta.position,
			clan_id: clan.clan_id,
			query: committedQuery,
			category: selectedCategory,
			sort,
			verified: verifiedOnly
		});
	};

	return (
		<>
			<HeaderMezon overlay sideBarIsOpen={sideBarIsOpen} toggleSideBar={() => setSideBarIsOpen((open) => !open)} />
			<main className="bg-[var(--surface-page)] min-h-screen">
				<StageHero
					clan={featuredClan}
					loading={loading && !clans.length}
					searchTerm={searchTerm}
					onSearch={handleSearch}
					onSelect={(clan) => handleCardSelect(clan, { section: 'stage', position: 0 })}
				>
					<CategoryChips selectedHashtags={selectedHashtags} onSelect={onHashtagSelect} variant="stage" />
				</StageHero>

				{isBrowsing ? <ClanOrbit clans={orbitClans} onSelect={handleCardSelect} /> : null}

				<section id="explore-communities" className="px-4 md:px-8 lg:px-12 py-16 md:py-24" aria-labelledby="explore-heading">
					<h2
						id="explore-heading"
						className="text-[32px] md:text-[56px] leading-[0.9] font-extrabold tracking-[-0.05em] text-[#131221] mb-8"
					>
						{exploreHeading}
					</h2>
					<FilterBar
						verifiedOnly={verifiedOnly}
						sort={sort}
						onVerifiedOnly={handleVerifiedOnly}
						onSortChange={(next) => {
							handleSortChange(next);
							trackDiscoverEvent('clan_sort_change', { sort: next });
						}}
						onOpenMobileFilters={() => setFiltersOpen(true)}
						activeFilterCount={activeFilterCount}
					/>

					{error && !clans.length ? (
						<div className="text-center py-16">
							<h3 className="text-xl font-semibold mb-2">{t('error.title')}</h3>
							<button
								type="button"
								onClick={retry}
								className="mt-4 min-h-[44px] px-5 rounded-full bg-[#8960e0] text-white font-semibold hover:bg-[#7a52d4]"
							>
								{t('error.retry')}
							</button>
						</div>
					) : loading ? (
						<div>
							<ClanIndex clans={[]} loading />
							<ClanPager page={currentPage} pageCount={pageCount} onPageChange={handlePageChange} disabled />
						</div>
					) : listedClans.length > 0 ? (
						<div>
							<ClanIndex clans={listedClans} startIndex={(currentPage - 1) * PAGINATION.ITEMS_PER_PAGE} onSelect={handleCardSelect} />
							<ClanPager page={currentPage} pageCount={pageCount} onPageChange={handlePageChange} disabled={loading} />
						</div>
					) : (
						<EmptyDiscoverState
							query={committedQuery}
							hasFilters={Boolean(selectedHashtags.length > 0 || verifiedOnly)}
							onClearSearch={() => handleSearch('')}
							onClearFilters={clearFilters}
							selectedCategory={selectedCategory}
							selectedHashtags={selectedHashtags}
							onCategorySelect={onHashtagSelect}
						/>
					)}
				</section>

				<section className="relative overflow-hidden bg-[#131221] text-white px-4 md:px-8 lg:px-12 py-20 md:py-28">
					<p className="pointer-events-none absolute -left-4 bottom-[-4vw] select-none text-[18vw] leading-none font-extrabold tracking-[-0.07em] text-white/[0.06]">
						CLAN
					</p>
					<h3 className="relative max-w-3xl text-3xl md:text-6xl font-extrabold tracking-[-0.05em] leading-[0.95] mb-4">
						{t('addClan.title')}
					</h3>
					<p className="relative text-white/70 max-w-xl text-lg">{t('addClan.body')}</p>
				</section>
			</main>
			<FilterSheet
				open={filtersOpen}
				onClose={() => setFiltersOpen(false)}
				selectedHashtags={selectedHashtags}
				selectedCategory={selectedCategory}
				verifiedOnly={verifiedOnly}
				onHashtagToggle={onHashtagSelect}
				onCategorySelect={onHashtagSelect}
				onVerifiedOnly={handleVerifiedOnly}
				onReset={clearFilters}
				resultCount={filteredClans.length}
			/>
			<Footer />
		</>
	);
}
