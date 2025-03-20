import { selectIsLogin } from '@mezon/store';
import { Icons, Image } from '@mezon/ui';
import debounce from 'lodash.debounce';
import { memo, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

interface SideBarProps {
	sideBarIsOpen: boolean;
	toggleSideBar: () => void;
	scrollToSection: (id: string, event: React.MouseEvent) => void;
}

export const SideBarMezon = memo((props: SideBarProps) => {
	const isLogin = useSelector(selectIsLogin);
	const { sideBarIsOpen, toggleSideBar, scrollToSection } = props;

	const [bodySideBarRef, setBodySideBarRef] = useState(0);
	const headerSideBarRef = useRef<HTMLDivElement>(null);
	const footerSideBarRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const updateBodyHeight = debounce(() => {
			const headerHeight = headerSideBarRef.current?.offsetHeight || 0;
			const footerHeight = footerSideBarRef.current?.offsetHeight || 0;
			const windowHeight = window.innerHeight;

			setBodySideBarRef(windowHeight - headerHeight - footerHeight);
		}, 100);

		updateBodyHeight();
		window.addEventListener('resize', updateBodyHeight);

		if (sideBarIsOpen) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = 'auto';
		}

		return () => {
			document.body.style.overflow = 'auto';
			window.removeEventListener('resize', updateBodyHeight);
		};
	}, [sideBarIsOpen]);

	return (
		<div
			className={`fixed h-full z-50 w-full bg-[#0B0E2D] transform transition-transform duration-300 ease-in-out ${sideBarIsOpen ? 'translate-x-0' : '-translate-x-full'}`}
		>
			<div ref={headerSideBarRef} className="flex items-center justify-between pt-[14px] pr-[16px] pb-[14px] pl-[16px] h-[72px] relative">
				<Link to={'/mezon'} className="flex gap-[4.92px] items-center">
					<Image src={`assets/images/mezon-logo-black.svg`} width={32} height={32} className="aspect-square object-cover" />
					<div className="font-semibold text-[22.15px] leading-[26.58px] tracking-[0.06em] font-['Poppins']">mezon</div>
				</Link>
				<Icons.MenuClose className="w-[20px] max-lg:block" onClick={toggleSideBar} />

				<div className="hidden max-md:block absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[300px] h-[200px] bg-[#8D72C5] rounded-[50%] filter blur-[70px] mix-blend-color-dodge"></div>
			</div>

			<div
				className="px-[16px] py-[16px] flex flex-col gap-[16px] h-full"
				style={{
					backgroundImage: 'url(../../../assets/header-bg-mobile.png)',
					backgroundRepeat: 'no-repeat',
					backgroundSize: 'cover',
					backgroundPosition: 'center',
					height: `${bodySideBarRef}px`
				}}
			>
				<a
					href="#home"
					onClick={(event) => scrollToSection('home', event)}
					className="text-center px-[16px] py-[10px] text-[#F4F7F9] font-semibold text-base hover:bg-[#0C1AB2] hover:rounded-[8px] focus:rounded-[8px] focus:bg-[#281FB5]"
				>
					Home
				</a>
				<a
					href="#overview"
					onClick={(event) => scrollToSection('overview', event)}
					className="text-center px-[16px] py-[10px] text-[#F4F7F9] font-semibold text-base hover:bg-[#0C1AB2] hover:rounded-[8px] focus:rounded-[8px] focus:bg-[#281FB5]"
				>
					Overview
				</a>
				<a
					href="#feature"
					onClick={(event) => scrollToSection('feature', event)}
					className="text-center px-[16px] py-[10px] text-[#F4F7F9] font-semibold text-base hover:bg-[#0C1AB2] hover:rounded-[8px] focus:rounded-[8px] focus:bg-[#281FB5]"
				>
					Features
				</a>
				<a
					href={'developers/applications'}
					target="_blank"
					rel="noopener noreferrer"
					className="text-center px-[16px] py-[10px] text-[#F4F7F9] font-semibold text-base hover:bg-[#0C1AB2] hover:rounded-[8px] focus:rounded-[8px] focus:bg-[#281FB5]"
				>
					Developers
				</a>

				<Link
					className="text-center px-[16px] py-[10px] rounded-[8px] bg-[#1024D4] text-[#F4F7F9] font-semibold text-base hover:bg-[#0C1AB2] focus:bg-[#281FB5] whitespace-nowrap"
					to={'/mezon'}
				>
					{isLogin ? 'Open Mezon' : 'Login'}
				</Link>
			</div>

			<div ref={footerSideBarRef} className="container w-full py-[48px] absolute bottom-0">
				<div className="flex flex-col gap-[24px] max-lg:px-[32px]">
					<div className="flex items-center gap-[24px]">
						<a href="https://www.linkedin.com/company/nccplus-vietnam" target="_blank" rel="noreferrer" className="cursor-pointer">
							<Image src={`assets/instagram.svg`} />
						</a>
						<a href="https://www.facebook.com/profile.php?id=61558081847939" target="_blank" rel="noreferrer" className="cursor-pointer">
							<Image src={`assets/facebook.svg`} />
						</a>
						<a href="https://github.com/nccasia/mezon-fe" target="_blank" rel="noreferrer" className="cursor-pointer">
							<Image src={`assets/twitter.svg`} />
						</a>
					</div>
					<div className="font-normal text-[16px] leading-[24px] text-[#7C92AF]">© 2024 Mezon. All rights reserved.</div>
				</div>
			</div>
		</div>
	);
});
