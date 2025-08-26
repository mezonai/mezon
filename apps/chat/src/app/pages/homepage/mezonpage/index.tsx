import { CustomCookieConsent } from '@mezon/components';
import mezonPackage from '@mezon/package-js';
import { Icons, Image } from '@mezon/ui';
import { Platform, generateE2eId, getPlatform } from '@mezon/utils';
import isElectron from 'is-electron';
import { useEffect, useMemo, useRef, useState } from 'react';
import Footer from './footer';
import HeaderMezon from './header';
import Layout, { useIntersectionObserver } from './layouts';
import { SideBarMezon } from './sidebar';

function MezonPage() {
	const platform = getPlatform();
	const isWindow = platform === Platform.WINDOWS;
	const [sideBarIsOpen, setSideBarIsOpen] = useState(false);
	const [backgroundImage, setBackgroundImage] = useState('');

	const homeRef = useRef<HTMLDivElement>(null);
	const isVisible = useIntersectionObserver(homeRef, { threshold: 0.1 });

	const dropdownRef = useRef<HTMLDivElement>(null);

	const toggleSideBar = () => {
		setSideBarIsOpen(!sideBarIsOpen);
	};

	const version = mezonPackage.version;

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

	const updateBackgroundImage = () => {
		if (window.innerWidth < 768) {
			setBackgroundImage('url(../../../assets/hero-header-bg-mobile.png)');
		} else {
			setBackgroundImage('url(../../../assets/hero-header-bg-desktop.png)');
		}
	};

	const backgroundImageStyle = {
		backgroundImage: backgroundImage,
		backgroundRepeat: 'no-repeat',
		backgroundPosition: 'center top'
	};
	const scrollToSection = (id: string, event: React.MouseEvent) => {
		event.preventDefault();

		const section = document.getElementById(id);
		if (!section) return;

		const offset = window.innerWidth <= 768 ? 72 : 80;
		const sectionTop = section.getBoundingClientRect().top + window.scrollY - offset;

		setSideBarIsOpen(false);

		window.scrollTo({
			behavior: 'smooth',
			top: sectionTop
		});
	};

	const HighLightText = ({ content }: { content: string }) => {
		return <span className="text-[#8D5BDF] font-bold  ">{content}</span>;
	};

	const trackDownloadEvent = (platform: string, downloadType: string) => {
		if (typeof window !== 'undefined' && typeof (window as any).gtag !== 'undefined') {
			(window as any).gtag('event', 'download_click', {
				event_category: 'Downloads',
				event_label: platform,
				download_type: downloadType,
				app_version: version,
				custom_parameter_1: 'mezon_homepage'
			});
		}
	};

	useEffect(() => {
		const externalScript = document.createElement('script');
		externalScript.async = true;
		externalScript.src = 'https://www.googletagmanager.com/gtag/js?id=G-9SD8R7Z8TJ';
		document.body.appendChild(externalScript);

		const inlineScript = document.createElement('script');
		inlineScript.innerHTML = `
			window.dataLayer = window.dataLayer || [];
			function gtag(){dataLayer.push(arguments);}
			gtag('js', new Date());
			gtag('config', 'G-9SD8R7Z8TJ');
		`;
		document.body.appendChild(inlineScript);

		updateBackgroundImage();
		window.addEventListener('resize', updateBackgroundImage);

		return () => {
			window.removeEventListener('resize', updateBackgroundImage);
			document.body.removeChild(externalScript);
			document.body.removeChild(inlineScript);
		};
	}, []);

	return (
		<div
			className="relative bg-[#0B0E2D] select-text"
			style={{
				fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial'
			}}
		>
			<div className="bg-white layout relative flex flex-col items-center text-textDarkTheme overflow-visibile">
				{!sideBarIsOpen && <HeaderMezon sideBarIsOpen={sideBarIsOpen} toggleSideBar={toggleSideBar} scrollToSection={scrollToSection} />}

				<div className="container w-10/12 max-lg:w-full max-md:px-[16px] max-md:mt-[72px]" id="home" ref={homeRef}>
					<div
						className={`bg-white max-md:pb-0 max-md:mt-[36px] md:mt-[100px] md:pb-[50px] flex flex-col gap-[48px] max-md:gap-[32px] md:px-[32px] transition-opacity duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
					>
						<div className="flex flex-col gap-5 items-center">
							<div
								className="text-black text-6xl max-w-[1000px] font-bold leading-relaxed text-center max-md:text-4xl max-sm:text-3xl"
								data-e2e={generateE2eId('homepage.main_page.heading.title')}
							>
								The <HighLightText content="Live" />, <HighLightText content="Work" />, and <HighLightText content="Play Platform" />{' '}
								the best <HighLightText content="Discord" /> Alternative
							</div>
							<div className="text-3xl max-w-[800px] leading-normal text-center flex flex-col max-md:text-2xl max-sm:text-xl">
								<span className="text-black">
									<HighLightText content="Mezon" /> is great for playing games and chilling with friends, or even building a
									worldwide community.
								</span>
								<span className="text-black">
									Customize your own space to <HighLightText content="talk" />, <HighLightText content="play" />, and{' '}
									<HighLightText content="hang out" />.
								</span>
							</div>
							<div className="w-3/4 h-full">
								<img src="/assets/homepage-bg.png" alt="banner-desktop" width={1600} height={1000} className="w-full h-full" />
							</div>
							<div className="flex items-center gap-5 max-sm:flex-col"></div>
						</div>
						<div className="max-md:mb-10 flex justify-center items-center gap-[12px]">
							<a
								className="cursor-pointer"
								href="https://apps.apple.com/vn/app/mezon/id6502750046"
								target="_blank"
								rel="noreferrer"
								onClick={() => trackDownloadEvent('iOS', 'App Store')}
							>
								<Icons.AppStoreBadge className="max-w-full max-md:h-[32px] max-md:w-[98px]" />
							</a>
							<a
								className="cursor-pointer"
								href="https://play.google.com/store/apps/details?id=com.mezon.mobile"
								target="_blank"
								rel="noreferrer"
								onClick={() => trackDownloadEvent('Android', 'Google Play')}
							>
								<Icons.GooglePlayBadge className="max-w-full max-md:h-[32px] max-md:w-full" />
							</a>
							{platform === Platform.MACOS ? (
								<DropdownButton
									icon={<Icons.MacAppStoreDesktop className="max-w-full max-md:h-[32px] max-md:w-full" />}
									downloadLinks={[
										{
											url: downloadUrl,
											icon: <Icons.MacAppleSilicon className="max-w-full max-md:h-[32px] max-md:w-full" />,
											trackingData: { platform: 'macOS', type: 'Apple Silicon' }
										},
										{
											url: universalUrl,
											icon: <Icons.MacAppleIntel className="max-w-full max-md:h-[32px] max-md:w-full" />,
											trackingData: { platform: 'macOS', type: 'Intel' }
										}
									]}
									dropdownRef={dropdownRef}
									platform={Platform.MACOS}
									onDownloadClick={trackDownloadEvent}
								/>
							) : platform === 'Linux' ? (
								<a
									className="cursor-pointer leading-[0px]"
									href={downloadUrl}
									target="_blank"
									rel="noreferrer"
									onClick={() => trackDownloadEvent('Linux', 'DEB Package')}
								>
									<Image src={`assets/linux.svg`} className="max-w-full max-md:h-[32px] max-md:w-full" />
								</a>
							) : (
								<DropdownButton
									icon={
										<a
											className="cursor-pointer"
											href={downloadUrl}
											target="_blank"
											rel="noreferrer"
											onClick={() => trackDownloadEvent('Windows', 'EXE Installer')}
										>
											<Icons.MicrosoftDropdown className="max-w-full max-md:h-[32px] max-md:w-full" />
										</a>
									}
									downloadLinks={[
										{
											url: portableUrl,
											icon: <Icons.MicrosoftWinPortable className="max-w-full max-md:h-[32px] max-md:w-full" />,
											trackingData: { platform: 'Windows', type: 'Portable' }
										}
									]}
									dropdownRef={dropdownRef}
									downloadUrl={downloadUrl}
									isWindow={isWindow}
									onDownloadClick={trackDownloadEvent}
								/>
							)}
						</div>
					</div>
				</div>

				{sideBarIsOpen && <SideBarMezon sideBarIsOpen={sideBarIsOpen} toggleSideBar={toggleSideBar} scrollToSection={scrollToSection} />}

				{!sideBarIsOpen && (
					<div className="hidden md:block absolute top-0 w-[400px] h-[400px] bg-[#8D72C5] rounded-[50%] filter blur-[200px] mix-blend-color-dodge"></div>
				)}
			</div>

			<Layout sideBarIsOpen={sideBarIsOpen} />
			<Footer downloadUrl={downloadUrl} universalUrl={universalUrl} portableUrl={portableUrl} />
			{!isElectron() && <CustomCookieConsent />}
		</div>
	);
}

export default MezonPage;

interface DownloadLink {
	url: string;
	icon: JSX.Element;
	trackingData?: { platform: string; type: string };
}

interface DropdownButtonProps {
	icon: JSX.Element;
	downloadLinks: DownloadLink[];
	dropdownRef: React.RefObject<HTMLDivElement>;
	downloadUrl?: string;
	platform?: Platform;
	isWindow?: boolean;
	onDownloadClick?: (platform: string, downloadType: string) => void;
}

export const DropdownButton: React.FC<DropdownButtonProps> = ({
	platform,
	icon,
	downloadLinks,
	dropdownRef,
	downloadUrl,
	isWindow,
	onDownloadClick
}) => {
	const [isOpen, setIsOpen] = useState(false);

	const toggleDropdown = () => {
		if (platform === Platform.MACOS) {
			setIsOpen((prev) => !prev);
		}
	};

	const toggleDropdownWindow = () => {
		setIsOpen((prev) => !prev);
	};

	const handleOpenCdnUrl = () => {
		onDownloadClick?.('Windows', 'CDN Direct');
		window.open(downloadUrl, '_blank', 'noreferrer');
	};

	const handleDownloadClick = (trackingData?: { platform: string; type: string }) => {
		if (onDownloadClick && trackingData) {
			onDownloadClick(trackingData.platform, trackingData.type);
		}
	};

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setIsOpen(false);
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, [dropdownRef]);

	return (
		<div className="relative inline-block leading-[0px]" ref={dropdownRef}>
			<button className="relative" onClick={toggleDropdown}>
				{isWindow ? (
					<div className="cursor-pointer" onClick={handleOpenCdnUrl}>
						<div className="bg-black py-1 max-md:py-[2px] px-[10px] max-md:px-2 w-[180px] max-md:w-[125px] flex items-center gap-[10px] rounded-md border-[1.5px] border-white">
							<Icons.Microsoft className="w-[34px] h-[34px] max-md:w-[22px] max-md:h-[22px]" />
							<div>
								<div className="text-xs max-md:text-[9px]">Get it from</div>
								<div className="max-md:text-[12px] leading-[20px] max-md:leading-[13px]">CDN Url</div>
							</div>
						</div>
					</div>
				) : (
					icon
				)}
				<div className="absolute top-2.5 right-2.5 max-md:top-0 max-md:right-0">
					<Icons.ChevronDownIcon
						className={isWindow ? 'text-textDarkTheme' : 'text-transparent'}
						onClick={toggleDropdownWindow}
						style={{ width: 26, height: 26 }}
					/>
				</div>
			</button>
			{isOpen && (
				<div className="absolute z-50 flex flex-col gap-1 mt-1 left-[2px]">
					{/* The below component will be used in the future - TungNQS */}
					<div className="cursor-pointer hidden" onClick={handleOpenCdnUrl}>
						<div className="bg-black py-1 max-md:py-[2px] px-[10px] max-md:px-2 w-[180px] max-md:w-[125px] flex items-center gap-[10px] rounded-md border-[1.5px] border-white">
							<Icons.CDNIcon className="w-[29px] h-[29px] max-md:w-[20px] max-md:h-[20px]" />
							<div>
								<div className="text-xs max-md:text-[9px]">Get it from</div>
								<div className="max-md:text-[12px] leading-[20px] max-md:leading-[13px]">CDN Url</div>
							</div>
						</div>
					</div>
					{downloadLinks.map((link, index) => (
						<a
							key={index}
							className="cursor-pointer block"
							href={link.url}
							target="_blank"
							rel="noreferrer"
							onClick={() => handleDownloadClick(link.trackingData)}
						>
							{link.icon}
						</a>
					))}
				</div>
			)}
		</div>
	);
};
