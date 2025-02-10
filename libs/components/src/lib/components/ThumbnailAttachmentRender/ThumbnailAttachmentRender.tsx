import { Icons } from '@mezon/ui';
import { SHOW_POSITION, fileTypeImage, fileTypeVideo } from '@mezon/utils';
import { ApiMessageAttachment } from 'mezon-js/api.gen';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useMessageContextMenu } from '../ContextMenu';
import { MessageAudioControl } from '../MessageWithUser/MessageAudio/MessageAudioControl';
import MessageVideo from '../MessageWithUser/MessageVideo';
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
		if (attachment.filetype === 'image/gif') {
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
				<div className={`w-35 h-32 flex flex-row justify-center items-center relative mt-[-10px]`}>
					<MessageVideo attachmentData={attachment} />
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

	const positionAndPadding = useMemo(() => {
		if (isFileList) {
			return `border-[2px] top-[10px] right-[3.5px] p-[5px] ${isPlaying ? '' : 'pr-[3px] pl-[7px]'}`;
		}
		return `border-[4px] top-[23px] right-[8px] p-[10px] ${isPlaying ? '' : 'pr-[8px] pl-[12px]'}`;
	}, [isFileList, isPlaying]);

	return (
		<div className="relative">
			<div onClick={(e) => handleTogglePlay(e)} className={`absolute border-gray-600 bg-gray-400 rounded-full ${positionAndPadding}`}>
				{isPlaying ? (
					<Icons.PauseButton className={isFileList ? 'w-3' : 'w-7'} />
				) : (
					<Icons.PlayButton className={isFileList ? 'w-3' : 'w-7'} />
				)}
			</div>
			<Icons.EmptyType defaultSize={size} />
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
