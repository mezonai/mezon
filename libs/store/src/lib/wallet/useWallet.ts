import { useCallback, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import {
	WalletDetail,
	selectAllAccount,
	selectIsEnabledWallet,
	selectIsWalletAvailable,
	selectSession,
	selectWalletDetail,
	useAppDispatch,
	walletActions
} from '../..';

export function useWallet(): {
	isEnableWallet?: boolean;
	isWalletAvailable?: boolean;
	walletDetail?: WalletDetail;
	fetchWalletData: () => Promise<void>;
	enableWallet: () => Promise<void>;
	disableWallet: () => Promise<void>;
} {
	const firstRender = useRef(true);
	const dispatch = useAppDispatch();
	const sessionUser = useSelector(selectSession);
	const userProfile = useSelector(selectAllAccount);
	const walletDetail = useSelector(selectWalletDetail);
	const isEnableWallet = useSelector(selectIsEnabledWallet);
	const isWalletAvailable = useSelector(selectIsWalletAvailable);

	const fetchWalletData = useCallback(async () => {
		if (!isEnableWallet || !userProfile?.user?.id) return;
		try {
			await dispatch(walletActions.fetchWalletDetail({ userId: userProfile?.user?.id })).unwrap();
		} catch (error) {
			console.error(`Error loading wallet detail:`, error);
		}
	}, [isEnableWallet, userProfile]);

	useEffect(() => {
		if (!firstRender.current) {
			fetchWalletData();
		} else {
			firstRender.current = false;
		}
	}, [fetchWalletData]);

	const enableWallet = useCallback(async () => {
		const userId = userProfile?.user?.id || '';
		if (sessionUser?.token && userId) {
			await dispatch(walletActions.fetchEphemeralKeyPair());
			await dispatch(walletActions.fetchAddress({ userId }));

			const proofInput = {
				userId,
				jwt: sessionUser?.token
			};

			const res = await dispatch(walletActions.fetchZkProofs(proofInput));
			if (res.payload) {
				await dispatch(walletActions.setIsEnabledWallet(true));
			}
		}
	}, [userProfile, sessionUser]);

	const disableWallet = useCallback(async () => {
		await dispatch(walletActions.resetState());
	}, []);

	return { isEnableWallet, walletDetail, isWalletAvailable, fetchWalletData, enableWallet, disableWallet };
}
