import { getApplicationDetail, selectAllApps, selectTheme, useAppDispatch } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { Dropdown } from 'flowbite-react';
import { ApiApp } from 'mezon-js/api.gen';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ITabs } from '../../common/constants/tabSideBar';

interface ISideBarProps {
	tabs: ITabs[];
	currentAppId?: string;
}

const AppDetailLeftMenu = ({ tabs, currentAppId }: ISideBarProps) => {
	const appearanceTheme = useSelector(selectTheme);
	const allApps = useSelector(selectAllApps);
	const navigate = useNavigate();
	const dispatch = useAppDispatch();
	const [dropdownValue, setDropdownValue] = useState<string>('Choose application');
	const [filteredApps, setFilteredApps] = useState<ApiApp[]>([]);
	const [loading, setLoading] = useState<boolean>(false);

	useEffect(() => {
		if (!allApps?.apps) return;

		const current = allApps.apps.find((a) => a.id === currentAppId);
		const isApp = Boolean(current?.app_url);

		const filtered = allApps.apps.filter((a) => (isApp ? Boolean(a.app_url) : !a.app_url));

		const sorted = filtered.filter((a) => a.id != null).sort((a, b) => String(a.id).localeCompare(String(b.id)));

		setFilteredApps(sorted);

		if (current && sorted.find((a) => a.id === currentAppId) && current.appname) {
			setDropdownValue(current.appname);
		} else if (sorted.length > 0 && sorted[0].appname) {
			setDropdownValue(sorted[0].appname);
		}
	}, [allApps, currentAppId]);

	const onSelectApp = async (app: ApiApp) => {
		if (!app.appname || !app.id) return;
		if (app.id === currentAppId) return;

		setLoading(true);
		setDropdownValue(app.appname);

		try {
			await dispatch(getApplicationDetail({ appId: app.id }));
		} catch (error: any) {
			if (error instanceof Error) {
				toast.error(`Error fetching application details: ${error.message}`);
			} else {
				toast.error('An unknown error occurred');
			}
		} finally {
			setLoading(false);
		}
		navigate(`/developers/applications/${app.id}/information`);
	};

	return (
		<div className="flex flex-col gap-6 items-center w-full">
			<Link to="/developers/applications" className="w-full flex gap-1 items-center">
				<Icons.LeftArrowIcon className="w-4" />
				<div>Back to Applications</div>
			</Link>

			<div className="w-full">
				<div className="text-[12px] font-semibold mb-1">SELECT {filteredApps.length > 0 && filteredApps[0]?.app_url ? 'APP' : 'BOT'}</div>
				<Dropdown
					label=""
					trigger="click"
					renderTrigger={() => (
						<div className="w-full h-[40px] rounded-md dark:bg-[#1e1f22] bg-bgLightModeThird flex px-3 justify-between items-center">
							<p className="truncate max-w-[90%]">{dropdownValue}</p>
							<Icons.ArrowDownFill />
						</div>
					)}
					placement="bottom-end"
					className={`dark:bg-black bg-white border-none py-[6px] px-[8px] max-h-[200px] overflow-y-scroll ${appearanceTheme === 'light' ? 'customSmallScrollLightMode' : 'thread-scroll'} z-20`}
				>
					{loading ? (
						<div className="text-center text-gray-500">Loading...</div>
					) : (
						filteredApps.map((app) =>
							app?.id && app?.appname ? (
								<Dropdown.Item key={app.id} onClick={() => onSelectApp(app)} className="truncate">
									{app.appname}
								</Dropdown.Item>
							) : null
						)
					)}
				</Dropdown>
			</div>

			<div className="w-full">
				<div className="text-[12px] font-semibold mb-2">SETTINGS</div>
				<div className="flex flex-col w-full gap-[10px]">
					{tabs.map((tab, idx) =>
						tab && tab.routerLink ? (
							<NavLink
								key={idx}
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
						) : null
					)}
				</div>
			</div>
		</div>
	);
};

export default AppDetailLeftMenu;
