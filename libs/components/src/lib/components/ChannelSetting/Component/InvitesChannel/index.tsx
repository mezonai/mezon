import { useTranslation } from 'react-i18next';

const InvitesChannel = ({ menuIsOpen }: { menuIsOpen?: boolean }) => {
	const { t } = useTranslation('channelSetting');

	return (
		<div
			className={`overflow-y-auto flex flex-col flex-1 shrink bg-theme-setting-primary w-1/2 pt-[94px] pb-7 pr-[10px] pl-[40px] overflow-x-hidden min-w-[700px] 2xl:min-w-[900px] max-w-[740px] hide-scrollbar ${!menuIsOpen ? 'sbm:pt-[94px] pt-[70px]' : 'pt-[94px]'}`}
		>
			<p className="text-blue-500">{t('tabs.invites')}</p>
		</div>
	);
};

export default InvitesChannel;
