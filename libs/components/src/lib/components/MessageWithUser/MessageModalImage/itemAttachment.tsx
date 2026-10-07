import { useCdnUrlSigner } from '@mezon/core';
import type { AttachmentEntity } from '@mezon/store';
import { attachmentActions, selectMessageByMessageId, useAppDispatch, useAppSelector } from '@mezon/store';
import { EMimeTypes, ETypeLinkMedia, createImgproxyUrl, isAttachmentPresignPendingForMessage } from '@mezon/utils';

type ItemAttachmentProps = {
	attachment: AttachmentEntity;
	channelId: string;
	previousDate: any;
	selectedImageRef: React.MutableRefObject<HTMLDivElement | null>;
	showDate: boolean;
	setUrlImg: React.Dispatch<React.SetStateAction<string>>;
	handleDrag: (e: any) => void;
	index: number;
	setCurrentIndexAtt: React.Dispatch<React.SetStateAction<number>>;
	currentIndexAtt: number;
};

const ItemAttachment = (props: ItemAttachmentProps) => {
	const { attachment, channelId, previousDate, selectedImageRef, showDate, setUrlImg, handleDrag, setCurrentIndexAtt, index, currentIndexAtt } =
		props;
	const dispatch = useAppDispatch();
	const isSelected = index === currentIndexAtt;
	const sourceMessage = useAppSelector((state) =>
		attachment.message_id && channelId ? selectMessageByMessageId(state, channelId, attachment.message_id) : undefined
	);
	const { signCdnUrl, isAwaitingSignature } = useCdnUrlSigner([attachment.url]);
	// Not loadable yet: the upload is unconfirmed, or the channel's CDN signature is still on its way.
	const isMediaPending = isAttachmentPresignPendingForMessage(attachment.url, sourceMessage) || isAwaitingSignature(attachment.url);

	const handleSelectImage = () => {
		if (isMediaPending) return;
		setUrlImg(attachment.url || '');
		setCurrentIndexAtt(index);
		dispatch(attachmentActions.setCurrentAttachment(attachment));
	};

	const isVideo =
		(attachment as any).isVideo ||
		attachment.filetype?.startsWith(ETypeLinkMedia.VIDEO_PREFIX) ||
		attachment.filetype?.includes(EMimeTypes.mp4) ||
		attachment.filetype?.includes(EMimeTypes.mov);

	const thumbnailClassName = `block w-[120px] h-[90px] max-sbm:w-16 max-sbm:h-12 object-cover rounded ${
		isMediaPending ? 'cursor-default' : 'cursor-pointer'
	} ${isSelected ? '' : 'overlay'}`;

	return (
		<div className={`attachment-item`} ref={isSelected ? selectedImageRef : null}>
			<div
				className={`relative flex w-fit mx-auto rounded-md border-2 ${isMediaPending ? 'cursor-default' : 'cursor-pointer'} ${isSelected ? 'border-buttonPrimary' : 'border-transparent'}`}
				onClick={handleSelectImage}
			>
				{isMediaPending ? (
					<div className={`${thumbnailClassName} bg-bgLightSecondary dark:bg-bgSecondary`} />
				) : isVideo ? (
					<div className="relative">
						<video
							src={signCdnUrl(attachment.url ?? '')}
							className={thumbnailClassName}
							muted
							playsInline
							preload="none"
							onDragStart={handleDrag}
							onKeyDown={(event) => {
								if (event.key === 'Enter') {
									handleSelectImage();
								}
							}}
						/>
						<div className="absolute inset-0 flex items-center justify-center pointer-events-none">
							<svg width="24" height="24" viewBox="0 0 24 24" fill="white" className="drop-shadow-lg">
								<path d="M8 5v14l11-7z" />
							</svg>
						</div>
					</div>
				) : (
					<img
						src={createImgproxyUrl(signCdnUrl(attachment.url ?? ''), { width: 300, height: 300, resizeType: 'fit' })}
						alt={attachment.url}
						className={thumbnailClassName}
						onDragStart={handleDrag}
						onKeyDown={(event) => {
							if (event.key === 'Enter') {
								handleSelectImage();
							}
						}}
					/>
				)}
				{!isSelected && <div className="absolute inset-0 bg-black opacity-30 rounded"></div>}
			</div>
			{showDate && <div className={`dark:text-white text-black mt-1 text-center max-sbm:text-xs`}>{previousDate}</div>}
		</div>
	);
};

export default ItemAttachment;
