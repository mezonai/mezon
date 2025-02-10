import { useChatSending, useCurrentInbox, useEscapeKeyClose, useGifs, useGifsStickersEmoji } from '@mezon/core';
import { referencesActions, selectDataReferences } from '@mezon/store';
import { Loading } from '@mezon/ui';
import { IGifCategory, IMessageSendPayload, SubPanelName, blankReferenceObj } from '@mezon/utils';
import { ApiChannelDescription, ApiMessageAttachment, ApiMessageMention, ApiMessageRef } from 'mezon-js/api.gen';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import FeaturedGifs from './FeaturedGifs';
import GifCategory from './GifCategory';

type ChannelMessageBoxProps = {
	// activeTab use TenorGifCategories
	activeTab: SubPanelName;
	channelOrDirect: ApiChannelDescription | undefined;
	mode: number;
	onClose: () => void;
};

function TenorGifCategories({ channelOrDirect, mode, onClose }: ChannelMessageBoxProps) {
	const { sendMessage } = useChatSending({ channelOrDirect: channelOrDirect ?? undefined, mode });
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
	const currentId = useCurrentInbox()?.channel_id;
	const dataReferences = useSelector(selectDataReferences(currentId ?? ''));
	const isReplyAction = dataReferences.message_ref_id && dataReferences.message_ref_id !== '';
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

	const handleSend = useCallback(
		(
			content: IMessageSendPayload,
			mentions?: Array<ApiMessageMention>,
			attachments?: Array<ApiMessageAttachment>,
			references?: Array<ApiMessageRef>
		) => {
			sendMessage(content, mentions, attachments, references);
		},
		[sendMessage]
	);

	const handleClickGif = (giftUrl: string) => {
		if (isReplyAction) {
			handleSend({ t: '' }, [], [{ url: giftUrl }], [dataReferences]);
			dispatch(
				referencesActions.setDataReferences({
					channelId: currentId as string,
					dataReferences: blankReferenceObj as ApiMessageRef
				})
			);
		} else {
			handleSend({ t: '' }, [], [{ url: giftUrl }], []);
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
								className={`order-${index} overflow-hidden cursor-pointer`}
								onClick={() => handleClickGif(gif.media_formats.gif.url)}
								role="button"
							>
								<img src={gif.media_formats.gif.url} alt={gif.media_formats.gif.url} className="w-full h-auto" />
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
