import { Client } from 'mezon-js';
import { ApiClanDiscover, ApiClanDiscoverRequest } from 'mezon-js/api.gen';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { PAGINATION } from '../constants/constants';
import { type Category } from '../services/api';

interface DiscoverContextType {
	clans: ApiClanDiscover[];
	categories: Category[];
	loading: boolean;
	categoriesLoading: boolean;
	error: string | null;
	currentPage: number;
	totalPages: number;
	searchTerm: string;
	selectedCategory: string;
	setSearchTerm: (term: string) => void;
	setSelectedCategory: (category: string) => void;
	handlePageChange: (page: number) => void;
	handleSearch: (term: string) => void;
	handleCategorySelect: (category: string) => void;
	fetchSingleClan: (clanId: string) => Promise<ApiClanDiscover | null>;
}

const DiscoverContext = createContext<DiscoverContextType | undefined>(undefined);

const STORAGE_KEY = 'discover_clans';
const CATEGORIES_STORAGE_KEY = 'discover_categories';

export const DiscoverProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const location = useLocation();
	const [clans, setClans] = useState<ApiClanDiscover[]>(() => {
		const savedClans = localStorage.getItem(STORAGE_KEY);
		return savedClans ? JSON.parse(savedClans) : [];
	});
	const [categories, setCategories] = useState<Category[]>(() => {
		const savedCategories = localStorage.getItem(CATEGORIES_STORAGE_KEY);
		return savedCategories ? JSON.parse(savedCategories) : [];
	});
	const [loading, setLoading] = useState(false);
	const [categoriesLoading, setCategoriesLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedCategory, setSelectedCategory] = useState('all');

	const fetchClansDiscover = async (page: number) => {
		try {
			setLoading(true);
			setError(null);

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
			if (!response) {
				throw new Error('No response from API');
			}

			const newClans = response.clan_discover || [];
			setClans(newClans);
			setTotalPages(response.page_count || 1);

			localStorage.setItem(STORAGE_KEY, JSON.stringify(newClans));
		} catch (err) {
			setError(err instanceof Error ? err.message : 'An error occurred');
			toast.error('Cannot fetch clans, please try again later');
		} finally {
			setLoading(false);
		}
	};

	const fetchSingleClan = async (clanId: string): Promise<ApiClanDiscover | null> => {
		try {
			const mezon = new Client(
				process.env.NX_CHAT_APP_API_KEY as string,
				process.env.NX_CHAT_APP_API_GW_HOST as string,
				process.env.NX_CHAT_APP_API_GW_PORT as string,
				process.env.NX_CHAT_APP_API_SECURE === 'true'
			);

			const request: ApiClanDiscoverRequest = {
				clan_id: clanId
			};

			const response = await mezon.listClanDiscover(
				`https://${process.env.NX_CHAT_APP_API_GW_HOST}:${process.env.NX_CHAT_APP_API_GW_PORT}`,
				request
			);
			if (!response) {
				throw new Error('No response from API');
			}

			const clans = response.clan_discover || [];
			return clans.length > 0 ? clans[0] : null;
		} catch (err) {
			console.error('Failed to fetch single clan:', err);
			toast.error('Cannot fetch clan, please try again later');
			return null;
		}
	};

	useEffect(() => {
		if (location.pathname === '/clans' || location.pathname === '/') {
			fetchClansDiscover(currentPage);
		}
	}, [currentPage, location.pathname]);
	const handlePageChange = (page: number) => {
		if (page !== currentPage && page >= 1 && page <= totalPages) {
			setCurrentPage(page);
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}
	};

	const handleSearch = (term: string) => {
		setSearchTerm(term);
	};

	const handleCategorySelect = (category: string) => {
		setSelectedCategory(category);
		toast.info('Category filtering will be implemented soon!');
	};

	const value = {
		clans,
		categories,
		loading,
		categoriesLoading,
		error,
		currentPage,
		totalPages,
		searchTerm,
		selectedCategory,
		setSearchTerm,
		setSelectedCategory,
		handlePageChange,
		handleSearch,
		handleCategorySelect,
		fetchSingleClan
	};

	return <DiscoverContext.Provider value={value}>{children}</DiscoverContext.Provider>;
};

export const useDiscover = () => {
	const context = useContext(DiscoverContext);
	if (context === undefined) {
		throw new Error('useDiscover must be used within a DiscoverProvider');
	}
	return context;
};
