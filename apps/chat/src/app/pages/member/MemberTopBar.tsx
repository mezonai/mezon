import { useMemberContext } from '@mezon/core';
import { Icons } from '@mezon/ui';

const MemberTopBar = () => {
	const { searchQuery, setSearchQuery, isSort, setIsSort } = useMemberContext();

	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchQuery(e.target.value);
	};

	const toggleSortOrder = () => {
		setIsSort(!isSort);
	};

	return (
		<div className="flex flex-row justify-between items-center py-2 px-4 border-b-[1px] dark:border-borderDivider border-buttonLightTertiary">
			<h2 className="text-base font-semibold">Recent Members</h2>
			<div className="flex flex-row items-center gap-2">
				<div className="relative">
					<div
						className={`transition-all duration-300 w-[450px] h-8 pl-4 pr-2 py-3 dark:bg-bgTertiary bg-bgModifierHoverLight rounded items-center inline-flex`}
					>
						<input
							type="text"
							placeholder="Search by clannick, display name or username"
							className="dark:text-contentTertiary text-textLightTheme placeholder-contentTertiary outline-none bg-transparent w-full"
							value={searchQuery}
							onChange={handleSearchChange}
						/>
					</div>
					<div className="w-5 h-6 flex flex-row items-center pl-1 absolute right-1 bg-transparent top-1/2 transform -translate-y-1/2">
						<Icons.Search />
					</div>
				</div>
				<div>
					<button
						className="h-8 rounded text-sm font-medium flex gap-1 px-2 focus:ring-transparent bg-bgModifierHoverLight dark:bg-buttonSecondary hover:!bg-buttonSecondaryHover items-center dark:text-textDarkTheme text-textLightTheme"
						onClick={toggleSortOrder}
					>
						<Icons.ConvertAccount className="rotate-90 mr-1 dark:text-textDarkTheme text-textLightTheme" />
						<span>Sort</span>
					</button>
				</div>
			</div>
		</div>
	);
};

export default MemberTopBar;
