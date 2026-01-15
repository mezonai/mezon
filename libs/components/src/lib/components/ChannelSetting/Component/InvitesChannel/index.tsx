import { useTranslation } from 'react-i18next';

const InvitesChannel = () => {
	const { t } = useTranslation('channelSetting');

	return (
		<div className="overflow-y-auto flex flex-col flex-1 shrink bg-theme-setting-primary w-1/2 lg:pt-[94px] sbm:pb-7 pr-[10px] sbm:pr-[10px] pl-[10px] sbm:pl-[40px] overflow-x-hidden min-w-full sbm:min-w-[700px] 2xl:min-w-[900px] max-w-[740px] hide-scrollbar">
			<p className="text-blue-500">{t('tabs.invites')}</p>
		</div>
	);
};

export default InvitesChannel;
