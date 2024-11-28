import { Icons } from '@mezon/ui';
import isElectron from 'is-electron';
import { useEffect } from 'react';
import QRCode from 'react-qr-code';

interface QRModalProps {
	readonly uri: string;
	readonly onClose: () => void;
	readonly address?: string;
}

function QRModal({ uri, onClose, address }: QRModalProps) {
	useEffect(() => {
		if (address) {
			onClose();
		}
	}, [address, onClose]);
	if (!isElectron() || !uri) {
		return null;
	}

	return (
		<div className="fixed top-0 left-0 right-0 bottom-0 flex justify-center bg-black bg-opacity-10 items-center z-60">
			<div className="bg-white rounded-[10] p-[20px] text-center max-w-[90%] w-[400px] shadow-lg flex gap-2 flex-col">
				<div className="flex justify-end">
					<button>
						<span className="text-3xl leading-3 text-slate-600 dark:hover:text-slate-700 hover:text-black" onClick={onClose}>
							×
						</span>
					</button>
				</div>
				<div className="flex flex-col gap-5 px-[40px]">
					<div className="justify-between items-center flex ">
						<Icons.MetaMaskIcon className="h-[44px] w-[44px]" /> <h2 className="font-semibold text-[38px] dark:text-black">METAMASK</h2>
					</div>

					<div className="flex justify-center rounded-lg bg-white">
						<QRCode
							value={uri}
							size={256}
							style={{
								height: 'auto',
								maxWidth: '100%',
								width: '100%'
							}}
							viewBox="0 0 256 256"
						/>
					</div>
					<div className="flex flex-col justify-center gap-2 mb-3">
						<h2 className="font-normal text-[14px] dark:text-black">Scan QR Code to Connect</h2>
						<h2 className="font-bold text-[14px] dark:text-blue-600">MetaMask mobile app</h2>
					</div>
				</div>
			</div>
		</div>
	);
}

export default QRModal;
