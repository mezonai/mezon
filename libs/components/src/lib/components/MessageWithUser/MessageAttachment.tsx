import {
	attachmentActions,
	getStore,
	selectCurrentChannel,
	selectCurrentClanId,
	selectCurrentDM,
	selectMessageByMessageId,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import type { ApiPhoto, IMessageWithUser, ObserveFn } from '@mezon/utils';
import {
	EMimeTypes,
	ETypeLinkMedia,
	calculateAlbumLayout,
	filterExpiredPresignAttachments,
	generateAttachmentId,
	getMessageCreateTimeSeconds,
	getPresignExpiryDelayMs,
	hasActivePresignPendingAttachments,
	isMediaTypeNotSupported,
	isPresignAttachmentPending,
	parsePresignFinishKeys,
	useAppLayout
} from '@mezon/utils';

import type { ApiMessageAttachment, ChannelStreamMode } from 'mezon-js';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import Album from './Album';
import { MessageAudio } from './MessageAudio/MessageAudio';
import MessageLinkFile from './MessageLinkFile';
import MessageVideo from './MessageVideo';
import Photo from './Photo';

type MessageAttachmentProps = {
	message: IMessageWithUser;
	channelId?: string;
	onContextMenu?: (event: React.MouseEvent<HTMLImageElement>) => void;
	mode: ChannelStreamMode;
	observeIntersectionForLoading?: ObserveFn;
	isInSearchMessage?: boolean;
	isTopic?: boolean;
	defaultMaxWidth?: number;
};

function areAttachmentLiveFieldsEqual(prev: IMessageWithUser, next: IMessageWithUser): boolean {
	return (
		prev.attachments === next.attachments &&
		prev.content === next.content &&
		prev.isSending === next.isSending &&
		prev.create_time_seconds === next.create_time_seconds
	);
}

/** Redux subscription scoped to attachment/presign fields — re-renders without bumping message row memo. */
function useLiveMessageForAttachments(messageProp: IMessageWithUser, channelId?: string): IMessageWithUser {
	const resolvedChannelId = (channelId ?? messageProp.channel_id) as string;
	const messageId = messageProp.id as string;

	return useAppSelector((state) => selectMessageByMessageId(state, resolvedChannelId, messageId) ?? messageProp, areAttachmentLiveFieldsEqual);
}

function usePresignExpiryNow(hasPresignPending: boolean, messageCreateTimeSeconds?: number): number {
	const [nowSeconds, setNowSeconds] = useState(() => Math.floor(Date.now() / 1000));

	useEffect(() => {
		if (!hasPresignPending) return;

		const delay = getPresignExpiryDelayMs(messageCreateTimeSeconds);
		if (delay === null) return;

		if (delay === 0) {
			setNowSeconds(Math.floor(Date.now() / 1000));
			return;
		}

		const timeout = setTimeout(() => {
			setNowSeconds(Math.floor(Date.now() / 1000));
		}, delay);

		return () => clearTimeout(timeout);
	}, [hasPresignPending, messageCreateTimeSeconds]);

	return nowSeconds;
}

const classifyAttachments = (attachments: ApiMessageAttachment[], message: IMessageWithUser) => {
	const videos: ApiMessageAttachment[] = [];
	const images: (ApiMessageAttachment & { create_time?: string })[] = [];
	const documents: ApiMessageAttachment[] = [];
	const audio: ApiMessageAttachment[] = [];

	const messageCreateTimeSeconds = getMessageCreateTimeSeconds(message);

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
				attachment.filetype?.startsWith(ETypeLinkMedia.IMAGE_PREFIX) ||
				attachment.filetype === EMimeTypes.sticker) &&
				!attachment.filetype?.includes('svg+xml')) ||
			attachment.filetype?.includes(EMimeTypes.heic) ||
			attachment.url?.endsWith('.gif')
		) {
			const createTimeSeconds = attachment.create_time_seconds || messageCreateTimeSeconds;
			const resultAttach: ApiMessageAttachment & { create_time?: string } = {
				...attachment,
				sender_id: message.sender_id,
				message_id: message.id,
				create_time: createTimeSeconds ? new Date(Number(createTimeSeconds) * 1000).toISOString() : undefined
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
}> = memo(
	({ attachments, message, onContextMenu, mode, observeIntersectionForLoading, isInSearchMessage, defaultMaxWidth }) => {
		const classified = useMemo(() => classifyAttachments(attachments, message), [attachments, message]);

		const { videos, images, documents, audio } = classified;
		const presignFinishKeys = useMemo(() => parsePresignFinishKeys(message.content), [message.content]);
		const presignAttachmentSource = message.attachments ?? attachments;
		const isPresignPendingForUrl = useCallback(
			(url?: string) => isPresignAttachmentPending(url, presignFinishKeys, presignAttachmentSource),
			[presignFinishKeys, presignAttachmentSource]
		);

		const { isMobile } = useAppLayout();
		return (
			<>
				{videos.length > 0 && (
					<div className="flex flex-row justify-start flex-wrap w-full gap-2 mt-5">
						{videos.map((video, index) => (
							<div key={index} className="gap-y-2 max-w-full min-w-0">
								<MessageVideo
									attachmentData={video}
									isMobile={isMobile}
									isSending={message.isSending}
									isPresignPending={isPresignPendingForUrl(video.url)}
									observeIntersection={observeIntersectionForLoading}
								/>
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
						isPresignPendingForUrl={isPresignPendingForUrl}
					/>
				)}

				{documents.length > 0 &&
					documents
						.filter((document) => !isPresignPendingForUrl(document.url))
						.map((document, index) => (
							<MessageLinkFile key={`${index}_${document.url}`} attachmentData={document} mode={mode} message={message} />
						))}

				{audio.length > 0 &&
					audio
						.filter((audioItem) => !isPresignPendingForUrl(audioItem.url))
						.map((audioItem, index) => <MessageAudio key={`${index}_${audioItem.url}`} audioUrl={audioItem.url || ''} />)}
			</>
		);
	},
	(prev, next) =>
		prev.attachments === next.attachments &&
		prev.message.id === next.message.id &&
		prev.message.isSending === next.message.isSending &&
		prev.message.attachments === next.message.attachments &&
		prev.message.content === next.message.content &&
		prev.mode === next.mode
);

Attachments.displayName = 'Attachments';

// TODO: refactor component for message lines
const MessageAttachment = memo(
	({
		message: messageProp,
		channelId,
		onContextMenu,
		mode,
		observeIntersectionForLoading,
		isInSearchMessage,
		defaultMaxWidth
	}: MessageAttachmentProps) => {
		const message = useLiveMessageForAttachments(messageProp, channelId);
		const messageCreateTimeSeconds = useMemo(() => getMessageCreateTimeSeconds(message), [message]);
		const hasPresignPending = useMemo(
			() => hasActivePresignPendingAttachments(message.attachments, message.content),
			[message.attachments, message.content]
		);
		const nowSeconds = usePresignExpiryNow(hasPresignPending, messageCreateTimeSeconds);

		const validateAttachment = useMemo(() => {
			const rawAttachments = (message.attachments || []).filter((attachment) => Object.keys(attachment).length !== 0);
			if (!rawAttachments.length) return null;
			const visibleAttachments = filterExpiredPresignAttachments(rawAttachments, message.content, messageCreateTimeSeconds, nowSeconds);

			return visibleAttachments.length ? visibleAttachments : null;
		}, [message.attachments, message.content, messageCreateTimeSeconds, nowSeconds]);
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
	},
	(prev, next) =>
		prev.message.id === next.message.id &&
		prev.channelId === next.channelId &&
		prev.mode === next.mode &&
		prev.isInSearchMessage === next.isInSearchMessage &&
		prev.defaultMaxWidth === next.defaultMaxWidth
);

MessageAttachment.displayName = 'MessageAttachment';

const ImageAlbum = memo(
	({
		images,
		message,
		mode,
		onContextMenu,
		observeIntersectionForLoading,
		isInSearchMessage,
		defaultMaxWidth,
		isMobile,
		isPresignPendingForUrl
	}: {
		images: ApiMessageAttachment[];
		message: IMessageWithUser;
		mode?: ChannelStreamMode;
		onContextMenu?: (event: React.MouseEvent<HTMLImageElement>) => void;
		observeIntersectionForLoading?: ObserveFn;
		isInSearchMessage?: boolean;
		defaultMaxWidth?: number;
		isMobile?: boolean;
		isPresignPendingForUrl?: (url?: string) => boolean;
	}) => {
		const dispatch = useAppDispatch();

		const handleClick = useCallback(
			async (url?: string, attachmentId?: string) => {
				// move code from old image view component
				const state = getStore()?.getState();
				const currentClanId = selectCurrentClanId(state);
				const currentDm = selectCurrentDM(state);
				const currentChannel = selectCurrentChannel(state);
				const currentChannelId = currentChannel?.id;
				const currentDmGroupId = currentDm?.id;
				const attachmentData = attachmentId
					? images.find((item) => generateAttachmentId(item, message.id) === attachmentId)
					: images.find((item) => item.url === url);

				if (!attachmentData) return;

				const messageCreateTime = getMessageCreateTimeSeconds(message);
				const resolvedCreateTimeSeconds = attachmentData?.create_time_seconds || messageCreateTime || Date.now() / 1000;
				const enhancedAttachmentData = {
					...attachmentData,
					create_time_seconds: resolvedCreateTimeSeconds
				};

				dispatch(attachmentActions.setMode(mode));

				dispatch(
					attachmentActions.setCurrentAttachment({
						...enhancedAttachmentData,
						id: generateAttachmentId(attachmentData, message.id),
						uploader: enhancedAttachmentData.sender_id || message.sender_id,
						create_time_seconds: enhancedAttachmentData.create_time_seconds
					})
				);

				dispatch(attachmentActions.setOpenModalAttachment(true));
				dispatch(attachmentActions.setAttachment(enhancedAttachmentData.url));

				if ((currentClanId && currentChannelId) || currentDmGroupId) {
					const clanId = currentClanId === '0' ? '0' : (currentClanId as string);
					const channelId = currentClanId !== '0' ? (currentChannelId as string) : (currentDmGroupId as string);
					const messageTimestamp = message.create_time_seconds ? message.create_time_seconds : undefined;
					const beforeTimestamp = messageTimestamp ? messageTimestamp + 86400 : undefined;
					dispatch(
						attachmentActions.fetchChannelAttachments({
							clanId,
							channelId,
							state: undefined,
							limit: 100,
							before: beforeTimestamp
						})
					).unwrap();
				}

				dispatch(attachmentActions.setMessageId(message.id));
			},
			[images, message, mode, dispatch]
		);

		const albumLayout = useMemo(() => {
			if (images.length >= 2) {
				return calculateAlbumLayout(false, true, images, isMobile, defaultMaxWidth);
			}
			return null;
		}, [images, isMobile, defaultMaxWidth]);

		const photoProps = useMemo(() => {
			if (images.length === 1) {
				const firstImage = images[0];
				const props = {
					mediaType: 'photo',
					id: message.id,
					url: firstImage?.url,
					width: firstImage?.width || 0,
					height: firstImage?.height || 150,
					filetype: firstImage?.filetype
				} as ApiPhoto & { filetype?: string };

				if (firstImage?.thumbnail) {
					props.thumbnail = {
						dataUri: firstImage.thumbnail
					};
				}

				return props;
			}
			return null;
		}, [images, message.id]);

		if (images.length >= 2 && albumLayout) {
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
						isPresignPendingForUrl={isPresignPendingForUrl}
						isMobile={isMobile}
						messageId={message.id}
						images={images}
					/>
				</div>
			);
		}

		if (images.length === 1 && photoProps) {
			const firstImage = images[0];
			const attachmentId = firstImage ? generateAttachmentId(firstImage, message.id) : message.id;
			const isPresignPending = isPresignPendingForUrl?.(firstImage?.url);
			return (
				<div className="w-full py-1">
					<Photo
						id={attachmentId}
						key={message.id}
						photo={photoProps}
						observeIntersection={observeIntersectionForLoading}
						onClick={handleClick}
						isDownloading={false}
						onContextMenu={onContextMenu}
						isInSearchMessage={isInSearchMessage}
						isSending={message.isSending}
						isPresignPending={isPresignPending}
						loadWhenUnpending={!isPresignPending}
						isMobile={isMobile}
					/>
				</div>
			);
		}

		return null;
	},
	(prev, next) =>
		prev.images === next.images &&
		prev.message.id === next.message.id &&
		prev.message.isSending === next.message.isSending &&
		prev.message.content === next.message.content &&
		prev.mode === next.mode &&
		prev.isMobile === next.isMobile &&
		prev.defaultMaxWidth === next.defaultMaxWidth
);

ImageAlbum.displayName = 'ImageAlbum';

export default MessageAttachment;
