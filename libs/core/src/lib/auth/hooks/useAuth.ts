import { accountActions, authActions, selectAllAccount, useAppDispatch } from '@mezon/store';
import { Session } from 'mezon-js';
import { ApiLoginIDResponse } from 'mezon-js/dist/api.gen';
import React, { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';

export function useAuth() {
	const userProfile = useSelector(selectAllAccount);

	const dispatch = useAppDispatch();

	const userId = useMemo(() => userProfile?.user?.id, [userProfile]);

	const fetchUserProfile = React.useCallback(async () => {
		const action = await dispatch(accountActions.getUserProfile());
		return action.payload;
	}, [dispatch]);

	const loginByGoogle = useCallback(
		async (token: string) => {
			const action = await dispatch(authActions.authenticateGoogle(token));
			const session = action.payload;
			dispatch(accountActions.setAccount(session));
			return session;
		},
		[dispatch]
	);

	const loginByEmail = useCallback(
		async (token: string) => {
			const action = await dispatch(authActions.authenticateMezon(token));
			const session = action.payload;
			dispatch(accountActions.setAccount(session));
			return session;
		},
		[dispatch]
	);

	const loginByApple = useCallback(
		async (token: string) => {
			const action = await dispatch(authActions.authenticateApple(token));
			const session = action.payload;
			dispatch(accountActions.setAccount(session));
			return session;
		},
		[dispatch]
	);

	const qRCode = useCallback(async () => {
		const action = await dispatch(authActions.createQRLogin());
		const loginQR = action.payload as ApiLoginIDResponse;
		return loginQR;
	}, [dispatch]);

	const checkLoginRequest = useCallback(
		async (loginId: string, isRemember: boolean) => {
			const action = await dispatch(
				authActions.checkLoginRequest({
					loginId: loginId || '',
					isRemember
				})
			);
			const session = action.payload as Session;
			return session;
		},
		[dispatch]
	);

	const confirmLoginRequest = useCallback(
		async (loginId: string) => {
			const action = await dispatch(authActions.confirmLoginRequest({ loginId: loginId || '' }));
			const session = action.payload as Session;
			return session;
		},
		[dispatch]
	);

	return useMemo(
		() => ({
			userProfile,
			userId,
			loginByGoogle,
			loginByEmail,
			qRCode,
			checkLoginRequest,
			loginByApple,
			fetchUserProfile,
			confirmLoginRequest
		}),
		[userProfile, userId, loginByGoogle, qRCode, loginByApple, fetchUserProfile, loginByEmail]
	);
}
