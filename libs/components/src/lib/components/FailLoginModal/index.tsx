import { MezonIcon, MzIcons48 } from '@mezon/ui';
import { useNavigate } from 'react-router-dom';

function FailLoginModal() {
	const navigate = useNavigate();
	const retryLogin = async () => {
		navigate('/login');
	};

	return (
		<div className="outline-none w-[100vw] h-[100vh] overflow-hidden fixed top-0 left-0 z-50 bg-black bg-opacity-80 flex flex-row justify-center items-center">
			<div className="w-fit h-fit bg-theme-setting-primary rounded-lg flex-col justify-start  items-start gap-3 inline-flex overflow-hidden text-theme-primary ">
				<div className="">
					<div className="p-4 relative w-[400px]">
						<div className="flex flex-col items-center gap-y-3 ">
							<MezonIcon icon={MzIcons48.mzLock} className="w-[120px] h-[90px] text-[#5865f2]" />
							<h3 className="font-bold text-2xl text-theme-primary-active">Oops! Login Failed</h3>
						</div>
					</div>
					<div className="w-full bg-theme-setting-primary p-4">
						<button className="px-4 py-2 btn-primary-hover rounded-lg w-full btn-primary" onClick={() => retryLogin()}>
							Retry Login
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

export default FailLoginModal;
