'use client';

import mezonPackage from '@mezon/package-js';
import { Icons } from '@mezon/ui';
import { getPlatform, Platform } from '@mezon/utils';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Footer from '../homepage/mezonpage/footer';
import HeaderMezon from '../homepage/mezonpage/header';

const CustomizePage = () => {
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
			title: 'Custom Themes',
			description: 'Choose from light, dark, or create your own custom theme to match your personal style.',
			image: '/assets/custome.webp'
		},
		{
			id: 1,
			title: 'Server Branding',
			description: 'Add your logo, banner, and custom colors to your server to reflect your brand identity.',
			image: '/assets/custome.webp'
		},
		{
			id: 2,
			title: 'Custom Emojis',
			description: 'Upload and use your own custom emojis and stickers to express yourself in unique ways.',
			image: '/assets/custome.webp'
		},
		{
			id: 3,
			title: 'Layout Customization',
			description: 'Rearrange and customize the layout of your workspace to fit your workflow and preferences perfectly.',
			image: '/assets/custome.webp'
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
						{/* Left Content */}
						<div className="max-lg:text-center">
							<h1 className="text-7xl max-lg:text-5xl max-md:text-4xl font-bold mb-8 leading-tight">
								Make Mezon truly <span className="text-purple-600 block mt-2">yours</span>
							</h1>
							<p className="text-xl max-md:text-lg text-gray-600 leading-relaxed mb-10 max-w-xl">
								Make Mezon truly yours. Customize your workspace with themes, colors, and personalization options to match your style
								and brand.
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
							<img src="/assets/custome.webp" alt="Customize" className="w-full max-w-[500px] h-auto object-contain drop-shadow-2xl" />
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
						<h2 className="text-4xl max-md:text-3xl font-bold text-center mb-12">Endless customization options</h2>
						<div className="space-y-8">
							<div className="flex gap-6 max-md:flex-col">
								<div className="flex-1">
									<h3 className="text-xl font-semibold text-gray-900 mb-3">Custom Sounds & Notifications</h3>
									<p className="text-gray-600 leading-relaxed">
										Personalize notification sounds and alerts to make your Mezon experience truly unique to you.
									</p>
								</div>
							</div>
							<div className="flex gap-6 max-md:flex-col">
								<div className="flex-1">
									<h3 className="text-xl font-semibold text-gray-900 mb-3">Layout Customization</h3>
									<p className="text-gray-600 leading-relaxed">
										Rearrange and customize the layout of your workspace to fit your workflow and preferences perfectly.
									</p>
								</div>
							</div>
							<div className="flex gap-6 max-md:flex-col">
								<div className="flex-1">
									<h3 className="text-xl font-semibold text-gray-900 mb-3">Profile Customization</h3>
									<p className="text-gray-600 leading-relaxed">
										Customize your profile with avatars, status messages, and rich profiles that represent who you are.
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
						Ready to <span className="text-purple-600">customize</span> your experience?
					</h2>
					<p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
						Join Mezon today and make your workspace truly yours with endless customization options.
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

export default CustomizePage;
