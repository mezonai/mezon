import { useChatSending, useCurrentInbox, useEscapeKeyClose, useGifs, useGifsStickersEmoji } from '@mezon/core';
import { referencesActions, selectDataReferences, useAppSelector } from '@mezon/store';
import { Loading } from '@mezon/ui';
import type { IGifCategory } from '@mezon/utils';
import { EMimeTypes, SubPanelName, blankReferenceObj, generateE2eId } from '@mezon/utils';
import type { ApiChannelDescription, ApiMessageRef } from 'mezon-js/types';
import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
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
		dataGifsFeartured,
		trendingClickingStatus,
		setClickedTrendingGif,
		categoriesStatus,
		setShowCategories,
		setButtonArrowBack
	} = useGifs();

	const { valueInputToCheckHandleSearch } = useGifsStickersEmoji();
	const [dataToRenderGifs, setDataToRenderGifs] = useState<any>();
	const { setSubPanelActive } = useGifsStickersEmoji();

	const ontrendingClickingStatus = () => {
		setClickedTrendingGif(true);
		setShowCategories(false);
		setButtonArrowBack(true);
	};

	const currentId = useCurrentInbox()?.channelId;
	const dataReferences = useAppSelector((state) => selectDataReferences(state, currentId ?? ''));
	const isReplyAction = dataReferences.messageRefId && dataReferences.messageRefId !== '';
	const dispatch = useDispatch();

	useEffect(() => {
		if (dataGifsSearch.length > 0 && valueInputToCheckHandleSearch !== '') {
			setDataToRenderGifs(dataGifsSearch);
			setShowCategories(false);
			setButtonArrowBack(true);
		} else if (trendingClickingStatus) {
			setDataToRenderGifs(dataGifsFeartured);
		} else if (valueInputToCheckHandleSearch === '') {
			setButtonArrowBack(false);
		}
	}, [dataGifsSearch, trendingClickingStatus, valueInputToCheckHandleSearch]);

	const handleClickGif = (giftUrl: string) => {
		if (isReplyAction) {
			sendMessage({ t: '' }, [], [{ url: giftUrl }], [dataReferences], undefined);
			dispatch(
				referencesActions.setDataReferences({
					channelId: currentId as string,
					dataReferences: blankReferenceObj as ApiMessageRef
				})
			);
		} else {
			sendMessage({ t: '' }, [], [{ url: giftUrl, filetype: EMimeTypes.gif }], [], undefined);
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
					channelId={channelOrDirect?.channelId ?? ''}
					channelLabel={channelOrDirect?.channelId ?? ''}
					mode={mode}
				/>

				{Array.isArray(dataGifCategories) &&
					dataGifCategories.map((item: IGifCategory, index: number) => <GifCategory gifCategory={item} key={index + item.name} />)}
			</div>
		);
	};

	const renderGifs = () => {
		if (loadingStatusGifs === 'loading') {
			return <Loading />;
		}
		return (
			<div className="mx-2 flex justify-center h-[400px] overflow-y-scroll hide-scrollbar flex-wrap">
				<div className="grid grid-cols-3  gap-1">
					{dataToRenderGifs &&
						dataToRenderGifs.map((gif: any, index: number) => (
							<div
								key={gif.id}
								className={`order-${index} overflow-hidden cursor-pointer flex items-center justify-center bg-bgIconLight rounded-lg`}
								onClick={() => handleClickGif(gif.media_formats.gif.url)}
								role="button"
								data-e2e={generateE2eId('mention.popover.gifs.item')}
							>
								<img
									src={gif.media_formats.gif.url}
									alt={gif.media_formats.gif.url}
									className="w-full h-auto object-contain max-h-full"
								/>
							</div>
						))}
				</div>
			</div>
		);
	};
	const modalRef = useRef<HTMLDivElement>(null);
	useEscapeKeyClose(modalRef, onClose);
	return (
		<div ref={modalRef} tabIndex={-1} className="outline-none">
			{categoriesStatus || (valueInputToCheckHandleSearch === '' && trendingClickingStatus === false) ? renderGifCategories() : renderGifs()}
		</div>
	);
}

export default TenorGifCategories;
