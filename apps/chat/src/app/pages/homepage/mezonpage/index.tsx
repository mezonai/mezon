import { CustomCookieConsent } from '@mezon/components';
import mezonPackage from '@mezon/package-js';
import { Platform, getPlatform } from '@mezon/utils';
import isElectron from 'is-electron';
import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import Footer from './footer';
import HeaderMezon from './header';
import {
	AiAgentSection,
	CLanDiscoverSection,
	ComunityPaymentsSection,
	EnterpriseIntegrationsSection,
	HeroSection,
	TextChannelSection
} from './sections';
import { SideBarMezon } from './sidebar';

// Intersection Observer Hook
interface IntersectionOptions {
	root?: Element | null;
	rootMargin?: string;
	threshold?: number | number[];
}

export const useIntersectionObserver = (elementRef: RefObject<Element>, options: IntersectionOptions): boolean => {
	const [isVisible, setIsVisible] = useState<boolean>(false);
	const [hasAnimated, setHasAnimated] = useState<boolean>(false);

	useEffect(() => {
		const observer = new IntersectionObserver((entries) => {
			const [entry] = entries;
			if (entry.isIntersecting && !hasAnimated) {
				setIsVisible(true);
				setHasAnimated(true);
			}
		}, options);

		const currentElement = elementRef.current;
		if (currentElement) {
			observer.observe(currentElement);
		}

		return () => {
			if (currentElement) {
				observer.unobserve(currentElement);
			}
		};
	}, [elementRef, options, hasAnimated]);

	return isVisible;
};

function MezonPage() {
	const platform = getPlatform();
	const [sideBarIsOpen, setSideBarIsOpen] = useState(false);

	const homeRef = useRef<HTMLDivElement>(null);
	const isVisible = useIntersectionObserver(homeRef, { threshold: 0.1 });

	const toggleSideBar = () => {
		setSideBarIsOpen(!sideBarIsOpen);
	};

	const version = mezonPackage.version;
	const downloadUrl: string = useMemo(() => {
		if (platform === Platform.MACOS) {
			return 'https://apps.apple.com/vn/app/mezon-desktop/id6756601798?mt=12';
		} else if (platform === Platform.LINUX) {
			return `${process.env.NX_BASE_IMG_URL}/release/mezon-${version}-linux-amd64.deb`;
		}
		return `${process.env.NX_BASE_IMG_URL}/release/mezon-${version}-win-x64.exe`;
	}, [platform, version]);

	const universalUrl = 'https://apps.apple.com/vn/app/mezon-desktop/id6756601798?mt=12';
	const portableUrl = `${process.env.NX_BASE_IMG_URL}/release/mezon-${version}-win-x64-portable.exe`;
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

	const trackDownloadEvent = (platform: string, downloadType: string) => {
		if (typeof window !== 'undefined' && typeof (window as Window & { gtag?: (...args: unknown[]) => void }).gtag !== 'undefined') {
			(window as Window & { gtag?: (...args: unknown[]) => void }).gtag?.('event', 'download_click', {
				event_category: 'Downloads',
				eventLabel: platform,
				download_type: downloadType,
				app_version: version,
				custom_parameter_1: 'mezon_homepage'
			});
		}
	};

	// Carousel navigation functions

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

		return () => {
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
			<HeaderMezon sideBarIsOpen={sideBarIsOpen} toggleSideBar={toggleSideBar} scrollToSection={scrollToSection} />
			<SideBarMezon sideBarIsOpen={sideBarIsOpen} toggleSideBar={toggleSideBar} scrollToSection={scrollToSection} />
			<div
				className={`fixed inset-0 z-30 bg-black transition-opacity duration-300 ease-in-out max-lg:block hidden ${
					sideBarIsOpen ? 'opacity-50 pointer-events-auto' : 'opacity-0 pointer-events-none'
				}`}
				onClick={toggleSideBar}
				style={{ top: '72px' }}
			/>
			<div
				className={`bg-white layout relative flex flex-col items-center text-textDarkTheme overflow-visible transition-all duration-300 ${
					sideBarIsOpen ? 'max-lg:brightness-75' : ''
				}`}
			>
				<HeroSection homeRef={homeRef} isVisible={isVisible} />
				<TextChannelSection />
				<CLanDiscoverSection />
				<EnterpriseIntegrationsSection />
				<ComunityPaymentsSection />
				<AiAgentSection />
				{/* <FinalCTASection /> */}
			</div>

			<Footer downloadUrl={downloadUrl} universalUrl={universalUrl} portableUrl={portableUrl} />
			{!isElectron() && <CustomCookieConsent />}
		</div>
	);
}

export default MezonPage;
