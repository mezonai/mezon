type ModalAskProps = {
	handelBack: () => void;
	handleAddBotOrApp: () => void;
};

const ModalAsk = ({ handelBack, handleAddBotOrApp }: ModalAskProps) => {
	return (
		<div className="flex justify-between items-center p-4 rounded-b bg-[#f9fafb] dark:bg-[#1e1f22]">
			<button onClick={handelBack} className="text-sm font-medium hover:underline text-[#111827] dark:text-[#d1d5db]">
				Back
			</button>
			<div className="flex items-center gap-x-2">
				<p className="text-xs text-[#4b5563] dark:text-[#9ca3af]">Click to authorize this app</p>
				<button
					onClick={handleAddBotOrApp}
					className="text-sm px-4 py-2 bg-[#5865F2] rounded-lg text-white font-semibold hover:bg-[#4752c4] transition"
				>
					Authorize
				</button>
			</div>
		</div>
	);
};

export default ModalAsk;
