import { Icons } from '@mezon/ui';
import { ChangeEvent } from 'react';

const ChannelTopBar = ({
	searchQuery,
	handleSearchChange
}: {
	searchQuery?: string;
	handleSearchChange: (e: ChangeEvent<HTMLInputElement>) => void;
}) => {
	return (
		<div className="flex flex-row justify-between items-center py-2 px-4 border-b-theme-primary flex-1">
			<h2 className="text-base font-semibold">Recent Channels</h2>
			<div className="flex flex-row items-center gap-2">
				<div className="relative">
					<div
						className={`transition-all duration-300 w-[450px] h-8 pl-4 pr-2 py-3 rounded-lg items-center inline-flex bg-theme-input border-theme-primary`}
					>
						<input
							type="text"
							placeholder="Search by channel label"
							className=" outline-none bg-transparent  w-full"
							value={searchQuery}
							onChange={handleSearchChange}
						/>
					</div>
					<div className="w-5 h-6 flex flex-row items-center pl-1 absolute right-1 border-theme-p top-1/2 transform -translate-y-1/2">
						<Icons.Search />
					</div>
				</div>
			</div>
		</div>
	);
};

export default ChannelTopBar;
