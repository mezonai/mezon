'use client';

import { Icons } from '@mezon/ui';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export const TextChannelSection = () => {
	const { t } = useTranslation('homepage');
	const sectionRef = useRef<HTMLElement>(null);
	const [isVisible, setIsVisible] = useState(false);
	const [imageLoaded, setImageLoaded] = useState(false);

	useEffect(() => {
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting && !isVisible) setIsVisible(true);
			},
			{ threshold: 0.2 }
		);

		if (sectionRef.current) observer.observe(sectionRef.current);
		return () => observer.disconnect();
	}, [isVisible]);

	return (
		<section ref={sectionRef} className="relative w-full bg-[#e6ebf0] py-20 2xl:py-[193px] max-md:py-12 overflow-hidden lg:px-5">
			<div className="max-w-[1600px] 2xl:max-w-[2400px] mx-auto px-10">
				<div className="flex items-center gap-[26px] lg:gap-[144px] max-lg:flex-col-reverse">
					<div
						className={`w-3/5 max-lg:w-full transition-all duration-700 relative ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}
					>
						<div
							className={`absolute inset-0 bg-gradient-to-br from-[#8661df] to-[#7979ed] rounded-2xl transition-opacity duration-300 ${imageLoaded ? 'opacity-0' : 'opacity-100'}`}
						/>
						<img
							src="https://cdn.mezon.ai/landing-page-mezon/messapage.webp"
							alt="Text Channel"
							className="w-auto h-auto max-w-[81vw] lg:max-w-[50vw] 3xl:max-w-[30vw] object-contain  rounded-2xl relative z-10"
							loading="lazy"
							onLoad={() => setImageLoaded(true)}
						/>
					</div>

					<div
						className={`w-2/5 max-lg:w-full transition-all duration-700 delay-300 ${
							isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
						}`}
					>
						<div className="flex flex-col items-start gap-4 md:gap-6 lg:gap-8 px-4 lg:px-0">
							<div>
								<h2 className="font-svnAvo text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl text-stone-900 mb-3 md:mb-4 lg:mb-6">
									<span className="">{t('sections.textChannel.titlesuper')}</span>
									<p>{t('sections.textChannel.titlemessage')}</p>
								</h2>
								<p className="font-svnAvo text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 leading-relaxed">
									{t('sections.textChannel.description')} <p>{t('sections.textChannel.description2')}</p>
								</p>
							</div>
							<Link
								to="/fastmessage"
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
