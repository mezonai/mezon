import { lazy, Suspense } from 'react';

const WithdrawModalWithProvider = lazy(() => import('./WithdrawModal/WithdrawModalWithProvider'));

interface WithdrawModalProps {
	userId: string | undefined;
	onClose: () => void;
	totalToken: number;
	onRefetch: () => void;
}

export const LazyWithdrawModal = ({ userId, onClose, totalToken, onRefetch }: WithdrawModalProps) => {
	return (
		<Suspense fallback={<div className="text-center p-4">Loading...</div>}>
			<WithdrawModalWithProvider userId={userId} onClose={onClose} totalToken={totalToken} onRefetch={onRefetch} />
		</Suspense>
	);
};

export default LazyWithdrawModal;
