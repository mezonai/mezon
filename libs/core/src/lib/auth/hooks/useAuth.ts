import type { AuthenticateEmailPayload } from '@mezon/store';
import { accountActions, authActions, selectAllAccount, selectSession, useAppDispatch } from '@mezon/store';
import type { Session } from 'mezon-js';
import type { ApiLinkAccountConfirmRequest, ApiLoginIDResponse } from 'mezon-js/dist/api.gen';
import React, { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';

export function useAuth() {
	const userProfile = useSelector(selectAllAccount);
	const session = useSelector(selectSession);
	const dispatch = useAppDispatch();

	const userId = useMemo(() => userProfile?.user?.id, [userProfile]);

	const fetchUserProfile = React.useCallback(async () => {
		const action = await dispatch(accountActions.getUserProfile());
		return action.payload;
	}, [dispatch]);

	const loginByEmail = useCallback(
		async (token: string) => {
			const action = await dispatch(authActions.authenticateMezon(token));
			const session = action.payload;
			dispatch(accountActions.setAccount(session));
			return session;
		},
		[dispatch]
	);

	const confirmEmailOTP = useCallback(
		async (data: ApiLinkAccountConfirmRequest) => {
			const action = await dispatch(authActions.confirmEmailOTP(data));
			const session = action.payload;
			dispatch(accountActions.setAccount(session));
			return session;
		},
		[dispatch]
	);

	const authenticateEmailPassword = useCallback(
		async (data: AuthenticateEmailPayload) => {
			const action = await dispatch(authActions.authenticateEmail(data));
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
			loginByEmail,
			confirmEmailOTP,
			authenticateEmailPassword,
			qRCode,
			checkLoginRequest,
			fetchUserProfile,
			confirmLoginRequest,
			session
		}),
		[
			userProfile,
			userId,
			loginByEmail,
			confirmEmailOTP,
			authenticateEmailPassword,
			qRCode,
			checkLoginRequest,
			fetchUserProfile,
			confirmLoginRequest,
			session
		]
	);
}
