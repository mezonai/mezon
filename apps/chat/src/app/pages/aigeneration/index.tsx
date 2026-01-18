'use client';

import mezonPackage from '@mezon/package-js';
import { Icons } from '@mezon/ui';
import { getPlatform, Platform } from '@mezon/utils';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Footer from '../homepage/mezonpage/footer';
import HeaderMezon from '../homepage/mezonpage/header';

const AIGenerationPage = () => {
	const platform = getPlatform();
	const version = mezonPackage.version;
	const downloadUrl: string =
		platform === Platform.MACOS
			? 'https://apps.apple.com/vn/app/mezon-desktop/id6756601798?mt=12'
			: platform === Platform.LINUX
				? `${process.env.NX_BASE_IMG_URL}/release/mezon-${version}-linux-amd64.deb`
				: `${process.env.NX_BASE_IMG_URL}/release/mezon-${version}-win-x64.exe`;
	const universalUrl = 'https://apps.apple.com/vn/app/mezon-desktop/id6756601798?mt=12';
	const portableUrl = `${process.env.NX_BASE_IMG_URL}/release/mezon-${version}-win-x64-portable.exe`;

	const [activeFeature, setActiveFeature] = useState(0);

	const features = [
		{
			id: 0,
			title: 'Smart Responses',
			description: 'Get AI-powered suggestions and quick replies for faster communication and better conversations.',
			image: '/ai-gent.webp'
		},
		{
			id: 1,
			title: 'Content Generation',
			description: 'Generate text, images, and creative content with AI assistance to bring your ideas to life.',
			image: '/ai-gent.webp'
		},
		{
			id: 2,
			title: 'Automation',
			description: 'Automate repetitive tasks and streamline your workflow with AI-powered automation tools.',
			image: '/ai-gent.webp'
		},
		{
			id: 3,
			title: 'Intelligent Summarization',
			description: 'Automatically summarize long conversations and threads so you can quickly catch up on what matters.',
			image: '/ai-gent.webp'
		}
	];

	useEffect(() => {
		window.scrollTo(0, 0);
	}, []);

	return (
		<div className="min-h-screen bg-white">
			<HeaderMezon
				sideBarIsOpen={false}
				toggleSideBar={() => {
					('');
				}}
				scrollToSection={() => {
					('');
				}}
			/>
			<section className="pt-[120px] pb-20 max-md:pt-[100px] max-md:pb-12 px-4 bg-[#F8F9FA]">
				<div className="container max-w-7xl mx-auto">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
						<div className="max-lg:text-center">
							<h1 className="text-7xl max-lg:text-5xl max-md:text-4xl font-bold mb-8 leading-tight">
								Supercharge with <span className="text-purple-600 block mt-2">AI Agent</span>
							</h1>
							<p className="text-xl max-md:text-lg text-gray-600 leading-relaxed mb-10 max-w-xl">
								Supercharge your productivity with AI-powered features. Get intelligent assistance, content generation, and smart
								automation right in your workspace.
							</p>
							<a
								href={downloadUrl}
								className="inline-flex items-center gap-2 px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-full font-semibold text-lg transition-all shadow-lg hover:shadow-xl"
							>
								Download
								<Icons.Download className="w-5 h-5" />
							</a>
						</div>

						<div className="flex justify-center lg:justify-end">
							<img src="/ai-gent.webp" alt="AI Generation" className="w-full max-w-[500px] h-auto object-contain drop-shadow-2xl" />
						</div>
					</div>
				</div>
			</section>

			<section className="py-20 max-md:py-12 px-4 bg-white">
				<div className="container max-w-7xl mx-auto">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
						<div className="order-2 lg:order-1 flex justify-center">
							<div className="relative w-full max-w-[541px]">
								<img
									src={features[activeFeature].image}
									alt={features[activeFeature].title}
									className="w-full h-auto object-contain drop-shadow-2xl rounded-3xl transition-all duration-500"
									key={activeFeature}
								/>
							</div>
						</div>

						<div className="order-1 lg:order-2 space-y-1">
							{features.map((feature, index) => (
								<div key={feature.id} className="border-b border-gray-200 last:border-b-0">
									<button
										onClick={() => setActiveFeature(index)}
										className={`w-full text-left py-6 px-4 transition-all duration-300 hover:bg-purple-50 rounded-lg ${
											activeFeature === index ? 'bg-purple-50' : ''
										}`}
									>
										<div className="flex items-start justify-between gap-4">
											<div className="flex-1">
												<h3
													className={`text-2xl max-md:text-xl font-semibold mb-2 transition-colors ${
														activeFeature === index ? 'text-purple-600' : 'text-gray-900'
													}`}
												>
													{feature.title}
												</h3>
												<div
													className={`overflow-hidden transition-all duration-500 ${
														activeFeature === index ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0'
													}`}
												>
													<p className="text-gray-600 text-base leading-relaxed pr-8">{feature.description}</p>
												</div>
											</div>
										</div>
									</button>
								</div>
							))}
						</div>
					</div>
				</div>
			</section>

			<section className="py-20 max-md:py-12 px-4 bg-[#F8F9FA]">
				<div className="container max-w-7xl mx-auto">
					<div className="max-w-4xl mx-auto">
						<h2 className="text-4xl max-md:text-3xl font-bold text-center mb-12">Advanced AI capabilities</h2>
						<div className="space-y-8">
							<div className="flex gap-6 max-md:flex-col">
								<div className="flex-1">
									<h3 className="text-xl font-semibold text-gray-900 mb-3">Intelligent Summarization</h3>
									<p className="text-gray-600 leading-relaxed">
										Automatically summarize long conversations and threads so you can quickly catch up on what matters.
									</p>
								</div>
							</div>
							<div className="flex gap-6 max-md:flex-col">
								<div className="flex-1">
									<h3 className="text-xl font-semibold text-gray-900 mb-3">Smart Notifications</h3>
									<p className="text-gray-600 leading-relaxed">
										AI learns your communication patterns and prioritizes notifications so you only see what's truly important.
									</p>
								</div>
							</div>
							<div className="flex gap-6 max-md:flex-col">
								<div className="flex-1">
									<h3 className="text-xl font-semibold text-gray-900 mb-3">Contextual Assistance</h3>
									<p className="text-gray-600 leading-relaxed">
										Get help right when you need it. AI understands context and provides relevant suggestions based on your
										current task.
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			<section className="py-20 max-md:py-12 px-4">
				<div className="container max-w-7xl mx-auto text-center">
					<h2 className="text-4xl max-md:text-3xl font-bold mb-6">
						Ready to supercharge with <span className="text-purple-600">AI</span>?
					</h2>
					<p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
						Join Mezon today and experience the power of AI-powered features that make work easier and faster.
					</p>
					<Link
						to="/mezon"
						className="inline-block px-8 py-4 bg-purple-600 text-white rounded-lg font-semibold text-lg hover:bg-purple-700 transition-colors"
					>
						Get Started
					</Link>
				</div>
			</section>

			<Footer downloadUrl={downloadUrl} universalUrl={universalUrl} portableUrl={portableUrl} />
		</div>
	);
};

export default AIGenerationPage;
