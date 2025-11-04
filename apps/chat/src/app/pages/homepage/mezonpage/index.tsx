import { CustomCookieConsent } from '@mezon/components';
import mezonPackage from '@mezon/package-js';
import { Platform, getPlatform } from '@mezon/utils';
import isElectron from 'is-electron';
import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import Footer from './footer';
import HeaderMezon from './header';
import { BotsAndAppsSection, CommunitiesSection, FinalCTASection, FreedomToConnectSection, HeroSection, MezonEconomySection } from './sections';
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
	const { t } = useTranslation('homepage');
	const platform = getPlatform();
	const isWindow = platform === Platform.WINDOWS;
	const [sideBarIsOpen, setSideBarIsOpen] = useState(false);
	const carouselRef = useRef<HTMLDivElement>(null);
	const [currentSlide, setCurrentSlide] = useState(0);
	const totalSlides = 6;

	const handlePrevSlide = () => {
		setCurrentSlide((prev) => (prev === 0 ? totalSlides - 1 : prev - 1));
	};

	const handleNextSlide = () => {
		setCurrentSlide((prev) => (prev === totalSlides - 1 ? 0 : prev + 1));
	};

	const scrollToSlide = (index: number) => {
		setCurrentSlide(index);
	};

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
				event_label: platform,
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
			<div className="bg-white layout relative flex flex-col items-center text-textDarkTheme overflow-visible">
				{!sideBarIsOpen && <HeaderMezon sideBarIsOpen={sideBarIsOpen} toggleSideBar={toggleSideBar} scrollToSection={scrollToSection} />}

				<HeroSection homeRef={homeRef} isVisible={isVisible} />

				<FreedomToConnectSection />

				<BotsAndAppsSection />

				<CommunitiesSection
					carouselRef={carouselRef}
					currentSlide={currentSlide}
					setCurrentSlide={setCurrentSlide}
					handlePrevSlide={handlePrevSlide}
					handleNextSlide={handleNextSlide}
					scrollToSlide={scrollToSlide}
				/>

				<MezonEconomySection />

				<FinalCTASection
					trackDownloadEvent={trackDownloadEvent}
					platform={platform}
					downloadUrl={downloadUrl}
					universalUrl={universalUrl}
					portableUrl={portableUrl}
					dropdownRef={dropdownRef}
					isWindow={isWindow}
					t={t}
				/>

				{sideBarIsOpen && <SideBarMezon sideBarIsOpen={sideBarIsOpen} toggleSideBar={toggleSideBar} scrollToSection={scrollToSection} />}
			</div>

			<Footer downloadUrl={downloadUrl} universalUrl={universalUrl} portableUrl={portableUrl} />
			{!isElectron() && <CustomCookieConsent />}
		</div>
	);
}

export default MezonPage;
