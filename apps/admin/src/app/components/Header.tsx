import { useAuth } from '@mezon/core';
import { authActions, useAppDispatch } from '@mezon/store';
import { Icons, Image } from '@mezon/ui';
import { createImgproxyUrl } from '@mezon/utils';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import IconDarkMode from '../../assets/icons/IconDarkMode.png';
import IconLightMode from '../../assets/icons/IconLightMode.png';
import { useAppearance } from '../context/AppearanceContext';

interface IHeaderProps {
	toggleSideBar: () => void;
}

const Header = ({ toggleSideBar }: IHeaderProps) => {
	const { userProfile } = useAuth();
	const [showMenu, setShowMenu] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);
	const { isDarkMode, toggleDarkMode } = useAppearance();

	const handleAvatarClick = () => {
		setShowMenu(!showMenu);
	};

	const dispatch = useAppDispatch();

	const handleLogout = () => {
		dispatch(authActions.logOut({}));
	};

	const handleClickOutside = (event: MouseEvent) => {
		if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
			setShowMenu(false);
		}
	};

	useEffect(() => {
		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, []);

	return (
		<div
			className={`sticky dark:bg-bgPrimary bg-bgLightPrimary z-40 w-full px-[42px] py-[10px] flex flex-row items-center justify-between border-b-[1px] border-solid ${isDarkMode ? 'dark:border-borderDividerLight' : 'border-bgModifierHoverLight'}`}
		>
			<div className="flex items-center gap-3">
				<div onClick={toggleSideBar} className="w-8 hidden max-lg:block">
					<Icons.MenuBarIcon className="w-full" />
				</div>
				<Link to="/developers/applications" className="flex flex-row items-center justify-center gap-[4px]">
					<Image
						src={`${isDarkMode ? 'assets/images/mezon-logo-black.svg' : 'assets/images/mezon-logo-white.svg'}`}
						width={28}
						height={28}
					/>
					<span className="text-[12px] font-bold dark:text-textPrimary text-colorTextLightMode">MEZON</span>
				</Link>
			</div>
			<div className="flex flex-row items-center justify-center relative">
				<button onClick={toggleDarkMode} className="mr-4">
					<img src={isDarkMode ? IconDarkMode : IconLightMode} alt="Toggle Dark Mode" className="w-6 h-6 bg-white" />
				</button>
				<div onClick={handleAvatarClick}>
					{userProfile?.user?.avatar_url ? (
						<img
							src={createImgproxyUrl(userProfile?.user?.avatar_url ?? '', { width: 300, height: 300, resizeType: 'fit' })}
							className="w-[40px] h-[40px] rounded-full object-cover cursor-pointer"
							alt=""
						/>
					) : (
						<div className="w-[40px] h-[40px] bg-bgDisable rounded-full flex justify-center items-center text-contentSecondary text-[16px] cursor-pointer">
							{(userProfile?.user?.username ?? '').charAt(0).toUpperCase()}
						</div>
					)}
				</div>
				{showMenu && (
					<div
						ref={menuRef}
						className="absolute flex flex-row items-center justify-between gap-[24px] top-[100%] mt-[4px] right-0 p-2 bg-white dark:bg-gray-800 text-black dark:text-white text-[14px] rounded-[4px] shadow-md"
					>
						<div className="flex flex-col">
							<span>Logged in as</span>
							<span className="font-bold">{userProfile?.user?.username ?? ''}</span>
						</div>
						<button onClick={handleLogout} className="text-red-500">
							LogOut
						</button>
					</div>
				)}
			</div>
		</div>
	);
};

export default Header;
