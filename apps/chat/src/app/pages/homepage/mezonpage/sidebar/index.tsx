import { authActions, selectIsLogin, useAppDispatch } from '@mezon/store';
import debounce from 'lodash.debounce';
import { memo, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

interface SideBarProps {
	sideBarIsOpen: boolean;
	toggleSideBar: () => void;
	scrollToSection: (id: string, event: React.MouseEvent) => void;
}

export const SideBarMezon = memo((props: SideBarProps) => {
	const { t } = useTranslation('homepage');
	const isLogin = useSelector(selectIsLogin);
	const dispatch = useAppDispatch();
	const { sideBarIsOpen, scrollToSection } = props;

	const [bodySideBarRef, setBodySideBarRef] = useState(0);
	const headerSideBarRef = useRef<HTMLDivElement>(null);
	const footerSideBarRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const updateBodyHeight = debounce(() => {
			const headerHeight = headerSideBarRef.current?.offsetHeight || 0;
			const footerHeight = footerSideBarRef.current?.offsetHeight || 0;
			const windowHeight = window.innerHeight;
			const headerTopHeight = 72;

			setBodySideBarRef(windowHeight - headerHeight - footerHeight - headerTopHeight);
		}, 100);

		updateBodyHeight();
		window.addEventListener('resize', updateBodyHeight);

		return () => {
			window.removeEventListener('resize', updateBodyHeight);
		};
	}, [sideBarIsOpen]);

	return (
		<div
			className={`fixed top-[72px] left-0 right-0 z-40 w-full bg-[#0B0E2D] transform transition-all duration-300 ease-in-out max-lg:block hidden ${
				sideBarIsOpen ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
			}`}
			style={{ maxHeight: 'calc(100vh - 72px)' }}
		>
			<div
				className="px-[16px] py-[16px] flex flex-col gap-[16px] overflow-y-auto"
				style={{
					backgroundRepeat: 'no-repeat',
					backgroundSize: 'cover',
					backgroundPosition: 'center',
					maxHeight: `${bodySideBarRef}px`
				}}
			>
				<a
					href="#home"
					onClick={(event) => scrollToSection('home', event)}
					className="text-center px-[16px] py-[10px] text-[#F4F7F9] font-semibold text-[16px] leading-[24px] hover:bg-[#0C1AB2] hover:rounded-[8px] focus:rounded-[8px] focus:bg-[#281FB5]"
				>
					{t('header.home')}
				</a>
				<a
					href={'developers/'}
					target="_blank"
					rel="noopener noreferrer"
					className="text-center px-[16px] py-[10px] text-[#F4F7F9] font-semibold text-[16px] leading-[24px] hover:bg-[#0C1AB2] hover:rounded-[8px] focus:rounded-[8px] focus:bg-[#281FB5]"
				>
					{t('header.developers')}
				</a>
				<a
					href={'https://top.mezon.ai'}
					target="_blank"
					rel="noopener noreferrer"
					className="text-center px-[16px] py-[10px] text-[#F4F7F9] font-semibold text-[16px] leading-[24px] hover:bg-[#0C1AB2] hover:rounded-[8px] focus:rounded-[8px] focus:bg-[#281FB5]"
				>
					{t('header.botsApps')}
				</a>
				<a
					href={'docs/'}
					target="_blank"
					rel="noopener noreferrer"
					className="text-center px-[16px] py-[10px] text-[#F4F7F9] font-semibold text-[16px] leading-[24px] hover:bg-[#0C1AB2] hover:rounded-[8px] focus:rounded-[8px] focus:bg-[#281FB5]"
				>
					{t('header.documents')}
				</a>
				<a
					href={'clans/'}
					target="_blank"
					rel="noopener noreferrer"
					className="text-center px-[16px] py-[10px] text-[#F4F7F9] font-semibold text-[16px] leading-[24px] hover:bg-[#0C1AB2] hover:rounded-[8px] focus:rounded-[8px] focus:bg-[#281FB5]"
				>
					{t('header.discover')}
				</a>
				<a
					href={'blogs/'}
					target="_blank"
					rel="noopener noreferrer"
					className="text-center px-[16px] py-[10px] text-[#F4F7F9] font-semibold text-[16px] leading-[24px] hover:bg-[#0C1AB2] hover:rounded-[8px] focus:rounded-[8px] focus:bg-[#281FB5]"
				>
					{t('header.blogs')}
				</a>

				<Link
					className="text-center px-[16px] py-[10px] rounded-[8px] bg-white text-[#6E4A9E] font-bold text-[16px] leading-[24px] hover:opacity-90 transition-opacity whitespace-nowrap"
					to={isLogin ? '/meet' : '/mezon'}
					onClick={() => {
						if (!isLogin) {
							dispatch(authActions.setRedirectUrl('/meet'));
						}
					}}
				>
					Quick Meeting
				</Link>
				<Link
					className="text-center px-[16px] py-[10px] rounded-[8px] bg-[#1024D4] text-[#F4F7F9] font-semibold text-[16px] leading-[24px] hover:bg-[#0C1AB2] focus:bg-[#281FB5] whitespace-nowrap"
					to={'/mezon'}
				>
					{isLogin ? t('header.openMezon') : t('header.login')}
				</Link>
			</div>
		</div>
	);
});
