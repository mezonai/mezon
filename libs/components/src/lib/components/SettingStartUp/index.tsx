import { useAppDispatch } from '@mezon/store';
import { useTranslation } from 'react-i18next';

type SettingStartUpProps = {
	menuIsOpen: boolean;
};

const SettingStartUp = ({ menuIsOpen }: SettingStartUpProps) => {
	const { t } = useTranslation(['setting', 'common']);
	const dispatch = useAppDispatch();

	return (
		<div
			className={`overflow-y-auto flex flex-col flex-1 shrink w-1/2 pt-[94px] pb-7 pr-[10px] sbm:pl-[40px] pl-[10px] overflow-x-hidden ${menuIsOpen ? 'min-w-[700px]' : ''} 2xl:min-w-[900px] max-w-[740px] hide-scrollbar text-theme-primary text-sm`}
		>
			<h1 className="text-xl font-semibold tracking-wider mb-8 text-theme-primary-active">{t('setting:appSettings.startUp')}</h1>
		</div>
	);
};

export default SettingStartUp;
