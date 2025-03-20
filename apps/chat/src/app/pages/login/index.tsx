import { QRSection } from '@mezon/components';
import { useAppNavigation, useAuth } from '@mezon/core';
import { selectIsLogin } from '@mezon/store';
import { useEffect, useState } from 'react';
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

	return (
		<div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-300 px-4">
			<div className="bg-[#0b0b0b] text-white rounded-2xl shadow-lg p-20 max-w-4xl w-full flex flex-row items-center gap-8">
				<div className="flex-1 text-left">
					<h1 className="text-4xl font-bold mb-2">WELCOME BACK</h1>
					<p className="text-gray-400 mb-6">So glad to meet you again!</p>

					<h2 className="text-xl font-semibold mb-4">To use Mezon on your computer:</h2>
					<ol className="list-decimal list-inside text-gray-300 space-y-2">
						<li>Open Mezon on your phone</li>
						<li>
							Tap <strong>Settings</strong> and select <strong>Scan QR Code</strong>
						</li>
						<li>Point your phone to this screen to capture the code</li>
					</ol>

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
