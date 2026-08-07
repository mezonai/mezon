import { selectIsLogin } from '@mezon/store';
import { useSelector } from 'react-redux';
import { Navigate, Outlet, useLoaderData } from 'react-router-dom';
import type { IAuthLoaderData } from '../loaders/authLoader';

const ProtectedRoutes = () => {
	const { isLogin: isLoginLoader } = useLoaderData() as IAuthLoaderData;
	const isLoginStore = useSelector(selectIsLogin);
	const isLogin = isLoginLoader && isLoginStore;

	if (!isLogin) {
		return <Navigate to="/mezon" replace />;
	}
	return <Outlet />;
};

export default ProtectedRoutes;
