import { FailLoginModal } from '@mezon/components';
import { useAppNavigation } from '@mezon/core';
import { authActions, selectAllAuth, selectIsLogin, useAppDispatch } from '@mezon/store';
import { consumePostLoginRedirect, isDeveloperPortalPath, sanitizePostLoginRedirect } from '@mezon/utils';
import { useEffect } from 'react';
import { useModal } from 'react-modal-hook';
import { useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';

function persistAuthenticatedSession(session: unknown): void {
	if (!session || typeof localStorage === 'undefined') return;
	try {
		const raw = localStorage.getItem('persist:auth');
		const outer = raw ? JSON.parse(raw) : {};
		outer.session = JSON.stringify(session);
		outer.isLogin = 'true';
		localStorage.setItem('persist:auth', JSON.stringify(outer));
	} catch {
		return;
	}
}

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
				const targetUrl = consumePostLoginRedirect() || sanitizePostLoginRedirect(redirectUrl);
				dispatch(authActions.setRedirectUrl(null));
				if (targetUrl && isDeveloperPortalPath(targetUrl)) {
					window.location.replace(targetUrl);
					return;
				}
				navigate(targetUrl || '/chat/direct/friends');
				return;
			}

			try {
				const action = await dispatch(authActions.authenticateMezon(code));

				if (authActions.authenticateMezon.fulfilled.match(action)) {
					const targetUrl = consumePostLoginRedirect() || sanitizePostLoginRedirect(redirectUrl);
					dispatch(authActions.setRedirectUrl(null));
					if (targetUrl && isDeveloperPortalPath(targetUrl)) {
						persistAuthenticatedSession(action.payload);
						window.location.replace(targetUrl);
						return;
					}
					navigate(targetUrl || '/chat/direct/friends');
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
