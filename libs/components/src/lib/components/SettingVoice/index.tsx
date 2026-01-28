import { useTranslation } from 'react-i18next';

interface ISettingVoiceProps {
	menuIsOpen: boolean;
}

export const SettingVoice = ({ menuIsOpen }: ISettingVoiceProps) => {
	const { t } = useTranslation(['setting']);

	return (
		<div
			className={`overflow-y-auto flex flex-col flex-1 shrink w-1/2 pt-[94px] pb-7 pr-[10px] sbm:pl-[40px] pl-[10px] overflow-x-hidden ${menuIsOpen ? 'min-w-[700px]' : ''} 2xl:min-w-[900px] max-w-[740px] hide-scrollbar text-theme-primary text-sm`}
		>
			<h1 className="text-xl font-semibold tracking-wider mb-8 text-theme-primary-active">{t('setting:voice.title')}</h1>
			<div className="rounded-lg bg-theme-setting-nav p-4">
				<p className="text-sm font-medium mb-4">{t('setting:voice.description')}</p>
			</div>
		</div>
	);
};
