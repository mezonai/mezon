import { load, save } from '@mezon/mobile-components';
import { Client } from 'mezon-js';
import type { ApiClanDiscover, ApiClanDiscoverRequest } from 'mezon-js/types';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export const PAGINATION = {
	ITEMS_PER_PAGE: 6,
	MAX_PAGE_NUMBERS: 5
};

export interface Category {
	id: string;
	name: string;
	count: number;
	type: number;
	icon: string;
	gradient: string;
}

interface DiscoverContextType {
	clans: ApiClanDiscover[];
	allClans: ApiClanDiscover[];
	filteredClans: ApiClanDiscover[];
	loading: boolean;
	loadingMore: boolean;
	hasMore: boolean;
	setSearchTerm: (term: string) => void;
	loadMoreClans: () => void;
	refreshClans: () => void;
}

const DiscoverMobileContext = createContext<DiscoverContextType | undefined>(undefined);

const STORAGE_KEY = 'discover_clans';

export const DiscoverMobileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [allClans, setAllClans] = useState<ApiClanDiscover[]>(() => {
		const savedClans = load(STORAGE_KEY);
		return savedClans ? JSON.parse(savedClans) : [];
	});
	const [loading, setLoading] = useState(false);
	const [loadingMore, setLoadingMore] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [searchTerm, setSearchTerm] = useState('');

	const hasMore = currentPage < totalPages;

	// Filter clans based on search term
	const filteredClans = useMemo(() => {
		if (!searchTerm.trim()) {
			return allClans;
		}

		const lowerSearchTerm = searchTerm.toLowerCase().trim();
		return allClans.filter(
			(clan) => clan.clan_name?.toLowerCase().includes(lowerSearchTerm) || clan.description?.toLowerCase().includes(lowerSearchTerm)
		);
	}, [allClans, searchTerm]);

	const fetchClansDiscover = async (page: number, isLoadMore = false) => {
		try {
			if (isLoadMore) {
				setLoadingMore(true);
			} else {
				setLoading(true);
			}

			const mezon = new Client(
				process.env.NX_CHAT_APP_API_KEY as string,
				process.env.NX_CHAT_APP_API_GW_HOST as string,
				process.env.NX_CHAT_APP_API_GW_PORT as string,
				process.env.NX_CHAT_APP_API_SECURE === 'true'
			);

			const request: ApiClanDiscoverRequest = {
				page_number: page,
				item_per_page: PAGINATION.ITEMS_PER_PAGE
			};

			const response = await mezon.listClanDiscover(
				`https://${process.env.NX_CHAT_APP_API_GW_HOST}:${process.env.NX_CHAT_APP_API_GW_PORT}`,
				request
			);

			const newClans = response?.clan_discover || [];
			const pageCount = response?.page_count || 1;
			const pageNumber = response?.page_number || page;

			setTotalPages(pageCount);
			setCurrentPage(pageNumber);

			if (isLoadMore) {
				setAllClans((prevClans) => {
					const existingIds = new Set(prevClans.map((clan) => clan.clanId));
					const uniqueNewClans = newClans.filter((clan) => !existingIds.has(clan.clanId));
					return [...prevClans, ...uniqueNewClans];
				});
			} else {
				setAllClans(newClans);
				save(STORAGE_KEY, JSON.stringify(newClans));
			}
		} catch (err) {
			console.error('Error fetching clans:', err);
		} finally {
			setLoading(false);
			setLoadingMore(false);
		}
	};

	useEffect(() => {
		fetchClansDiscover(1, false);
	}, []);

	const handleSearch = (term: string) => {
		setSearchTerm(term);
	};

	const loadMoreClans = () => {
		if (!loadingMore && !loading && hasMore) {
			const nextPage = currentPage + 1;
			fetchClansDiscover(nextPage, true);
		}
	};

	const refreshClans = () => {
		setCurrentPage(1);
		fetchClansDiscover(1, false);
	};

	const value = {
		clans: filteredClans,
		allClans,
		filteredClans,
		loading,
		loadingMore,
		hasMore,
		setSearchTerm: handleSearch,
		loadMoreClans,
		refreshClans
	};

	return <DiscoverMobileContext.Provider value={value}>{children}</DiscoverMobileContext.Provider>;
};

export const useDiscoverMobile = () => {
	const context = useContext(DiscoverMobileContext);
	if (context === undefined) {
		throw new Error('useDiscover must be used within a DiscoverProvider');
	}
	return context;
};
