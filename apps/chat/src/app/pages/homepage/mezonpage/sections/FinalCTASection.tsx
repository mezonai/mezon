'use client';

import { Icons } from '@mezon/ui';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

export const FinalCTASection = () => {
	const sectionRef = useRef<HTMLElement>(null);
	const imageRef = useRef<HTMLDivElement>(null);
	const contentRef = useRef<HTMLDivElement>(null);
	const [isVisible, setIsVisible] = useState(false);

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
		<section ref={sectionRef} className="relative w-full bg-[#e6ebf0] py-20 max-md:py-12 overflow-hidden px-10">
			<div className="flex items-center justify-evenly max-lg:flex-col max-lg:gap-12 flex-row-reverse">
				<div
					ref={imageRef}
					className={`flex-shrink-0 transition-all duration-700 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}
				>
				<img
					src="/message.webp"
					alt="AI Generation"
					className="w-auto h-auto max-w-[55vw] max-lg:max-w-full object-contain drop-shadow-2xl rounded-2xl"
				/>
				</div>

				<div
					ref={contentRef}
					className={`flex flex-col justify-center pl-8 lg:pl-16 xl:pl-24 max-lg:px-4 transition-all duration-700 delay-300 ${
						isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
					}`}
				>
					<div className="max-w-[520px]">
						<h2 className="font-svnAvo text-6xl max-md:text-3xl text-stone-900 mb-6">
							<span className="text-stone-900">AI Agent</span>
						</h2>
						<p className="font-svnAvo text-xl text-gray-600 mb-8 leading-relaxed">
							Supercharge your productivity with AI-powered features. Get intelligent assistance, content generation, and smart
							automation right in your workspace.
						</p>
						<Link to="/" className="inline-flex items-center gap-2 text-xl font-bold text-purple-600 hover:text-purple-700">
							<span
								className="font-svnAvo relative after:content-[''] after:absolute after:left-0 after:bottom-0 after:w-0 after:h-[2px]
					after:bg-purple-600 after:transition-all after:duration-300 hover:after:w-full"
							>
								Learn more
							</span>
							<Icons.ArrowRight className="w-5 h-5 translate-y-[1px]" />
						</Link>
					</div>
				</div>
			</div>
		</section>
	);
};
