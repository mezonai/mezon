import { ActionEmitEvent } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { galleryActions, useAppDispatch } from '@mezon/store-mobile';
import { notImplementForGifOrStickerSendFromPanel } from '@mezon/utils';
import type { ApiMessageAttachment } from 'mezon-js/api.gen';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { DeviceEventEmitter, View } from 'react-native';
import { ImageListModal } from '../../../../../components/ImageListModal';
import { checkFileTypeImage, checkFileTypeVideo, isImage, isVideo } from '../../../../../utils/helpers';
import { RenderDocumentsChat } from '../RenderDocumentsChat';
import { RenderImageChat } from '../RenderImageChat';
import { RenderVideoChat } from '../RenderVideoChat';
import { style } from './styles';

interface IProps {
	attachments: ApiMessageAttachment[];
	onLongPressImage?: (image?: ApiMessageAttachment) => void;
	clanId: string;
	channelId: string;
	messageCreatTime: number;
	senderId?: string;
}

const isSecureTenorUrl = (url: string | undefined): boolean => {
	if (!url) return false;
	try {
		const parsedUrl = new URL(url);
		const hostname = parsedUrl.hostname.toLowerCase();
		return hostname === 'tenor.com' || hostname.endsWith('.tenor.com');
	} catch {
		return false;
	}
};

const classifyAttachments = (attachments: ApiMessageAttachment[]) => {
	const videos: ApiMessageAttachment[] = [];
	const images: ApiMessageAttachment[] = [];
	const documents: ApiMessageAttachment[] = [];

	(attachments || [])?.forEach?.((attachment) => {
		if (attachment.filetype?.indexOf('video/mp4') !== -1 && !isSecureTenorUrl(attachment.url)) {
			videos.push(attachment);
		} else if (attachment.filetype?.includes('image/')) {
			images.push(attachment);
		} else {
			documents.push(attachment);
		}
	});

	return { videos, images, documents };
};

export const MessageAttachment = React.memo(({ attachments, onLongPressImage, clanId, channelId, messageCreatTime, senderId }: IProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const dispatch = useAppDispatch();
	const [videos, setVideos] = useState<ApiMessageAttachment[]>([]);
	const [images, setImages] = useState<ApiMessageAttachment[]>([]);
	const [documents, setDocuments] = useState<ApiMessageAttachment[]>([]);
	const visibleImages = useMemo(() => images?.slice(0, images?.length > 4 ? 3 : 4), [images]);
	const remainingImagesCount = useMemo(() => images?.length - visibleImages?.length || 0, [images, visibleImages]);

	useEffect(() => {
		const { videos, images, documents } = classifyAttachments(attachments ?? []);
		setVideos(videos);
		setImages(images);
		setDocuments(documents);
	}, [attachments]);

	const onPressImage = useCallback(
		async (image: any) => {
			const messageTimestamp = messageCreatTime || undefined;
			const beforeTimestamp = messageTimestamp ? messageTimestamp + 86400 : undefined;
			dispatch(
				galleryActions.fetchGalleryAttachments({
					clanId,
					channelId,
					limit: 20,
					mediaFilter: 'all',
					before: beforeTimestamp
				})
			);
			const data = {
				children: (
					<ImageListModal
						channelId={channelId}
						imageSelected={{
							...image,
							uploader: image?.uploader || senderId,
							clanId: image?.clanId || clanId,
							channelId: image?.channelId || channelId,
							create_time: image?.create_time || new Date(messageCreatTime * 1000).toISOString()
						}}
						disableGoback={true}
					/>
				)
			};
			DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
		},
		[channelId, clanId, dispatch, messageCreatTime, senderId]
	);

	const hasMultipleMedia = useMemo(() => {
		return videos?.length > 0 && visibleImages?.length > 0;
	}, [videos?.length, visibleImages?.length]);

	const renderDocuments = () => {
		return documents.map((document, index) => {
			if (!document?.url) {
				return null;
			}

			const isShowImage = checkFileTypeImage(document?.filetype);
			const checkImage = notImplementForGifOrStickerSendFromPanel(document);
			const checkIsImage = isImage(document?.url || '');
			if (isShowImage || checkIsImage || checkIsImage) {
				return (
					<RenderImageChat
						disable={checkImage}
						image={document}
						key={`${document?.url}_${index}`}
						onPress={onPressImage}
						onLongPress={onLongPressImage}
					/>
				);
			}
			const checkIsVideo = isVideo(document?.url?.toLowerCase()) || checkFileTypeVideo(document?.filetype);

			if (checkIsVideo) {
				return (
					<RenderVideoChat
						key={`${document?.url}_${index}`}
						videoURL={document.url}
						onLongPress={() => onLongPressImage(document)}
						thumbnailPreview={document?.thumbnail}
					/>
				);
			}

			return (
				<RenderDocumentsChat
					key={`${document?.url}_${index}`}
					document={document}
					onLongPress={onLongPressImage}
					onPressImage={onPressImage}
				/>
			);
		});
	};

	return (
		<View>
			<View style={[styles.gridContainer, hasMultipleMedia && { marginBottom: size.s_10 }]}>
				{videos?.length > 0 &&
					videos?.map((video, index) => (
						<RenderVideoChat
							key={`${video?.url}_${index}`}
							videoURL={video?.url}
							onLongPress={() => onLongPressImage(video)}
							isMultiple={videos?.length >= 2}
							thumbnailPreview={video?.thumbnail}
							widthThumbnail={video?.width}
							heightThumbnail={video?.height}
						/>
					))}
			</View>
			<View style={styles.gridContainer}>
				{visibleImages?.length > 0 &&
					visibleImages?.map((image, index) => {
						const checkImage = notImplementForGifOrStickerSendFromPanel(image);
						return (
							<RenderImageChat
								disable={checkImage}
								image={image}
								isMultiple={images?.length >= 2}
								key={`${image?.url}_${index}`}
								onPress={onPressImage}
								onLongPress={onLongPressImage}
							/>
						);
					})}
				{remainingImagesCount > 0 && (
					<View>
						<RenderImageChat
							isMultiple={images?.length >= 2}
							remainingImagesCount={remainingImagesCount}
							image={images[3]}
							onPress={onPressImage}
							onLongPress={onLongPressImage}
						/>
					</View>
				)}
			</View>

			{documents?.length > 0 && renderDocuments()}
		</View>
	);
});
