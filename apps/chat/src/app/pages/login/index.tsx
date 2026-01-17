import { QRSection } from '@mezon/components';
import { useAppNavigation, useAuth } from '@mezon/core';
import { authActions, selectIsLogin, toastActions } from '@mezon/store';
import { useMezon } from '@mezon/transport';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useLoaderData } from 'react-router-dom';
import type { ILoginLoaderData } from '../../loaders/loginLoader';
import FormLoginEmail from './FormLoginEmail';
import FormLoginOTP from './FormLoginOTP';

function Login() {
	const { t } = useTranslation('common');
	const { navigate } = useAppNavigation();
	const isLogin = useSelector(selectIsLogin);
	const { redirectTo } = useLoaderData() as ILoginLoaderData;
	const { qRCode, checkLoginRequest } = useAuth();
	const [loginId, setLoginId] = useState<bigint | null>(null);
	const [createSecond, setCreateSecond] = useState<number | null>(null);
	const [hidden, setHidden] = useState<boolean>(false);
	const [isRemember, setIsRemember] = useState<boolean>(false);
	const [loginMethod, setLoginMethod] = useState(true);
	const [otpStep, setOtpStep] = useState<boolean | null>(null);
	const dispatch = useDispatch();
	const { sessionRef } = useMezon();

	useEffect(() => {
		if (sessionRef) {
			sessionRef.current = null;
		}
		dispatch(authActions.resetSession());
		dispatch(toastActions.clearAllToastErrors());
	}, []);

	useEffect(() => {
		const fetchQRCode = async () => {
			const qRInfo = await qRCode();
			if (!qRInfo || !qRInfo.login_id) {
				setHidden(true);
			} else {
				await setLoginId(qRInfo?.login_id);
				await setCreateSecond(Number(qRInfo?.create_time_second));
			}
		};

		fetchQRCode();
	}, [qRCode]);

	useEffect(() => {
		const intervalMsec = 2000;
		let timeElapsed = 0;
		const intervalId = setInterval(async () => {
			if (loginId && createSecond !== null) {
				timeElapsed += intervalMsec / 1000;
				if (timeElapsed >= 60) {
					setHidden(true);
					clearInterval(intervalId);
				} else {
					const currentSession = await checkLoginRequest(loginId, isRemember);
					if (currentSession !== null && currentSession !== undefined) {
						clearInterval(intervalId);
					}
				}
			}
		}, intervalMsec);

		return () => {
			clearInterval(intervalId);
		};
	}, [checkLoginRequest, createSecond, isRemember, loginId]);

	useEffect(() => {
		if (isLogin) {
			navigate(redirectTo || '/chat/direct/friends');
		}
	}, [redirectTo, isLogin, navigate]);

	const reloadQR = async () => {
		const qRInfo = await qRCode();
		if (!qRInfo || !qRInfo.login_id) {
			setHidden(true);
		} else {
			await setLoginId(qRInfo?.login_id);
			await setCreateSecond(Number(qRInfo?.create_time_second));
			setHidden(false);
		}
	};
	const handleSwitchMethod = () => {
		setLoginMethod(!loginMethod);
		setOtpStep(null);
	};
	return (
		<div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-300 px-4">
			<div className="bg-[#0b0b0b] text-white rounded-2xl shadow-lg p-14 max-w-4xl w-[800px] flex flex-row gap-8 items-center">
				<div className="flex-1 text-left flex flex-col">
					<div className="flex flex-col items-center mb-2">
						<h1 className="text-2xl font-bold mb-1">{t('login.welcomeBack')}</h1>
						<p className="text-gray-400">{t('login.gladToMeetAgain')}</p>
					</div>
					{loginMethod ? <FormLoginOTP handleChangeMethod={handleSwitchMethod} onStepChange={setOtpStep} /> : <FormLoginEmail />}
					{!(loginMethod && otpStep) && (
						<div className="mt-4 flex items-center text-gray-400 justify-between">
							<div className="flex items-center gap-2">
								<input
									type="checkbox"
									id="keepSignedIn"
									className="mr-2"
									checked={isRemember}
									onChange={(e) => setIsRemember(e.target.checked)}
								/>
								<label htmlFor="keepSignedIn">{t('login.keepSignedIn')}</label>
							</div>
							{!loginMethod && (
								<div className="text-sm text-blue-500 hover:underline" onClick={handleSwitchMethod}>
									{t('login.loginByOTP')}
								</div>
							)}
						</div>
					)}
				</div>

				<div className="bg-white p-4 rounded-lg shadow-md flex flex-col items-center w-56 h-80">
					<QRSection loginId={String(loginId)} isExpired={hidden} reloadQR={reloadQR} />;
					<p className="text-sm text-gray-500">{t('login.qr.signIn')}</p>
					<p className="text-xs text-gray-400">{t('login.qr.useMobile')}</p>
				</div>
			</div>
		</div>
	);
}

export default Login;
