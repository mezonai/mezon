'use client';

import { Button } from '@mezon/ui';
import React from 'react';

export const FreedomToConnectSection = () => {
	const [activeImage, setActiveImage] = React.useState('mezon-welcome.png');
	const [currentFeatureIndex, setCurrentFeatureIndex] = React.useState(-1);
	const [activePopup, setActivePopup] = React.useState<string | null>(null);
	const sectionRef = React.useRef<HTMLElement>(null);
	const scrollLockRef = React.useRef(false);
	const lastScrollTime = React.useRef(0);
	const hoverTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

	React.useEffect(() => {
		const style = document.createElement('style');
		style.textContent = `
			@keyframes fadeIn {
				0% {
					opacity: 0;
				}
				100% {
					opacity: 1;
				}
			}
			.image-transition {
				animation: fadeIn 0.8s ease-in-out;
			}
			@media (min-width: 853px) and (max-width: 1023px) {
				.ipad-portrait {
					width: 432px !important;
					transform: translate(-2px, -28px) !important;
				}
				.ipad-portrait-welcome {
					transform: translate(-2px, -40px) !important;
				}
			}
			/* Exact 1280 x 800 screens */
			@media (width: 1280px) and (height: 800px) {
				.ipad-portrait {
					width: 295px !important;
					transform: translate(0px, 53px) !important;
				}
				.ipad-portrait-welcome {
					width: 259px !important;
					transform: translate(0px, 49px) !important;
				}
			}
			/* Exact 1024 x 600 screens */
			@media (width: 1024px) and (height: 600px) {
				.ipad-portrait {
					transform: translate(-1px, 135px) !important;
				}
				.ipad-portrait-welcome {
					transform: translate(-1px, 130px) !important;
				}
			}
		`;
		document.head.appendChild(style);

		return () => {
			document.head.removeChild(style);
		};
	}, []);

	const imageMap: Record<string, string> = React.useMemo(
		() => ({
			'Text Channel': 'text-channel.png',
			'Voice Channel': 'voice-channel.png',
			Organize: 'organize.png',
			Customize: 'custome.png',
			Engage: 'engage.png',
			'AI Generation': 'ai-gent.png'
		}),
		[]
	);

	const buttonLabels = React.useMemo(() => ['Text Channel', 'Voice Channel', 'Organize', 'Customize', 'Engage', 'AI Agent'], []);

	const resetToDefaultImage = React.useCallback(() => {
		setActiveImage('mezon-welcome.png');
	}, []);

	const resetHoverTimeout = React.useCallback(() => {
		if (hoverTimeoutRef.current) {
			clearTimeout(hoverTimeoutRef.current);
		}
		hoverTimeoutRef.current = setTimeout(resetToDefaultImage, 5000);
	}, [resetToDefaultImage]);

	React.useEffect(() => {
		return () => {
			if (hoverTimeoutRef.current) {
				clearTimeout(hoverTimeoutRef.current);
			}
		};
	}, []);

	React.useEffect(() => {
		const handleScroll = (e: WheelEvent) => {
			if (!sectionRef.current) return;

			const rect = sectionRef.current.getBoundingClientRect();
			const isInView = rect.top <= 100 && rect.bottom >= window.innerHeight / 2;

			if (!isInView) {
				scrollLockRef.current = false;
				return;
			}

			const now = Date.now();
			if (now - lastScrollTime.current < 800) return;

			const scrollingDown = e.deltaY > 0;
			const scrollingUp = e.deltaY < 0;

			if (scrollingDown && currentFeatureIndex < buttonLabels.length - 1) {
				e.preventDefault();
				scrollLockRef.current = true;
				lastScrollTime.current = now;

				const nextIndex = currentFeatureIndex + 1;
				setCurrentFeatureIndex(nextIndex);

				const label = buttonLabels[nextIndex];
				if (label === 'AI Agent') {
					setActiveImage(imageMap['AI Generation']);
				} else {
					setActiveImage(imageMap[label]);
				}
			} else if (scrollingUp && currentFeatureIndex >= 0) {
				e.preventDefault();
				scrollLockRef.current = true;
				lastScrollTime.current = now;

				const prevIndex = currentFeatureIndex - 1;
				setCurrentFeatureIndex(prevIndex);

				if (prevIndex === -1) {
					setActiveImage('mezon-welcome.png');
				} else {
					const label = buttonLabels[prevIndex];
					if (label === 'AI Agent') {
						setActiveImage(imageMap['AI Generation']);
					} else {
						setActiveImage(imageMap[label]);
					}
				}
			} else if (scrollingDown && currentFeatureIndex === buttonLabels.length - 1) {
				scrollLockRef.current = false;
			} else if (scrollingUp && currentFeatureIndex === -1) {
				scrollLockRef.current = false;
			}
		};

		window.addEventListener('wheel', handleScroll, { passive: false });

		return () => {
			window.removeEventListener('wheel', handleScroll);
		};
	}, [currentFeatureIndex, buttonLabels, imageMap]);

	React.useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && activePopup) {
				setActivePopup(null);
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => {
			window.removeEventListener('keydown', handleKeyDown);
		};
	}, [activePopup]);

	return (
		<section className="w-full bg-[#E6ECF0] py-20 max-md:py-12" ref={sectionRef}>
			<div className="container w-10/12 max-lg:w-full max-md:px-4 mx-auto">
				<div className="w-full text-center mb-12">
					<h2 className="text-6xl max-md:text-3xl font-bold text-stone-900">
						Freedom To <span className="text-purple-600">Connect</span> & <p className="text-purple-600">Communicate</p>
					</h2>
					<p className="text-lg text-gray-600 mt-4">
						Talk, Stream, Share files, and grow your server limitlessly.
						<br />
						<span className="text-purple-600 font-semibold">Mezon is Free by Design</span>
					</p>
				</div>

				<div className="flex flex-col lg:flex-row items-center gap-2 max-md:gap-8 mx-[200px] max-lg:mx-8 max-md:mx-0">
					<div className="flex-1 flex flex-col gap-6 items-center max-md:w-full">
						{buttonLabels.map((label, index) => (
							<Button
								key={label}
								className={`
                  px-10 py-4 max-md:px-6 max-md:py-3 border-2 rounded-2xl font-semibold text-lg max-md:text-base text-center transform origin-center whitespace-nowrap
                  min-w-[220px] w-auto max-md:min-w-full max-md:w-full
                  transition-all duration-700 ease-in-out
                  ${
						activePopup === label
							? 'bg-gradient-to-r from-[#8961E3] to-[#7B78F4] text-white border-transparent scale-105 translate-x-12 max-md:translate-x-0 max-md:translate-y-2'
							: 'border-purple-300 text-gray-700 bg-white hover:bg-gradient-to-r hover:from-[#8961E3] hover:to-[#7B78F4] hover:text-white hover:border-transparent hover:scale-105 hover:translate-x-12 max-md:hover:translate-x-0 max-md:hover:translate-y-2'
					}
                `}
								onMouseEnter={() => {
									if (activePopup === null) {
										if (hoverTimeoutRef.current) {
											clearTimeout(hoverTimeoutRef.current);
										}

										if (label === 'AI Agent') {
											setActiveImage(imageMap['AI Generation']);
										} else {
											setActiveImage(imageMap[label]);
										}
									}
								}}
								onMouseLeave={() => {
									if (activePopup === null) {
										resetHoverTimeout();
									}
								}}
								onClick={() => setActivePopup(label)}
							>
								{label}
							</Button>
						))}
					</div>

					<div className="mt-10 flex-1 flex justify-center items-center mr-[49px] max-md:mr-0">
						<div className="relative w-full max-w-[500px] max-md:max-w-[260px]">
							<div className="relative h-[500px] max-md:h-[260px]">
								{activeImage === 'mezon-welcome.png' ? (
									<img
										src="/assets/welcomemobile.png"
										alt="Welcome Mobile"
										className="w-[426px] h-auto object-contain translate-x-[25px] translate-y-[-34px] max-md:translate-x-0 max-md:translate-y-[-52px] ipad-portrait-welcome"
									/>
								) : (
									<img
										src={`/assets/${activeImage}`}
										alt="Feature Preview"
										className="w-[420px] h-auto object-contain image-transition translate-x-[31px] translate-y-[-28px] max-md:translate-x-[-2px] max-md:translate-y-[-36px] ipad-portrait"
										key={activeImage}
									/>
								)}
								<div className="absolute inset-0 flex items-center justify-center pointer-events-none">
									<img src="/assets/mezon-welcome.png" alt="Mezon Welcome" className="w-[450px] h-auto object-contain" />
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{activePopup && <Popup title={activePopup} onClose={() => setActivePopup(null)} />}
		</section>
	);
};

interface PopupProps {
	title: string;
	onClose: () => void;
}

const Popup: React.FC<PopupProps> = ({ title: _title, onClose }) => {
	const features = [
		{
			title: 'Chat Messages',
			description: 'Send quick texts, links, or updates that keep the conversation flowing in real time'
		},
		{
			title: 'Canvas',
			description: 'Open a collaborative canvas where everyone can brainstorm, sketch, or map out ideas'
		},
		{
			title: 'Mentions',
			description: 'Use @mentions to call out teammates and make sure the right people see the message.'
		},
		{
			title: 'File sharing',
			description: 'Upload and share images, videos, and documents directly in the chat, with previews and easy downloads'
		},
		{
			title: 'Pinned messages',
			description: 'Keep announcements, rules, or important updates visible at the top of the channel'
		},
		{
			title: 'Voice notes',
			description: "Record short audio clips when you're on the move or when typing just isn't enough"
		}
	];

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div className="bg-white rounded-3xl p-12 max-w-4xl w-full max-h-[80vh] overflow-y-auto relative">
				<button
					onClick={onClose}
					className="absolute top-8 right-8 w-12 h-12 rounded-full border-2 border-gray-400 flex items-center justify-center hover:bg-gray-100 transition-colors"
					aria-label="Close popup"
				>
					<span className="text-2xl text-gray-600">×</span>
				</button>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
					{features.map((feature, index) => (
						<div key={index} className="flex flex-col gap-4">
							<div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
								<div className="w-8 h-8 bg-purple-300 rounded-full"></div>
							</div>

							<h3 className="text-xl font-semibold text-gray-900">{feature.title}</h3>

							<p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
						</div>
					))}
				</div>
			</div>
		</div>
	);
};
