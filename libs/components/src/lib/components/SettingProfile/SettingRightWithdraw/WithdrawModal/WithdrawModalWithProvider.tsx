import { MetaMaskProvider } from '@metamask/sdk-react';
import WithDrawModal from './index';

interface WithdrawModalProps {
	userId: string | undefined;
	onClose: () => void;
	totalToken: number;
	onRefetch: () => void;
}

export const WithdrawModalWithProvider = (props: WithdrawModalProps) => {
	return (
		<MetaMaskProvider
			debug={false}
			sdkOptions={{
				dappMetadata: {
					name: 'Mezon',
					url: window.location.href
				},
				headless: true
			}}
		>
			<WithDrawModal {...props} />
		</MetaMaskProvider>
	);
};

export default WithdrawModalWithProvider;
