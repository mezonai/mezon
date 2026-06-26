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
	const isPresignPending = isAttachmentPresignPendingForMessage(attachment.url, sourceMessage);

	const handleSelectImage = () => {
		if (isPresignPending) return;
		setUrlImg(attachment.url || '');
		setCurrentIndexAtt(index);
		dispatch(attachmentActions.setCurrentAttachment(attachment));
	};

	const isVideo =
		(attachment as any).isVideo ||
		attachment.filetype?.startsWith(ETypeLinkMedia.VIDEO_PREFIX) ||
		attachment.filetype?.includes(EMimeTypes.mp4) ||
		attachment.filetype?.includes(EMimeTypes.mov);

	const thumbnailClassName = `size-[88px] max-w-[88px] max-h-[88px] max-[480px]:size-16 w-full mx-auto gap-5 object-cover rounded-md ${
		isPresignPending ? 'cursor-default' : 'cursor-pointer'
	} ${isSelected ? '' : 'overlay'} border-2 ${isSelected ? 'dark:bg-slate-700 bg-bgLightModeButton border-colorTextLightMode' : 'border-transparent'}`;

	return (
		<div className={`attachment-item`} ref={isSelected ? selectedImageRef : null}>
			{showDate && <div className={`dark:text-white text-black mb-1 text-center`}>{previousDate}</div>}
			<div
				className={`rounded-md ${isPresignPending ? 'cursor-default' : 'cursor-pointer'} ${isSelected ? 'flex items-center border-2 border-white' : 'relative'}`}
				onClick={handleSelectImage}
			>
				{isPresignPending ? (
					<div className={`${thumbnailClassName} bg-bgLightSecondary dark:bg-bgSecondary`} />
				) : isVideo ? (
					<div className="relative">
						<video
							src={attachment.url ?? ''}
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
						src={createImgproxyUrl(attachment.url ?? '', { width: 300, height: 300, resizeType: 'fit' })}
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
				{!isSelected && <div className="absolute inset-0 bg-black opacity-80 rounded"></div>}
			</div>
		</div>
	);
};

export default ItemAttachment;
