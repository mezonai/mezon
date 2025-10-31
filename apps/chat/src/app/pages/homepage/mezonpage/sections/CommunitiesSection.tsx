'use client';

import type { RefObject } from 'react';
import { useEffect } from 'react';

interface CommunitiesSectionProps {
	carouselRef: RefObject<HTMLDivElement>;
	currentSlide: number;
	setCurrentSlide: (slide: number) => void;
	handlePrevSlide: () => void;
	handleNextSlide: () => void;
	scrollToSlide: (index: number) => void;
}

export const CommunitiesSection = ({
	carouselRef,
	currentSlide,
	setCurrentSlide,
	handlePrevSlide,
	handleNextSlide,
	scrollToSlide
}: CommunitiesSectionProps) => {
	const totalSlides = 6;

	const unifiedButtonClass =
		'inline-block rounded-lg bg-purple-600 px-4 py-2 text-xs font-semibold text-white transition-all duration-200 hover:bg-purple-700 active:scale-95 sm:px-5 sm:py-2.5 sm:text-sm md:px-6 md:py-3 md:text-base';

	const communityCards: Array<
		| {
				index: number;
				imageSrc: string;
				alt: string;
				badgeClass: string;
				title: string;
				description: string;
				ctaHref: string;
		  }
		| {
				index: number;
				type: 'gradient';
				gradientClass: string;
				emoji: string;
				badgeClass: string;
				title: string;
				description: string;
				ctaHref: string;
		  }
	> = [
		{
			index: 0,
			imageSrc: '/assets/mini-game.png',
			alt: 'Gaming Community',
			badgeClass: 'bg-purple-600',
			title: 'Gaming',
			description: 'Tham gia cộng đồng gaming tuyệt vời',
			ctaHref: 'https://youtube.com'
		},
		{
			index: 1,
			imageSrc: '/assets/chuongheo.png',
			alt: 'Mezon Monthly Bot Challenge',
			badgeClass: 'bg-blue-600',
			title: 'Mezon Monthly Bot Challenge',
			description: 'Thể hiện sáng tạo và kỹ năng lập trình của bạn',
			ctaHref: 'https://youtube.com'
		},
		{
			index: 2,
			imageSrc: '/assets/cobar.png',
			alt: 'Tạp Hóa Cô Ba',
			badgeClass: 'bg-green-600',
			title: 'Tạp Hóa Cô Ba',
			description: 'Mua gì cứ mua, có tiền là có tất cả',
			ctaHref: 'https://youtube.com'
		},
		{
			index: 3,
			imageSrc: '/assets/tim-viec.png',
			alt: 'Creative Hub',
			badgeClass: 'bg-pink-600',
			title: 'Creative Hub',
			description: 'Chia sẻ tác phẩm và kết nối với các nhà sáng tạo',
			ctaHref: 'https://youtube.com'
		},
		{
			index: 4,
			imageSrc: '/assets/mezon-challenge.png',
			alt: 'Music Lovers',
			badgeClass: 'bg-indigo-600',
			title: 'Bot',
			description: 'Ở đây sẽ có nhiều ',
			ctaHref: 'https://youtube.com'
		},
		{
			index: 5,
			type: 'gradient',
			gradientClass: 'bg-gradient-to-br from-red-600 to-orange-600',
			emoji: '⚽',
			badgeClass: 'bg-red-600',
			title: 'Sports Arena',
			description: 'Kết nối với các vận động viên và fan hâm mộ',
			ctaHref: 'https://youtube.com'
		}
	];

	useEffect(() => {
		if (carouselRef.current) {
			const carousel = carouselRef.current;
			const cards = carousel.querySelectorAll('[data-card-index]');
			const selectedCard = cards[currentSlide] as HTMLElement;

			if (selectedCard) {
				const cardWidth = selectedCard.offsetWidth;
				const cardLeft = selectedCard.offsetLeft;
				const carouselWidth = carousel.offsetWidth;
				const scrollPosition = cardLeft - (carouselWidth - cardWidth) / 2;

				carousel.scrollTo({
					left: scrollPosition,
					behavior: 'smooth'
				});
			}
		}
	}, [currentSlide, carouselRef]);

	const getCardStyles = (index: number) => {
		const distance = Math.abs(index - currentSlide);

		if (index === currentSlide) {
			return {
				opacity: 1,
				scale: 1
			};
		} else if (distance === 1) {
			return {
				opacity: 0.6,
				scale: 0.95,
				filter: 'brightness(0.85)'
			};
		} else {
			return {
				opacity: 0.35,
				scale: 0.9,
				filter: 'brightness(0.7)'
			};
		}
	};

	const styles = getCardStyles(0);

	return (
		<section className="w-full bg-gradient-to-b from-gray-50 to-white py-16 md:py-24 lg:py-28">
			<div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
				<div className="mb-12 text-center md:mb-16 lg:mb-20">
					<h2 className="mb-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl md:text-5xl lg:text-6xl">
						Discover Our Vibrant <p className="bg-gradient-to-r text-purple-600 ">Communities</p>
					</h2>
					<p className="mx-auto mb-8 max-w-2xl text-base text-gray-600 sm:text-lg md:text-xl">
						From hobbies and discussions to news and trends,{' '}
						<p>
							<span className="text-purple-600">there's a clan</span> for everything
						</p>
					</p>
					<a href="https://mezon.ai/clans/" target="_blank" rel="noopener noreferrer">
						<button className="inline-flex items-center justify-center rounded-lg bg-purple-600 px-6 py-3 font-semibold text-white transition-all duration-200 hover:bg-purple-700 hover:shadow-lg active:scale-95 sm:px-8 sm:py-4 md:text-lg">
							Discover more communities
						</button>
					</a>
				</div>
			</div>
			<div className="relative">
				<div className="overflow-hidden rounded-xl">
					<div
						ref={carouselRef}
						className="flex gap-0.5 overflow-x-auto pb-4 scroll-smooth sm:gap-1 md:gap-1.5 lg:gap-2 hide-scrollbar ml-5"
					>
						{communityCards.map((card) => (
							<div
								key={card.index}
								data-card-index={card.index}
								onClick={() => setCurrentSlide(card.index)}
								className="group relative h-56 w-[85%] sm:w-1/2 md:w-1/3 flex-shrink-0 overflow-hidden rounded-xl shadow-md transition-all duration-500 hover:shadow-xl cursor-pointer sm:h-64 md:h-72 lg:h-80"
								style={{
									opacity: getCardStyles(card.index).opacity,
									transform: `scale(${getCardStyles(card.index).scale})`,
									filter: getCardStyles(card.index).filter
								}}
							>
								{'type' in card && card.type === 'gradient' ? (
									<div className={`absolute inset-0 ${card.gradientClass}`}>
										<div className="flex h-full w-full items-center justify-center text-6xl sm:text-7xl md:text-8xl">
											<span role="img" aria-label="sports">
												{card.emoji}
											</span>
										</div>
									</div>
								) : (
									<img
										src={(card as any).imageSrc}
										alt={(card as any).alt}
										className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
									/>
								)}
								<div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent" />
								<div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 md:p-6">
									<h3 className="mb-2 text-lg font-bold text-white sm:text-xl md:text-2xl">{card.title}</h3>
									<p className="text-xs text-gray-200 sm:text-sm md:text-base text-left max-md:hidden">{card.description}</p>
									<div className="flex items-center justify-end gap-3">
										<a
											href={card.ctaHref}
											target="_blank"
											rel="noopener noreferrer"
											className={`${unifiedButtonClass} block w-fit`}
										>
											Join Clan
										</a>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</section>
	);
};
