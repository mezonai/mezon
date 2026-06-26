import { useAppNavigation } from '@mezon/core';
import { Check } from '@mezon/ui/lib/Icons/icons';
import type { TypeSelectClan } from './types';

type ModalSuccessProps = {
	name?: string;
	isModalTry?: boolean;
	clan?: TypeSelectClan;
};

const ModalSuccess = ({ name, clan }: ModalSuccessProps) => {
	const { toChannelPage, toClanPage } = useAppNavigation();

	const handleNavigate = () => {
		if (clan?.clanId) {
			const targetPath = clan.channelId ? toChannelPage(clan.channelId, clan.clanId) : toClanPage(clan.clanId);
			window.location.href = `${process.env.NX_CHAT_APP_REDIRECT_URI}${targetPath}`;
		}
	};

	return (
		<div className="rounded-3xl dark:bg-[#121421]/90 bg-white border dark:border-white/[0.06] border-slate-200/80 max-w-[440px] w-full p-8 md:p-9 flex flex-col items-center text-center backdrop-blur-xl transition-all duration-500 shadow-[0_24px_48px_-12px_rgba(15,23,42,0.06)] dark:shadow-[0_24px_50px_-12px_rgba(3,4,9,0.7)] relative overflow-hidden">
			<div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy5vcmcvMjAwMC9zdmciPjxkZWZzPjxwYXR0ZXJuIGlkPSJwYXR0ZXJuIiB4PSIwIiB5PSIwIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHBhdHRlcm5UcmFuc2Zvcm09InJvdGF0ZSgzMCkiPjxjaXJjbGUgY3g9IjIiIGN5PSIyIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDMpIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI3BhdHRlcm4pIi8+PC9zdmc+')] opacity-60 pointer-events-none select-none" />

			<div className="absolute top-[-20%] w-[200px] h-[200px] rounded-full bg-emerald-500/10 dark:bg-emerald-500/5 blur-[50px] pointer-events-none select-none" />

			<div className="relative size-24 flex items-center justify-center mt-2 select-none z-10 group">
				<div className="absolute inset-0 rounded-full bg-emerald-500/10 dark:bg-emerald-400/5 animate-pulse" />

				<div className="absolute inset-2 rounded-full border border-dashed border-emerald-500/20 dark:border-emerald-400/25 animate-[spin_40s_linear_infinite]" />

				<div className="absolute inset-3.5 rounded-full border border-emerald-500/30 dark:border-emerald-400/20 bg-gradient-to-tr from-emerald-500/[0.03] to-teal-500/[0.03]" />

				<div className="size-12 rounded-full bg-emerald-500 dark:bg-emerald-500/90 flex items-center justify-center shadow-lg shadow-emerald-500/30 dark:shadow-emerald-500/20 transition-transform duration-300 group-hover:scale-105">
					<Check className="h-6 w-6 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.15)]" />
				</div>
			</div>

			<div className="absolute top-5 left-5 flex items-center gap-1.5 z-10 opacity-85 select-none">
				<div className="w-2 h-2 rounded-full bg-[#eb459e] shadow-[0_0_8px_rgba(235,69,158,0.6)]"></div>
				<span className="text-[10px] font-extrabold text-violet-500 dark:text-violet-400 uppercase tracking-widest font-mono">mezon</span>
			</div>

			<h2 className="text-2xl font-extrabold tracking-tight dark:text-white text-slate-900 mt-6 relative z-10">Success!</h2>

			<p className="text-sm dark:text-slate-300 text-slate-600 mt-3 leading-relaxed font-medium relative z-10 px-2">
				<span className="font-bold dark:text-white text-slate-900">{name}</span> has been authorised and added
				{clan?.clanName ? (
					<>
						{' '}
						to <span className="font-bold dark:text-white text-slate-900">{clan.clanName}</span>
					</>
				) : (
					'.'
				)}
			</p>

			<button
				onClick={handleNavigate}
				className="w-full mt-7 py-3.5 px-5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold rounded-xl hover:opacity-95 transition-all duration-300 shadow-lg shadow-violet-500/15 active:scale-95 cursor-pointer relative z-10 flex justify-center items-center gap-2"
			>
				<span className="font-bold text-sm">Go to {clan?.clanName}</span>
			</button>

			<p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-4 relative z-10">You may now close this window or tab.</p>

			<div className="absolute bottom-0 left-0 w-full h-[3px] bg-gradient-to-r from-violet-500 via-emerald-500 to-indigo-500"></div>
		</div>
	);
};

export default ModalSuccess;
