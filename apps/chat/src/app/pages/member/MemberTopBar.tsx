import { useMemberContext } from '@mezon/core';
import { Icons } from '@mezon/ui';
import { useTranslation } from 'react-i18next';

const MemberTopBar = () => {
	const { t } = useTranslation('memberTable');
	const { searchQuery, setSearchQuery, setSort } = useMemberContext();

	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchQuery(e.target.value);
	};

	const toggleSort = () => {
		setSort('memberSince');
	};

	return (
		<div className="flex flex-row justify-between items-center py-2 px-4 border-b-theme-primary">
			<h2 className="text-base font-semibold truncate">{t('topBar.recentMembers')}</h2>
			<div className="flex flex-row items-center gap-2">
				<div className="relative">
					<div
						className={`transition-all duration-300 w-[450px] h-8 pl-4 pr-2 py-3 rounded-lg items-center inline-flex bg-theme-input border-theme-primary`}
					>
						<input
							type="text"
							placeholder={t('topBar.searchPlaceholder')}
							className=" outline-none bg-transparent  w-full"
							value={searchQuery}
							onChange={handleSearchChange}
						/>
					</div>
					<div className="w-5 h-6 flex flex-row items-center pl-1 absolute right-1 border-theme-p top-1/2 transform -translate-y-1/2">
						<Icons.Search />
					</div>
				</div>
				<div>
					<button
						className="h-8 rounded text-sm font-medium flex gap-1 px-2 focus:ring-transparent bg-indigo-500 hover:bg-indigo-600 items-center text-white"
						onClick={toggleSort}
					>
						<Icons.ConvertAccount className="rotate-90 mr-1 text-white" />
						<span>{t('topBar.sort')}</span>
					</button>
				</div>
			</div>
		</div>
	);
};

export default MemberTopBar;
