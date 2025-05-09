import { Icons } from '@mezon/ui';

const ThumbnailLoading = () => {
	return (
		<div className="flex justify-center items-center p-2 mb-3 rounded dark:bg-bgSecondary bg-bgLightMode w-[216px] h-[216px] flex-shrink-0 border dark:text-textDarkTheme text-textLightTheme dark:border-[#2B2D31] relative cursor-not-allowed">
			<div className="rounded-md flex flex-col justify-center items-center">
				<Icons.LoadingSpinner />
				loading file...
			</div>
		</div>
	);
};

export default ThumbnailLoading;
