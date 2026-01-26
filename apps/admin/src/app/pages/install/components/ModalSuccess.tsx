import { useAppNavigation } from '@mezon/core';
import { Check } from '@mezon/ui/lib/Icons/icons';
import { useNavigate } from 'react-router-dom';
import type { TypeSelectClan } from './types';

type ModalSuccessProps = {
	name?: string;
	isModalTry?: boolean;
	clan?: TypeSelectClan;
};

const ModalSuccess = ({ name, clan }: ModalSuccessProps) => {
	const { toChannelPage, toClanPage } = useAppNavigation();
	const navigate = useNavigate();

	const handleNavigate = () => {
		if (clan?.clanId) {
			const targetPath = clan.channelId ? toChannelPage(clan.channelId, clan.clanId) : toClanPage(clan.clanId);
			window.location.href = `${process.env.NX_CHAT_APP_REDIRECT_URI}${targetPath}`;
		}
	};

	return (
		<div className="max-w-[440px] w-full rounded-lg overflow-hidden border-0 bg-white text-black dark:bg-gradient-to-br dark:from-[#2b2d31] dark:to-[#313338] dark:text-white shadow-2xl transition-all duration-500 hover:shadow-[0_0_25px_rgba(88,101,242,0.3)]">
			<div className="p-8 flex flex-col items-center text-center space-y-6 relative overflow-hidden">
				<div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy5vcmcvMjAwMC9zdmciPjxkZWZzPjxwYXR0ZXJuIGlkPSJwYXR0ZXJuIiB4PSIwIiB5PSIwIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHBhdHRlcm5UcmFuc2Zvcm09InJvdGF0ZSgzMCkiPjxjaXJjbGUgY3g9IjIiIGN5PSIyIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDMpIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI3BhdHRlcm4pIi8+PC9zdmc+')]"></div>

				<div className="w-20 h-20 rounded-full bg-gradient-to-r from-[#23a55a] to-[#2dc771] flex items-center justify-center shadow-[0_0_20px_rgba(35,165,90,0.5)] animate-bounce-slow relative z-10">
					<Check className="h-10 w-10 text-white animate-pulse" />
				</div>

				<div className="absolute top-0 left-0 p-1 flex items-center space-x-2 animate-fadeIn z-10">
					<div className="w-3 h-3 rounded-full bg-[#eb459e] shadow-[0_0_6px_rgba(235,69,158,0.7)]"></div>
					<span className="text-xs font-bold text-[#5865f2] tracking-wider">mezon</span>
				</div>

				<h2 className="text-2xl font-bold animate-fadeIn z-10">Success!</h2>

				<p className="animate-fadeIn z-10">
					<span className="font-semibold">{name}</span> has been authorised and added
					{clan?.clanName ? (
						<>
							{' '}
							to <span className="font-semibold">{clan.clanName}</span>
						</>
					) : (
						'.'
					)}
				</p>

				<button
					onClick={handleNavigate}
					className="bg-[#5865f2] hover:bg-[#4752c4] text-white w-full mt-4 animate-fadeIn relative z-10 transition-all hover:scale-105 hover:shadow-lg group overflow-hidden px-3 py-2"
				>
					<span className="absolute inset-0 w-full h-full bg-gradient-to-r from-[#5865f2] to-[#4752c4] group-hover:animate-shimmer"></span>
					<span className="relative font-bold">Go to {clan?.clanName}</span>
				</button>

				<p className="text-xs animate-fadeIn z-10">You may now close this window or tab.</p>

				<div className="absolute -bottom-10 left-0 w-full h-2 bg-gradient-to-r from-[#5865f2] via-[#23a55a] to-[#5865f2] animate-gradient-x"></div>
			</div>
		</div>
	);
};

export default ModalSuccess;
