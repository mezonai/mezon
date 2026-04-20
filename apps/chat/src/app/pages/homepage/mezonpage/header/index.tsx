import { authActions, selectIsLogin, useAppDispatch } from '@mezon/store';
import { Icons, Image } from '@mezon/ui';
import { generateE2eId } from '@mezon/utils';
import throttle from 'lodash/throttle';
import React, { memo, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

interface HeaderProps {
	sideBarIsOpen: boolean;
	toggleSideBar: () => void;
	scrollToSection: (id: string, event: React.MouseEvent) => void;
}

interface NavLinkProps {
	href: string;
	section: string;
	label: string;
	onClick: (id: string, event: React.MouseEvent) => void;
}

const NavItem = memo(({ href, section, label, onClick }: NavLinkProps) => (
	<a
		href={href}
		onClick={(event) => onClick(section, event)}
		className="relative text-[13px] lg:text-[14px] xl:text-[16px] leading-[24px] text-white font-semibold flex flex-row items-center px-1 lg:px-2 xl:px-3 py-2 rounded-lg transition-all duration-300 group overflow-hidden whitespace-nowrap"
		data-e2e={generateE2eId('homepage.header.link')}
	>
		<span className="relative z-10 group-hover:text-white transition-colors duration-300">{label}</span>
		<span className="absolute inset-0 bg-[#de82e6] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
	</a>
));

const HeaderMezon = memo((props: HeaderProps) => {
	const { t } = useTranslation('homepage');
	const isLogin = useSelector(selectIsLogin);
	const dispatch = useAppDispatch();
	const { sideBarIsOpen, toggleSideBar, scrollToSection } = props;

	const [isScrolled, setIsScrolled] = useState(false);

	const trackHeaderLoginClick = (action: string) => {
		if (typeof window !== 'undefined' && (window as any).gtag) {
			(window as any).gtag('event', 'Login Button', {
				event_category: 'Login Button',
				event_label: action,
				custom_parameter_1: 'mezon_header_login'
			});
		}
	};

	const handleScroll = useCallback(
		throttle(() => {
			setIsScrolled(window.scrollY > 20);
		}, 100),
		[]
	);

	useEffect(() => {
		window.addEventListener('scroll', handleScroll);
		handleScroll();
		return () => window.removeEventListener('scroll', handleScroll);
	}, [handleScroll]);

	return (
		<header
			className={`fixed flex flex-col items-center w-full z-50 transition-all duration-500 ease-in-out ${
				isScrolled ? 'bg-[#8960e0]/90 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.15)] h-[70px]' : 'bg-[#8960e0] h-[80px]'
			} max-md:h-[72px]`}
		>
			<div
				className="w-[95%] xl:w-10/12 max-md:border-b-[1px] max-md:border-[#4465FF4D] h-full"
				data-e2e={generateE2eId('homepage.header.container.navigation')}
			>
				<div className="flex items-center justify-between md:px-[10px] xl:px-[32px] h-full gap-2">
					<div className="hidden lg:flex items-center flex-shrink-0 min-w-[200px] lg:min-w-[220px] xl:min-w-[260px]">
						<Link to="/" className="flex items-center hover:scale-110 transition-transform duration-300 active:scale-95">
							<Image
								src="https://cdn.mezon.ai/landing-page-mezon/mezonlogonew.png"
								width={40}
								height={40}
								className="object-cover drop-shadow-md"
							/>
						</Link>
					</div>
					<nav className="hidden lg:flex items-center justify-center flex-1 min-w-0 gap-x-1 xl:gap-x-2">
						<NavItem href="#home" section="home" label={t('header.home')} onClick={scrollToSection} />

						{[
							{ href: 'developers/', label: t('header.developers') },
							{ href: 'https://top.mezon.ai', label: t('header.botsApps') },
							{ href: 'docs/', label: t('header.documents') },
							{ href: 'clans/', label: t('header.discover') },
							{ href: 'blogs/', label: t('header.blogs') }
						].map((link) => (
							<a
								key={link.href}
								href={link.href}
								target="_blank"
								rel="noopener noreferrer"
								className="relative text-[13px] lg:text-[14px] xl:text-[16px] leading-[24px] text-white font-semibold flex flex-row items-center px-1 lg:px-2 xl:px-3 py-2 rounded-lg transition-all duration-300 group overflow-hidden whitespace-nowrap"
							>
								<span className="relative z-10">{link.label}</span>
								<span className="absolute inset-0 bg-[#de82e6] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
							</a>
						))}
					</nav>
					<div className="flex items-center justify-end gap-1.5 lg:gap-2 xl:gap-4 flex-shrink-0 min-w-fit lg:min-w-[220px] xl:min-w-[260px] ml-auto">
						<Link
							to={isLogin ? '/meet' : '/mezon'}
							className="hidden lg:flex items-center px-3 xl:px-[20px] py-[10px] bg-white/10 border border-white/20 backdrop-blur-sm rounded-xl text-white text-[14px] xl:text-[16px] font-bold whitespace-nowrap hover:bg-[#de82e6] hover:border-[#de82e6] hover:scale-105 active:scale-95 transition-all duration-300 shadow-sm"
							onClick={() => !isLogin && dispatch(authActions.setRedirectUrl('/meet'))}
						>
							<span className="xl:inline">Mezon Meet</span>
						</Link>

						<Link
							to="/mezon"
							className="hidden lg:flex items-center px-3 xl:px-[20px] py-[10px] bg-white rounded-xl text-[#6E4A9E] text-[14px] xl:text-[16px] font-bold whitespace-nowrap hover:shadow-[0_0_15px_rgba(255,255,255,0.4)] hover:scale-105 active:scale-95 transition-all duration-300"
							onClick={() => trackHeaderLoginClick(isLogin ? 'Open Mezon' : 'Login')}
							data-e2e={generateE2eId('homepage.header.button.login')}
						>
							{isLogin ? t('header.openMezon') : t('header.login')}
						</Link>

						<div className="lg:hidden flex w-[40px] h-[40px] items-center justify-center hover:bg-white/10 rounded-full transition-colors duration-200">
							{sideBarIsOpen ? (
								<Icons.MenuClose className="w-[26px] h-[26px] cursor-pointer text-white" onClick={toggleSideBar} />
							) : (
								<Icons.HomepageMenu className="w-[40px] cursor-pointer text-white" onClick={toggleSideBar} />
							)}
						</div>
					</div>
				</div>
			</div>
		</header>
	);
});

export default HeaderMezon;
