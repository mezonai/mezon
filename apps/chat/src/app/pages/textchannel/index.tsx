'use client';

import mezonPackage from '@mezon/package-js';
import { Button, Icons } from '@mezon/ui';
import { Platform, getPlatform } from '@mezon/utils';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ModalDownload } from '../homepage/mezonpage/components';
import Footer from '../homepage/mezonpage/footer';
import HeaderMezon from '../homepage/mezonpage/header';
import { SideBarMezon } from '../homepage/mezonpage/sidebar';

const TextChannelPage = () => {
	const { t } = useTranslation('textchannel');
	const platform = getPlatform();
	const version = mezonPackage.version;
	const [imageLoaded, setImageLoaded] = useState(false);
	const [currentSlide, setCurrentSlide] = useState(0);
	const [loadedImages, setLoadedImages] = useState<{ [key: number]: boolean }>({});
	const [openFAQ, setOpenFAQ] = useState<number | null>(0);
	const [isMobile, setIsMobile] = useState(false);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [sideBarIsOpen, setSideBarIsOpen] = useState(false);

	const slides = (t('discover.slides', { returnObjects: true }) as Array<{ title: string; description: string }>).map((slide, index) => ({
		...slide,
		image: `https://cdn.mezon.ai/landing-page-mezon/feat${index + 1}.webp`
	}));

	const downloadUrl: string =
		platform === Platform.MACOS
			? 'https://apps.apple.com/vn/app/mezon-desktop/id6756601798?mt=12'
			: platform === Platform.LINUX
				? `${process.env.NX_BASE_IMG_URL}/release/mezon-${version}-linux-amd64.deb`
				: `${process.env.NX_BASE_IMG_URL}/release/mezon-${version}-win-x64.exe`;
	const universalUrl = 'https://apps.apple.com/vn/app/mezon-desktop/id6756601798?mt=12';
	const portableUrl = `${process.env.NX_BASE_IMG_URL}/release/mezon-${version}-win-x64-portable.exe`;

	const section1Ref = useRef<HTMLDivElement>(null);
	const section2Ref = useRef<HTMLDivElement>(null);
	const section3Ref = useRef<HTMLDivElement>(null);
	const section4Ref = useRef<HTMLDivElement>(null);
	const section5Ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		window.scrollTo(0, 0);

		const observerOptions = {
			threshold: 0.1,
			rootMargin: '0px 0px -100px 0px'
		};

		const observer = new IntersectionObserver((entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					entry.target.classList.add('animate-in');
				}
			});
		}, observerOptions);

		const refs = [section1Ref, section2Ref, section3Ref, section4Ref, section5Ref];
		refs.forEach((ref) => {
			if (ref.current) {
				observer.observe(ref.current);
			}
		});

		return () => {
			refs.forEach((ref) => {
				if (ref.current) {
					observer.unobserve(ref.current);
				}
			});
		};
	}, []);

	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth < 1024);
		};

		checkMobile();
		window.addEventListener('resize', checkMobile);

		return () => {
			window.removeEventListener('resize', checkMobile);
		};
	}, []);

	const goToPrevious = () => {
		setCurrentSlide((prev) => Math.max(prev - 1, 0));
	};

	const goToNext = () => {
		setCurrentSlide((prev) => Math.min(prev + 1, slides.length - 1));
	};

	const toggleSideBar = () => {
		setSideBarIsOpen((prev) => !prev);
	};

	const scrollToSection = (id: string, event: React.MouseEvent) => {
		event.preventDefault();
		setSideBarIsOpen(false);
	};

	const animationStyles = `
    @keyframes slideInLeft {
      from {
        opacity: 0;
        transform: translateX(-80px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    @keyframes slideInRight {
      from {
        opacity: 0;
        transform: translateX(80px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    .section-animate {
      opacity: 0;
    }

    .section-animate.animate-in {
      opacity: 1;
    }

    .section-animate.animate-in .content-right {
      animation: slideInRight 0.6s ease-out forwards;
    }

    .section-animate.animate-in .image-animate {
      animation: slideInLeft 0.6s ease-out forwards;
    }

    .content-right {
      opacity: 0;
    }

    .image-animate {
      opacity: 0;
    }

    @keyframes fadeInScale {
      from {
        opacity: 0;
        transform: scale(0.95);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }

    .discover-card {
      animation: fadeInScale 0.5s ease-out;
    }

    .faq-content {
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.3s ease-out, opacity 0.3s ease-out, padding 0.3s ease-out;
      opacity: 0;
    }

    .faq-content.open {
      max-height: 500px;
      opacity: 1;
      transition: max-height 0.4s ease-in, opacity 0.4s ease-in 0.1s, padding 0.4s ease-in;
    }

    .faq-icon {
      transition: transform 0.3s ease-out;
    }
  `;

	return (
		<div className="min-h-screen bg-white relative">
			<style>{animationStyles}</style>
			<HeaderMezon sideBarIsOpen={sideBarIsOpen} toggleSideBar={toggleSideBar} scrollToSection={scrollToSection} />
			<SideBarMezon sideBarIsOpen={sideBarIsOpen} toggleSideBar={toggleSideBar} scrollToSection={scrollToSection} />

			<div
				className={`fixed inset-0 z-30 bg-black transition-opacity duration-300 ease-in-out max-lg:block hidden ${
					sideBarIsOpen ? 'opacity-50 pointer-events-auto' : 'opacity-0 pointer-events-none'
				}`}
				onClick={toggleSideBar}
				style={{ top: '72px' }}
			/>

			<section
				ref={section1Ref}
				className={`section-animate relative w-full bg-white pt-[120px] pb-20 2xl:pt-[273px] 2xl:pb-[193px] max-md:pt-[100px] max-md:pb-12 overflow-hidden
				}`}
			>
				<div className="max-w-[1600px] 2xl:max-w-[2400px] mx-auto px-10">
					<div className="flex items-center justify-between 2xl:justify-around max-lg:flex-col-reverse max-lg:gap-12 gap-8 lg:gap-12 xl:gap-16">
						<div className="image-animate flex-shrink-0 relative">
							<div
								className={`absolute inset-0 bg-gradient-to-br from-[#8761df5f] to-[#7979ed4f] rounded-2xl transition-opacity duration-300 ${imageLoaded ? 'opacity-0' : 'opacity-100'}`}
							/>
							<img
								src="https://cdn.mezon.ai/landing-page-mezon/friendinclan.webp"
								alt="Chill with friends"
								className="max-w-[68vw] lg:max-w-[37vw] object-contain drop-shadow-2xl rounded-2xl relative z-10"
								loading="lazy"
								onLoad={() => setImageLoaded(true)}
							/>
						</div>

						<div className="content-right flex flex-col justify-center items-center pr-4 lg:pr-8 xl:pr-12 max-lg:px-4">
							<div className="max-w-[520px] 2xl:max-w-[22vw] flex flex-col items-start gap-4 md:gap-6 lg:gap-8">
								<div>
									<h2 className="font-svnAvo text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl text-stone-900 mb-3 md:mb-4 lg:mb-6 select-text">
										<span className="text-stone-900">{t('sections.section1.title')}</span>
									</h2>
									<p className="font-svnAvo text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 leading-relaxed select-text">
										{t('sections.section1.description')}
									</p>
								</div>
								<button
									onClick={() => setIsModalOpen(true)}
									className="font-svnAvo inline-flex items-center justify-center gap-2 px-8 py-2 sm:px-10 sm:py-3 lg:px-12 lg:py-4 bg-gradient-to-r from-[#8661df] to-[#7979ed] hover:bg-gradient-to-l text-white text-sm sm:text-base lg:text-lg font-medium rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl min-w-[200px] sm:min-w-[240px] lg:min-w-[280px]"
								>
									<span>{t('download')}</span>
									<Icons.ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
								</button>
							</div>
						</div>
					</div>
				</div>
			</section>
			<section ref={section2Ref} className="section-animate relative w-full bg-[#e6ebf0] py-20 2xl:py-[193px] max-md:py-12 overflow-hidden">
				<div className="max-w-[1600px] 2xl:max-w-[2400px] mx-auto px-10">
					<div className="flex items-center justify-between 2xl:justify-around max-lg:flex-col-reverse max-lg:gap-12 flex-row-reverse gap-8 lg:gap-12 xl:gap-16">
						<div className="image-animate flex-shrink-0">
							<img
								src="https://cdn.mezon.ai/landing-page-mezon/voicechannel.webp"
								alt="Voice Channels"
								className="max-w-[80vw] lg:max-w-[51vw] object-contain drop-shadow-2xl rounded-2xl"
								loading="lazy"
							/>
						</div>

						<div className="content-right flex flex-col justify-center items-center pl-4 lg:pl-8 xl:pl-12 max-lg:px-4">
							<div className="max-w-[520px] 2xl:max-w-[22vw] flex flex-col items-start gap-4 md:gap-6 lg:gap-8">
								<div>
									<h2 className="font-svnAvo text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl text-stone-900 mb-3 md:mb-4 lg:mb-6 select-text">
										<span className="text-stone-900">{t('sections.section2.title')}</span>
									</h2>
									<p className="font-svnAvo text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 leading-relaxed select-text">
										{t('sections.section2.description')}
									</p>
								</div>
								<button
									onClick={() => setIsModalOpen(true)}
									className="font-svnAvo inline-flex items-center justify-center gap-2 px-8 py-2 sm:px-10 sm:py-3 lg:px-12 lg:py-4 bg-gradient-to-r from-[#8661df] to-[#7979ed] hover:bg-gradient-to-l text-white text-sm sm:text-base lg:text-lg font-medium rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl min-w-[200px] sm:min-w-[240px] lg:min-w-[280px]"
								>
									<span>{t('download')}</span>
									<Icons.ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
								</button>
							</div>
						</div>
					</div>
				</div>
			</section>

			<section ref={section3Ref} className="section-animate relative w-full bg-white py-20 2xl:py-[193px] max-md:py-12 overflow-hidden">
				<div className="max-w-[1600px] 2xl:max-w-[2400px] mx-auto px-10">
					<div className="flex items-center justify-between 2xl:justify-around max-lg:flex-col-reverse max-lg:gap-12 gap-8 lg:gap-12 xl:gap-16">
						<div className="image-animate flex-shrink-0">
							<img
								src="https://cdn.mezon.ai/landing-page-mezon/dtcalnvoice.webp"
								alt="Stream and Announcements"
								className="max-w-[74vw] lg:max-w-[39vw] object-contain drop-shadow-2xl rounded-2xl"
								loading="lazy"
							/>
						</div>

						<div className="content-right flex flex-col justify-center items-center pr-4 lg:pr-8 xl:pr-12 max-lg:px-4">
							<div className="max-w-[520px] 2xl:max-w-[22vw] flex flex-col items-start gap-4 md:gap-6 lg:gap-8">
								<div>
									<h2 className="font-svnAvo text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl text-stone-900 mb-3 md:mb-4 lg:mb-6 select-text">
										<span className="text-stone-900">{t('sections.section3.title')}</span>
									</h2>
									<p className="font-svnAvo text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 leading-relaxed select-text">
										{t('sections.section3.description')}
									</p>
								</div>
								<button
									onClick={() => setIsModalOpen(true)}
									className="font-svnAvo inline-flex items-center justify-center gap-2 px-8 py-2 sm:px-10 sm:py-3 lg:px-12 lg:py-4 bg-gradient-to-r from-[#8661df] to-[#7979ed] hover:bg-gradient-to-l text-white text-sm sm:text-base lg:text-lg font-medium rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl min-w-[200px] sm:min-w-[240px] lg:min-w-[280px]"
								>
									<span>{t('download')}</span>
									<Icons.ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
								</button>
							</div>
						</div>
					</div>
				</div>
			</section>

			<section ref={section4Ref} className="section-animate relative w-full bg-[#e6ebf0] py-20 2xl:py-[193px] max-md:py-12 overflow-hidden">
				<div className="max-w-[1600px] 2xl:max-w-[2400px] mx-auto px-10">
					<div className="flex items-center justify-between 2xl:justify-around max-lg:flex-col-reverse max-lg:gap-12 flex-row-reverse gap-8 lg:gap-12 xl:gap-16">
						<div className="image-animate flex-shrink-0">
							<img
								src="https://cdn.mezon.ai/landing-page-mezon/channelApp.webp"
								alt="Channel Apps"
								className="max-w-[75vw] lg:max-w-[51vw] object-contain drop-shadow-2xl rounded-2xl"
								loading="lazy"
							/>
						</div>

						<div className="content-right flex flex-col justify-center items-center pl-4 lg:pl-8 xl:pl-12 max-lg:px-4">
							<div className="max-w-[520px] 2xl:max-w-[22vw] flex flex-col items-start gap-4 md:gap-6 lg:gap-8">
								<div>
									<h2 className="font-svnAvo text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl text-stone-900 mb-3 md:mb-4 lg:mb-6 select-text">
										<span className="text-stone-900">{t('sections.section4.title')}</span>
									</h2>
									<p className="font-svnAvo text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 leading-relaxed select-text">
										{t('sections.section4.description')}
									</p>
								</div>
								<button
									onClick={() => setIsModalOpen(true)}
									className="font-svnAvo inline-flex items-center justify-center gap-2 px-8 py-2 sm:px-10 sm:py-3 lg:px-12 lg:py-4 bg-gradient-to-r from-[#8661df] to-[#7979ed] hover:bg-gradient-to-l text-white text-sm sm:text-base lg:text-lg font-medium rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl min-w-[200px] sm:min-w-[240px] lg:min-w-[280px]"
								>
									<span>{t('download')}</span>
									<Icons.ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
								</button>
							</div>
						</div>
					</div>
				</div>
			</section>

			<section ref={section5Ref} className="section-animate relative w-full bg-white py-20 2xl:py-[193px] max-md:py-12 overflow-hidden">
				<div className="max-w-[1600px] 2xl:max-w-[2400px] mx-auto px-10">
					<div className="flex items-center justify-between 2xl:justify-around max-lg:flex-col-reverse max-lg:gap-12 gap-8 lg:gap-12 xl:gap-16">
						<div className="image-animate flex-shrink-0">
							<img
								src="https://cdn.mezon.ai/landing-page-mezon/supperbot.webp"
								alt="Super Intelligent Bot"
								className="max-w-[74vw] lg:max-w-[57vw] object-contain drop-shadow-2xl rounded-2xl"
								loading="lazy"
							/>
						</div>

						<div className="content-right flex flex-col justify-center items-center pr-4 lg:pr-8 xl:pr-12 max-lg:px-4">
							<div className="max-w-[520px] 2xl:max-w-[22vw] flex flex-col items-start gap-4 md:gap-6 lg:gap-8">
								<div>
									<h2 className="font-svnAvo text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl text-stone-900 mb-3 md:mb-4 lg:mb-6 select-text">
										<span className="text-stone-900">{t('sections.section5.title')}</span>
									</h2>
									<p className="font-svnAvo text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 leading-relaxed select-text">
										{t('sections.section5.description')}
									</p>
								</div>
								<button
									onClick={() => setIsModalOpen(true)}
									className="font-svnAvo inline-flex items-center justify-center gap-2 px-8 py-2 sm:px-10 sm:py-3 lg:px-12 lg:py-4 bg-gradient-to-r from-[#8661df] to-[#7979ed] hover:bg-gradient-to-l text-white text-sm sm:text-base lg:text-lg font-medium rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl min-w-[200px] sm:min-w-[240px] lg:min-w-[280px]"
								>
									<span>{t('download')}</span>
									<Icons.ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
								</button>
							</div>
						</div>
					</div>
				</div>
			</section>

			<section className="w-full bg-[#e6ebf0] py-16 md:py-24 lg:py-32 overflow-hidden lg:overflow-visible">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="grid grid-cols-1-reverse lg:grid-cols-2 gap-8 lg:gap-16 items-center">
						<div className="space-y-6 lg:space-y-8 relative z-10 order-1 lg:order-1">
							<div className="space-y-4">
								<h2 className="font-svnAvo text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-slate-900 leading-tight select-text">
									{t('discover.title')}
								</h2>
								<p className="font-svnAvo text-base sm:text-lg md:text-xl text-slate-600 leading-relaxed max-w-lg select-text">
									{t('discover.description')}
								</p>
							</div>{' '}
							<div className="flex gap-3 pt-4">
								<Button
									onClick={goToPrevious}
									disabled={currentSlide === 0}
									className="p-3 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
									aria-label="Previous slide"
								>
									<svg className="w-5 h-5 sm:w-4 sm:h-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
									</svg>
								</Button>
								<Button
									onClick={goToNext}
									disabled={currentSlide === slides.length - 1}
									className="p-3 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
									aria-label="Next slide"
								>
									<svg className="w-5 h-5 sm:w-4 sm:h-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
									</svg>
								</Button>
							</div>
							<Link
								to="https://mezon.ai/clans/"
								target="_blank"
								rel="noopener noreferrer"
								className="font-svnAvo inline-flex items-center justify-center gap-2 px-6 py-2 sm:px-8 sm:py-2.5 md:px-10 md:py-3 lg:px-12 lg:py-4 bg-gradient-to-r from-[#8661df] to-[#7979ed] hover:bg-gradient-to-l text-white text-sm sm:text-base lg:text-lg font-medium rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl w-full sm:w-auto sm:min-w-[200px] md:min-w-[240px] lg:min-w-[280px]"
							>
								<span>{t('discover.buttonText')}</span>
								<Icons.ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
							</Link>
						</div>

						<div className="relative flex items-center justify-center lg:justify-start overflow-hidden lg:overflow-visible z-0 order-2 lg:order-2">
							<div className="w-full max-w-full lg:max-w-2xl overflow-hidden lg:overflow-visible">
								<div className="relative overflow-hidden lg:overflow-visible">
									<div
										className="flex transition-transform duration-700 ease-out"
										style={{
											transform: `translateX(-${currentSlide * (isMobile ? 100 : 85)}%)`
										}}
									>
										{slides.map((slide, index) => {
											const isActive = index === currentSlide;
											const isPast = index < currentSlide;
											const isNext = index === currentSlide + 1;
											const isFuture = index > currentSlide + 1;

											return (
												<div
													key={index}
													className={`flex-shrink-0 transition-all duration-700 ease-out ${
														isMobile ? 'w-full px-2' : 'w-[85%] mr-4'
													}`}
													style={{
														opacity: isMobile
															? isActive
																? 1
																: 0
															: isPast
																? 0
																: isActive
																	? 1
																	: isNext
																		? 0.4
																		: isFuture
																			? 0.2
																			: 0.1,
														transform: isMobile
															? 'scale(1)'
															: isPast
																? 'scale(0.85) translateX(-30px)'
																: isActive
																	? 'scale(1)'
																	: isNext
																		? 'scale(0.95)'
																		: isFuture
																			? 'scale(0.9)'
																			: 'scale(0.85)',
														pointerEvents: isActive ? 'auto' : 'none',
														visibility: isMobile && !isActive ? 'hidden' : isPast ? 'hidden' : 'visible'
													}}
												>
													<div className="bg-white rounded-[63px] lg:rounded-[35px]  overflow-hidden flex flex-col h-full">
														<div className="relative w-full flex-shrink-0">
															<img
																src={slide.image}
																alt={slide.title}
																className={`w-full h-auto object-contain transition-opacity duration-500 ${loadedImages[index] ? 'opacity-100' : 'opacity-0'}`}
																loading="lazy"
																onLoad={() => setLoadedImages((prev) => ({ ...prev, [index]: true }))}
															/>
														</div>
														<div className="p-4 sm:p-5 md:p-6 space-y-2 sm:space-y-3 flex-grow flex flex-col">
															<h3 className=" font-svnAvo text-lg sm:text-xl text-slate-900 line-clamp-2 min-h-[3rem] sm:min-h-[3.5rem] select-text">
																{slide.title}
															</h3>
															<p className="font-svnAvo text-sm sm:text-base text-slate-600 line-clamp-3 min-h-[3.5rem] sm:min-h-[4.5rem] select-text">
																{slide.description}
															</p>
														</div>
													</div>
												</div>
											);
										})}
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			<section className="w-full bg-white py-16 md:py-24 lg:py-22">
				<div className="max-w-[1600px] 2xl:max-w-[2400px] mx-auto px-10">
					<div className="max-w-4xl mx-auto">
						<div className="flex items-start justify-between mb-8 md:mb-12">
							<h2 className="font-svnAvo text-3xl sm:text-4xl lg:text-5xl text-slate-900 font-bold select-text">{t('faq.title')}</h2>
							<a
								href="https://mezon.ai/docs/en/user/friends-and-messaging"
								target="_blank"
								rel="noopener noreferrer"
								className="font-svnAvo text-[#b625d3] hover:text-[#9920ba] underline inline-flex items-center gap-1 text-base sm:text-lg transition-colors"
							>
								{t('faq.seeAll')}
								<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
								</svg>
							</a>
						</div>

						<div className="space-y-0 border-t border-gray-200">
							{(t('faq.questions', { returnObjects: true }) as Array<{ question: string; answer: string }>).map((faq, index) => (
								<div key={index} className="border-b border-gray-200">
									<button
										onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
										className="w-full py-4 md:py-6 flex items-center justify-between text-left hover:bg-[#e6ebf0] transition-colors duration-200"
									>
										<span className="font-svnAvo text-base sm:text-lg text-slate-900 pr-4 flex items-start gap-2 select-text">
											<span className="text-slate-700 mt-1 transition-all duration-300">
												{openFAQ === index ? <Icons.ArrowDown /> : <Icons.ArrowRight />}
											</span>
											<span>{faq.question}</span>
										</span>
									</button>
									<div className={`faq-content ${openFAQ === index ? 'open' : ''}`}>
										<div className="pb-4 md:pb-6 pl-6 md:pl-8 pr-4">
											<p className="font-svnAvo text-sm sm:text-base text-slate-600 leading-relaxed mb-4 select-text">
												{faq.answer}
											</p>
											<a
												href="https://mezon.ai/docs/en/user/friends-and-messaging"
												target="_blank"
												rel="noopener noreferrer"
												className="font-svnAvo text-[#b625d3] hover:text-[#9920ba] inline-flex items-center gap-1 text-sm sm:text-base transition-colors"
											>
												{t('faq.learnMore')}
												<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
												</svg>
											</a>
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</section>

			<ModalDownload isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
			<Footer downloadUrl={downloadUrl} universalUrl={universalUrl} portableUrl={portableUrl} />
		</div>
	);
};
export default TextChannelPage;
