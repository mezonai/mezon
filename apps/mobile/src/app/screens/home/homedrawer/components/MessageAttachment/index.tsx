import { ActionEmitEvent } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import { notImplementForGifOrStickerSendFromPanel } from '@mezon/utils';
import { ApiMessageAttachment } from 'mezon-js/api.gen';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { DeviceEventEmitter, View } from 'react-native';
import { isImage, isVideo } from '../../../../../utils/helpers';
import { RenderDocumentsChat } from '../RenderDocumentsChat';
import { RenderImageChat } from '../RenderImageChat';
import { RenderVideoChat } from '../RenderVideoChat';
import { style } from './styles';

interface IProps {
	attachments: ApiMessageAttachment[];
	onLongPressImage?: () => void;
	senderId: string;
	createTime: string;
}
const classifyAttachments = (attachments: ApiMessageAttachment[]) => {
	const videos: ApiMessageAttachment[] = [];
	const images: ApiMessageAttachment[] = [];
	const documents: ApiMessageAttachment[] = [];

	attachments.forEach((attachment) => {
		if (attachment.filetype?.indexOf('video/mp4') !== -1 && !attachment.url?.includes('tenor.com')) {
			videos.push(attachment);
		} else if (attachment.filetype?.indexOf('image/png') !== -1 || attachment.filetype?.indexOf('image/jpeg') !== -1) {
			images.push(attachment);
		} else {
			documents.push(attachment);
		}
	});

	return { videos, images, documents };
};

export const MessageAttachment = React.memo(({ attachments, onLongPressImage, senderId, createTime }: IProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);

	const [videos, setVideos] = useState<ApiMessageAttachment[]>([]);
	const [images, setImages] = useState<ApiMessageAttachment[]>([]);
	const [documents, setDocuments] = useState<ApiMessageAttachment[]>([]);
	const visibleImages = useMemo(() => images?.slice(0, 3), [images]);
	const remainingImagesCount = images?.length - 3 || 0;
	useEffect(() => {
		const { videos, images, documents } = classifyAttachments(attachments ?? []);
		setVideos(videos);
		setImages(images);
		setDocuments(documents);
	}, [attachments]);

	const onPressImage = useCallback(
		(image: any) => {
			DeviceEventEmitter.emit(ActionEmitEvent.ON_OPEN_IMAGE_DETAIL_MESSAGE_ITEM, {
				...image,
				uploader: senderId,
				create_time: createTime
			});
		},
		[senderId, createTime]
	);

	const renderDocuments = () => {
		return documents.map((document, index) => {
			if (!document?.url) {
				return null;
			}
			const isShowImage = isImage(document?.url?.toLowerCase());
			const checkImage = notImplementForGifOrStickerSendFromPanel(document);
			if (isShowImage || checkImage) {
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
			const checkIsVideo = isVideo(document?.url?.toLowerCase());

			if (checkIsVideo) {
				return <RenderVideoChat key={`${document?.url}_${index}`} videoURL={document.url} onLongPress={onLongPressImage} />;
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
			{videos?.length > 0 &&
				videos.map((video, index) => <RenderVideoChat key={`${video?.url}_${index}`} videoURL={video?.url} onLongPress={onLongPressImage} />)}
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
