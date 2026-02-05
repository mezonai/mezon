import { getCurrentChatData } from '@mezon/core';
import { attachmentActions, getStore, selectCurrentChannel, selectCurrentClanId, selectCurrentDM, useAppDispatch } from '@mezon/store';
import type { IImageWindowProps, IMessageWithUser } from '@mezon/utils';
import {
	EMimeTypes,
	ETypeLinkMedia,
	createImgproxyUrl,
	generateAttachmentId,
	getAttachmentDataForWindow,
	isMediaTypeNotSupported
} from '@mezon/utils';
import isElectron from 'is-electron';
import type { ChannelStreamMode } from 'mezon-js';
import type { ApiMessageAttachment } from 'mezon-js/api.gen';
import { memo, useCallback, useMemo } from 'react';

type TimelineAttachmentProps = {
	message: IMessageWithUser;
	maxThumbnails?: number;
	mode?: ChannelStreamMode;
};

const classifyAttachments = (attachments: ApiMessageAttachment[]) => {
	const images: ApiMessageAttachment[] = [];
	const videos: ApiMessageAttachment[] = [];
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

		others.push(attachment);
	});

	return { images, videos, others };
};

const TimelineAttachment = memo(({ message, maxThumbnails = 3, mode }: TimelineAttachmentProps) => {
	const dispatch = useAppDispatch();
	const validateAttachment = useMemo(
		() => (message.attachments || [])?.filter((attachment) => Object.keys(attachment).length !== 0),
		[message.attachments]
	);

	const { images, videos } = useMemo(() => classifyAttachments(validateAttachment), [validateAttachment]);

	const mediaItems = useMemo(() => [...images, ...videos], [images, videos]);

	const visibleItems = useMemo(() => mediaItems.slice(0, maxThumbnails), [mediaItems, maxThumbnails]);
	const remainingCount = mediaItems.length - maxThumbnails;

	const handleClick = useCallback(
		async (attachmentData: ApiMessageAttachment) => {
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

			if (isElectron()) {
				const clanId = currentClanId === '0' ? '0' : (currentClanId as string);
				const channelId = currentClanId !== '0' ? (currentChannelId as string) : (currentDmGroupId as string);

				const messageTimestamp = message.create_time_seconds ? message.create_time_seconds : undefined;
				const beforeTimestamp = messageTimestamp ? messageTimestamp + 86400 : undefined;
				const data = await dispatch(
					attachmentActions.fetchChannelAttachments({
						clanId,
						channelId,
						limit: 100,
						before: beforeTimestamp
					})
				).unwrap();

				const currentChatUsersEntities = getCurrentChatData()?.currentChatUsersEntities;
				const listAttachmentsByChannel = data?.attachments
					?.filter(
						(att) =>
							att?.filetype?.startsWith(ETypeLinkMedia.IMAGE_PREFIX) ||
							att?.filetype?.startsWith(ETypeLinkMedia.VIDEO_PREFIX) ||
							att?.filetype?.includes(EMimeTypes.mp4) ||
							att?.filetype?.includes(EMimeTypes.mov)
					)
					.map((attachmentRes) => ({
						...attachmentRes,
						id: attachmentRes.id || '',
						channelId,
						clanId,
						isVideo:
							attachmentRes?.filetype?.startsWith(ETypeLinkMedia.VIDEO_PREFIX) ||
							attachmentRes?.filetype?.includes(EMimeTypes.mp4) ||
							attachmentRes?.filetype?.includes(EMimeTypes.mov)
					}))
					.sort((a, b) => {
						if (a.create_time_seconds && b.create_time_seconds) {
							return b.create_time_seconds - a.create_time_seconds;
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
							`${window.location.origin}/assets/images/anonymous-avatar.jpg`) as string
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
							selectedImageIndex
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
									`${window.location.origin}/assets/images/anonymous-avatar.jpg`) as string
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
		[message, mode, dispatch]
	);

	if (mediaItems.length === 0) return null;

	return (
		<div className="flex gap-2 mt-3">
			{visibleItems.map((item, index) => {
				const isVideo =
					item.filetype?.startsWith(ETypeLinkMedia.VIDEO_PREFIX) ||
					item.filetype?.includes(EMimeTypes.mp4) ||
					item.filetype?.includes(EMimeTypes.mov);

				const thumbnailUrl =
					isVideo && item.thumbnail
						? createImgproxyUrl(item.thumbnail, {
								width: 120,
								height: 120,
								resizeType: 'fill'
							})
						: createImgproxyUrl(item.url || '', {
								width: 120,
								height: 120,
								resizeType: 'fill'
							});

				return (
					<div
						key={`${item.url}-${index}`}
						className="relative w-[50px] h-[50px] rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
						onClick={() => handleClick(item)}
					>
						{isVideo ? (
							<video src={item.url} className="w-full h-full object-cover" muted playsInline />
						) : (
							<img src={thumbnailUrl} alt="" className="w-full h-full object-cover" />
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
	);
});

TimelineAttachment.displayName = 'TimelineAttachment';

export default TimelineAttachment;
