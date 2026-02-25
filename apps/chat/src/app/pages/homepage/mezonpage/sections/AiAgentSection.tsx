'use client';

import { Icons } from '@mezon/ui';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export const AiAgentSection = () => {
	const { t } = useTranslation('homepage');
	const sectionRef = useRef<HTMLElement>(null);
	const imageRef = useRef<HTMLDivElement>(null);
	const contentRef = useRef<HTMLDivElement>(null);
	const [isVisible, setIsVisible] = useState(false);
	const [imageLoaded, setImageLoaded] = useState(false);

	useEffect(() => {
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting && !isVisible) {
					setIsVisible(true);
				}
			},
			{ threshold: 0.2 }
		);

		if (sectionRef.current) {
			observer.observe(sectionRef.current);
		}

		return () => {
			if (sectionRef.current) {
				observer.unobserve(sectionRef.current);
			}
		};
	}, [isVisible]);

	return (
		<section ref={sectionRef} className="relative w-full bg-white py-20 2xl:py-[193px] max-md:py-12 overflow-hidden">
			<div className="max-w-[1600px] 2xl:max-w-[2400px] mx-auto px-10">
				<div className="flex items-center justify-between 2xl:justify-around max-lg:flex-col-reverse max-lg:gap-12 flex-row-reverse gap-8 lg:gap-12 xl:gap-16">
					<div
						ref={imageRef}
						className={`flex-shrink-0 transition-all duration-700 relative ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}
					>
						<div
							className={`absolute inset-0 bg-gradient-to-br from-[#8661df] to-[#7979ed] rounded-2xl transition-opacity duration-300 ${imageLoaded ? 'opacity-0' : 'opacity-100'}`}
						/>
						<img
							src="https://cdn.mezon.ai/landing-page-mezon/section-aiagent.webp"
							alt="Engage"
							className="max-w-[68vw] lg:max-w-[35vw] object-contain drop-shadow-2xl rounded-2xl relative z-10"
							loading="lazy"
							onLoad={() => setImageLoaded(true)}
						/>
					</div>

					<div
						ref={contentRef}
						className={`flex flex-col justify-center items-center pl-4 lg:pl-8 xl:pl-12 max-lg:px-4 transition-all duration-700 delay-300 ${
							isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
						}`}
					>
						<div className="max-w-[520px] 2xl:max-w-[22vw] flex flex-col items-start gap-4 md:gap-6 lg:gap-8">
							<div>
								<h2 className="font-svnAvo text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl text-stone-900 mb-3 md:mb-4 lg:mb-6">
									<span className="text-stone-900">{t('sections.aiAgent.title')}</span>
								</h2>
								<p className="font-svnAvo text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 leading-relaxed">
									{t('sections.aiAgent.description')}
								</p>
							</div>
							<Link
								to="/"
								className="group flex items-center gap-2 text-sm md:text-base lg:text-lg text-purple-600 hover:text-purple-700 font-svnAvo"
							>
								<span className="relative after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-[2px] after:w-0 after:bg-purple-600 after:transition-all after:duration-300 group-hover:after:w-full">
									{t('sections.textChannel.learnMore')}
								</span>
								<Icons.TopRight className="w-4 h-4 sm:w-5 sm:h-5" />
							</Link>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
};
