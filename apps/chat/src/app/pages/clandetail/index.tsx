'use client';

import mezonPackage from '@mezon/package-js';
import { Icons } from '@mezon/ui';
import { getPlatform, Platform } from '@mezon/utils';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ModalDownload } from '../homepage/mezonpage/components';
import Footer from '../homepage/mezonpage/footer';
import HeaderMezon from '../homepage/mezonpage/header';
import { SideBarMezon } from '../homepage/mezonpage/sidebar';

const ClanDetailPage = () => {
	const { t } = useTranslation('clandetail');
	const platform = getPlatform();
	const version = mezonPackage.version;
	const [imageLoaded, setImageLoaded] = useState(false);
	const [openFAQ, setOpenFAQ] = useState<number | null>(0);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [sideBarIsOpen, setSideBarIsOpen] = useState(false);

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
	const featuresRef = useRef<HTMLDivElement>(null);
	const section3Ref = useRef<HTMLDivElement>(null);
	const section4Ref = useRef<HTMLDivElement>(null);
	const section5Ref = useRef<HTMLDivElement>(null);
	const [activeFeature, setActiveFeature] = useState(0);

	const features = [
		{
			id: 0,
			title: t('features.0.title'),
			description: t('features.0.description'),
			image: 'https://cdn.mezon.ai/landing-page-mezon/comunityforfun1 .webp',
			imageSize: 'max-w-[80vw] lg:max-w-[45vw]'
		},
		{
			id: 1,
			title: t('features.1.title'),
			description: t('features.1.description'),
			image: 'https://cdn.mezon.ai/landing-page-mezon/comunityforfun2.webp',
			imageSize: 'max-w-[80vw] lg:max-w-[46vw]'
		},
		{
			id: 2,
			title: t('features.2.title'),
			description: t('features.2.description'),
			image: 'https://cdn.mezon.ai/landing-page-mezon/comunityforfun3.webp',
			imageSize: 'max-w-[80vw] lg:max-w-[47vw]'
		},
		{
			id: 3,
			title: t('features.3.title'),
			description: t('features.3.description'),
			image: 'https://cdn.mezon.ai/landing-page-mezon/comunityforfun4.webp',
			imageSize: 'max-w-[80vw] lg:max-w-[48vw]'
		}
	];

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

		const refs = [section1Ref, section2Ref, featuresRef, section3Ref, section4Ref, section5Ref];
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
		<div className="min-h-screen bg-white">
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
				className="section-animate relative w-full bg-white pt-[120px] pb-20 2xl:pt-[273px] 2xl:pb-[193px] max-md:pt-[100px] max-md:pb-12 overflow-hidden"
			>
				<div className="max-w-[1600px] 2xl:max-w-[2400px] mx-auto px-10">
					<div className="flex items-center justify-between 2xl:justify-around max-lg:flex-col-reverse max-lg:gap-12 flex-row-reverse gap-8 lg:gap-12 xl:gap-16">
						<div className="image-animate flex-shrink-0 relative">
							<div
								className={`absolute inset-0 bg-gradient-to-br from-[#8761df5f] to-[#7979ed4f] rounded-2xl transition-opacity duration-300 ${imageLoaded ? 'opacity-0' : 'opacity-100'}`}
							/>
							<img
								src="https://cdn.mezon.ai/landing-page-mezon/clandetai1.webp"
								alt="Build Your Community"
								className="max-w-[68vw] lg:max-w-[43vw] object-contain drop-shadow-2xl rounded-2xl relative z-10"
								loading="lazy"
								onLoad={() => setImageLoaded(true)}
							/>
						</div>

						<div className="content-right flex flex-col justify-center items-center pl-4 lg:pl-8 xl:pl-12 max-lg:px-4">
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
					<div className="flex items-center justify-between 2xl:justify-around max-lg:flex-col-reverse max-lg:gap-12 gap-8 lg:gap-12 xl:gap-16">
						<div className="image-animate flex-shrink-0">
							<img
								src="https://cdn.mezon.ai/landing-page-mezon/clandtail2.webp"
								alt="WFH Experience"
								className="max-w-[80vw] lg:max-w-[51vw] object-contain drop-shadow-2xl rounded-2xl"
								loading="lazy"
							/>
						</div>

						<div className="content-right flex flex-col justify-center items-center pr-4 lg:pr-8 xl:pr-12 max-lg:px-4">
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
			<section ref={featuresRef} className="section-animate relative w-full bg-white py-20 2xl:py-[193px] max-md:py-12 overflow-hidden">
				<div className="max-w-[1600px] 2xl:max-w-[2400px] mx-auto px-10">
					<h2 className="font-svnAvo text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-stone-900 text-center mb-12 md:mb-16 lg:mb-20 select-text">
						{t('featuresTitle')}
					</h2>
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 xl:gap-16 items-center">
						<div className="order-2 lg:order-1 flex justify-center items-center">
							<div className="relative w-full h-[400px] md:h-[500px] lg:h-[600px] flex items-center justify-center">
								<img
									src={features[activeFeature].image}
									alt={features[activeFeature].title}
									className={`${features[activeFeature].imageSize} h-full object-contain drop-shadow-2xl rounded-2xl transition-opacity duration-300`}
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
													className={`text-2xl max-md:text-xl font-semibold mb-2 transition-colors select-text ${
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
													<p className="text-gray-600 text-base leading-relaxed pr-8 select-text">{feature.description}</p>
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

			<section ref={section3Ref} className="section-animate relative w-full bg-[#e6ebf0] py-20 2xl:py-[193px] max-md:py-12 overflow-hidden">
				<div className="max-w-[1600px] 2xl:max-w-[2400px] mx-auto px-10">
					<div className="flex items-center justify-between 2xl:justify-around max-lg:flex-col-reverse max-lg:gap-12 flex-row-reverse gap-8 lg:gap-12 xl:gap-16">
						<div className="image-animate flex-shrink-0">
							<img
								src="https://cdn.mezon.ai/landing-page-mezon/clandetail3.webp"
								alt="Member Relationship"
								className="max-w-[74vw] lg:max-w-[37vw] object-contain drop-shadow-2xl rounded-2xl"
								loading="lazy"
							/>
						</div>

						<div className="content-right flex flex-col justify-center items-center pl-4 lg:pl-8 xl:pl-12 max-lg:px-4">
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

			<section ref={section4Ref} className="section-animate relative w-full bg-white py-20 2xl:py-[193px] max-md:py-12 overflow-hidden">
				<div className="max-w-[1600px] 2xl:max-w-[2400px] mx-auto px-10">
					<div className="flex items-center justify-between 2xl:justify-around max-lg:flex-col-reverse max-lg:gap-12 gap-8 lg:gap-12 xl:gap-16">
						<div className="image-animate flex-shrink-0">
							<img
								src="https://cdn.mezon.ai/landing-page-mezon/clandetail4.webp"
								alt="Reports"
								className="max-w-[75vw] lg:max-w-[46vw] object-contain drop-shadow-2xl rounded-2xl"
								loading="lazy"
							/>
						</div>

						<div className="content-right flex flex-col justify-center items-center pr-4 lg:pr-8 xl:pr-12 max-lg:px-4">
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

			<section ref={section5Ref} className="section-animate relative w-full bg-[#e6ebf0] py-20 2xl:py-[193px] max-md:py-12 overflow-hidden">
				<div className="max-w-[1600px] 2xl:max-w-[2400px] mx-auto px-10">
					<div className="flex items-center justify-between 2xl:justify-around max-lg:flex-col-reverse max-lg:gap-12 flex-row-reverse gap-8 lg:gap-12 xl:gap-16">
						<div className="image-animate flex-shrink-0">
							<img
								src="https://cdn.mezon.ai/landing-page-mezon/clandetail5.webp"
								alt="Member Relationship Oriented"
								className="max-w-[80vw] lg:max-w-[34vw] object-contain drop-shadow-2xl rounded-2xl"
								loading="lazy"
							/>
						</div>

						<div className="content-right flex flex-col justify-center items-center pl-4 lg:pl-8 xl:pl-12 max-lg:px-4">
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

			<section className="w-full bg-white py-16 md:py-24 lg:py-22">
				<div className="max-w-[1600px] 2xl:max-w-[2400px] mx-auto px-10">
					<div className="max-w-4xl mx-auto">
						<div className="flex items-start justify-between mb-8 md:mb-12">
							<h2 className="font-svnAvo text-3xl sm:text-4xl lg:text-5xl text-slate-900 font-bold select-text">{t('faq.title')}</h2>
							<a
								href="https://mezon.ai/docs/en/user/clan"
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
							{[
								{
									question: 'What is a Clan on Mezon?',
									answer: 'A Clan is the heart of Mezon — where people connect, collaborate, and share through communities built around shared interests, goals, or passions. A Clan can be a small group of friends or a large-scale community with thousands of members. Within a Clan, you can chat through organized Channels, host events via Voice Channels, and enhance your community using Bots, Apps, and Mezon Tokens.'
								},
								{
									question: 'How do I join a Clan on Mezon?',
									answer: 'You can discover and join Clans in two ways: through the Discover button within the app or via the Clans Website at mezon.ai/clans, or by using an invite link shared by friends, teammates, or admins. Simply click "Join" to become part of the community. Each user can join up to 50 Clans at a time. Check out featured Clans like Student Clan, Gamer Clan, and Business Clan.'
								},
								{
									question: 'How do I create my own Clan?',
									answer: 'Creating a Clan is simple and highly flexible. Navigate to the Clans section and create a new Clan with just a few clicks. You can set a name, icon, and basic settings to customize your community. Once created, you can invite friends and teammates to start conversations, share ideas, or collaborate together. You can also manage channels, set permissions, and transfer ownership if needed.'
								},
								{
									question: 'Can I leave a Clan if I no longer want to participate?',
									answer: "Yes, if you no longer wish to participate in a Clan, you can select 'Leave Clan' from the Clan's settings. Once you leave, all message history and access to that Clan's channels will be removed from your account. You can always rejoin the Clan later if you have an invite link or if the Clan is publicly discoverable."
								}
							].map((faq, index) => (
								<div key={index} className="border-b border-gray-200">
									<button
										onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
										className="w-full py-4 md:py-6 flex items-center justify-between text-left hover:bg-[#eef0f3] transition-colors duration-200"
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
												href="https://mezon.ai/docs/en/user/clan"
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
export default ClanDetailPage;
