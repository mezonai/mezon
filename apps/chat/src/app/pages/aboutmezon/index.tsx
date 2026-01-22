import mezonPackage from '@mezon/package-js';
import { Button, Icons } from '@mezon/ui';
import { Platform, getPlatform } from '@mezon/utils';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import Footer from '../homepage/mezonpage/footer';
import HeaderMezon from '../homepage/mezonpage/header';

type AnimatedSectionProps = {
	className?: string;
	children: ReactNode;
};

const AnimatedSection = ({ className = '', children }: AnimatedSectionProps) => {
	const ref = useRef<HTMLElement | null>(null);
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		const element = ref.current;
		if (!element) return;

		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						setIsVisible(true);
						observer.unobserve(entry.target);
					}
				});
			},
			{
				threshold: 0.15
			}
		);

		observer.observe(element);

		return () => {
			observer.disconnect();
		};
	}, []);

	return (
		<section
			ref={ref as React.RefObject<HTMLElement>}
			className={`transition-all duration-700 ease-out transform opacity-0 translate-y-6 ${
				isVisible ? 'opacity-100 translate-y-0' : ''
			} ${className}`}
		>
			{children}
		</section>
	);
};

const AboutMezon = () => {
	const platform = getPlatform();
	const version = mezonPackage.version;
	const [isDesktopDropdownOpen, setIsDesktopDropdownOpen] = useState(false);
	const [isMobileDropdownOpen, setIsMobileDropdownOpen] = useState(false);
	const [openAboutUs, setOpenAboutUs] = useState(false);
	const desktopDropdownRef = useRef<HTMLDivElement>(null);
	const mobileDropdownRef = useRef<HTMLDivElement>(null);
	const downloadUrl: string = useMemo(() => {
		if (platform === Platform.MACOS) {
			return 'https://apps.apple.com/vn/app/mezon-desktop/id6756601798?mt=12';
		} else if (platform === Platform.LINUX) {
			return `${process.env.NX_BASE_IMG_URL}/release/mezon-${version}-linux-amd64.deb`;
		}
		return `${process.env.NX_BASE_IMG_URL}/release/mezon-${version}-win-x64.exe`;
	}, [platform, version]);
	const trackHeaderLoginClick = (action: string) => {
		if (typeof window !== 'undefined' && typeof (window as any).gtag !== 'undefined') {
			(window as any).gtag('event', 'Login Button', {
				event_category: 'Login Button',
				event_label: action,
				custom_parameter_1: 'mezon_header_login'
			});
		}
	};
	const universalUrl = 'https://apps.apple.com/vn/app/mezon-desktop/id6756601798?mt=12';
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
	const handleOpenAboutUs = () => {
		setOpenAboutUs(true);
	};
	const handleCloseAboutUs = () => {
		setOpenAboutUs(false);
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
			<AnimatedSection className="py-[90px] px-[32px] max-md:px-[16px] bg-white pt-[120px]">
				<div className="max-w-[1000px] mx-auto flex flex-col gap-[32px] text-left">
					<div className="space-y-[16px]">
						<h1 className="text-[64px] max-lg:text-[48px] max-md:text-[36px] font-svnAvo text-black select-text">
							What is <span className="text-[#7E00FF]">Mezon</span> ?
						</h1>
						<p className="text-[22px] max-md:text-[18px] leading-[34px] text-gray-800 font-svnAvo py-3 select-text">
							Mezon is the super app that unites <span className="text-[#7E00FF] font-svnAvo">communication</span>,{' '}
							<span className="text-[#7E00FF] font-svnAvo">collaboration</span>, and fun — free, safe, and for everyone. No juggling
							apps. No friction. Just one place to live, work, and play.
						</p>
					</div>
					<div className="flex flex-wrap gap-[16px]">
						<div className="relative" ref={desktopDropdownRef}>
							<button
								onClick={handleDownloadDesktop}
								className="bg-gradient-to-r from-[#8661df] to-[#7979ed] hover:bg-gradient-to-l text-white px-[32px] py-[16px] rounded-full text-[18px] font-svnAvo hover:opacity-90 transition-opacity"
							>
								Download Mezon
							</button>
							{isDesktopDropdownOpen && platform !== Platform.IOS && platform !== Platform.ANDROID && (
								<div className="absolute top-full mt-3 left-0 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 min-w-[220px] overflow-hidden">
									<a
										href="https://apps.microsoft.com/detail/9pf25lf1fj17"
										target="_blank"
										rel="noopener noreferrer"
										className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 text-purple-600 hover:text-pink-600"
										onClick={() => setIsDesktopDropdownOpen(false)}
									>
										<Icons.Windows className="w-5 h-5" />
										<span className="text-gray-700 font-svnAvo">Windows</span>
									</a>
									<a
										href={'https://apps.apple.com/vn/app/mezon-desktop/id6756601798?mt=12'}
										target="_blank"
										rel="noopener noreferrer"
										className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 text-purple-600 hover:text-pink-600"
										onClick={() => setIsDesktopDropdownOpen(false)}
									>
										<Icons.Apple className="w-5 h-5" />
										<span className="text-gray-700 font-svnAvo">macOS (Apple)</span>
									</a>
									<a
										href={'https://apps.apple.com/vn/app/mezon-desktop/id6756601798?mt=12'}
										target="_blank"
										rel="noopener noreferrer"
										className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 text-purple-600 hover:text-pink-600"
										onClick={() => setIsDesktopDropdownOpen(false)}
									>
										<Icons.Apple className="w-5 h-5" />
										<span className="text-gray-700 font-svnAvo">macOS (Intel)</span>
									</a>
									<a
										href={`${process.env.NX_BASE_IMG_URL}/release/mezon-${version}-linux-amd64.deb`}
										target="_blank"
										rel="noopener noreferrer"
										className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors text-purple-600 hover:text-pink-600"
										onClick={() => setIsDesktopDropdownOpen(false)}
									>
										<Icons.Linux className="w-5 h-5" />
										<span className="text-gray-700 font-svnAvo">Linux</span>
									</a>
								</div>
							)}
						</div>
						<div className="relative" ref={mobileDropdownRef}>
							<button
								onClick={handleDownloadMobile}
								className="px-[32px] py-[16px] rounded-full border border-[#7E00FF] text-[#7E00FF] text-[18px] font-svnAvo hover:bg-white"
							>
								Get Mobile App
							</button>
							{isMobileDropdownOpen && platform !== Platform.IOS && platform !== Platform.ANDROID && (
								<div className="absolute top-full mt-3 left-0 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 min-w-[240px] overflow-hidden">
									<a
										href="https://apps.apple.com/vn/app/mezon/id6502750046"
										target="_blank"
										rel="noopener noreferrer"
										className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 text-purple-600 hover:text-pink-600"
										onClick={() => setIsMobileDropdownOpen(false)}
									>
										<Icons.Apple className="w-5 h-5" />
										<span className="text-gray-700 font-svnAvo">iOS (App Store)</span>
									</a>
									<a
										href="https://play.google.com/store/apps/details?id=com.mezon.mobile"
										target="_blank"
										rel="noopener noreferrer"
										className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors text-purple-600 hover:text-pink-600"
										onClick={() => setIsMobileDropdownOpen(false)}
									>
										<svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
											<path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
										</svg>
										<span className="text-gray-700 font-svnAvo">Android (Play Store)</span>
									</a>
								</div>
							)}
						</div>
					</div>
					<div className="w-full">
						<img
							src="https://cdn.mezon.ai/landing-page-mezon/about-1.webp"
							alt="Mezon interface preview"
							className="w-full rounded-[32px] "
							loading="lazy"
						/>
					</div>
				</div>
			</AnimatedSection>

			<AnimatedSection className="py-[90px] px-[32px] max-md:px-[16px] bg-[#F2F4FF]">
				<div className="max-w-[1000px] mx-auto flex flex-col gap-[32px] text-left">
					<div className="space-y-[16px]">
						<h2 className="text-[56px] max-md:text-[40px] font-svnAvo text-black select-text">Our Mission</h2>
						<p className="text-[22px] max-md:text-[18px] leading-[34px] text-gray-800 font-svnAvo py-3 select-text">
							At Mezon, we use technology to continually optimize and redefine how people live, work, and connect — shaping a more open,
							connected society.
						</p>
					</div>
					<div className="w-full flex justify-start">
						<img
							src="https://cdn.mezon.ai/landing-page-mezon/about-2.webp"
							alt="Mezon team collaborating"
							className="w-full rounded-[32px] shadow-2xl"
							loading="lazy"
						/>
					</div>
				</div>
			</AnimatedSection>

			<AnimatedSection className="py-[80px] px-[32px] max-md:px-[16px]">
				<div className="max-w-[1000px] mx-auto text-left mb-[40px]">
					<h2 className="text-[56px] max-md:text-[36px] font-svnAvo text-black select-text">Our Core Values</h2>
					<p className="text-[22px] max-md:text-[18px] leading-[34px] text-gray-800 font-svnAvo py-3 select-text">
						At Mezon, we believe connection is the heart of growth. Creating a space where people can learn, work, and chill together is
						the experience we always strive to bring.
					</p>
					<p className="text-[20px] text-gray-900 mt-[16px] font-svnAvo">Voices of Mezon's Team</p>
				</div>
				<div className="max-w-[1000px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-[24px]">
					{[
						{
							title: 'Always Free',
							description:
								'We believe conversations, connections, and creations should always stay free and open — empowering communities to grow together.',
							image: 'https://cdn.mezon.ai/landing-page-mezon/aboutmenu-1.webp'
						},
						{
							title: 'Safe & Transparent',
							description:
								'You own your data, your rules, your community — so every interaction feels secure and trustworthy inside Mezon.',
							image: 'https://cdn.mezon.ai/landing-page-mezon/aboutmenu-2.webp'
						},
						{
							title: 'Powered by Creativity',
							description:
								'We celebrate expression and innovation — from chats to creations. Mezon gives you the tools to bring your ideas to life.',
							image: 'https://cdn.mezon.ai/landing-page-mezon/aboutmenu-3.webp'
						}
					].map((value) => (
						<div
							key={value.title}
							className="group bg-white rounded-[24px] shadow-xl border border-gray-100 hover:-translate-y-2 hover:shadow-2xl cursor-pointer transition-all duration-300 text-left overflow-hidden flex flex-col"
						>
							<div className="w-full h-[220px] md:h-[240px] lg:h-[260px]">
								<img src={value.image} alt={value.title} className="w-full h-full object-cover" loading="lazy" />
							</div>
							<div className="px-[24px] py-[28px] flex-1 flex flex-col">
								<h3 className="text-[28px] font-svnAvo text-black mb-[16px] select-text">{value.title}</h3>
								<p className="text-[18px] leading-[28px] text-gray-600 font-svnAvo select-text">{value.description}</p>
							</div>
						</div>
					))}
				</div>
			</AnimatedSection>

			<AnimatedSection className="py-[80px] px-[32px] max-md:px-[16px] bg-[#F3F5FF]">
				<div className="max-w-[1000px] mx-auto text-left">
					<h2 className="text-6xl max-md:text-[36px] font-svnAvo mb-[32px] select-text">
						<span className="bg-gradient-to-r from-[#7E00FF] to-[#9C3FE9] bg-clip-text text-transparent">Always</span> here for you
					</h2>
					<p className="text-[22px] max-md:text-[18px] leading-[34px] text-gray-800 font-svnAvo py-3 select-text">
						Whether you're learning, working, or just chilling with friends, our support team and community are right by your side.
					</p>
					<button
						className="bg-gradient-to-r from-[#8661df] to-[#7979ed] hover:bg-gradient-to-l text-white px-[40px] py-[16px] rounded-full text-[20px] font-svnAvo hover:opacity-90 transition-opacity mb-[48px]"
						onClick={handleOpenAboutUs}
					>
						Reach Us Anytime
					</button>

					<div className="grid grid-cols-1 md:grid-cols-4 gap-[24px]">
						{[
							{ title: '24/7 Support', desc: "We've got your back, day or night" },
							{ title: '<1h Response', desc: 'Quick answers, no waiting around' },
							{ title: '95% Satisfaction', desc: 'Loved by our community and users' },
							{ title: '100% Human Touch', desc: 'Real people, real care support you' }
						].map((stat) => (
							<div key={stat.title} className="bg-white rounded-[20px] py-[32px] px-[24px] shadow-lg text-left">
								<h3 className="lg:text-[20px] text-[16px] max-md:text-[16px]  font-svnAvo text-black mb-[8px]">{stat.title}</h3>
								<p className="lg:text-[16px] text-[14px] max-md:text-[14px] text-gray-600 font-svnAvo">{stat.desc}</p>
							</div>
						))}
					</div>
				</div>
			</AnimatedSection>

			<AnimatedSection className="py-[80px] px-[32px] max-md:px-[16px] bg-white">
				<div className="max-w-[1000px] mx-auto text-left">
					<h2 className="text-6xl max-md:text-[38px] font-svnAvo mb-[24px] select-text">
						Ready to make every{' '}
						<span className="bg-gradient-to-r from-[#7E00FF] to-[#9C3FE9] bg-clip-text text-transparent">chat count</span>?
					</h2>
					<Button
						className="bg-gradient-to-r from-[#8661df] to-[#7979ed] hover:bg-gradient-to-l text-white px-[40px] py-[18px] rounded-full text-[20px] font-svnAvo hover:opacity-90 transition-opacity inline-flex items-center justify-center"
						onClick={handleOpenAboutUs}
					>
						Reach Us Anytime
					</Button>
				</div>
			</AnimatedSection>
			<Footer downloadUrl={downloadUrl} universalUrl={universalUrl} portableUrl={portableUrl} />
		</div>
	);
};

export default AboutMezon;
