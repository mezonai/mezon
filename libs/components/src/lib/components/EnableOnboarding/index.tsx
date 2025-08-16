const EnableOnboarding = ({ onEnable }: { onEnable: () => void }) => {
	return (
		<div className="flex flex-col items-center justify-center min-h-[400px] bg-[#5865F2] rounded-lg p-8">
			<div className="mb-8 p-4 bg-white/10 backdrop-blur-sm rounded-2xl shadow-lg">
				<img
					src={"assets/images/onboarding.png"}
					alt="Mezon Community"
					className="max-w-[350px] w-full h-auto rounded-lg shadow-md"
				/>
			</div>
			<h2 className="text-3xl font-bold text-white mb-4">Are you enable Onboarding?</h2>
			<p className="text-white text-lg mb-6 text-center max-w-xl">
				Convert to a Onboarding to access additional administrative tools that help you moderate and grow your Clan..
			</p>
			<button onClick={onEnable} className="px-8 py-3 bg-white text-[#5865F2] font-semibold rounded-lg shadow hover:bg-gray-100 transition">
				Enable Onboarding
			</button>
		</div>
	);
};

export default EnableOnboarding;
