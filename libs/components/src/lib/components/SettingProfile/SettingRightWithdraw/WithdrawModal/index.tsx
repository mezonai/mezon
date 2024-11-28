import { useSDK } from '@metamask/sdk-react';
import { accountActions, selectAllAccount, useAppDispatch } from '@mezon/store';
import { MezonContext } from '@mezon/transport';
import { Icons } from '@mezon/ui';
import { BrowserProvider, Contract, ethers } from 'ethers';
import isElectron from 'is-electron';
import { useContext, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import QRModal from '../QRModal';
import WalletConfirm from '../WalletConfirm';
import WithdrawConfirm from '../WithdrawConfirm';

const MEZON_TREASURY_ABI = [
	'event Withdrawn(address indexed user, uint256 amount, string requestId)',
	'function withdraw(string requestId, uint256 amount, bytes memory signature) public',
	'function WITHDRAWER_ROLE() view returns (bytes32)',
	'function hasRole(bytes32 role, address account) view returns (bool)'
];

const CONTRACT_ADDRESS = process.env.NX_CHAT_APP_CONTRACT_ADDRESS || '';
const MEZON_TREASURY_URL = process.env.NX_CHAT_APP_MEZON_TREASURY_URL || '';
const MEZONTREASURY_API_KEY = process.env.NX_CHAT_APP_API_MEZONTREASURY_KEY || '';
interface IProp {
	onClose: () => void;
	totalToken: number;
	userId: string | undefined;
	onRefetch: () => void;
}

const WithDrawModal = ({ onClose, totalToken, userId, onRefetch }: IProp) => {
	const userProfile = useSelector(selectAllAccount);

	const dispatch = useAppDispatch();
	const { connected, sdk, provider } = useSDK();
	const [qrUri, setQrUri] = useState<string>('');
	const [isLoading, setIsLoading] = useState(false);
	const [onOpenWalletConfirm, setOnOpenWalletConfirm] = useState<boolean>(false);
	const [openModelConfirm, setOpenModelConfirm] = useState<boolean>(false);
	const { refreshSession, sessionRef } = useContext(MezonContext);

	const [currentStep, setCurrentStep] = useState(2);
	const [formData, setFormData] = useState({
		coin: 'MezonTreasury',
		address: '',
		amount: 0
	});

	const coins = [{ value: 'MezonTreasury', label: 'MezonTreasury' }];

	const steps = [
		{ id: 1, title: 'Select coin', field: 'coin' },
		{
			id: 2,
			title: 'Address',
			fields: 'address'
		},
		{
			id: 3,
			title: 'Withdrawal amount',
			fields: 'amount'
		}
	];

	const handleInputChange = (field: string, value: string) => {
		let updatedValue = value;
		if (field === 'amount') {
			const regex = /^\d*\.?\d{0,6}$/;
			if (value === '' || regex.test(value)) {
				updatedValue = value;
			}
		}

		setFormData((prev) => ({
			...prev,
			[field]: updatedValue
		}));
		if (currentStep === 2 && field.startsWith('address') && formData.address && value) {
			setCurrentStep(3);
		}
	};

	const isStepComplete = (step: number) => {
		if (step === 1) return true;
		if (step === 2) return !!formData.address;
		if (step === 3) return !!formData.amount;
		return false;
	};

	useEffect(() => {
		if (sdk) {
			sdk.on('display_uri', setQrUri);
		}

		return () => {
			if (sdk) {
				sdk.off('display_uri', setQrUri);
			}
		};
	}, [connected, sdk]);
	if (!sdk || !provider) {
		return;
	}
	const getContract = async () => {
		const ethersProvider = new BrowserProvider(provider);
		const signer = await ethersProvider.getSigner();
		return new Contract(CONTRACT_ADDRESS, MEZON_TREASURY_ABI, signer);
	};

	const getSignature = async () => {
		refreshSession({
			token: sessionRef.current?.token ?? '',
			refresh_token: sessionRef.current?.refresh_token ?? '',
			created: sessionRef.current?.created ?? true
		});
		try {
			setIsLoading(true);

			const response = await fetch(`${MEZON_TREASURY_URL}/api/withdraws/withdraw-token`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-Treasury-Key': MEZONTREASURY_API_KEY
				},
				body: JSON.stringify({
					amount: Number(formData.amount),
					address: formData.address,

					mezonUserId: userId,
					mezonAccessToken: sessionRef.current?.token
				})
			});

			const data = await response.json();

			if (!response.ok) {
				const errorMessage = data?.errorMessage || 'Something went wrong';
				throw new Error(errorMessage);
			}

			return {
				signature: data.data.signature,
				requestId: data.data.requestId,
				chainId: data.data.chainId
			};
		} catch (error: any) {
			toast.error(error.message);
			console.error('Error getting signature:', error);

			throw error;
		}
	};

	const connectWalletHandler = async () => {
		try {
			if (isElectron()) {
				const accounts = await sdk?.connect();
				const userAddress = accounts?.[0];

				if (userAddress) {
					setFormData((prev) => ({
						...prev,
						address: userAddress
					}));
					setCurrentStep(3);
				}
				if (!sdk) {
					return <div>No SDK</div>;
				}
			} else {
				const accounts = await sdk?.connect();
				const userAddress = accounts?.[0];

				if (userAddress) {
					setFormData((prev) => ({
						...prev,
						address: userAddress
					}));
					setCurrentStep(3);
				}
			}
		} catch (err) {
			toast.error(`Failed to connect:${err}`);
			console.error('Failed to connect:', err);
		}
	};

	const postHash = async (hash: string, id: string) => {
		await fetch(`${MEZON_TREASURY_URL}/api/withdraws/confirm-transaction`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-Treasury-Key': MEZONTREASURY_API_KEY
			},
			body: JSON.stringify({
				requestId: id,
				transactionHash: hash,
				mezonAccessToken: sessionRef.current?.token
			})
		});
	};
	const handleReject = async (id: string) => {
		await fetch(`${MEZON_TREASURY_URL}/api/withdraws/reject-transaction`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-Treasury-Key': MEZONTREASURY_API_KEY
			},
			body: JSON.stringify({
				requestId: id,
				mezonAccessToken: sessionRef.current?.token
			})
		});
	};
	async function switchNetwork(chainId: number) {
		if (!window.ethereum) {
			toast.error('MetaMask is not installed!');
			return;
		}

		try {
			await window.ethereum.request({
				method: 'wallet_switchEthereumChain',
				params: [{ chainId: ethers.toBeHex(chainId) }]
			});
			toast.success('Change network successful');
		} catch (error: any) {
			if (error.code === 4902) {
				console.error('Chain not found in MetaMask. Adding the chain...');
			} else {
				console.error('Failed to switch network:', error);
			}
		}
	}
	const handleWithdraw = async () => {
		if (!formData.address || !formData.amount) return;

		setIsLoading(true);

		try {
			const { signature, requestId, chainId } = await getSignature();
			if (!signature) return;
			const contract = await getContract();
			const amount = ethers.parseUnits(formData.amount.toString(), 18);
			const networkVersion = await provider.getNetworkVersion();
			if (Number(networkVersion) !== Number(chainId)) {
				try {
					await switchNetwork(chainId);
				} catch (error) {
					toast.error('Please change network');
					return;
				}
			}

			try {
				const res = await contract.withdraw(requestId, amount, signature);

				postHash(res.hash, requestId);
				const currentWallet = JSON.parse(userProfile?.wallet ?? '{}');
				const newWalletValue = (currentWallet.value || 0) - parseFloat(formData.amount.toString());
				dispatch(accountActions.setWalletValue(newWalletValue));
				onClose();
				toast.info('In processing');
				await res.wait();
				toast.success('Withdrawal successful');

				onRefetch();
			} catch (error: any) {
				if (error.code === 'ACTION_REJECTED') {
					toast.error('Transaction was rejected');
					await handleReject(requestId);
				} else if (error.message.includes('Permission denied') || error.reason === 'Permission denied' || error.code === 'CALL_EXCEPTION') {
					await handleReject(requestId);
					toast.error('Permission denied');
				} else {
					console.error('Failed to initialize withdrawal:', error);
					toast.error('Failed to initialize withdrawal');
				}
			}
		} catch (error) {
			console.error('Failed to initialize withdrawal:', error);
			setIsLoading(false);
			toast.error('Failed to initialize withdrawal');
		} finally {
			setIsLoading(false);
		}
	};

	const closeModal = () => {
		setOnOpenWalletConfirm(false);
	};
	const openModal = () => {
		setOnOpenWalletConfirm(true);
	};
	const closeModalConfirm = () => {
		setOpenModelConfirm(false);
	};
	const openModalConfirm = () => {
		if (totalToken < formData.amount) toast.error(`Number of tokens you can withdraw:${totalToken} MZT`);
		else if (0 > formData.amount) toast.error(`Please enter a valid amount.`);
		else setOpenModelConfirm(true);
	};

	const handleMaximum = () => {
		setFormData((prev) => ({ ...prev, amount: Number(totalToken) }));
	};

	return (
		<div className="outline-none justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-40 focus:outline-none bg-black bg-opacity-80 dark:text-white text-black hide-scrollbar overflow-hidden">
			<div className={`relative w-full sm:h-auto rounded-lg max-w-[600px]`}>
				<div className="rounded-lg text-sm overflow-hidden">
					<div className="dark:bg-[#1E1F22] bg-bgLightModeSecond dark:text-white text-black flex justify-between items-center p-4">
						<h4 className="font-bold text-base">Withdraw</h4>

						<span className="text-3xl leading-3 dark:hover:text-white hover:text-black" onClick={onClose}>
							×
						</span>
					</div>
					<div className="dark:bg-[#313339] bg-white h-fit min-h-80 max-h-[76vh] overflow-y-scroll hide-scrollbar p-8 gap-y-4 flex flex-col">
						<div className=" dark:bg-[#313339] bg-white flex justify-center  ">
							<div className="w-full max-w-2xl">
								<div className="relative my-4">
									<div className="">
										{steps.map((step, index) => (
											<div key={step.id} className="relative flex items-start pb-12">
												{index < steps.length - 1 && (
													<div
														className={`absolute left-4 top-4 ${
															step.id <= currentStep - 1 ? 'bg-white' : 'bg-gray-500'
														} transition-all duration-300 h-[100%] w-1`}
													/>
												)}

												<div
													className={`relative w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors duration-300 z-10
                          ${step.id <= currentStep - 1 ? 'bg-white' : 'bg-gray-500 text-white'}`}
												>
													{step.id > currentStep - 1 ? step.id : <Icons.Check />}
												</div>

												<div className="ml-8 flex-1">
													<div className="flex flex-col space-y-2 py-2">
														<span className="text-[14px] font-bold text-white ">{step.title}</span>

														{step.id === 1 ? (
															<select
																value={formData.coin}
																onChange={(e) => handleInputChange('intro', e.target.value)}
																className="w-full p-2 bg-gray-50 border rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
															>
																{coins.map((coin) => (
																	<option key={coin.value} value={coin.value}>
																		{coin.label}
																	</option>
																))}
															</select>
														) : step.id === 2 ? (
															<div className=" flex flex-1">
																<input
																	type="text"
																	value={formData.address}
																	onChange={(e) => handleInputChange('address', e.target.value)}
																	placeholder="Enter address or Connect Wallet"
																	className={`text-gray-700 flex-1 p-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-200
                                   										 
                                                           
                                                       border-gray-200
                                                       
                                   										 ${step.id < currentStep && formData.address ? 'bg-gray-50' : ''}`}
																/>
																<button
																	onClick={openModal}
																	className=" bg-blue-500 border p-2 rounded-r-lg border-blue-500 cursor-pointer hover:bg-opacity-80 text-white"
																>
																	Connect Wallet
																</button>
															</div>
														) : (
															<div className="space-y-2">
																<div className="relative">
																	<input
																		type="number"
																		onChange={(e) => handleInputChange('amount', e.target.value)}
																		className={`[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-gray-700 w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200
																			${step.id === currentStep ? 'border-blue-500' : 'border-gray-200'}
																			${step.id < currentStep && formData.amount ? 'bg-gray-50' : ''}`}
																		placeholder="Enter quantity"
																		disabled={step.id !== currentStep}
																		value={formData.amount}
																		min={0}
																		step="0.001"
																		max={totalToken}
																		required
																	/>
																	<div className="absolute inset-y-0 end-0 top-0 flex items-center pe-2 z-10 cursor-pointer ">
																		<button
																			disabled={step.id !== currentStep}
																			onClick={handleMaximum}
																			className="text-blue-500 cursor-pointer"
																		>
																			MAXIMUM
																		</button>
																	</div>
																</div>
															</div>
														)}
													</div>
												</div>
											</div>
										))}
									</div>
									<div className=" h-[1px] bg-gray-400 -mt-6 ml-16" style={{ width: 'calc(100% - 4rem)' }}>
										{' '}
									</div>
									<div className="flex justify-between mt-3 ml-16">
										<div className="flex flex-col">
											<p className="text-[16px] text-white">Amount received</p>
											<p className="text-[12px] text-white">{formData.amount} : MZT</p>
										</div>
										<button
											onClick={openModalConfirm}
											disabled={!isStepComplete(3)}
											className="px-4 py-2 text-sm font-medium text-white bg-blue-500 
            rounded-md hover:bg-blue-600 
            disabled:opacity-50 disabled:cursor-not-allowed"
										>
											Withdraw
										</button>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
			{onOpenWalletConfirm && <WalletConfirm onWalletConfirm={connectWalletHandler} onClose={closeModal} />}
			{openModelConfirm && (
				<WithdrawConfirm
					onClose={closeModalConfirm}
					onHandelConfirm={handleWithdraw}
					isLoading={isLoading}
					address={formData.address}
					coin={formData.amount}
				/>
			)}
			{qrUri && isElectron() && <QRModal uri={qrUri} onClose={() => setQrUri('')} address={formData.address} />}
		</div>
	);
};

export default WithDrawModal;
