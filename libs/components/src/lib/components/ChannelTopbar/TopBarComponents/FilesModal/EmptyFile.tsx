import { Icons, MezonIcon, MzIcons40 } from '@mezon/ui';
import { useTranslation } from 'react-i18next';

const EmptyFile = () => {
	const { t } = useTranslation('channelTopbar');

	return (
		<div className="flex flex-col items-center justify-center min-h-[400px] p-12">
			<button className="relative mx-auto mb-4 p-[22px] rounded-full bg-item-theme cursor-default">
				<MezonIcon icon={MzIcons40.mzFile} className="text-[var(--mz-icon)]" />
				<Icons.EmptyUnreadStyle className="w-[104px] h-[80px] absolute top-0 left-[-10px]" />
			</button>
			<h2 className="text-2xl text-theme-primary-active font-semibold mb-2">{t('files.emptyTitle')}</h2>
			<p className="text-base text-theme-primary text-center">{t('files.emptyDescription')}</p>
		</div>
	);
};

export default EmptyFile;
