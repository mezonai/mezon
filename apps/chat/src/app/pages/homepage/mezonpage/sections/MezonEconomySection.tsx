export const MezonEconomySection = () => {
	return (
		<section className="w-full bg-[#E6ECF0] py-20 max-md:py-12">
			<div className="container w-10/12 max-lg:w-full max-md:px-4 mx-auto">
				<div className="text-center mb-12">
					<h2 className="text-6xl max-md:text-3xl font-bold mb-4 text-stone-900">
						Mezon Economy - Powered{' '}
						<p>
							{' '}
							By <span className="text-purple-600">Trust</span>
						</p>
					</h2>
					<p className="text-lg text-gray-600 max-w-3xl mx-auto">
						Send money instantly, reward creators, and shop with partner brands — all with{' '}
						<span className="text-purple-600 font-semibold">zero platform fee</span>. Built on transparency and security
					</p>

					<div className="flex justify-center gap-4 mt-8">
						<button className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all">
							Learn How it Works
						</button>
						<button className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all">
							Explore Partners
						</button>
					</div>
				</div>
				<div className="flex justify-center mb-16">
					<div className="relative w-80 h-[600px] max-md:w-64 max-md:h-[480px]">
						<img src="/assets/mezon-mobile-profile.png" alt="Freedom to Connect" className="w-full h-full object-cover" />
					</div>
				</div>
			</div>
		</section>
	);
};
