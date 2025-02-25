import { Icons } from '@mezon/ui';
import { useNavigate } from 'react-router-dom';

function FailLoginModal() {
	const navigate = useNavigate();
	const retryLogin = async () => {
		navigate('/login');
	};

	return (
		<div className="w-[100vw] h-[100vh] overflow-hidden fixed top-0 left-0 z-50 bg-black bg-opacity-80 flex flex-row justify-center items-center">
			<div className="w-fit h-fit dark:bg-bgPrimary bg-bgLightModeSecond rounded-lg flex-col justify-start  items-start gap-3 inline-flex overflow-hidden ">
				<div className="dark:text-white text-black">
					<div className="p-4 relative w-[400px]">
						<div className="flex flex-col items-center gap-y-3 ">
							<Icons.IconClockChannel />
							<h3 className="font-bold text-2xl dark:text-white text-black">Oops! Login Failed</h3>
						</div>
					</div>
					<div className="w-full dark:bg-bgSecondary bg-bgLightSecondary p-4">
						<button
							className="px-4 py-2 hover:bg-opacity-85 rounded w-full bg-primary"
							onClick={() => retryLogin()}
							style={{ color: 'white' }}
						>
							Retry Login
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

export default FailLoginModal;
