import { selectAllUserClans } from '@mezon/store';
import type { UsersClanEntity } from '@mezon/utils';
import { getNameForPrioritize, normalizeString } from '@mezon/utils';
import { createContext, useContext, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

interface MemberContextType {
	searchQuery: string;
	setSearchQuery: (query: string) => void;
	filteredMembers: UsersClanEntity[];
	isSort: boolean;
	setIsSort: (isSort: boolean) => void;
}

const MemberContext = createContext<MemberContextType | undefined>(undefined);

export const useMemberContext = () => {
	const context = useContext(MemberContext);
	if (!context) {
		throw new Error('useMemberContext must be used within a MemberProvider');
	}
	return context;
};

export const MemberProvider = ({ children }: { children: React.ReactNode }) => {
	const [searchQuery, setSearchQuery] = useState('');
	const [isSort, setIsSort] = useState(false);
	const usersClan = useSelector(selectAllUserClans);
	const usersWithPrioritizeName = usersClan.map((member: UsersClanEntity) => ({
		...member,
		prioritizeName: getNameForPrioritize(member.clanNick ?? '', member.user?.displayName ?? '', member.user?.username ?? '')
	}));

	const filteredMembers = useMemo(() => {
		const searchLowerCase = normalizeString(searchQuery).toLowerCase();

		let filtered = usersWithPrioritizeName.filter((member) => {
			const prioritizeNameMatch = normalizeString(member.prioritizeName ?? '')
				?.toLowerCase()
				.includes(searchLowerCase);
			const usernameMatch = member.user?.username?.toLowerCase().includes(searchLowerCase);

			return prioritizeNameMatch || usernameMatch;
		});

		if (isSort) {
			filtered = filtered.slice().reverse();
		}

		return filtered;
	}, [usersWithPrioritizeName, searchQuery]);

	return <MemberContext.Provider value={{ searchQuery, setSearchQuery, filteredMembers, isSort, setIsSort }}>{children}</MemberContext.Provider>;
};
