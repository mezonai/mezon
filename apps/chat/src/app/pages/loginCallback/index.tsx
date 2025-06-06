import { FailLoginModal } from '@mezon/components';
import { useAppNavigation } from '@mezon/core';
import { authActions, selectAllAuth, selectIsLogin, useAppDispatch } from '@mezon/store';
import { useEffect } from 'react';
import { useModal } from 'react-modal-hook';
import { useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';

const LoginCallback = () => {
	const [searchParams] = useSearchParams();
	const isLogin = useSelector(selectIsLogin);
	const code = searchParams.get('code');
	const dispatch = useAppDispatch();
	const { navigate } = useAppNavigation();
	const [openUnknown] = useModal(() => {
		return <FailLoginModal />;
	}, []);

	const { redirectUrl } = useSelector(selectAllAuth);

	useEffect(() => {
		const handleLogin = async () => {
			if (!code) {
				navigate('/login');
				return;
			}

			if (isLogin) {
				const targetUrl = redirectUrl;
				dispatch(authActions.setRedirectUrl(null));
				navigate(targetUrl || '/chat/direct/friends');
				return;
			}

			try {
				const action = await dispatch(authActions.authenticateMezon(code));

				if (authActions.authenticateMezon.fulfilled.match(action)) {
					const targetUrl = redirectUrl;
					if (targetUrl) {
						dispatch(authActions.setRedirectUrl(null));
						navigate(targetUrl);
					} else {
						navigate('/chat/direct/friends');
					}
				} else if (authActions.authenticateMezon.rejected.match(action)) {
					const errorMessage = (action.error?.message as string) || 'Login failed. Please try again.';
					throw new Error(errorMessage);
				}
			} catch (error) {
				openUnknown();
			}
		};

		handleLogin();
	}, [code, dispatch, navigate]);

	return <div className="bg-[#313338] text-white w-screen h-screen flex justify-center items-center">Processing login...</div>;
};

export default LoginCallback;
