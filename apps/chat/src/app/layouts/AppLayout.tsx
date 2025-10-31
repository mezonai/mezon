import { ToastController } from '@mezon/components';
import { useCustomNavigate, useMezonNavigateEvent } from '@mezon/core';
import { fcmActions, selectAllAccount, selectAllSession, selectIsLogin, useAppDispatch } from '@mezon/store';
import { Icons, MezonUiProvider } from '@mezon/ui';
import {
	CLOSE_APP,
	IMAGE_WINDOW_TITLE_BAR_ACTION,
	MAXIMIZE_WINDOW,
	MINIMIZE_WINDOW,
	TITLE_BAR_ACTION,
	UNMAXIMIZE_WINDOW,
	isLinuxDesktop,
	isMacDesktop,
	isWindowsDesktop,
	notificationService
} from '@mezon/utils';
import isElectron from 'is-electron';
import { Session } from 'mezon-js';
import React, { useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Outlet, useLoaderData, useLocation } from 'react-router-dom';
import type { IAppLoaderData } from '../loaders/appLoader';
import { MacOSWindowControls } from './MacWindowsControl';

type TitleBarProps = {
	eventName: string;
};

const TitleBar: React.FC<TitleBarProps> = ({ eventName }) => {
	const handleMinimize = () => {
		window.electron.send(eventName, MINIMIZE_WINDOW);
	};
	useEffect(() => {
		document.body.classList.add('overflow-hidden');
	}, []);

	const handleMaximize = () => {
		window.dispatchEvent(new Event('resize'));
		window.electron.send(eventName, MAXIMIZE_WINDOW);
	};

	const handleClose = () => {
		window.electron.send(eventName, CLOSE_APP);
	};

	const handleDoubleClick = () => {
		window.electron.send(eventName, UNMAXIMIZE_WINDOW);
	};

	return (
		<header id="titlebar" className={`bg-theme-primary`} onDoubleClick={handleDoubleClick}>
			<div id="drag-region">
				<div className="text-theme-primary-active ml-3 text-[15.15px] leading-[26.58px] font-semibold ">Mezon</div>
				<div id="window-controls">
					<div
						className="button window-hover cursor-pointer dark:hover:bg-bgModifierHover hover:bg-bgLightModeButton"
						id="min-button"
						onClick={handleMinimize}
					>
						<div className="w-fit flex flex-col items-center gap-2 text-textPrimaryLight dark:text-[#a8a6a6] group">
							<Icons.WindowMinimize className="w-[14px]" />
						</div>
					</div>
					<div
						className="button window-hover cursor-pointer dark:hover:bg-bgModifierHover hover:bg-bgLightModeButton"
						id="restore-button"
						onClick={handleMaximize}
					>
						<div className="w-fit flex flex-col items-center gap-2 text-textPrimaryLight dark:text-[#a8a6a6] group">
							<Icons.WindowZoom className="w-[10px]" />
						</div>
					</div>
					<div
						className="button window-hover-close cursor-pointer dark:hover:bg-bgModifierHover hover:bg-bgLightModeButton"
						id="close-button"
						onClick={handleClose}
					>
						<div className="w-fit flex flex-col items-center gap-2 text-textPrimaryLight dark:text-[#a8a6a6] group">
							<Icons.CloseButton className="w-[14px]" />
						</div>
					</div>
				</div>
			</div>
		</header>
	);
};

const AppLayout = () => {
	const dispatch = useAppDispatch();
	const isLogin = useSelector(selectIsLogin);
	const sessions = useSelector(selectAllSession);
	const account = useSelector(selectAllAccount);
	const currentUserId = account?.user?.id;
	const userStatus = account?.user?.status;

	useEffect(() => {
		if (currentUserId) {
			notificationService.setCurrentActiveUserId(currentUserId);
			if (userStatus) {
				notificationService.setUserStatus(currentUserId, userStatus);
			}
		}
	}, [currentUserId, userStatus]);

	const handleConnectNoti = useCallback(async () => {
		if (sessions) {
			const tasks = Object.keys(sessions).map((key) => async () => {
				const sessionData = sessions[key];

				const session = new Session(
					sessionData.token,
					sessionData.refresh_token,
					sessionData.created,
					sessionData.api_url,
					!!sessionData.is_remember
				);
				const response = await dispatch(
					fcmActions.registFcmDeviceToken({
						session: session as Session,
						tokenId: `${sessionData.user_id}`,
						deviceId: sessionData.username as string,
						platform: 'desktop'
					})
				);
				const token = (response?.payload as { token: string })?.token;

				notificationService.connect(token, sessionData.user_id as string);
			});

			await Promise.all(tasks.map((fn) => fn()));
		}
	}, [sessions, dispatch]);

	useEffect(() => {
		if (!isLogin) {
			notificationService.isActive && notificationService.disconnectAll();
			return;
		}
		const timerId = setTimeout(() => {
			handleConnectNoti();
		}, 3000);

		return () => clearTimeout(timerId);
	}, [isLogin, sessions, handleConnectNoti]);

	useMezonNavigateEvent();

	return (
		<MezonUiProvider>
			<ViewModeHandler />
			<ToastController />
			<Outlet />
		</MezonUiProvider>
	);
};

const ViewModeHandler: React.FC = () => {
	const navigate = useCustomNavigate();

	const location = useLocation();
	const urlParams = new URLSearchParams(location.search);
	const viewMode = urlParams.get('viewMode');

	const { redirectTo } = useLoaderData() as IAppLoaderData;
	useEffect(() => {
		if (redirectTo) {
			navigate(redirectTo);
		}
	}, [redirectTo, navigate]);

	useEffect(() => {
		if (isElectron() && viewMode === 'image') {
			const handleKeyDown = (event: KeyboardEvent) => {
				if (event.key === 'Escape') {
					window.electron.send(IMAGE_WINDOW_TITLE_BAR_ACTION, CLOSE_APP);
				}
			};

			document.addEventListener('keydown', handleKeyDown);

			return () => {
				document.removeEventListener('keydown', handleKeyDown);
			};
		}
	}, [viewMode]);

	if (isWindowsDesktop || isLinuxDesktop) {
		return <TitleBar eventName={viewMode === 'image' ? IMAGE_WINDOW_TITLE_BAR_ACTION : TITLE_BAR_ACTION} />;
	}

	if (isMacDesktop) {
		return <MacOSWindowControls />;
	}

	return null;
};

export default AppLayout;
