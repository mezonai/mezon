import { useGifs, useGifsStickersEmoji } from '@mezon/core';
import { Icons } from '@mezon/ui';
import { SubPanelName } from '@mezon/utils';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDebouncedCallback } from 'use-debounce';

export const InputSearch: React.FC = () => {
	const { t } = useTranslation('message');
	const { subPanelActive } = useGifsStickersEmoji();
	const { fetchGifsDataSearch } = useGifs();
	const [valueSearchGif, setValueSearchGif] = useState('');
	const [valueInput, setValueInput] = useState<string>('');
	const searchInputRef = useRef<HTMLInputElement | null>(null);
	const { trendingClickingStatus, setClickedTrendingGif, categoriesStatus, setShowCategories, buttonArrowBackStatus, setButtonArrowBack } =
		useGifs();

	const { setValueInputSearch, valuePlaceHolder } = useGifsStickersEmoji();

	const debouncedSetValueSearchGif = useDebouncedCallback((value) => {
		setValueSearchGif(value);
	}, 300);

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setValueInput(e.target.value);
		if (e.target.value === '') {
			setValueInput('');
		}
	};

	useEffect(() => {
		const trimmedValue = valueInput.trim();
		debouncedSetValueSearchGif(trimmedValue);
		setValueInputSearch(valueInput);
	}, [valueInput]);

	useEffect(() => {
		if (subPanelActive === SubPanelName.GIFS && valueSearchGif.trim() !== '') {
			fetchGifsDataSearch(valueSearchGif);
		}
	}, [valueSearchGif]);

	useEffect(() => {
		if (subPanelActive !== SubPanelName.NONE) {
			searchInputRef.current?.focus();
		}
		if (subPanelActive !== SubPanelName.GIFS) {
			setClickedTrendingGif(false);
			setButtonArrowBack(false);
		}
	}, [subPanelActive]);

	const onclickBackArrow = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
		event.stopPropagation();
		setShowCategories(true);
		setClickedTrendingGif(false);
		setValueInputSearch('');
		setButtonArrowBack(false);
	};
	const placeHolder = useMemo(() => {
		if (valuePlaceHolder) {
			return valuePlaceHolder;
		}
		switch (subPanelActive) {
			case SubPanelName.EMOJI:
				return t('findThePerfectReaction');
			case SubPanelName.STICKERS:
				return t('findThePerfectSticker');
			case SubPanelName.GIFS:
				return t('findThePerfectGif');
			case SubPanelName.SOUNDS:
				return t('findThePerfectSound');
			default:
				break;
		}
	}, [subPanelActive, valuePlaceHolder]);

	return (
		<div className="flex flex-row items-center pt-4">
			{buttonArrowBackStatus && (
				<div className="px-2 cursor-pointer" onClick={(e) => onclickBackArrow(e)} role="button">
					<Icons.BackToCategoriesGif />
				</div>
			)}

			{trendingClickingStatus && !categoriesStatus && (
				<div className="py-3">
					<span>TRENDING GIFs</span>
				</div>
			)}

			{!trendingClickingStatus && (
				<div className={`transition-all duration-300 h-8 pl-4 pr-2 py-3 relative rounded items-center inline-flex w-[97%] text-center`}>
					<input
						onChange={handleInputChange}
						type="text"
						placeholder={placeHolder}
						className="bg-theme-input outline-none bg-theme-input flex-1 p-2 rounded-md pr-10"
						value={valueInput}
						ref={searchInputRef}
					/>

					<div className="w-5 h-6 flex flex-row items-center pl-1 absolute right-1  top-1/4 transform -translate-y-1/2 m-2 cursor-pointer">
						<Icons.Search />
					</div>
				</div>
			)}
		</div>
	);
};
