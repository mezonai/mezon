import { attachmentActions, getStore, selectCurrentChannel, selectCurrentClanId, selectCurrentDM, useAppDispatch } from '@mezon/store';
import type { IMessageWithUser } from '@mezon/utils';
import {
	EMimeTypes,
	ETypeLinkMedia,
	createImgproxyUrl,
	filterExpiredPresignAttachments,
	generateAttachmentId,
	getMessageCreateTimeSeconds,
	isAttachmentPresignPendingForMessage,
	isMediaTypeNotSupported
} from '@mezon/utils';

import type { ApiMessageAttachment, ChannelStreamMode } from 'mezon-js';
import { memo, useCallback, useMemo } from 'react';
import { MessageAudio } from './MessageAudio/MessageAudio';

type TimelineAttachmentProps = {
	message: IMessageWithUser;
	maxThumbnails?: number;
	mode?: ChannelStreamMode;
};

const classifyAttachments = (attachments: ApiMessageAttachment[]) => {
	const images: ApiMessageAttachment[] = [];
	const videos: ApiMessageAttachment[] = [];
	const audio: ApiMessageAttachment[] = [];
	const others: ApiMessageAttachment[] = [];

	attachments.forEach((attachment) => {
		if (isMediaTypeNotSupported(attachment.filetype)) {
			others.push(attachment);
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

		if (attachment.filetype?.startsWith(ETypeLinkMedia.IMAGE_PREFIX) || attachment.filetype === EMimeTypes.sticker) {
			images.push(attachment);
			return;
		}

		if (attachment.filetype?.includes(EMimeTypes.audio)) {
			audio.push(attachment);
			return;
		}

		others.push(attachment);
	});

	return { images, videos, audio, others };
};

const TimelineAttachment = memo(({ message, maxThumbnails = 3, mode }: TimelineAttachmentProps) => {
	const dispatch = useAppDispatch();
	const messageCreateTimeSeconds = useMemo(() => getMessageCreateTimeSeconds(message), [message]);
	const validateAttachment = useMemo(() => {
		const rawAttachments = (message.attachments || []).filter((attachment) => Object.keys(attachment).length !== 0);
		return filterExpiredPresignAttachments(rawAttachments, message.content, messageCreateTimeSeconds);
	}, [message.attachments, message.content, messageCreateTimeSeconds]);

	const isPresignPendingForUrl = useCallback((url?: string) => isAttachmentPresignPendingForMessage(url, message), [message]);

	const { images, videos, audio } = useMemo(() => classifyAttachments(validateAttachment), [validateAttachment]);

	const mediaItems = useMemo(() => [...images, ...videos], [images, videos]);

	const visibleItems = useMemo(() => mediaItems.slice(0, maxThumbnails), [mediaItems, maxThumbnails]);
	const remainingCount = mediaItems.length - maxThumbnails;

	const handleClick = useCallback(
		async (attachmentData: ApiMessageAttachment) => {
			if (isPresignPendingForUrl(attachmentData.url)) return;

			const state = getStore()?.getState();
			const currentClanId = selectCurrentClanId(state);
			const currentDm = selectCurrentDM(state);
			const currentChannel = selectCurrentChannel(state);
			const currentChannelId = currentChannel?.id;
			const currentDmGroupId = currentDm?.id;

			if (!attachmentData) return;

			const enhancedAttachmentData = {
				...attachmentData,
				create_time_seconds: attachmentData?.create_time_seconds || message.create_time_seconds || Date.now() / 1000
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
		[message, mode, dispatch, isPresignPendingForUrl]
	);

	if (mediaItems.length === 0 && audio.length === 0) return null;

	return (
		<div className="flex flex-col gap-2 mt-3">
			{mediaItems.length > 0 && (
				<div className="flex gap-2">
					{visibleItems.map((item, index) => {
						const isVideo =
							item.filetype?.startsWith(ETypeLinkMedia.VIDEO_PREFIX) ||
							item.filetype?.includes(EMimeTypes.mp4) ||
							item.filetype?.includes(EMimeTypes.mov);
						const isPresignPending = isPresignPendingForUrl(item.url);

						const thumbnailUrl = isPresignPending
							? undefined
							: isVideo
								? item.thumbnail
									? createImgproxyUrl(item.thumbnail, {
											width: 120,
											height: 120,
											resizeType: 'fill'
										})
									: item.url
										? createImgproxyUrl(item.url, {
												width: 120,
												height: 120,
												resizeType: 'fill'
											})
										: undefined
								: createImgproxyUrl(item.url || '', {
										width: 120,
										height: 120,
										resizeType: 'fill'
									});

						return (
							<div
								key={`${item.url}-${index}`}
								className={`relative w-[50px] h-[50px] rounded-lg overflow-hidden transition-opacity ${
									isPresignPending ? 'cursor-default' : 'cursor-pointer hover:opacity-90'
								}`}
								onClick={() => handleClick(item)}
							>
								{thumbnailUrl ? (
									<img src={thumbnailUrl} alt="" className="w-full h-full object-cover" />
								) : isVideo && item.url && !isPresignPending ? (
									<video src={item.url} className="w-full h-full object-cover" muted playsInline preload="none" />
								) : (
									<div className="w-full h-full bg-bgLightSecondary dark:bg-bgSecondary" />
								)}
								{isVideo && (
									<div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
										<svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
											<path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
										</svg>
									</div>
								)}
								{index === maxThumbnails - 1 && remainingCount > 0 && (
									<div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60">
										<span className="text-white text-2xl font-bold">+{remainingCount}</span>
									</div>
								)}
							</div>
						);
					})}
				</div>
			)}
			{audio.length > 0 &&
				audio
					.filter((audioItem) => !isPresignPendingForUrl(audioItem.url))
					.map((audioItem, index) => <MessageAudio key={`${index}_${audioItem.url}`} audioUrl={audioItem.url || ''} />)}
		</div>
	);
});

TimelineAttachment.displayName = 'TimelineAttachment';

export default TimelineAttachment;
