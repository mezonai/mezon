import mezonPackage from '@mezon/package-js';
import { Icons } from '@mezon/ui';
import { getPlatform } from '@mezon/utils';
import type { RefObject } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface HeroSectionProps {
	homeRef: RefObject<HTMLDivElement>;
	isVisible: boolean;
}

export const HeroSection = ({ homeRef, isVisible }: HeroSectionProps) => {
	const { t } = useTranslation('homepage');
	const platform = getPlatform();
	const version = mezonPackage.version;
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const [isImageLoaded, setIsImageLoaded] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	const downloadLinks = {
		windows: 'https://apps.microsoft.com/detail/9pf25lf1fj17',
		windowsPortable: `${process.env.NX_BASE_IMG_URL}/release/mezon-${version}-win-x64-portable.exe`,
		macos: 'https://apps.apple.com/vn/app/mezon-desktop/id6756601798?mt=12',
		macosIntel: 'https://apps.apple.com/vn/app/mezon-desktop/id6756601798?mt=12',
		linux: `${process.env.NX_BASE_IMG_URL}/release/mezon-${version}-linux-amd64.deb`
	};

	const handleTryMezon = () => {
		if (platform === 'iOS') {
			window.open('https://apps.apple.com/vn/app/mezon/id6502750046', '_blank');
		} else if (platform === 'Android') {
			window.open('https://play.google.com/store/apps/details?id=com.mezon.mobile', '_blank');
		} else {
			setIsDropdownOpen(!isDropdownOpen);
		}
	};

	const handleClickOutside = (event: MouseEvent) => {
		if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
			setIsDropdownOpen(false);
		}
	};

	useEffect(() => {
		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, []);

	return (
		<section className="w-full bg-white pt-32 pb-16 max-md:pt-24 max-md:pb-12 2xl:py-[193px]" id="home" ref={homeRef}>
			<div className="container w-10/12 max-lg:w-full max-md:px-4 mx-auto">
				<div
					className={`flex flex-col items-center text-center gap-8 transition-opacity duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
				>
					<h1 className="font-svnAvo text-6xl max-md:text-4xl max-sm:text-3xl font-bold max-w-4xl text-stone-900">
						{t('sections.hero.title.your')} <span className="text-purple-600">{t('sections.hero.title.live')}</span>,{' '}
						<span className="text-purple-600">{t('sections.hero.title.work')}</span>,{' '}
						<span className="text-purple-600">{t('sections.hero.title.play')}</span> {t('sections.hero.title.platform')}{' '}
						{t('sections.hero.title.theBest')} {t('sections.hero.title.discordAlternative')}
					</h1>

					<p className="font-svnAvo text-xl max-md:text-lg text-gray-600 max-w-3xl">
						<span className="text-purple-600 ">Mezon </span>
						{t('sections.hero.description')} <span className="text-purple-600 ">{t('sections.hero.talk')}</span>,{' '}
						<span className="text-purple-600 ">{t('sections.hero.play')}</span>
						{t('sections.hero.and')} <span className="text-purple-600 ">{t('sections.hero.hangOut')}</span>.
					</p>

					<div className="relative" ref={dropdownRef}>
						<button
							onClick={handleTryMezon}
							className="px-[17px] py-[8px] md:px-8 md:py-4  bg-purple-600 text-white rounded-full text-lg  hover:bg-purple-700 transition-all border-4 border-purple-300 shadow-lg"
						>
							{t('sections.hero.tryButton')}
						</button>

						{isDropdownOpen && (
							<div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-white rounded-2xl shadow-2xl p-4 min-w-[250px] z-[9999] border border-purple-200">
								<div className="text-center mb-3 text-sm  text-gray-700">{t('sections.hero.choosePlatform')}</div>
								<div className="flex flex-col gap-2">
									<a
										href={downloadLinks.windows}
										target="_blank"
										rel="noopener noreferrer"
										className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 transition-all border border-gray-200 hover:border-purple-300  text-purple-500 hover:text-pink-500 "
									>
										<Icons.Windows className="w-6 h-6 " />
										<span className="font-medium text-gray-800 group-hover:text-purple-600">Windows (Store)</span>
									</a>
									<a
										href={downloadLinks.windowsPortable}
										target="_blank"
										rel="noopener noreferrer"
										className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 transition-all border border-gray-200 hover:border-purple-300  text-purple-500 hover:text-pink-500 "
									>
										<Icons.Windows className="w-6 h-6 " />
										<span className="font-medium text-gray-800 group-hover:text-purple-600">Windows (Portable)</span>
									</a>
									<a
										href={downloadLinks.macos}
										className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 transition-all border border-gray-200 hover:border-purple-300  text-purple-500 hover:text-pink-500 "
									>
										<Icons.Apple className="w-6 h-6 " />
										<span className="font-medium text-gray-800 group-hover:text-purple-600">macOS (Apple)</span>
									</a>
									<a
										href={downloadLinks.macosIntel}
										className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 transition-all border border-gray-200 hover:border-purple-300  text-purple-500 hover:text-pink-500 "
									>
										<Icons.Apple className="w-6 h-6 " />
										<span className="font-medium text-gray-800 group-hover:text-purple-600">macOS (Intel)</span>
									</a>
									<a
										href={downloadLinks.linux}
										className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 transition-all border border-gray-200 hover:border-purple-300  text-purple-500 hover:text-pink-500 "
									>
										<Icons.Linux className="w-6 h-6 " />
										<span className="font-medium text-gray-800 group-hover:text-purple-600">Linux</span>
									</a>
								</div>
							</div>
						)}
					</div>

					<div className="w-full max-w-6xl mt-8 relative">
						<div
							className={`absolute inset-0 bg-purple-600 rounded-lg transition-opacity duration-300 ${isImageLoaded ? 'opacity-0' : 'opacity-100'}`}
						/>
						<img
							src="https://cdn.mezon.ai/landing-page-mezon/herosectionmezon.webp"
							alt="Mezon Platform Preview"
							className="w-full h-auto relative z-10"
							onLoad={() => setIsImageLoaded(true)}
						/>

						<div className="absolute top-10 left-10 max-md:left-2 max-md:top-5 bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold shadow-lg z-20">
							#wol
						</div>
						<div className="absolute top-1/4 right-10 max-md:right-2 bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold shadow-lg">
							#synda
						</div>
						<div className="absolute bottom-20 left-20 max-md:left-5 max-md:bottom-10 bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold shadow-lg">
							#daily
						</div>
						<div className="absolute bottom-32 right-16 max-md:right-5 max-md:bottom-16 bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold shadow-lg">
							#help
						</div>
						<div className="absolute top-1/2 right-8 max-md:right-2 bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold shadow-lg">
							#order
						</div>
					</div>
				</div>
			</div>
		</section>
	);
};
