/* eslint-disable @nx/enforce-module-boundaries */
import { Image } from '@mezon/ui';
import { useTranslation } from 'react-i18next';

const EmptySearch = () => {
	const { t } = useTranslation('searchMessageChannel');
	return (
		<div className="flex flex-col flex-1 h-full p-4 bg-outside-footer overflow-y-auto">
			<div className="m-auto">
				<Image className="w-[160px] h-[160px] mx-auto pointer-events-none" src={`/assets/images/empty-search.svg`} />
				<div className="text-base font-medium w-[280px] mt-10 text-center text-theme-primary">{t('emptySearch.title')}</div>
			</div>
		</div>
	);
};

export default EmptySearch;
