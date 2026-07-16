import { Icons } from '@mezon/ui';
import { EMimeTypes, SHOW_POSITION, createImgproxyUrl, fileTypeImage, fileTypeVideo } from '@mezon/utils';
import type { ApiMessageAttachment } from 'mezon-js';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useMessageContextMenu } from '../ContextMenu';
import { MessageAudioControl } from '../MessageWithUser/MessageAudio/MessageAudioControl';
import { typeFormats } from './TypeFormats';

export interface IRenderAttachmentThumbnailParam {
	attachment: ApiMessageAttachment;
	size?: string;
	pos?: string;
	isFileList?: boolean;
}

export const RenderAttachmentThumbnail = ({ attachment, size, pos, isFileList }: IRenderAttachmentThumbnailParam) => {
	const fileType = attachment.filetype;

	const renderIcon = typeFormats.find((typeFormat: any) => typeFormat.type === fileType);

	const hasFileImage = fileType && fileTypeImage.includes(fileType);

	const hasFileVideo = fileType && fileTypeVideo.includes(fileType);

	const isAudioFile = fileType && fileType.startsWith('audio');

	const { setPositionShow } = useMessageContextMenu();

	const handleContextMenu = useCallback(() => {
		if (attachment.filetype === EMimeTypes.sticker) {
			setPositionShow(SHOW_POSITION.IN_STICKER);
		}
	}, [attachment.filetype]);
	return (
		<div onContextMenu={handleContextMenu}>
			{isAudioFile && <AudioAttachment attachment={attachment} size={size} isFileList={isFileList} />}

			{hasFileImage && (
				<img
					key="image-thumbnail"
					src={attachment.url}
					role="presentation"
					className="w-[174px] aspect-square object-cover"
					alt={attachment.url}
				/>
			)}

			{hasFileVideo && (
				<div className="relative w-[174px] aspect-square overflow-hidden rounded-md bg-bgLightSecondary dark:bg-bgSecondary">
					{attachment.thumbnail && (
						<img
							src={
								attachment.thumbnail.startsWith('blob:')
									? attachment.thumbnail
									: createImgproxyUrl(attachment.thumbnail, { width: 174, height: 174, resizeType: 'fill' })
							}
							role="presentation"
							className="w-full h-full object-cover"
							alt=""
						/>
					)}
					<div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
						<div className="flex items-center justify-center w-10 h-10 rounded-full bg-black bg-opacity-50">
							<Icons.PlayButton className="w-5 h-5 text-white" />
						</div>
					</div>
				</div>
			)}

			{!isAudioFile && renderIcon && <renderIcon.icon defaultSize={size} />}

			{!hasFileImage && !hasFileVideo && !renderIcon && !isAudioFile && <Icons.EmptyType defaultSize={size} />}
		</div>
	);
};

interface IAudioAttachmentProps {
	attachment: ApiMessageAttachment;
	size?: string;
	isFileList?: boolean;
}

export const AudioAttachment = ({ attachment, size, isFileList }: IAudioAttachmentProps) => {
	const [isPlaying, setIsPlaying] = useState(false);
	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState<number>(0);
	const audioControlRef = useRef<{ togglePlay: () => void }>(null);

	const handleTogglePlay = (e: React.MouseEvent<HTMLDivElement>) => {
		e.stopPropagation();
		if (audioControlRef.current) {
			audioControlRef.current.togglePlay();
		}
	};

	const overlayStyle = useMemo(() => {
		if (isFileList) {
			return { container: 'w-5 h-5', icon: 'w-2 h-2' };
		}
		return { container: 'w-12 h-12', icon: 'w-5 h-5' };
	}, [isFileList]);

	return (
		<div className="relative inline-flex items-center justify-center group">
			<Icons.EmptyType defaultSize={size} />
			<div
				onClick={(e) => handleTogglePlay(e)}
				className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/40 group-hover:bg-black/60 text-white rounded-full flex items-center justify-center cursor-pointer transition-all ${overlayStyle.container}`}
			>
				{isPlaying ? (
					<Icons.PauseButton className={overlayStyle.icon} />
				) : (
					<Icons.PlayButton className={`${overlayStyle.icon} ml-0.5`} />
				)}
			</div>
			<MessageAudioControl
				ref={audioControlRef}
				audioUrl={attachment.url || ''}
				setDuration={setDuration}
				setCurrentTime={setCurrentTime}
				setIsPlaying={setIsPlaying}
				isPlaying={isPlaying}
			/>
		</div>
	);
};
