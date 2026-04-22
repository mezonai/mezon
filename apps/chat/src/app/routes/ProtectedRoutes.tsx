import { authActions, selectIsLogin, useAppDispatch } from '@mezon/store';
import { useSelector } from 'react-redux';
import { Navigate, Outlet, useLoaderData, useLocation } from 'react-router-dom';
import type { IAuthLoaderData } from '../loaders/authLoader';

const ProtectedRoutes = () => {
	const { isLogin: isLoginLoader, redirect } = useLoaderData() as IAuthLoaderData;
	const isLoginStore = useSelector(selectIsLogin);
	const isLogin = isLoginLoader && isLoginStore;
	const location = useLocation();
	const dispatch = useAppDispatch();
	if (!isLogin) {
		dispatch(authActions.setRedirectUrl(location.pathname));
		return <Navigate to={redirect || '/desktop/login'} replace />;
	}
	return <Outlet />;
};

export default ProtectedRoutes;
