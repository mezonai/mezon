import { useMemberContext } from '@mezon/core';
import { MezonIcon, MzIcons20 } from '@mezon/ui';
import { useTranslation } from 'react-i18next';

const MemberTopBar = () => {
	const { t } = useTranslation('memberTable');
	const { searchQuery, setSearchQuery } = useMemberContext();

	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchQuery(e.target.value);
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
						<MezonIcon icon={MzIcons20.mzSearch} className="text-[var(--mz-icon)]" />
					</div>
				</div>
			</div>
		</div>
	);
};

export default MemberTopBar;
