import { useAppParams, useAttachments } from '@mezon/core';
import { attachmentActions, checkListAttachmentExist, selectCurrentChannelId, selectCurrentClanId, useAppDispatch } from '@mezon/store';
import { SHOW_POSITION, notImplementForGifOrStickerSendFromPanel } from '@mezon/utils';
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
};

const MessageImage = memo(({ attachmentData, onContextMenu, mode, messageId }: MessageImage) => {
	const dispatch = useAppDispatch();
	const { setOpenModalAttachment, setAttachment } = useAttachments();
	const checkImage = notImplementForGifOrStickerSendFromPanel(attachmentData);
	const { setImageURL, setPositionShow } = useMessageContextMenu();
	const currentChannelId = useSelector(selectCurrentChannelId);
	const currentClanId = useSelector(selectCurrentClanId);
	const { directId: currentDmGroupId } = useAppParams();
	const [showLoader, setShowLoader] = useState(false);
	const fadeIn = useRef(false);
	const checkListAttachment = useSelector(checkListAttachmentExist((currentDmGroupId || currentChannelId) as string));

	const handleClick = (url: string) => {
		if (checkImage) return;

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

		if (((currentClanId && currentChannelId) || currentDmGroupId) && !checkListAttachment) {
			const clanId = currentDmGroupId ? '0' : (currentClanId as string);
			const channelId = (currentDmGroupId as string) || (currentChannelId as string);
			dispatch(attachmentActions.fetchChannelAttachments({ clanId, channelId }));
		}

		dispatch(attachmentActions.setMessageId(messageId));
	};

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
				fadeIn.current = true;
			}
		}, 500);

		return () => {
			if (loaderTimeoutRef.current) {
				clearTimeout(loaderTimeoutRef.current);
			}
		};
	}, [imageLoaded]);

	let width = attachmentData.width || 0;
	let height = attachmentData.height || 150;

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
				height,
				width: width || 'auto'
			}}
		>
			<div style={{ height: 1, width: 1, opacity: 0 }}>.</div>
			{showLoader && !imageLoaded && (
				<div className="flex items-center justify-center bg-bgDarkPopover rounded h-full w-full" style={{ width: width || 150 }}></div>
			)}
			{imageLoaded && (
				<div className="flex">
					<div style={{ width: 1, opacity: 0 }}>.</div>
					<img
						onContextMenu={handleContextMenu}
						className={` flex object-cover object-left-top rounded cursor-default ${fadeIn.current ? 'fade-in' : ''}`}
						style={{ width: width || 'auto', height }}
						src={attachmentData.url}
						alt={'message'}
						onClick={() => handleClick(attachmentData.url || '')}
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
