import { memo } from 'react';

type HeaderModalProps = {
	name?: string;
	username?: string;
};

const HeaderModal = memo(({ name, username }: HeaderModalProps) => {
	return (
		<div className="p-0 bg-transparent text-slate-800 dark:text-slate-200 flex flex-col w-full">
			<p className="text-[10px] font-extrabold uppercase tracking-widest dark:text-slate-400 text-slate-500">An external application</p>

			<h3 className="font-extrabold text-lg sm:text-xl dark:text-amber-400 text-amber-500 mt-0.5 tracking-tight truncate max-w-full">{name}</h3>

			<p className="text-xs font-medium dark:text-slate-300 text-slate-600 mt-0.5 leading-tight">wants to access your Mezon account</p>

			<div className="mt-2.5 px-3 py-2 rounded-xl dark:bg-[#161826]/60 bg-slate-50/80 border dark:border-white/[0.04] border-slate-100 flex items-center justify-between text-xs font-medium shadow-inner">
				<span className="dark:text-slate-400 text-slate-500 truncate max-w-[75%]">
					Signed in as <span className="font-bold dark:text-emerald-400 text-emerald-600">{username}</span>
				</span>
				<a href="#" className="text-violet-600 dark:text-violet-400 font-bold hover:underline shrink-0 ml-2 transition">
					Not you?
				</a>
			</div>

			<div className="w-full h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-[#22263a]/80 to-transparent my-2.5" />
		</div>
	);
});

export default HeaderModal;
