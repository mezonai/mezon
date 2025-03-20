/* eslint-disable @nx/enforce-module-boundaries */
import { Image } from '@mezon/ui';

const EmptySearchFriends = () => {
	return (
		<div className="flex flex-col justify-center px-12">
			<Image className="w-[85px] h-[85px] mx-auto pointer-events-none" src={`assets/images/empty-search.svg`} />
			<div className="text-base font-normal mt-[20px] mb-[20px] text-center text-textLightTheme dark:text-textPrimary">
				No friends found that are not already in this DM.
			</div>
		</div>
	);
};

export default EmptySearchFriends;
