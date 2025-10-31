import { throttle } from 'lodash';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { BREAKPOINTS, MEZON_LOGO, NAVIGATION_LINKS, Z_INDEX } from '../constants/constants';

interface HeaderProps {
	sideBarIsOpen: boolean;
	toggleSideBar: () => void;
}

const HeaderMezon = memo((props: HeaderProps) => {
	const { sideBarIsOpen, toggleSideBar } = props;
	const refHeader = useRef<HTMLDivElement>(null);
	const [isScrolled, setIsScrolled] = useState(false);

	const handleScroll = useCallback(
		throttle(() => {
			const scrolled = window.scrollY > 50;
			setIsScrolled(scrolled);
		}, 0),
		[]
	);

	useEffect(() => {
		window.addEventListener('scroll', handleScroll);
		return () => {
			window.removeEventListener('scroll', handleScroll);
		};
	}, [handleScroll]);

	useEffect(() => {
		handleScroll();
	}, [sideBarIsOpen, handleScroll]);

	try {
		return (
			<div
				className={`layout fixed flex flex-col items-center w-full transition-all duration-300 ${
					isScrolled ? 'bg-white/90 shadow-sm backdrop-blur-md' : 'bg-transparent'
				} h-[80px] max-md:h-[72px] z-[100]`}
			>
				<div ref={refHeader} className={`header fixed z-[${Z_INDEX.HEADER}] w-10/12 max-lg:w-full max-md:border-b max-md:border-gray-100`}>
					<div className="flex items-center justify-between md:px-[32px] max-md:px-[16px] max-md:py-[14px] h-[80px] max-md:h-[72px]">
						<div className="flex items-center gap-[40px]">
							<a href="/clans" className="flex items-center gap-[4.92px]">
								<img src={MEZON_LOGO.LIGHT} alt="Mezon" className="w-11 h-11 aspect-square object-cover" />
								<div className="font-semibold text-[22.15px] leading-[26.58px] tracking-[0.06em] text-gray-900">mezon</div>
							</a>
							<div className={`hidden ${BREAKPOINTS.MOBILE}:flex items-center gap-[32px]`}>
								{Object.entries(NAVIGATION_LINKS).map(([key, link]) =>
									key === 'DISCOVER' ? (
										<NavLink
											key={key}
											to={link.url}
											className={({ isActive }) =>
												`text-[16px] leading-[24px] text-gray-600 font-medium flex flex-row items-center px-[2px] 
												${isActive ? 'text-[#5865f2] underline decoration-2 underline-offset-4' : 'hover:text-[#5865f2]'} 
												transition-colors`
											}
										>
											{link.label}
										</NavLink>
									) : (
										<a
											key={key}
											href={link.url}
											target="_blank"
											rel="noopener noreferrer"
											className="text-[16px] leading-[24px] text-gray-600 font-medium flex flex-row items-center px-[2px] hover:text-[#5865f2] transition-colors"
										>
											{link.label}
										</a>
									)
								)}
							</div>
						</div>
						<div className="w-fit">
							<button
								className={`${BREAKPOINTS.MOBILE}:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors`}
								onClick={toggleSideBar}
							>
								<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
								</svg>
							</button>
						</div>
					</div>
				</div>

				{sideBarIsOpen && (
					<div
						className={`${BREAKPOINTS.MOBILE}:hidden fixed top-[72px] left-0 right-0 bg-white border-t border-gray-100 shadow-sm z-[${Z_INDEX.MOBILE_MENU}]`}
					>
						<div className="container mx-auto px-4 py-3">
							<nav className="flex flex-col space-y-3">
								{Object.entries(NAVIGATION_LINKS).map(([key, link]) =>
									key === 'DISCOVER' ? (
										<NavLink
											key={key}
											to={link.url}
											className={({ isActive }) =>
												`font-medium py-2 transition-colors ${
													isActive
														? 'text-[#5865f2] underline decoration-2 underline-offset-4'
														: 'text-gray-600 hover:text-[#5865f2]'
												}`
											}
										>
											{link.label}
										</NavLink>
									) : (
										<a
											key={key}
											href={link.url}
											className="font-medium text-gray-600 hover:text-[#5865f2] py-2 transition-colors"
										>
											{link.label}
										</a>
									)
								)}
							</nav>
						</div>
					</div>
				)}
			</div>
		);
	} catch (error) {
		console.error('Error rendering header:', error);
		return (
			<div className={`fixed top-0 left-0 right-0 z-[${Z_INDEX.HEADER}] bg-white h-[80px] max-md:h-[72px] border-b border-gray-200`}>
				<div className="container mx-auto flex items-center justify-between px-4 h-full">
					<Link to={'/'} className="flex items-center gap-2">
						<img src={MEZON_LOGO.LIGHT} alt="Mezon" className="w-12 h-12" />
						<div className="font-semibold text-xl">mezon</div>
					</Link>
					<div className="w-fit">
						<button
							className={`${BREAKPOINTS.MOBILE}:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100`}
							onClick={toggleSideBar}
						>
							<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
							</svg>
						</button>
					</div>
				</div>
			</div>
		);
	}
});

export default HeaderMezon;
