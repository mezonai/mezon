import React from 'react';
import { NavLink } from 'react-router-dom';
import { ITabs } from '../common/constants/tabSideBar';

interface ISideBarProps {
	tabs: ITabs[];
	mode?: string;
}

const SideBar: React.FC<ISideBarProps> = ({ tabs, mode = 'root' }) => {
	return (
		<div className="flex flex-col items-center w-full">
			<div className="flex flex-col w-full gap-[10px]">
				{tabs.map((tab, index) => (
					<NavLink
						key={index}
						to={`/developers/${tab.routerLink}`}
						className={({ isActive }) =>
							isActive
								? 'sidebar-tab flex gap-1 items-center py-2 px-4 dark:bg-[#3C4370] bg-bgLightModeButton text-[#5865F3] dark:text-[#C9CDFB] rounded-[4px]'
								: 'sidebar-tab flex gap-1 items-center py-2 px-4 dark:text-textDarkTheme text-textLightTheme hover:dark:bg-[#3C4370] hover:bg-bgLightModeButton hover:text-[#5865F3] rounded-md'
						}
					>
						{tab.imgSrc && <img src={tab.imgSrc} alt="img" width={20} height={20} />}
						<p className="font-medium text-base leading-5">{tab.name}</p>
					</NavLink>
				))}
			</div>
		</div>
	);
};

export default SideBar;
