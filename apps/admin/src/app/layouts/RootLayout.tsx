import { selectAppsFetchingLoading, selectIsLogin } from '@mezon/store';
import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Outlet, useLoaderData, useParams } from 'react-router-dom';
import { appDetailTabs } from '../common/constants/appDetailTabs';
import { tabs } from '../common/constants/tabSideBar';
import AppDetailLeftMenu from '../components/AppDetailLeftMenu';
import CollapseSideBar from '../components/CollapseSideBar';
import Header from '../components/Header';
import SideBar from '../components/SideBar';
import { useAppearance } from '../context/AppearanceContext';
import { IAuthLoaderData } from '../loader/authLoader';

const RootLayout: React.FC = () => {
	const { isLogin: isLoginLoader, redirect } = useLoaderData() as IAuthLoaderData;
	const isLoginStore = useSelector(selectIsLogin);
	const isLogin = isLoginLoader && isLoginStore;
	const { isDarkMode } = useAppearance();
	const applicationLoading = useSelector(selectAppsFetchingLoading);
	const [showCollapseSideBar, setShowCollapseSideBar] = useState(false);
	const toggleCollapseSideBar = () => {
		setShowCollapseSideBar(!showCollapseSideBar);
	};

	const param = useParams();
	const menuItems = useMemo(() => {
		if (param.applicationId) {
			return appDetailTabs;
		}
		return tabs;
	}, [param]);
	const STATE = React.useMemo(() => {
		const randomState = Math.random().toString(36).substring(2, 15);
		sessionStorage.setItem('oauth_state', randomState);
		return randomState;
	}, []);
	if (!isLogin) {
		const OAUTH2_AUTHORIZE_URL = process.env.NX_CHAT_APP_OAUTH2_AUTHORIZE_URL;
		const CLIENT_ID = process.env.NX_CHAT_APP_OAUTH2_CLIENT_ID;
		const REDIRECT_URI = encodeURIComponent(process.env.NX_CHAT_APP_OAUTH2_REDIRECT_URI as string);
		const RESPONSE_TYPE = process.env.NX_CHAT_APP_OAUTH2_RESPONSE_TYPE;
		const SCOPE = process.env.NX_CHAT_APP_OAUTH2_SCOPE;
		const authUrl = `${OAUTH2_AUTHORIZE_URL}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${RESPONSE_TYPE}&scope=${SCOPE}&state=${STATE}`;
		window.location.replace(authUrl);
	}

	return (
		<>
			{applicationLoading === 'loading' && <LoadingScreen />}
			<div className="dark:bg-bgPrimary bg-bgLightPrimary flex flex-col h-screen dark:text-textDarkTheme text-textLightTheme">
				<Header toggleSideBar={toggleCollapseSideBar} />
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
