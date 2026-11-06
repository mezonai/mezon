import IconMotionSwitch from './IconMotionSwitch';
import TestThemeBlock from './TestThemeBlock';
import ThemeOptions from './ThemeOptions';

interface SettingAppearanceProps {
	menuIsOpen: boolean;
}

const SettingAppearance = ({ menuIsOpen }: SettingAppearanceProps) => {
	return (
		<div
			className={`overflow-y-auto flex flex-col flex-1 shrink w-1/2 pt-[94px] pb-7 pr-[10px] pl-[10px] sbm:pl-[40px] overflow-x-hidden ${menuIsOpen === true ? 'min-w-[700px]' : ''} 2xl:min-w-[900px] max-w-[740px] hide-scrollbar  text-sm`}
		>
			<TestThemeBlock />
			<ThemeOptions />
			<IconMotionSwitch />
		</div>
	);
};

export default SettingAppearance;
export { default as TestThemeBlock } from './TestThemeBlock';
export { default as ThemeOptions } from './ThemeOptions';
