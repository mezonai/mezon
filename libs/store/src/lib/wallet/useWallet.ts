import { useMezon } from '@mezon/transport';
import { useCallback, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import type { WalletDetail } from '../..';
import { selectAllAccount, selectIsEnabledWallet, selectIsWalletAvailable, selectWalletDetail, useAppDispatch, walletActions } from '../..';

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
	const { sessionRef } = useMezon();
	const userProfile = useSelector(selectAllAccount);
	const walletDetail = useSelector(selectWalletDetail);
	const isEnableWallet = useSelector(selectIsEnabledWallet);
	const isWalletAvailable = useSelector(selectIsWalletAvailable);

	const fetchWalletData = useCallback(async () => {
		if (!userProfile?.user?.id) return;
		try {
			await dispatch(walletActions.fetchWalletDetail({ userId: userProfile?.user?.id })).unwrap();
		} catch (error) {
			console.error(`Error loading wallet detail:`, error);
		}
	}, [isEnableWallet, userProfile, dispatch]);

	useEffect(() => {
		if (!firstRender.current) {
			fetchWalletData();
		} else {
			firstRender.current = false;
		}
	}, [fetchWalletData]);

	const enableWallet = useCallback(async () => {
		const userId = userProfile?.user?.id || '';
		if (sessionRef.current?.token && userId) {
			const proofInput = {
				userId,
				jwt: sessionRef.current.token
			};

			await dispatch(walletActions.fetchZkProofs(proofInput));
		}
	}, [userProfile, sessionRef]);

	const disableWallet = useCallback(async () => {
		await dispatch(walletActions.resetState());
	}, []);

	return { isEnableWallet, walletDetail, isWalletAvailable, fetchWalletData, enableWallet, disableWallet };
}
