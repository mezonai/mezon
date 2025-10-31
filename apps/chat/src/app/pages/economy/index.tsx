'use client';

import { ContactUsModal } from '@mezon/components';
import mezonPackage from '@mezon/package-js';
import { Platform, getPlatform } from '@mezon/utils';
import { useEffect, useMemo, useRef, useState } from 'react';
import Footer from '../homepage/mezonpage/footer';
import HeaderMezon from '../homepage/mezonpage/header';

export const EconomyPage = () => {
	const platform = getPlatform();
	const version = mezonPackage.version;
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const [isContactModalOpen, setIsContactModalOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);
	const downloadUrl: string = useMemo(() => {
		if (platform === Platform.MACOS) {
			return `${process.env.NX_BASE_IMG_URL}/release/mezon-${version}-mac-arm64.dmg`;
		} else if (platform === Platform.LINUX) {
			return `${process.env.NX_BASE_IMG_URL}/release/mezon-${version}-linux-amd64.deb`;
		}
		return `${process.env.NX_BASE_IMG_URL}/release/mezon-${version}-win-x64.exe`;
	}, [platform, version]);

	const universalUrl = `${process.env.NX_BASE_IMG_URL}/release/mezon-${version}-mac-x64.dmg`;
	const portableUrl = `${process.env.NX_BASE_IMG_URL}/release/mezon-${version}-win-x64-portable.exe`;

	const handleDownloadMezon = () => {
		if (platform === Platform.IOS) {
			window.open('https://apps.apple.com/vn/app/mezon/id6502750046', '_blank');
		} else if (platform === Platform.ANDROID) {
			window.open('https://play.google.com/store/apps/details?id=com.mezon.mobile', '_blank');
		} else {
			setIsDropdownOpen(!isDropdownOpen);
		}
	};

	useEffect(() => {
		window.scrollTo(0, 0);
	}, []);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setIsDropdownOpen(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, []);

	return (
		<div className="min-h-screen bg-gradient-to-b from-white via-purple-50 to-white">
			<style>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        .card-animate {
          animation: slideInUp 0.6s ease-out forwards;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .card-animate:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 25px -5px rgba(147, 51, 234, 0.15);
        }
      `}</style>

			<HeaderMezon
				sideBarIsOpen={false}
				toggleSideBar={() => {
					('');
				}}
				scrollToSection={() => {
					('');
				}}
			/>

			<section className="pt-16 pb-10 md:pt-24 md:pb-20 bg-gradient-to-b from-white to-purple-50 relative overflow-hidden">
				<div className="max-w-2xl mx-auto text-center px-4">
					<h1 className="text-6xl md:text-6xl font-bold mb-6 text-black leading-tight">
						Mezon Dong - Powered
						<br />
						By <span className="bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent">Trust</span>
					</h1>
					<p className="text-base md:text-lg text-gray-700 mb-8 max-w-xl mx-auto leading-relaxed">
						Send <span className="text-purple-600 font-semibold">Mezon Dong</span> instantly, reward creators, and shop with partner
						brands — all with zero fee. Transparent and Secure
					</p>
					<div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
						<button className="px-12 py-4 bg-white border-2 border-purple-200 text-black text-lg font-semibold hover:bg-purple-50 hover:border-purple-400 transition-all duration-300 shadow-md hover:shadow-lg rounded-md">
							Learn How It Works
						</button>
						<button className="px-12 py-4 bg-gradient-to-r from-purple-600 to-purple-500 text-white  text-lg font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 shadow-md rounded-md">
							Explore Partners
						</button>
					</div>
					<div className="flex justify-center mb-6">
						<div className="relative w-full max-w-lg">
							<img
								src="/assets/economy_tranfer.png"
								alt="Mezon Dong Profile"
								className="relative w-full h-auto object-contain rounded-3xl"
								style={{
									filter: 'drop-shadow(0 0 30px rgba(147, 51, 234, 0.3))'
								}}
							/>
						</div>
					</div>
				</div>
			</section>

			<section className="py-16 md:py-24 bg-gradient-to-b from-purple-50 to-purple-60">
				<div className="w-full">
					<h2 className="text-6xl md:text-6xl font-bold mb-4 text-black text-center">Transparent. Secure. Free</h2>
					<p className="text-base text-gray-700 mb-12 text-center max-w-2xl mx-auto">
						<span className="text-purple-600 font-semibold">Mezon Dong</span> is designed to make digital transactions simple and fair.
						It's the foundation for a new kind of community economy.
					</p>
					<div className="flex flex-col md:flex-row justify-between items-stretch">
						<div className="card-animate bg-[#181127] p-12 text-white text-center flex flex-col items-center border border-slate-700 w-full md:w-[32%] min-h-[320px]">
							<img src="/assets/free.png" alt="Zero Platform Fee" className="w-auto h-40 mb-6 drop-shadow-lg" />
							<div className="font-bold text-2xl mb-4">Zero Platform Fee</div>
							<div className="text-purple-100 text-lg leading-relaxed">
								Send & receive without hidden costs. Every transaction goes directly to where it matters.
							</div>
						</div>
						<div className="card-animate bg-[#181127] p-12 text-white text-center flex flex-col items-center border border-slate-700 w-full md:w-[32%] min-h-[320px]">
							<img src="/assets/bring.png" alt="Zero Platform Fee" className="w-auto h-40 mb-6 drop-shadow-lg" />
							<div className="font-bold text-2xl mb-4">Secure & Hassle Free</div>
							<div className="text-purple-100 text-lg leading-relaxed">
								With zero-knowledge tech, no more account hassles. Your privacy is protected.
							</div>
						</div>
						<div className="card-animate bg-[#181127] p-12 text-white text-center flex flex-col items-center border border-slate-700 w-full md:w-[32%] min-h-[320px]">
							<img src="/assets/fully.png" alt="Zero Platform Fee" className="w-auto h-40 mb-6 drop-shadow-lg" />
							<div className="font-bold text-2xl mb-4">Fully Transparent</div>
							<div className="text-purple-100 text-lg leading-relaxed">
								All transactions transparent on Mezon Layer-1 Blockchain. Complete visibility.
							</div>
						</div>
					</div>
				</div>
			</section>

			<section className="py-16 md:py-24 bg-white">
				<div className="max-w-3xl mx-auto px-4 text-center">
					<h2 className="text-6xl md:text-6xl font-bold mb-4 text-black">Instant, Fair, and Seamless</h2>
					<p className="text-base text-gray-700 mb-10 max-w-2xl mx-auto leading-relaxed">
						Send <span className="text-purple-600 font-semibold">Mezon Dong</span> as easily as sending a message. Tip friends, contribute
						to your community, or buy stuff — all instantly and without fees.
					</p>
					<button className="px-12 py-4 bg-gradient-to-r from-purple-600 to-purple-500 text-white  text-lg font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 shadow-md mb-12 rounded-md">
						Discover Mezon
					</button>
					<div className="flex justify-center">
						<div className="relative w-full max-w-lg">
							<img
								src="/assets/economy-cobar-vendor.png"
								alt="Mezon Dong Profile"
								className="relative w-full h-auto object-contain rounded-3xl"
								style={{
									filter: 'drop-shadow(0 0 30px rgba(147, 51, 234, 0.3))'
								}}
							/>
						</div>
					</div>
				</div>
			</section>

			<section className="py-16 md:py-24 bg-gradient-to-b from-purple-50 to-purple-60">
				<div className="w-full">
					<h2 className="text-6xl md:text-6xl font-bold mb-4 text-black text-center">
						Empower Your Workplace with{' '}
						<span className="bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent">Mezon Dong</span>
					</h2>
					<p className="text-base text-gray-700 mb-12 text-center max-w-2xl mx-auto leading-relaxed">
						<span className="text-purple-600 font-semibold">Mezon</span> isn't just for communities. Companies can use{' '}
						<span className="text-purple-600 font-semibold">Mezon</span> as an internal platform for communication and payments. Reward
						employees, manage bonuses, or create internal perks — all handled seamlessly with{' '}
						<span className="text-purple-600 font-semibold">Mezon Dong</span>.
					</p>
					<div className="flex flex-col md:flex-row justify-between items-stretch">
						<div className="card-animate bg-[#181127] p-12 text-white text-center flex flex-col items-center border border-slate-700 w-full md:w-[32%] min-h-[320px]">
							<img src="/assets/rewards.png" alt="Zero Platform Fee" className="w-auto h-40 mb-6 drop-shadow-lg" />
							<div className="font-bold text-2xl mb-4">Rewards & Incentives</div>
							<div className="text-purple-100 text-lg leading-relaxed">Give instant bonuses or recognition with Mezon Dong</div>
						</div>
						<div className="card-animate bg-[#181127] p-12 text-white text-center flex flex-col items-center border border-slate-700 w-full md:w-[32%] min-h-[320px]">
							<img src="/assets/internal.png" alt="Zero Platform Fee" className="w-auto h-40 mb-6 drop-shadow-lg" />
							<div className="font-bold text-2xl mb-4">Internal Marketplace</div>
							<div className="text-purple-100 text-lg leading-relaxed">Use Mezon Dong for food, drinks, or internal services</div>
						</div>
						<div className="card-animate bg-[#181127] p-12 text-white text-center flex flex-col items-center border border-slate-700 w-full md:w-[32%] min-h-[320px]">
							<img src="/assets/tip.png" alt="Zero Platform Fee" className="w-auto h-40 mb-6 drop-shadow-lg" />
							<div className="font-bold text-2xl mb-4">Peer-to-Peer Appreciation</div>
							<div className="text-purple-100 text-lg leading-relaxed">
								Tip a colleague for a favor, cover coffee, or split lunch — without the awkwardness
							</div>
						</div>
					</div>
				</div>
			</section>

			<section className="py-16 md:py-24 bg-white">
				<div className="max-w-3xl mx-auto px-4 text-center">
					<h2 className="text-6xl md:text-6xl font-bold mb-4 text-black">Commerce, Integrated</h2>
					<p className="text-base text-gray-700 mb-10 max-w-2xl mx-auto leading-relaxed">
						Partner brands can accept <span className="text-purple-600 font-semibold">Mezon Dong</span> for products and services. From
						digital goods to real-world items, communities can buy directly with a click.
					</p>
					<button className="px-12 py-4 bg-gradient-to-r from-purple-600 to-purple-500 text-white  text-lg font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 shadow-md mb-12 rounded-md">
						Become a Merchant
					</button>
					<div className="flex justify-center">
						<div className="relative w-full max-w-lg">
							<img
								src="/assets/economy-cobar-acheter.png"
								alt="Mezon Dong Profile"
								className="relative w-full h-auto object-contain rounded-3xl"
								style={{
									filter: 'drop-shadow(0 0 30px rgba(147, 51, 234, 0.3))'
								}}
							/>
						</div>
					</div>
				</div>
			</section>

			<section className="py-16 md:py-24 bg-gradient-to-b from-purple-50 to-purple-60">
				<div className="w-full">
					<h2 className="text-6xl md:text-6xl font-bold mb-4 text-black text-center">
						Grow Together with <span className="bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent">Mezon</span>
					</h2>
					<p className="text-base text-gray-700 mb-12 text-center max-w-2xl mx-auto leading-relaxed">
						<span className="text-purple-600 font-semibold">Mezon</span> isn't just a platform — it's an ecosystem. Partner with us to
						integrate <span className="text-purple-600 font-semibold">Mezon</span> into your own products and services, and shape the
						future of open communities and digital economy together.
					</p>
					<div className="flex flex-col md:flex-row justify-between items-stretch">
						<div className="card-animate bg-[#181127] p-12 text-white text-center flex flex-col items-center border border-slate-700 w-full md:w-[32%] min-h-[320px]">
							<img src="/assets/Integrate.png" alt="Zero Platform Fee" className="w-auto h-40 mb-6 drop-shadow-lg" />
							<div className="font-bold text-2xl mb-4">Integrate Mezon Dong</div>
							<div className="text-purple-100 text-lg leading-relaxed">Enable seamless payments inside your platform or app</div>
						</div>
						<div className="card-animate bg-[#181127] p-12 text-white text-center flex flex-col items-center border border-slate-700 w-full md:w-[32%] min-h-[320px]">
							<img src="/assets/creator.png" alt="Zero Platform Fee" className="w-auto h-40 mb-6 drop-shadow-lg" />
							<div className="font-bold text-2xl mb-4">Co-create Experiences</div>
							<div className="text-purple-100 text-lg leading-relaxed">Build joint solutions that connect communities and brands</div>
						</div>
						<div className="card-animate bg-[#181127] p-12 text-white text-center flex flex-col items-center border border-slate-700 w-full md:w-[32%] min-h-[320px]">
							<img src="/assets/scale.png" alt="Zero Platform Fee" className="w-auto h-40 mb-6 drop-shadow-lg" />
							<div className="font-bold text-2xl mb-4">Scale with Ecosystem</div>
							<div className="text-purple-100 text-lg leading-relaxed">Tap into Mezon's growing network of users and developers</div>
						</div>
					</div>
				</div>
				<div className="flex justify-center w-full">
					<button
						onClick={() => setIsContactModalOpen(true)}
						className="px-12 py-4 mt-4 bg-gradient-to-r from-purple-600 to-purple-500 text-white text-lg font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 shadow-md mb-12 rounded-md"
					>
						Contact Us
					</button>
				</div>
			</section>

			<section className="py-16 md:py-24 relative overflow-hidden bg-white">
				<div className="max-w-2xl mx-auto px-4 text-center relative z-10">
					<h2 className="text-6xl md:text-6xl font-bold mb-10 text-stone-800 leading-tight">
						Ready to experience a fair digital <span className="text-purple-600">economy</span>?
					</h2>
					<div className="flex flex-col sm:flex-row justify-center gap-4 flex-wrap">
						<a href="https://mezon.ai/docs/en/user/mezon-dong" target="_blank" rel="noopener noreferrer">
							<button className="px-12 py-4 border-2 border-purple-600 text-purple-600 text-lg font-semibold hover:bg-purple-600 hover:text-white transition-all duration-300 hover:shadow- rounded-md">
								Learn more in Docs
							</button>
						</a>

						<button className="px-12 py-4 border-2 border-purple-600 text-purple-600 text-lg font-semibold hover:bg-purple-600 hover:text-white transition-all duration-300 hover:shadow-lg rounded-md">
							Join as a Partner
						</button>
						<div className="relative" ref={dropdownRef}>
							<button
								onClick={handleDownloadMezon}
								className="px-12 py-4 border-2 border-purple-600 text-purple-600 text-lg font-semibold hover:bg-purple-600 hover:text-white transition-all duration-300 hover:shadow-lg rounded-md"
							>
								Download Mezon
							</button>
							{isDropdownOpen && platform !== Platform.IOS && platform !== Platform.ANDROID && (
								<div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[200px]">
									<a
										href={`${process.env.NX_BASE_IMG_URL}/release/mezon-${version}-win-x64.exe`}
										className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100"
										onClick={() => setIsDropdownOpen(false)}
									>
										<svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
											<path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801" />
										</svg>
										<span className="text-gray-700 font-medium">Windows</span>
									</a>
									<a
										href={`${process.env.NX_BASE_IMG_URL}/release/mezon-${version}-mac-arm64.dmg`}
										className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100"
										onClick={() => setIsDropdownOpen(false)}
									>
										<svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
											<path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.09997 22C7.78997 22.05 6.79997 20.68 5.95997 19.47C4.24997 17 2.93997 12.45 4.69997 9.39C5.56997 7.87 7.12997 6.91 8.81997 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z" />
										</svg>
										<span className="text-gray-700 font-medium">macOS</span>
									</a>
									<a
										href={`${process.env.NX_BASE_IMG_URL}/release/mezon-${version}-linux-amd64.deb`}
										className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100"
										onClick={() => setIsDropdownOpen(false)}
									>
										<svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
											<path d="M20.581 19.049c-.55-.446-.336-1.431-.907-1.917.553-3.365-.997-6.331-2.845-8.232-1.551-1.595-1.051-3.147-1.051-4.49 0-2.146-.881-4.41-3.55-4.41-2.853 0-3.635 2.38-3.663 3.738-.068 3.262.659 4.11-1.25 6.484-2.246 2.793-2.577 5.579-2.07 7.057-.237.276-.557.582-1.155.835-1.652.72-.441 1.925-.898 2.78-.13.243-.192.497-.192.74 0 .75.596 1.399 1.679 1.302 1.461-.13 2.809.905 3.681.905.77 0 1.402-.438 1.696-1.041 1.377-.339 3.077-.296 4.453.059.247.691.917 1.141 1.662 1.141 1.631 0 1.945-1.849 3.816-2.475.674-.225 1.013-.879 1.013-1.488 0-.39-.139-.761-.419-.988zM8.426 4.821c.052-.773.202-1.432.493-1.989.804-1.532 2.493-1.936 3.086-1.936 1.301 0 2.303.789 2.303 1.936 0 1.169-.324 2.004-.535 2.578-.203.554-.38 1.004-.38 1.498 0 .663.296 1.165.444 1.495.18.403.304.688.304 1.031 0 .999-1.134 1.68-1.969 1.68-1.317 0-1.903-.094-2.468-.094-.464 0-.833.067-1.171.133-.438.086-.86.17-1.382.17-1.305 0-1.969-.75-1.969-1.618 0-.384.157-.75.346-1.151.151-.32.323-.684.323-1.11 0-.483-.188-.915-.396-1.367-.221-.479-.47-1.015-.47-1.619 0-.528.048-1.108.461-1.647zm7.582 10.483c-.033.179-.057.367-.073.562.002-.193.024-.381.073-.562zM8.128 15.178l-.017.009zm7.743-.001l-.017-.009zm-7.743.001c-.191.096-.381.202-.574.318.194-.116.384-.223.574-.318zm7.743-.001c.191.095.381.202.574.318-.193-.116-.383-.223-.574-.318zM15.867 14.47l-.007-.011z" />
										</svg>
										<span className="text-gray-700 font-medium">Linux</span>
									</a>
									<a
										href="https://apps.apple.com/vn/app/mezon/id6502750046"
										target="_blank"
										rel="noopener noreferrer"
										className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100"
										onClick={() => setIsDropdownOpen(false)}
									>
										<svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
											<path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.09997 22C7.78997 22.05 6.79997 20.68 5.95997 19.47C4.24997 17 2.93997 12.45 4.69997 9.39C5.56997 7.87 7.12997 6.91 8.81997 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z" />
										</svg>
										<span className="text-gray-700 font-medium">iOS (Mobile)</span>
									</a>
									<a
										href="https://play.google.com/store/apps/details?id=com.mezon.mobile"
										target="_blank"
										rel="noopener noreferrer"
										className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
										onClick={() => setIsDropdownOpen(false)}
									>
										<svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
											<path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
										</svg>
										<span className="text-gray-700 font-medium">Android (Mobile)</span>
									</a>
								</div>
							)}
						</div>
					</div>
				</div>
			</section>

			<Footer downloadUrl={downloadUrl} universalUrl={universalUrl} portableUrl={portableUrl} />
			<ContactUsModal isOpen={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} />
		</div>
	);
};

export default EconomyPage;
