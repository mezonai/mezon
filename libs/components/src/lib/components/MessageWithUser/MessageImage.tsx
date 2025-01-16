import { useAttachments, useCurrentChat } from '@mezon/core';
import {
	attachmentActions,
	selectAllListAttachmentByChannel,
	selectCurrentChannel,
	selectCurrentClanId,
	selectCurrentDM,
	useAppDispatch
} from '@mezon/store';
import {
	IAttachmentEntity,
	IImageWindowProps,
	SEND_ATTACHMENT_DATA,
	SHOW_POSITION,
	createImgproxyUrl,
	getAttachmentDataForWindow,
	notImplementForGifOrStickerSendFromPanel
} from '@mezon/utils';
import isElectron from 'is-electron';
import { ChannelStreamMode } from 'mezon-js';
import { ApiMessageAttachment } from 'mezon-js/api.gen';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useMessageContextMenu } from '../ContextMenu';

export type MessageImage = {
	readonly attachmentData: ApiMessageAttachment & { create_time?: string };
	onContextMenu?: (event: React.MouseEvent<HTMLImageElement>) => void;
	mode?: ChannelStreamMode;
	messageId?: string;
	size?: { width: number; height: number };
};

const MessageImage = memo(({ attachmentData, onContextMenu, mode, messageId, size }: MessageImage) => {
	const dispatch = useAppDispatch();
	const { setOpenModalAttachment, setAttachment } = useAttachments();
	const checkImage = notImplementForGifOrStickerSendFromPanel(attachmentData);
	const { setImageURL, setPositionShow } = useMessageContextMenu();
	const currentClanId = useSelector(selectCurrentClanId);
	const [showLoader, setShowLoader] = useState(false);
	const currentChannel = useSelector(selectCurrentChannel);
	const currentDm = useSelector(selectCurrentDM);
	const currentChannelId = currentChannel?.id;
	const currentDmGroupId = currentDm?.id;

	const { currentChatUsersEntities } = useCurrentChat();
	const listAttachmentsByChannel = useSelector((state) => selectAllListAttachmentByChannel(state, currentChannelId || currentDmGroupId || ''));
	let width = attachmentData.width || 0;
	let height = attachmentData.height || 150;

	const handleClick = useCallback(
		(url: string) => {
			if (checkImage) return;

			if (isElectron()) {
				const currentImageUploader = currentChatUsersEntities?.[attachmentData.sender_id as string];
				window.electron.openImageWindow({
					...attachmentData,
					url: createImgproxyUrl(attachmentData.url || '', {
						width: attachmentData.width ? (attachmentData.width > 1600 ? 1600 : attachmentData.width) : 0,
						height: attachmentData.height ? (attachmentData.height > 900 ? 900 : attachmentData.height) : 0,
						resizeType: 'fit'
					}),
					uploaderData: {
						name:
							currentImageUploader?.clan_nick || currentImageUploader?.user?.display_name || currentImageUploader?.user?.username || '',
						avatar: (currentImageUploader?.clan_avatar || currentImageUploader?.user?.avatar_url) as string
					},
					realUrl: attachmentData.url || '',
					channelImagesData: {
						channelLabel: (currentChannelId ? currentChannel?.channel_label : currentDm.channel_label) as string,
						images: [],
						selectedImageIndex: 0
					}
				});
				if ((currentClanId && currentChannelId) || currentDmGroupId) {
					const clanId = currentClanId === '0' ? '0' : (currentClanId as string);
					const channelId = currentClanId !== '0' ? (currentChannelId as string) : (currentDmGroupId as string);
					if (listAttachmentsByChannel) {
						const imageListWithUploaderInfo = getAttachmentDataForWindow(listAttachmentsByChannel, currentChatUsersEntities);
						const selectedImageIndex = listAttachmentsByChannel.findIndex((image) => image.url === attachmentData.url);
						const channelImagesData: IImageWindowProps = {
							channelLabel: (currentChannelId ? currentChannel?.channel_label : currentDm.channel_label) as string,
							images: imageListWithUploaderInfo,
							selectedImageIndex: selectedImageIndex
						};

						window.electron.openImageWindow({
							...attachmentData,
							url: createImgproxyUrl(attachmentData.url || '', {
								width: attachmentData.width ? (attachmentData.width > 1600 ? 1600 : attachmentData.width) : 0,
								height: attachmentData.height ? (attachmentData.height > 900 ? 900 : attachmentData.height) : 0,
								resizeType: 'fit'
							}),
							uploaderData: {
								name:
									currentImageUploader?.clan_nick ||
									currentImageUploader?.user?.display_name ||
									currentImageUploader?.user?.username ||
									'',
								avatar: (currentImageUploader?.clan_avatar || currentImageUploader?.user?.avatar_url) as string
							},
							realUrl: attachmentData.url || '',
							channelImagesData
						});
						return;
					}
					dispatch(attachmentActions.fetchChannelAttachments({ clanId, channelId }))
						.then((data) => {
							const attachmentList = data.payload as IAttachmentEntity[];
							const imageList = attachmentList?.filter((image) => image.filetype?.includes('image'));
							const imageListWithUploaderInfo = getAttachmentDataForWindow(imageList, currentChatUsersEntities);
							const selectedImageIndex = imageList.findIndex((image) => image.url === attachmentData.url);
							return { imageListWithUploaderInfo, selectedImageIndex };
						})
						.then(({ imageListWithUploaderInfo, selectedImageIndex }) => {
							const channelImagesData: IImageWindowProps = {
								channelLabel: (currentChannelId ? currentChannel?.channel_label : currentDm.channel_label) as string,
								images: imageListWithUploaderInfo,
								selectedImageIndex: selectedImageIndex
							};
							window.electron.send(SEND_ATTACHMENT_DATA, { ...channelImagesData });
							window.electron.openImageWindow({
								...attachmentData,
								url: createImgproxyUrl(attachmentData.url || '', {
									width: attachmentData.width ? (attachmentData.width > 1600 ? 1600 : attachmentData.width) : 0,
									height: attachmentData.height ? (attachmentData.height > 900 ? 900 : attachmentData.height) : 0,
									resizeType: 'fit'
								}),
								uploaderData: {
									name:
										currentImageUploader?.clan_nick ||
										currentImageUploader?.user?.display_name ||
										currentImageUploader?.user?.username ||
										'',
									avatar: (currentImageUploader?.clan_avatar || currentImageUploader?.user?.avatar_url) as string
								},
								realUrl: attachmentData.url || '',
								channelImagesData
							});
						});
				}
			} else {
				dispatch(attachmentActions.setMode(mode));
				setOpenModalAttachment(true);
				setAttachment(url);
				dispatch(
					attachmentActions.setCurrentAttachment({
						id: attachmentData.message_id as string,
						uploader: attachmentData.sender_id,
						create_time: attachmentData.create_time
					})
				);

				if ((currentClanId && currentChannelId) || currentDmGroupId) {
					const clanId = currentClanId === '0' ? '0' : (currentClanId as string);
					const channelId = currentClanId !== '0' ? (currentChannelId as string) : (currentDmGroupId as string);
					dispatch(attachmentActions.fetchChannelAttachments({ clanId, channelId }));
				}

				dispatch(attachmentActions.setMessageId(messageId));
			}
		},
		[listAttachmentsByChannel?.length, currentChannelId, currentDmGroupId]
	);

	const [imageLoaded, setImageLoaded] = useState(false);

	const handleContextMenu = useCallback(
		(e: any) => {
			setImageURL(attachmentData?.url ?? '');
			setPositionShow(SHOW_POSITION.NONE);
			if (typeof onContextMenu === 'function') {
				onContextMenu((e || {}) as React.MouseEvent<HTMLImageElement>);
			}
		},
		[attachmentData?.url, onContextMenu, setImageURL, setPositionShow]
	);

	const loaderTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	useEffect(() => {
		loaderTimeoutRef.current = setTimeout(() => {
			if (!imageLoaded) {
				setShowLoader(true);
			}
		}, 500);

		return () => {
			if (loaderTimeoutRef.current) {
				clearTimeout(loaderTimeoutRef.current);
			}
		};
	}, [imageLoaded]);

	if (attachmentData.width && attachmentData.height) {
		const aspectRatio = attachmentData.width / attachmentData.height;

		if (height >= 275) {
			height = 275;
			width = height * aspectRatio;
		}

		if (width >= 550) {
			width = 550;
			height = width / aspectRatio;
		}
	}
	return (
		<div
			className="my-1"
			style={{
				height: size?.height,
				width: size?.width || 'auto'
			}}
		>
			<div style={{ height: 1, width: 1, opacity: 0 }}>.</div>
			{showLoader && !imageLoaded && (
				<div className="flex items-center justify-center bg-bgDarkPopover rounded h-full w-full" style={{ width: width || 150 }}></div>
			)}
			{imageLoaded && (
				<div className="flex" onClick={handleClick.bind(null, attachmentData.url || '')}>
					<div style={{ width: 1, opacity: 0 }}>.</div>
					<img
						draggable="false"
						onContextMenu={handleContextMenu}
						className={` flex object-cover object-left-top rounded cursor-pointer`}
						style={{ width: size?.width || 'auto', height: size?.height }}
						src={createImgproxyUrl(attachmentData.url ?? '', { width: size?.width, height: size?.height, resizeType: 'fit' })}
						alt={'message'}
					/>
				</div>
			)}
			{!imageLoaded && (
				<img
					loading="lazy"
					style={{ height: 0 }}
					src={attachmentData.url}
					alt={'message'}
					onLoad={() => {
						if (loaderTimeoutRef.current) {
							clearTimeout(loaderTimeoutRef.current);
						}
						setImageLoaded(true);
						setShowLoader(false);
					}}
				/>
			)}
		</div>
	);
});

export default MessageImage;
