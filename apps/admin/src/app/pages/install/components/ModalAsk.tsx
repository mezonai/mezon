type ModalAskProps = {
	handelBack: () => void;
	handleAddBotOrApp: () => void;
};

const ModalAsk = ({ handelBack, handleAddBotOrApp }: ModalAskProps) => {
	return (
		<div className="flex justify-between items-center pt-2 p-0 bg-transparent w-full mt-1">
			<button
				onClick={handelBack}
				className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:underline transition-colors duration-200 cursor-pointer"
			>
				Back
			</button>

			<div className="flex items-center gap-x-2.5">
				<p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">Click to authorize this app</p>

				<button
					onClick={handleAddBotOrApp}
					className="text-xs px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold rounded-lg hover:opacity-95 transition-all duration-300 shadow-md shadow-violet-500/15 active:scale-95 cursor-pointer"
				>
					Authorize
				</button>
			</div>
		</div>
	);
};

export default ModalAsk;
