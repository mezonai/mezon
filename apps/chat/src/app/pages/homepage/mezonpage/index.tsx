import mezonPackage from '@mezon/package-js';
import { Icons, Image } from '@mezon/ui';
import { Platform, getPlatform } from '@mezon/utils';
import { useEffect, useMemo, useRef, useState } from 'react';
import Footer from './footer';
import HeaderMezon from './header';
import Layout, { useIntersectionObserver } from './layouts';
import { SideBarMezon } from './sidebar';

function MezonPage() {
	const platform = getPlatform();
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
		if (platform === 'MacOS') {
			return `https://cdn.mezon.vn/release/mezon-${version}-mac-arm64.dmg`;
		} else if (platform === 'Linux') {
			return `https://cdn.mezon.vn/release/mezon-${version}-linux-amd64.deb`;
		}
		return `https://cdn.mezon.vn/release/mezon-${version}-win-x64.exe`;
	}, [platform, version]);

	const universalUrl = `https://cdn.mezon.vn/release/mezon-${version}-mac-x64.dmg`;
	const portableUrl = `https://cdn.mezon.vn/release/mezon-${version}-win-x64-portable.exe`;

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

	useEffect(() => {
		updateBackgroundImage();
		window.addEventListener('resize', updateBackgroundImage);

		return () => window.removeEventListener('resize', updateBackgroundImage);
	}, []);

	return (
		<div
			className="relative bg-[#0B0E2D] select-text"
			style={{
				fontFamily: 'Inter'
			}}
		>
			<div
				className="layout relative flex flex-col items-center text-textDarkTheme overflow-visibile scroll-smooth"
				style={{
					background: 'linear-gradient(rgba(3, 3, 32, 0) -15.28%, rgb(15, 15, 99) -93.02%, rgba(3, 3, 32, 0) 105.23%)'
				}}
			>
				{!sideBarIsOpen && <HeaderMezon sideBarIsOpen={sideBarIsOpen} toggleSideBar={toggleSideBar} scrollToSection={scrollToSection} />}

				<div className="container w-10/12 max-lg:w-full max-md:px-[16px] max-md:mt-[72px]" id="home" ref={homeRef}>
					<div
						className={`max-md:pb-0 max-md:mt-[36px] md:mt-[200px] md:pb-[120px] flex flex-col gap-[48px] max-md:gap-[32px] md:px-[32px] transition-opacity duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
						style={backgroundImageStyle}
					>
						<div className="flex flex-col items-center justify-center gap-[24px] m-auto text-center w-full max-w-full md:max-w-[662px]">
							<h1 className="tracking-[-.02em] text-center text-[60px] max-md:text-[36px] font-black leading-[72px] max-md:leading-[48px] font-semibold font-['Poppins'] text-[#F4F7F9] max-md:text-textDarkTheme">
								Your clan & your world
							</h1>
							<div className="text-[20px] text-[#C2D5DF] text-center leading-[30px] font-normal hidden md:block">
								<div>Mezon is great for playing games and chilling with friends, </div>
								<div>or even building a worldwide community.</div>
								<div>Customize your own space to talk, play, and hang out.</div>
							</div>
						</div>
						<div className="flex justify-center items-center gap-[12px]">
							<a className="cursor-pointer" href="https://apps.apple.com/vn/app/mezon/id6502750046" target="_blank" rel="noreferrer">
								<Icons.AppStoreBadge className="max-w-full max-md:h-[32px] max-md:w-[98px]" />
							</a>
							<a
								className="cursor-pointer"
								href="https://play.google.com/store/apps/details?id=com.mezon.mobile"
								target="_blank"
								rel="noreferrer"
							>
								<Icons.GooglePlayBadge className="max-w-full max-md:h-[32px] max-md:w-full" />
							</a>
							{platform === 'MacOS' ? (
								<DropdownButton
									icon={<Icons.MacAppStoreDesktop className="max-w-full max-md:h-[32px] max-md:w-full" />}
									downloadLinks={[
										{ url: downloadUrl, icon: <Icons.MacAppleSilicon className="max-w-full max-md:h-[32px] max-md:w-full" /> },
										{ url: universalUrl, icon: <Icons.MacAppleIntel className="max-w-full max-md:h-[32px] max-md:w-full" /> }
									]}
									dropdownRef={dropdownRef}
									platform={Platform.MACOS}
								/>
							) : platform === 'Linux' ? (
								<a className="cursor-pointer leading-[0px]" href={downloadUrl} target="_blank" rel="noreferrer">
									<Image src={`assets/linux.svg`} alt={'linux'} className="max-w-full max-md:h-[32px] max-md:w-full" />
								</a>
							) : (
								<DropdownButton
									icon={
										<a className="cursor-pointer leading-[0px]" href={downloadUrl} target="_blank" rel="noreferrer">
											<Icons.MicrosoftDropdown className="max-w-full max-md:h-[32px] max-md:w-full" />
										</a>
									}
									downloadLinks={[
										{
											url: portableUrl,
											icon: <Icons.MicrosoftWinPortable className="max-w-full max-md:h-[32px] max-md:w-full" />
										}
									]}
									dropdownRef={dropdownRef}
									downloadUrl={downloadUrl}
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
			<Footer downloadUrl={downloadUrl} universalUrl={universalUrl} portableUrl={portableUrl}></Footer>
		</div>
	);
}

export default MezonPage;

interface DownloadLink {
	url: string;
	icon: JSX.Element;
}

interface DropdownButtonProps {
	icon: JSX.Element;
	downloadLinks: DownloadLink[];
	dropdownRef: React.RefObject<HTMLDivElement>;
	downloadUrl?: string;
	platform?: Platform;
}

export const DropdownButton: React.FC<DropdownButtonProps> = ({ platform, icon, downloadLinks, dropdownRef, downloadUrl }) => {
	const [isOpen, setIsOpen] = useState(false);

	const toggleDropdown = () => {
		if (platform === Platform.MACOS) {
			setIsOpen((prev) => !prev);
		}
	};

	const toggleDropdownWindow = () => {
		setIsOpen((prev) => !prev);
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
				{icon}
				<div className="absolute top-2.5 right-2.5 max-md:top-0 max-md:right-0">
					<Icons.ChevronDownIcon onClick={toggleDropdownWindow} style={{ width: 26, height: 26, color: 'transparent' }} />
				</div>
			</button>
			{isOpen && (
				<div className="absolute mt-[8px] z-50 flex flex-col gap-1">
					{downloadLinks.map((link, index) => (
						<a key={index} className="cursor-pointer block" href={link.url} target="_blank" rel="noreferrer">
							{link.icon}
						</a>
					))}
				</div>
			)}
		</div>
	);
};
