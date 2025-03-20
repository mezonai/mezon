import { useAuth } from '@mezon/core';
import { useGoogleLogin } from '@react-oauth/google';
import React from 'react';
import { useNavigate } from 'react-router-dom';

interface GoogleButtonLoginProps {
	mode?: string;
}

const GoogleButtonLogin: React.FC<GoogleButtonLoginProps> = ({ mode }) => {
	const { loginByGoogle } = useAuth();
	const navigate = useNavigate();
	const googleLogin = useGoogleLogin({
		flow: 'auth-code',
		ux_mode: 'popup',
		onSuccess: async ({ code }) => {
			await loginByGoogle(code);
			if (mode !== 'dev') {
				navigate('/mezon');
			}
		},
		onError: (errorResponse) => console.error(errorResponse)
	});

	// if (isElectron()) {
	// 	return (
	// 		<div className="w-full lg:px-0">
	// 			<button className="flex justify-center w-full h-fit p-3 rounded-[4px] bg-[#d1e0ff] relative" disabled>
	// 				<div className="flex items-center w-fit h-fit gap-x-1 p-0">
	// 					<img src={'assets/images/google-icon.png'} className="p-0 object-cover hidden" alt="Google Logo" />
	// 					<p className="w-fit h-fit text-base font-medium text-[#155eef] leading-[150%]">Continue with QR Login</p>
	// 				</div>
	// 			</button>
	// 		</div>
	// 	);
	// }
	return (
		<div className="w-full lg:px-0">
			<button onClick={googleLogin} className="flex justify-center w-full h-fit p-3 rounded-[4px] bg-[#d1e0ff] relative">
				<div className="flex items-center w-fit h-fit gap-x-1 p-0">
					<img src={'assets/images/google-icon.png'} className="p-0 object-cover" alt="Google Logo" />
					<p className="w-fit h-fit text-base font-medium text-[#155eef] leading-[150%]">Continue with Google</p>
				</div>
			</button>
		</div>
	);
};

export default GoogleButtonLogin;
