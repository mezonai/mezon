import { authActions, useAppDispatch } from '@mezon/store';
import { validateEmail } from '@mezon/utils';

import { ButtonLoading, FormError, Icons, Input } from '@mezon/ui';
import { OtpConfirm } from 'libs/components/src/lib/components/SettingAccount/SettingPhone';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const FormLoginOTP = ({ handleChangeMethod, onStepChange }: { handleChangeMethod: () => void; onStepChange?: (step: boolean | null) => void }) => {
	const dispatch = useAppDispatch();
	const { t } = useTranslation('common');
	const [count, setCount] = useState(0);
	const [email, setEmail] = useState('');
	const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
	const [reqId, setReqId] = useState('');
	const [step, setStep] = useState<boolean | null>(null); // 0: enter email, 1: enter otp

	const [errors, setErrors] = useState<{
		email?: string;
		otp?: string;
	}>({});

	useEffect(() => {
		if (onStepChange) {
			onStepChange(step);
		}
	}, [step, onStepChange]);

	const handleSubmit = useCallback(async () => {
		if (reqId) {
			const response = await dispatch(authActions.confirmAuthenticateOTP({ otp_code: otp.join(''), req_id: reqId })).unwrap();
			return;
		}

		const response = await dispatch(authActions.authenticateEmailOTPRequest({ email })).unwrap();
		setReqId(response.req_id || '');
		setStep(true);
		setCount(60);
	}, [email, otp, reqId]);

	useEffect(() => {
		if (otp.join('').length === 6 && !errors.otp && reqId) {
			handleSubmit();
		}
	}, [otp, errors.otp, reqId]);

	const handleSetOTP = (e: string[]) => {
		setOtp(e);
	};

	const handleEmailChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			if (step) {
				return;
			}
			const value = e.target.value;
			setEmail(value);
			setOtp(Array(6).fill(''));
			setErrors((prev) => ({
				...prev,
				email: validateEmail(value)
			}));
		},
		[step]
	);

	useEffect(() => {
		if (!reqId) return;

		const timer = setInterval(() => {
			setCount((prev) => {
				if (prev <= 1) {
					clearInterval(timer);
					setErrors({
						otp: 'Invalid time OTP'
					});
					return 0;
				}
				return prev - 1;
			});
		}, 1000);

		return () => clearInterval(timer);
	}, [reqId, count]);
	const handleBackStep = () => {
		setStep(false);
		setReqId('');
		setOtp(Array(6).fill(''));
		setErrors({});
		setCount(0);
		setTimeout(() => setStep(null), 1000);
	};

	const disabled = !!errors.otp || !email || !otp;

	return (
		<form onSubmit={handleSubmit} className="space-y-2 flex flex-col justify-center items-center flex-1 relative">
			<div className="flex flex-col justify-center !h-64 w-full relative">
				{step && (
					<div className="flex justify-start gap-3 ml-3 absolute bottom-[-38px]">
						{count === 0 && step && (
							<button
								type="button"
								onClick={handleBackStep}
								className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors font-medium mt-2"
							>
								<Icons.LeftArrowIcon className="w-4 h-4" />
								{t('login.backToEmailInput')}
							</button>
						)}
					</div>
				)}

				<div className="flex overflow-hidden items-center gap-3">
					<div className={`flex flex-col w-full shrink-0 ${step === null ? '' : step ? 'animate-login_otp' : 'animate-login_email'}`}>
						<div className="flex flex-col gap-2">
							<label htmlFor="email" className="block text-sm font-medium text-black dark:text-gray-300 leading-10 ml-2 ">
								{t('login.email')}
								<span className="text-red-500">*</span>
							</label>
							<Input
								id="email"
								type="email"
								value={email}
								onChange={handleEmailChange}
								placeholder={t('login.enterEmail')}
								className={`dark:bg-[#1e1e1e] dark:border-gray-600 dark:placeholder-gray-400 text-black dark:text-white h-12`}
								readOnly={false}
							/>
						</div>
						{errors.email && <FormError message={errors.email} />}
					</div>
					<div className={`flex flex-col w-full shrink-0 ${step === null ? 'hidden' : step ? 'animate-login_otp' : 'animate-login_email'}`}>
						<p className="text-sm text-gray-700 dark:text-gray-300 text-center mb-6">
							{t('login.otpSentMessage', {
								email: email.replace(/^(.{3})(.*)(@.*)$/, (_, p1, p2, p3) => `${p1}${'*'.repeat(p2.length)}${p3}`)
							})}
						</p>
						<div className={`flex flex-col gap-2`}>
							<OtpConfirm otp={otp} handleSetOTP={handleSetOTP} className="pr-[5px]" />
						</div>
					</div>
				</div>
				<div className="p-1 mt-3">
					<ButtonLoading
						className="w-full h-10 btn-primary btn-primary-hover"
						disabled={!step ? !!errors.email || (step === null && errors.email === undefined) || disabled : disabled || count > 0}
						label={`${!step ? t('login.send') : t('login.resendOtp')} ${count ? `(${count})` : ''}`}
						onClick={handleSubmit}
					/>
				</div>

				<div className=" flex flex-col items-center !mt-8">
					<p className="text-sm">Couldn't access your email inbox?</p>
					<p className="text-sm text-gray-500 inline-block">
						<button type="button" className="text-sm text-blue-500 hover:underline" onClick={handleChangeMethod}>
							{t('login.loginByPassword')}
						</button>
					</p>
				</div>
			</div>
		</form>
	);
};

export default FormLoginOTP;
