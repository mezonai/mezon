import { useAuth } from '@mezon/core';
import { clansActions, clearAllMemoizedFunctions, e2eeActions, useAppDispatch } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { MessageCrypt } from '@mezon/utils';
import { ApiAccount } from 'mezon-js/api.gen';
import { useEffect, useRef, useState } from 'react';

interface ModalProps {
	onClose: () => void;
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
					<button className="text-5xl leading-3 dark:hover:text-white hover:text-black" onClick={onClose}>
						<Icons.CloseButton className="w-4" />
					</button>
				</div>
				<div className="flex flex-col items-center gap-2 px-4 pb-4 dark:bg-[#1E1F22] bg-bgLightModeSecond dark:text-white text-black rounded-b">
					<h2 className="text-lg font-semibold">Set up a way to access your chat history</h2>
					<p className="text-gray-600 text-center">
						With the upgrade, access to chat history is changing. You can create a PIN to access your chat history if you switch devices.
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
					<button className="text-5xl leading-3 dark:hover:text-white hover:text-black" onClick={onClose}>
						<Icons.CloseButton className="w-4" />
					</button>
				</div>
				<div className="flex flex-col items-center gap-2 px-4 pb-4 dark:bg-[#1E1F22] bg-bgLightModeSecond dark:text-white text-black rounded-b">
					<h2 className="text-lg font-semibold">Create Your PIN</h2>
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

	const handleSubmit = async () => {
		const otpCode = otp.join('');
		const pinCode = pin.join('');
		try {
			if (userProfile?.encrypt_private_key) {
				await MessageCrypt.decryptPrivateKeyWithPIN(userProfile?.encrypt_private_key, otpCode, userProfile?.user?.id as string);
				onClose();
				clearAllMemoizedFunctions();
				dispatch(e2eeActions.setIsShowBtnPin(false));
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
					onClose();
				} else {
					setOtp(Array(6).fill(''));
					setActiveIndex(0);
					setErrorMessage('Invalid code. Please try again.');
				}
			}
		} catch (error) {
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
					<button className="text-5xl leading-3 dark:hover:text-white hover:text-black" onClick={onClose}>
						<Icons.CloseButton className="w-4" />
					</button>
				</div>
				<div className="flex flex-col items-center gap-2 px-4 pb-4 dark:bg-[#1E1F22] bg-bgLightModeSecond dark:text-white text-black rounded-b">
					<h2 className="text-lg font-semibold">Confirm Your PIN</h2>
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

	const handleNext = () => setStep((prev) => prev + 1);
	const handleBack = () => setStep((prev) => prev - 1);
	const handleClose = () => onClose();

	useEffect(() => {
		if (userProfile?.encrypt_private_key) {
			setStep(3);
		}
	}, [userProfile]);

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
