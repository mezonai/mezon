import { authActions, getApplicationDetail, selectAllApps, selectTheme, useAppDispatch } from '@mezon/store';
import { Icons, Menu } from '@mezon/ui';
import isElectron from 'is-electron';
import { safeJSONParse } from 'mezon-js';
import type { ApiApp } from 'mezon-js/api.gen';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import CreateAppPopup from './CreateAppPopup';

function ApplicationsPage() {
	const { t } = useTranslation('adminApplication');
	const dispatch = useAppDispatch();
	const deepLinkUrl = safeJSONParse(localStorage.getItem('deepLinkUrl') as string);

	const [isShowCreatePopup, setIsShowCreatePopup] = useState(false);
	const toggleCreatePopup = () => {
		setIsShowCreatePopup(!isShowCreatePopup);
	};

	useEffect(() => {
		if (deepLinkUrl && isElectron()) {
			const data = safeJSONParse(decodeURIComponent(deepLinkUrl));
			dispatch(authActions.setSession(data));
			localStorage.removeItem('deepLinkUrl');
		}
	}, [deepLinkUrl, dispatch]);

	return (
		<>
			<div>
				<div className="mb-[40px]">
					<div className="flex flex-row justify-between w-full">
						<div className="text-2xl font-medium">{t('applicationsPage.title')}</div>
						<div
							onClick={toggleCreatePopup}
							className="text-[15px] py-[10px] px-[16px] text-white bg-[#5865F2] hover:bg-[#4752c4] cursor-pointer rounded-sm text-nowrap"
						>
							{t('applicationsPage.newApplicationButton')}
						</div>
					</div>
					<div className="text-[20px] dark:text-textSecondary mt-4">
						{t('applicationsPage.develop')}{' '}
						<span className="text-blue-600 hover:underline cursor-pointer">{t('applicationsPage.appsLinkText')}</span>{' '}
						{t('applicationsPage.subtitle')}
					</div>
				</div>
				<AppPageBottom />
			</div>
			{isShowCreatePopup && <CreateAppPopup togglePopup={toggleCreatePopup} />}
		</>
	);
}

const AppPageBottom = () => {
	const { t } = useTranslation('adminApplication');
	const appearanceTheme = useSelector(selectTheme);
	const [dropdownValue, setDropdownValue] = useState(t('applicationsPage.sortOptions.dateOfCreation'));
	const allApplications = useSelector(selectAllApps);

	const alphabetSort = useCallback((arr: Array<ApiApp> | undefined) => {
		if (arr) {
			const arrCopy = [...arr];
			return arrCopy.sort((a, b) => {
				const isANum = /^\d/.test(a.appname ?? '');
				const isBNum = /^\d/.test(b.appname ?? '');
				if (isANum && !isBNum) {
					return -1;
				} else if (!isANum && isBNum) {
					return 1;
				} else {
					return (a.appname ?? '').localeCompare(b.appname ?? '');
				}
			});
		}
		return [];
	}, []);

	const isChooseAZ = useMemo(() => {
		return dropdownValue === t('applicationsPage.sortOptions.alphabetical');
	}, [dropdownValue, t]);

	const appListForDisplaying = useMemo(() => {
		if (isChooseAZ) {
			return alphabetSort(allApplications.apps);
		} else {
			return allApplications.apps;
		}
	}, [allApplications.apps, isChooseAZ, alphabetSort]);

	const handleDropdownValue = useCallback((text: string) => {
		setDropdownValue(text);
	}, []);

	const selectedDropdownClass = useMemo(() => 'dark:bg-[#313338] bg-[#f2f3f5]', []);

	const [isSmallSizeSort, setIsSmallSizeSort] = useState(true);

	const sortMenuContent = useMemo(
		() => (
			<div
				className={`dark:bg-[#2b2d31] bg-white border-none py-[6px] px-[8px] max-h-[200px] overflow-y-scroll ${appearanceTheme === 'light' ? 'customSmallScrollLightMode' : 'thread-scroll'} z-20 rounded-lg shadow-lg`}
			>
				<Menu.Item
					onClick={() => {
						handleDropdownValue(t('applicationsPage.sortOptions.dateOfCreation'));
					}}
					className={`truncate px-3 py-2 rounded-md hover:bg-[#f3f4f6] dark:hover:bg-[#3f4147] cursor-pointer transition-colors duration-150 ${
						isChooseAZ
							? 'text-[#374151] dark:text-[#d1d5db]'
							: 'bg-[#e5e7eb] dark:bg-[#313338] text-[#1f2937] dark:text-white font-medium'
					}`}
				>
					{t('applicationsPage.sortOptions.dateOfCreation')}
				</Menu.Item>
				<Menu.Item
					onClick={() => {
						handleDropdownValue(t('applicationsPage.sortOptions.alphabetical'));
					}}
					className={`truncate px-3 py-2 rounded-md hover:bg-[#f3f4f6] dark:hover:bg-[#3f4147] cursor-pointer transition-colors duration-150 ${
						isChooseAZ
							? 'bg-[#e5e7eb] dark:bg-[#313338] text-[#1f2937] dark:text-white font-medium'
							: 'text-[#374151] dark:text-[#d1d5db]'
					}`}
				>
					{t('applicationsPage.sortOptions.alphabetical')}
				</Menu.Item>
			</div>
		),
		[appearanceTheme, isChooseAZ, handleDropdownValue, t]
	);

	return (
		<div>
			<div className="flex justify-between items-center mb-[32px] max-md:block">
				<div className="flex gap-4 w-fit items-center">
					<div>{t('applicationsPage.sortBy')}</div>
					<Menu
						trigger="click"
						menu={sortMenuContent}
						placement="bottomRight"
						className={`dark:bg-[#2b2d31] bg-white border-none py-[6px] px-[8px]   z-20 rounded-lg shadow-lg`}
					>
						<div className="w-[170px] h-[40px] rounded-md dark:bg-[#1e1f22] bg-bgLightModeThird flex flex-row px-3 justify-between items-center">
							<p className="truncate max-w-[90%]">{dropdownValue}</p>
							<div>
								<Icons.ArrowDownFill />
							</div>
						</div>
					</Menu>
				</div>
				<div className="flex w-fit gap-4 max-md:mt-4">
					<div
						className={`cursor-pointer flex items-center gap-3 p-3 max-md:p-3 rounded-md w-fit h-fit ${isSmallSizeSort ? 'bg-[#e6e6e8] dark:bg-[#3f4147]' : ''}`}
						onClick={() => setIsSmallSizeSort(true)}
					>
						<div className={`w-5`}>
							<Icons.SortBySmallSizeBtn className="w-full h-fit" />
						</div>
						<div>{t('small')}</div>
					</div>
					<div
						className={`cursor-pointer flex items-center gap-3 p-3 max-md:p-3 rounded-md w-fit h-fit ${!isSmallSizeSort ? 'bg-[#e6e6e8] dark:bg-[#3f4147]' : ''}`}
						onClick={() => setIsSmallSizeSort(false)}
					>
						<div className="w-5">
							<Icons.SortByBigSizeBtn />
						</div>
						<div>{t('large')}</div>
					</div>
				</div>
			</div>
			{appListForDisplaying && appListForDisplaying.length > 0 && (
				<ApplicationsList isSmallSizeSort={isSmallSizeSort} appListForDisplaying={appListForDisplaying} />
			)}
		</div>
	);
};

interface IApplicationsListProps {
	isSmallSizeSort: boolean;
	appListForDisplaying: ApiApp[];
}

const ApplicationsList = ({ isSmallSizeSort, appListForDisplaying }: IApplicationsListProps) => {
	const { t } = useTranslation('adminApplication');
	const dispatch = useAppDispatch();
	const navigate = useNavigate();

	const goToAppDetailPage = async (id: string) => {
		await dispatch(getApplicationDetail({ appId: id }));
		navigate(id);
	};

	const applications = appListForDisplaying.filter((app) => app.app_url && app.app_url.trim() !== '');
	const bots = appListForDisplaying.filter((app) => !app.app_url || app.app_url.trim() === '');

	const renderAppList = (items: ApiApp[], title: string) => (
		<div className="flex flex-col gap-5">
			<div className="text-[20px]">{title}</div>
			<div className="flex flex-wrap gap-2 gap-y-2 w-full">
				{items.map((value, index) => (
					<div
						onClick={() => goToAppDetailPage(value.id as string)}
						key={index}
						className={`relative p-[10px] rounded-md cursor-pointer hover:-translate-y-2 duration-200 hover:shadow-2xl ${isSmallSizeSort ? 'w-[128px] applicationItemSmallSort' : 'w-[206px] applicationItemLargeSort'} ${value.is_shadow ? 'dark:bg-[#474a51] dark:hover:bg-[#393a40] bg-[#c6ccd2] hover:bg-[#adaeaf]' : 'dark:bg-[#2b2d31] dark:hover:bg-[#1e1f22] bg-bgLightModeSecond hover:bg-[#e3e5e8]'}`}
					>
						{value.is_shadow && (
							<div className="w-fit p-[6px] rounded-full dark:bg-bgLightPrimary bg-bgPrimary top-1 left-1 absolute">
								<Icons.ShadowBotIcon className="w-6 dark:text-textPrimaryLight text-textPrimary" />
							</div>
						)}
						{value.applogo ? (
							<img src={value.applogo} alt="" className="aspect-square object-cover rounded-md w-full" />
						) : (
							<div className={`dark:bg-[#111214] bg-white aspect-square flex justify-center items-center rounded-md w-full`}>
								{value.appname?.charAt(0).toUpperCase()}
							</div>
						)}
						<div className="w-full text-center truncate">{value.appname}</div>
					</div>
				))}
			</div>
		</div>
	);

	return (
		<div className="flex flex-col gap-8">
			{applications.length > 0 && renderAppList(applications, t('applicationsPage.sections.myApplications'))}
			{bots.length > 0 && renderAppList(bots, t('applicationsPage.sections.myBots'))}
		</div>
	);
};
export default ApplicationsPage;
