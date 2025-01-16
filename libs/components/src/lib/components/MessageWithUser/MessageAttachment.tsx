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

const designLayout = (
	images: (ApiMessageAttachment & {
		create_time?: string;
	})[]
) => {
	const listImageSize: { width: number; height: number }[] = [];

	if (images.length > 2) {
		for (let i = 0; i < images.length; i += 2) {
			if (images[i + 1]) {
				const heightPicOne = images[i].height || 0;
				const heightPicTwo = images[i + 1].height || 0;

				let sameHeight = 0;
				if (heightPicOne > heightPicTwo) {
					sameHeight = heightPicOne + Math.round((heightPicOne - heightPicTwo) / 2);
				} else {
					sameHeight = heightPicTwo + Math.round((heightPicTwo - heightPicOne) / 2);
				}

				const widthPicOneNew = ((images[i].width || 0) * sameHeight) / (images[i].height || 1);

				const widthPicTwoNew = ((images[i + 1].width || 0) * sameHeight) / (images[i + 1].height || 1);

				const percent = (widthPicOneNew + widthPicTwoNew) / 512;

				listImageSize[i] = {
					width: Math.round(widthPicOneNew / percent),
					height: Math.round(sameHeight / percent)
				};
				listImageSize[i + 1] = {
					width: Math.round(widthPicTwoNew / percent),
					height: Math.round(sameHeight / percent)
				};
			} else {
				const width = 520;
				listImageSize[i] = {
					width: width,
					height: Math.round((width * (images[i].height || 1)) / (images[i].width || 1))
				};
			}
		}
	} else if (images.length == 1) {
		if (!images[0]?.height) {
			listImageSize[0] = {
				height: 150,
				width: images[0].width || 0
			};
			return listImageSize;
		} else if ((images[0]?.width || 0) > 520) {
			listImageSize[0] = {
				height: Math.round((520 * (images[0].height || 1)) / (images[0].width || 1)),
				width: 520
			};
			return listImageSize;
		}
		listImageSize[0] = {
			height: images[0].height,
			width: images[0].width || 0
		};
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
		<div className="flex flex-row justify-start flex-wrap w-full gap-x-2 max-w-[520px]">
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
