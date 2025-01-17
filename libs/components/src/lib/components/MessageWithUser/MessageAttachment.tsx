import { EMimeTypes, ETypeLinkMedia, IMessageWithUser, isMediaTypeNotSupported, notImplementForGifOrStickerSendFromPanel } from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import { ApiMessageAttachment } from 'mezon-js/api.gen';
import { memo, useMemo } from 'react';
import { MessageAudio } from './MessageAudio/MessageAudio';
import MessageImage from './MessageImage';
import MessageLinkFile from './MessageLinkFile';
import MessageVideo from './MessageVideo';

type MessageAttachmentProps = {
	message: IMessageWithUser;
	onContextMenu?: (event: React.MouseEvent<HTMLImageElement>) => void;
	mode: ChannelStreamMode;
};

const classifyAttachments = (attachments: ApiMessageAttachment[], message: IMessageWithUser) => {
	const videos: ApiMessageAttachment[] = [];
	const images: (ApiMessageAttachment & { create_time?: string })[] = [];
	const documents: ApiMessageAttachment[] = [];
	const audio: ApiMessageAttachment[] = [];

	attachments.forEach((attachment) => {
		if (isMediaTypeNotSupported(attachment.filetype)) {
			documents.push(attachment);
			return;
		}

		if (
			((attachment.filetype?.includes(EMimeTypes.mp4) || attachment.filetype?.includes(EMimeTypes.mov)) &&
				!attachment.url?.includes(EMimeTypes.tenor)) ||
			attachment.filetype?.startsWith(ETypeLinkMedia.VIDEO_PREFIX)
		) {
			videos.push(attachment);
			return;
		}

		if (
			((attachment.filetype?.includes(EMimeTypes.png) ||
				attachment.filetype?.includes(EMimeTypes.jpeg) ||
				attachment.filetype?.startsWith(ETypeLinkMedia.IMAGE_PREFIX)) &&
				!attachment.filetype?.includes('svg+xml')) ||
			attachment.url?.endsWith('.gif')
		) {
			const resultAttach: ApiMessageAttachment & { create_time?: string } = {
				...attachment,
				sender_id: message.sender_id,
				create_time: message.create_time
			};
			images.push(resultAttach);
			return;
		}

		if (attachment.filetype?.includes(EMimeTypes.audio)) {
			audio.push(attachment);
			return;
		}

		documents.push(attachment);
	});

	return { videos, images, documents, audio };
};

const Attachments: React.FC<{ attachments: ApiMessageAttachment[]; message: IMessageWithUser; onContextMenu: any; mode: ChannelStreamMode }> = ({
	attachments,
	message,
	onContextMenu,
	mode
}) => {
	const { videos, images, documents, audio } = useMemo(() => classifyAttachments(attachments, message), [attachments]);
	return (
		<>
			{videos.length > 0 && (
				<div className="flex flex-row justify-start flex-wrap w-full gap-2 mt-5">
					{videos.map((video, index) => (
						<div key={index} className="w-fit max-h-[350px] gap-y-2">
							<MessageVideo attachmentData={video} />
						</div>
					))}
				</div>
			)}

			{images.length > 0 && <ImageAlbum images={images} message={message} mode={mode} onContextMenu={onContextMenu} />}

			{documents.length > 0 &&
				documents.map((document, index) => (
					<MessageLinkFile key={`${index}_${document.url}`} attachmentData={document} mode={mode} message={message} />
				))}

			{audio.length > 0 && audio.map((audio, index) => <MessageAudio key={`${index}_${audio.url}`} audioUrl={audio.url || ''} />)}
		</>
	);
};

// TODO: refactor component for message lines
const MessageAttachment = ({ message, onContextMenu, mode }: MessageAttachmentProps) => {
	const validateAttachment = useMemo(() => {
		return (message.attachments || []).filter((attachment) => Object.keys(attachment).length !== 0);
	}, [message.attachments]);
	if (!validateAttachment) return null;

	return <Attachments mode={mode} message={message} attachments={validateAttachment} onContextMenu={onContextMenu} />;
};

const MAX_WIDTH_ALBUM_IMAGE = 520;
const NUMBER_IMAGE_ON_ROW = 2;
const WIDTH_ALBUM_WITH_SPACE = MAX_WIDTH_ALBUM_IMAGE - 8 * (NUMBER_IMAGE_ON_ROW - 1);

const designLayout = (
	images: (ApiMessageAttachment & {
		create_time?: string;
	})[]
) => {
	const listImageSize: { width: number; height: number }[] = [];

	if (images.length >= 2) {
		for (let i = 0; i < images.length; i += 2) {
			if (images[i + 1] && images[i]?.height && images[i + 1]?.height) {
				const heightPicOne = images[i].height || 0;
				const heightPicTwo = images[i + 1].height || 0;

				let sameHeight = 0;
				if (heightPicOne > heightPicTwo) {
					sameHeight = heightPicTwo + Math.round((heightPicOne - heightPicTwo));
				} else {
					sameHeight = heightPicOne + Math.round((heightPicTwo - heightPicOne));
				}

				const widthPicOneNew = ((images[i].width || 0) * sameHeight) / (images[i].height || 1);

				const widthPicTwoNew = ((images[i + 1].width || 0) * sameHeight) / (images[i + 1].height || 1);

				const percent = (widthPicOneNew + widthPicTwoNew) / WIDTH_ALBUM_WITH_SPACE;

				listImageSize[i] = {
					width: Math.round(widthPicOneNew / percent),
					height: Math.round(sameHeight / percent)
				};
				listImageSize[i + 1] = {
					width: Math.round(widthPicTwoNew / percent),
					height: Math.round(sameHeight / percent)
				};
			} else if (images[i + 1]) {
				const width = MAX_WIDTH_ALBUM_IMAGE;
				listImageSize[i] = {
					width: WIDTH_ALBUM_WITH_SPACE / NUMBER_IMAGE_ON_ROW,
					height: 150
				};
			} else {
				const width = MAX_WIDTH_ALBUM_IMAGE;
				listImageSize[i] = {
					width: width,
					height: Math.round((width * (images[i].height || 1)) / (images[i].width || 1))
				};
			}
		}
	} else if (images.length == 1) {
		if (!images[0]?.height || !images[0]?.width) {
			listImageSize[0] = {
				height: 150,
				width: images[0].width || 0
			};
			return listImageSize;
		} else {
			const aspectRatio = images[0]?.width / images[0]?.height;
			let heightAlonePic = images[0]?.height;
			let widthAlonePic = images[0]?.width;
			if (heightAlonePic >= 275) {
				heightAlonePic = 275;
				widthAlonePic = heightAlonePic * aspectRatio;
			}

			if (widthAlonePic >= 550) {
				widthAlonePic = 550;
				heightAlonePic = widthAlonePic / aspectRatio;
			}
	
			listImageSize[0] = {
				height: Math.round(heightAlonePic),
				width: Math.round(widthAlonePic)
			};
			return listImageSize;
		}
	}

	return listImageSize;
};

const ImageAlbum = ({
	images,
	message,
	mode,
	onContextMenu
}: {
	images: (ApiMessageAttachment & { create_time?: string })[];
	message: IMessageWithUser;
	mode?: ChannelStreamMode;
	onContextMenu?: (event: React.MouseEvent<HTMLImageElement>) => void;
}) => {
	const listImageSize = designLayout(images);

	return (
		<div className={`flex flex-row justify-start flex-wrap w-full gap-x-2 max-w-[${MAX_WIDTH_ALBUM_IMAGE}px]`}>
			{images.map((image, index) => {
				const checkImage = notImplementForGifOrStickerSendFromPanel(image);
				return (
					<div key={index} className={`${checkImage ? '' : 'h-auto'} `}>
						<MessageImage
							messageId={message.id}
							mode={mode}
							attachmentData={image}
							onContextMenu={onContextMenu}
							size={listImageSize[index]}
						/>
					</div>
				);
			})}
		</div>
	);
};

export default memo(MessageAttachment);
