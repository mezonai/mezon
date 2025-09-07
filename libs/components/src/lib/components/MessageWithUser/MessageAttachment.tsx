import { getCurrentChatData } from '@mezon/core';
import {
  attachmentActions,
  getStore,
  selectCurrentChannel,
  selectCurrentClanId,
  selectCurrentDM,
  useAppDispatch
} from '@mezon/store';
import {
  ApiPhoto,
  EMimeTypes,
  ETypeLinkMedia,
  IImageWindowProps,
  IMessageWithUser,
  ObserveFn,
  calculateAlbumLayout,
  createImgproxyUrl,
  getAttachmentDataForWindow,
  isMediaTypeNotSupported,
  useAppLayout
} from '@mezon/utils';
import isElectron from 'is-electron';
import { ChannelStreamMode } from 'mezon-js';
import { ApiMessageAttachment } from 'mezon-js/api.gen';
import { useCallback } from 'react';
import Album from './Album';
import { MessageAudio } from './MessageAudio/MessageAudio';
import MessageLinkFile from './MessageLinkFile';
import MessageVideo from './MessageVideo';
import Photo from './Photo';

type MessageAttachmentProps = {
	message: IMessageWithUser;
	onContextMenu?: (event: React.MouseEvent<HTMLImageElement>) => void;
	mode: ChannelStreamMode;
	observeIntersectionForLoading?: ObserveFn;
	isInSearchMessage?: boolean;
	isTopic?: boolean;
	defaultMaxWidth?: number;
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
			(attachment.filetype?.startsWith(ETypeLinkMedia.VIDEO_PREFIX) && !attachment.filetype?.endsWith(ETypeLinkMedia.VIDEO_TS_FILE))
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
				create_time: (attachment as any).create_time || message.create_time
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

const Attachments: React.FC<{
	attachments: ApiMessageAttachment[];
	message: IMessageWithUser;
	onContextMenu: any;
	mode: ChannelStreamMode;
	observeIntersectionForLoading?: ObserveFn;
	isInSearchMessage?: boolean;
	defaultMaxWidth?: number;
}> = ({ attachments, message, onContextMenu, mode, observeIntersectionForLoading, isInSearchMessage, defaultMaxWidth }) => {
	const { videos, images, documents, audio } = classifyAttachments(attachments, message);
	const { isMobile } = useAppLayout();
	return (
		<>
			{videos.length > 0 && (
				<div className="flex flex-row justify-start flex-wrap w-full gap-2 mt-5">
					{videos.map((video, index) => (
						<div key={index} className="gap-y-2">
							<MessageVideo attachmentData={video} isMobile={isMobile} />
						</div>
					))}
				</div>
			)}

			{images.length > 0 && (
				<ImageAlbum
					observeIntersectionForLoading={observeIntersectionForLoading}
					images={images}
					message={message}
					mode={mode}
					onContextMenu={onContextMenu}
					isInSearchMessage={isInSearchMessage}
					defaultMaxWidth={defaultMaxWidth}
					isMobile={isMobile}
				/>
			)}

			{documents.length > 0 &&
				documents.map((document, index) => (
					<MessageLinkFile key={`${index}_${document.url}`} attachmentData={document} mode={mode} message={message} />
				))}

			{audio.length > 0 && audio.map((audio, index) => <MessageAudio key={`${index}_${audio.url}`} audioUrl={audio.url || ''} />)}
		</>
	);
};

// TODO: refactor component for message lines
const MessageAttachment = ({
	message,
	onContextMenu,
	mode,
	observeIntersectionForLoading,
	isInSearchMessage,
	defaultMaxWidth
}: MessageAttachmentProps) => {
	const validateAttachment = (message.attachments || [])?.filter((attachment) => Object.keys(attachment).length !== 0);
	if (!validateAttachment) return null;
	return (
		<Attachments
			mode={mode}
			message={message}
			attachments={validateAttachment}
			onContextMenu={onContextMenu}
			observeIntersectionForLoading={observeIntersectionForLoading}
			isInSearchMessage={isInSearchMessage}
			defaultMaxWidth={defaultMaxWidth}
		/>
	);
};

const ImageAlbum = ({
	images,
	message,
	mode,
	onContextMenu,
	observeIntersectionForLoading,
	isInSearchMessage,
	defaultMaxWidth,
	isMobile
}: {
	images: (ApiMessageAttachment & { create_time?: string })[];
	message: IMessageWithUser;
	mode?: ChannelStreamMode;
	onContextMenu?: (event: React.MouseEvent<HTMLImageElement>) => void;
	observeIntersectionForLoading?: ObserveFn;
	isInSearchMessage?: boolean;
	defaultMaxWidth?: number;
	isMobile?: boolean;
}) => {
	const dispatch = useAppDispatch();

	const handleClick = useCallback(async (url?: string) => {
		// move code from old image view component
		const state = getStore()?.getState();
		const currentClanId = selectCurrentClanId(state);
		const currentDm = selectCurrentDM(state);
		const currentChannel = selectCurrentChannel(state);
		const currentChannelId = currentChannel?.id;
		const currentDmGroupId = currentDm?.id;
		const attachmentData = images.find((item) => item.url === url);
		if (!attachmentData) return;


		const enhancedAttachmentData = {
			...attachmentData,
			create_time: attachmentData.create_time || message.create_time || new Date().toISOString()
		};

		if (isElectron()) {
      const clanId = currentClanId === '0' ? '0' : (currentClanId as string);
      const channelId = currentClanId !== '0' ? (currentChannelId as string) : (currentDmGroupId as string);

        const messageTimestamp = message.create_time ? Math.floor(new Date(message.create_time).getTime() / 1000) : undefined;
        const beforeTimestamp = messageTimestamp ? messageTimestamp + 1 : undefined;
       const data = await dispatch(attachmentActions.fetchChannelAttachments({
          clanId,
          channelId,
          limit: 50,
          before: beforeTimestamp
          })
        ).unwrap();

        const currentChatUsersEntities = getCurrentChatData()?.currentChatUsersEntities;
        const listAttachmentsByChannel = data?.attachments?.filter((att) => att?.filetype?.startsWith(ETypeLinkMedia.IMAGE_PREFIX))
        .map((attachmentRes) => ({
          ...attachmentRes,
          id: attachmentRes.id || '',
          channelId,
          clanId
        }))
        .sort((a, b) => {
          if (a.create_time && b.create_time) {
            return Date.parse(b.create_time) - Date.parse(a.create_time);
          }
          return 0;
        });

        const currentImageUploader = currentChatUsersEntities?.[attachmentData.sender_id as string];

			window.electron.openImageWindow({
				...enhancedAttachmentData,
				url: createImgproxyUrl(enhancedAttachmentData.url || '', {
					width: enhancedAttachmentData.width ? (enhancedAttachmentData.width > 1600 ? 1600 : enhancedAttachmentData.width) : 0,
					height: enhancedAttachmentData.height ? (enhancedAttachmentData.height > 900 ? 900 : enhancedAttachmentData.height) : 0,
					resizeType: 'fit'
				}),
				uploaderData: {
					name:
						currentImageUploader?.clan_nick ||
						currentImageUploader?.user?.display_name ||
						currentImageUploader?.user?.username ||
						'Anonymous',
					avatar: (currentImageUploader?.clan_avatar ||
						currentImageUploader?.user?.avatar_url ||
						window.location.origin + '/assets/images/anonymous-avatar.png') as string
				},
				realUrl: enhancedAttachmentData.url || '',
				channelImagesData: {
					channelLabel: (currentChannelId ? currentChannel?.channel_label : currentDm.channel_label) as string,
					images: [],
					selectedImageIndex: 0
				}
			});
			if ((currentClanId && currentChannelId) || currentDmGroupId) {
				if (listAttachmentsByChannel) {
					const imageListWithUploaderInfo = getAttachmentDataForWindow(listAttachmentsByChannel, currentChatUsersEntities);
					const selectedImageIndex = listAttachmentsByChannel.findIndex((image) => image.url === enhancedAttachmentData.url);
					const channelImagesData: IImageWindowProps = {
						channelLabel: (currentChannelId ? currentChannel?.channel_label : currentDm.channel_label) as string,
						images: imageListWithUploaderInfo,
						selectedImageIndex: selectedImageIndex
					};

					window.electron.openImageWindow({
						...enhancedAttachmentData,
						url: createImgproxyUrl(enhancedAttachmentData.url || '', {
							width: enhancedAttachmentData.width ? (enhancedAttachmentData.width > 1600 ? 1600 : enhancedAttachmentData.width) : 0,
							height: enhancedAttachmentData.height
								? (enhancedAttachmentData.width || 0) > 1600
									? Math.round((1600 * enhancedAttachmentData.height) / (enhancedAttachmentData.width || 1))
									: enhancedAttachmentData.height
								: 0,
							resizeType: 'fill'
						}),
						uploaderData: {
							name:
								currentImageUploader?.clan_nick ||
								currentImageUploader?.user?.display_name ||
								currentImageUploader?.user?.username ||
								'Anonymous',
							avatar: (currentImageUploader?.clan_avatar ||
								currentImageUploader?.user?.avatar_url ||
								window.location.origin + '/assets/images/anonymous-avatar.png') as string
						},
						realUrl: enhancedAttachmentData.url || '',
						channelImagesData
					});
					return;
				}
			}

			return;
		}
		dispatch(attachmentActions.setMode(mode));

		dispatch(
			attachmentActions.setCurrentAttachment({
				id: enhancedAttachmentData.message_id as string,
				uploader: enhancedAttachmentData.sender_id || message.sender_id,
				create_time: enhancedAttachmentData.create_time
			})
		);

		dispatch(attachmentActions.setOpenModalAttachment(true));
		dispatch(attachmentActions.setAttachment(enhancedAttachmentData.url));

		if ((currentClanId && currentChannelId) || currentDmGroupId) {
			const clanId = currentClanId === '0' ? '0' : (currentClanId as string);
			const channelId = currentClanId !== '0' ? (currentChannelId as string) : (currentDmGroupId as string);
			const messageTimestamp = message.create_time ? Math.floor(new Date(message.create_time).getTime() / 1000) : undefined;
			const beforeTimestamp = messageTimestamp ? messageTimestamp + 1: undefined;

			dispatch(attachmentActions.fetchChannelAttachments({
				clanId,
				channelId,
				state: undefined,
				limit: 50,
				before: beforeTimestamp
			})).unwrap();

		}

		dispatch(attachmentActions.setMessageId(message.id));
	}, []);

	if (images.length >= 2) {
		const albumLayout = calculateAlbumLayout(false, true, images, isMobile, defaultMaxWidth);
		return (
			<div className="w-full">
				<Album
					album={images as any}
					observeIntersection={observeIntersectionForLoading}
					albumLayout={albumLayout}
					onClick={handleClick}
					onContextMenu={onContextMenu}
					isInSearchMessage={isInSearchMessage}
					isSending={message.isSending}
					isMobile={isMobile}
				/>
			</div>
		);
	}

	if (images.length > 0) {
		const firstImage = images[0];
		const photoProps = {
			mediaType: 'photo',
			id: message.id,
			url: firstImage?.url,
			width: firstImage?.width || 0,
			height: firstImage?.height || 150
		} as ApiPhoto;

		firstImage?.thumbnail &&
			(photoProps.thumbnail = {
				dataUri: firstImage.thumbnail
			});

		return (
			<div className="w-full py-1">
				<Photo
					id={message.id}
					key={message.id}
					photo={photoProps}
					observeIntersection={observeIntersectionForLoading}
					onClick={handleClick}
					isDownloading={false}
					onContextMenu={onContextMenu}
					isInSearchMessage={isInSearchMessage}
					isSending={message.isSending}
					isMobile={isMobile}
				/>
			</div>
		);
	}

	return null;
};

export default MessageAttachment;
