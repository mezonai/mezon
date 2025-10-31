import mezonPackage from '@mezon/package-js';
import { getPlatform, Platform } from '@mezon/utils';
import { useEffect, useMemo, useRef, useState } from 'react';
import Footer from '../homepage/mezonpage/footer';
import HeaderMezon from '../homepage/mezonpage/header';

const AboutMezon = () => {
	const platform = getPlatform();
	const version = mezonPackage.version;
	const [isDesktopDropdownOpen, setIsDesktopDropdownOpen] = useState(false);
	const [isMobileDropdownOpen, setIsMobileDropdownOpen] = useState(false);
	const desktopDropdownRef = useRef<HTMLDivElement>(null);
	const mobileDropdownRef = useRef<HTMLDivElement>(null);
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

	const handleDownloadDesktop = () => {
		if (platform === Platform.IOS) {
			window.open('https://apps.apple.com/vn/app/mezon/id6502750046', '_blank');
		} else if (platform === Platform.ANDROID) {
			window.open('https://play.google.com/store/apps/details?id=com.mezon.mobile', '_blank');
		} else {
			setIsDesktopDropdownOpen(!isDesktopDropdownOpen);
		}
	};

	const handleDownloadMobile = () => {
		if (platform === Platform.IOS) {
			window.open('https://apps.apple.com/vn/app/mezon/id6502750046', '_blank');
		} else if (platform === Platform.ANDROID) {
			window.open('https://play.google.com/store/apps/details?id=com.mezon.mobile', '_blank');
		} else {
			setIsMobileDropdownOpen(!isMobileDropdownOpen);
		}
	};

	useEffect(() => {
		window.scrollTo(0, 0);
	}, []);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (desktopDropdownRef.current && !desktopDropdownRef.current.contains(event.target as Node)) {
				setIsDesktopDropdownOpen(false);
			}
			if (mobileDropdownRef.current && !mobileDropdownRef.current.contains(event.target as Node)) {
				setIsMobileDropdownOpen(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
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
			<section className="py-[80px] px-[32px] max-md:px-[16px]">
				<div className="max-w-[1200px] mx-auto text-center">
					<h1 className="text-6xl max-md:text-[36px] font-bold mb-[32px]">
						<span className="text-black">What is</span> <span className="text-[#7E00FF]">Mezon</span>
						<span className="text-black">?</span>
					</h1>
					<div className="text-[24px] max-md:text-[18px] leading-[36px] max-md:leading-[28px] text-black space-y-[16px]">
						<p>
							Mezon is the super app that unites <span className="text-[#7E00FF] font-semibold">communication</span>,{' '}
							<span className="text-[#7E00FF] font-semibold">collaboration</span>.
						</p>
						<p>
							and <span className="text-[#7E00FF] font-semibold">fun - free, safe</span>, and for everyone.
						</p>
						<p>No juggling apps. No friction. Just one place to live, work, and play.</p>
					</div>
				</div>
			</section>

			<section
				className="py-[120px] px-[32px] max-md:px-[16px] relative"
				style={{
					backgroundImage: 'url(../../../assets/office.png)',
					backgroundSize: 'cover',
					backgroundPosition: 'center',
					backgroundRepeat: 'no-repeat'
				}}
			>
				<div className="absolute inset-0 bg-black/50"></div>
				<div className="relative z-10 max-w-[1200px] mx-auto text-center">
					<h2 className="text-[56px] max-md:text-[36px] font-bold text-white mb-[32px]">Our Purpose</h2>
					<p className="text-[24px] max-md:text-[18px] leading-[36px] max-md:leading-[28px] text-white mb-[48px] max-w-[800px] mx-auto">
						At Mezon, we use technology to continually optimize and redefine how people live, work, and connect - shaping a more open,
						connected society.
					</p>
					<div className="flex gap-[24px] max-md:flex-col max-md:items-center justify-center items-center">
						<div className="relative" ref={desktopDropdownRef}>
							<button
								onClick={handleDownloadDesktop}
								className="bg-gradient-to-r from-[#7E00FF] to-[#4B0082] text-white px-[32px] py-[16px] rounded-[12px] text-[20px] font-semibold hover:opacity-90 transition-opacity"
							>
								Download For Desktop
							</button>
							{isDesktopDropdownOpen && platform !== Platform.IOS && platform !== Platform.ANDROID && (
								<div className="absolute top-full mt-2 left-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[200px]">
									<a
										href={`${process.env.NX_BASE_IMG_URL}/release/mezon-${version}-win-x64.exe`}
										className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100"
										onClick={() => setIsDesktopDropdownOpen(false)}
									>
										<svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
											<path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801" />
										</svg>
										<span className="text-gray-700 font-medium">Windows</span>
									</a>
									<a
										href={`${process.env.NX_BASE_IMG_URL}/release/mezon-${version}-mac-arm64.dmg`}
										className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100"
										onClick={() => setIsDesktopDropdownOpen(false)}
									>
										<svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
											<path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.09997 22C7.78997 22.05 6.79997 20.68 5.95997 19.47C4.24997 17 2.93997 12.45 4.69997 9.39C5.56997 7.87 7.12997 6.91 8.81997 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z" />
										</svg>
										<span className="text-gray-700 font-medium">macOS</span>
									</a>
									<a
										href={`${process.env.NX_BASE_IMG_URL}/release/mezon-${version}-linux-amd64.deb`}
										className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
										onClick={() => setIsDesktopDropdownOpen(false)}
									>
										<svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
											<path d="M20.581 19.049c-.55-.446-.336-1.431-.907-1.917.553-3.365-.997-6.331-2.845-8.232-1.551-1.595-1.051-3.147-1.051-4.49 0-2.146-.881-4.41-3.55-4.41-2.853 0-3.635 2.38-3.663 3.738-.068 3.262.659 4.11-1.25 6.484-2.246 2.793-2.577 5.579-2.07 7.057-.237.276-.557.582-1.155.835-1.652.72-.441 1.925-.898 2.78-.13.243-.192.497-.192.74 0 .75.596 1.399 1.679 1.302 1.461-.13 2.809.905 3.681.905.77 0 1.402-.438 1.696-1.041 1.377-.339 3.077-.296 4.453.059.247.691.917 1.141 1.662 1.141 1.631 0 1.945-1.849 3.816-2.475.674-.225 1.013-.879 1.013-1.488 0-.39-.139-.761-.419-.988zM8.426 4.821c.052-.773.202-1.432.493-1.989.804-1.532 2.493-1.936 3.086-1.936 1.301 0 2.303.789 2.303 1.936 0 1.169-.324 2.004-.535 2.578-.203.554-.38 1.004-.38 1.498 0 .663.296 1.165.444 1.495.18.403.304.688.304 1.031 0 .999-1.134 1.68-1.969 1.68-1.317 0-1.903-.094-2.468-.094-.464 0-.833.067-1.171.133-.438.086-.86.17-1.382.17-1.305 0-1.969-.75-1.969-1.618 0-.384.157-.75.346-1.151.151-.32.323-.684.323-1.11 0-.483-.188-.915-.396-1.367-.221-.479-.47-1.015-.47-1.619 0-.528.048-1.108.461-1.647zm7.582 10.483c-.033.179-.057.367-.073.562.002-.193.024-.381.073-.562zM8.128 15.178l-.017.009zm7.743-.001l-.017-.009zm-7.743.001c-.191.096-.381.202-.574.318.194-.116.384-.223.574-.318zm7.743-.001c.191.095.381.202.574.318-.193-.116-.383-.223-.574-.318zM15.867 14.47l-.007-.011z" />
										</svg>
										<span className="text-gray-700 font-medium">Linux</span>
									</a>
								</div>
							)}
						</div>
						<div className="relative" ref={mobileDropdownRef}>
							<button
								onClick={handleDownloadMobile}
								className="bg-gradient-to-r from-[#7E00FF] to-[#9C3FE9] text-white px-[32px] py-[16px] rounded-[12px] text-[20px] font-semibold hover:opacity-90 transition-opacity"
							>
								Get It On Mobile
							</button>
							{isMobileDropdownOpen && platform !== Platform.IOS && platform !== Platform.ANDROID && (
								<div className="absolute top-full mt-2 left-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[200px]">
									<a
										href="https://apps.apple.com/vn/app/mezon/id6502750046"
										target="_blank"
										rel="noopener noreferrer"
										className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100"
										onClick={() => setIsMobileDropdownOpen(false)}
									>
										<svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
											<path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.09997 22C7.78997 22.05 6.79997 20.68 5.95997 19.47C4.24997 17 2.93997 12.45 4.69997 9.39C5.56997 7.87 7.12997 6.91 8.81997 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z" />
										</svg>
										<span className="text-gray-700 font-medium">iOS (App Store)</span>
									</a>
									<a
										href="https://play.google.com/store/apps/details?id=com.mezon.mobile"
										target="_blank"
										rel="noopener noreferrer"
										className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
										onClick={() => setIsMobileDropdownOpen(false)}
									>
										<svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
											<path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
										</svg>
										<span className="text-gray-700 font-medium">Android (Play Store)</span>
									</a>
								</div>
							)}
						</div>
					</div>
				</div>
			</section>

			<section className="py-[80px] px-[32px] max-md:px-[16px]">
				<div className="max-w-[1200px] mx-auto">
					<h2 className="text-[56px] max-md:text-[36px] font-bold text-black text-center mb-[64px]">Our Core Values</h2>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-[32px]">
						<div className="group bg-white p-[32px] rounded-[16px] shadow-lg border border-gray-100 hover:bg-[#26155f] hover:-translate-y-2 cursor-pointer transition-all duration-300">
							<div className="flex justify-center mb-[24px] ">
								<img src="/assets/free-chat.png" alt="" className="h-auto w-[177px]" />
							</div>
							<h3 className="text-[28px] font-bold text-black group-hover:text-white text-center mb-[16px]">Always Free</h3>
							<p className="text-[18px] leading-[28px] text-gray-600 group-hover:text-white text-center">
								We believe conversations, connections, and creations should always stay free and open — empowering communities to grow
								together.
							</p>
						</div>

						<div className="group bg-white p-[32px] rounded-[16px] shadow-lg border border-gray-100 hover:bg-[#26155f] hover:-translate-y-2 cursor-pointer transition-all duration-300">
							<div className="flex justify-center mb-[24px]">
								<img src="/assets/safe.png" alt="" className="h-auto w-[141px]" />
							</div>
							<h3 className="text-[28px] font-bold text-black group-hover:text-white text-center mb-[16px]">Safe & Transparent</h3>
							<p className="text-[18px] leading-[28px] text-gray-600 group-hover:text-white text-center">
								We put safety and clarity first. You own your data, your rules, your community — so every interaction feels secure and
								trustworthy.
							</p>
						</div>

						<div className="group bg-white p-[32px] rounded-[16px] shadow-lg border border-gray-100 hover:bg-[#26155f] hover:-translate-y-2 cursor-pointer transition-all duration-300">
							<div className="flex justify-center mb-[24px] ">
								<img src="/assets/Powered-Creativity.png" alt="" className="h-auto w-[85px]" />
							</div>
							<h3 className="text-[28px] font-bold text-black group-hover:text-white text-center mb-[16px]">Powered by Creativity</h3>
							<p className="text-[18px] leading-[28px] text-gray-600 group-hover:text-white text-center">
								We celebrate expression and Innovation — from chats to clans, from creations to projects. Mezon gives you the tools to
								bring your ideas to life.
							</p>
						</div>
					</div>
				</div>
			</section>

			<section className="py-[80px] px-[32px] max-md:px-[16px] bg-gray-50">
				<div className="max-w-[1200px] mx-auto text-center">
					<blockquote className="text-[28px] max-md:text-[24px] leading-[40px] max-md:leading-[34px] text-black mb-[16px] italic font-medium">
						"At Mezon, we believe connection is the heart of growth. Creating a space where people can learn, work, and chill together is
						the experience we always strive to bring."
					</blockquote>
					<p className="text-[18px] text-gray-600 font-semibold">Voices of Mezon's team</p>
				</div>
			</section>

			<section className="py-[80px] px-[32px] max-md:px-[16px]">
				<div className="max-w-[1200px] mx-auto text-center">
					<h2 className="text-6xl max-md:text-[36px] font-bold mb-[32px]">
						Always <span className="bg-gradient-to-r from-[#7E00FF] to-[#9C3FE9] bg-clip-text text-transparent">here</span> for you
					</h2>
					<p className="text-[24px] max-md:text-[18px] leading-[36px] max-md:leading-[28px] text-gray-600 mb-[48px] max-w-[800px] mx-auto">
						At Mezon, you're never on your own. Whether you're learning, working, or just chilling with friends - our support team (and
						community) is right by your side.
					</p>
					<button className="bg-gradient-to-r from-[#7E00FF] to-[#9C3FE9] text-white px-[32px] py-[16px] rounded-[12px] text-[20px] font-semibold hover:opacity-90 transition-opacity mb-[64px]">
						Reach Us Anytime!
					</button>

					<div className="grid grid-cols-1 md:grid-cols-4 gap-[32px]">
						<div className="text-center">
							<h3 className="text-[28px] font-bold text-black mb-[8px]">24h/7 Support</h3>
							<p className="text-[18px] text-gray-600">We've got your back, day or night</p>
						</div>
						<div className="text-center">
							<h3 className="text-[28px] font-bold text-black mb-[8px]">&lt;1h Response</h3>
							<p className="text-[18px] text-gray-600">Quick answers, no waiting around</p>
						</div>
						<div className="text-center">
							<h3 className="text-[28px] font-bold text-black mb-[8px]">95% Satisfaction</h3>
							<p className="text-[18px] text-gray-600">Loved by our community and users</p>
						</div>
						<div className="text-center">
							<h3 className="text-[28px] font-bold text-black mb-[8px]">100% Human Touch</h3>
							<p className="text-[18px] text-gray-600">Real people, real care support you</p>
						</div>
					</div>
				</div>
			</section>

			<section className="py-[80px] px-[32px] max-md:px-[16px] bg-gray-50">
				<div className="max-w-[1200px] mx-auto text-center">
					<h2 className="text-6xl max-md:text-[36px] font-bold mb-[32px]">
						Ready to make every{' '}
						<span className="bg-gradient-to-r from-[#7E00FF] to-[#9C3FE9] bg-clip-text text-transparent">chat count</span> ?
					</h2>
					<button className="bg-gradient-to-r from-[#7E00FF] to-[#9C3FE9] text-white px-[32px] py-[16px] rounded-[12px] text-[20px] font-semibold hover:opacity-90 transition-opacity">
						Create your FREE Mezon account
					</button>
				</div>
			</section>
			<Footer downloadUrl={downloadUrl} universalUrl={universalUrl} portableUrl={portableUrl} />
		</div>
	);
};

export default AboutMezon;
