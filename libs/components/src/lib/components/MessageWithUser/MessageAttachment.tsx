import { EMimeTypes, ETypeLinkMedia, IMessageWithUser, isMediaTypeNotSupported, notImplementForGifOrStickerSendFromPanel } from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import { ApiMessageAttachment } from 'mezon-js/api.gen';
import { useMemo } from 'react';
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

	attachments.forEach((attachment) => {
		if (isMediaTypeNotSupported(attachment.filetype)) {
			return documents.push(attachment);
		}
		if (
			((attachment.filetype?.indexOf(EMimeTypes.mp4) !== -1 || attachment.filetype?.indexOf(EMimeTypes.mov) !== -1) &&
				!attachment.url?.includes(EMimeTypes.tenor)) ||
			attachment.filetype?.startsWith(ETypeLinkMedia.VIDEO_PREFIX)
		) {
			videos.push(attachment);
		} else if (
			(attachment.filetype?.indexOf(EMimeTypes.png) !== -1 ||
				attachment.filetype?.indexOf(EMimeTypes.jpeg) !== -1 ||
				attachment.filetype?.startsWith(ETypeLinkMedia.IMAGE_PREFIX)) &&
			!attachment.filetype?.includes('svg+xml')
		) {
			const resultAttach: ApiMessageAttachment & { create_time?: string } = {
				...attachment,
				sender_id: message.sender_id,
				create_time: message.create_time
			};
			images.push(resultAttach);
		} else {
			documents.push(attachment);
		}
	});
	return { videos, images, documents };
};

const Attachments: React.FC<{ attachments: ApiMessageAttachment[]; message: IMessageWithUser; onContextMenu: any; mode: ChannelStreamMode }> = ({
	attachments,
	message,
	onContextMenu,
	mode
}) => {
	const { videos, images, documents } = useMemo(() => classifyAttachments(attachments, message), [attachments]);
	return (
		<>
			{videos.length > 0 && (
				<div className="flex flex-row justify-start flex-wrap w-full gap-2 mt-5">
					{videos.map((video, index) => (
						<div key={`${video.url}_${index}`} className="w-fit max-h-[350px] gap-y-2">
							<MessageVideo attachmentData={video} />
						</div>
					))}
				</div>
			)}

			{images.length > 0 && (
				<div className={`grid grid-cols-2 justify-start flex-wrap w-full gap-x-2 ${images.length > 1 ? 'max-w-[550px]' : ''}`}>
					{images.map((image, index) => {
						const checkImage = notImplementForGifOrStickerSendFromPanel(image);
						return (
							<div key={`${index}_${image.url}`} className={`${checkImage ? '' : 'h-auto'}  `}>
								<MessageImage
									messageId={message.id}
									mode={mode}
									attachmentData={image}
									onContextMenu={onContextMenu}
									multiple={images.length > 1}
								/>
							</div>
						);
					})}
				</div>
			)}

			{documents.length > 0 &&
				documents.map((document, index) => <MessageLinkFile key={`${index}_${document.url}`} attachmentData={document} mode={mode} />)}
		</>
	);
};

// TODO: refactor component for message lines
const MessageAttachment = ({ message, onContextMenu, mode }: MessageAttachmentProps) => {
	const validateAttachment = useMemo(() => {
		return (message.attachments || []).filter((attachment) => Object.keys(attachment).length !== 0);
	}, [message.attachments]);
	if (!validateAttachment) return null;

	return <Attachments mode={mode} message={message} attachments={validateAttachment ?? []} onContextMenu={onContextMenu} />;
};

export default MessageAttachment;
