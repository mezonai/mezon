import { selectIsLogin } from '@mezon/store';
import { useSelector } from 'react-redux';

import { GoogleButtonLogin } from '@mezon/components';
import isElectron from 'is-electron';
import React from 'react';
import { Navigate } from 'react-router-dom';

const InitialRoutes = () => {
	const isLogin = useSelector(selectIsLogin);
	const STATE = React.useMemo(() => {
		const randomState = Math.random().toString(36).substring(2, 15);
		sessionStorage.setItem('oauth_state', randomState);
		return randomState;
	}, []);
	if (!isLogin && isElectron()) {
		return <Navigate to="/desktop/login" replace />;
	} else if (!isLogin && !isElectron()) {
		const OAUTH2_AUTHORIZE_URL = process.env.NX_CHAT_APP_OAUTH2_AUTHORIZE_URL;
		const CLIENT_ID = process.env.NX_CHAT_APP_OAUTH2_CLIENT_ID;
		const REDIRECT_URI = encodeURIComponent(process.env.NX_CHAT_APP_OAUTH2_REDIRECT_URI as string);
		const RESPONSE_TYPE = process.env.NX_CHAT_APP_OAUTH2_RESPONSE_TYPE;
		const SCOPE = process.env.NX_CHAT_APP_OAUTH2_SCOPE;
		const authUrl = `${OAUTH2_AUTHORIZE_URL}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${RESPONSE_TYPE}&scope=${SCOPE}&state=${STATE}`;
		// return (window.location.href = authUrl);
		return <GoogleButtonLogin />;
	} else {
		return <Navigate to="/chat/direct/friends" replace />;
	}
};

export default InitialRoutes;
