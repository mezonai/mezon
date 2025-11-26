import { useMezon } from '@mezon/transport';
import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import type { WalletDetail } from '../..';
import { selectAllAccount, selectIsEnabledWallet, selectIsWalletAvailable, selectWalletDetail, useAppDispatch, walletActions } from '../..';

export function useWallet(): {
	isEnableWallet?: boolean;
	isWalletAvailable?: boolean;
	walletDetail?: WalletDetail;
	enableWallet: () => Promise<void>;
	disableWallet: () => Promise<void>;
} {
	const dispatch = useAppDispatch();
	const { sessionRef } = useMezon();
	const userProfile = useSelector(selectAllAccount);
	const walletDetail = useSelector(selectWalletDetail);
	const isEnableWallet = useSelector(selectIsEnabledWallet);
	const isWalletAvailable = useSelector(selectIsWalletAvailable);

	const enableWallet = useCallback(async () => {
		const userId = userProfile?.user?.id || '';
		if (sessionRef.current?.id_token && userId) {
			const proofInput = {
				userId,
				jwt: sessionRef.current.id_token
			};

			await dispatch(walletActions.fetchZkProofs(proofInput));
		}
	}, [userProfile, sessionRef]);

	const disableWallet = useCallback(async () => {
		await dispatch(walletActions.resetState());
	}, [dispatch]);

	return { isEnableWallet, walletDetail, isWalletAvailable, enableWallet, disableWallet };
}
