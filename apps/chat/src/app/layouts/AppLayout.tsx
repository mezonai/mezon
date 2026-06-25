import { ToastController } from '@mezon/components';
import { useCustomNavigate, useMezonNavigateEvent } from '@mezon/core';
import { selectIsLogin } from '@mezon/store';
import { MezonUiProvider } from '@mezon/ui';
import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Outlet, useLoaderData } from 'react-router-dom';
import { useNotificationDisconnect } from '../hooks/useNotificationManagement';
import type { IAppLoaderData } from '../loaders/appLoader';

const AppLayout = () => {
	const isLogin = useSelector(selectIsLogin) ?? false;

	useNotificationDisconnect(isLogin);

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

	const { redirectTo } = useLoaderData() as IAppLoaderData;
	useEffect(() => {
		if (redirectTo) {
			navigate(redirectTo);
		}
	}, [redirectTo, navigate]);

	return null;
};

export default AppLayout;
