import { ButtonCopy } from '@mezon/components';
import { accountActions, selectAllAccount, useAppDispatch } from '@mezon/store';
import { useMmn } from '@mezon/transport';
import { Icons } from '@mezon/ui';
import { TWalletData, WalletCrypto, WalletStorage } from '@mezon/utils';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';

interface WalletModalProps {
	isOpen: boolean;
	onClose: () => void;
}

interface IWalletState {
	address: string;
	privateKey: string;
	recoveryPhrase: string;
	showPrivateKey: boolean;
	showRecoveryPhrase: boolean;
	isEncrypted: boolean;
}

export const WalletIcon = () => (
	<svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
		<path d="M17 7H6a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h11a3 3 0 0 0 3-3v-8a3 3 0 0 0-3-3zM6 9h11a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1zm11-2H7V6a2 2 0 0 1 4 0h2a4 4 0 0 0-8 0v1H5a1 1 0 0 0 0 2h12a1 1 0 0 0 0-2z" />
		<circle cx="15" cy="13" r="1" />
	</svg>
);

const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose }) => {
	const dispatch = useAppDispatch();
	const userProfile = useSelector(selectAllAccount);
	const [walletData, setWalletData] = useState<IWalletState>({
		address: '',
		privateKey: '',
		recoveryPhrase: '',
		showPrivateKey: false,
		showRecoveryPhrase: false,
		isEncrypted: false
	});
	const [showPinModal, setShowPinModal] = useState<{
		isOpen: boolean;
		type: 'privateKey' | 'recoveryPhrase' | 'setup' | 'restore' | '';
	}>({ isOpen: false, type: '' });
	const [pin, setPin] = useState('');
	const [confirmPin, setConfirmPin] = useState('');
	const [isSettingUpPin, setIsSettingUpPin] = useState(false);

	const mmn = useMmn();

	useEffect(() => {
		loadWalletData();
	}, [userProfile]);

	const loadWalletData = async () => {
		if (!userProfile?.user?.id) return;

		try {
			const encryptedWallet = await WalletStorage.getEncryptedWallet(userProfile.user.id);

			if (encryptedWallet) {
				setWalletData((prev) => ({
					...prev,
					address: encryptedWallet.address || '',
					isEncrypted: true
				}));
			} else {
				if (userProfile?.user?.metadata) {
					try {
						const metadata = JSON.parse(userProfile.user.metadata);
						if (metadata.wallet) {
							setWalletData((prev) => ({
								...prev,
								address: metadata.wallet.address || '',
								privateKey: metadata.wallet.privateKey || '',
								recoveryPhrase: metadata.wallet.recoveryPhrase || '',
								isEncrypted: false
							}));
						}
					} catch (error) {
						console.error('Error parsing wallet metadata:', error);
					}
				}
			}
		} catch (error) {
			console.error('Error loading wallet data:', error);
		}
	};

	const generateWallet = (): TWalletData | undefined => {
		try {
			const newWallet = mmn.client.createWallet();

			setIsSettingUpPin(true);
			setShowPinModal({ isOpen: true, type: 'setup' });

			setWalletData((prev) => ({
				...prev,
				...newWallet
			}));

			return newWallet;
		} catch (error) {
			console.error('Error generating wallet:', error);
		}
	};

	const saveEncryptedWallet = async (passcode: string, wallet: TWalletData) => {
		if (!userProfile?.user?.id || !wallet.privateKey) return;

		try {
			const encryptedPrivateKey = await WalletCrypto.encryptPrivateKey(wallet.privateKey, passcode);
			const encryptedRecoveryPhrase = await WalletCrypto.encryptPrivateKey(wallet.recoveryPhrase, passcode);

			const encryptedWallet = {
				address: wallet.address,
				encryptedPrivateKey,
				encryptedRecoveryPhrase,
				privateKey: wallet.privateKey,
				createdAt: new Date().toISOString()
			};

			await WalletStorage.saveEncryptedWallet(userProfile.user.id, encryptedWallet);

			const publicWalletInfo = {
				address: wallet.address,
				encryptedPrivateKey: JSON.stringify(encryptedPrivateKey),
				createdAt: new Date().toISOString()
			};

			await dispatch(accountActions.storeWalletKey(publicWalletInfo));

			setWalletData((prev) => ({ ...prev, isEncrypted: true }));
		} catch (error) {
			console.error('Error saving encrypted wallet:', error);
		}
	};

	const restoreWallet = async (passcode: string) => {
		if (!userProfile?.user?.id || !userProfile?.mmn_encrypt_private_key || !userProfile?.user?.wallet_address) return;

		try {
			const { encryptedData, salt, iv } = JSON.parse(userProfile.mmn_encrypt_private_key);
			const decryptedPrivateKey = await WalletCrypto.decryptPrivateKey(encryptedData, salt, iv, passcode);

			setWalletData((prev) => ({
				...prev,
				address: userProfile.user.wallet_address || '',
				privateKey: decryptedPrivateKey || '',
				recoveryPhrase: '',
				isEncrypted: false
			}));

			const encryptedWallet = {
				address: userProfile.user.wallet_address,
				encryptedPrivateKey: userProfile.mmn_encrypt_private_key,
				encryptedRecoveryPhrase: '',
				privateKey: decryptedPrivateKey,
				createdAt: new Date().toISOString()
			};

			await WalletStorage.saveEncryptedWallet(userProfile.user.id, encryptedWallet);

			const publicWalletInfo = {
				address: walletData.address,
				encryptedPrivateKey: userProfile.mmn_encrypt_private_key,
				createdAt: new Date().toISOString()
			};

			dispatch(accountActions.setWalletMetadata(publicWalletInfo));
		} catch (error) {
			console.error('Error saving encrypted wallet:', error);
		}
	};

	const decryptAndShow = async (type: 'privateKey' | 'recoveryPhrase', passcode: string) => {
		if (!userProfile?.user?.id) return;

		try {
			const encryptedWallet = await WalletStorage.getEncryptedWallet(userProfile.user.id);
			if (!encryptedWallet) return;

			if (type === 'privateKey') {
				const { encryptedData, salt, iv } = JSON.parse(encryptedWallet.encryptedPrivateKey);
				const decryptedPrivateKey = await WalletCrypto.decryptPrivateKey(encryptedData, salt, iv, passcode);
				setWalletData((prev) => ({
					...prev,
					privateKey: decryptedPrivateKey,
					showPrivateKey: true
				}));
			} else {
				const { encryptedData, salt, iv } = JSON.parse(encryptedWallet.encryptedRecoveryPhrase);
				const decryptedRecoveryPhrase = await WalletCrypto.decryptPrivateKey(encryptedData, salt, iv, passcode);
				setWalletData((prev) => ({
					...prev,
					recoveryPhrase: decryptedRecoveryPhrase,
					showRecoveryPhrase: true
				}));
			}
		} catch (error) {
			console.error('Error decrypting wallet data:', error);
			toast.error('Incorrect passcode or corrupted data');
		}
	};

	const handlePinVerification = (type: 'privateKey' | 'recoveryPhrase') => {
		setShowPinModal({ isOpen: true, type });
	};

	const handlePinConfirm = async () => {
		if (showPinModal.type === 'setup') {
			if (pin.length === 6 && confirmPin.length === 6) {
				if (pin === confirmPin) {
					const wallet = generateWallet();
					if (wallet) {
						await saveEncryptedWallet(pin, wallet);
					}
					setShowPinModal({ isOpen: false, type: '' });
					setPin('');
					setConfirmPin('');
					setIsSettingUpPin(false);
				} else {
					toast.error('PINs do not match');
				}
			}
		} else {
			if (pin.length === 6) {
				if (showPinModal.type === 'restore') {
					await restoreWallet(pin);
				} else {
					await decryptAndShow(showPinModal.type as 'privateKey' | 'recoveryPhrase', pin);
				}
				setShowPinModal({ isOpen: false, type: '' });
				setPin('');
			}
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 text-theme-primary">
			<div className="thread-scroll bg-theme-setting-primary rounded-lg shadow-xl max-w-lg w-full mx-4 p-6 max-h-[80vh] overflow-y-auto">
				<div className="flex justify-between items-center mb-6">
					<h2 className="text-xl font-semibold ">Blockchain Wallet Management</h2>
					<button onClick={onClose} className="text-theme-primary-hover">
						<Icons.CloseIcon className="w-6 h-6" />
					</button>
				</div>

				{!walletData.address ? (
					<div className="text-center py-8">
						<div className="w-16 h-16 mx-auto mb-4  rounded-full flex items-center justify-center bg-item-theme">
							<WalletIcon />
						</div>
						<p className="mb-6">No wallet found</p>
						<div className="inline-flex flex-col items-stretch gap-4">
							{userProfile?.mmn_encrypt_private_key && (
								<button
									onClick={() => setShowPinModal({ isOpen: true, type: 'restore' })}
									className="btn-primary btn-primary-hover hover:bg-buttonPrimaryHover px-6 py-3 rounded-lg text-sm font-medium inline-flex items-center gap-2"
								>
									<WalletIcon />
									Restore Wallet (BIP39 Standard)
								</button>
							)}

							<button
								onClick={() => {
									setShowPinModal({ isOpen: true, type: 'setup' });
								}}
								className="btn-primary btn-primary-hover hover:bg-buttonPrimaryHover px-6 py-3 rounded-lg text-sm font-medium inline-flex items-center gap-2"
							>
								<WalletIcon />
								Generate New Wallet (BIP39 Standard)
							</button>
						</div>
					</div>
				) : (
					<div className="space-y-6">
						<div className="flex items-center gap-2 text-sm">
							<Icons.LockIcon className="w-4 h-4 text-green-500" />
							<span className="text-green-600 dark:text-green-400">
								{walletData.isEncrypted ? 'Encrypted & Secure' : 'Legacy Storage (Upgrade Recommended)'}
							</span>
						</div>

						<div>
							<label className="block text-sm font-medium  mb-2">Wallet Address</label>
							<div className="flex items-center gap-3 p-3 border rounded-lg ">
								<span className="text-sm font-mono truncate flex-1 ">{walletData.address}</span>
								<ButtonCopy copyText={walletData.address} className="p-2  rounded-md text-sm" title="Copy address" />
							</div>
						</div>

						<div>
							<label className="block text-sm font-medium  mb-2">Private Key</label>
							{walletData.showPrivateKey ? (
								<div className="space-y-3">
									<div className="p-3 border rounded-lg ">
										<span className="text-xs font-mono break-all ">{walletData.privateKey}</span>
									</div>
									<div className="flex gap-2">
										<ButtonCopy
											copyText={walletData.privateKey}
											className="flex-1 py-2 px-4 border-theme-primary text-theme-primary hover:bg-blue-600 hover:text-white rounded-lg text-sm font-medium inline-flex items-center justify-center gap-2"
											title="Copy to clipboard"
										/>

										<button
											onClick={() => setWalletData((prev) => ({ ...prev, showPrivateKey: false, privateKey: '' }))}
											className="py-2 px-4 border-theme-primary bg-secondary-button-hover text-theme-primary-hover rounded-lg text-sm  inline-flex items-center gap-2"
										>
											<Icons.EyeClose className="w-4 h-4" />
											Hide
										</button>
									</div>
								</div>
							) : (
								<button
									onClick={() => handlePinVerification('privateKey')}
									className="w-full py-3 px-4 border-2 border-dashed  rounded-lg hover:border-blue-500  transition-colors inline-flex items-center justify-center gap-2"
								>
									<Icons.EyeOpen className="w-4 h-4" />
									<span className="text-blue-500  font-medium">Show private key</span>
								</button>
							)}
						</div>

						{!!walletData.recoveryPhrase && (
							<div>
								<label className="block text-sm font-medium  mb-2">Secret Recovery Phrase</label>
								{walletData.showRecoveryPhrase ? (
									<div className="space-y-3">
										<div className="p-3 border ">
											<div className="grid grid-cols-3 gap-2">
												{walletData.recoveryPhrase.split(' ').map((word, index) => (
													<div key={index} className="text-xs font-mono p-2 rounded border text-center">
														<span className="text-[10px]">{index + 1}</span>
														<div className="">{word}</div>
													</div>
												))}
											</div>
										</div>
										<div className="flex gap-2">
											<ButtonCopy
												copyText={walletData.recoveryPhrase}
												className="flex-1 py-2 px-4 btn-primary btn-primary-hover rounded-lg text-sm font-medium inline-flex items-center justify-center gap-2"
												title="Copy to clipboard"
											/>

											<button
												onClick={() => setWalletData((prev) => ({ ...prev, showRecoveryPhrase: false, recoveryPhrase: '' }))}
												className="py-2 px-4 border  rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-700 inline-flex items-center gap-2"
											>
												<Icons.EyeClose className="w-4 h-4" />
												Hide
											</button>
										</div>
									</div>
								) : (
									<button
										onClick={() => handlePinVerification('recoveryPhrase')}
										className="w-full py-3 px-4 border-2 border-dashed  rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors inline-flex items-center justify-center gap-2"
									>
										<Icons.EyeOpen className="w-4 h-4" />
										<span className="text-blue-500 dark:text-blue-400 font-medium">Show recovery phrase</span>
									</button>
								)}
							</div>
						)}

						<div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
							<div className="flex items-start gap-3">
								<Icons.InfoIcon className="w-5 h-5 text-orange-500 dark:text-orange-400 mt-0.5 flex-shrink-0" />
								<div>
									<p className="font-bold text-theme-primary mb-2">DO NOT share your private key!</p>
									<ul className="text-theme-primary text-sm space-y-1">
										<li>• These give full access to your wallet and funds</li>
										<li>• Mezon will never ask for your private key</li>
										<li>• Private keys are encrypted and stored locally</li>
										<li>• Store recovery phrase safely offline</li>
									</ul>
								</div>
							</div>
						</div>
					</div>
				)}

				{showPinModal.isOpen && (
					<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
						<div className="bg-theme-setting-primary rounded-lg shadow-xl p-6 w-85">
							<div className="flex items-center gap-3 mb-4">
								<Icons.LockIcon className="w-6 h-6" />
								<h3 className="text-lg font-semibold ">
									{showPinModal.type === 'setup' ? 'Set Up Security PIN' : 'Security Verification'}
								</h3>
							</div>

							{showPinModal.type === 'setup' ? (
								<div>
									<p className=" mb-4">Create a 6-digit PIN to encrypt your wallet like MetaMask</p>
									<input
										type="password"
										maxLength={6}
										value={pin}
										onChange={(e) => setPin(e.target.value)}
										className="w-full p-3 border-theme-primary rounded-lg text-center text-lg font-mono bg-theme-input focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
										placeholder="••••••"
										autoFocus
									/>
									<input
										type="password"
										maxLength={6}
										value={confirmPin}
										onChange={(e) => setConfirmPin(e.target.value)}
										className="w-full p-3 border-theme-primary rounded-lg text-center text-lg font-mono bg-theme-input focus:outline-none focus:ring-2 focus:ring-blue-500"
										placeholder="Confirm PIN"
									/>
									<p className="text-xs mt-2 text-center">This PIN will encrypt your private key and recovery phrase</p>
								</div>
							) : (
								<div>
									<p className=" mb-6">
										Enter your 6-digit PIN to decrypt and view{' '}
										{showPinModal.type === 'privateKey' ? 'private key' : 'recovery phrase'}
									</p>
									<input
										type="password"
										maxLength={6}
										value={pin}
										onChange={(e) => setPin(e.target.value)}
										className="w-full p-3 border-theme-primary rounded-lg text-center text-lg font-mono bg-theme-input focus:outline-none focus:ring-2 focus:ring-blue-500"
										placeholder="••••••"
										autoFocus
									/>
									<p className="text-xs mt-2 text-center">Data is encrypted and stored securely in local</p>
								</div>
							)}

							<div className="flex gap-3 mt-6">
								<button
									onClick={() => {
										setShowPinModal({ isOpen: false, type: '' });
										setPin('');
										setConfirmPin('');
										setIsSettingUpPin(false);
									}}
									className="flex-1 py-2 px-4 border-theme-primary rounded-lg text-sm bg-secondary-button-hover "
								>
									Cancel
								</button>
								<button
									onClick={handlePinConfirm}
									disabled={showPinModal.type === 'setup' ? pin.length !== 6 || confirmPin.length !== 6 : pin.length !== 6}
									className="flex-1 py-2 px-4 btn-primary btn-primary-hover disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium inline-flex items-center justify-center gap-2"
								>
									<Icons.LockIcon className="w-4 h-4" />
									{showPinModal.type === 'setup' ? 'Encrypt Wallet' : 'Decrypt & Show'}
								</button>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default WalletModal;
