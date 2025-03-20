import { AppDirectoryList } from '@mezon/components';
import { selectTheme } from '@mezon/store';
import { Button, Icons, Image } from '@mezon/ui';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

interface ICategoryArr {
	icon: JSX.Element;
	title: string;
}

const AppDirectory = () => {
	const categoryArr: ICategoryArr[] = [
		{
			icon: <Icons.GlobalIcon />,
			title: 'All'
		},
		{
			icon: <Icons.TVIcon />,
			title: 'Entertainment'
		},
		{
			icon: <Icons.GamingConsoleIcon />,
			title: 'Games'
		},
		{
			icon: <Icons.ToolIcon />,
			title: 'Moderation and Tools'
		},
		{
			icon: <Icons.IconFriends />,
			title: 'Social'
		},
		{
			icon: <Icons.UtilitiesIcon />,
			title: 'Utilities'
		}
	];
	const appearanceTheme = useSelector(selectTheme);
	const elementHTML = document.documentElement;
	useEffect(() => {
		switch (appearanceTheme) {
			case 'dark':
				elementHTML.classList.add('dark');
				break;
			case 'light':
				elementHTML.classList.remove('dark');
				break;
			default:
				break;
		}
	}, [appearanceTheme]);

	const [inputValue, setInputValue] = useState('');
	const inputOnchange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setInputValue(e.target.value);
	};
	return (
		<div className="dark:text-textAppDirectory text-textLightTheme flex justify-center dark:bg-[#313338] bg-bgLightMode">
			<ExitBtn />
			<div className="w-[1024px] max-lg:w-full max-xl:p-6 py-[32px] flex flex-col gap-8">
				<div className="top-part flex flex-col gap-[32px]">
					<div className="block1 flex gap-[48px] relative flex-1 max-lg:gap-0">
						<div className="block1-left flex-1 flex flex-col gap-[30px]">
							<div className="logo flex gap-[8px] items-center">
								<Image
									src={`assets/images/${appearanceTheme === 'light' ? 'mezon-logo-white.svg' : 'mezon-logo-black.svg'}`}
									width={48}
									height={48}
									className="w-10 aspect-square object-cover"
								/>
								<div className="uppercase font-bold tracking-wide text-[20px] dark:text-textDarkTheme text-textLightTheme">Mezon</div>
								<div className="font-semibold">App Directory</div>
							</div>
							<div className="heading uppercase text-[44px] font-extrabold dark:text-textDarkTheme text-textLightTheme max-lg:text-center">
								Customise your clan with Apps
							</div>
							<div
								className="search-bar relative w-full pr-[16px] flex dark:bg-[#1e1f22] bg-bgLightModeThird items-center rounded-md"
								style={{ boxShadow: 'rgba(0, 0, 0, 0.24) 0px 3px 8px' }}
							>
								<input
									value={inputValue}
									onChange={inputOnchange}
									type="text"
									placeholder="Search thousands of apps"
									className="dark:bg-[#1e1f22] bg-bgLightModeThird flex-1 dark:text-textDarkTheme text-textLightTheme p-[12px] text-[16px] outline-none rounded-l-md"
								/>

								<div className="w-fit">
									{!inputValue ? (
										<Icons.SearchIcon className="dark:text-[#626365] text-textLightTheme w-[25px] cursor-pointer" />
									) : (
										<div className="flex gap-3 items-center">
											<div className="text-[#626365] text-[12px]">'ENTER' to Search</div>
											<Icons.CloseIcon onClick={() => setInputValue('')} className="text-[#626365] w-[25px] cursor-pointer" />
										</div>
									)}
								</div>
							</div>
						</div>
						<div className="text-blue-500 hover:underline cursor-pointer absolute right-8 top-0">Learn More</div>
						<div className="block1-right w-fit flex flex-col justify-end">
							<Image
								src={`assets/images/app-directory-banner.svg`}
								width={48}
								height={48}
								className="object-cover w-[310px] max-lg:hidden"
							/>
						</div>
					</div>
					<div className="block2 flex w-full justify-between max-xl:flex-wrap gap-y-3">
						{categoryArr.map((category, index) => (
							<div
								key={index}
								className="flex gap-[12px] py-3 px-7 dark:bg-[#2b2d31] bg-bgLightModeThird rounded-md dark:hover:bg-[#232428] hover:bg-bgLightModeButton cursor-pointer max-xl:w-[32%] max-lg:w-[49%]"
							>
								<div className="w-6">{category.icon}</div> <div className="truncate">{category.title}</div>
							</div>
						))}
					</div>
					<div className="block3 flex max-lg:flex-col-reverse">
						<div className="b3-left w-[45%] max-lg:w-full p-[32px] flex flex-col gap-[32px] justify-between dark:bg-[#232428] bg-[#ebedef] rounded-l-md max-lg:rounded-b-md">
							<div className="flex flex-col justify-between gap-[16px]">
								<div className="uppercase text-[11px] font-semibold">Listen Together</div>
								<div className="text-[32px]">Rythm</div>
								<div>Listen to music together with your friends anywhere on Mezon .</div>
							</div>
							<div className="py-2 px-3 text-white bg-blue-600 hover:bg-blue-800 w-fit rounded-sm font-semibold cursor-pointer">
								View app
							</div>
						</div>
						<div className="b3-right w-[55%] max-lg:w-full">
							<Image
								src={`assets/images/example-app.png`}
								width={48}
								height={48}
								className="object-cover w-full h-full rounded-r-md max-lg:rounded-t-md"
							/>
						</div>
					</div>
				</div>
				<div className={'w-full max-w-screen-lg flex flex-col gap-8'}>
					<AppDirectoryList />
				</div>
				<div className={'w-full dark:bg-[#2b2d31] bg-bgLightModeThird flex h-[76px] overflow-hidden rounded-md'}>
					<div className="px-4 pt-3 h-16">
						<Icons.AppDirectoryFooterRobot />
					</div>
					<div className="flex flex-col justify-center flex-1">
						<p className="text-base font-semibold">New too apps ?</p>
						<p className="text-sm">Check out our starter guide to get familiar with all the cool things apps can do!</p>
					</div>
					<div className="px-8 items-center flex">
						<Button label="Learn More" className="h-10" />
					</div>
				</div>
			</div>
		</div>
	);
};

const ExitBtn = () => {
	const navigate = useNavigate();

	const handleExit = () => {
		navigate(-1);
	};
	return (
		<div onClick={handleExit} className="fixed top-5 right-[30px] max-xl:right-[10px] flex flex-col items-center cursor-pointer z-10">
			<div className="rounded-full p-[10px] border dark:border-bgLightMode border-black">
				<Icons.CloseButton className="w-4" />
			</div>
			<div>ESC</div>
		</div>
	);
};

export default AppDirectory;
