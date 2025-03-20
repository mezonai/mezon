import { selectAllApps, selectTheme } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { Dropdown } from 'flowbite-react';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, NavLink } from 'react-router-dom';
import { ITabs } from '../../common/constants/tabSideBar';

interface ISideBarProps {
	tabs: ITabs[];
	mode?: string;
	currentAppId?: string;
}

const AppDetailLeftMenu = ({ tabs, mode = 'root', currentAppId }: ISideBarProps) => {
	const [dropdownValue, setDropdownValue] = useState('Choose application');
	const handleDropdownValue = (text: string) => {
		setDropdownValue(text);
	};
	const appearanceTheme = useSelector(selectTheme);
	const allApps = useSelector(selectAllApps);

	return (
		<div className="flex flex-col gap-6 items-center w-full ">
			<Link to={'/developers/applications'} className="w-full flex gap-1 items-center">
				<div className="w-4">
					<Icons.LeftArrowIcon className="w-full" />
				</div>
				<div>Back to Applications</div>
			</Link>
			<div className="w-full">
				<div className="text-[12px] font-semibold">SELECT APP</div>
				<Dropdown
					trigger="click"
					renderTrigger={() => (
						<div className="w-full h-[40px] rounded-md dark:bg-[#1e1f22] bg-bgLightModeThird flex flex-row px-3 justify-between items-center">
							<p className="truncate max-w-[90%]">{dropdownValue}</p>
							<div>
								<Icons.ArrowDownFill />
							</div>
						</div>
					)}
					label=""
					placement="bottom-end"
					className={`dark:bg-black bg-white border-none py-[6px] px-[8px] max-h-[200px] overflow-y-scroll ${appearanceTheme === 'light' ? 'customSmallScrollLightMode' : 'thread-scroll'} z-20`}
				>
					{allApps.apps &&
						allApps.apps.map((item) => (
							<Dropdown.Item
								key={item.id}
								children={<div>{item.appname}</div>}
								onClick={() => {
									handleDropdownValue(item.appname as string);
								}}
								className={`truncate`}
							/>
						))}
				</Dropdown>
			</div>
			<div className="w-full">
				<div className="text-[12px] font-semibold mb-2">SETTINGS</div>
				<div className="flex flex-col w-full gap-[10px]">
					{tabs.map((tab, index) => (
						<NavLink
							key={index}
							to={`/developers/applications/${currentAppId}/${tab.routerLink}`}
							className={({ isActive }) =>
								isActive
									? 'sidebar-tab flex gap-3 items-center py-2 px-4 dark:bg-[#3C4370] bg-bgLightModeButton text-[#5865F3] dark:text-[#C9CDFB] rounded-[4px]'
									: 'sidebar-tab flex gap-3 items-center py-2 px-4 dark:text-white text-textLightTheme hover:dark:bg-[#3C4370] hover:bg-bgLightModeButton hover:text-[#5865F3] rounded-md'
							}
						>
							{tab.imgSrc && <img src={tab.imgSrc} alt="img" width={20} height={20} />}
							<div>{tab.icon}</div>
							<p className="font-medium text-base">{tab.name}</p>
						</NavLink>
					))}
				</div>
			</div>
		</div>
	);
};

export default AppDetailLeftMenu;
