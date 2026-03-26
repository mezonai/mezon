import { selectCloseMenu, selectCurrentClanIsOnboarding } from '@mezon/store';
import { generateE2eId } from '@mezon/utils';
import { useSelector } from 'react-redux';
import type { ItemObjProps } from '../ItemObj';

type SettingItemProps = {
	name: string;
	active?: boolean;
	onClick: () => void;
	handleMenu: (value: boolean) => void;
	setting?: ItemObjProps;
};

const SettingItem = ({ name, active = false, onClick, handleMenu, setting }: SettingItemProps) => {
	const currentClanIsOnboarding = useSelector(selectCurrentClanIsOnboarding);
	const closeMenu = useSelector(selectCloseMenu);

	const handleItemClick = () => {
		onClick();
		if (closeMenu) {
			handleMenu(false);
		}
	};

	const baseClasses =
		'relative w-full py-2 px-[10px] mb-1 text-[16px] font-medium rounded text-left transition-colors flex items-center justify-between gap-2';
	const activeClasses = active ? 'bg-item-theme text-theme-primary-active' : 'hover:bg-item-hover';

	return (
		<button className={`${baseClasses} ${activeClasses}`} onClick={handleItemClick} data-e2e={generateE2eId('clan_page.settings.sidebar.item')}>
			<span className="truncate flex-1">{name}</span>

			{setting?.id === 'on-boarding' && (
				<div
					className={`
                        flex items-center gap-1.5 px-1 py-1 
                        transition-all duration-500 ease-out
                        select-none shrink-0
                        ${currentClanIsOnboarding ? 'text-emerald-400 ' : 'text-theme-primary'} 
                    `}
				>
					<div className="relative flex items-center justify-center">
						<div
							className={`
                            w-1.5 h-1.5 rounded-full transition-colors duration-500
                            ${currentClanIsOnboarding ? 'bg-emerald-400' : 'bg-red-500'}
                        `}
						/>
						{currentClanIsOnboarding && (
							<div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping opacity-75" />
						)}
					</div>

					<span className="text-[12px] font-black tracking-[0.1em] uppercase leading-none mt-[0.5px]">
						{currentClanIsOnboarding ? 'ON' : 'OFF'}
					</span>
				</div>
			)}
		</button>
	);
};

export default SettingItem;