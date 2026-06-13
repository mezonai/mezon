import { authActions, selectAppsFetchingLoading, selectIsLogin, useAppDispatch } from '@mezon/store';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { Outlet, useLoaderData, useLocation, useParams } from 'react-router-dom';
import { getAppDetailTabs } from '../common/constants/appDetailTabs';
import { getSidebarTabs } from '../common/constants/tabSideBar';
import AppDetailLeftMenu from '../components/AppDetailLeftMenu';
import CollapseSideBar from '../components/CollapseSideBar';
import Header from '../components/Header';
import SideBar from '../components/SideBar';
import { useAppearance } from '../context/AppearanceContext';
import type { IAuthLoaderData } from '../loader/authLoader';

const RootLayout: React.FC = () => {
	const { t } = useTranslation('adminApplication');
	const dispatch = useAppDispatch();
	const location = useLocation();
	const { isLogin: isLoginLoader } = useLoaderData() as IAuthLoaderData;
	const isLoginStore = useSelector(selectIsLogin);
	const isLogin = isLoginLoader && isLoginStore;
	const redirectStarted = useRef(false);
	const { isDarkMode } = useAppearance();
	const applicationLoading = useSelector(selectAppsFetchingLoading);
	const [showCollapseSideBar, setShowCollapseSideBar] = useState(false);
	const toggleCollapseSideBar = () => {
		setShowCollapseSideBar(!showCollapseSideBar);
	};

	const param = useParams();
	const menuItems = useMemo(() => {
		if (param.applicationId) {
			return getAppDetailTabs(t);
		}
		return getSidebarTabs(t);
	}, [param, t]);
	const skipOAuthRedirect = process.env.NX_ADMIN_SKIP_OAUTH_REDIRECT === 'true';

	useEffect(() => {
		if (isLogin || redirectStarted.current || skipOAuthRedirect) {
			return;
		}

		const timer = setTimeout(() => {
			redirectStarted.current = true;
			dispatch(authActions.setRedirectUrl(location.pathname + location.search));

			const chatLoginUrl = process.env.NX_ADMIN_CHAT_LOGIN_URL || '/';
			window.location.replace(chatLoginUrl);
		}, 300);

		return () => clearTimeout(timer);
	}, [dispatch, isLogin, location.pathname, location.search, skipOAuthRedirect]);

	if (!isLogin) {
		return <LoadingScreen />;
	}

	return (
		<>
			{applicationLoading === 'loading' && <LoadingScreen />}
			<div className="dark:bg-bgPrimary bg-bgLightPrimary flex flex-col h-screen dark:text-textDarkTheme text-textLightTheme">
				<Header toggleSideBar={toggleCollapseSideBar} isShowSideBar={showCollapseSideBar} />
				<div className="flex flex-1 overflow-hidden">
					<CollapseSideBar
						currentAppId={param.applicationId}
						tabs={menuItems}
						isShow={showCollapseSideBar}
						toggleSideBar={toggleCollapseSideBar}
					/>
					<div className="min-w-[350px] px-[32px] pt-[16px] pb-[32px] h-full overflow-y-auto max-lg:hidden">
						{param.applicationId ? (
							<AppDetailLeftMenu currentAppId={param.applicationId} tabs={menuItems} />
						) : (
							<SideBar tabs={menuItems} />
						)}
					</div>
					<div
						className={`w-full h-full overflow-y-auto overflow-x-hidden px-[32px] py-[16px] ${isDarkMode ? '' : 'customScrollLightMode'}`}
					>
						<Outlet />
					</div>
				</div>
			</div>
		</>
	);
};

const LoadingScreen = () => {
	return (
		<div className="fixed inset-0 bg-[#313337] flex justify-center items-center z-[9999] text-white text-sm">
			<span>Loading ...</span>
		</div>
	);
};

export default RootLayout;
