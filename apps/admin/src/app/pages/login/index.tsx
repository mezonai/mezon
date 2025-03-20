import { GoogleButtonLogin, TitleSection } from '@mezon/components';
import { authActions, useAppDispatch } from '@mezon/store';
import isElectron from 'is-electron';
import { safeJSONParse } from 'mezon-js';
import { useEffect } from 'react';

function Login() {
	const dispatch = useAppDispatch();
	const deepLinkUrl = safeJSONParse(localStorage.getItem('deepLinkUrl') as string);

	useEffect(() => {
		if (deepLinkUrl && isElectron()) {
			const data = safeJSONParse(decodeURIComponent(deepLinkUrl));
			dispatch(authActions.setSession(data));
			localStorage.removeItem('deepLinkUrl');
		}
	}, [deepLinkUrl, dispatch]);

	return (
		<div
			className=" w-screen h-screen  overflow-x-hidden overflow-y-scroll  scrollbar-hide flex items-center"
			style={{
				background: 'linear-gradient(219.23deg, #2970FF 1.49%, #8E84FF 43.14%, #E0D1FF 94.04%)'
			}}
		>
			<div className=" justify-center items-center flex w-full h-full sm:max-h-[580px] sm:h-9/10 sm:max-w-[450px] rounded-none sm:rounded-2xl px-0 dark:bg-[#0b0b0b] bg-[#F0F0F0] flex-col mx-auto">
				<div className="relative top-0 flex-col pb-0 lg:top-0 lg:pb-0 flex items-center w-full overflow-y-auto hide-scrollbar lg:overflow-y-visible">
					<div className="flex-col justify-start items-center flex h-fit p-0 gap-2 pb-2 lg:pb-0 md:gap-4 w-9/10">
						<TitleSection />
						<GoogleButtonLogin mode="dev" />
					</div>
				</div>
			</div>
		</div>
	);
}

export default Login;
