import { selectCloseMenu, selectEnableStatusOfOnBoarding } from '@mezon/store';
import { useSelector } from 'react-redux';
import { ItemObjProps } from '../ItemObj';

type SettingItemProps = {
	name: string;
	active?: boolean;
	onClick: () => void;
	handleMenu: (value: boolean) => void;
	setting?: ItemObjProps;
};

const SettingItem = ({ name, active, onClick, handleMenu, setting }: SettingItemProps) => {
	const isEnableOnBoarding = useSelector(selectEnableStatusOfOnBoarding);

	const closeMenu = useSelector(selectCloseMenu);
	return (
		<button
			className={`relative dark:text-textPrimary text-buttonProfile w-full py-1 px-[10px] mb-1 text-[16px] font-medium rounded text-left ${active ? 'dark:bg-bgModifierHover bg-bgModifierHoverLight dark:text-white text-textSecondary400' : ''} dark:hover:bg-bgHover hover:bg-bgModifierHoverLight`}
			onClick={() => {
				onClick();
				if (closeMenu) {
					handleMenu(false);
				}
			}}
		>
			{setting?.id === 'on-boarding' && (
				<div className="absolute top-[4px] right-[8px] dark:text-channelTextLabel text-colorTextLightMode">
					{isEnableOnBoarding ? 'ON' : 'OFF'}
				</div>
			)}
			{name}
		</button>
	);
};

export default SettingItem;
