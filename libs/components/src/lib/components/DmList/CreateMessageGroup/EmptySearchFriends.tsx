/* eslint-disable @nx/enforce-module-boundaries */
import { Image } from '@mezon/ui';
import { useTranslation } from 'react-i18next';

const EmptySearchFriends = () => {
	const { t } = useTranslation('directMessage');
	return (
		<div className="flex flex-col justify-center px-12">
			<Image className="w-[85px] h-[85px] mx-auto pointer-events-none" src={`/assets/images/empty-search.svg`} />
			<div className="text-base font-normal mt-[20px] mb-[20px] text-center text-textLightTheme dark:text-textPrimary">
				{t('createMessageGroup.noFriendsFound')}
			</div>
		</div>
	);
};

export default EmptySearchFriends;
