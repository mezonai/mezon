import { useState } from 'react';

const LINKS = {
	store: 'https://top.mezon.ai/',
	apps: {
		listenTogether: 'youtube.com',
		virtualHub: 'youtube.com',
		liveTranslator: 'youtube.com'
	},
	bots: {
		utility: 'youtube.com',
		rewardBot: 'youtube.com',
		neuro: 'youtube.com'
	}
} as const;

export const BotsAndAppsSection = () => {
	const [showApps, setShowApps] = useState(true);

	return (
		<section className="w-full bg-white py-20 max-md:py-12">
			<div className="container w-10/12 max-lg:w-full max-md:px-4 mx-auto text-center">
				<h2 className="text-6xl max-md:text-3xl font-bold mb-4 text-stone-900">
					Personalize Your Community{' '}
					<p>
						With <span className="text-purple-600">Bots</span> & <span className="text-purple-600">Apps</span>
					</p>
				</h2>
				<p className="text-lg text-gray-600 max-w-3xl mx-auto mb-8">
					From automated assistants to powerful extensions, Bots and Apps make your clan more dynamic, unique, and tailored to your needs.
					Easy to install, simple to personalize — and even <span className="text-purple-600 font-semibold">share or monetize</span> with
					the Mezon community.
				</p>
				<a href={LINKS.store} target="_blank" rel="noopener noreferrer">
					<button className="px-8 py-4 bg-purple-600 text-white rounded-lg text-lg font-semibold hover:bg-purple-700 transition-all">
						Explore The Bot & App Store
					</button>
				</a>
			</div>

			<div className="w-full bg-[#E6ECF0] py-20 mt-20">
				<div className="container w-10/12 max-lg:w-full max-md:px-4 mx-auto text-center">
					<div className="flex justify-center mb-12">
						<div className="bg-gray-100 rounded-full p-1 inline-flex relative cursor-pointer" onClick={() => setShowApps(!showApps)}>
							<div
								className={`absolute top-1 bottom-1 bg-gray-900 rounded-full shadow-sm transition-all duration-300 ease-in-out ${
									showApps ? 'left-1/2 right-1' : 'left-1 right-1/2'
								}`}
							/>
							<button
								className={`relative z-10 px-6 py-3 rounded-full font-medium transition-colors duration-300 ${
									!showApps ? 'text-white' : 'text-gray-600 hover:text-gray-900'
								}`}
							>
								Bots
							</button>
							<button
								className={`relative z-10 px-6 py-3 rounded-full font-medium transition-colors duration-300 ${
									showApps ? 'text-white' : 'text-gray-600 hover:text-gray-900'
								}`}
							>
								Apps
							</button>
						</div>
					</div>

					<div className="mt-12">
						{showApps ? (
							<>
								<h3 className="text-4xl text-stone-900 font-bold mb-8">
									Apps That Bring Powerful <p>Tools Into Mezon</p>
								</h3>
								<p className="text-gray-600 mb-12 max-w-2xl mx-auto">
									Install apps directly inside Mezon — no extra software needed. From events and collaboration to e-commerce, apps
									make your community seamless and productive.
								</p>

								<div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
									<a href={LINKS.apps.listenTogether} target="_blank" rel="noopener noreferrer">
										<div className="rounded-3xl p-8   hover:shadow-lg transition-shadow cursor-pointer flex flex-col h-full">
											<div className="w-28 h-28 mx-auto mb-6 bg-white border-2 border-gray-300 rounded-2xl flex items-center justify-center">
												<img
													src="/assets/listen-together.png"
													alt="Freedom to Connect"
													className="w-full h-full object-cover"
												/>
											</div>

											<div className="flex justify-center gap-1 mb-4">
												{[...Array(5)].map((_, i) => (
													<span key={i} className="text-yellow-400 text-xl">
														★
													</span>
												))}
											</div>

											<div className="flex justify-center gap-2 mb-4">
												<span className="px-4 py-1 bg-purple-300 text-purple-900 rounded-full text-sm font-semibold">
													Gaming
												</span>
												<span className="px-4 py-1 bg-teal-300 text-teal-900 rounded-full text-sm font-semibold">Tech</span>
											</div>

											<h3 className="text-center text-xl font-bold text-gray-900 mb-3">Listen Together</h3>

											<p className="text-center text-sm text-gray-700 flex-grow">
												Listen Together – Share the Soundtrack of Your Moments
											</p>
										</div>
									</a>

									<a href={LINKS.apps.virtualHub} target="_blank" rel="noopener noreferrer">
										<div className="rounded-3xl p-8  hover:shadow-lg transition-shadow cursor-pointer flex flex-col h-full">
											<div className="w-28 h-28 mx-auto mb-6 bg-gradient-to-br from-green-500 to-green-700 rounded-2xl flex items-center justify-center">
												<img src="/assets/Virtual-Hub.png" alt="Freedom to Connect" className="w-full h-full object-cover" />
											</div>

											<div className="flex justify-center gap-1 mb-4">
												{[...Array(5)].map((_, i) => (
													<span key={i} className="text-yellow-400 text-xl">
														★
													</span>
												))}
											</div>

											<div className="flex justify-center gap-2 mb-4">
												<span className="px-4 py-1 bg-red-300 text-red-900 rounded-full text-sm font-semibold">AI</span>
												<span className="px-4 py-1 bg-teal-300 text-teal-900 rounded-full text-sm font-semibold">Tech</span>
											</div>

											<h3 className="text-center text-xl font-bold text-gray-900 mb-3">Virtual Hub</h3>

											<p className="text-center text-sm text-gray-700 flex-grow">
												Virtual Hub là game nơi mà người chơi sẽ hòa thân thành một nhân vật sống trong một thế giới ảo đầy
												màu sắc và kỳ diệu
											</p>
										</div>
									</a>

									<a href={LINKS.apps.liveTranslator} target="_blank" rel="noopener noreferrer">
										<div className="rounded-3xl p-8   hover:shadow-lg transition-shadow cursor-pointer flex flex-col h-full">
											<div className="w-28 h-28 mx-auto mb-6 bg-gradient-to-br from-gray-600 to-gray-800 rounded-2xl flex items-center justify-center">
												<img src="/assets/duck-race.png" alt="Freedom to Connect" className="w-full h-full object-cover" />
											</div>

											<div className="flex justify-center gap-1 mb-4">
												{[...Array(5)].map((_, i) => (
													<span key={i} className="text-yellow-400 text-xl">
														★
													</span>
												))}
											</div>

											<div className="flex justify-center gap-2 mb-4">
												<span className="px-4 py-1 bg-red-300 text-red-900 rounded-full text-sm font-semibold">AI</span>
												<span className="px-4 py-1 bg-teal-300 text-teal-900 rounded-full text-sm font-semibold">Tech</span>
											</div>

											<h3 className="text-center text-xl font-bold text-gray-900 mb-3">Live Translator</h3>

											<p className="text-center text-sm text-gray-700 flex-grow">
												Tự động dịch tiếng Việt (hoặc bất kỳ ngôn ngữ nào) sang tiếng Anh (hoặc ngôn ngữ khác).
											</p>
										</div>
									</a>
								</div>
							</>
						) : (
							<>
								<h3 className="text-3xl font-bold mb-8 text-stone-900">Bots That Automate & Enhance Your Server</h3>
								<p className="text-gray-600 mb-12 max-w-2xl mx-auto">
									Add powerful bots to automate tasks, moderate your community, and create engaging experiences. Easy to set up and
									customize to fit your needs.
								</p>

								<div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
									<a href={LINKS.bots.utility} target="_blank" rel="noopener noreferrer">
										<div className="rounded-3xl p-8   hover:shadow-lg transition-shadow cursor-pointer flex flex-col h-full">
											<div className="w-28 h-28 mx-auto mb-6 bg-white border-2 border-gray-300 rounded-2xl flex items-center justify-center">
												<img src="/assets/utility-bot.jpg" alt="Freedom to Connect" className="w-full h-full object-cover" />
											</div>

											<div className="flex justify-center gap-1 mb-4">
												{[...Array(5)].map((_, i) => (
													<span key={i} className="text-yellow-400 text-xl">
														★
													</span>
												))}
											</div>

											<div className="flex justify-center gap-2 mb-4">
												<span className="px-4 py-1 bg-purple-300 text-purple-900 rounded-full text-sm font-semibold">
													Gaming
												</span>
												<span className="px-4 py-1 bg-teal-300 text-teal-900 rounded-full text-sm font-semibold">Tech</span>
											</div>

											<h3 className="text-center text-xl font-bold text-gray-900 mb-3">Utility</h3>

											<p className="text-center text-sm text-gray-700 flex-grow">
												Provides interesting commands to interact with clan members
											</p>
										</div>
									</a>

									<a href={LINKS.bots.rewardBot} target="_blank" rel="noopener noreferrer">
										<div className="rounded-3xl p-8  hover:shadow-lg transition-shadow cursor-pointer flex flex-col h-full">
											<div className="w-28 h-28 mx-auto mb-6 bg-gradient-to-br from-green-500 to-green-700 rounded-2xl flex items-center justify-center">
												<img src="/assets/reward-bot.png" alt="Freedom to Connect" className="w-full h-full object-cover" />
											</div>

											<div className="flex justify-center gap-1 mb-4">
												{[...Array(5)].map((_, i) => (
													<span key={i} className="text-yellow-400 text-xl">
														★
													</span>
												))}
											</div>

											<div className="flex justify-center gap-2 mb-4">
												<span className="px-4 py-1 bg-red-300 text-red-900 rounded-full text-sm font-semibold">AI</span>
												<span className="px-4 py-1 bg-teal-300 text-teal-900 rounded-full text-sm font-semibold">Tech</span>
											</div>
											<h3 className="text-center text-xl font-bold text-gray-900 mb-3">Reward Bot</h3>

											<p className="text-center text-sm text-gray-700 flex-grow">
												Reward là một bot hỗ trợ cộng đồng Mezon trong việc ghi nhận thành tích của thành viên bằng trophy
												(danh hiệu). Dễ sử dụng – Hiệu quả – Tạo động lực cho cộng đồng!
											</p>
										</div>
									</a>

									<a href={LINKS.bots.neuro} target="_blank" rel="noopener noreferrer">
										<div className="rounded-3xl p-8   hover:shadow-lg transition-shadow cursor-pointer flex flex-col h-full">
											<div className="w-28 h-28 mx-auto mb-6 bg-gradient-to-br from-gray-600 to-gray-800 rounded-2xl flex items-center justify-center">
												<img src="/assets/neuro-bot.png" alt="Freedom to Connect" className="w-full h-full object-cover" />
											</div>

											<div className="flex justify-center gap-1 mb-4">
												{[...Array(5)].map((_, i) => (
													<span key={i} className="text-yellow-400 text-xl">
														★
													</span>
												))}
											</div>

											<div className="flex justify-center gap-2 mb-4">
												<span className="px-4 py-1 bg-red-300 text-red-900 rounded-full text-sm font-semibold">AI</span>
												<span className="px-4 py-1 bg-teal-300 text-teal-900 rounded-full text-sm font-semibold">Tech</span>
											</div>

											<h3 className="text-center text-xl font-bold text-gray-900 mb-3">Neuro </h3>

											<p className="text-center text-sm text-gray-700 flex-grow">
												An intelligent study assistant for high school students
											</p>
										</div>
									</a>
								</div>
							</>
						)}
					</div>
				</div>
			</div>
		</section>
	);
};
