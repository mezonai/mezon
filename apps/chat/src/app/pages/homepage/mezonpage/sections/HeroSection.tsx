import mezonPackage from '@mezon/package-js';
import { getPlatform } from '@mezon/utils';
import type { RefObject } from 'react';
import { useEffect, useRef, useState } from 'react';

interface HeroSectionProps {
	homeRef: RefObject<HTMLDivElement>;
	isVisible: boolean;
}

export const HeroSection = ({ homeRef, isVisible }: HeroSectionProps) => {
	const platform = getPlatform();
	const version = mezonPackage.version;
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	const downloadLinks = {
		windows: `${process.env.NX_BASE_IMG_URL}/release/mezon-${version}-win-x64.exe`,
		macos: `${process.env.NX_BASE_IMG_URL}/release/mezon-${version}-mac-arm64.dmg`,
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
		<section className="w-full bg-gradient-to-b from-white to-gray-50 pt-32 pb-16 max-md:pt-24 max-md:pb-12" id="home" ref={homeRef}>
			<div className="container w-10/12 max-lg:w-full max-md:px-4 mx-auto">
				<div
					className={`flex flex-col items-center text-center gap-8 transition-opacity duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
				>
					<h1 className="text-6xl max-md:text-4xl max-sm:text-3xl font-bold max-w-4xl text-stone-900">
						Your <span className="text-purple-600">Live</span>, <span className="text-purple-600">Work</span>,{' '}
						<span className="text-purple-600">Play</span> Platform. The best Discord Alternative
					</h1>

					<p className="text-xl max-md:text-lg text-gray-600 max-w-3xl">
						<span className="text-purple-600 font-semibold">Mezon </span> is great for playing games and chilling with friends, or even
						building a worldwide community. Customize your own space to <span className="text-purple-600 font-semibold">talk</span>, play
						and <span className="text-purple-600 font-semibold">hang out</span>.
					</p>

					<div className="relative" ref={dropdownRef}>
						<button
							onClick={handleTryMezon}
							className="px-8 py-4 bg-purple-600 text-white rounded-full text-lg font-semibold hover:bg-purple-700 transition-all border-4 border-purple-300 shadow-lg"
						>
							Try Mezon, its free !
						</button>

						{isDropdownOpen && (
							<div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-white rounded-2xl shadow-2xl p-4 min-w-[250px] z-50 border border-purple-200">
								<div className="text-center mb-3 text-sm font-semibold text-gray-700">Choose your platform</div>
								<div className="flex flex-col gap-2">
									{[
										{
											name: 'Windows',
											icon: (
												<path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801" />
											),
											link: downloadLinks.windows
										},
										{
											name: 'macOS',
											icon: (
												<path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
											),
											link: downloadLinks.macos
										},
										{
											name: 'Linux',
											icon: (
												<path d="M12.504 0c-.155 0-.315.008-.48.021-4.226.333-3.105 4.807-3.17 6.298-.076 1.092-.3 1.953-1.05 3.02-.885 1.051-2.127 2.75-2.716 4.521-.278.84-.41 1.719-.287 2.649.123.93.404 1.667.896 2.183l.007.007c.693.84 1.607 1.334 2.582 1.334.713 0 1.404-.244 2.034-.738.63-.494 1.119-1.229 1.415-2.127.297-.9.44-1.96.44-3.08l.007-.007c0-.925-.281-1.668-.842-2.218-.561-.549-1.334-.823-2.281-.823-.697 0-1.334.123-1.908.369-.575.246-1.057.615-1.445 1.107l-.014.014c-.387.491-.683 1.05-.882 1.676-.2.625-.3 1.334-.3 2.127 0 .792.1 1.502.3 2.127.199.626.495 1.185.882 1.676l.014.014c.388.492.87.861 1.445 1.107.574.246 1.211.369 1.908.369.947 0 1.72-.274 2.281-.823.561-.55.842-1.293.842-2.218l-.007-.007c0-1.12-.143-2.18-.44-3.08-.296-.898-.784-1.633-1.415-2.127-.63-.494-1.321-.738-2.034-.738-.975 0-1.889.494-2.582 1.334l-.007.007c-.492.516-.773 1.253-.896 2.183-.123.93.009 1.809.287 2.649.589 1.771 1.831 3.47 2.716 4.521.75 1.067.974 1.928 1.05 3.02.065 1.491-1.056 5.965 3.17 6.298.165.013.325.021.48.021 2.771 0 5.02-2.249 5.02-5.02V5.02C17.524 2.249 15.275 0 12.504 0z" />
											),
											link: downloadLinks.linux
										}
									].map((item) => (
										<a
											key={item.name}
											href={item.link}
											target="_blank"
											rel="noreferrer"
											className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 transition-all border border-gray-200 hover:border-purple-300 group"
										>
											<svg
												className="w-6 h-6 text-purple-500 group-hover:text-pink-500 transition-colors"
												viewBox="0 0 24 24"
												fill="currentColor"
											>
												{item.icon}
											</svg>
											<span className="font-medium text-gray-800 group-hover:text-purple-600">{item.name}</span>
										</a>
									))}
								</div>
							</div>
						)}
					</div>

					<div className="w-full max-w-6xl mt-8 relative">
						<img src="/assets/homepage-bg.png" alt="Mezon Platform Preview" className="w-full h-auto" />

						<div className="absolute top-10 left-10 max-md:left-2 max-md:top-5 bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold shadow-lg">
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
