import { getApplicationDetail, selectAllApps, selectTheme, useAppDispatch } from '@mezon/store';
import { Icons, Menu } from '@mezon/ui';
import type { ApiApp } from 'mezon-js/api.gen';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import type { ITabs } from '../../common/constants/tabSideBar';

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
	const [loading, setLoading] = useState<boolean>(false);
	const { t } = useTranslation('adminApplication');

	const currentApp = useMemo(() => {
		return allApps?.apps?.find((a) => a.id === currentAppId);
	}, [allApps?.apps, currentAppId]);

	const filteredApps = useMemo(() => {
		if (!allApps?.apps) return [];

		const isApp = Boolean(currentApp?.app_url);
		const filtered = allApps.apps.filter((a) => (isApp ? Boolean(a.app_url) : !a.app_url));

		return filtered.filter((a) => a.id != null).sort((a, b) => String(a.id).localeCompare(String(b.id)));
	}, [allApps?.apps, currentApp?.app_url]);

	const dropdownLabel = useMemo(() => {
		return filteredApps.length > 0 && filteredApps[0]?.app_url ? 'APP' : 'BOT';
	}, [filteredApps]);

	useEffect(() => {
		if (currentApp && filteredApps.find((a) => a.id === currentAppId) && currentApp.appname) {
			setDropdownValue(currentApp.appname);
		} else if (filteredApps.length > 0 && filteredApps[0].appname) {
			setDropdownValue(filteredApps[0].appname);
		}
	}, [currentApp, filteredApps, currentAppId]);

	const onSelectApp = useCallback(
		async (app: ApiApp) => {
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
		},
		[currentAppId, dispatch, navigate]
	);

	const menuContent = useMemo(
		() => (
			<div
				className={`dark:bg-[#2b2d31] bg-white border-none py-[6px] px-[8px] max-h-[200px] overflow-y-scroll thread-scroll z-20 rounded-lg shadow-lg`}
			>
				{loading ? (
					<div className="text-center text-gray-500 py-2">Loading...</div>
				) : (
					filteredApps.map((app) =>
						app?.id && app?.appname ? (
							<Menu.Item
								key={app.id}
								onClick={() => onSelectApp(app)}
								className="truncate px-3 py-2 rounded-md hover:bg-[#f3f4f6] dark:hover:bg-[#3f4147] cursor-pointer transition-colors duration-150 text-[#374151] dark:text-[#d1d5db]"
							>
								{app.appname}
							</Menu.Item>
						) : null
					)
				)}
			</div>
		),
		[loading, filteredApps, onSelectApp]
	);

	return (
		<div className="flex flex-col gap-6 items-center w-full">
			<Link to="/developers/applications" className="w-full flex gap-1 items-center">
				<Icons.LeftArrowIcon className="w-4" />
				<div>{t('backToApps')}</div>
			</Link>

			<div className="w-full">
				<div className="text-[12px] font-semibold mb-1">{t('selectLabel', { type: dropdownLabel })}</div>
				<Menu
					trigger="click"
					menu={menuContent}
					placement="bottomRight"
					className={`dark:bg-[#2b2d31] bg-white border-none py-[6px] px-[8px]  z-20 rounded-lg shadow-lg`}
				>
					<div className="w-full h-[40px] rounded-md dark:bg-[#1e1f22] bg-bgLightModeThird flex px-3 justify-between items-center">
						<p className="truncate max-w-[90%]">{dropdownValue}</p>
						<Icons.ArrowDownFill />
					</div>
				</Menu>
			</div>

			<div className="w-full">
				<div className="text-[12px] font-semibold mb-2">{t('settings')}</div>
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
