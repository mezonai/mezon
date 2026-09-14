import { throttle } from 'lodash';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, NavLink } from 'react-router-dom';
import { MEZON_LOGO, NAVIGATION_LINKS, Z_INDEX } from '../../constants/constants';

interface HeaderProps {
	sideBarIsOpen: boolean;
	toggleSideBar: () => void;
	overlay?: boolean;
}

const getIsLogin = () => {
	try {
		const raw = localStorage.getItem('persist:auth');
		if (!raw) return false;
		const parsed = JSON.parse(raw);
		const state = typeof parsed === 'string' ? JSON.parse(parsed) : parsed;
		return state?.isLogin === true || state?.isLogin === 'true';
	} catch {
		return false;
	}
};

const HeaderMezon = memo((props: HeaderProps) => {
	const { t } = useTranslation('discover');
	const { sideBarIsOpen, toggleSideBar, overlay = false } = props;
	const refHeader = useRef<HTMLDivElement>(null);
	const [isScrolled, setIsScrolled] = useState(false);
	const isLogin = getIsLogin();
	const openMezonHref = `${process.env.NX_CHAT_APP_REDIRECT_URI}/mezon`;
	const isOverlay = overlay && !isScrolled && !sideBarIsOpen;

	const handleScroll = useMemo(
		() =>
			throttle(() => {
				setIsScrolled(window.scrollY > 40);
			}, 100),
		[]
	);

	useEffect(() => {
		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	}, [handleScroll]);

	useEffect(() => {
		handleScroll();
	}, [handleScroll]);

	useEffect(() => {
		if (sideBarIsOpen) {
			const originalOverflow = document.body.style.overflow;
			document.body.style.overflow = 'hidden';
			return () => {
				document.body.style.overflow = originalOverflow || '';
			};
		}
		document.body.style.overflow = '';
	}, [sideBarIsOpen]);

	const navIdle = isOverlay
		? 'text-white/80 hover:text-white hover:bg-white/10'
		: 'text-[var(--text-secondary)] hover:text-[var(--color-brand-primary)] hover:bg-gray-100';
	const navActive = isOverlay
		? 'text-white underline decoration-2 decoration-[#de82e6] underline-offset-8'
		: 'text-[var(--color-brand-primary)] underline decoration-2 underline-offset-4 hover:bg-gray-100';
	const menuBtn = isOverlay ? 'text-white hover:bg-white/10' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-gray-100';
	const cta = isOverlay ? 'bg-white text-[#6E4A9E] hover:bg-[#f4f7f9]' : 'bg-[#8960e0] text-white hover:bg-[#7a52d4]';

	try {
		return (
			<div
				className={`layout fixed flex flex-col items-center w-full transition-all duration-300 h-[80px] max-md:h-[72px] z-[100] ${
					isOverlay ? 'bg-transparent' : 'bg-[var(--surface-elevated)]'
				} ${isScrolled && !isOverlay ? 'lg:shadow-sm lg:backdrop-blur-md' : ''}`}
			>
				<div
					ref={refHeader}
					className={`header fixed z-[${Z_INDEX.HEADER}] w-10/12 max-lg:w-full ${
						isOverlay ? '' : 'max-md:border-b max-md:border-[var(--border-subtle)]'
					}`}
				>
					<div className="flex items-center justify-between md:px-[32px] max-md:px-[16px] max-md:py-[14px] h-[80px] max-md:h-[72px]">
						<div className="flex items-center gap-[40px]">
							<a href="/clans" className="flex items-center gap-2">
								<img src={isOverlay ? MEZON_LOGO.DARK : MEZON_LOGO.LIGHT} alt="" className="w-11 h-11 aspect-square object-contain" />
								<img
									src={MEZON_LOGO.WORDMARK}
									alt="Mezon"
									className={`h-6 md:h-7 w-auto object-contain ${isOverlay ? '' : 'brightness-0'}`}
								/>
							</a>
							<div className="hidden lg:flex items-center gap-[32px]">
								{Object.entries(NAVIGATION_LINKS).map(([key, link]) =>
									key === 'DISCOVER' ? (
										<NavLink
											key={key}
											to={link.url}
											className={({ isActive }) =>
												`text-[16px] leading-[24px] font-semibold flex flex-row items-center px-3 py-2 rounded-md transition-colors ${
													isActive ? navActive : navIdle
												}`
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
											className={`text-[16px] leading-[24px] font-semibold flex flex-row items-center px-3 py-2 rounded-md transition-colors ${navIdle}`}
										>
											{link.label}
										</a>
									)
								)}
							</div>
						</div>
						<div className="w-fit flex items-center gap-2">
							<a
								href={openMezonHref}
								className={`hidden lg:inline-flex items-center min-h-[40px] px-4 rounded-full text-sm font-semibold ${cta}`}
							>
								{isLogin ? t('header.openMezon') : t('header.login')}
							</a>
							<button
								className={`max-lg:block lg:hidden p-2 rounded-md transition-colors ${menuBtn}`}
								onClick={toggleSideBar}
								aria-label="Menu"
							>
								{sideBarIsOpen ? (
									<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
									</svg>
								) : (
									<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
									</svg>
								)}
							</button>
						</div>
					</div>
				</div>

				{sideBarIsOpen && (
					<>
						<div className="max-lg:block lg:hidden fixed top-[72px] left-0 right-0 bottom-0 bg-black/50 z-[99]" onClick={toggleSideBar} />
						<div className="max-lg:block lg:hidden fixed top-[72px] left-0 right-0 bg-[var(--surface-elevated)] border-t border-[var(--border-subtle)] shadow-sm z-[100]">
							<div className="container mx-auto px-4 py-3">
								<nav className="flex flex-col space-y-3">
									{Object.entries(NAVIGATION_LINKS).map(([key, link]) =>
										key === 'DISCOVER' ? (
											<NavLink
												key={key}
												to={link.url}
												className={({ isActive }) =>
													`font-semibold py-1 transition-colors ${
														isActive
															? 'text-[var(--color-brand-primary)] underline decoration-2 underline-offset-4'
															: 'text-[var(--text-secondary)] hover:text-[var(--color-brand-primary)]'
													}`
												}
											>
												{link.label}
											</NavLink>
										) : (
											<a
												key={key}
												href={link.url}
												className="font-semibold text-[var(--text-secondary)] hover:text-[var(--color-brand-primary)] py-2 transition-colors"
											>
												{link.label}
											</a>
										)
									)}
									<a href={openMezonHref} className="font-semibold text-[var(--color-brand-primary)] py-2">
										{isLogin ? t('header.openMezon') : t('header.login')}
									</a>
								</nav>
							</div>
						</div>
					</>
				)}
			</div>
		);
	} catch (error) {
		console.error('Error rendering header:', error);
		return (
			<div
				className={`fixed top-0 left-0 right-0 z-[${Z_INDEX.HEADER}] bg-[var(--surface-elevated)] h-[80px] max-md:h-[72px] border-b border-[var(--border-default)]`}
			>
				<div className="container mx-auto flex items-center justify-between px-4 h-full">
					<Link to={'/'} className="flex items-center gap-2">
						<img src={MEZON_LOGO.LIGHT} alt="" className="w-12 h-12 object-contain" />
						<img src={MEZON_LOGO.WORDMARK} alt="Mezon" className="h-6 w-auto object-contain brightness-0" />
					</Link>
					<button
						className="max-lg:block lg:hidden p-2 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-gray-100"
						onClick={toggleSideBar}
					>
						<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
						</svg>
					</button>
				</div>
			</div>
		);
	}
});

export default HeaderMezon;
