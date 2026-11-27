import { selectIsLogin } from '@mezon/store';
import { consumePostLoginRedirect, isDeveloperPortalPath, sanitizePostLoginRedirect, savePostLoginRedirect } from '@mezon/utils';
import { useSelector } from 'react-redux';

import React, { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { OpenInDesktopAppPage, landingDesktopAppLink } from '../layouts/OpenInDesktopAppPrompt';

const InitialRoutes = () => {
	const isLogin = useSelector(selectIsLogin);
	const redirectTarget = useMemo(() => {
		if (typeof window === 'undefined') return null;
		const params = new URLSearchParams(window.location.search);
		return sanitizePostLoginRedirect(params.get('redirect'));
	}, []);
	const isDeveloperRedirect = isDeveloperPortalPath(redirectTarget);
	const STATE = React.useMemo(() => {
		const randomState = Math.random().toString(36).substring(2, 15);
		sessionStorage.setItem('oauth_state', randomState);
		return randomState;
	}, []);
	const [continueInBrowser, setContinueInBrowser] = useState(false);

	useEffect(() => {
		if (redirectTarget) {
			savePostLoginRedirect(redirectTarget);
		}
	}, [redirectTarget]);

	useEffect(() => {
		if (isLogin && isDeveloperRedirect && redirectTarget) {
			consumePostLoginRedirect();
			window.location.replace(redirectTarget);
		}
	}, [isLogin, isDeveloperRedirect, redirectTarget]);

	if (!isLogin && landingDesktopAppLink && !continueInBrowser && !isDeveloperRedirect) {
		return <OpenInDesktopAppPage link={landingDesktopAppLink} onContinueInBrowser={() => setContinueInBrowser(true)} />;
	}
	if (!isLogin) {
		if (redirectTarget) {
			savePostLoginRedirect(redirectTarget);
		}
		const OAUTH2_AUTHORIZE_URL = process.env.NX_CHAT_APP_OAUTH2_AUTHORIZE_URL;
		const CLIENT_ID = process.env.NX_CHAT_APP_OAUTH2_CLIENT_ID;
		const REDIRECT_URI = encodeURIComponent(process.env.NX_CHAT_APP_OAUTH2_REDIRECT_URI as string);
		const RESPONSE_TYPE = process.env.NX_CHAT_APP_OAUTH2_RESPONSE_TYPE;
		const SCOPE = process.env.NX_CHAT_APP_OAUTH2_SCOPE;
		const authUrl = `${OAUTH2_AUTHORIZE_URL}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${RESPONSE_TYPE}&scope=${SCOPE}&state=${STATE}`;
		window.location.replace(authUrl);
		return null;
	}
	if (isDeveloperRedirect) {
		return null;
	}
	return <Navigate to={redirectTarget || '/chat/direct/friends'} replace />;
};

export default InitialRoutes;
