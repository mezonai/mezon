import { useGifs, useGifsStickersEmoji } from '@mezon/core';
import type { IGifCategory } from '@mezon/utils';
import { generateE2eId } from '@mezon/utils';

type GifCategoryProps = {
	gifCategory: IGifCategory;
};

function GifCategory({ gifCategory }: GifCategoryProps) {
	const { setButtonArrowBack, fetchGifsDataSearch, setShowCategories, setClickedTrendingGif } = useGifs();
	const { setValueInputSearch } = useGifsStickersEmoji();
	const clickedCategory = () => {
		fetchGifsDataSearch(gifCategory.searchterm);
		setValueInputSearch(gifCategory.searchterm);
		setShowCategories(false);
		setClickedTrendingGif(false);
		setButtonArrowBack(true);
	};

	return (
		<div
			className="relative h-32 rounded-md cursor-pointer overflow-hidden group"
			onClick={clickedCategory}
			role="button"
			data-e2e={generateE2eId('mention.popover.gifs.category')}
		>
			<div className="absolute inset-0 bg-black opacity-80 z-20 transition-opacity group-hover:opacity-70"></div>
			<div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
				<span className="text-white text-lg font-manrope">{gifCategory.searchterm}</span>
			</div>
			<img className="w-full h-full object-cover brightness-100 rounded-sm" src={gifCategory.image} alt={gifCategory.image} />
			<div className="absolute inset-0 border-2 border-blue-500 opacity-0 group-hover:opacity-100 transition-opacity rounded-md z-30"></div>
		</div>
	);
}

export default GifCategory;
