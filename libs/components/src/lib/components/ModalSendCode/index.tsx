import { useAuth } from '@mezon/core';
import {
	channelsActions,
	clansActions,
	clearAllMemoizedFunctions,
	e2eeActions,
	messagesActions,
	selectDirectById,
	selectDirectMesIdE2ee,
	selectDmGroupCurrent,
	selectHasKeyE2ee,
	selectPubkey,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { MessageCrypt } from '@mezon/utils';
import { ApiUpdateChannelDescRequest } from 'mezon-js';
import { ApiAccount, ApiPubKey } from 'mezon-js/api.gen';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

interface ModalProps {
	onClose: (check?: boolean) => void;
	onNext?: () => void;
	onBack?: () => void;
}

const ModalIntro = ({ onNext, onClose }: ModalProps) => {
	return (
		<div
			tabIndex={-1}
			className="fixed inset-0 flex items-center justify-center overflow-x-hidden overflow-y-auto z-50 outline-none focus:outline-none bg-black bg-opacity-80 dark:text-white text-black hide-scrollbar overflow-hidden"
		>
			<div className="flex flex-col items-center max-w-sm mx-auto bg-white shadow-md rounded-md relative">
				<div className="w-full dark:bg-[#1E1F22] bg-bgLightModeSecond dark:text-white text-black flex justify-end items-center p-4 rounded-t">
					<button className="text-5xl leading-3 dark:hover:text-white hover:text-black" onClick={() => onClose()}>
						<Icons.CloseButton className="w-4" />
					</button>
				</div>
				<div className="flex flex-col items-center gap-2 px-4 pb-4 dark:bg-[#1E1F22] bg-bgLightModeSecond dark:text-white text-black rounded-b">
					<h2 className="text-lg font-semibold">Set up a way to access your encrypted chats</h2>
					<p className="text-gray-600 text-center">
						With the upgrade, the content of the chat will be encrypted. You can create a PIN to access your chats if you switch devices.
					</p>
					<div className="flex justify-end w-full">
						<button onClick={onNext} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
							Create PIN
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

const ModalCreatePin = ({ onNext, onBack, onClose, setPin }: ModalProps & { setPin: React.Dispatch<React.SetStateAction<string[]>> }) => {
	const [pin, setPinLocal] = useState<string[]>(Array(6).fill(''));
	const [activeIndex, setActiveIndex] = useState(0);
	const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

	useEffect(() => {
		if (inputsRef.current[activeIndex]) {
			inputsRef.current[activeIndex]?.focus();
		}
	}, [activeIndex]);

	const handleChange = (value: string, index: number) => {
		if (!/^\d$/.test(value)) return;

		const newPin = [...pin];
		newPin[index] = value;
		setPinLocal(newPin);

		if (value && index < pin.length - 1) {
			setActiveIndex(index + 1);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
		if (e.key === 'Backspace') {
			e.preventDefault();
			const newOtp = [...pin];
			if (pin[index] === '') {
				if (index > 0) {
					newOtp[index - 1] = '';
					setPinLocal(newOtp);
					setActiveIndex(index - 1);
				}
			} else {
				newOtp[index] = '';
				setPinLocal(newOtp);
			}
		}
	};

	const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>, index: number) => {
		const pastedText = e.clipboardData.getData('text').slice(0, 6);

		if (!/^\d+$/.test(pastedText)) {
			e.preventDefault();
			return;
		}

		const newOtp = [...pin];
		for (let i = 0; i < pastedText.length; i++) {
			if (index + i < pin.length) {
				newOtp[index + i] = pastedText[i];
			}
		}
		setPinLocal(newOtp);
		setActiveIndex(Math.min(index + pastedText.length, pin.length - 1));
		// setErrorMessage('');
		e.preventDefault();
	};

	useEffect(() => {
		if (pin.every((digit) => digit !== '')) {
			setPin(pin);
			onNext?.();
		}
	}, [pin, onNext, setPin]);

	return (
		<div
			tabIndex={-1}
			className="fixed inset-0 flex items-center justify-center overflow-x-hidden overflow-y-auto z-50 outline-none focus:outline-none bg-black bg-opacity-80 dark:text-white text-black hide-scrollbar overflow-hidden"
		>
			<div className="flex flex-col items-center max-w-sm mx-auto bg-white shadow-md rounded-md relative">
				<div className="w-full dark:bg-[#1E1F22] bg-bgLightModeSecond dark:text-white text-black flex justify-between items-center p-4 rounded-t">
					<button className="text-5xl leading-3 dark:hover:text-white hover:text-black" onClick={onBack}>
						<Icons.LeftArrowIcon className="w-full" />
					</button>
					<button className="text-5xl leading-3 dark:hover:text-white hover:text-black" onClick={() => onClose()}>
						<Icons.CloseButton className="w-4" />
					</button>
				</div>
				<div className="flex flex-col items-center gap-2 px-4 pb-4 dark:bg-[#1E1F22] bg-bgLightModeSecond dark:text-white text-black rounded-b">
					<h2 className="text-lg font-semibold">Create Your PIN</h2>
					<p className="text-gray-600 text-center">Make it memorable. You'll need it when you switch to a new device</p>
					<div className="flex space-x-2 mt-4">
						{pin.map((value, index) => (
							<input
								key={index}
								ref={(el) => (inputsRef.current[index] = el)}
								type="text"
								maxLength={1}
								value={value}
								onChange={(e) => handleChange(e.target.value, index)}
								onKeyDown={(e) => handleKeyDown(e, index)}
								onPaste={(e) => handlePaste(e, index)}
								className={`w-12 h-12 text-center border rounded focus:outline-none text-lg ${index === activeIndex ? 'border-blue-500 focus:ring' : 'border-gray-300'} ${value ? 'font-bold text-black' : 'text-gray-500'} caret-transparent`}
								disabled={index !== activeIndex}
							/>
						))}
					</div>
				</div>
			</div>
		</div>
	);
};

const ModalConfirmPin = ({ onClose, onBack, pin, userProfile }: ModalProps & { pin: string[]; userProfile: ApiAccount | null | undefined }) => {
	const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
	const [activeIndex, setActiveIndex] = useState(0);
	const [errorMessage, setErrorMessage] = useState<string>('');
	const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
	const dispatch = useAppDispatch();
	const currentDmId = useSelector(selectDirectMesIdE2ee);
	const directMessageValue = useAppSelector((state) => selectDirectById(state, currentDmId));
	const currentDmGroup = useSelector(selectDmGroupCurrent(directMessageValue?.id ?? ''));
	const pubkey = useSelector(selectPubkey);

	useEffect(() => {
		if (inputsRef.current[activeIndex]) {
			inputsRef.current[activeIndex]?.focus();
		}
	}, [activeIndex]);

	useEffect(() => {
		if (otp.every((val) => val !== '')) {
			handleSubmit();
		}
	}, [otp]);

	const handleChange = (value: string, index: number) => {
		if (value.length > 1 || index !== activeIndex) return;
		if (!/^\d$/.test(value)) return;

		const newOtp = [...otp];
		newOtp[index] = value;
		setOtp(newOtp);

		if (errorMessage) {
			setErrorMessage('');
		}

		if (value !== '' && index < otp.length - 1) {
			setActiveIndex(index + 1);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
		if (e.key === 'Backspace') {
			e.preventDefault();
			const newOtp = [...otp];
			if (otp[index] === '') {
				if (index > 0) {
					newOtp[index - 1] = '';
					setOtp(newOtp);
					setActiveIndex(index - 1);
				}
			} else {
				newOtp[index] = '';
				setOtp(newOtp);
			}
		}
	};

	const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>, index: number) => {
		const pastedText = e.clipboardData.getData('text').slice(0, 6);

		if (!/^\d+$/.test(pastedText)) {
			e.preventDefault();
			return;
		}

		const newOtp = [...otp];
		for (let i = 0; i < pastedText.length; i++) {
			if (index + i < otp.length) {
				newOtp[index + i] = pastedText[i];
			}
		}
		setOtp(newOtp);
		setActiveIndex(Math.min(index + pastedText.length, otp.length - 1));
		setErrorMessage('');
		e.preventDefault();
	};

	const handleEnableE2ee = useCallback(async (directId?: string, e2ee?: number) => {
		if (!directId) return;
		const updateChannel: ApiUpdateChannelDescRequest = {
			channel_id: directId,
			channel_label: '',
			category_id: currentDmGroup.category_id,
			app_url: currentDmGroup.app_url,
			e2ee: !currentDmGroup.e2ee ? 1 : 0
		};
		await dispatch(channelsActions.updateChannel(updateChannel));
	}, []);

	const handleSubmit = async () => {
		const otpCode = otp.join('');
		const pinCode = pin.join('');
		try {
			if (userProfile?.encrypt_private_key) {
				await MessageCrypt.decryptPrivateKeyWithPIN(userProfile?.encrypt_private_key, otpCode, userProfile?.user?.id as string);
				onClose(true);
				clearAllMemoizedFunctions();
				dispatch(e2eeActions.setHasKey(true));
				if (currentDmId) {
					if (!directMessageValue?.e2ee) {
						handleEnableE2ee(directMessageValue?.id, directMessageValue?.e2ee);
					}
					dispatch(messagesActions.fetchMessages({ clanId: '0', channelId: currentDmId as string, foundE2ee: true }));
				}
			} else {
				if (otpCode === pinCode) {
					const encryptWithPIN = await MessageCrypt.encryptPrivateKeyWithPIN(userProfile?.user?.id as string, otpCode);
					dispatch(
						clansActions.updateUser({
							user_name: userProfile?.user?.username as string,
							avatar_url: userProfile?.user?.avatar_url as string,
							display_name: userProfile?.user?.display_name as string,
							about_me: userProfile?.user?.about_me as string,
							dob: userProfile?.user?.dob as string,
							encrypt_private_key: encryptWithPIN
						})
					);
					if (!directMessageValue?.e2ee) {
						handleEnableE2ee(directMessageValue?.id, directMessageValue?.e2ee);
					}
					if (currentDmId) {
						dispatch(messagesActions.fetchMessages({ clanId: '0', channelId: currentDmId as string, foundE2ee: true }));
					}
					dispatch(e2eeActions.pushPubKey(pubkey as ApiPubKey));
					dispatch(e2eeActions.setHasKey(true));
					onClose(true);
				} else {
					setOtp(Array(6).fill(''));
					setActiveIndex(0);
					setErrorMessage('Invalid code. Please try again.');
				}
			}
		} catch (error) {
			console.error(error);
			setOtp(Array(6).fill(''));
			setActiveIndex(0);
			setErrorMessage('Invalid code. Please try again.');
		} finally {
			// setIsSubmitting(false);
		}
	};

	return (
		<div
			tabIndex={-1}
			className="fixed inset-0 flex items-center justify-center overflow-x-hidden overflow-y-auto z-50 outline-none focus:outline-none bg-black bg-opacity-80 dark:text-white text-black hide-scrollbar overflow-hidden"
		>
			<div className="flex flex-col items-center max-w-sm mx-auto bg-white shadow-md rounded-md relative">
				<div
					className={`w-full dark:bg-[#1E1F22] bg-bgLightModeSecond dark:text-white text-black flex ${userProfile?.encrypt_private_key ? 'justify-end' : 'justify-between'} items-center p-4 rounded-t`}
				>
					{!userProfile?.encrypt_private_key && (
						<button className="text-5xl leading-3 dark:hover:text-white hover:text-black" onClick={onBack}>
							<Icons.LeftArrowIcon className="w-full" />
						</button>
					)}
					<button className="text-5xl leading-3 dark:hover:text-white hover:text-black" onClick={() => onClose()}>
						<Icons.CloseButton className="w-4" />
					</button>
				</div>
				<div className="flex flex-col items-center gap-2 px-4 pb-4 dark:bg-[#1E1F22] bg-bgLightModeSecond dark:text-white text-black rounded-b">
					<h2 className="text-lg font-semibold">Confirm Your PIN</h2>
					{!userProfile?.encrypt_private_key ? (
						<p className="text-gray-600 text-center">Make it memorable. You'll need it when you switch to a new device</p>
					) : (
						<p className="text-gray-600 text-center">Enter pin to decrypt conversation</p>
					)}
					<div className="flex space-x-2 mt-4">
						{otp.map((value, index) => (
							<input
								key={index}
								ref={(el) => (inputsRef.current[index] = el)}
								type="text"
								value={value}
								onChange={(e) => handleChange(e.target.value, index)}
								onKeyDown={(e) => handleKeyDown(e, index)}
								onPaste={(e) => handlePaste(e, index)}
								className={`w-12 h-12 text-center border rounded focus:outline-none text-lg ${index === activeIndex ? 'border-blue-500 focus:ring' : 'border-gray-300'} ${value ? 'font-bold text-black' : 'text-gray-500'} caret-transparent`}
								maxLength={1}
								disabled={index !== activeIndex}
							/>
						))}
					</div>
					{/* {isSubmitting && <p className="text-blue-500 mt-4">Sending...</p>} */}
					{errorMessage && <p className="text-red-500 mt-4">{errorMessage}</p>}
				</div>
			</div>
		</div>
	);
};

interface ModalSendCodeProps {
	onClose: () => void;
}

const MultiStepModalE2ee = ({ onClose }: ModalSendCodeProps) => {
	const [step, setStep] = useState(1);
	const [pin, setPin] = useState<string[]>(Array(6).fill(''));
	const { userProfile } = useAuth();
	const dispatch = useAppDispatch();
	const hasKeyE2ee = useSelector(selectHasKeyE2ee);

	const handleNext = () => setStep((prev) => prev + 1);
	const handleBack = () => setStep((prev) => prev - 1);
	const handleClose = (check?: boolean) => {
		if (!check) {
			MessageCrypt.checkExistingKeys(userProfile?.user?.id as string)
				.then((found) => {
					if (found) {
						MessageCrypt.clearKeys(userProfile?.user?.id as string);
					}
				})
				.catch((error) => {
					console.error(error);
				});
		}
		onClose();
	};

	useEffect(() => {
		if (userProfile?.encrypt_private_key) {
			setStep(3);
		} else {
			if (!hasKeyE2ee) {
				MessageCrypt.initializeKeys(userProfile?.user?.id as string)
					.then((pubkey) => {
						if (!pubkey) return;
						dispatch(e2eeActions.setPubkey(pubkey));
					})
					.catch((error) => {
						console.error(error);
					});
			}
		}
	}, [dispatch, hasKeyE2ee, userProfile]);

	return (
		<>
			{step === 1 && !userProfile?.encrypt_private_key && <ModalIntro onNext={handleNext} onClose={handleClose} />}
			{step === 2 && !userProfile?.encrypt_private_key && (
				<ModalCreatePin onNext={handleNext} onBack={handleBack} onClose={handleClose} setPin={setPin} />
			)}
			{step === 3 && <ModalConfirmPin onClose={handleClose} onBack={handleBack} pin={pin} userProfile={userProfile} />}
		</>
	);
};

export default MultiStepModalE2ee;
