import type { ApiClanDiscover, ApiClanDiscoverRequest, ApiListClanDiscover } from 'mezon-js';
import { Client } from 'mezon-js';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { DISCOVER_LAYOUT, FEATURED_CLAN_ID, PAGINATION, type DiscoverSort } from '../constants/constants';
import { clanMatchesId, isCategoryShortcutId, type DiscoverClan } from '../pages/dicoverpage/communityUtils';

interface DiscoverContextType {
	clans: DiscoverClan[];
	stageClans: DiscoverClan[];
	loading: boolean;
	loadingMore: boolean;
	error: string | null;
	searchTerm: string;
	committedQuery: string;
	selectedCategory: string;
	sort: DiscoverSort;
	verifiedOnly: boolean;
	hasMore: boolean;
	currentPage: number;
	pageCount: number;
	handleSearch: (term: string) => void;
	handleCategorySelect: (category: string) => void;
	handleSortChange: (sort: DiscoverSort) => void;
	handleVerifiedOnly: (value: boolean) => void;
	handleLoadMore: () => void;
	goToPage: (page: number) => void;
	clearFilters: () => void;
	retry: () => void;
	fetchSingleClan: (clanId: string) => Promise<ApiClanDiscover | null>;
	featuredClan: DiscoverClan | null;
}

const DiscoverContext = createContext<DiscoverContextType | undefined>(undefined);

const parseSort = (value: string | null): DiscoverSort => {
	if (value === 'largest' || value === 'newest' || value === 'recommended') return value;
	return 'recommended';
};

const requestKey = (request: ApiClanDiscoverRequest) =>
	JSON.stringify({
		clan_id: request.clan_id || '',
		page_number: request.page_number || 0,
		item_per_page: request.item_per_page || 0
	});

const inflightDiscover = new Map<string, Promise<ApiListClanDiscover | null>>();

export const DiscoverProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const { t } = useTranslation('common');
	const location = useLocation();
	const [searchParams, setSearchParams] = useSearchParams();
	const [clans, setClans] = useState<DiscoverClan[]>([]);
	const [stageClans, setStageClans] = useState<DiscoverClan[]>([]);
	const [featuredClan, setFeaturedClan] = useState<DiscoverClan | null>(null);
	const [loading, setLoading] = useState(() => {
		const path = typeof window === 'undefined' ? '' : window.location.pathname;
		return path === '/clans' || path === '/clans/';
	});
	const [loadingMore, setLoadingMore] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [pageCount, setPageCount] = useState(1);
	const [hasMore, setHasMore] = useState(true);
	const [searchInput, setSearchInput] = useState(searchParams.get('q') || '');
	const requestIdRef = useRef(0);
	const debounceRef = useRef<number | undefined>(undefined);
	const clientRef = useRef<Client | null>(null);
	const clansRef = useRef<DiscoverClan[]>([]);
	const stageClansRef = useRef<DiscoverClan[]>([]);
	const featuredClanRef = useRef<DiscoverClan | null>(null);
	const loadedPageRef = useRef<number | null>(null);
	const tRef = useRef(t);
	clansRef.current = clans;
	stageClansRef.current = stageClans;
	featuredClanRef.current = featuredClan;
	tRef.current = t;

	const searchTerm = searchParams.get('q') || '';
	const selectedCategory = searchParams.get('category') || '';
	const sort = parseSort(searchParams.get('sort'));
	const verifiedOnly = searchParams.get('verified') === '1';
	const pageFromUrl = Math.max(1, Number.parseInt(searchParams.get('page') || '1', 10) || 1);

	const isDiscoverIndex = location.pathname === '/clans' || location.pathname === '/clans/';

	const updateParams = useCallback(
		(patch: Record<string, string | null>, replace = true) => {
			const next = new URLSearchParams(searchParams);
			Object.entries(patch).forEach(([key, value]) => {
				if (!value) next.delete(key);
				else next.set(key, value);
			});
			setSearchParams(next, { replace });
		},
		[searchParams, setSearchParams]
	);

	const getClient = () => {
		if (!clientRef.current) {
			clientRef.current = new Client(
				process.env.NX_CHAT_APP_API_KEY as string,
				process.env.NX_CHAT_APP_API_GW_HOST as string,
				process.env.NX_CHAT_APP_API_GW_PORT as string,
				process.env.NX_CHAT_APP_API_SECURE === 'true'
			);
		}
		return clientRef.current;
	};

	const listClanDiscover = useCallback((request: ApiClanDiscoverRequest) => {
		const key = requestKey(request);
		const pending = inflightDiscover.get(key);
		if (pending) return pending;
		const task = getClient()
			.listClanDiscover(request)
			.catch((err) => {
				throw err;
			})
			.finally(() => {
				inflightDiscover.delete(key);
			});
		inflightDiscover.set(key, task);
		return task;
	}, []);

	const readCachedClan = (clanId: string): DiscoverClan | null =>
		[featuredClanRef.current, ...stageClansRef.current, ...clansRef.current].find(
			(clan): clan is DiscoverClan => Boolean(clan) && clanMatchesId(clan, clanId)
		) || null;

	const resolveFeaturedFrom = useCallback((list: DiscoverClan[]) => {
		if (!FEATURED_CLAN_ID) {
			setFeaturedClan(null);
			return;
		}
		const found = list.find((clan) => clanMatchesId(clan, FEATURED_CLAN_ID));
		if (found) setFeaturedClan(found);
	}, []);

	const fetchClansDiscover = useCallback(
		async (page: number, append: boolean) => {
			const requestId = ++requestIdRef.current;
			try {
				if (append) setLoadingMore(true);
				else {
					setLoading(true);
					setError(null);
				}

				const request: ApiClanDiscoverRequest = {
					page_number: page,
					item_per_page: PAGINATION.ITEMS_PER_PAGE
				};
				const response = await listClanDiscover(request);
				if (requestId !== requestIdRef.current) return;
				if (!response) throw new Error('No response from API');

				const newClans = (response.clan_discover || []) as DiscoverClan[];
				if (!append && page === 1) {
					setStageClans(newClans);
					resolveFeaturedFrom(newClans);
				}
				setClans((prev) => {
					if (!append) return newClans;
					const seen = new Set(prev.map((clan) => clan.clan_id || clan.short_url).filter(Boolean) as string[]);
					return [
						...prev,
						...newClans.filter((clan) => {
							const id = clan.clan_id || clan.short_url;
							if (!id || seen.has(id)) return false;
							seen.add(id);
							return true;
						})
					];
				});
				loadedPageRef.current = page;
				const nextPageCount = Math.max(1, response.page_count || 1);
				setPageCount(nextPageCount);
				setHasMore(page < nextPageCount && newClans.length > 0);
			} catch (err) {
				if (requestId !== requestIdRef.current) return;
				loadedPageRef.current = null;
				setError(err instanceof Error ? err.message : 'An error occurred');
				if (!append) toast.error(tRef.current('cannotFetchClans'));
			} finally {
				if (requestId === requestIdRef.current) {
					setLoading(false);
					setLoadingMore(false);
				}
			}
		},
		[listClanDiscover, resolveFeaturedFrom]
	);

	const fetchSingleClan = useCallback(
		async (clanId: string): Promise<ApiClanDiscover | null> => {
			if (!clanId) return null;
			const cached = readCachedClan(clanId);
			if (cached) return cached;
			if (clansRef.current.length === 0 && stageClansRef.current.length === 0) {
				await fetchClansDiscover(1, false);
			}
			return readCachedClan(clanId);
		},
		[fetchClansDiscover]
	);

	useEffect(() => {
		if (!isDiscoverIndex) return;
		if (loadedPageRef.current === pageFromUrl && clansRef.current.length > 0) return;
		fetchClansDiscover(pageFromUrl, false);
	}, [isDiscoverIndex, fetchClansDiscover, pageFromUrl]);

	useEffect(() => {
		setSearchInput(searchTerm);
	}, [searchTerm]);

	useEffect(() => {
		return () => window.clearTimeout(debounceRef.current);
	}, []);

	const handleSearch = useCallback(
		(term: string) => {
			setSearchInput(term);
			window.clearTimeout(debounceRef.current);
			debounceRef.current = window.setTimeout(() => {
				updateParams({ q: term.trim() || null, page: null });
			}, DISCOVER_LAYOUT.SEARCH_DEBOUNCE_MS);
		},
		[updateParams]
	);

	const handleCategorySelect = useCallback(
		(category: string) => {
			const next = selectedCategory === category ? '' : category;
			updateParams({ category: next && isCategoryShortcutId(next) ? next : null, page: null }, false);
		},
		[selectedCategory, updateParams]
	);

	const handleSortChange = useCallback(
		(nextSort: DiscoverSort) => {
			updateParams({ sort: nextSort === 'recommended' ? null : nextSort, page: null }, false);
		},
		[updateParams]
	);

	const handleVerifiedOnly = useCallback(
		(value: boolean) => {
			updateParams({ verified: value ? '1' : null, page: null }, false);
		},
		[updateParams]
	);

	const goToPage = useCallback(
		(page: number) => {
			if (page < 1 || page === pageFromUrl || loading || page > pageCount) return;
			updateParams({ page: page <= 1 ? null : String(page) }, false);
		},
		[loading, pageCount, pageFromUrl, updateParams]
	);

	const handleLoadMore = useCallback(() => {
		goToPage(pageFromUrl + 1);
	}, [goToPage, pageFromUrl]);

	const clearFilters = useCallback(() => {
		setSearchInput('');
		setSearchParams({}, { replace: true });
	}, [setSearchParams]);

	const retry = useCallback(() => {
		loadedPageRef.current = null;
		fetchClansDiscover(1, false);
	}, [fetchClansDiscover]);

	const value = useMemo(
		() => ({
			clans,
			stageClans,
			featuredClan,
			loading,
			loadingMore,
			error,
			searchTerm: searchInput,
			committedQuery: searchTerm,
			selectedCategory,
			sort,
			verifiedOnly,
			hasMore,
			currentPage: pageFromUrl,
			pageCount,
			handleSearch,
			handleCategorySelect,
			handleSortChange,
			handleVerifiedOnly,
			handleLoadMore,
			goToPage,
			clearFilters,
			retry,
			fetchSingleClan
		}),
		[
			clans,
			stageClans,
			featuredClan,
			loading,
			loadingMore,
			error,
			searchInput,
			searchTerm,
			selectedCategory,
			sort,
			verifiedOnly,
			hasMore,
			pageFromUrl,
			pageCount,
			handleSearch,
			handleCategorySelect,
			handleSortChange,
			handleVerifiedOnly,
			handleLoadMore,
			goToPage,
			clearFilters,
			retry,
			fetchSingleClan
		]
	);

	return <DiscoverContext.Provider value={value}>{children}</DiscoverContext.Provider>;
};

export const useDiscover = () => {
	const context = useContext(DiscoverContext);
	if (context === undefined) {
		throw new Error('useDiscover must be used within a DiscoverProvider');
	}
	return context;
};
