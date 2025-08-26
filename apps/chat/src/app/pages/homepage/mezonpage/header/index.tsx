import { selectIsLogin } from '@mezon/store';
import { Icons, Image } from '@mezon/ui';
import { generateE2eId } from '@mezon/utils';
import { throttle } from 'lodash';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
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
	dataE2e?: string;
}

const HeaderMezon = memo((props: HeaderProps) => {
	const isLogin = useSelector(selectIsLogin);
	const { sideBarIsOpen, toggleSideBar, scrollToSection } = props;
	const refHeader = useRef<HTMLDivElement>(null);
	const [isScrolled, setIsScrolled] = useState(false);

	const trackHeaderLoginClick = (action: string) => {
		if (typeof window !== 'undefined' && typeof (window as any).gtag !== 'undefined') {
			(window as any).gtag('event', 'Login Button', {
				event_category: 'Login Button',
				event_label: action,
				custom_parameter_1: 'mezon_header_login'
			});
		}
	};

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

	const NavLink: React.FC<NavLinkProps> = ({ href, section, label, dataE2e }) => (
		<a
			href={href}
			onClick={(event) => scrollToSection(section, event)}
			className="text-[16px] leading-[24px] text-white font-semibold flex flex-row items-center px-2 py-1 rounded-lg hover:bg-[#de82e6]"
			data-e2e={dataE2e}
		>
			{label}
		</a>
	);
	return (
		<div
			className={`layout fixed flex flex-col items-center w-full z-50 bg-gradient-to-r from-[#7E00FF] via-[#9C3FE9] to-[#4B0082] h-[80px] max-md:h-[72px]`}
		>
			<div
				ref={refHeader}
				className={`header fixed z-50 w-10/12 max-lg:w-full  lg:max-xl:w-full max-md:border-b-[1px] max-md:border-[#4465FF4D]`}
				data-e2e={generateE2eId('homepage.header.container.navigation')}
			>
				<div className="flex items-center justify-between md:px-[32px] max-md:px-[16px] max-md:py-[14px] h-[80px] max-md:h-[72px]">
					<div className="flex items-center gap-[40px]">
						<Link to={'/mezon'} className="flex items-center gap-[4.92px] min-w-[120px]">
							<Image src={`assets/logo.png`} width={120} height={35} className="object-cover" />
						</Link>
						<div className="hidden lg:flex items-center gap-3 lg:max-xl:gap-[0.05rem]">
							<NavLink href="#home" section="home" label="Home" dataE2e={generateE2eId('homepage.header.link.home')} />
							<NavLink href="#overview" section="overview" label="Overview" dataE2e={generateE2eId('homepage.header.link.overview')} />
							<NavLink href="#feature" section="feature" label="Features" dataE2e={generateE2eId('homepage.header.link.features')} />
							<a
								href={'developers/applications'}
								target="_blank"
								rel="noopener noreferrer"
								className="text-[16px] leading-[24px] text-white font-semibold flex flex-row items-center px-2 py-1 rounded-lg hover:bg-[#de82e6]"
								data-e2e={generateE2eId('homepage.header.link.developers')}
							>
								Developers
							</a>
							<a
								href={'https://top.mezon.ai'}
								target="_blank"
								rel="noopener noreferrer"
								className="text-[16px] leading-[24px] text-white font-semibold flex flex-row items-center px-2 py-1 rounded-lg hover:bg-[#de82e6]"
							>
								Bots/Apps
							</a>
							<a
								href={'docs/'}
								target="_blank"
								rel="noopener noreferrer"
								className="text-[16px] leading-[24px] text-white font-semibold flex flex-row items-center px-2 py-1 rounded-lg hover:bg-[#de82e6]"
							>
								Documents
							</a>
							<a
								href={'clans/'}
								target="_blank"
								rel="noopener noreferrer"
								className="text-[16px] leading-[24px] text-white font-semibold flex flex-row items-center px-2 py-1 rounded-lg hover:bg-[#de82e6]"
							>
								Discover
							</a>
							<a
								href={'blogs/'}
								target="_blank"
								rel="noopener noreferrer"
								className="text-[16px] leading-[24px] text-white font-semibold flex flex-row items-center px-2 py-1 rounded-lg hover:bg-[#de82e6]"
							>
								Blogs
							</a>
						</div>
					</div>
					<div className={`w-fit lg:pl-5 min-[1505px]:pl-0`}>
						<Link
							className="hidden lg:block px-[16px] py-[10px] bg-[url(assets/button_openmezon.png)] bg-no-repeat rounded-xl text-[#6E4A9E] text-[16px] leading-[24px] font-bold whitespace-nowrap hover:opacity-90 transition-opacity"
							to={'/mezon'}
							onClick={() => trackHeaderLoginClick(isLogin ? 'Open Mezon' : 'Login')}
							data-e2e={generateE2eId('homepage.header.button.login')}
						>
							{isLogin ? 'Open Mezon' : 'Login'}
						</Link>
						<Icons.HomepageMenu className="hidden w-[40px] max-lg:block cursor-pointer" onClick={toggleSideBar} />
					</div>
				</div>
			</div>
		</div>
	);
});

export default HeaderMezon;
