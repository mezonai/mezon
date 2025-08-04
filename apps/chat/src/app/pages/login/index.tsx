import { QRSection } from '@mezon/components';
import { useAppNavigation, useAuth } from '@mezon/core';
import { authActions, selectIsLogin, selectLoadingEmail, useAppDispatch } from '@mezon/store';
import { validateEmail, validatePassword } from '@mezon/utils';

import { ButtonLoading, FormError, Input, PasswordInput } from '@mezon/ui';
import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useLoaderData } from 'react-router-dom';
import { ILoginLoaderData } from '../../loaders/loginLoader';

function Login() {
	const { navigate } = useAppNavigation();
	const isLogin = useSelector(selectIsLogin);
	const { redirectTo } = useLoaderData() as ILoginLoaderData;
	const { qRCode, checkLoginRequest } = useAuth();
	const [loginId, setLoginId] = useState<string | null>(null);
	const [createSecond, setCreateSecond] = useState<number | null>(null);
	const [hidden, setHidden] = useState<boolean>(false);
	const [isRemember, setIsRemember] = useState<boolean>(false);
	const isLoadingLoginEmail = useSelector(selectLoadingEmail);

	const dispatch = useAppDispatch();
	useEffect(() => {
		const fetchQRCode = async () => {
			const qRInfo = await qRCode();
			if (!qRInfo || !qRInfo.login_id) {
				setHidden(true);
			} else {
				await setLoginId(qRInfo?.login_id as string);
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
			await setLoginId(qRInfo?.login_id as string);
			await setCreateSecond(Number(qRInfo?.create_time_second));
			setHidden(false);
		}
	};

	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [errors, setErrors] = useState<{
		email?: string;
		password?: string;
	}>({});

	const showErrLoginFail = isLoadingLoginEmail === 'error';
	useEffect(() => {
		if (showErrLoginFail) {
			setErrors({
				email: 'Email or password is invalid',
				password: 'Email or password is invalid'
			});
		}
	}, [showErrLoginFail]);
	const handleFocus = () => {
		setErrors({});
		dispatch(authActions.refreshStatus());
	};
	const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setEmail(value);

		setErrors((prev) => ({
			...prev,
			email: validateEmail(value)
		}));
	}, []);

	const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setPassword(value);

		setErrors((prev) => ({
			...prev,
			password: validatePassword(value)
		}));
	}, []);

	const handleLogin = async ({ email, password }: { email: string; password: string }) => {
		if (!email || !password) {
			console.error('Email and password are required');
			return;
		}

		await dispatch(authActions.authenticateEmail({ email, password }));
	};

	const handleSubmit = useCallback(async () => {
		const emailError = validateEmail(email);
		const passwordError = validatePassword(password);

		if (emailError || passwordError) {
			setErrors({ email: emailError, password: passwordError });
			return;
		}

		await handleLogin({ email, password });
	}, [email, password]);

	const disabled = !!errors.email || !!errors.password || !email || !password || isLoadingLoginEmail !== 'not loaded';

	return (
		<div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-300 px-4">
			<div className="bg-[#0b0b0b] text-white rounded-2xl shadow-lg p-14 max-w-4xl w-[800px] flex flex-row gap-8">
				<div className="flex-1 text-left flex flex-col">
					<div className="flex flex-col items-center">
						<h1 className="text-2xl font-bold mb-1">WELCOME BACK</h1>
						<p className="text-gray-400">So glad to meet you again!</p>
					</div>
					<form onSubmit={handleSubmit} className="space-y-2">
						<label htmlFor="email" className="block text-sm font-medium text-black dark:text-gray-300">
							Email<span className="text-red-500">*</span>
						</label>
						<Input
							onFocus={handleFocus}
							id="email"
							type="email"
							value={email}
							onChange={handleEmailChange}
							placeholder="Enter your email"
							className={`dark:bg-[#1e1e1e] dark:border-gray-600 dark:placeholder-gray-400 text-black dark:text-white`}
							readOnly={false}
						/>
						<div className="min-h-[20px]">{errors.email && <FormError message={errors.email} />}</div>
						<PasswordInput onFocus={handleFocus} id="password" label="Password" value={password} onChange={handlePasswordChange} />
						<div className="min-h-[20px]">{errors.password && <FormError message={errors.password} />}</div>
						<ButtonLoading className="w-full h-10 btn-primary btn-primary-hover" disabled={disabled} label="Log In" onClick={handleSubmit} />
					</form>
					<div className="mt-4 flex items-center text-gray-400">
						<input
							type="checkbox"
							id="keepSignedIn"
							className="mr-2"
							checked={isRemember}
							onChange={(e) => setIsRemember(e.target.checked)}
						/>
						<label htmlFor="keepSignedIn">Keep me signed in</label>
					</div>
				</div>

				<div className="bg-white p-4 rounded-lg shadow-md flex flex-col items-center">
					<QRSection loginId={loginId || ''} isExpired={hidden} reloadQR={reloadQR} />;
					<p className="text-sm text-gray-500">Sign in by QR code</p>
					<p className="text-xs text-gray-400">Use Mezon on mobile to scan QR</p>
				</div>
			</div>
		</div>
	);
}

export default Login;
