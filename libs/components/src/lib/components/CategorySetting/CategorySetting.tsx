import { Icons } from '@mezon/ui';
import type { ICategoryChannel } from '@mezon/utils';
import React, { useEffect, useState } from 'react';
import ExitSetting from '../ChannelSetting/exitSetting';
import type { ItemObjProps } from '../ClanSettings/ItemObj';
import { categorySettingItem, categorySettingList } from '../ClanSettings/ItemObj';
import CategorySettingSidebar from './CategorySettingSidebar';
import OverviewSetting from './OverviewSetting';

interface ICategorySettingProps {
	onClose: () => void;
	category: ICategoryChannel;
}

export const CategorySetting: React.FC<ICategorySettingProps> = ({ onClose, category }) => {
	const [menu, setMenu] = useState(true);
	const [currentSetting, setCurrentSetting] = useState<ItemObjProps>(categorySettingList[0]);
	const [displayCategoryName, setDisplayCategoryName] = useState<string>(category?.category_name || '');

	const handleSettingItemClick = (settingItem: ItemObjProps) => {
		setCurrentSetting(settingItem);
	};

	useEffect(() => {
		setDisplayCategoryName(category?.category_name || '');
	}, [category?.category_name]);

	return (
		<div className="flex fixed inset-0  w-screen z-30" onMouseDown={(event) => event.stopPropagation()} role="button">
			<div className="flex text-gray- w-screen relative text-white">
				<div className="h-fit absolute top-5 right-5 block sbm:hidden z-[1]">
					<div
						onClick={() => onClose()}
						className="rounded-full p-[10px] border-2 dark:border-[#a8a6a6] border-black cursor-pointer dark:text-[#a8a6a6] text-black"
					>
						<Icons.CloseButton className="w-4" />
					</div>
				</div>
				<div className="h-fit absolute top-5 left-5 block sbm:hidden z-[1]">
					<button
						className={`bg-[#AEAEAE] w-[30px] h-[30px] rounded-[50px] font-bold transform hover:scale-105 hover:bg-slate-400 transition duration-300 ease-in-out flex justify-center items-center ${menu ? 'rotate-90' : '-rotate-90'}`}
						onClick={() => setMenu(!menu)}
					>
						<Icons.ArrowDown defaultFill="white" defaultSize="w-[20px] h-[30px]" />
					</button>
				</div>
				<div
					className={`overflow-y-auto w-1/6 xl:w-1/4 min-w-56 dark:bg-bgSecondary bg-bgLightModeSecond dark:text-white text-black flex justify-end pt-96 pr-2 scrollbar-thin scrollbar-thumb-black scrollbar-track-gray-200 2xl:flex-grow hide-scrollbar flex-grow`}
				>
					<CategorySettingSidebar
						onClickItem={handleSettingItemClick}
						handleMenu={(value: boolean) => setMenu(value)}
						currentSetting={currentSetting}
						category={category}
						displayCategoryName={displayCategoryName}
					/>
				</div>
				<div className="overflow-y-auto flex flex-col flex-1 shrink dark:bg-bgPrimary bg-white  w-1/2 pt-[94px] sbm:pb-7 sbm:pr-[40px] sbm:pl-[40px] p-4 overflow-x-hidden min-w-full sbm:min-w-[700px] 2xl:min-w-[900px] max-w-[740px] hide-scrollbar">
					<div className="dark:text-white text-black text-[15px]">
						<h2 className="text-xl font-semibold mb-5 dark:text-textDarkTheme text-textLightTheme sbm:mt-[60px] mt-[10px]">
							{currentSetting.name}
						</h2>
						{currentSetting.id === categorySettingItem.OVERVIEW && (
							<OverviewSetting category={category} onClose={onClose} onDisplayNameChange={setDisplayCategoryName} />
						)}
					</div>
				</div>
				<ExitSetting onClose={onClose} />
			</div>
		</div>
	);
};
