import { useChatSending, useCurrentInbox, useEscapeKeyClose, useGifs, useGifsStickersEmoji } from '@mezon/core';
import type { GifEntity } from '@mezon/store';
import { gifsActions, referencesActions, selectDataReferences, useAppDispatch, useAppSelector } from '@mezon/store';
import { Loading } from '@mezon/ui';
import type { IGifCategory } from '@mezon/utils';
import { EMimeTypes, SubPanelName, blankReferenceObj, generateE2eId } from '@mezon/utils';
import type { ApiChannelDescription, ApiMessageRef } from 'mezon-js';
import { useEffect, useRef, useState } from 'react';
import FeaturedGifs from './FeaturedGifs';
import GifCategory from './GifCategory';

type ChannelMessageBoxProps = {
	activeTab?: SubPanelName;
	channelOrDirect?: ApiChannelDescription;
	mode: number;
	onClose: () => void;
	isTopic?: boolean;
};

function TenorGifCategories({ channelOrDirect, mode, onClose, isTopic = false }: ChannelMessageBoxProps) {
	const { sendMessage } = useChatSending({
		channelOrDirect: channelOrDirect ?? undefined,
		mode,
		fromTopic: isTopic
	});
	const {
		dataGifCategories,
		dataGifsSearch,
		loadingStatusGifs,
		trendingClickingStatus,
		setClickedTrendingGif,
		categoriesStatus,
		setShowCategories,
		setButtonArrowBack,
		fetchGifTrending
	} = useGifs();

	const { valueInputToCheckHandleSearch } = useGifsStickersEmoji();
	const [dataToRenderGifs, setDataToRenderGifs] = useState<GifEntity[]>();
	const { setSubPanelActive } = useGifsStickersEmoji();

	const ontrendingClickingStatus = () => {
		fetchGifTrending();
		setClickedTrendingGif(true);
		setShowCategories(false);
		setButtonArrowBack(true);
	};

	const currentId = useCurrentInbox()?.channel_id;
	const dataReferences = useAppSelector((state) => selectDataReferences(state, currentId ?? ''));
	const isReplyAction = dataReferences.message_ref_id && dataReferences.message_ref_id !== '';
	const dispatch = useAppDispatch();

	useEffect(() => {
		if (dataGifsSearch.length > 0 && valueInputToCheckHandleSearch !== '') {
			setDataToRenderGifs(dataGifsSearch);
			setShowCategories(false);
			setButtonArrowBack(true);
		} else if (trendingClickingStatus) {
			setDataToRenderGifs(dataGifsSearch);
		} else if (valueInputToCheckHandleSearch === '') {
			setButtonArrowBack(false);
		}
	}, [dataGifsSearch, trendingClickingStatus, valueInputToCheckHandleSearch]);

	const handleClickGif = (giftUrl: string) => {
		if (isReplyAction) {
			sendMessage({ t: '' }, [], [{ url: giftUrl, filetype: EMimeTypes.sticker }], [dataReferences], undefined);
			dispatch(
				referencesActions.setDataReferences({
					channelId: currentId as string,
					dataReferences: blankReferenceObj as ApiMessageRef
				})
			);
		} else {
			sendMessage({ t: '' }, [], [{ url: giftUrl, filetype: EMimeTypes.sticker }], [], undefined);
		}
		setSubPanelActive(SubPanelName.NONE);
	};

	const renderGifCategories = () => {
		if (loadingStatusGifs === 'loading') {
			return <Loading />;
		}
		return (
			<div className="mx-2 grid grid-cols-2 justify-center h-[400px] overflow-y-scroll hide-scrollbar gap-2">
				<FeaturedGifs
					onClickToTrending={() => ontrendingClickingStatus()}
					channelId={channelOrDirect?.channel_id ?? ''}
					channelLabel={channelOrDirect?.channel_id ?? ''}
					mode={mode}
				/>

				{Array.isArray(dataGifCategories) &&
					dataGifCategories.map((item: IGifCategory, index: number) => <GifCategory gifCategory={item} key={index + item.category} />)}
			</div>
		);
	};

	useEffect(() => {
		if (loadingStatusGifs === 'not loaded') {
			dispatch(gifsActions.fetchGifCategories());
		}
	}, [loadingStatusGifs]);

	const renderGifs = () => {
		if (loadingStatusGifs === 'loading') {
			return <Loading />;
		}
		return (
			<div className="mx-2 flex justify-center h-[400px] overflow-y-scroll hide-scrollbar flex-wrap">
				<div className="grid grid-cols-[repeat(3,minmax(0,1fr))] gap-1 w-full">
					{dataToRenderGifs &&
						dataToRenderGifs.map((gif: GifEntity, index: number) => {
							const gifUrl = gif.url || '';
							return (
								<div
									key={gif.id}
									className={`overflow-hidden aspect-square cursor-pointer flex items-center justify-center bg-bgIconLight rounded-lg`}
									onClick={() => handleClickGif(gifUrl)}
									role="button"
									data-e2e={generateE2eId('mention.popover.gifs.item')}
								>
									<img src={gifUrl} alt={gifUrl} className="w-full h-full object-cover max-h-full" />
								</div>
							);
						})}
				</div>
			</div>
		);
	};
	const modalRef = useRef<HTMLDivElement>(null);
	useEscapeKeyClose(modalRef, onClose);
	return (
		<div ref={modalRef} tabIndex={-1} className="outline-none w-full">
			{categoriesStatus || (valueInputToCheckHandleSearch === '' && trendingClickingStatus === false) ? renderGifCategories() : renderGifs()}
		</div>
	);
}

export default TenorGifCategories;
