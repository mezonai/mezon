import type { ChangeEvent, ClipboardEvent, KeyboardEvent } from 'react';
import { useEffect } from 'react';

interface OtpConfirmProps {
	otp: string[];
	handleSetOTP: (e: string[]) => void;
	className?: string;
}

export const OtpConfirm = ({ otp, handleSetOTP, className }: OtpConfirmProps) => {
	useEffect(() => {
		const firstInput = document.getElementById('otp-0');
		if (firstInput) {
			setTimeout(() => {
				firstInput.focus();
			}, 100);
		}
	}, []);

	const handleChange = (index: number, e: ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value.replace(/\D/g, '');
		if (value.length <= 1) {
			const newOtp = [...otp];
			newOtp[index] = value;
			handleSetOTP(newOtp);
			if (value && index < 5) {
				const nextInput = document.getElementById(`otp-${index + 1}`);
				nextInput?.focus();
			}
		}
	};

	const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Backspace' && !otp[index] && index > 0) {
			const prevInput = document.getElementById(`otp-${index - 1}`);
			prevInput?.focus();
		}
	};

	const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
		e.preventDefault();
		const pasteData = e.clipboardData.getData('text').replace(/\D/g, '');
		if (!pasteData) return;

		const newOtp = [...otp];
		for (let i = 0; i < 6; i++) {
			newOtp[i] = pasteData[i] || '';
		}
		handleSetOTP(newOtp);

		const lastIndex = Math.min(pasteData.length - 1, 5);
		const nextInput = document.getElementById(`otp-${lastIndex}`);
		nextInput?.focus();
	};

	return (
		<div className="flex flex-col">
			<div className={`flex items-center justify-between gap-3 ${className}`}>
				{otp.map((digit, index) => (
					<input
						key={index}
						id={`otp-${index}`}
						tabIndex={-1}
						type="text"
						inputMode="numeric"
						maxLength={1}
						value={digit}
						onChange={(e) => handleChange(index, e)}
						onKeyDown={(e) => handleKeyDown(index, e)}
						onPaste={handlePaste}
						className="aspect-square rounded-md h-12 outline-none w-12 text-xl text-center font-bold bg-theme-input border border-theme-primary focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:bg-[#4d6aff5f]"
					/>
				))}
			</div>
		</div>
	);
};
