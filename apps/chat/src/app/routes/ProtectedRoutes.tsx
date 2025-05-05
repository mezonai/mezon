import { authActions, selectIsLogin, stickerSettingActions, useAppDispatch } from '@mezon/store';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Outlet, useLoaderData, useLocation } from 'react-router-dom';
import { IAuthLoaderData } from '../loaders/authLoader';

const ProtectedRoutes = () => {
	const { isLogin: isLoginLoader, redirect } = useLoaderData() as IAuthLoaderData;
	const isLoginStore = useSelector(selectIsLogin);
	const isLogin = isLoginLoader && isLoginStore;
	const location = useLocation();
	const dispatch = useAppDispatch();
	useEffect(() => {
		dispatch(stickerSettingActions.fetchStickerByUserId({}));
	}, [dispatch]);
	if (!isLogin) {
		dispatch(authActions.setRedirectUrl(location.pathname));
		return <Navigate to={redirect || '/desktop/login'} replace />;
	}
	return <Outlet />;
};

export default ProtectedRoutes;
