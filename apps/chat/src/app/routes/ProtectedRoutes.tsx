import { selectIsLogin } from '@mezon/store';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Outlet, useLoaderData, useLocation, useNavigate } from 'react-router-dom';
import type { IAuthLoaderData } from '../loaders/authLoader';
import { attemptChannelAppBeforeLogin, getMobileChannelPath } from '../utils/channelDeeplink';

const MobileChannelLoginRedirect = ({ path }: { path: string }) => {
	const navigate = useNavigate();
	useEffect(() => attemptChannelAppBeforeLogin(path, () => navigate('/mezon', { replace: true })), [path, navigate]);
	return null;
};

const ProtectedRoutes = () => {
	const { isLogin: isLoginLoader } = useLoaderData() as IAuthLoaderData;
	const isLoginStore = useSelector(selectIsLogin);
	const isLogin = isLoginLoader && isLoginStore;
	const { pathname } = useLocation();

	if (!isLogin) {
		const channelPath = getMobileChannelPath(pathname);
		if (channelPath) return <MobileChannelLoginRedirect path={channelPath} />;
		return <Navigate to="/mezon" replace />;
	}
	return <Outlet />;
};

export default ProtectedRoutes;
