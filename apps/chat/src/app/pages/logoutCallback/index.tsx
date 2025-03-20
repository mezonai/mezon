import { useAppNavigation } from '@mezon/core';
import { appActions, authActions, selectAllAccount, selectIsLogin, useAppDispatch } from '@mezon/store';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';

const LogoutCallback = () => {
	const dispatch = useAppDispatch();
	const userProfile = useSelector(selectAllAccount);
	const { navigate } = useAppNavigation();
	const isLogin = useSelector(selectIsLogin);

	useEffect(() => {
		const logout = async () => {
			await dispatch(
				authActions.logOut({
					device_id: userProfile?.user?.username || '',
					platform: 'desktop'
				})
			);
			await dispatch(appActions.setIsShowSettingFooterStatus(false));
		};

		logout();
	}, [dispatch, userProfile]);
	useEffect(() => {
		if (!isLogin) {
			navigate('/login');
		}
	}, [isLogin, navigate]);

	return <div className="bg-[#313338] text-white w-screen h-screen flex justify-center items-center">Processing logout...</div>;
};

export default LogoutCallback;
