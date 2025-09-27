import { selectAllAccount, selectSession, selectWalletDetail, selectZkProofs, useAppDispatch, walletActions } from '@mezon/store';
import { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';

export function useWallet() {
	const dispatch = useAppDispatch();
	const sessionUser = useSelector(selectSession);
	const userProfile = useSelector(selectAllAccount);
	const zkProofs = useSelector(selectZkProofs);
	const walletDetail = useSelector(selectWalletDetail);

	const [isEnableWallet, setIsEnableWallet] = useState<boolean>(false);

	const fetchWalletData = useCallback(async () => {
		if (!zkProofs || !userProfile?.user?.id) return;
		try {
			setIsEnableWallet(true);
			await dispatch(walletActions.fetchWalletDetail({ userId: userProfile?.user?.id })).unwrap();
		} catch (error) {
			console.error(`Error loading wallet detail:`, error);
		}
	}, [zkProofs, userProfile]);

	const enableWallet = useCallback(async () => {
		const userId = userProfile?.user?.id || '';
		if (sessionUser?.token && userId) {
			await dispatch(walletActions.fetchEphemeralKeyPair());
			await dispatch(walletActions.fetchAddress({ userId: userId }));

			const proofInput = {
				userId: userId,
				jwt: sessionUser?.token
			};

			await dispatch(walletActions.fetchZkProofs(proofInput));
		}
	}, [userProfile, sessionUser]);

	return { isEnableWallet, walletDetail, fetchWalletData, enableWallet };
}
