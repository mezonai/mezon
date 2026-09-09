import { selectAllUserClans } from '@mezon/store';
import type { UsersClanEntity } from '@mezon/utils';
import { getNameForPrioritize, normalizeString } from '@mezon/utils';
import { createContext, useContext, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

export type SortField = 'name' | 'memberSince' | 'joinedMezon' | 'roles';

export type SortDirection = 'asc' | 'desc';

interface MemberContextType {
	searchQuery: string;
	setSearchQuery: (query: string) => void;
	filteredMembers: UsersClanEntity[];

	sortField: SortField | null;
	sortDirection: SortDirection;
	setSort: (field: SortField) => void;
}

const MemberContext = createContext<MemberContextType | undefined>(undefined);

const compareMembers = (a: UsersClanEntity & { prioritizeName?: string }, b: UsersClanEntity & { prioritizeName?: string }, field: SortField) => {
	switch (field) {
		case 'name':
			return normalizeString(a.prioritizeName ?? '').localeCompare(normalizeString(b.prioritizeName ?? ''));

		case 'memberSince':
			return new Date(a.user?.join_time_seconds ?? 0).getTime() - new Date(b.user?.join_time_seconds ?? 0).getTime();

		case 'joinedMezon':
			return new Date(a.user?.create_time_seconds ?? 0).getTime() - new Date(b.user?.create_time_seconds ?? 0).getTime();

		case 'roles':
			return (a.role_id?.length ?? 0) - (b.role_id?.length ?? 0);

		default:
			return 0;
	}
};

export const useMemberContext = () => {
	const context = useContext(MemberContext);
	if (!context) {
		throw new Error('useMemberContext must be used within a MemberProvider');
	}
	return context;
};

export const MemberProvider = ({ children }: { children: React.ReactNode }) => {
	const [searchQuery, setSearchQuery] = useState('');
	const [sortField, setSortField] = useState<SortField | null>(null);
	const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
	const usersClan = useSelector(selectAllUserClans);

	const usersWithPrioritizeName = useMemo(
		() =>
			usersClan.map((member: UsersClanEntity) => ({
				...member,
				prioritizeName: getNameForPrioritize(member.clan_nick ?? '', member.user?.display_name ?? '', member.user?.username ?? '')
			})),
		[usersClan]
	);

	const filteredMembers = useMemo(() => {
		const searchLowerCase = normalizeString(searchQuery).toLowerCase();

		const filtered = usersWithPrioritizeName.filter((member) => {
			const prioritizeNameMatch = normalizeString(member.prioritizeName ?? '')
				.toLowerCase()
				.includes(searchLowerCase);

			const usernameMatch = member.user?.username?.toLowerCase().includes(searchLowerCase);

			return prioritizeNameMatch || usernameMatch;
		});

		if (!sortField) {
			return filtered;
		}

		return [...filtered].sort((a, b) => {
			const result = compareMembers(a, b, sortField);

			return sortDirection === 'asc' ? result : -result;
		});
	}, [usersWithPrioritizeName, searchQuery, sortField, sortDirection]);

	const setSort = (field: SortField) => {
		if (sortField === field) {
			setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
			return;
		}
		setSortField(field);
		setSortDirection('asc');
	};

	const contextValue = useMemo(
		() => ({
			searchQuery,
			setSearchQuery,
			filteredMembers,
			sortField,
			sortDirection,
			setSort
		}),
		[searchQuery, filteredMembers, sortField, sortDirection]
	);

	return <MemberContext.Provider value={contextValue}>{children}</MemberContext.Provider>;
};
