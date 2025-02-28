import React from 'react';

export const TitleSectionAdmin = () => {
	return (
		<div className="flex flex-col justify-start items-center w-fit h-fit">
			<h1 className="text-4xl font-bold dark:text-[#ffffff] text-black leading-[120%] text-center">WELCOME BACK</h1>
			<p className="text-base font-medium dark:text-[#cccccc] text-black leading-[150%] text-center">Login as Admin User</p>
		</div>
	);
};

export const LoginByEmail = () => {
	const STATE = React.useMemo(() => {
		const randomState = Math.random().toString(36).substring(2, 15);
		sessionStorage.setItem('oauth_state', randomState);
		return randomState;
	}, []);
	const OAUTH2_AUTHORIZE_URL = process.env.NX_CHAT_APP_OAUTH2_AUTHORIZE_URL;
	const CLIENT_ID = process.env.NX_CHAT_APP_OAUTH2_CLIENT_ID;
	const REDIRECT_URI = encodeURIComponent(process.env.NX_CHAT_APP_OAUTH2_REDIRECT_URI as string);
	const RESPONSE_TYPE = process.env.NX_CHAT_APP_OAUTH2_RESPONSE_TYPE;
	const SCOPE = process.env.NX_CHAT_APP_OAUTH2_SCOPE;
	const authUrl = `${OAUTH2_AUTHORIZE_URL}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${RESPONSE_TYPE}&scope=${SCOPE}&state=${STATE}`;
	return (
		<button
			onClick={() => (window.location.href = authUrl)}
			className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition"
		>
			Login by Email
		</button>
	);
};

export const DescriptionStructure = () => {
	return (
		<div className=" shadow-lg rounded-2xl p-6 text-center max-w-md w-full">
			<h2 className="text-xl font-semibold mb-4 text-gray-700">To use Mezon on your computer:</h2>
			<ol className="text-gray-600 text-left list-decimal list-inside mb-4">
				<li>Open Mezon on your phone</li>
				<li>
					Tap <strong>Menu</strong> or <strong>Settings</strong> and select <strong>Mezon Web</strong>
				</li>
				<li>Point your phone to this screen to capture the code</li>
			</ol>

			<div className="mt-4 text-gray-500 text-sm">
				<input type="checkbox" id="keepSignedIn" className="mr-2" />
				<label htmlFor="keepSignedIn">Keep me signed in</label>
			</div>
		</div>
	);
};
