type ModalAskProps = {
	handelBack: () => void;
	handleAddBotOrApp: () => void;
};

const ModalAsk = ({ handelBack, handleAddBotOrApp }: ModalAskProps) => (
	<div className="flex justify-between items-center p-4  bg-[#2b2d31] rounded-b">
		<button onClick={handelBack} className="text-sm font-medium text-contentTertiary hover:underline">
			Back
		</button>
		<div className="flex items-center gap-x-2">
			<p className="text-xs text-contentTertiary">Click to authorize this app</p>
			<button
				onClick={handleAddBotOrApp}
				className="text-sm px-4 py-2 bg-primary rounded-lg text-white font-semibold hover:bg-opacity-80 transition"
			>
				Authorize
			</button>
		</div>
	</div>
);

export default ModalAsk;
