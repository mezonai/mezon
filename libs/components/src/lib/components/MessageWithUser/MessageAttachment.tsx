import { useCdnUrlSigner } from '@mezon/core';
import {
	attachmentActions,
	buildTopicAttachmentList,
	getStore,
	selectCurrentChannel,
	selectCurrentClanId,
	selectCurrentDM,
	selectCurrentTopicId,
	selectFirstMessageOfCurrentTopic,
	selectMessageByMessageId,
	selectMessageEntitiesByChannelId,
	selectMessageIdsByChannelId,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import type { ApiPhoto, IMessageWithUser, ObserveFn, PreSendMediaAttachment } from '@mezon/utils';
import {
	EMimeTypes,
	ETypeLinkMedia,
	PRESIGN_INGEST_PENDING_MAX_AGE_SEC,
	PRESIGN_PENDING_MAX_AGE_SEC,
	calculateAlbumLayout,
	filterExpiredPresignAttachments,
	generateAttachmentId,
	getMessageCreateTimeSeconds,
	getPresignExpiryDelayMs,
	hasActivePresignPendingAttachments,
	isMediaTypeNotSupported,
	isPresignAttachmentPending,
	isPresignIngestAttachment,
	isRealClanId,
	isTranscodedVideoContainer,
	parsePresignFinishKeys,
	parsePresignIngestKeys,
	useAppLayout
} from '@mezon/utils';

import { MezonIcon, MzIcons40 } from '@mezon/ui';
import type { ApiMessageAttachment, ChannelStreamMode } from 'mezon-js';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Album from './Album';
import { MessageAudio } from './MessageAudio/MessageAudio';
import MessageLinkFile from './MessageLinkFile';
import MessageVideo from './MessageVideo';
import Photo from './Photo';
import { usePresignRefresh } from './usePresignRefresh';

type MessageAttachmentProps = {
	message: IMessageWithUser;
	channelId?: string;
	onContextMenu?: (event: React.MouseEvent<HTMLImageElement>) => void;
	mode: ChannelStreamMode;
	observeIntersectionForLoading?: ObserveFn;
	isInSearchMessage?: boolean;
	isTopic?: boolean;
	defaultMaxWidth?: number;
	isPreview?: boolean;
	quickReaction?: React.ReactNode;
};

function areAttachmentLiveFieldsEqual(prev: IMessageWithUser, next: IMessageWithUser): boolean {
	return (
		prev.attachments === next.attachments &&
		prev.content === next.content &&
		prev.isSending === next.isSending &&
		prev.create_time_seconds === next.create_time_seconds
	);
}

function useLiveMessageForAttachments(messageProp: IMessageWithUser, channelId?: string, isPreview?: boolean): IMessageWithUser {
	const resolvedChannelId = (messageProp.channel_id ?? channelId) as string;
	const messageId = messageProp.id as string;

	return useAppSelector(
		(state) => (isPreview ? messageProp : (selectMessageByMessageId(state, resolvedChannelId, messageId) ?? messageProp)),
		areAttachmentLiveFieldsEqual
	);
}

function usePresignExpiryNow(hasPresignPending: boolean, messageCreateTimeSeconds?: number, hasIngestAttachments = false): number {
	const [nowSeconds, setNowSeconds] = useState(() => Math.floor(Date.now() / 1000));

	useEffect(() => {
		if (!hasPresignPending) return;

		const maxAges = hasIngestAttachments ? [PRESIGN_PENDING_MAX_AGE_SEC, PRESIGN_INGEST_PENDING_MAX_AGE_SEC] : [PRESIGN_PENDING_MAX_AGE_SEC];
		const timeouts = maxAges.map((maxAgeSec) => {
			const delay = getPresignExpiryDelayMs(messageCreateTimeSeconds, Date.now(), maxAgeSec);
			if (delay === null) return undefined;

			if (delay === 0) {
				setNowSeconds(Math.floor(Date.now() / 1000));
				return undefined;
			}

			return setTimeout(() => {
				setNowSeconds(Math.floor(Date.now() / 1000));
			}, delay);
		});

		return () => timeouts.forEach((timeout) => clearTimeout(timeout));
	}, [hasPresignPending, messageCreateTimeSeconds, hasIngestAttachments]);

	return nowSeconds;
}

const classifyAttachments = (attachments: ApiMessageAttachment[], message: IMessageWithUser) => {
	const videos: ApiMessageAttachment[] = [];
	const images: (ApiMessageAttachment & { create_time?: string })[] = [];
	const documents: ApiMessageAttachment[] = [];
	const audio: ApiMessageAttachment[] = [];

	const messageCreateTimeSeconds = getMessageCreateTimeSeconds(message);

	attachments.forEach((attachment) => {
		if (isMediaTypeNotSupported(attachment.filetype, attachment.url)) {
			documents.push(attachment);
			return;
		}

		if (
			((attachment.filetype?.includes(EMimeTypes.mp4) || attachment.filetype?.includes(EMimeTypes.mov)) &&
				!attachment.url?.includes(EMimeTypes.tenor)) ||
			(attachment.filetype?.startsWith(ETypeLinkMedia.VIDEO_PREFIX) && !attachment.filetype?.endsWith(ETypeLinkMedia.VIDEO_TS_FILE)) ||
			isTranscodedVideoContainer(attachment.url)
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

const pickTopicMedia = (attachments: ApiMessageAttachment[], message: IMessageWithUser): ApiMessageAttachment[] => {
	const { videos, images } = classifyAttachments(attachments, message);
	return [...videos, ...images.filter((image) => image.filetype !== EMimeTypes.sticker)];
};

type SignCdnUrl = <T extends string | undefined>(url: T) => T;
type IsAwaitingSignature = (url?: string) => boolean;

const signAttachment = (
	attachment: ApiMessageAttachment,
	signCdnUrl: SignCdnUrl,
	isAwaitingSignature?: IsAwaitingSignature
): ApiMessageAttachment => ({
	...attachment,
	url: signCdnUrl(attachment.url),
	thumbnail: isAwaitingSignature?.(attachment.thumbnail) ? undefined : signCdnUrl(attachment.thumbnail)
});

const Attachments: React.FC<{
	attachments: ApiMessageAttachment[];
	message: IMessageWithUser;
	onContextMenu: any;
	mode: ChannelStreamMode;
	observeIntersectionForLoading?: ObserveFn;
	isInSearchMessage?: boolean;
	isTopic?: boolean;
	defaultMaxWidth?: number;
	quickReaction?: React.ReactNode;
}> = memo(
	({ attachments, message, onContextMenu, mode, observeIntersectionForLoading, isInSearchMessage, isTopic, defaultMaxWidth, quickReaction }) => {
		const classified = useMemo(() => classifyAttachments(attachments, message), [attachments, message]);
		const cdnUrls = useMemo(() => attachments.flatMap((attachment) => [attachment.url, attachment.thumbnail]), [attachments]);
		const { signCdnUrl, isAwaitingSignature } = useCdnUrlSigner(cdnUrls, message.channel_id);

		const { videos, images, documents, audio } = classified;
		const presignFinishKeys = useMemo(() => parsePresignFinishKeys(message.content), [message.content]);
		const presignIngestKeys = useMemo(() => parsePresignIngestKeys(message.content), [message.content]);
		const presignAttachmentSource = message.attachments ?? attachments;
		const isPresignPendingForUrl = useCallback(
			(url?: string) => isPresignAttachmentPending(url, presignFinishKeys, presignAttachmentSource),
			[presignFinishKeys, presignAttachmentSource]
		);

		const { isMobile } = useAppLayout();
		const quickReactionTarget = audio.length ? 'audio' : documents.length ? 'document' : images.length ? 'image' : 'video';
		return (
			<>
				{videos.length > 0 && (
					<div className="flex flex-row justify-start flex-wrap w-full gap-2 mt-5">
						{videos.map((video, index) => {
							const videoQuickReaction = quickReactionTarget === 'video' && index === videos.length - 1 ? quickReaction : undefined;
							return (
								<div key={index} className={`gap-y-2 max-w-full min-w-0 ${videoQuickReaction ? 'relative' : ''}`}>
									<MessageVideo
										attachmentData={signAttachment(video, signCdnUrl, isAwaitingSignature)}
										isMobile={isMobile}
										isSending={message.isSending}
										isPresignPending={isPresignPendingForUrl(video.url)}
										isIngest={isPresignIngestAttachment(video.url, presignIngestKeys)}
										isCdnSignaturePending={isAwaitingSignature(video.url)}
										observeIntersection={observeIntersectionForLoading}
									/>
									{videoQuickReaction}
								</div>
							);
						})}
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
						isTopic={isTopic}
						defaultMaxWidth={defaultMaxWidth}
						isMobile={isMobile}
						isPresignPendingForUrl={isPresignPendingForUrl}
						signCdnUrl={signCdnUrl}
						isAwaitingSignature={isAwaitingSignature}
						quickReaction={quickReactionTarget === 'image' ? quickReaction : undefined}
					/>
				)}

				{/* A pending file used to be dropped from the row entirely, so the
				    reader saw the text with nothing under it and then a box appearing
				    out of nowhere. Show the box, and say what it is waiting for. */}
				{documents.length > 0 &&
					documents.map((document, index) => (
						<MessageLinkFile
							key={`${index}_${document.url}`}
							attachmentData={signAttachment(document, signCdnUrl, isAwaitingSignature)}
							isCdnSignaturePending={isAwaitingSignature(document.url)}
							mode={mode}
							message={message}
							isPresignPending={isPresignPendingForUrl(document.url)}
							quickReaction={quickReactionTarget === 'document' && index === documents.length - 1 ? quickReaction : undefined}
						/>
					))}

				{audio.length > 0 &&
					audio.map((audioItem, index) => (
						<MessageAudio
							key={`${index}_${audioItem.url}`}
							audioUrl={isAwaitingSignature(audioItem.url) ? '' : signCdnUrl(audioItem.url || '')}
							isPresignPending={message.isSending || isPresignPendingForUrl(audioItem.url)}
							quickReaction={quickReactionTarget === 'audio' && index === audio.length - 1 ? quickReaction : undefined}
						/>
					))}
			</>
		);
	},
	(prev, next) =>
		prev.attachments === next.attachments &&
		prev.message.id === next.message.id &&
		prev.message.isSending === next.message.isSending &&
		prev.message.attachments === next.message.attachments &&
		prev.message.content === next.message.content &&
		prev.mode === next.mode &&
		prev.isTopic === next.isTopic &&
		!!prev.quickReaction === !!next.quickReaction
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
		isTopic,
		defaultMaxWidth,
		isPreview,
		quickReaction
	}: MessageAttachmentProps) => {
		const { t } = useTranslation('message');
		const message = useLiveMessageForAttachments(messageProp, channelId, isPreview);
		const messageCreateTimeSeconds = useMemo(() => getMessageCreateTimeSeconds(message), [message]);
		const hasPresignPending = useMemo(
			() => hasActivePresignPendingAttachments(message.attachments, message.content),
			[message.attachments, message.content]
		);
		const hasIngestAttachments = useMemo(() => parsePresignIngestKeys(message.content).length > 0, [message.content]);
		const nowSeconds = usePresignExpiryNow(hasPresignPending, messageCreateTimeSeconds, hasIngestAttachments);
		usePresignRefresh({
			hasPresignPending,
			clanId: message.clan_id,
			bucketId: (message.channel_id ?? channelId) as string,
			parentChannelId: channelId,
			messageId: message.id,
			createTimeSeconds: messageCreateTimeSeconds,
			attachments: message.attachments,
			content: message.content
		});

		const validateAttachment = useMemo(() => {
			const rawAttachments = (message.attachments || []).filter((attachment) => Object.keys(attachment).length !== 0);
			if (!rawAttachments.length) return null;
			const visibleAttachments = filterExpiredPresignAttachments(rawAttachments, message.content, messageCreateTimeSeconds, nowSeconds);

			return visibleAttachments.length ? visibleAttachments : null;
		}, [message.attachments, message.content, messageCreateTimeSeconds, nowSeconds]);
		if (!message?.attachments?.length) {
			return null;
		}

		if (!validateAttachment) {
			const attachment = message.attachments?.[0];

			return (
				<div
					className="break-all w-full relative cursor-default gap-3 flex items-center mt-[10px] py-3 pl-3 pr-3 rounded-lg max-w-full bg-item-theme border-theme-primary"
					role="button"
					aria-label={t('failAttachment')}
				>
					<div className="relative flex items-center shrink-0">
						<MezonIcon icon={MzIcons40.mzFile} className="text-[var(--mz-icon)]" />
					</div>

					<div className="flex-1 min-w-0">
						<p className="text-red-500">{attachment?.filename ?? t('attachments.attachment')}</p>
						<p className="text-theme-primary">{t('failAttachment')}</p>
					</div>
					{quickReaction}
				</div>
			);
		}
		return (
			<Attachments
				mode={mode}
				message={message}
				attachments={validateAttachment}
				onContextMenu={onContextMenu}
				observeIntersectionForLoading={observeIntersectionForLoading}
				isInSearchMessage={isInSearchMessage}
				isTopic={isTopic}
				defaultMaxWidth={defaultMaxWidth}
				quickReaction={quickReaction}
			/>
		);
	},
	(prev, next) =>
		prev.message.id === next.message.id &&
		prev.channelId === next.channelId &&
		prev.mode === next.mode &&
		prev.isInSearchMessage === next.isInSearchMessage &&
		prev.isTopic === next.isTopic &&
		prev.defaultMaxWidth === next.defaultMaxWidth &&
		prev.isPreview === next.isPreview &&
		!!prev.quickReaction === !!next.quickReaction &&
		prev.message?.content?.presign_finish === next.message?.content?.presign_finish
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
		isTopic,
		defaultMaxWidth,
		isMobile,
		isPresignPendingForUrl,
		signCdnUrl,
		isAwaitingSignature,
		quickReaction
	}: {
		images: ApiMessageAttachment[];
		message: IMessageWithUser;
		mode?: ChannelStreamMode;
		onContextMenu?: (event: React.MouseEvent<HTMLImageElement>) => void;
		observeIntersectionForLoading?: ObserveFn;
		isInSearchMessage?: boolean;
		isTopic?: boolean;
		defaultMaxWidth?: number;
		isMobile?: boolean;
		isPresignPendingForUrl?: (url?: string) => boolean;
		signCdnUrl: SignCdnUrl;
		isAwaitingSignature: IsAwaitingSignature;
		quickReaction?: React.ReactNode;
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

				const topicId = isTopic ? selectCurrentTopicId(state) : undefined;
				if (topicId) {
					const topicMessageIds = selectMessageIdsByChannelId(state, topicId);
					const topicMessageEntities = selectMessageEntitiesByChannelId(state, topicId);
					const firstTopicMessage = currentChannelId ? selectFirstMessageOfCurrentTopic(state, currentChannelId) : undefined;
					const topicMessages: IMessageWithUser[] = [];
					if (firstTopicMessage && !topicMessageIds.includes(firstTopicMessage.id)) {
						topicMessages.push(firstTopicMessage);
					}
					for (const id of topicMessageIds) {
						const topicMessage = topicMessageEntities[id];
						if (topicMessage) {
							topicMessages.push(topicMessage);
						}
					}
					dispatch(
						attachmentActions.setChannelAttachments({
							channelId: topicId,
							attachments: buildTopicAttachmentList(topicMessages, pickTopicMedia),
							hasMoreBefore: false,
							hasMoreAfter: false
						})
					);
					dispatch(attachmentActions.setListChannelId(topicId));
					dispatch(attachmentActions.setMessageId(message.id));
					return;
				}

				dispatch(attachmentActions.setListChannelId(undefined));

				if ((currentClanId && currentChannelId) || currentDmGroupId) {
					const isRealClan = isRealClanId(currentClanId);
					const clanId = isRealClan ? currentClanId : '0';
					const channelId = isRealClan ? (currentChannelId as string) : (currentDmGroupId as string);
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
			[images, message, mode, dispatch, isTopic]
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
					url: signCdnUrl(firstImage?.url),
					width: firstImage?.width || 0,
					height: firstImage?.height || 150,
					filetype: firstImage?.filetype
				} as ApiPhoto & { filetype?: string };

				if (firstImage?.thumbnail) {
					props.thumbnail = {
						dataUri: signCdnUrl(firstImage.thumbnail)
					};
				}

				return props;
			}
			return null;
		}, [images, message.id, signCdnUrl]);

		if (images.length >= 2 && albumLayout) {
			return (
				<div className="w-full">
					<div className={quickReaction ? 'relative w-fit max-w-full' : ''}>
						<Album
							album={images.map((image) => signAttachment(image, signCdnUrl)) as any}
							observeIntersection={observeIntersectionForLoading}
							albumLayout={albumLayout}
							onClick={handleClick}
							onContextMenu={onContextMenu}
							isInSearchMessage={isInSearchMessage}
							isSending={message.isSending}
							isPresignPendingForUrl={isPresignPendingForUrl}
							isAwaitingSignatureForUrl={isAwaitingSignature}
							isMobile={isMobile}
							messageId={message.id}
							images={images}
						/>
						{quickReaction}
					</div>
				</div>
			);
		}

		if (images.length === 1 && photoProps) {
			const firstImage = images[0];
			const attachmentId = firstImage ? generateAttachmentId(firstImage, message.id) : message.id;
			const isPresignPending = isPresignPendingForUrl?.(firstImage?.url);
			const photoWrapperClass = !quickReaction
				? ''
				: photoProps.width || photoProps.filetype === EMimeTypes.sticker
					? 'relative w-fit max-w-full'
					: 'relative w-[150px] max-w-full';
			return (
				<div className="w-full py-1">
					<div className={photoWrapperClass}>
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
							localSource={(firstImage as PreSendMediaAttachment)?.local_source}
							loadWhenUnpending={!isPresignPending}
							isMobile={isMobile}
							isAwaitingSignature={isAwaitingSignature(firstImage?.url)}
						/>
						{quickReaction}
					</div>
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
		prev.isTopic === next.isTopic &&
		prev.isMobile === next.isMobile &&
		prev.defaultMaxWidth === next.defaultMaxWidth &&
		prev.signCdnUrl === next.signCdnUrl &&
		!!prev.quickReaction === !!next.quickReaction
);

ImageAlbum.displayName = 'ImageAlbum';

export default MessageAttachment;
