import { accountActions, useAppDispatch } from '@mezon/store';
import { Button, FormError, Icons, Input, Menu } from '@mezon/ui';
import { ECountryCode, parsePhoneVN, validatePhoneNumber, type LoadingStatus } from '@mezon/utils';
import type { ChangeEvent, ClipboardEvent, Dispatch, KeyboardEvent, SetStateAction } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';

interface SetPhoneProps {
	title?: string;
	description?: string;
	isLoading?: LoadingStatus;
	onClose?: () => void;
}

const SettingPhone = ({ title, description, isLoading, onClose }: SetPhoneProps) => {
	const { t } = useTranslation('accountSetting');

	const [validateOTP, setValidateOTP] = useState<string | undefined>(undefined);
	const [openConfirm, setOpenConfirm] = useState(false);
	const [country, setCountry] = useState(ECountryCode.VN);
	const [errors, setErrors] = useState<{
		phone?: string;
		OTP?: string;
	}>({});
	const [phone, setPhone] = useState<string>('');

	const dispatch = useAppDispatch();
	const [otp, setOtp] = useState<string[]>(Array(6).fill(''));

	const handleSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
	}, []);

	const handleChangePhone = useCallback(
		(e: ChangeEvent<HTMLInputElement>) => {
			const value = e.target.value;
			if (/^\+?\d*$/.test(value)) {
				setPhone(value);
				setOpenConfirm(false);
				setOtp(Array(6).fill(''));
				setErrors({});
				setCount(0);
			}
		},
		[setPhone]
	);

	const handleSetOTP = (e: string[]) => {
		setOtp(e);
	};

	const [count, setCount] = useState(0);

	useEffect(() => {
		if (!openConfirm) return;

		const timer = setInterval(() => {
			setCount((prev) => {
				if (prev <= 1) {
					clearInterval(timer);
					setErrors({
						OTP: 'Invalid time OTP'
					});
					return 0;
				}
				return prev - 1;
			});
		}, 1000);

		return () => clearInterval(timer);
	}, [openConfirm, count]);

	useEffect(() => {
		if (otp.join('').length === 6 && !errors.OTP) {
			handleSendOTPChangePhone();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [otp, errors.OTP]);

	const handleSendOTPChangePhone = async () => {
		if (otp && count > 0) {
			if (otp.join('').length < 6) {
				toast.warning(t('setPhoneModal.emptyOtp'));
				return;
			}
			const validate = await dispatch(
				accountActions.verifyPhone({
					otp_code: otp.join(''),
					req_id: validateOTP
				})
			).unwrap();
			if (validate && onClose) {
				toast.success(t('setPhoneModal.updatePhoneSuccess'));
				onClose();
			}

			return;
		}

		const phoneRegex = /^\+?\d{7,15}$/;

		if (!phone || !phoneRegex.test(phone) || !validatePhoneNumber(phone, ECountryCode.VN)) {
			setErrors({
				phone: t('setPhoneModal.invalidPhone')
			});
			return;
		}

		if (!count) {
			setOtp(Array(6).fill(''));
			const response = await dispatch(
				accountActions.addPhoneNumber({
					phone_number: parsePhoneVN(phone)
				})
			).unwrap();
			if (response.req_id) {
				setErrors({});
				setCount(60);
				setOpenConfirm(true);
				setValidateOTP(response.req_id);
			}
			return;
		}
	};
	const disabled = count > 0 || !!errors.phone || isLoading === 'loading' || !phone;
	return (
		<div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50">
			<div className="w-full max-w-md bg-theme-setting-primary rounded-lg shadow-lg relative text-theme-primary-active">
				<button
					onClick={onClose}
					title={t('setPhoneModal.close')}
					className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 focus:outline-none dark:text-gray-300 dark:hover:text-gray-100"
				>
					✕
				</button>

				<div className="p-6 border-b border-gray-200 dark:border-gray-600">
					<div className="text-xl font-semibold text-theme-primary-active">{title || t('setPhoneNumber')}</div>
					<p className="mt-1 text-sm text-theme-primary">{description || t('setPhoneModal.description')}</p>
				</div>

				<form onSubmit={handleSubmit}>
					<div className="space-y-4 p-6">
						{!openConfirm ? (
							<div className="flex gap-2">
								<div className="space-y-2 flex-1 p-1">
									<label htmlFor="countryCode" className="block text-sm font-medium ">
										{t('setPhoneModal.countryCode')}
									</label>
									<SelectCountry country={country} setCountry={setCountry} />
								</div>
								<div className="space-y-2 flex-2">
									<Input
										id="phone"
										type="text"
										value={phone}
										onChange={handleChangePhone}
										className={`bg-theme-input ${errors.phone ? 'border-red-500 dark:border-red-400' : ''}`}
										label={t('setPhoneModal.phoneNumber')}
									/>
									{errors.phone && <FormError message={errors.phone} />}
								</div>
							</div>
						) : (
							<div className="space-y-4">
								<div className="bg-theme-input p-4 rounded-lg border border-theme-primary">
									<div className="flex items-center justify-between mb-3">
										<span className="text-sm text-theme-primary">{t('setPhoneModal.country')}</span>
										<span className="text-sm font-medium text-theme-primary-active">
											{country === ECountryCode.VN && 'Vietnam (+84)'}
											{country === ECountryCode.JP && 'Japan (+81)'}
											{country === ECountryCode.US && 'US (+1)'}
										</span>
									</div>
									<div className="flex items-center justify-between">
										<span className="text-sm text-theme-primary">{t('setPhoneModal.phoneNumber')}</span>
										<span className="text-sm font-medium text-theme-primary-active">
											{phone.replace(/^(.+)(.{2})$/, (_, p1, p2) => `xxx-xxx${p2}`)}
										</span>
									</div>
								</div>
								<p className="text-sm text-theme-primary text-center">
									{t('setPhoneModal.otpSentMessage', {
										phone: phone.replace(/^(.+)(.{2})$/, (_, p1, p2) => `xxx-xxx${p2}`)
									})}
								</p>
								<div className="space-y-2">
									<OtpConfirm handleSetOTP={handleSetOTP} otp={otp} />
								</div>
								{count === 0 && (
									<button
										type="button"
										onClick={() => {
											setOpenConfirm(false);
											setOtp(Array(6).fill(''));
											setErrors({});
											setCount(0);
										}}
										className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors font-medium"
									>
										<Icons.LeftArrowIcon className="w-4 h-4" />
										{t('setPhoneModal.backToPhoneInput')}
									</button>
								)}
							</div>
						)}
					</div>
					<div className="p-6 pt-2">
						<Button
							type="submit"
							disabled={disabled}
							className={`w-full px-4 py-2 rounded-md font-medium focus:outline-none
										${
											disabled
												? 'bg-gray-400 text-white cursor-not-allowed dark:bg-gray-600 dark:text-gray-300'
												: 'bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer dark:bg-indigo-500 dark:hover:bg-indigo-600'
										}`}
							onClick={handleSendOTPChangePhone}
						>
							{isLoading === 'loading'
								? t('setPhoneModal.loading')
								: openConfirm
									? `${t('setPhoneModal.resendOtp')} ${count ? `(${count})` : ''}`
									: t('setPhoneModal.sendOTP')}
						</Button>
					</div>
				</form>
			</div>
		</div>
	);
};

export const OtpConfirm = ({ otp, handleSetOTP }: { otp: string[]; handleSetOTP: (e: string[]) => void }) => {
	useEffect(() => {
		const firstInput = document.getElementById('otp-0');
		if (firstInput) {
			setTimeout(() => {
				firstInput.focus();
			}, 100);
		}
	}, []);

	const handleChange = (index: number, e: ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value.replace(/\D/g, ''); // chỉ số
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
			<div className="flex items-center justify-around gap-3">
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

export const SelectCountry = ({ country, setCountry }: { country: string; setCountry: Dispatch<SetStateAction<ECountryCode>> }) => {
	const countries = useMemo(
		() => [
			{ code: 'VN', name: 'Vietnam', dial: ECountryCode.VN },
			{ code: 'JP', name: 'Japan', dial: ECountryCode.JP },
			{ code: 'US', name: 'US', dial: ECountryCode.US }
		],
		[]
	);
	const flags: Record<string, { flag: JSX.Element; dial: string; name: string }> = {
		'+84': { flag: <VietNamFlag />, dial: '+84', name: 'Vietnam' },
		'+81': { flag: <JapanFlag />, dial: '+81', name: 'Japan' },
		'+1': { flag: <USFlag />, dial: '+1', name: 'US' }
	};
	const menu = useMemo(
		() => (
			<div className="border-none py-[6px] px-[8px] max-h-[200px] overflow-y-scroll thread-scroll z-20 ">
				{countries?.map((option, index) => (
					<Menu.Item
						key={index}
						onClick={() => setCountry(option.dial)}
						className={`truncate px-3 py-2 rounded-md bg-item-theme-hover cursor-pointer transition-colors duration-150 ${
							country === option.code ? 'bg-theme-input  font-medium' : 'text-theme-primary'
						}`}
					>
						{option.name}
					</Menu.Item>
				))}
			</div>
		),
		[countries, setCountry, country]
	);

	return (
		<div className="w-full">
			<div className="relative w-[155px]">
				<Menu
					trigger="click"
					menu={menu}
					placement="bottomLeft"
					className="border-none py-[6px] px-[8px] z-50 bg-theme-input rounded-lg shadow-lg"
				>
					<div className="w-full h-[42px] rounded-md flex flex-row px-3 justify-between items-center cursor-pointer text-theme-primary-active bg-theme-input border-theme-primary">
						<p className="truncate text-sm font-medium flex items-center gap-2">
							{flags[country]?.flag} {flags[country]?.name} {`(${flags[country]?.dial})`}
						</p>
						<Icons.ArrowDownFill />
					</div>
				</Menu>
			</div>
		</div>
	);
};

const JapanFlag = () => {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 32 32">
			<rect x="1" y="4" width="30" height="24" rx="4" ry="4" fill="#fff"></rect>
			<path
				d="M27,4H5c-2.209,0-4,1.791-4,4V24c0,2.209,1.791,4,4,4H27c2.209,0,4-1.791,4-4V8c0-2.209-1.791-4-4-4Zm3,20c0,1.654-1.346,3-3,3H5c-1.654,0-3-1.346-3-3V8c0-1.654,1.346-3,3-3H27c1.654,0,3,1.346,3,3V24Z"
				opacity=".15"
			></path>
			<circle cx="16" cy="16" r="6" fill="#ae232f"></circle>
			<path
				d="M27,5H5c-1.657,0-3,1.343-3,3v1c0-1.657,1.343-3,3-3H27c1.657,0,3,1.343,3,3v-1c0-1.657-1.343-3-3-3Z"
				fill="#fff"
				opacity=".2"
			></path>
		</svg>
	);
};

const VietNamFlag = () => {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 32 32">
			<rect x="1" y="4" width="30" height="24" rx="4" ry="4" fill="#c93728"></rect>
			<path
				d="M27,4H5c-2.209,0-4,1.791-4,4V24c0,2.209,1.791,4,4,4H27c2.209,0,4-1.791,4-4V8c0-2.209-1.791-4-4-4Zm3,20c0,1.654-1.346,3-3,3H5c-1.654,0-3-1.346-3-3V8c0-1.654,1.346-3,3-3H27c1.654,0,3,1.346,3,3V24Z"
				opacity=".15"
			></path>
			<path
				d="M27,5H5c-1.657,0-3,1.343-3,3v1c0-1.657,1.343-3,3-3H27c1.657,0,3,1.343,3,3v-1c0-1.657-1.343-3-3-3Z"
				fill="#fff"
				opacity=".2"
			></path>
			<path
				fill="#ff5"
				d="M18.008 16.366L21.257 14.006 17.241 14.006 16 10.186 14.759 14.006 10.743 14.006 13.992 16.366 12.751 20.186 16 17.825 19.249 20.186 18.008 16.366z"
			></path>
		</svg>
	);
};

const USFlag = () => {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 32 32">
			<rect x="1" y="4" width="30" height="24" rx="4" ry="4" fill="#fff"></rect>
			<path d="M1.638,5.846H30.362c-.711-1.108-1.947-1.846-3.362-1.846H5c-1.414,0-2.65,.738-3.362,1.846Z" fill="#a62842"></path>
			<path d="M2.03,7.692c-.008,.103-.03,.202-.03,.308v1.539H31v-1.539c0-.105-.022-.204-.03-.308H2.03Z" fill="#a62842"></path>
			<path fill="#a62842" d="M2 11.385H31V13.231H2z"></path>
			<path fill="#a62842" d="M2 15.077H31V16.923000000000002H2z"></path>
			<path fill="#a62842" d="M1 18.769H31V20.615H1z"></path>
			<path d="M1,24c0,.105,.023,.204,.031,.308H30.969c.008-.103,.031-.202,.031-.308v-1.539H1v1.539Z" fill="#a62842"></path>
			<path d="M30.362,26.154H1.638c.711,1.108,1.947,1.846,3.362,1.846H27c1.414,0,2.65-.738,3.362-1.846Z" fill="#a62842"></path>
			<path d="M5,4h11v12.923H1V8c0-2.208,1.792-4,4-4Z" fill="#102d5e"></path>
			<path
				d="M27,4H5c-2.209,0-4,1.791-4,4V24c0,2.209,1.791,4,4,4H27c2.209,0,4-1.791,4-4V8c0-2.209-1.791-4-4-4Zm3,20c0,1.654-1.346,3-3,3H5c-1.654,0-3-1.346-3-3V8c0-1.654,1.346-3,3-3H27c1.654,0,3,1.346,3,3V24Z"
				opacity=".15"
			></path>
			<path
				d="M27,5H5c-1.657,0-3,1.343-3,3v1c0-1.657,1.343-3,3-3H27c1.657,0,3,1.343,3,3v-1c0-1.657-1.343-3-3-3Z"
				fill="#fff"
				opacity=".2"
			></path>
			<path
				fill="#fff"
				d="M4.601 7.463L5.193 7.033 4.462 7.033 4.236 6.338 4.01 7.033 3.279 7.033 3.87 7.463 3.644 8.158 4.236 7.729 4.827 8.158 4.601 7.463z"
			></path>
			<path
				fill="#fff"
				d="M7.58 7.463L8.172 7.033 7.441 7.033 7.215 6.338 6.989 7.033 6.258 7.033 6.849 7.463 6.623 8.158 7.215 7.729 7.806 8.158 7.58 7.463z"
			></path>
			<path
				fill="#fff"
				d="M10.56 7.463L11.151 7.033 10.42 7.033 10.194 6.338 9.968 7.033 9.237 7.033 9.828 7.463 9.603 8.158 10.194 7.729 10.785 8.158 10.56 7.463z"
			></path>
			<path
				fill="#fff"
				d="M6.066 9.283L6.658 8.854 5.927 8.854 5.701 8.158 5.475 8.854 4.744 8.854 5.335 9.283 5.109 9.979 5.701 9.549 6.292 9.979 6.066 9.283z"
			></path>
			<path
				fill="#fff"
				d="M9.046 9.283L9.637 8.854 8.906 8.854 8.68 8.158 8.454 8.854 7.723 8.854 8.314 9.283 8.089 9.979 8.68 9.549 9.271 9.979 9.046 9.283z"
			></path>
			<path
				fill="#fff"
				d="M12.025 9.283L12.616 8.854 11.885 8.854 11.659 8.158 11.433 8.854 10.702 8.854 11.294 9.283 11.068 9.979 11.659 9.549 12.251 9.979 12.025 9.283z"
			></path>
			<path
				fill="#fff"
				d="M6.066 12.924L6.658 12.494 5.927 12.494 5.701 11.799 5.475 12.494 4.744 12.494 5.335 12.924 5.109 13.619 5.701 13.19 6.292 13.619 6.066 12.924z"
			></path>
			<path
				fill="#fff"
				d="M9.046 12.924L9.637 12.494 8.906 12.494 8.68 11.799 8.454 12.494 7.723 12.494 8.314 12.924 8.089 13.619 8.68 13.19 9.271 13.619 9.046 12.924z"
			></path>
			<path
				fill="#fff"
				d="M12.025 12.924L12.616 12.494 11.885 12.494 11.659 11.799 11.433 12.494 10.702 12.494 11.294 12.924 11.068 13.619 11.659 13.19 12.251 13.619 12.025 12.924z"
			></path>
			<path
				fill="#fff"
				d="M13.539 7.463L14.13 7.033 13.399 7.033 13.173 6.338 12.947 7.033 12.216 7.033 12.808 7.463 12.582 8.158 13.173 7.729 13.765 8.158 13.539 7.463z"
			></path>
			<path
				fill="#fff"
				d="M4.601 11.104L5.193 10.674 4.462 10.674 4.236 9.979 4.01 10.674 3.279 10.674 3.87 11.104 3.644 11.799 4.236 11.369 4.827 11.799 4.601 11.104z"
			></path>
			<path
				fill="#fff"
				d="M7.58 11.104L8.172 10.674 7.441 10.674 7.215 9.979 6.989 10.674 6.258 10.674 6.849 11.104 6.623 11.799 7.215 11.369 7.806 11.799 7.58 11.104z"
			></path>
			<path
				fill="#fff"
				d="M10.56 11.104L11.151 10.674 10.42 10.674 10.194 9.979 9.968 10.674 9.237 10.674 9.828 11.104 9.603 11.799 10.194 11.369 10.785 11.799 10.56 11.104z"
			></path>
			<path
				fill="#fff"
				d="M13.539 11.104L14.13 10.674 13.399 10.674 13.173 9.979 12.947 10.674 12.216 10.674 12.808 11.104 12.582 11.799 13.173 11.369 13.765 11.799 13.539 11.104z"
			></path>
			<path
				fill="#fff"
				d="M4.601 14.744L5.193 14.315 4.462 14.315 4.236 13.619 4.01 14.315 3.279 14.315 3.87 14.744 3.644 15.44 4.236 15.01 4.827 15.44 4.601 14.744z"
			></path>
			<path
				fill="#fff"
				d="M7.58 14.744L8.172 14.315 7.441 14.315 7.215 13.619 6.989 14.315 6.258 14.315 6.849 14.744 6.623 15.44 7.215 15.01 7.806 15.44 7.58 14.744z"
			></path>
			<path
				fill="#fff"
				d="M10.56 14.744L11.151 14.315 10.42 14.315 10.194 13.619 9.968 14.315 9.237 14.315 9.828 14.744 9.603 15.44 10.194 15.01 10.785 15.44 10.56 14.744z"
			></path>
			<path
				fill="#fff"
				d="M13.539 14.744L14.13 14.315 13.399 14.315 13.173 13.619 12.947 14.315 12.216 14.315 12.808 14.744 12.582 15.44 13.173 15.01 13.765 15.44 13.539 14.744z"
			></path>
		</svg>
	);
};

export default SettingPhone;
