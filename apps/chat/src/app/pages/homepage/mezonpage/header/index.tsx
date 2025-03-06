import { selectIsLogin } from '@mezon/store';
import { Icons, Image } from '@mezon/ui';
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
}

const HeaderMezon = memo((props: HeaderProps) => {
	const isLogin = useSelector(selectIsLogin);
	const { sideBarIsOpen, toggleSideBar, scrollToSection } = props;
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

	const NavLink: React.FC<NavLinkProps> = ({ href, section, label }) => (
		<a
			href={href}
			onClick={(event) => scrollToSection(section, event)}
			className="border-b-2 border-transparent shadow-none text-[16px] leading-[24px] text-[#7C92AF] font-semibold flex flex-row items-center px-[2px] hover:border-[#8FA7BF] hover:text-[#8FA7BF] focus:border-transparent focus:rounded-lg focus:shadow-[0px_0px_0px_4px_#678FFF]"
		>
			{label}
		</a>
	);

	return (
		<div
			className={`layout fixed flex flex-col items-center w-full ${isScrolled ? 'bg-[#0B0E2D4D] z-50 shadow-[0px_4px_12px_0px_#0B0E2D26] backdrop-blur-[24px]' : ''} h-[80px] max-md:h-[72px]`}
		>
			<div ref={refHeader} className={`header fixed z-50 w-10/12 max-lg:w-full max-md:border-b-[1px] max-md:border-[#4465FF4D]`}>
				<div className="flex items-center justify-between md:px-[32px] max-md:px-[16px] max-md:py-[14px] h-[80px] max-md:h-[72px]">
					<div className="flex items-center gap-[40px]">
						<Link to={'/mezon'} className="flex items-center gap-[4.92px]">
							<Image
								src={`assets/images/mezon-logo-black.svg`}
								alt={'logoMezon'}
								width={32}
								height={32}
								className="aspect-square object-cover"
							/>
							<div className="font-semibold text-[22.15px] leading-[26.58px] tracking-[0.06em] font-['Poppins']">mezon</div>
						</Link>
						<div className="hidden md:flex items-center gap-[32px]">
							<NavLink href="#home" section="home" label="Home" />
							<NavLink href="#overview" section="overview" label="Overview" />
							<NavLink href="#feature" section="feature" label="Features" />
							<a
								href={'developers/applications'}
								target="_blank"
								rel="noopener noreferrer"
								className="border-b-2 border-transparent shadow-none text-[16px] leading-[24px] text-[#7C92AF] font-semibold flex flex-row items-center px-[2px] hover:border-[#8FA7BF] hover:text-[#8FA7BF] focus:border-transparent focus:rounded-lg focus:shadow-[0px_0px_0px_4px_#678FFF]"
							>
								Developers
							</a>
						</div>
					</div>
					<div className="w-fit">
						<Link
							className="hidden md:block px-[16px] py-[10px] bg-[#1024D4] rounded-lg text-[#F4F7F9] text-[16px] leading-[24px] hover:bg-[#0C1AB2] focus:bg-[#281FB5] whitespace-nowrap"
							to={'/mezon'}
						>
							{isLogin ? 'Open Mezon' : 'Login'}
						</Link>
						<Icons.HomepageMenu className="hidden w-[40px] max-md:block" onClick={toggleSideBar} />
					</div>
				</div>

				{!sideBarIsOpen && (
					<div className="hidden max-md:block absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[300px] h-[200px] bg-[#1024D4] rounded-[50%] filter blur-[75px] mix-blend-color-dodge"></div>
				)}
			</div>
		</div>
	);
});

export default HeaderMezon;
